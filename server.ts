import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import crypto from "crypto";
import tiktok from "@tobyg74/tiktok-api-dl";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up local media cache directory
const CACHE_DIR = path.join(process.cwd(), "atto_cache");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Map to coalese active downloads and prevent overlapping requests for the same media url
const activeDownloads = new Map<string, Promise<{ filePath: string; contentType: string }>>();

async function getOrDownloadMedia(mediaUrl: string, isYtProxy = false): Promise<{ filePath: string; contentType: string }> {
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
    if (stats.size < 20000 && !isYtProxy) {
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

// Zero Two Configs - Protect API Key strictly using either API_KEY or ZERO_TWO_API_KEY environment variables
const API_KEY = process.env.API_KEY || process.env.ZERO_TWO_API_KEY || "onnx-ia-key";
const API_BASE_URL = process.env.ZERO_TWO_API_BASE_URL || "https://zero-two-apis.com.br";

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

// Helper function to fetch from Zero Two API with key & handle rate limit/errors robustly
async function fetchFromZeroTwo(endpoint: string, params: Record<string, string>) {
  const queryParams = new URLSearchParams({ ...params, apikey: API_KEY }).toString();
  
  // Clean slash combination to prevent 404 double slash issues on API gateway
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
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

    return await response.json();
  } catch (error: any) {
    console.error(`[ZeroTwo Error] Failure calling ${endpoint}:`, error.message);
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

// Native high-reliability YouTube scraper
async function searchYouTube(query: string): Promise<any[]> {
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
    return results;
  } catch (error) {
    console.error("YouTube search scraper error:", error);
    return [];
  }
}

// Helper function to query DuckDuckGo for TikTok URLs based on a query
async function searchTikTokUrls(query: string): Promise<string[]> {
  const url = `https://html.duckduckgo.com/html/?q=site:tiktok.com+${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
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
        // Filter out tag pages, discover pages, and keep actual video posts
        if (decoded.includes("tiktok.com/") && !decoded.includes("/tag/") && !decoded.includes("/discover/")) {
          urls.push(decoded);
        }
      } catch {}
    }
    
    return Array.from(new Set(urls)).slice(0, 10);
  } catch (e: any) {
    console.error("[searchTikTokUrls error]:", e.message);
    return [];
  }
}

// Fetch details for a specific TikTok URL with failover across multiple endpoints
async function fetchTikTokDetails(url: string): Promise<any | null> {
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

  // Fallbacks: ZeroTwo API endpoints if TobyG74 fails
  // 3. Try v3
  try {
    const data = await fetchFromZeroTwo("/api/download/tiktok/v3", { url });
    if (data && data.status && data.resultado) {
      const item = data.resultado;
      return {
        title: item.desc || "TikTok Video",
        author: item.author?.nickname || item.author?.name || "TikTok User",
        thumbnail: item.author?.avatar || "https://img.freepik.com/premium-vector/tik-tok-logo_578229-290.jpg",
        playableVideoUrl: item.videoHD || item.videoSD || item.videoWatermark || null,
        playableAudioUrl: item.music || null,
        originalUrl: url,
        raw: item
      };
    }
  } catch (err: any) {
    console.warn(`[TikTok Detail Fetch] v3 failed for ${url}:`, err.message);
  }

  // 4. Fallback to multidl - standard robust fallback
  try {
    const data = await fetchFromZeroTwo("/api/dl/multidl", { url });
    if (data && data.resultado) {
      const item = data.resultado;
      const medias = item.medias || [];
      const videoUrl = medias.find((m: any) => m.type === "video" && m.quality === "no_watermark")?.url || 
                       medias.find((m: any) => m.type === "video")?.url;
      const audioUrl = medias.find((m: any) => m.type === "audio")?.url;

      return {
        title: item.title || "TikTok Video",
        author: item.author || item.unique_id || "TikTok User",
        thumbnail: item.thumbnail || "https://img.freepik.com/premium-vector/tik-tok-logo_578229-290.jpg",
        playableVideoUrl: videoUrl || null,
        playableAudioUrl: audioUrl || null,
        originalUrl: url,
        raw: item
      };
    }
  } catch (err: any) {
    console.warn(`[TikTok Detail Fetch] multidl failed for ${url}:`, err.message);
  }

  // 5. Fallback to v4
  try {
    const data = await fetchFromZeroTwo("/api/download/tiktok/v4", { url });
    if (data && data.status && data.resultado) {
      const item = data.resultado;
      return {
        title: item.detalhes?.desc || "TikTok Video",
        author: item.detalhes?.author?.nickname || "TikTok User",
        thumbnail: item.detalhes?.author?.avatar || "https://img.freepik.com/premium-vector/tik-tok-logo_578229-290.jpg",
        playableVideoUrl: item.video?.playAddr?.[0] || null,
        playableAudioUrl: item.audio?.playUrl?.[0] || null,
        originalUrl: url,
        raw: item
      };
    }
  } catch (err: any) {
    console.warn(`[TikTok Detail Fetch] v4 failed for ${url}:`, err.message);
  }

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
        const scData = await fetchFromZeroTwo("/api/soundcloud/search", { query });
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
        console.error("Error searching Soundcloud:", err.message);
      }
    }

    // 3. Spotify Search
    if (platform === "spotify" || platform === "all") {
      try {
        const spotData = await fetchFromZeroTwo("/api/spotify/search", { q: query, type: "track", limit: "15" });
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
        console.error("Error searching Spotify:", err.message);
      }
    }

    // 4. TikTok Search (Enhanced: fetches multiple real search results using DDG scraper and falls back to username search)
    if (platform === "tiktok" || platform === "all") {
      try {
        const seenVideos = new Set<string>();
        const tURLs = await searchTikTokUrls(query);
        console.log(`[TikTok Search] Found ${tURLs.length} URLs from DDG for query: ${query}`);
        
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
                id: `tt-${Buffer.from(item.originalUrl).toString("base64").substring(0, 15)}`,
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

        // Fallback to username variations if DDG search yielded 0 results
        if (results.filter(r => r.platform === "tiktok").length === 0) {
          console.log("[TikTok Search] DuckDuckGo search yielded 0 results. Running username search fallback...");
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
            fetchFromZeroTwo("/download/tiktoksearch", { username: v }).catch(() => null)
          );
          
          const responses = await Promise.all(promises);
          for (const ttData of responses) {
            if (ttData && ttData.status && ttData.resultado) {
              const item = ttData.resultado;
              const videoId = item.no_watermark || item.watermark || item.title || item.cover;
              if (!videoId || seenVideos.has(videoId)) continue;
              seenVideos.add(videoId);
              
              results.push({
                id: `tt-${item.author || Math.random().toString()}-${item.cover?.split("/").pop() || Math.random().toString()}`,
                platform: "tiktok",
                title: item.title || "TikTok Video",
                author: item.author || "TikTok User",
                thumbnail: item.cover || item.origin_cover || "https://img.freepik.com/premium-vector/tik-tok-logo_578229-290.jpg",
                duration: "",
                description: item.title || "TikTok Post",
                originalUrl: item.author ? `https://www.tiktok.com/@${item.author.replace("@", "")}` : "https://www.tiktok.com",
                playableAudioUrl: item.music || null,
                playableVideoUrl: item.no_watermark || item.watermark || null,
                type: "video" as const,
                raw: item
              });
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
        const scData = await fetchFromZeroTwo("/api/soundcloud/search", { query: id });
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
        const spotData = await fetchFromZeroTwo("/api/spotify/search", { q: id, type: "track", limit: "1" });
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
        const ttData = await fetchFromZeroTwo("/download/tiktoksearch", { username: id });
        if (ttData && ttData.status && ttData.resultado) {
          const item = ttData.resultado;
          details = {
            id: `tt-${id}`,
            platform: "tiktok",
            title: item.title || "TikTok Video",
            author: item.author || "TikTok User",
            thumbnail: item.cover || item.origin_cover || "https://img.freepik.com/premium-vector/tik-tok-logo_578229-290.jpg",
            duration: "",
            description: item.title || "TikTok Post",
            originalUrl: item.author ? `https://www.tiktok.com/@${item.author.replace("@", "")}` : "https://www.tiktok.com",
            playableAudioUrl: item.music || null,
            playableVideoUrl: item.no_watermark || item.watermark || null,
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
        const rawData = await fetchFromZeroTwo("/api/dl/multidl", { url: id });
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
  const { type, url, srv } = req.query;
  if (!url) {
    return res.status(400).json({ error: "O parâmetro 'url' é obrigatório." });
  }

  const serverIndex = srv ? String(srv) : "1";
  const endpoint = type === "video" ? `/api/dl/ytvideo${serverIndex === "1" ? "" : serverIndex}` : `/api/dl/ytaudio${serverIndex === "1" ? "" : serverIndex}`;
  
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const targetUrl = `${base}${endpoint}?url=${encodeURIComponent(url as string)}&apikey=${API_KEY}`;
  
  console.log(`[YouTube Proxy] Fetching or caching from ${type} server ${serverIndex}`);

  try {
    const cacheResult = await getOrDownloadMedia(targetUrl, true);
    
    const ext = type === "video" ? "mp4" : "mp3";
    const filename = `youtube_${type}_${Date.now()}.${ext}`;
    
    res.setHeader("content-type", cacheResult.contentType);
    res.setHeader("content-disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader("access-control-allow-origin", "*");
    
    return res.sendFile(cacheResult.filePath);
  } catch (error: any) {
    console.warn(`[YouTube Proxy Cache Miss] Failed to cache directly. Trying server fallback stream...`);
    try {
      const response = await fetch(targetUrl);
      
      if (!response.ok) {
        console.warn(`[YouTube Proxy] Server ${serverIndex} failed with status ${response.status}. Trying fallback server...`);
        const fallbackServers = ["1", "2", "3"].filter(s => s !== serverIndex);
        for (const nextSrv of fallbackServers) {
          const nextEndpoint = type === "video" ? `/api/dl/ytvideo${nextSrv === "1" ? "" : nextSrv}` : `/api/dl/ytaudio${nextSrv === "1" ? "" : nextSrv}`;
          const nextUrl = `${base}${nextEndpoint}?url=${encodeURIComponent(url as string)}&apikey=${API_KEY}`;
          console.log(`[YouTube Proxy Fallback] Trying server ${nextSrv}: ${nextUrl.replace(API_KEY, "HIDDEN")}`);
          
          try {
            const nextResponse = await fetch(nextUrl);
            if (nextResponse.ok) {
              return await streamResponse(nextResponse, res);
            }
          } catch (err: any) {
            console.error(`[YouTube Proxy Fallback] Server ${nextSrv} failed:`, err.message);
          }
        }
        return res.status(response.status).json({ error: "Todos os servidores de download do YouTube falharam.", code: "YT_DOWNLOAD_FAILED" });
      }

      return await streamResponse(response, res);
    } catch (e: any) {
      console.error("[YouTube Proxy Error]:", e);
      res.status(500).json({ error: "Falha ao processar download do YouTube", details: e.message });
    }
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
  const mediaUrl = req.query.url as string;
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
  const mediaUrl = req.query.url as string;
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
// VITE DEV & PRODUCTION STATIC APP ROUTING
// ==========================================
async function startServer() {
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
