import fs from 'fs';
const file = './src/components/ApiDocsView.tsx';
let content = fs.readFileSync(file, 'utf-8');

const scrapersSection = `
        {/* ENDPOINT 4: Scrapers Dinâmicos */}
        <div className="bg-[#111111]/80 border border-white/5 rounded-2xl overflow-hidden shadow-md">
          <div className="p-5 bg-zinc-900/45 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono font-bold text-amber-400 rounded-lg">
                GET / POST
              </span>
              <span className="font-mono text-xs text-zinc-300 font-bold">
                /api/scrapers/:name
              </span>
              <span className="text-zinc-500 text-xs hidden sm:inline">&mdash;</span>
              <span className="text-xs text-zinc-400">Acesso a mais de 100 scrapers dinâmicos extraídos do ATTO</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Público
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-5 space-y-4">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Parâmetros</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 font-bold">name <span className="text-rose-500">*</span></span>
                    <span className="text-zinc-500">Nome do scraper (ex: youtube, animes, spotify)</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 font-bold">method</span>
                    <span className="text-zinc-500">Método interno do scraper (opcional)</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 font-bold">args</span>
                    <span className="text-zinc-500">Argumentos passados para o scraper</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="xl:col-span-7 space-y-3">
              <span className="text-xs font-mono font-bold text-zinc-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-500" /> Exemplo de Requisição
              </span>
              <pre className="p-4 bg-[#050505] border border-white/5 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">{"// GET /api/scrapers/youtube?method=download&args=https://youtube.com/watch...\\n\\n{\\n  \\"success\\": true,\\n  \\"data\\": { ...resultados do scraper... }\\n}"}
              </pre>
              <div className="mt-4 p-4.5 bg-blue-500/5 rounded-xl border border-blue-500/10 space-y-2">
                <h5 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Listagem de Scrapers
                </h5>
                <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                  Consulte a rota <code className="text-white font-mono bg-white/5 px-1 py-0.5 rounded">GET /api/scrapers</code> para ver a lista completa de mais de 100 scrapers disponíveis.
                </p>
              </div>
            </div>
          </div>
        </div>
`;

content = content.replace("      </div>\n    </div>\n  );\n}", scrapersSection + "      </div>\n    </div>\n  );\n}");

fs.writeFileSync(file, content);
console.log("Updated API Docs!");
