import fs from 'fs';
const file = './src/components/Sidebar.tsx';
let content = fs.readFileSync(file, 'utf-8');

const scrapersButton = `
            {/* Scrapers Dinâmicos */}
            <button
              id="btn-nav-scrapers"
              onClick={() => handleSelectNav("api-docs")}
              className={\`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer \${
                currentView === "scrapers"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-sm"
                  : "border-transparent hover:border-white/10 hover:bg-[#111111]/40 text-gray-400 hover:text-white"
              }\`}
            >
              <Code2 className="w-4 h-4 text-amber-400" />
              <span>Scrapers API</span>
            </button>
`;

content = content.replace("            {/* Documentação API */}", scrapersButton + "\n            {/* Documentação API */}");

fs.writeFileSync(file, content);
console.log("Updated Sidebar!");
