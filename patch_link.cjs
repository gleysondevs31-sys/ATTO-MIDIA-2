const fs = require("fs");
let content = fs.readFileSync("src/components/LandingPage.tsx", "utf-8");

content = content.replace(
  'href="/gallery"',
  'href="/gallery"\n                    onClick={(e) => {\n                      e.preventDefault();\n                      window.history.pushState({}, "", "/gallery");\n                      window.dispatchEvent(new Event("popstate"));\n                    }}'
);

fs.writeFileSync("src/components/LandingPage.tsx", content);
console.log("Patched LandingPage.tsx link");
