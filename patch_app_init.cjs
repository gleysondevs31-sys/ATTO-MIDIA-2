const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf-8");

content = content.replace(
  'const [currentView, setCurrentView] = useState<string>("landing");',
  'const [currentView, setCurrentView] = useState<string>(() => {\n    const params = new URLSearchParams(window.location.search);\n    return params.get("view") || "landing";\n  });'
);

fs.writeFileSync("src/App.tsx", content);
console.log("Patched App.tsx currentView initialization");
