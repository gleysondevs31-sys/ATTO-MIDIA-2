const fs = require("fs");
let content = fs.readFileSync("src/upload-api.ts", "utf-8");

content = content.replace(
  'const url = `/uploads/${req.file.filename}`;',
  'const url = `/uploads/${req.file.filename}`;\n    const fullUrl = `${req.protocol}://${req.get("host")}${url}`;'
);

content = content.replace(
  'res.json({ success: true, url });',
  'res.json({ success: true, url, fullUrl });'
);

content = content.replace(
  '.map(f => `/uploads/${f}`);',
  '.map(f => {\n              const relUrl = `/uploads/${f}`;\n              return { url: relUrl, fullUrl: `${req.protocol}://${req.get("host")}${relUrl}` };\n            });'
);

fs.writeFileSync("src/upload-api.ts", content);
console.log("Patched src/upload-api.ts");
