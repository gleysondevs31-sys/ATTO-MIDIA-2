import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import crypto from "crypto";
import tiktok from "@tobyg74/tiktok-api-dl";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { pool, bootstrapDatabase } from "./src/db.ts";
import ytSearch from "yt-search";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Prevent server crashes and console pollution from third-party library (tiktok-api-dl)
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Retry attempt') && args.join(' ').includes('Empty response')) {
    // Silenced expected tiktok-api-dl timeout/empty response error during maintenance
    return;
  }
  originalConsoleError(...args);
};

process.on("unhandledRejection", (reason: any, promise) => {
  if (reason && reason.message && reason.message.includes("Empty response")) {
    // Silenced expected tiktok-api-dl timeout/empty response error during maintenance
    return;
  }
  // Silenced to prevent console pollution during API maintenance
  // console.error("[Unhandled Rejection] (Caught to prevent crash):", reason);
});

process.on("uncaughtException", (error) => {
  // Silenced to prevent console pollution during API maintenance
  // console.error("[Uncaught Exception] (Caught to prevent crash):", error);
});

// Set up local media cache directory
const CACHE_DIR = path.join(process.cwd(), "atto_cache");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Map to coalese active downloads and prevent overlapping requests for the same media url
const activeDownloads = new Map<string, Promise<{ filePath: string; contentType: string }>>();

async function getOrDownloadMedia(rawMediaUrl: string, isYtProxy = false): Promise<{ filePath: string; contentType: string }> {
  const mediaUrl = cleanUrl(rawMediaUrl);
  const hash = crypto.createHash("sha256").update(mediaUrl).digest("hex");
  const filePath = path.join(CACHE_DIR, hash);
  const metaPath = path.join(CACHE_DIR, `${hash}.json`);

  // Verify if cache files already exist and have valid size
  if (fs.existsSync(filePath) && fs.existsSync(metaPath)) {
    try {
      const stats = fs.statSync(filePath);
      // We require at least 25KB to be a valid file stream (avoiding empty errors or miniature error HTMLs)
      if (stats.size > 25000) {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        console.log(`[Atto Cache Hit] Serving ${hash} from disk cache. Size: ${stats.size} bytes`);
        return { filePath, contentType: meta.contentType || "application/octet-stream" };
      } else {
        // Unlink potentially corrupt or error files
        try { fs.unlinkSync(filePath); } catch {}
        try { fs.unlinkSync(metaPath); } catch {}
      }
    } catch (e) {
      console.error("[Atto Cache read/validate error]", e);
    }
  }

  // If there's an active download for this hash, wait for it
  if (activeDownloads.has(hash)) {
    console.log(`[Atto Cache Coalesce] Waiting for active download: ${hash}`);
    return activeDownloads.get(hash)!;
  }

  const downloadPromise = (async () => {
    console.log(`[Atto Cache Miss] Downloading and caching: ${mediaUrl} to ${hash}`);
    
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    };

    if (mediaUrl.includes("tiktok.com")) {
      headers["Referer"] = "https://www.tiktok.com/";
    } else if (mediaUrl.includes("instagram.com")) {
      headers["Referer"] = "https://www.instagram.com/";
    }

    const response = await fetch(mediaUrl, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch media from source. HTTP status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const fileStream = fs.createWriteStream(filePath);
    
    if (response.body) {
      if (typeof (response.body as any).getReader === "function") {
        const reader = (response.body as any).getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fileStream.write(value);
        }
      } else {
        for await (const chunk of response.body as any) {
          fileStream.write(chunk);
        }
      }
    }
    
    await new Promise<void>((resolve, reject) => {
      fileStream.end((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const stats = fs.statSync(filePath);
    // Sanity check
    const minRequiredSize = isYtProxy ? 10000 : 20000;
    if (stats.size < minRequiredSize) {
      try { fs.unlinkSync(filePath); } catch {}
      throw new Error(`Downloaded file is too small (${stats.size} bytes), likely a blocked error page.`);
    }

    // Save metadata
    fs.writeFileSync(metaPath, JSON.stringify({ contentType, url: mediaUrl, timestamp: Date.now() }), "utf-8");
    console.log(`[Atto Cache Done] Caching completed: ${hash}. Size: ${stats.size} bytes`);

    return { filePath, contentType };
  })();

  activeDownloads.set(hash, downloadPromise);

  try {
    const result = await downloadPromise;
    return result;
  } finally {
    activeDownloads.delete(hash);
  }
}

function cleanUrl(url: string): string {
  if (!url || typeof url !== "string") return url;
  let cleaned = url.trim();
  if (cleaned.includes("google.com/url?")) {
    try {
      const parsed = new URL(cleaned);
      const q = parsed.searchParams.get("q") || parsed.searchParams.get("url");
      if (q) {
        cleaned = q;
      }
    } catch (e) {
      // ignore
    }
  }
  return cleaned;
}

// Zero Two Configs - Protect API Key strictly using either API_KEY or ZERO_TWO_API_KEY environment variables
const API_KEY = process.env.API_KEY || process.env.ZERO_TWO_API_KEY || "onnx-ia-key";
const API_BASE_URL = cleanUrl(process.env.ZERO_TWO_API_BASE_URL || "https://zero-two-apis.com.br");
const YT_API_BASE_URL = cleanUrl(process.env.YT_API_BASE_URL || "https://yt-api.zero-two-apis.com.br");

app.use(express.json());

// In-memory rate limiting middleware for IP-based API protection
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = (req.ip || req.headers['x-forwarded-for'] || 'unknown') as string;
  const now = Date.now();
  const limit = 60; // Max 60 requests per minute
  const windowMs = 60 * 1000;

  const record = rateLimitCache.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitCache.set(ip, { count: 1, resetTime: now + windowMs });
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", limit - 1);
    res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));
    return next();
  }

  if (record.count >= limit) {
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", 0);
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));
    res.setHeader("Retry-After", Math.ceil((record.resetTime - now) / 1000));
    return res.status(429).json({
      status: false,
      error: "Muitas requisições. Por favor, tente novamente mais tarde.",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
    });
  }

  record.count++;
  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", limit - record.count);
  res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));
  next();
}

// Apply rate limiter to all api routes
app.use("/api/", rateLimiter);

// Get platform configuration from PostgreSQL
async function getPlatformConfig(platformKey: string) {
  try {
    const res = await pool.query("SELECT * FROM platforms_config WHERE platform_key = $1", [platformKey.toLowerCase().trim()]);
    if (res.rows.length > 0) {
      return res.rows[0];
    }
  } catch (err: any) {
    console.warn(`[Config Check] Failed to read db configuration for platform '${platformKey}':`, err.message);
  }
  return null;
}

// Helper function to check if a request involves YouTube platform or a YouTube media URL/query
function isYoutubeRequest(platformKey: string, endpoint: string, params?: Record<string, string>): boolean {
  if (platformKey.toLowerCase().trim() === "youtube") return true;
  if (endpoint.toLowerCase().includes("yt")) return true;
  if (!params) return false;
  for (const value of Object.values(params)) {
    if (typeof value === "string") {
      const valLower = value.toLowerCase();
      if (valLower.includes("youtube.com") || valLower.includes("youtu.be") || valLower.includes("youtube") || valLower.includes("ytvideo") || valLower.includes("ytaudio")) {
        return true;
      }
    }
  }
  return false;
}

// Fetch from a specific platform using its configured primary/fallback URLs and credentials
async function fetchFromPlatform(platformKey: string, defaultEndpoint: string, params: Record<string, string>) {
  const config = await getPlatformConfig(platformKey);
  const isEnabled = config ? config.is_enabled : true;
  
  if (!isEnabled) {
    throw new Error(`A plataforma '${platformKey}' está desativada nas configurações do sistema.`);
  }

  // Determine primary and fallback URLs, and API key
  let primaryBase = config?.primary_api_url || API_BASE_URL;
  let fallbackBase = config?.fallback_api_url || null;
  const customKey = config?.api_key_override || API_KEY;

  const isYtReq = isYoutubeRequest(platformKey, defaultEndpoint, params);

  // Ensure YouTube platform or YouTube media requests 100% route to the fast robust YouTube API base URL
  if (isYtReq) {
    if (primaryBase === API_BASE_URL || primaryBase.startsWith("/")) {
      primaryBase = YT_API_BASE_URL;
    }
    if (!fallbackBase || fallbackBase === API_BASE_URL) {
      fallbackBase = YT_API_BASE_URL;
    }
  }

  const runFetch = async (baseUrl: string) => {
    let url: string;
    const queryParams = new URLSearchParams({ ...params, apikey: customKey }).toString();

    // Clean slash combination to prevent double slashes
    if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
      const separator = baseUrl.includes("?") ? "&" : "?";
      if (baseUrl.includes("/api/") || baseUrl.includes("/download")) {
        url = `${baseUrl}${separator}${queryParams}`;
      } else {
        const pathPart = defaultEndpoint.startsWith("/") ? defaultEndpoint : `/${defaultEndpoint}`;
        const baseClean = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
        url = `${baseClean}${pathPart}?${queryParams}`;
      }
    } else {
      // Relative or local route, e.g. /api/media/yt-download
      const selectedBase = isYtReq ? YT_API_BASE_URL : API_BASE_URL;
      const baseClean = selectedBase.endsWith("/") ? selectedBase.slice(0, -1) : selectedBase;
      const pathPart = baseUrl.startsWith("/") ? baseUrl : `/${baseUrl}`;
      url = `${baseClean}${pathPart}?${queryParams}`;
    }

    const loggedUrl = url.replace(customKey, "HIDDEN_KEY");
    console.log(`[Dynamic Route] Fetching '${platformKey}' from: ${loggedUrl}`);

    const response = await fetch(url);
    if (response.status === 429) {
      const err: any = new Error(`Limite de taxa excedido na API upstream para ${platformKey}.`);
      err.statusCode = 429;
      throw err;
    }

    if (!response.ok) {
      throw new Error(`A API da plataforma respondeu com status ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      const text = await response.text();
      console.warn(`[Dynamic Route] Unexpected content type: ${contentType}. Content: ${text.substring(0, 100)}...`);
      throw new Error(`Invalid response format from API: Expected JSON but received ${contentType}`);
    }
  };

  try {
    return await runFetch(primaryBase);
  } catch (primaryErr: any) {
    if (!primaryErr.message.includes("fetch failed") && !primaryErr.message.includes("Unexpected content type")) {
      console.warn(`[Dynamic Route] Primary route failed for '${platformKey}':`, primaryErr.message);
    }
    if (fallbackBase) {
      if (!primaryErr.message.includes("fetch failed")) {
         console.log(`[Dynamic Route] Falling back for '${platformKey}' to: ${fallbackBase}`);
      }
      try {
        return await runFetch(fallbackBase);
      } catch (fallbackErr: any) {
        if (!fallbackErr.message.includes("fetch failed") && !fallbackErr.message.includes("Unexpected content type")) {
          console.error(`[Dynamic Route] Fallback route also failed for '${platformKey}':`, fallbackErr.message);
        }
        throw fallbackErr;
      }
    }
    throw primaryErr;
  }
}

// Helper function to fetch from Zero Two API with key & handle rate limit/errors robustly
async function fetchFromZeroTwo(endpoint: string, params: Record<string, string>) {
  const queryParams = new URLSearchParams({ ...params, apikey: API_KEY }).toString();
  
  // Decide which API base to use (Robust YT API vs Main Zero Two API)
  const isYoutube = isYoutubeRequest("", endpoint, params);
  const selectedBase = isYoutube ? YT_API_BASE_URL : API_BASE_URL;
  
  // Clean slash combination to prevent 404 double slash issues on API gateway
  const base = selectedBase.endsWith("/") ? selectedBase.slice(0, -1) : selectedBase;
  const pathPart = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${base}${pathPart}?${queryParams}`;
  
  // Clean logs for production, hiding the sensitive API Key
  const loggedUrl = `${base}${pathPart}?${queryParams.replace(API_KEY, "HIDDEN_KEY")}`;
  console.log(`[ZeroTwo Proxy] Fetching: ${loggedUrl}`);
  
  try {
    const response = await fetch(url);
    
    if (response.status === 429) {
      const err: any = new Error("Limite de taxa excedido na API upstream da Zero Two.");
      err.statusCode = 429;
      err.retryAfter = response.headers.get("retry-after") || "60";
      throw err;
    }

    if (!response.ok) {
      const err: any = new Error(`A API Zero Two respondeu com status ${response.status}`);
      err.statusCode = response.status;
      throw err;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      const text = await response.text();
      console.warn(`[ZeroTwo Proxy] Unexpected content type: ${contentType}. Content: ${text.substring(0, 100)}...`);
      throw new Error(`Invalid response format from API: Expected JSON but received ${contentType}`);
    }
  } catch (error: any) {
    if (!error.message.includes("fetch failed") && !error.message.includes("Unexpected content type")) {
      console.error(`[ZeroTwo Error] Failure calling ${endpoint}:`, error.message);
    }
    throw error;
  }
}

// Helper for formatting soundcloud millisecond durations
function formatMillis(ms: number): string {
  if (!ms) return "";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// Fetch YouTube video metadata via the high-speed /info endpoint
async function fetchYouTubeInfo(rawUrl: string): Promise<any | null> {
  const url = cleanUrl(rawUrl);
  const base = YT_API_BASE_URL.endsWith("/") ? YT_API_BASE_URL.slice(0, -1) : YT_API_BASE_URL;
  const infoUrl = `${base}/info?url=${encodeURIComponent(url)}&apikey=${API_KEY}`;
  
  try {
    console.log(`[YouTube Info] Fetching metadata for: ${url}`);
    const res = await fetch(infoUrl);
    if (!res.ok) {
      throw new Error(`YouTube /info API responded with status ${res.status}`);
    }
    
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
       throw new Error(`Invalid content type from YouTube info: ${contentType}`);
    }
    const data = await res.json();
    
    // Support either flat info or a nested "resultado" / "result" structure
    const info = data.resultado || data.result || data;
    
    let videoId = info.id || info.videoId || "";
    if (!videoId && url.includes("v=")) {
      videoId = url.split("v=")[1]?.split("&")[0];
    } else if (!videoId && url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    }

    let title = info.title || "YouTube Video";
    let author = info.author || info.channel || info.channelTitle || info.uploader || "YouTube Creator";
    if (typeof author === "object" && author.name) author = author.name;

    let thumbnail = info.thumbnail || info.image || "";
    if (typeof thumbnail === "object" && thumbnail.url) thumbnail = thumbnail.url;
    if (!thumbnail && Array.isArray(info.thumbnails) && info.thumbnails.length > 0) {
      thumbnail = typeof info.thumbnails[0] === "string" ? info.thumbnails[0] : info.thumbnails[0].url;
    }
    if (!thumbnail && videoId) {
      thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }

    const duration = info.duration || info.duration_raw || info.timestamp || info.length || "";
    const description = info.description || info.shortDescription || info.desc || "";

    return {
      id: videoId || crypto.createHash("md5").update(url).digest("hex"),
      title,
      author,
      thumbnail: thumbnail || "https://img.freepik.com/premium-vector/youtube-logo_578229-282.jpg",
      duration,
      description,
      originalUrl: url,
      type: "video" as const,
      playableVideoUrl: `/api/media/yt-download?type=video&url=${encodeURIComponent(url)}`,
      playableAudioUrl: `/api/media/yt-download?type=audio&url=${encodeURIComponent(url)}`,
      embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : null,
      raw: data
    };
  } catch (err: any) {
    console.error("[YouTube Info] Error fetching YouTube info from API:", err.message);
    return null;
  }
}

// YouTube search helper that uses yt-search package first to reduce API dependency
async function searchYouTube(query: string): Promise<any[]> {
  // 1. Official yt-search package (Preferred to reduce API dependency)
  try {
    const r = await ytSearch(query);
    if (r && Array.isArray(r.videos) && r.videos.length > 0) {
      const mapped = r.videos.map((item: any) => {
        const id = item.videoId;
        const title = item.title || "";
        const author = item.author?.name || "YouTube Creator";
        const thumbnail = item.thumbnail || item.image || "";
        const duration = item.timestamp || item.duration?.timestamp || "";
        const description = item.description || "";
        const url = item.url || `https://www.youtube.com/watch?v=${id}`;

        return {
          id,
          title,
          author,
          thumbnail,
          duration,
          description,
          url
        };
      }).filter(item => item.id);

      if (mapped.length > 0) {
        return mapped;
      }
    }
  } catch (error: any) {
    // Silenced console.error to avoid polluting the console during maintenance
  }

  // 2. Native high-reliability YouTube scraper
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
      }
    });
    const html = await response.text();
    const regex = /ytInitialData\s*=\s*({.+?});/;
    const match = html.match(regex);
    if (!match) return [];
    
    const data = JSON.parse(match[1]);
    const sectionList = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!sectionList) return [];
    
    const itemSection = sectionList.find((c: any) => c.itemSectionRenderer);
    const contents = itemSection?.itemSectionRenderer?.contents;
    if (!contents) return [];
    
    const results: any[] = [];
    for (const item of contents) {
      if (item.videoRenderer) {
        const video = item.videoRenderer;
        const videoId = video.videoId;
        const title = video.title?.runs?.[0]?.text;
        const author = video.ownerText?.runs?.[0]?.text || "YouTube Creator";
        const thumbnail = video.thumbnail?.thumbnails?.[0]?.url;
        const duration = video.lengthText?.simpleText || "";
        const description = video.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join("") || "";
        
        if (videoId) {
          results.push({
            id: videoId,
            title,
            author,
            thumbnail,
            duration,
            description,
            url: `https://www.youtube.com/watch?v=${videoId}`
          });
        }
      }
    }
    
    if (results.length > 0) {
      return results;
    }
  } catch (err: any) {
    // Silenced console.error
  }

  // 3. Fallback to API if all else fails
  const base = YT_API_BASE_URL.endsWith("/") ? YT_API_BASE_URL.slice(0, -1) : YT_API_BASE_URL;
  const searchUrl = `${base}/api/ytsrc/videos?q=${encodeURIComponent(query)}&apikey=${API_KEY}`;
  
  try {
    const res = await fetch(searchUrl);
    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        let rawItems: any[] = [];
        if (Array.isArray(data)) rawItems = data;
        else if (data && Array.isArray(data.resultado)) rawItems = data.resultado;
        else if (data && Array.isArray(data.results)) rawItems = data.results;
        else if (data && Array.isArray(data.data)) rawItems = data.data;
        else if (data && Array.isArray(data.videos)) rawItems = data.videos;

        if (rawItems.length > 0) {
          return rawItems.map((item: any) => {
            let id = item.id?.videoId || item.videoId || item.id || "";
            let url = item.url || item.link || (id ? `https://www.youtube.com/watch?v=${id}` : "");
            return {
              id,
              title: item.title || "",
              author: item.author?.name || item.author || item.channel || "YouTube Creator",
              thumbnail: item.image || item.thumbnails?.[0]?.url || item.thumbnail || "",
              duration: item.duration_raw || item.duration || item.timestamp || "",
              description: item.description || item.desc || "",
              url
            };
          }).filter((item: any) => item.id);
        }
      }
    }
  } catch (error: any) {
    // Silenced console.error
  }
  
  return [];
}

// Helper function to query DuckDuckGo for TikTok URLs based on a query
async function searchTikTokUrls(query: string): Promise<string[]> {
  const url = `https://html.duckduckgo.com/html/?q=site:tiktok.com+${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Ch-Ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"",
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": "\"Windows\"",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
      }
    });
    if (!res.ok) {
      throw new Error(`DuckDuckGo responded with status ${res.status}`);
    }
    const html = await res.text();
    
    const regex = /uddg=([^"&'\s]+)/g;
    let match;
    const urls: string[] = [];
    while ((match = regex.exec(html)) !== null) {
      try {
        const decoded = decodeURIComponent(match[1]);
        // Filter out search, tag, discover, and non-video pages, keep actual video posts
        const lowerDecoded = decoded.toLowerCase();
        const isValidVideo = lowerDecoded.includes("/video/") || lowerDecoded.includes("/v/") || /vm\.tiktok\.com\/\w+/.test(lowerDecoded);
        if (decoded.includes("tiktok.com/") && isValidVideo && !lowerDecoded.includes("/search") && !lowerDecoded.includes("/tag/") && !lowerDecoded.includes("/discover/")) {
          urls.push(decoded);
        }
      } catch {}
    }
    
    return Array.from(new Set(urls)).slice(0, 10);
  } catch (e: any) {
    if (!e.message.includes("status 500") && !e.message.includes("status 503") && !e.message.includes("status 403") && !e.message.includes("status 202")) {
      console.error("[searchTikTokUrls error]:", e.message);
    }
    return [];
  }
}

// Helper function to query Yahoo Search for TikTok video URLs based on a query
async function searchTikTokYahoo(query: string): Promise<string[]> {
  const url = `https://search.yahoo.com/search?p=site:tiktok.com+${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    if (!res.ok) {
      throw new Error(`Yahoo responded with status ${res.status}`);
    }
    const html = await res.text();
    const urls: string[] = [];
    
    // Yahoo URLs are usually inside RU=https%3a%2f%2fwww.tiktok.com%2f...
    const regex = /RU=([^/&]+)/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      try {
        const decoded = decodeURIComponent(match[1]);
        if (decoded.includes("tiktok.com/") && decoded.includes("/video/")) {
          urls.push(decoded);
        }
      } catch {}
    }
    
    // Also look for direct links in the HTML
    const directRegex = /href="https?:\/\/(www\.)?tiktok\.com\/([^"\s>]+)"/g;
    while ((match = directRegex.exec(html)) !== null) {
      const fullUrl = `https://www.tiktok.com/${match[2]}`.split(/[?"'\s<>]/)[0];
      if (fullUrl.includes("/video/")) {
        urls.push(fullUrl);
      }
    }
    
    return Array.from(new Set(urls)).slice(0, 10);
  } catch (e: any) {
    if (!e.message.includes("status 500") && !e.message.includes("status 503")) {
      console.error("[searchTikTokYahoo error]:", e.message);
    }
    return [];
  }
}

// Fetch details for a specific TikTok URL with failover across multiple endpoints
async function fetchTikTokDetails(url: string): Promise<any | null> {
  const lowerUrl = url.toLowerCase();
  const isVideo = lowerUrl.includes("/video/") || lowerUrl.includes("/v/") || lowerUrl.includes("vm.tiktok.com");
  if (!isVideo) {
    console.warn(`[TikTok Detail Fetch] Skipping non-video TikTok URL: ${url}`);
    return null;
  }

  // 1. Try TobyG74 tiktok-api-dl (v3 MusicalDown) first
  try {
    const dlRes = await tiktok.Downloader(url, { version: "v3" });
    if (dlRes && dlRes.status === "success" && dlRes.result) {
      const item = dlRes.result;
      return {
        title: item.desc || "TikTok Video",
        author: (item.author as any)?.nickname || (item.author as any)?.uniqueId || "TikTok User",
        thumbnail: item.author?.avatar || "https://img.freepik.com/premium-vector/tik-tok-logo_578229-290.jpg",
        playableVideoUrl: item.videoHD || item.videoSD || item.videoWatermark || null,
        playableAudioUrl: item.music || null,
        originalUrl: url,
        raw: item
      };
    }
  } catch (err: any) {
    console.warn(`[TikTok Detail Fetch] TobyG74 v3 failed for ${url}:`, err.message);
  }

  // 2. Try TobyG74 tiktok-api-dl (v2 SSSTik)
  try {
    const dlRes = await tiktok.Downloader(url, { version: "v2" });
    if (dlRes && dlRes.status === "success" && dlRes.result) {
      const item = dlRes.result;
      return {
        title: item.desc || "TikTok Video",
        author: (item.author as any)?.nickname || (item.author as any)?.uniqueId || "TikTok User",
        thumbnail: item.author?.avatar || "https://img.freepik.com/premium-vector/tik-tok-logo_578229-290.jpg",
        playableVideoUrl: item.video?.playAddr?.[0] || null,
        playableAudioUrl: item.music?.playUrl?.[0] || null,
        originalUrl: url,
        raw: item
      };
    }
  } catch (err: any) {
    console.warn(`[TikTok Detail Fetch] TobyG74 v2 failed for ${url}:`, err.message);
  }

  // No fallbacks to Zero Two for TikTok anymore
  return null;
}

// ==========================================
// API ROUTE 1: GET /api/search?q=&platform=
// ==========================================
app.get("/api/search", async (req, res) => {
  const query = req.query.q as string;
  const platform = (req.query.platform as string || "all").toLowerCase();

  if (!query) {
    return res.status(400).json({ 
      status: false, 
      error: "O parâmetro de busca 'q' é obrigatório.",
      code: "MISSING_SEARCH_QUERY"
    });
  }

  try {
    const results: any[] = [];

    // 1. YouTube Search (Native Scraper - Super reliable and fast)
    if (platform === "youtube" || platform === "all") {
      try {
        const ytItems = await searchYouTube(query);
        results.push(
          ...ytItems.map((item: any) => ({
            id: `yt-${item.id}`,
            platform: "youtube",
            title: item.title || "YouTube Video",
            author: item.author || "YouTube Creator",
            thumbnail: item.thumbnail || "https://img.freepik.com/premium-vector/youtube-logo_578229-282.jpg",
            duration: item.duration,
            description: item.description || "Sem descrição disponível.",
            originalUrl: item.url,
            playableVideoUrl: `/api/media/yt-download?type=video&url=${encodeURIComponent(item.url)}`,
            playableAudioUrl: `/api/media/yt-download?type=audio&url=${encodeURIComponent(item.url)}`,
            type: "video" as const,
            raw: item
          }))
        );
      } catch (err: any) {
        console.error("Error searching YouTube:", err.message);
      }
    }

    // 2. Soundcloud Search
    if (platform === "soundcloud" || platform === "all") {
      try {
        const scData = await fetchFromPlatform("soundcloud", "/api/soundcloud/search", { query });
        if (scData && scData.status && Array.isArray(scData.resultado)) {
          results.push(
            ...scData.resultado.map((item: any) => ({
              id: `sc-${item.id}`,
              platform: "soundcloud",
              title: item.title,
              author: item.user?.username || "Soundcloud Artist",
              thumbnail: item.artwork_url || item.user?.avatar_url || "https://img.freepik.com/premium-vector/soundcloud-logo_578229-284.jpg",
              duration: formatMillis(item.duration),
              description: item.description || `Gênero: ${item.genre || "N/A"}`,
              originalUrl: item.permalink_url,
              playableAudioUrl: item._media?.transcodings?.[0]?.url || null,
              playableVideoUrl: null,
              type: "audio" as const,
              raw: item
            }))
          );
        }
      } catch (err: any) {
        if (!err.message.includes("fetch failed") && !err.message.includes("Unexpected content type")) {
          console.error("Error searching Soundcloud:", err.message);
        }
      }
    }

    // 3. Spotify Search
    if (platform === "spotify" || platform === "all") {
      try {
        const spotData = await fetchFromPlatform("spotify", "/api/spotify/search", { q: query, type: "track", limit: "15" });
        if (spotData && spotData.status && Array.isArray(spotData.resultado)) {
          results.push(
            ...spotData.resultado.map((item: any) => ({
              id: `spot-${item.url?.split("/").pop() || Math.random().toString()}`,
              platform: "spotify",
              title: item.name,
              author: item.trackArtist || "Spotify Artist",
              thumbnail: item.album?.images?.[0] || "https://img.freepik.com/premium-vector/spotify-logo_578229-283.jpg",
              duration: item.duration,
              description: `Álbum: ${item.album?.name || "N/A"} | Lançamento: ${item.album?.releaseDate || "N/A"}`,
              originalUrl: item.url,
              playableAudioUrl: null, // Will match soundcloud streaming on demand or details call
              playableVideoUrl: null,
              type: "audio" as const,
              raw: item
            }))
          );
        }
      } catch (err: any) {
        if (!err.message.includes("fetch failed") && !err.message.includes("Unexpected content type")) {
          console.error("Error searching Spotify:", err.message);
        }
      }
    }

    // 4. TikTok Search (Enhanced: layered search with Yahoo, DDG, and Username variation fallback)
    if (platform === "tiktok" || platform === "all") {
      try {
        const seenVideos = new Set<string>();
        let tURLs = await searchTikTokYahoo(query);
        console.log(`[TikTok Search] Found ${tURLs.length} URLs from Yahoo for query: ${query}`);
        
        if (tURLs.length === 0) {
          tURLs = await searchTikTokUrls(query);
          console.log(`[TikTok Search] Found ${tURLs.length} URLs from DDG for query: ${query}`);
        }
        
        if (tURLs.length > 0) {
          // Fetch details for up to 8 unique URLs in parallel
          const detailPromises = tURLs.slice(0, 8).map(url => fetchTikTokDetails(url));
          const details = await Promise.all(detailPromises);
          
          for (let i = 0; i < details.length; i++) {
            const item = details[i];
            if (item) {
              const videoId = item.playableVideoUrl || item.originalUrl;
              if (seenVideos.has(videoId)) continue;
              seenVideos.add(videoId);
              
              results.push({
                id: `tt-${crypto.createHash("md5").update(item.originalUrl).digest("hex")}`,
                platform: "tiktok",
                title: item.title,
                author: item.author,
                thumbnail: item.thumbnail,
                duration: "",
                description: item.title,
                originalUrl: item.originalUrl,
                playableAudioUrl: item.playableAudioUrl,
                playableVideoUrl: item.playableVideoUrl,
                type: "video" as const,
                raw: item.raw
              });
            }
          }
        }

        // Fallback to username variations if search yielded 0 results
        if (results.filter(r => r.platform === "tiktok").length === 0) {
          console.log("[TikTok Search] Direct search yielded 0 results. Running username search fallback...");
          const cleanQuery = query.toLowerCase().trim().replace(/\s+/g, "_");
          const spacelessQuery = query.toLowerCase().trim().replace(/\s+/g, "");
          
          const variations = [
            cleanQuery,
            spacelessQuery,
            `${cleanQuery}_music`,
            `${cleanQuery}_oficial`,
            `${cleanQuery}_funk`
          ].filter((v, idx, self) => self.indexOf(v) === idx && v.length > 0);
          
          const promises = variations.map(v => 
            tiktok.GetUserPosts(v, { postLimit: 5 }).catch(() => null)
          );
          
          const responses = await Promise.all(promises);
          for (const ttData of responses) {
            if (ttData && ttData.status === "success" && ttData.result) {
              for (const item of ttData.result) {
                const videoId = item.id;
                if (!videoId || seenVideos.has(videoId)) continue;
                seenVideos.add(videoId);
                
                results.push({
                  id: `tt-${item.author?.username || Math.random().toString()}-${item.id || Math.random().toString()}`,
                  platform: "tiktok",
                  title: item.desc || "TikTok Video",
                  author: item.author?.nickname || item.author?.username || "TikTok User",
                  thumbnail: item.video?.cover || item.video?.originCover || "https://img.freepik.com/premium-vector/tik-tok-logo_578229-290.jpg",
                  duration: "",
                  description: item.desc || "TikTok Post",
                  originalUrl: item.author?.username ? `https://www.tiktok.com/@${item.author.username}/video/${item.id}` : "https://www.tiktok.com",
                  playableAudioUrl: item.music?.playUrl || null,
                  playableVideoUrl: item.video?.playAddr || item.video?.downloadAddr || null,
                  type: "video" as const,
                  raw: item
                });
              }
            }
          }
        }
      } catch (err: any) {
        console.error("Error searching TikTok:", err.message);
      }
    }

    res.json({ status: true, results });
  } catch (error: any) {
    console.error("Search API generic error:", error);
    res.status(error.statusCode || 500).json({ 
      status: false,
      error: "Falha na busca de mídia", 
      details: error.message,
      code: "SEARCH_FAILED"
    });
  }
});

// ==========================================
// API ROUTE 2: GET /api/media/details?platform=&id=
// ==========================================
app.get("/api/media/details", async (req, res) => {
  const platform = (req.query.platform as string || "").toLowerCase();
  const id = req.query.id as string;

  if (!id || !platform) {
    return res.status(400).json({
      status: false,
      error: "Os parâmetros 'platform' e 'id' são obrigatórios.",
      code: "MISSING_PARAMETERS"
    });
  }

  try {
    let details: any = null;

    if (platform === "soundcloud") {
      try {
        const scData = await fetchFromPlatform("soundcloud", "/api/soundcloud/search", { query: id });
        if (scData && scData.status && Array.isArray(scData.resultado)) {
          const found = scData.resultado.find((item: any) => String(item.id) === String(id) || `sc-${item.id}` === id) || scData.resultado[0];
          if (found) {
            details = {
              id: `sc-${found.id}`,
              platform: "soundcloud",
              title: found.title,
              author: found.user?.username || "Soundcloud Artist",
              thumbnail: found.artwork_url || found.user?.avatar_url || "https://img.freepik.com/premium-vector/soundcloud-logo_578229-284.jpg",
              duration: formatMillis(found.duration),
              description: found.description || `Gênero: ${found.genre || "N/A"}`,
              originalUrl: found.permalink_url,
              playableAudioUrl: found._media?.transcodings?.[0]?.url || null,
              type: "audio",
              raw: found
            };
          }
        }
      } catch (err: any) {
        console.error("Soundcloud details error:", err.message);
      }
    } else if (platform === "spotify") {
      try {
        const spotData = await fetchFromPlatform("spotify", "/api/spotify/search", { q: id, type: "track", limit: "1" });
        if (spotData && spotData.status && Array.isArray(spotData.resultado) && spotData.resultado.length > 0) {
          const item = spotData.resultado[0];
          details = {
            id: `spot-${item.url?.split("/").pop() || id}`,
            platform: "spotify",
            title: item.name,
            author: item.trackArtist || "Spotify Artist",
            thumbnail: item.album?.images?.[0] || "https://img.freepik.com/premium-vector/spotify-logo_578229-283.jpg",
            duration: item.duration,
            description: `Álbum: ${item.album?.name || "N/A"} | Lançamento: ${item.album?.releaseDate || "N/A"}`,
            originalUrl: item.url,
            playableAudioUrl: null,
            type: "audio",
            raw: item
          };
        }
      } catch (err: any) {
        console.error("Spotify details error:", err.message);
      }
    } else if (platform === "tiktok") {
      try {
        const ttData = await tiktok.GetUserPosts(id, { postLimit: 1 });
        if (ttData && ttData.status === "success" && ttData.result && ttData.result.length > 0) {
          const item = ttData.result[0];
          details = {
            id: `tt-${id}`,
            platform: "tiktok",
            title: item.desc || "TikTok Video",
            author: item.author?.nickname || item.author?.username || "TikTok User",
            thumbnail: item.video?.cover || item.video?.originCover || "https://img.freepik.com/premium-vector/tik-tok-logo_578229-290.jpg",
            duration: "",
            description: item.desc || "TikTok Post",
            originalUrl: item.author?.username ? `https://www.tiktok.com/@${item.author.username}/video/${item.id}` : "https://www.tiktok.com",
            playableAudioUrl: item.music?.playUrl || null,
            playableVideoUrl: item.video?.playAddr || item.video?.downloadAddr || null,
            type: "video",
            raw: item
          };
        }
      } catch (err: any) {
        console.error("TikTok details error:", err.message);
      }
    }

    // Try fallback multi-dl resolution if the ID looks like a full URI
    if (!details && (id.startsWith("http://") || id.startsWith("https://"))) {
      try {
        // Fallback or dynamic configuration for general multi-dl downloader
        const rawData = await fetchFromPlatform(platform || "generic", "/api/dl/multidl", { url: id }).catch(() => 
          fetchFromZeroTwo("/api/dl/multidl", { url: id })
        );
        if (rawData && rawData.resultado) {
          const resObj = rawData.resultado;
          const isYt = id.includes("youtube.com") || id.includes("youtu.be") || (resObj.source && resObj.source.toLowerCase().includes("youtube"));
          details = {
            id: resObj.videoId || resObj.url || id,
            platform: isYt ? "youtube" : (platform || "unknown"),
            title: resObj.title || "Mídia Resolvida",
            author: resObj.author || "Autor Desconhecido",
            thumbnail: resObj.thumbnail || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60",
            duration: resObj.duration || "",
            description: resObj.shortDescription || resObj.description || "",
            originalUrl: resObj.url || id,
            type: isYt ? "video" : (resObj.medias ? "video" : "audio"),
            playableVideoUrl: isYt ? `/api/media/yt-download?type=video&url=${encodeURIComponent(resObj.url || id)}` : (resObj.no_watermark || resObj.watermark || (resObj.medias?.find((m: any) => m.type === "video")?.url) || null),
            playableAudioUrl: isYt ? `/api/media/yt-download?type=audio&url=${encodeURIComponent(resObj.url || id)}` : (resObj.music || (resObj.medias?.find((m: any) => m.type === "audio")?.url) || null),
            medias: resObj.medias,
            raw: rawData
          };
        }
      } catch (e) {
        console.error("Details MultiDL fallback error:", e);
      }
    }

    if (!details) {
      return res.status(404).json({
        status: false,
        error: "Mídia não encontrada.",
        code: "MEDIA_NOT_FOUND"
      });
    }

    res.json({ status: true, details });
  } catch (error: any) {
    console.error("Error loading media details:", error);
    res.status(error.statusCode || 500).json({
      status: false,
      error: "Erro ao carregar detalhes da mídia",
      details: error.message,
      code: "DETAILS_LOAD_FAILED"
    });
  }
});

// ==========================================
// API ROUTE 3: GET /api/media/resolve?platform=&url=
// ==========================================
app.get("/api/media/resolve", async (req, res) => {
  const platform = (req.query.platform as string || "").toLowerCase();
  const url = req.query.url as string;

  if (!url) {
    return res.status(400).json({
      status: false,
      error: "O parâmetro 'url' é obrigatório.",
      code: "MISSING_PARAMETER"
    });
  }

  try {
    if (platform === "youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
      try {
        const ytDetails = await fetchYouTubeInfo(url);
        if (ytDetails) {
          return res.json({ status: true, resolved: ytDetails });
        }
      } catch (err: any) {
        console.warn("fetchYouTubeInfo failed in GET /api/media/resolve, falling back:", err.message);
      }
    }

    // If it's spotify, resolve using Soundcloud search matching
    if (platform === "spotify" || url.includes("spotify.com")) {
      let searchTitle = url;
      if (url.includes("spotify.com/track/")) {
        const trackId = url.split("/track/")[1]?.split("?")[0];
        try {
          const spotData = await fetchFromZeroTwo("/api/spotify/search", { q: trackId, type: "track", limit: "1" });
          if (spotData && spotData.status && Array.isArray(spotData.resultado) && spotData.resultado.length > 0) {
            const item = spotData.resultado[0];
            searchTitle = `${item.trackArtist} - ${item.name}`;
          }
        } catch (e) {
          console.error("Error fetching Spotify track during resolve:", e);
        }
      }

      const scData = await fetchFromZeroTwo("/api/soundcloud/search", { query: searchTitle });
      if (scData && scData.status && Array.isArray(scData.resultado) && scData.resultado.length > 0) {
        const bestMatch = scData.resultado[0];
        return res.json({
          status: true,
          resolved: {
            playableAudioUrl: bestMatch._media?.transcodings?.[0]?.url || null,
            title: bestMatch.title,
            author: bestMatch.user?.username || "Soundcloud Artist",
            thumbnail: bestMatch.artwork_url || "https://img.freepik.com/premium-vector/soundcloud-logo_578229-284.jpg",
            duration: formatMillis(bestMatch.duration),
            originalUrl: url,
            platform: "spotify",
            type: "audio"
          }
        });
      }
    }

    if (platform === "tiktok" || url.includes("tiktok.com")) {
      try {
        const ttDetails = await fetchTikTokDetails(url);
        if (ttDetails) {
          const resolved = {
            id: `tt-${crypto.createHash("md5").update(url).digest("hex")}`,
            platform: "tiktok",
            title: ttDetails.title || "TikTok Video",
            author: ttDetails.author || "TikTok User",
            thumbnail: ttDetails.thumbnail || "https://img.freepik.com/premium-vector/tik-tok-logo_578229-290.jpg",
            duration: "",
            description: ttDetails.title || "",
            originalUrl: url,
            type: "video" as const,
            playableVideoUrl: ttDetails.playableVideoUrl,
            playableAudioUrl: ttDetails.playableAudioUrl,
            raw: ttDetails.raw
          };
          return res.json({ status: true, resolved });
        }
      } catch (err: any) {
        console.warn("fetchTikTokDetails failed in GET /api/media/resolve, falling back:", err.message);
      }
      return res.status(404).json({
        status: false,
        error: "Não foi possível resolver a URL do TikTok.",
        code: "RESOLVE_FAILED"
      });
    }

    // Standard URL Multi-downloader parser
    const rawData = await fetchFromZeroTwo("/api/dl/multidl", { url });
    if (!rawData || !rawData.resultado) {
      return res.status(404).json({
        status: false,
        error: "Não foi possível resolver a URL informada.",
        code: "RESOLVE_FAILED"
      });
    }

    const resObj = rawData.resultado;
    const source = (resObj.source || platform || "Unknown").toLowerCase();
    
    const resolved: any = {
      id: resObj.videoId || resObj.url || Math.random().toString(),
      platform: source.includes("youtube") ? "youtube" : source.includes("tiktok") ? "tiktok" : source.includes("instagram") ? "instagram" : source,
      title: resObj.title || "Mídia Resolvida",
      author: resObj.author || "Autor Desconhecido",
      thumbnail: resObj.thumbnail || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60",
      duration: resObj.duration || "",
      description: resObj.shortDescription || resObj.description || "",
      originalUrl: resObj.url || url,
      type: "video",
      raw: rawData
    };

    if (resolved.platform === "youtube") {
      resolved.type = "video";
      resolved.playableVideoUrl = `/api/media/yt-download?type=video&url=${encodeURIComponent(resolved.originalUrl)}`;
      resolved.playableAudioUrl = `/api/media/yt-download?type=audio&url=${encodeURIComponent(resolved.originalUrl)}`;
    } else if (resolved.platform === "tiktok") {
      resolved.type = "video";
      resolved.playableVideoUrl = resObj.no_watermark || resObj.watermark || null;
      resolved.playableAudioUrl = resObj.music || null;
    } else {
      resolved.type = "video";
      resolved.playableVideoUrl = resObj.url || null;
    }

    res.json({ status: true, resolved });
  } catch (error: any) {
    console.error("Resolve URL error:", error);
    res.status(error.statusCode || 500).json({
      status: false,
      error: "Erro ao resolver mídia por URL",
      details: error.message,
      code: "RESOLVE_ERROR"
    });
  }
});

// ==========================================
// API ROUTE 4: POST /api/media/by-url
// ==========================================
app.post("/api/media/by-url", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ 
      status: false, 
      error: "A URL da mídia é obrigatória.",
      code: "MISSING_URL_BODY"
    });
  }

  try {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      try {
        const ytDetails = await fetchYouTubeInfo(url);
        if (ytDetails) {
          return res.json({ status: true, media: ytDetails });
        }
      } catch (err: any) {
        console.warn("fetchYouTubeInfo failed in POST /api/media/by-url, falling back:", err.message);
      }
    }

    if (url.includes("tiktok.com")) {
      try {
        const ttDetails = await fetchTikTokDetails(url);
        if (ttDetails) {
          const normalized = {
            id: `tt-${crypto.createHash("md5").update(url).digest("hex")}`,
            platform: "tiktok",
            title: ttDetails.title || "TikTok Video",
            author: ttDetails.author || "TikTok User",
            thumbnail: ttDetails.thumbnail || "https://img.freepik.com/premium-vector/tik-tok-logo_578229-290.jpg",
            duration: "",
            description: ttDetails.title || "",
            originalUrl: url,
            type: "video" as const,
            playableVideoUrl: ttDetails.playableVideoUrl,
            playableAudioUrl: ttDetails.playableAudioUrl,
            raw: ttDetails.raw
          };
          return res.json({ status: true, media: normalized });
        }
      } catch (err: any) {
        console.warn("fetchTikTokDetails failed in POST /api/media/by-url, falling back:", err.message);
      }
      return res.status(404).json({
        status: false,
        error: "Nenhuma mídia encontrada para a URL do TikTok.",
        code: "URL_NOT_RESOLVED"
      });
    }

    const rawData = await fetchFromZeroTwo("/api/dl/multidl", { url });
    if (!rawData || !rawData.resultado) {
      return res.status(404).json({ 
        status: false, 
        error: "Nenhuma mídia encontrada para a URL informada.",
        code: "URL_NOT_RESOLVED"
      });
    }

    const resObj = rawData.resultado;
    const source = (resObj.source || "Unknown").toLowerCase();
    
    const normalized: any = {
      id: resObj.videoId || resObj.url || Math.random().toString(),
      platform: source.includes("youtube") ? "youtube" : source.includes("tiktok") ? "tiktok" : source.includes("instagram") ? "instagram" : "unknown",
      title: resObj.title || "Mídia Resolvida",
      author: resObj.author || "Autor Desconhecido",
      thumbnail: resObj.thumbnail || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60",
      duration: resObj.duration || "",
      description: resObj.shortDescription || resObj.description || "",
      originalUrl: resObj.url || url,
      type: "unknown",
      raw: rawData
    };

    if (normalized.platform === "youtube") {
      normalized.type = "video";
      normalized.playableVideoUrl = `/api/media/yt-download?type=video&url=${encodeURIComponent(normalized.originalUrl)}`;
      normalized.playableAudioUrl = `/api/media/yt-download?type=audio&url=${encodeURIComponent(normalized.originalUrl)}`;
      normalized.embedUrl = `https://www.youtube.com/embed/${resObj.videoId}`;
    } else if (normalized.platform === "tiktok") {
      normalized.type = "video";
      const medias = resObj.medias || [];
      const videoUrl = medias.find((m: any) => m.type === "video" && m.quality === "no_watermark")?.url || 
                       medias.find((m: any) => m.type === "video")?.url || 
                       resObj.no_watermark || 
                       resObj.watermark || 
                       null;
      const audioUrl = medias.find((m: any) => m.type === "audio")?.url || 
                       resObj.music || 
                       null;
      normalized.playableVideoUrl = videoUrl;
      normalized.playableAudioUrl = audioUrl;
      normalized.medias = medias;
    } else {
      normalized.type = "video";
      normalized.playableVideoUrl = resObj.url || null;
      if (resObj.thumbnail) normalized.thumbnail = resObj.thumbnail;
    }

    res.json({ status: true, media: normalized });
  } catch (error: any) {
    console.error("Error resolving URL via MultiDL:", error);
    res.status(error.statusCode || 500).json({ 
      status: false, 
      error: "Erro ao resolver a URL", 
      details: error.message,
      code: "BY_URL_RESOLVE_FAILED"
    });
  }
});

// ==========================================
// PRE-EXISTING ENDPOINTS (Legacy compatibility & Support utility helpers)
// ==========================================
app.get("/api/media/resolve-spotify", async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }
  try {
    const scData = await fetchFromZeroTwo("/api/soundcloud/search", { query });
    if (scData && scData.status && Array.isArray(scData.resultado) && scData.resultado.length > 0) {
      const bestMatch = scData.resultado[0];
      return res.json({
        status: true,
        playableAudioUrl: bestMatch._media?.transcodings?.[0]?.url || null,
        title: bestMatch.title,
        author: bestMatch.user?.username || "Soundcloud Artist",
        thumbnail: bestMatch.artwork_url || "https://img.freepik.com/premium-vector/soundcloud-logo_578229-284.jpg"
      });
    }
    res.status(404).json({ error: "Nenhum arquivo de áudio streamable correspondente encontrado." });
  } catch (err: any) {
    res.status(500).json({ error: "Erro ao resolver faixa de áudio", details: err.message });
  }
});

app.get("/api/media/yt-download", async (req, res) => {
  const { type, url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "O parâmetro 'url' é obrigatório." });
  }

  const cleanMediaUrl = cleanUrl(url as string);
  const base = YT_API_BASE_URL.endsWith("/") ? YT_API_BASE_URL.slice(0, -1) : YT_API_BASE_URL;
  
  let directMediaUrl: string | null = null;

  // Helper to extract direct URL from nested Zero Two API JSON responses
  function extractDirectUrl(data: any, mediaType: string): string | null {
    if (!data) return null;
    
    if (mediaType === "video") {
      const direct = data.resultados?.direct || data.resultados?.url || data.resultado?.direct || data.resultado?.url || data.direct || data.url;
      if (typeof direct === "string") return direct;
    } else {
      // Try nesting for audio first
      const audioObj = data.resultados?.audio || data.resultado?.audio || data.audio;
      if (audioObj) {
        if (typeof audioObj === "string") return audioObj;
        if (typeof audioObj === "object" && audioObj.url) return audioObj.url;
      }
      const direct = data.resultados?.direct || data.resultados?.url || data.resultado?.direct || data.resultado?.url || data.direct || data.url;
      if (typeof direct === "string") return direct;
    }
    
    return null;
  }

  // 1. Primary endpoint request based on type
  const targetUrl = type === "video"
    ? `${base}/video?url=${encodeURIComponent(cleanMediaUrl)}&quality=best&apikey=${API_KEY}`
    : `${base}/audio?url=${encodeURIComponent(cleanMediaUrl)}&format=mp3&apikey=${API_KEY}`;

  console.log(`[YouTube Proxy] Querying ${type} endpoint: ${targetUrl.replace(API_KEY, "HIDDEN")}`);
  
  try {
    const response = await fetch(targetUrl);
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json") || contentType.includes("text/plain")) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          directMediaUrl = extractDirectUrl(data, type as string);
        } catch (e) {
          console.warn("[YouTube Proxy] Failed to parse primary JSON response.");
        }
      } else {
        directMediaUrl = targetUrl;
      }
    }
  } catch (err: any) {
    console.error(`[YouTube Proxy] Error querying primary ${type} endpoint:`, err.message);
  }

  // 2. Secondary fallback request (e.g. /audio/pipe or legacy /dl)
  if (!directMediaUrl) {
    const fallbackUrl = type === "video"
      ? `${base}/dl?url=${encodeURIComponent(cleanMediaUrl)}&type=video&apikey=${API_KEY}`
      : `${base}/audio/pipe?url=${encodeURIComponent(cleanMediaUrl)}&apikey=${API_KEY}`;

    console.warn(`[YouTube Proxy] Trying fallback endpoint: ${fallbackUrl.replace(API_KEY, "HIDDEN")}`);
    try {
      const response = await fetch(fallbackUrl);
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json") || contentType.includes("text/plain")) {
          const text = await response.text();
          try {
            const data = JSON.parse(text);
            directMediaUrl = extractDirectUrl(data, type as string);
          } catch (e) {
            console.warn("[YouTube Proxy] Failed to parse fallback JSON response.");
          }
        } else {
          directMediaUrl = fallbackUrl;
        }
      }
    } catch (err: any) {
      console.error("[YouTube Proxy] Fallback endpoint failed:", err.message);
    }
  }

  // 3. Ultimate legacy /dl fallback if still unresolved
  if (!directMediaUrl) {
    const legacyUrl = `${base}/dl?url=${encodeURIComponent(cleanMediaUrl)}&type=${type === "video" ? "video" : "audio"}&apikey=${API_KEY}`;
    console.warn(`[YouTube Proxy] Trying ultimate legacy fallback: ${legacyUrl.replace(API_KEY, "HIDDEN")}`);
    try {
      const response = await fetch(legacyUrl);
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json") || contentType.includes("text/plain")) {
          const text = await response.text();
          try {
            const data = JSON.parse(text);
            directMediaUrl = extractDirectUrl(data, type as string);
          } catch (e) {
            console.warn("[YouTube Proxy] Failed to parse ultimate legacy JSON response.");
          }
        } else {
          directMediaUrl = legacyUrl;
        }
      }
    } catch (err: any) {
      console.error("[YouTube Proxy] Ultimate legacy fallback failed:", err.message);
    }
  }

  if (!directMediaUrl) {
    return res.status(500).json({ error: "Não foi possível obter uma URL direta de mídia do YouTube.", code: "YT_RESOLVE_FAILED" });
  }

  console.log(`[YouTube Proxy] Successfully resolved direct media stream URL: ${directMediaUrl}`);

  // 4. Download, cache and send the direct media file, or redirect if it fails
  try {
    const cacheResult = await getOrDownloadMedia(directMediaUrl, false);
    
    const ext = type === "video" ? "mp4" : "mp3";
    const filename = `youtube_${type}_${Date.now()}.${ext}`;
    
    res.setHeader("content-type", cacheResult.contentType);
    res.setHeader("content-disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader("access-control-allow-origin", "*");
    
    return res.sendFile(cacheResult.filePath);
  } catch (error: any) {
    console.warn(`[YouTube Proxy Cache Miss/Error] Failed to cache directly: ${error.message}. Redirecting client directly to media URL...`);
    // Elegant fallback: redirect the client to the direct googlevideo / Catbox URL so their browser handles the streaming directly
    return res.redirect(directMediaUrl);
  }
});

async function streamResponse(apiResponse: any, clientResponse: express.Response) {
  const contentType = apiResponse.headers.get("content-type");
  const contentLength = apiResponse.headers.get("content-length");
  const contentDisposition = apiResponse.headers.get("content-disposition");

  if (contentType) clientResponse.setHeader("content-type", contentType);
  if (contentLength) {
    clientResponse.setHeader("content-length", contentLength);
  } else {
    clientResponse.setHeader("transfer-encoding", "chunked");
  }
  if (contentDisposition) clientResponse.setHeader("content-disposition", contentDisposition);
  
  clientResponse.setHeader("access-control-allow-origin", "*");

  if (apiResponse.body) {
    if (typeof apiResponse.body.getReader === "function") {
      const reader = apiResponse.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        clientResponse.write(value);
      }
    } else {
      for await (const chunk of apiResponse.body) {
        clientResponse.write(chunk);
      }
    }
  }
  clientResponse.end();
}

app.get("/api/media/stream-proxy", async (req, res) => {
  const mediaUrl = cleanUrl(req.query.url as string);
  if (!mediaUrl) {
    return res.status(400).json({ error: "O parâmetro 'url' é obrigatório." });
  }

  try {
    const cacheResult = await getOrDownloadMedia(mediaUrl);
    
    res.setHeader("content-type", cacheResult.contentType);
    res.setHeader("access-control-allow-origin", "*");
    
    return res.sendFile(cacheResult.filePath);
  } catch (err: any) {
    console.error("Stream proxy cache failure, falling back to direct stream:", err.message);
    try {
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
      };
      if (mediaUrl.includes("tiktok")) headers["Referer"] = "https://www.tiktok.com/";
      if (mediaUrl.includes("instagram")) headers["Referer"] = "https://www.instagram.com/";

      const response = await fetch(mediaUrl, { headers });
      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("content-type", contentType);
      }
      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        res.setHeader("content-length", contentLength);
      } else {
        res.setHeader("transfer-encoding", "chunked");
      }
      res.setHeader("access-control-allow-origin", "*");

      if (response.body) {
        if (typeof response.body.getReader === "function") {
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        } else {
          for await (const chunk of response.body as any) {
            res.write(chunk);
          }
        }
      }
      res.end();
    } catch (fallbackErr: any) {
      res.status(500).json({ error: "Erro ao retransmitir fluxo de mídia", details: fallbackErr.message });
    }
  }
});

app.get("/api/media/download-proxy", async (req, res) => {
  const mediaUrl = cleanUrl(req.query.url as string);
  const filename = (req.query.filename as string) || "download.mp3";
  if (!mediaUrl) {
    return res.status(400).json({ error: "O parâmetro 'url' é obrigatório." });
  }

  try {
    const cacheResult = await getOrDownloadMedia(mediaUrl);
    
    res.setHeader("content-type", cacheResult.contentType);
    res.setHeader("content-disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader("access-control-allow-origin", "*");
    
    return res.sendFile(cacheResult.filePath);
  } catch (err: any) {
    console.error("Download proxy cache failure, falling back to direct download:", err.message);
    try {
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
      };
      if (mediaUrl.includes("tiktok")) headers["Referer"] = "https://www.tiktok.com/";
      if (mediaUrl.includes("instagram")) headers["Referer"] = "https://www.instagram.com/";

      const response = await fetch(mediaUrl, { headers });
      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("content-type", contentType);
      }
      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        res.setHeader("content-length", contentLength);
      } else {
        res.setHeader("transfer-encoding", "chunked");
      }
      
      res.setHeader("content-disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader("access-control-allow-origin", "*");

      if (response.body) {
        if (typeof response.body.getReader === "function") {
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        } else {
          for await (const chunk of response.body as any) {
            res.write(chunk);
          }
        }
      }
      res.end();
    } catch (fallbackErr: any) {
      res.status(500).json({ error: "Erro ao baixar arquivo", details: fallbackErr.message });
    }
  }
});

// ==========================================
// USER AUTHENTICATION & PROFILES SYSTEM (POSTGRESQL)
// ==========================================

const JWT_SECRET = process.env.JWT_SECRET || "zerotwo-jwt-secret-key-1337-!";

interface AuthRequest extends express.Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

// Authentication middleware
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token de autenticação não fornecido" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Sua sessão expirou ou o token é inválido. Faça login novamente." });
    }
    (req as AuthRequest).user = user;
    next();
  });
}

// Register Route
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Preencha todos os campos obrigatórios (nome, email e senha)" });
  }

  try {
    // Check if user already exists
    const userCheck = await pool.query(
      "SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)",
      [username.trim(), email.trim()]
    );
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "Nome de usuário ou e-mail já cadastrado no sistema" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Count existing users to see if they're the first user
    const usersCountRes = await pool.query("SELECT COUNT(*) FROM users");
    const totalUsers = parseInt(usersCountRes.rows[0].count);
    
    // Set role to 'admin' if first user or contains 'admin'
    const isFirstUser = totalUsers === 0;
    const isNamedAdmin = username.toLowerCase().includes("admin") || email.toLowerCase().includes("admin");
    const roleToAssign = (isFirstUser || isNamedAdmin) ? "admin" : "user";

    // Insert user
    const insertRes = await pool.query(
      `INSERT INTO users (username, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, email, avatar, bio, role, theme, plan, created_at`,
      [username.trim(), email.trim().toLowerCase(), hashedPassword, roleToAssign]
    );

    const user = insertRes.rows[0];

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ status: true, token, user });
  } catch (err: any) {
    console.error("[Register Error]:", err.message);
    return res.status(500).json({ error: "Erro interno ao cadastrar usuário", details: err.message });
  }
});

// Login Route
app.post("/api/auth/login", async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: "Identificador (nome de usuário ou e-mail) e senha são obrigatórios" });
  }

  try {
    const userRes = await pool.query(
      "SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)",
      [identifier.trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: "Usuário ou senha incorretos" });
    }

    const user = userRes.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Usuário ou senha incorretos" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Delete password from output
    delete user.password;

    return res.json({ status: true, token, user });
  } catch (err: any) {
    console.error("[Login Error]:", err.message);
    return res.status(500).json({ error: "Erro interno ao autenticar usuário", details: err.message });
  }
});

// Get User Profile Route
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) return res.status(401).json({ error: "Não autorizado" });

  try {
    const userRes = await pool.query(
      "SELECT id, username, email, avatar, bio, role, theme, plan, coins, plan_expires_at, created_at FROM users WHERE id = $1",
      [authReq.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.json({ status: true, user: userRes.rows[0] });
  } catch (err: any) {
    console.error("[Get Profile Error]:", err.message);
    return res.status(500).json({ error: "Erro ao buscar perfil do usuário" });
  }
});

// Update User Profile Route
app.put("/api/auth/profile", authenticateToken, async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) return res.status(401).json({ error: "Não autorizado" });

  const { username, avatar, bio, theme } = req.body;

  try {
    // Validate unique username if changed
    if (username && username.trim().toLowerCase() !== authReq.user.username.toLowerCase()) {
      const checkRes = await pool.query(
        "SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2",
        [username.trim(), authReq.user.id]
      );
      if (checkRes.rows.length > 0) {
        return res.status(400).json({ error: "Este nome de usuário já está em uso por outro perfil" });
      }
    }

    const updateRes = await pool.query(
      `UPDATE users 
       SET username = COALESCE($1, username), 
           avatar = COALESCE($2, avatar), 
           bio = COALESCE($3, bio), 
           theme = COALESCE($4, theme) 
       WHERE id = $5 
       RETURNING id, username, email, avatar, bio, role, theme, plan, coins, plan_expires_at, created_at`,
      [
        username ? username.trim() : null,
        avatar ? avatar.trim() : null,
        bio ? bio.trim() : null,
        theme ? theme.trim() : null,
        authReq.user.id
      ]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: "Perfil não encontrado para atualização" });
    }

    return res.json({ status: true, user: updateRes.rows[0] });
  } catch (err: any) {
    console.error("[Update Profile Error]:", err.message);
    return res.status(500).json({ error: "Erro ao atualizar dados do perfil" });
  }
});

// Upgrade User Plan Route (Mock Payment Success Handler)
app.post("/api/auth/upgrade", authenticateToken, async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) return res.status(401).json({ error: "Não autorizado" });

  const { plan } = req.body;
  if (!plan || !["free", "pro", "premium"].includes(plan)) {
    return res.status(400).json({ error: "Plano inválido ou não especificado" });
  }

  try {
    const updateRes = await pool.query(
      `UPDATE users 
       SET plan = $1 
       WHERE id = $2 
       RETURNING id, username, email, avatar, bio, role, theme, plan, created_at`,
      [plan, authReq.user.id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    console.log(`[Billing System] User ${authReq.user.username} successfully upgraded to ${plan.toUpperCase()}`);
    return res.json({ 
      status: true, 
      message: `Upgrade para o plano ${plan.toUpperCase()} realizado com sucesso!`, 
      user: updateRes.rows[0] 
    });
  } catch (err: any) {
    console.error("[Upgrade Plan Error]:", err.message);
    return res.status(500).json({ error: "Erro ao processar upgrade de plano", details: err.message });
  }
});

// Change Password Route
app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) return res.status(401).json({ error: "Não autorizado" });

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
  }

  try {
    // 1. Get current password hash from db
    const userRes = await pool.query(
      "SELECT password FROM users WHERE id = $1",
      [authReq.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const currentHash = userRes.rows[0].password;

    // 2. Compare passwords
    const isMatch = await bcrypt.compare(currentPassword, currentHash);
    if (!isMatch) {
      return res.status(400).json({ error: "A senha atual informada está incorreta" });
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // 4. Update password
    await pool.query(
      "UPDATE users SET password = $1 WHERE id = $2",
      [newHash, authReq.user.id]
    );

    return res.json({ status: true, message: "Senha alterada com sucesso!" });
  } catch (err: any) {
    console.error("[Change Password Error]:", err.message);
    return res.status(500).json({ error: "Erro interno ao alterar a senha" });
  }
});

// Get User Favorites Route
app.get("/api/favorites", authenticateToken, async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) return res.status(401).json({ error: "Não autorizado" });

  try {
    const favoritesRes = await pool.query(
      "SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC",
      [authReq.user.id]
    );

    // Normalize favorites to match the NormalizedMedia type structure
    const favorites = favoritesRes.rows.map((row) => ({
      id: row.media_id,
      platform: row.platform,
      title: row.title,
      author: row.author,
      thumbnail: row.thumbnail,
      duration: row.duration,
      description: row.description,
      originalUrl: row.original_url,
      playableAudioUrl: row.playable_audio_url,
      playableVideoUrl: row.playable_video_url,
      type: row.type,
      favoriteDbId: row.id,
      createdAt: row.created_at
    }));

    return res.json({ status: true, favorites });
  } catch (err: any) {
    console.error("[Get Favorites Error]:", err.message);
    return res.status(500).json({ error: "Erro ao obter lista de favoritos" });
  }
});

// Save Favorite Route
app.post("/api/favorites", authenticateToken, async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) return res.status(401).json({ error: "Não autorizado" });

  const {
    id,
    platform,
    title,
    author,
    thumbnail,
    duration,
    description,
    originalUrl,
    playableAudioUrl,
    playableVideoUrl,
    type
  } = req.body;

  if (!id || !originalUrl || !title) {
    return res.status(400).json({ error: "Informações de mídia incompletas para salvar nos favoritos" });
  }

  try {
    const insertRes = await pool.query(
      `INSERT INTO favorites (
        user_id, media_id, platform, title, author, thumbnail, duration, description, original_url, playable_audio_url, playable_video_url, type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (user_id, original_url) 
      DO UPDATE SET 
        title = EXCLUDED.title,
        thumbnail = EXCLUDED.thumbnail,
        playable_audio_url = EXCLUDED.playable_audio_url,
        playable_video_url = EXCLUDED.playable_video_url
      RETURNING *`,
      [
        authReq.user.id,
        id,
        platform || "unknown",
        title,
        author || "Desconhecido",
        thumbnail || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60",
        duration || "",
        description || "",
        originalUrl,
        playableAudioUrl || null,
        playableVideoUrl || null,
        type || "audio"
      ]
    );

    const row = insertRes.rows[0];
    const savedFavorite = {
      id: row.media_id,
      platform: row.platform,
      title: row.title,
      author: row.author,
      thumbnail: row.thumbnail,
      duration: row.duration,
      description: row.description,
      originalUrl: row.original_url,
      playableAudioUrl: row.playable_audio_url,
      playableVideoUrl: row.playable_video_url,
      type: row.type,
      favoriteDbId: row.id,
      createdAt: row.created_at
    };

    return res.json({ status: true, favorite: savedFavorite });
  } catch (err: any) {
    console.error("[Save Favorite Error]:", err.message);
    return res.status(500).json({ error: "Erro interno ao salvar mídia nos favoritos" });
  }
});

// Remove Favorite Route
app.delete("/api/favorites", authenticateToken, async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) return res.status(401).json({ error: "Não autorizado" });

  const { originalUrl } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: "A URL original da mídia é obrigatória para exclusão" });
  }

  try {
    const deleteRes = await pool.query(
      "DELETE FROM favorites WHERE user_id = $1 AND original_url = $2 RETURNING id",
      [authReq.user.id, originalUrl]
    );

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ error: "Favorito não encontrado para esta conta" });
    }

    return res.json({ status: true, message: "Mídia removida dos favoritos com sucesso!" });
  } catch (err: any) {
    console.error("[Remove Favorite Error]:", err.message);
    return res.status(500).json({ error: "Erro interno ao remover favorito" });
  }
});

// Clear All Favorites Route
app.delete("/api/favorites/clear", authenticateToken, async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) return res.status(401).json({ error: "Não autorizado" });

  try {
    await pool.query("DELETE FROM favorites WHERE user_id = $1", [authReq.user.id]);
    return res.json({ status: true, message: "Todos os favoritos foram removidos com sucesso!" });
  } catch (err: any) {
    console.error("[Clear Favorites Error]:", err.message);
    return res.status(500).json({ error: "Erro interno ao limpar favoritos" });
  }
});

// Fetch Search History
app.get("/api/history", authenticateToken, async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) return res.status(401).json({ error: "Não autorizado" });

  try {
    const historyRes = await pool.query(
      "SELECT query, timestamp FROM search_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 30",
      [authReq.user.id]
    );

    return res.json({ status: true, history: historyRes.rows });
  } catch (err: any) {
    console.error("[Get History Error]:", err.message);
    return res.status(500).json({ error: "Erro ao buscar histórico de pesquisa" });
  }
});

// Save Search Query to History
app.post("/api/history", authenticateToken, async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) return res.status(401).json({ error: "Não autorizado" });

  const { query, timestamp } = req.body;

  if (!query) {
    return res.status(400).json({ error: "A consulta de pesquisa é obrigatória" });
  }

  try {
    // Delete any old identical queries first to avoid duplicates in display order
    await pool.query(
      "DELETE FROM search_history WHERE user_id = $1 AND LOWER(query) = LOWER($2)",
      [authReq.user.id, query.trim()]
    );

    await pool.query(
      "INSERT INTO search_history (user_id, query, timestamp) VALUES ($1, $2, $3)",
      [authReq.user.id, query.trim(), timestamp || Date.now()]
    );

    return res.json({ status: true });
  } catch (err: any) {
    console.error("[Save History Error]:", err.message);
    return res.status(500).json({ error: "Erro interno ao salvar histórico de pesquisa" });
  }
});

// Clear Search History
app.delete("/api/history", authenticateToken, async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) return res.status(401).json({ error: "Não autorizado" });

  try {
    await pool.query("DELETE FROM search_history WHERE user_id = $1", [authReq.user.id]);
    return res.json({ status: true, message: "Histórico limpo com sucesso!" });
  } catch (err: any) {
    console.error("[Clear History Error]:", err.message);
    return res.status(500).json({ error: "Erro interno ao limpar histórico" });
  }
});

// Remove Single Search History Item
app.delete("/api/history/item", authenticateToken, async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) return res.status(401).json({ error: "Não autorizado" });

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "A consulta é obrigatória para exclusão" });
  }

  try {
    await pool.query(
      "DELETE FROM search_history WHERE user_id = $1 AND LOWER(query) = LOWER($2)",
      [authReq.user.id, query.trim()]
    );
    return res.json({ status: true, message: "Item de histórico removido!" });
  } catch (err: any) {
    console.error("[Remove History Item Error]:", err.message);
    return res.status(500).json({ error: "Erro interno ao remover item de histórico" });
  }
});

// ==========================================
// GIFT CARDS SYSTEM
// ==========================================

// User redeem gift card
app.post("/api/gift-cards/redeem", authenticateToken, async (req, res) => {
  const authReq = req as AuthRequest;
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "O código do Gift Card é obrigatório." });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Find active gift card
    const cardRes = await client.query(
      "SELECT * FROM gift_cards WHERE code = $1 AND is_active = true FOR UPDATE",
      [code]
    );

    if (cardRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Gift Card inválido ou expirado." });
    }

    const card = cardRes.rows[0];

    if (card.uses >= card.max_uses) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "O limite de usos para este Gift Card já foi atingido." });
    }

    // Check if user already redeemed this card
    const checkRedeemed = await client.query(
      "SELECT id FROM gift_card_redemptions WHERE gift_card_id = $1 AND user_id = $2",
      [card.id, authReq.user.id]
    );

    if (checkRedeemed.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "Você já resgatou este Gift Card." });
    }

    // Process redemption
    if (card.type === 'coins') {
      await client.query(
        "UPDATE users SET coins = COALESCE(coins, 0) + $1 WHERE id = $2",
        [card.value, authReq.user.id]
      );
    } else {
      // It's a plan (pro, premium, ultra)
      const durationDays = card.value || 30; // Default 30 days if not specified
      await client.query(
        `UPDATE users 
         SET plan = $1, 
             plan_expires_at = CURRENT_TIMESTAMP + INTERVAL '${durationDays} days'
         WHERE id = $2`,
        [card.type, authReq.user.id]
      );
    }

    // Update uses
    const newUses = card.uses + 1;
    const isActive = newUses < card.max_uses;
    await client.query(
      "UPDATE gift_cards SET uses = $1, is_active = $2 WHERE id = $3",
      [newUses, isActive, card.id]
    );

    // Insert redemption record
    await client.query(
      "INSERT INTO gift_card_redemptions (gift_card_id, user_id) VALUES ($1, $2)",
      [card.id, authReq.user.id]
    );

    await client.query('COMMIT');

    const message = card.type === 'coins' 
      ? `Você resgatou ${card.value} coins!` 
      : `Você resgatou ${card.value} dias do plano ${card.type.toUpperCase()}!`;

    // Return updated user data
    const updatedUserRes = await client.query(
      "SELECT id, username, email, avatar, bio, role, theme, plan, coins, plan_expires_at FROM users WHERE id = $1",
      [authReq.user.id]
    );

    return res.json({ 
      status: true, 
      message,
      user: updatedUserRes.rows[0]
    });

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error("[Redeem Gift Card Error]:", err.message);
    return res.status(500).json({ error: "Erro interno ao resgatar Gift Card." });
  } finally {
    client.release();
  }
});

// ==========================================
// ADMIN PANEL MANAGEMENT SYSTEM (POSTGRESQL)
// ==========================================

// Middleware to authorize admin routes
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authReq = req as AuthRequest;
  if (!authReq.user || authReq.user.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado: área exclusiva para administradores." });
  }
  next();
}

// 1. Get Platform Stats
app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersCount = await pool.query("SELECT COUNT(*) FROM users");
    const favsCount = await pool.query("SELECT COUNT(*) FROM favorites");
    const historyCount = await pool.query("SELECT COUNT(*) FROM search_history");

    const platformFavsBreakdown = await pool.query(
      "SELECT platform, COUNT(*) as count FROM favorites GROUP BY platform ORDER BY count DESC"
    );

    const activeUsersRes = await pool.query(
      `SELECT u.username, COUNT(sh.id) as search_count 
       FROM users u 
       JOIN search_history sh ON u.id = sh.user_id 
       GROUP BY u.id 
       ORDER BY search_count DESC LIMIT 5`
    );

    return res.json({
      status: true,
      stats: {
        totalUsers: parseInt(usersCount.rows[0].count),
        totalFavorites: parseInt(favsCount.rows[0].count),
        totalQueries: parseInt(historyCount.rows[0].count),
        platformBreakdown: platformFavsBreakdown.rows,
        topActiveUsers: activeUsersRes.rows,
      }
    });
  } catch (err: any) {
    console.error("[Admin Stats Error]:", err.message);
    return res.status(500).json({ error: "Erro ao carregar estatísticas do sistema" });
  }
});

// 2. List All Users with Stats
app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersRes = await pool.query(
      `SELECT u.id, u.username, u.email, u.avatar, u.bio, u.role, u.created_at,
              COALESCE(fav.fav_count, 0) as favorites_count,
              COALESCE(hist.hist_count, 0) as search_count
       FROM users u
       LEFT JOIN (
         SELECT user_id, COUNT(*) as fav_count FROM favorites GROUP BY user_id
       ) fav ON u.id = fav.user_id
       LEFT JOIN (
         SELECT user_id, COUNT(*) as hist_count FROM search_history GROUP BY user_id
       ) hist ON u.id = hist.user_id
       ORDER BY u.id ASC`
    );

    return res.json({ status: true, users: usersRes.rows });
  } catch (err: any) {
    console.error("[Admin List Users Error]:", err.message);
    return res.status(500).json({ error: "Erro ao listar usuários do sistema" });
  }
});

// 3. Update User Role
app.put("/api/admin/users/:id/role", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== "admin" && role !== "user") {
    return res.status(400).json({ error: "Apenas as funções 'user' e 'admin' são permitidas." });
  }

  try {
    const updateRes = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role",
      [role, id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado para atualizar cargo." });
    }

    return res.json({ status: true, user: updateRes.rows[0] });
  } catch (err: any) {
    console.error("[Admin Update Role Error]:", err.message);
    return res.status(500).json({ error: "Erro ao atualizar permissões do usuário" });
  }
});

// 4. Update User Profile (as Admin)
app.put("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, email, bio, avatar } = req.body;

  try {
    // Validate email uniqueness if changed
    if (email) {
      const emailCheck = await pool.query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2",
        [email.trim(), id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: "Este endereço de e-mail já está em uso." });
      }
    }

    const updateRes = await pool.query(
      `UPDATE users 
       SET username = COALESCE($1, username), 
           email = COALESCE($2, email),
           avatar = COALESCE($3, avatar), 
           bio = COALESCE($4, bio) 
       WHERE id = $5 
       RETURNING id, username, email, avatar, bio, role, created_at`,
      [
        username ? username.trim() : null,
        email ? email.trim().toLowerCase() : null,
        avatar ? avatar.trim() : null,
        bio ? bio.trim() : null,
        id
      ]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.json({ status: true, user: updateRes.rows[0] });
  } catch (err: any) {
    console.error("[Admin Edit User Error]:", err.message);
    return res.status(500).json({ error: "Erro interno ao atualizar perfil do usuário" });
  }
});

// 5. Delete User (and all Cascade data)
app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const authReq = req as AuthRequest;

  if (parseInt(id) === authReq.user?.id) {
    return res.status(400).json({ error: "Você não pode excluir sua própria conta de administrador ativa!" });
  }

  try {
    const deleteRes = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id, username", [id]);

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado para remoção." });
    }

    return res.json({ status: true, message: `Usuário '${deleteRes.rows[0].username}' excluído com sucesso.` });
  } catch (err: any) {
    console.error("[Admin Delete User Error]:", err.message);
    return res.status(500).json({ error: "Erro ao excluir conta de usuário" });
  }
});

// 6. Get Comprehensive Activity Feed Logs
app.get("/api/admin/logs", authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Recent searches across all users
    const recentSearches = await pool.query(
      `SELECT sh.id, sh.query, sh.timestamp, u.username, u.email, u.avatar
       FROM search_history sh
       JOIN users u ON sh.user_id = u.id
       ORDER BY sh.created_at DESC LIMIT 50`
    );

    // Recent favorites across all users
    const recentFavorites = await pool.query(
      `SELECT f.id, f.title, f.platform, f.created_at, u.username, u.email, u.avatar
       FROM favorites f
       JOIN users u ON f.user_id = u.id
       ORDER BY f.created_at DESC LIMIT 50`
    );

    return res.json({
      status: true,
      logs: {
        searches: recentSearches.rows,
        favorites: recentFavorites.rows,
      }
    });
  } catch (err: any) {
    console.error("[Admin Activity Feed Error]:", err.message);
    return res.status(500).json({ error: "Erro ao obter feed de atividade do sistema" });
  }
});

// ==========================================
// DYNAMIC PLATFORMS & ROUTING CONFIGURATION
// ==========================================

// Get all available platforms (public endpoint used by sidebar/search filter)
app.get("/api/platforms", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM platforms_config ORDER BY id ASC");
    return res.json({ status: true, platforms: result.rows });
  } catch (err: any) {
    console.error("[Get Platforms Error]:", err.message);
    return res.status(500).json({ error: "Erro ao carregar plataformas do sistema" });
  }
});

// Create a new platform config (Admin only)
app.post("/api/admin/platforms", authenticateToken, requireAdmin, async (req, res) => {
  const { platform_key, name, icon_name, primary_api_url, fallback_api_url, api_key_override, is_enabled } = req.body;

  if (!platform_key || !name || !primary_api_url) {
    return res.status(400).json({ error: "Chave, nome e rota primária são obrigatórios." });
  }

  try {
    const insertRes = await pool.query(
      `INSERT INTO platforms_config (platform_key, name, icon_name, primary_api_url, fallback_api_url, api_key_override, is_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        platform_key.trim().toLowerCase(),
        name.trim(),
        icon_name ? icon_name.trim() : "Music",
        primary_api_url.trim(),
        fallback_api_url ? fallback_api_url.trim() : null,
        api_key_override ? api_key_override.trim() : null,
        is_enabled !== false
      ]
    );
    return res.json({ status: true, platform: insertRes.rows[0] });
  } catch (err: any) {
    console.error("[Admin Create Platform Error]:", err.message);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Já existe uma plataforma com essa chave de identificação." });
    }
    return res.status(500).json({ error: "Erro interno ao cadastrar plataforma." });
  }
});

// Update a platform config (Admin only)
app.put("/api/admin/platforms/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, icon_name, primary_api_url, fallback_api_url, api_key_override, is_enabled } = req.body;

  try {
    const updateRes = await pool.query(
      `UPDATE platforms_config 
       SET name = COALESCE($1, name),
           icon_name = COALESCE($2, icon_name),
           primary_api_url = COALESCE($3, primary_api_url),
           fallback_api_url = $4,
           api_key_override = $5,
           is_enabled = COALESCE($6, is_enabled)
       WHERE id = $7
       RETURNING *`,
      [
        name ? name.trim() : null,
        icon_name ? icon_name.trim() : null,
        primary_api_url ? primary_api_url.trim() : null,
        fallback_api_url ? fallback_api_url.trim() : null,
        api_key_override ? api_key_override.trim() : null,
        is_enabled === undefined ? null : is_enabled,
        id
      ]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: "Configuração de plataforma não encontrada." });
    }

    return res.json({ status: true, platform: updateRes.rows[0] });
  } catch (err: any) {
    console.error("[Admin Update Platform Error]:", err.message);
    return res.status(500).json({ error: "Erro interno ao atualizar plataforma." });
  }
});

// Delete a platform config (Admin only)
app.delete("/api/admin/platforms/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const deleteRes = await pool.query("DELETE FROM platforms_config WHERE id = $1 RETURNING id, name", [id]);

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ error: "Configuração de plataforma não encontrada para exclusão." });
    }

    return res.json({ status: true, message: `Plataforma '${deleteRes.rows[0].name}' removida com sucesso.` });
  } catch (err: any) {
    console.error("[Admin Delete Platform Error]:", err.message);
    return res.status(500).json({ error: "Erro interno ao excluir plataforma." });
  }
});

// ==========================================
// ADMIN GIFT CARDS MANAGEMENT
// ==========================================

app.get("/api/admin/gift-cards", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.*, u.username as created_by_username
       FROM gift_cards g
       LEFT JOIN users u ON g.created_by = u.id
       ORDER BY g.created_at DESC`
    );
    return res.json({ status: true, giftCards: result.rows });
  } catch (err: any) {
    console.error("[Admin Get Gift Cards Error]:", err.message);
    return res.status(500).json({ error: "Erro ao buscar gift cards." });
  }
});

app.post("/api/admin/gift-cards", authenticateToken, requireAdmin, async (req, res) => {
  const authReq = req as AuthRequest;
  const { code, type, value, max_uses } = req.body;

  if (!code || !type || !value || !max_uses) {
    return res.status(400).json({ error: "Todos os campos (code, type, value, max_uses) são obrigatórios." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO gift_cards (code, type, value, max_uses, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [code, type, value, max_uses, authReq.user.id]
    );
    return res.json({ status: true, giftCard: result.rows[0], message: "Gift Card criado com sucesso!" });
  } catch (err: any) {
    console.error("[Admin Create Gift Card Error]:", err.message);
    if (err.code === '23505') {
      return res.status(400).json({ error: "Já existe um Gift Card com este código." });
    }
    return res.status(500).json({ error: "Erro ao criar gift card." });
  }
});

app.delete("/api/admin/gift-cards/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM gift_cards WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Gift Card não encontrado." });
    }
    return res.json({ status: true, message: "Gift Card removido com sucesso." });
  } catch (err: any) {
    console.error("[Admin Delete Gift Card Error]:", err.message);
    return res.status(500).json({ error: "Erro ao remover gift card." });
  }
});

// ==========================================
// VITE DEV & PRODUCTION STATIC APP ROUTING
// ==========================================
async function startServer() {
  // Ensure the PostgreSQL database is bootstrapped on server start-up
  await bootstrapDatabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ZeroTwo Server] Running on http://localhost:${PORT}`);
    console.log(`[ZeroTwo Server] Node Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
