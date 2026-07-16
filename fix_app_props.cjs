const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf-8");

content = content.replace(
  'onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}',
  'onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}\n            onSelectView={setCurrentView}'
);

fs.writeFileSync("src/App.tsx", content);
console.log("Patched App.tsx to pass onSelectView");
