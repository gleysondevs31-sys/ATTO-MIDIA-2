const fs = require("fs");
let content = fs.readFileSync("src/components/PublicGalleryView.tsx", "utf-8");

content = content.replace("bg-dark-bg", "bg-[#040404]");

fs.writeFileSync("src/components/PublicGalleryView.tsx", content);
console.log("Patched PublicGalleryView background");
