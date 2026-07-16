const fs = require("fs");
let content = fs.readFileSync("src/components/ApiDocsView.tsx", "utf-8");

const imageBankEndpoint = `
        {/* ENDPOINT 5: Image Bank Upload API */}
        <div className="bg-[#111111]/80 border border-white/5 rounded-2xl overflow-hidden shadow-md">
          <div className="p-5 bg-zinc-900/45 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-green-500/10 border border-green-500/25 text-[10px] font-mono font-bold text-green-400 rounded-lg">
                POST
              </span>
              <span className="font-mono text-xs text-zinc-300 font-bold">
                /api/upload/image
              </span>
              <span className="text-zinc-500 text-xs hidden sm:inline">&mdash;</span>
              <span className="text-xs text-zinc-400">Upload para Galeria Pública</span>
            </div>
          </div>
          
          <div className="p-5 space-y-6">
            <div className="grid xl:grid-cols-12 gap-8">
              <div className="xl:col-span-12 space-y-6 text-sm text-zinc-400">
                <p>O endpoint de upload salva imagens (JPG, PNG, GIF, WEBP) no nosso banco de imagens e retorna uma URL pública permanente acessível via HTTPS.</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3">
                    <span className="text-xs font-mono font-bold text-zinc-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-zinc-500" /> Requisição (multipart/form-data)
                    </span>
                    <pre className="p-4 bg-[#050505] border border-white/5 rounded-xl text-[10px] font-mono text-blue-400 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">{\`curl -X POST https://api.attodownloads.com/api/upload/image \\
  -H "Authorization: Bearer <SEU_TOKEN>" \\
  -F "image=@/caminho/para/imagem.png"\`}</pre>
                  </div>
                  
                  <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3">
                    <span className="text-xs font-mono font-bold text-zinc-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-zinc-500" /> Formato da Resposta (JSON)
                    </span>
                    <pre className="p-4 bg-[#050505] border border-white/5 rounded-xl text-[10px] font-mono text-purple-400 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">{\`{
  "success": true,
  "url": "/uploads/image-1234.png"
}\`}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ENDPOINT 6: Image Bank Gallery */}
        <div className="bg-[#111111]/80 border border-white/5 rounded-2xl overflow-hidden shadow-md">
          <div className="p-5 bg-zinc-900/45 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono font-bold text-amber-400 rounded-lg">
                GET
              </span>
              <span className="font-mono text-xs text-zinc-300 font-bold">
                /api/upload/gallery
              </span>
              <span className="text-zinc-500 text-xs hidden sm:inline">&mdash;</span>
              <span className="text-xs text-zinc-400">Listar Galeria Pública</span>
            </div>
          </div>
          
          <div className="p-5 space-y-6">
            <div className="grid xl:grid-cols-12 gap-8">
              <div className="xl:col-span-12 space-y-6 text-sm text-zinc-400">
                <p>Retorna um array com as URLs relativas de todas as imagens que já foram enviadas para a plataforma (ordenadas pelas mais recentes).</p>
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3">
                  <pre className="p-4 bg-[#050505] border border-white/5 rounded-xl text-[10px] font-mono text-purple-400 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">{\`{
  "success": true,
  "images": [
    "/uploads/image-987.png",
    "/uploads/image-654.jpg"
  ]
}\`}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`;

content = content.replace(
  `      </div>\n    </div>\n  );\n}`,
  imageBankEndpoint
);

fs.writeFileSync("src/components/ApiDocsView.tsx", content);
console.log("Patched ApiDocsView with upload endpoints");
