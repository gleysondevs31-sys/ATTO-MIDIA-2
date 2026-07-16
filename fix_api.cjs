const fs = require("fs");
let content = fs.readFileSync("src/upload-api.ts", "utf-8");

content = content.replace(
  /.map\(f => \{\s*const relUrl = `\/uploads\/\${f}`;\s*return \{ url: relUrl, fullUrl: `\${req.protocol}:\/\/\${req.get\("host"\)}\${relUrl}` \};\s*\}\);/g,
  '.map(f => `/uploads/${f}`);'
);

fs.writeFileSync("src/upload-api.ts", content);
console.log("Restored array of strings");
