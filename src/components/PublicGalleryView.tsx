import React, { useEffect, useState } from "react";
import { Image as ImageIcon, Download, Share2 } from "lucide-react";

export function PublicGalleryView({ theme }: { theme: "light" | "dark" }) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    fetch("/api/upload/gallery")
      .then(r => r.json())
      .then(d => {
        if (d.success) setImages(d.images);
      })
      .finally(() => setLoading(false));
  }, [theme]);

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    alert("Link da imagem copiado!");
  };

  return (
    <div className="w-full min-h-screen bg-[#040404] text-gray-100 flex flex-col font-sans">
      <header className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-display font-black text-white tracking-tight">Galeria Pública</h1>
        </div>
        <a href="/" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">
          Acessar Plataforma &rarr;
        </a>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-black text-white">Descubra Artes Incríveis</h2>
          <p className="text-zinc-400">Um espaço público onde a comunidade compartilha imagens, backgrounds e muito mais. Sinta-se livre para explorar e baixar.</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500 animate-pulse">Carregando galeria maravilhosa...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((img, i) => (
              <div key={i} className="group relative rounded-3xl overflow-hidden bg-[#111111] border border-white/5 aspect-[4/5] shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-2">
                <img src={img} alt="Gallery item" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <div className="flex items-center justify-center gap-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <a href={img} download target="_blank" className="p-4 bg-white/20 hover:bg-indigo-500 text-white rounded-full transition-colors backdrop-blur-md" title="Baixar">
                      <Download className="w-6 h-6" />
                    </a>
                    <button onClick={() => copyLink(img)} className="p-4 bg-white/20 hover:bg-pink-500 text-white rounded-full transition-colors backdrop-blur-md" title="Copiar Link">
                      <Share2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {images.length === 0 && (
              <div className="col-span-full py-32 text-center flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                <ImageIcon className="w-16 h-16 mb-6 opacity-30" />
                <h3 className="text-2xl font-bold text-white mb-2">A Galeria está Vazia</h3>
                <p>Seja o primeiro a compartilhar uma imagem na nossa plataforma principal!</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="p-6 text-center text-zinc-600 text-sm font-mono border-t border-white/5">
        ATTO Downloads &copy; 2026 &middot; Galeria Pública
      </footer>
    </div>
  );
}
