const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf-8");

const patchCode = `
import https from "https";

async function ensureValidYtDlp() {
  const binPath = path.join(process.cwd(), "node_modules", "@irithell-js", "yt-play", "bin", "yt-dlp");
  
  if (fs.existsSync(binPath)) {
    const buffer = Buffer.alloc(4);
    const fd = fs.openSync(binPath, 'r');
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    
    // Check for ELF magic number (\x7fELF)
    if (buffer.toString('hex') === '7f454c46') {
      console.log("[YouTube Setup] Valid ELF yt-dlp binary found.");
      return;
    }
    console.log("[YouTube Setup] Invalid yt-dlp binary found (corrupted/rate-limited). Redownloading...");
  }

  console.log("[YouTube Setup] Fetching latest yt-dlp release URL from github releases...");
  try {
    const latestUrl = await new Promise((resolve, reject) => {
      https.get("https://github.com/yt-dlp/yt-dlp/releases/latest", (res) => {
        if (res.statusCode === 302) {
          resolve(res.headers.location);
        } else {
          reject(new Error("Failed to get latest release"));
        }
      }).on("error", reject);
    });

    const versionMatch = latestUrl.match(/\\/tag\\/(.+)$/);
    if (!versionMatch) throw new Error("Could not parse version");
    const version = versionMatch[1];
    
    const downloadUrl = \`https://github.com/yt-dlp/yt-dlp/releases/download/\${version}/yt-dlp_linux\`;
    console.log("[YouTube Setup] Downloading from:", downloadUrl);

    await new Promise((resolve, reject) => {
      https.get(downloadUrl, (res) => {
        if (res.statusCode === 302) {
          https.get(res.headers.location, (res2) => {
            const file = fs.createWriteStream(binPath);
            res2.pipe(file);
            file.on('finish', () => {
              file.close();
              fs.chmodSync(binPath, "755");
              resolve();
            });
          }).on("error", reject);
        } else {
          reject(new Error("Expected redirect"));
        }
      }).on("error", reject);
    });
    console.log("[YouTube Setup] yt-dlp downloaded and fixed successfully.");
  } catch (err) {
    console.error("[YouTube Setup] Failed to fix yt-dlp:", err);
  }
}
`;

if (!content.includes("ensureValidYtDlp")) {
    content = content.replace(
        'async function startServer() {',
        patchCode + '\n\nasync function startServer() {\n  await ensureValidYtDlp();\n'
    );
    fs.writeFileSync("server.ts", content);
    console.log("Patched server.ts with ensureValidYtDlp");
}
