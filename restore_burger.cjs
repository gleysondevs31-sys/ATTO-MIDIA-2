const fs = require("fs");
let content = fs.readFileSync("src/components/LandingPage.tsx", "utf-8");

const visibleLinksRegex = /\{\/\* Galeria Link \*\/\}.*?\{\/\* Theme Toggle Button \*\/\}/s;

const burgerCode = `
            {/* Burger Menu Button */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl border border-white/10 bg-[#111111]/80 text-gray-300 hover:text-white hover:border-white/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-md hover:bg-primary/10 hover:text-primary"
              >
                <List className="w-5 h-5" />
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#090909] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col py-1">
                  <a 
                    href="/gallery"
                    className="px-4 py-3 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <Globe className="w-4 h-4 text-indigo-400" />
                    Galeria Pública
                  </a>
                  <button 
                    onClick={() => { setIsMenuOpen(false); onSelectView?.("api-docs"); }}
                    className="w-full text-left px-4 py-3 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    Doc da API
                  </button>
                </div>
              )}
            </div>
            
            {/* Theme Toggle Button */}`;

content = content.replace(visibleLinksRegex, burgerCode);

fs.writeFileSync("src/components/LandingPage.tsx", content);
console.log("Restored burger menu");
