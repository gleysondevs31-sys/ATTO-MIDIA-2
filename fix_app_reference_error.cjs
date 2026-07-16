const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf-8");

content = content.replace(
  /if \(window\.location\.pathname === "\/gallery"\) \{\s*return <PublicGalleryView theme=\{theme\} \/>;\s*\}/g,
  ""
);

fs.writeFileSync("src/App.tsx", content);
console.log("Fixed App.tsx ReferenceError");
