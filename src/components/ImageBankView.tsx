import React, { useEffect, useState } from "react";
import { Image as ImageIcon, Download, UploadCloud, Search } from "lucide-react";

export function ImageBankView() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [genTitle, setGenTitle] = useState("Música");
  const [genArtist, setGenArtist] = useState("Artista");
  const [genProgress, setGenProgress] = useState(50);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = () => {
    const url = `/api/image/musiccard?title=${encodeURIComponent(genTitle)}&artist=${encodeURIComponent(genArtist)}&progress=${genProgress}&t=${Date.now()}`;
    setGeneratedImage(url);
  };


  useEffect(() => {
    fetch("/api/upload/gallery")
      .then(r => r.json())
      .then(d => {
        if (d.success) setImages(d.images);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-6 overflow-y-auto">
      <div className="max-w-6xl w-full space-y-8">
        
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


        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-black text-white flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-cyan-400" /> Banco de Imagens
            </h1>
            <p className="text-zinc-400 mt-2">Explore e baixe imagens compartilhadas pela comunidade. Use nossa API para gerar e upar imagens!</p>
          </div>
          
          <div className="flex items-center gap-3">
            <a href="/gallery" target="_blank" className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
              Galeria Pública &rarr;
            </a>
            <label className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl cursor-pointer flex items-center gap-2 transition-colors">
              <UploadCloud className="w-5 h-5" /> Fazer Upload

            <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
              if (!e.target.files?.[0]) return;
              const fd = new FormData();
              fd.append("image", e.target.files[0]);
              try {
                const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                const data = await res.json();
                if (data.success) {
                  setImages(prev => [data.url, ...prev]);
                  const fullUrl = window.location.origin + data.url;
                  navigator.clipboard.writeText(fullUrl).catch(() => {});
                  alert("Upload concluído! Link público copiado: " + fullUrl);
                }
              } catch (err) {
                console.error(err);
              }
            }} />
          </label>
          </div>
        </div>


        {loading ? (
          <div className="text-center py-10 text-zinc-500">Carregando galeria...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img, i) => (
              <div key={i} className="group relative rounded-2xl overflow-hidden bg-[#111111] border border-white/5 aspect-square">
                <img src={img} alt="Gallery item" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                  <a href={img} download target="_blank" className="p-3 bg-white/10 hover:bg-cyan-500/20 text-white rounded-full transition-colors backdrop-blur-md">
                    <Download className="w-5 h-5" />
                  </a>
                  <span className="text-xs font-mono font-bold text-white tracking-widest">BAIXAR</span>
                </div>
              </div>
            ))}
            {images.length === 0 && (
              <div className="col-span-full py-20 text-center flex flex-col items-center justify-center text-zinc-500 border border-dashed border-white/10 rounded-3xl bg-white/5">
                <ImageIcon className="w-10 h-10 mb-4 opacity-50" />
                <p>Nenhuma imagem no banco de imagens ainda.</p>
                <p className="text-xs mt-1">Vá até o Perfil para fazer upload do seu Avatar!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
