const fs = require("fs");
let content = fs.readFileSync("src/components/LandingPage.tsx", "utf-8");

// First, remove the burger menu entirely.
const burgerMenuMatch = /\{\/\* Burger Menu Button \*\/\}.*?(?=\{\/\* Theme Toggle Button \*\/\})/s;
content = content.replace(burgerMenuMatch, "");

// Add visible buttons
const visibleLinks = `
            {/* Galeria Link */}
            <a 
              href="/gallery"
              className="px-3.5 py-2 text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer flex items-center gap-1 bg-indigo-500/10 rounded-xl border border-indigo-500/20 active:scale-95"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>GALERIA</span>
            </a>
            
            {/* API Docs Link */}
            <button 
              onClick={() => onSelectView?.("api-docs")}
              className="px-3.5 py-2 text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer flex items-center gap-1 bg-emerald-500/10 rounded-xl border border-emerald-500/20 active:scale-95 hidden sm:flex"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>API DOCS</span>
            </button>
            
            {/* Theme Toggle Button */}`;

content = content.replace('{/* Theme Toggle Button */}', visibleLinks);

fs.writeFileSync("src/components/LandingPage.tsx", content);
console.log("Patched LandingPage.tsx to show visible links");
