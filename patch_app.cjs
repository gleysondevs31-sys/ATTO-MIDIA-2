const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf-8");

content = content.replace(
    'import { ProfileView } from "./components/ProfileView";',
    'import { ProfileView } from "./components/ProfileView";\nimport { CommunityView } from "./components/CommunityView";\nimport { PartnersView } from "./components/PartnersView";\nimport { ImageBankView } from "./components/ImageBankView";'
);

const viewsRouting = `
          {currentView === "scrapers" && <ScrapersDocsView />}
          {currentView === "community" && <CommunityView />}
          {currentView === "partners" && <PartnersView />}
          {currentView === "image-bank" && <ImageBankView />}
`;

content = content.replace(
    /\{\s*currentView === "scrapers" && <ScrapersDocsView \/>\s*\}/,
    viewsRouting
);

fs.writeFileSync("src/App.tsx", content);
console.log("Patched App.tsx");
