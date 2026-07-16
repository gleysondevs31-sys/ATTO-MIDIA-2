const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf-8");

content = content.replace(
  '  if (window.location.pathname === "/gallery") {\n    return <PublicGalleryView theme="dark" />;\n  }',
  ''
);

content = content.replace(
  'export default function App() {',
  'export default function App() {\n  if (window.location.pathname === "/gallery") {\n    return <PublicGalleryView theme="dark" />;\n  }'
);

fs.writeFileSync("src/App.tsx", content);
console.log("Fixed App.tsx early return for gallery");
