import fs from "fs";
let content = fs.readFileSync("server.ts", "utf-8");

const infoEndpoint = `
// Developer API: Universal Media Info (All formats, metadata, etc.)
app.get("/api/v1/info", authenticateApiKey, async (req, res) => {
  const url = req.query.url;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "O parâmetro 'url' é obrigatório." });
  }
  
  try {
    const ytdlp = (playEngine as any).ytdlp;
    const raw = await ytdlp.exec(["-J", "--no-warnings", "--no-playlist", url]);
    return res.json({ status: true, info: JSON.parse(raw) });
  } catch (err: any) {
    return res.status(500).json({ error: "Erro ao obter informações", details: err.message });
  }
});

// Developer API: Playlist Info
app.get("/api/v1/playlist", authenticateApiKey, async (req, res) => {
  const url = req.query.url;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "O parâmetro 'url' é obrigatório." });
  }
  
  try {
    const ytdlp = (playEngine as any).ytdlp;
    const info = await ytdlp.getPlaylistInfo(url, { resolveLinks: false });
    return res.json({ status: true, info });
  } catch (err: any) {
    return res.status(500).json({ error: "Erro ao obter informações da playlist", details: err.message });
  }
});
`;

content = content.replace('app.get("/api/v1/resolve", authenticateApiKey, async (req, res) => {', infoEndpoint + '\napp.get("/api/v1/resolve", authenticateApiKey, async (req, res) => {');

// Update download endpoint to support format
const downloadOriginal = `  const downloadType = type === "video" ? "video" : "audio";`;
const downloadNew = `  const downloadType = type === "video" ? "video" : "audio";
  const format = req.query.format as string;`;
content = content.replace(downloadOriginal, downloadNew);

const ytDownloadOriginal = `    if (isYt) {
      if (downloadType === "video") {
        addYtPlayLog("info", \`[API v1] Calling playEngine.stream.getVideoStream("\${cleanMediaUrl}")\`);
        const streamInfo = await playEngine.stream.getVideoStream(cleanMediaUrl);
        
        res.setHeader("content-type", "video/mp4");
        res.setHeader("access-control-allow-origin", "*");
        
        streamInfo.stream.pipe(res);
        return;
      } else {
        addYtPlayLog("info", \`[API v1] Calling playEngine.stream.getAudioStream("\${cleanMediaUrl}")\`);
        const streamInfo = await playEngine.stream.getAudioStream(cleanMediaUrl);
        
        res.setHeader("content-type", "audio/mpeg");
        res.setHeader("access-control-allow-origin", "*");
        
        streamInfo.stream.pipe(res);
        return;
      }
    }`;

const ytDownloadNew = `    if (isYt) {
      if (format) {
        addYtPlayLog("info", \`[API v1] Resolving custom format \${format} for "\${cleanMediaUrl}"\`);
        const ytdlp = (playEngine as any).ytdlp;
        const rawUrl = await ytdlp.exec(["-f", format, "-g", cleanMediaUrl]);
        const directUrl = rawUrl.trim().split("\\n")[0];
        
        const streamInfo = await (playEngine.stream as any).createHttpStream(directUrl);
        res.setHeader("access-control-allow-origin", "*");
        streamInfo.pipe(res);
        return;
      } else if (downloadType === "video") {
        addYtPlayLog("info", \`[API v1] Calling playEngine.stream.getVideoStream("\${cleanMediaUrl}")\`);
        const streamInfo = await playEngine.stream.getVideoStream(cleanMediaUrl);
        
        res.setHeader("content-type", "video/mp4");
        res.setHeader("access-control-allow-origin", "*");
        
        streamInfo.stream.pipe(res);
        return;
      } else {
        addYtPlayLog("info", \`[API v1] Calling playEngine.stream.getAudioStream("\${cleanMediaUrl}")\`);
        const streamInfo = await playEngine.stream.getAudioStream(cleanMediaUrl);
        
        res.setHeader("content-type", "audio/mpeg");
        res.setHeader("access-control-allow-origin", "*");
        
        streamInfo.stream.pipe(res);
        return;
      }
    }`;

content = content.replace(ytDownloadOriginal, ytDownloadNew);

fs.writeFileSync("server.ts", content);
console.log("Patched server.ts");
