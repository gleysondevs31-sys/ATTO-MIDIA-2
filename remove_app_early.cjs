const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf-8");

content = content.replace(
  'export default function App() {\n  if (window.location.pathname === "/gallery") {\n    return <PublicGalleryView theme="dark" />;\n  }',
  'export default function App() {'
);

fs.writeFileSync("src/App.tsx", content);
console.log("Removed early return from App.tsx");
