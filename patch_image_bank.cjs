const fs = require("fs");
let content = fs.readFileSync("src/components/ImageBankView.tsx", "utf-8");

const genCode = `
  const [genTitle, setGenTitle] = useState("Música");
  const [genArtist, setGenArtist] = useState("Artista");
  const [genProgress, setGenProgress] = useState(50);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = () => {
    const url = \`/api/image/musiccard?title=\${encodeURIComponent(genTitle)}&artist=\${encodeURIComponent(genArtist)}&progress=\${genProgress}&t=\${Date.now()}\`;
    setGeneratedImage(url);
  };
`;

content = content.replace(
    'const [loading, setLoading] = useState(true);',
    'const [loading, setLoading] = useState(true);\n' + genCode
);

const genUi = `
        {/* Gerador de Imagem */}
        <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><ImageIcon className="w-5 h-5 text-cyan-400" /> Gerador de Cards de Música</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="col-span-2 space-y-3">
              <input type="text" value={genTitle} onChange={e => setGenTitle(e.target.value)} placeholder="Título da Música" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white text-sm" />
              <input type="text" value={genArtist} onChange={e => setGenArtist(e.target.value)} placeholder="Nome do Artista" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white text-sm" />
              <input type="range" value={genProgress} onChange={e => setGenProgress(parseInt(e.target.value))} min="0" max="100" className="w-full" />
              <button onClick={handleGenerate} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-xl transition-colors">Gerar Imagem</button>
            </div>
            <div className="col-span-1 bg-black/50 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden min-h-[150px]">
              {generatedImage ? <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" /> : <span className="text-zinc-500 text-xs">Preview</span>}
            </div>
          </div>
        </div>
`;

content = content.replace(
    '<div>\n          <h1 className="text-3xl font-display font-black text-white flex items-center gap-3">',
    genUi + '\n\n        <div>\n          <h1 className="text-3xl font-display font-black text-white flex items-center gap-3">'
);

fs.writeFileSync("src/components/ImageBankView.tsx", content);
console.log("Patched ImageBankView.tsx");
