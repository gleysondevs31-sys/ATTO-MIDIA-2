const fs = require("fs");
let content = fs.readFileSync("src/components/Sidebar.tsx", "utf-8");

// Change Scrapers API to Laboratório / Testes
content = content.replace(
    '<span>Scrapers API</span>',
    '<span>Lab / Testes API</span>'
);

// Add Partner Developers and Image Bank and Community
const extraTabs = `
            {/* Comunidade */}
            <button
              id="btn-nav-community"
              onClick={() => handleSelectNav("community")}
              className={\`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer \${
                currentView === "community"
                  ? "border-primary/30 bg-primary/10 text-white shadow-sm"
                  : "border-transparent hover:border-white/10 hover:bg-[#111111]/40 text-gray-400 hover:text-white"
              }\`}
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span>Comunidade (Ranking)</span>
            </button>

            {/* Parceiros */}
            <button
              id="btn-nav-partners"
              onClick={() => handleSelectNav("partners")}
              className={\`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer \${
                currentView === "partners"
                  ? "border-primary/30 bg-primary/10 text-white shadow-sm"
                  : "border-transparent hover:border-white/10 hover:bg-[#111111]/40 text-gray-400 hover:text-white"
              }\`}
            >
              <Handshake className="w-4 h-4 text-indigo-400" />
              <span>Parceiros</span>
            </button>
            
            {/* Banco de Imagens */}
            <button
              id="btn-nav-image-bank"
              onClick={() => handleSelectNav("image-bank")}
              className={\`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer \${
                currentView === "image-bank"
                  ? "border-primary/30 bg-primary/10 text-white shadow-sm"
                  : "border-transparent hover:border-white/10 hover:bg-[#111111]/40 text-gray-400 hover:text-white"
              }\`}
            >
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>Banco de Imagens</span>
            </button>
`;

content = content.replace(
    /\{\/\* Documentação API \*\/\}/,
    extraTabs + '\n            {/* Documentação API */}'
);

content = content.replace(
    'import { \n  Film, \n  Compass, \n  Heart, \n  Settings, \n  Info,\n  Menu,\n  X,\n  LogOut,\n  User as UserIcon,\n  Code2,\n  Terminal,\n  Shield,\n  Download,\n  Cpu,\n  Sparkles,\n  PlaySquare\n} from "lucide-react";',
    'import { \n  Film, \n  Compass, \n  Heart, \n  Settings, \n  Info,\n  Menu,\n  X,\n  LogOut,\n  User as UserIcon,\n  Code2,\n  Terminal,\n  Shield,\n  Download,\n  Cpu,\n  Sparkles,\n  PlaySquare,\n  Users,\n  Handshake,\n  Image as ImageIcon\n} from "lucide-react";'
);

fs.writeFileSync("src/components/Sidebar.tsx", content);
console.log("Patched Sidebar.tsx");
