const fs = require("fs");
let content = fs.readFileSync("src/components/ApiDocsView.tsx", "utf-8");

const newSection = `
        {/* ENDPOINT 4: Image Generation Canvas API */}
        <div className="bg-[#111111]/80 border border-white/5 rounded-2xl overflow-hidden shadow-md">
          <div className="p-5 bg-zinc-900/45 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono font-bold text-amber-400 rounded-lg">
                GET
              </span>
              <span className="font-mono text-xs text-zinc-300 font-bold">
                /api/image/*
              </span>
              <span className="text-zinc-500 text-xs hidden sm:inline">&mdash;</span>
              <span className="text-xs text-zinc-400">Geração de imagens dinâmicas via Canvas API</span>
            </div>
          </div>
          
          <div className="p-5 space-y-6">
            <div className="grid xl:grid-cols-12 gap-8">
              <div className="xl:col-span-12 space-y-6 text-sm text-zinc-400">
                <p>Nossa API oferece uma suíte completa de endpoints para criação de imagens dinâmicas usando Canvas, Jimp, e Sharp. Ideal para bots de Discord, WhatsApp ou automações.</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                    <h5 className="text-white font-mono font-bold mb-2">Bem-vindo</h5>
                    <code className="text-xs text-amber-400">/api/image/welcome?username=Nome&avatar=URL</code>
                    <p className="text-[10px] mt-2">Cria uma imagem de boas-vindas bonita com avatar circular e degradê.</p>
                  </div>
                  
                  <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                    <h5 className="text-white font-mono font-bold mb-2">Ping (Status)</h5>
                    <code className="text-xs text-amber-400">/api/image/ping?ms=24&ip=127.0.0.1</code>
                    <p className="text-[10px] mt-2">Gera imagem de status de servidor ou conexão, excelente para stats de uptime.</p>
                  </div>
                  
                  <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                    <h5 className="text-white font-mono font-bold mb-2">Music Card</h5>
                    <code className="text-xs text-amber-400">/api/image/musiccard?title=Música&artist=Artista&cover=URL&progress=50</code>
                    <p className="text-[10px] mt-2">Cria um cartão de música tipo Spotify com capa, título e barra de progresso.</p>
                  </div>
                  
                  <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                    <h5 className="text-white font-mono font-bold mb-2">Menu Interativo</h5>
                    <code className="text-xs text-amber-400">/api/image/menu?title=Comandos&items=Item 1,Item 2</code>
                    <p className="text-[10px] mt-2">Renderiza uma lista customizável para usar como menus visuais em chats.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
`;

if (!content.includes("ENDPOINT 4: Image Generation")) {
    content = content.replace("      </div>\n    </div>\n  );\n}", newSection + "\n      </div>\n    </div>\n  );\n}");
    fs.writeFileSync("src/components/ApiDocsView.tsx", content);
    console.log("Patched ApiDocsView with Image API section");
}
