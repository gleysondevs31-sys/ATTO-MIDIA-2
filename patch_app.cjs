const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf-8");

const replacement = `
          ) : currentView === "scrapers" ? (
            <ScrapersDocsView />
          ) : currentView === "api-docs" ? (
            <ApiDocsView
              user={user}
              token={token}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          ) : currentView === "admin" && user && token ? (
            <AdminPanel
              token={token}
              currentUser={user}
              customPlatforms={customPlatforms}
              onRefreshPlatforms={fetchPlatforms}
            />
          ) : currentView === "community" ? (
            <CommunityView />
          ) : currentView === "partners" ? (
            <PartnersView />
          ) : currentView === "image-bank" ? (
            <ImageBankView />
          ) : (
            /* Dedicated Cinematic Video Player Page */
`;

content = content.replace(
  `
          ) : currentView === "scrapers" ? (
            <ScrapersDocsView />
          ) : currentView === "api-docs" ? (
            <ApiDocsView
              user={user}
              token={token}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          ) : currentView === "admin" && user && token ? (
            <AdminPanel
              token={token}
              currentUser={user}
              customPlatforms={customPlatforms}
              onRefreshPlatforms={fetchPlatforms}
            />
          ) : (
            /* Dedicated Cinematic Video Player Page */
`.trim(),
  replacement.trim()
);

fs.writeFileSync("src/App.tsx", content);
console.log("Patched App.tsx");
