const fs = require("fs");
let content = fs.readFileSync("src/components/ApiDocsView.tsx", "utf-8");

const endpoints = `

        {/* ENDPOINT 5: Universal Media Info */}
        <div className="bg-[#111111]/80 border border-white/5 rounded-2xl overflow-hidden shadow-md">
          <div className="p-5 bg-zinc-900/45 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/25 text-[10px] font-mono font-bold text-sky-400 rounded-lg">
                GET
              </span>
              <span className="font-mono text-xs text-zinc-300 font-bold">
                /api/v1/info
              </span>
              <span className="text-zinc-500 text-xs hidden sm:inline">&mdash;</span>
              <span className="text-xs text-zinc-400">Extrai todos os formatos, resoluções e informações de qualquer link</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Autenticado: apikey
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-5 space-y-4">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Parâmetros</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 font-bold">url <span className="text-rose-500">*</span></span>
                    <span className="text-zinc-500">Qualquer link (YT, Insta, TikTok, X)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="xl:col-span-7 space-y-3">
              <span className="text-xs font-mono font-bold text-zinc-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-500" /> Resposta Completa
              </span>
              <pre className="p-4 bg-[#050505] border border-white/5 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">
{\`{
  "status": true,
  "info": {
    "id": "...",
    "title": "...",
    "formats": [ { "format_id": "137", "resolution": "1080p", "ext": "mp4", ... } ]
  }
}\`}
              </pre>
            </div>
          </div>
        </div>

        {/* ENDPOINT 6: Playlist Info */}
        <div className="bg-[#111111]/80 border border-white/5 rounded-2xl overflow-hidden shadow-md">
          <div className="p-5 bg-zinc-900/45 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/25 text-[10px] font-mono font-bold text-purple-400 rounded-lg">
                GET
              </span>
              <span className="font-mono text-xs text-zinc-300 font-bold">
                /api/v1/playlist
              </span>
              <span className="text-zinc-500 text-xs hidden sm:inline">&mdash;</span>
              <span className="text-xs text-zinc-400">Extrai todos os vídeos de uma playlist (YouTube, Spotify, etc)</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Autenticado: apikey
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-5 space-y-4">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Parâmetros</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 font-bold">url <span className="text-rose-500">*</span></span>
                    <span className="text-zinc-500">URL da playlist</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="xl:col-span-7 space-y-3">
              <span className="text-xs font-mono font-bold text-zinc-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-500" /> Formato da Resposta
              </span>
              <pre className="p-4 bg-[#050505] border border-white/5 rounded-xl text-[10px] font-mono text-purple-400 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">
{\`{
  "status": true,
  "info": {
    "title": "My Playlist",
    "entries": [ { "id": "...", "title": "..." }, ... ]
  }
}\`}
              </pre>
            </div>
          </div>
        </div>
`;

content = content.replace("      </div>\n    </div>\n  );\n}", endpoints + "      </div>\n    </div>\n  );\n}");

fs.writeFileSync("src/components/ApiDocsView.tsx", content);
console.log("Patched docs");
