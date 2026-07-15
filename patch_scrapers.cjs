const fs = require("fs");
let content = fs.readFileSync("src/components/ScrapersDocsView.tsx", "utf-8");

content = content.replace(
    '<Code2 className="w-5 h-5 text-amber-500" /> API de Scrapers ATTO',
    '<Code2 className="w-5 h-5 text-amber-500" /> Laboratório / Testes de Scrapers'
);

content = content.replace(
    'Explore e teste os +100 scrapers dinâmicos injetados no sistema.',
    'Explore, depure e teste todos os scrapers de forma visual e amigável.'
);

content = content.replace(
    'Testar na API',
    'Ambiente de Teste Rápido'
);

content = content.replace(
    '<span className="px-2 py-1 bg-white/5 rounded border border-white/5">Tipo: {selectedScraper.type}</span>',
    '<span className="px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded border border-amber-500/20 font-bold">Tipo: {selectedScraper.type}</span>'
);

content = content.replace(
    '<span className="px-2 py-1 bg-white/5 rounded border border-white/5">Métodos disponíveis: {selectedScraper.methods.length}</span>',
    '<span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 font-bold">Métodos: {selectedScraper.methods.length}</span>'
);

fs.writeFileSync("src/components/ScrapersDocsView.tsx", content);
console.log("Patched ScrapersDocsView.tsx");
