const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf-8");

const publicGalleryImport = `import { PublicGalleryView } from "./components/PublicGalleryView";`;

if (!content.includes("PublicGalleryView")) {
  content = content.replace('import { ImageBankView } from "./components/ImageBankView";', 'import { ImageBankView } from "./components/ImageBankView";\n' + publicGalleryImport);
  
  const publicGalleryRender = `
  if (window.location.pathname === "/gallery") {
    return <PublicGalleryView theme={theme} />;
  }
`;

  content = content.replace('export default function App() {', 'export default function App() {\n' + publicGalleryRender);
  fs.writeFileSync("src/App.tsx", content);
  console.log("Patched App.tsx with PublicGalleryView");
}
