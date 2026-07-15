const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf-8");

content = content.replace(
    'const binPath = path.join(process.cwd(), "node_modules", "@irithell-js", "yt-play", "bin", "yt-dlp");',
    'const binDir = path.join(process.cwd(), "node_modules", "@irithell-js", "yt-play", "bin");\n  if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });\n  const binPath = path.join(binDir, "yt-dlp");'
);

fs.writeFileSync("server.ts", content);
console.log("Patched server.ts with mkdirSync");
