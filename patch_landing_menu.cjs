const fs = require("fs");
let content = fs.readFileSync("src/components/LandingPage.tsx", "utf-8");

if (!content.includes("isMenuOpen")) {
  content = content.replace(
    'const [activeFaq, setActiveFaq] = useState<number | null>(null);',
    'const [activeFaq, setActiveFaq] = useState<number | null>(null);\n  const [isMenuOpen, setIsMenuOpen] = useState(false);'
  );

  const burgerButton = `
            {/* Burger Menu Button */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl border border-white/10 bg-[#111111]/80 text-gray-300 hover:text-white hover:border-white/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-md hover:bg-primary/10 hover:text-primary"
              >
                <List className="w-5 h-5" />
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#090909] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col py-1">
                  <a 
                    href="/gallery"
                    className="px-4 py-3 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4 text-indigo-400" />
                    Galeria Pública
                  </a>
                  <button 
                    onClick={() => { setIsMenuOpen(false); onSelectView?.("api-docs"); }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    Doc da API
                  </button>
                </div>
              )}
            </div>
`;

  content = content.replace(
    '{/* Theme Toggle Button */}',
    burgerButton + '\n            {/* Theme Toggle Button */}'
  );
  
  if (!content.includes("Code2")) {
      content = content.replace(
          'import {   Sparkles,',
          'import {   Sparkles, Code2,'
      );
  }

  fs.writeFileSync("src/components/LandingPage.tsx", content);
  console.log("Patched LandingPage menu");
}
