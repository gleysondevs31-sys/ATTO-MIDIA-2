import fs from 'fs';
const file = './src/App.tsx';
let content = fs.readFileSync(file, 'utf-8');

// add import
content = content.replace(
  'import { ApiDocsView } from "./components/ApiDocsView";',
  'import { ApiDocsView } from "./components/ApiDocsView";\nimport { ScrapersDocsView } from "./components/ScrapersDocsView";'
);

// add view handler
const apiDocsJSX = `          ) : currentView === "api-docs" ? (
            <ApiDocsView
              user={user}
              token={token}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />`;

const scrapersDocsJSX = `          ) : currentView === "scrapers" ? (
            <ScrapersDocsView />`;

content = content.replace(apiDocsJSX, scrapersDocsJSX + "\n" + apiDocsJSX);
fs.writeFileSync(file, content);
console.log("Injected ScrapersDocsView into App.tsx");
