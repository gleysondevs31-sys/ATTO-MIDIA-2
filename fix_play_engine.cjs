const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf-8");

content = content.replace(
    'const playEngine = new PlayEngine({',
    'const binDir = path.join(process.cwd(), "node_modules", "@irithell-js", "yt-play", "bin");\nconst playEngine = new PlayEngine({\n  ytdlpBinaryPath: path.join(binDir, "yt-dlp"),'
);

fs.writeFileSync("server.ts", content);
console.log("Patched server.ts with ytdlpBinaryPath");
