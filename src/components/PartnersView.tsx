
import React, { useEffect, useState } from "react";
import { Handshake, Terminal, Code2, Rocket, Globe, Plus, Trash2, Image as ImageIcon } from "lucide-react";

export function PartnersView() {
  const [dbPartners, setDbPartners] = useState<any[]>([]);
  const user = JSON.parse(localStorage.getItem('atto_user') || 'null');
  const isAdmin = user?.role === 'admin';
  const token = localStorage.getItem('atto_token');
  
  const [showAdd, setShowAdd] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: '', role: '', description: '', link_url: '', icon_url: '' });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = () => {
    fetch("/api/partners")
      .then(r => r.json())
      .then(d => {
        if (d.success) setDbPartners(d.partners);
      });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(newPartner)
      });
      const data = await res.json();
      if (data.success) {
        setDbPartners([data.partner, ...dbPartners]);
        setShowAdd(false);
        setNewPartner({ name: '', role: '', description: '', link_url: '', icon_url: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este parceiro?")) return;
    try {
      const res = await fetch(`/api/partners/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setDbPartners(dbPartners.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const staticPartners = [
    {
      name: "TobyG74",
      role: "Criador da API do TikTok",
      description: "Responsável pelo excelente pacote @tobyg74/tiktok-api-dl utilizado para downloads de vídeos sem marca d'água.",
      link_url: "https://github.com/TobyG74",
      icon_url: "Terminal"
    },
    {
      name: "Irithell JS",
      role: "Engine de YouTube",
      description: "Pacote @irithell-js/yt-play utilizado como solução robusta de backup para resoluções complexas do YouTube.",
      link_url: "https://github.com/Irithell",
      icon_url: "Code2"
    },
    {
      name: "Comunidade Open Source",
      role: "Desenvolvedores & Contribuidores",
      description: "Agradecimentos a todos os desenvolvedores independentes que ajudam a manter as bibliotecas de scraping e APIs funcionando.",
      link_url: "#",
      icon_url: "Globe"
    }
  ];

  const renderIcon = (iconName: string, iconUrl?: string) => {
    if (iconUrl && iconUrl.startsWith('http')) {
      return <img src={iconUrl} alt="Icon" className="w-8 h-8 rounded-full object-cover" />;
    }
    if (iconName === 'Terminal') return <Terminal className="w-6 h-6 text-emerald-400" />;
    if (iconName === 'Code2') return <Code2 className="w-6 h-6 text-rose-400" />;
    return <Globe className="w-6 h-6 text-blue-400" />;
  };

  const allPartners = [...dbPartners, ...staticPartners];

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-6 overflow-y-auto">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4 relative">
          <div className="inline-flex p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2">
            <Handshake className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-display font-black text-white">Desenvolvedores Parceiros</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            A plataforma ATTO Downloads não seria possível sem o esforço colaborativo e as bibliotecas open-source de desenvolvedores incríveis ao redor do mundo.
          </p>
          
          {isAdmin && (
            <button 
              onClick={() => setShowAdd(!showAdd)}
              className="absolute right-0 top-0 bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-full"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {showAdd && isAdmin && (
          <form onSubmit={handleAdd} className="bg-[#111111] p-6 rounded-3xl border border-white/5 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Adicionar Novo Parceiro</h2>
            <div className="grid grid-cols-2 gap-4">
              <input required type="text" value={newPartner.name} onChange={e => setNewPartner({...newPartner, name: e.target.value})} placeholder="Nome" className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white text-sm" />
              <input required type="text" value={newPartner.role} onChange={e => setNewPartner({...newPartner, role: e.target.value})} placeholder="Função / Papel" className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white text-sm" />
              <input type="url" value={newPartner.link_url} onChange={e => setNewPartner({...newPartner, link_url: e.target.value})} placeholder="URL do Link (Opcional)" className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white text-sm" />
              
              <div className="relative">
                <input type="text" value={newPartner.icon_url} onChange={e => setNewPartner({...newPartner, icon_url: e.target.value})} placeholder="URL da Foto / Ícone" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white text-sm pr-10" />
                <label className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 hover:bg-white/10 rounded-md">
                   <ImageIcon className="w-4 h-4 text-zinc-400" />
                   <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                     if (!e.target.files?.[0]) return;
                     const fd = new FormData();
                     fd.append("image", e.target.files[0]);
                     try {
                       const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                       const data = await res.json();
                       if (data.success) setNewPartner({...newPartner, icon_url: data.url});
                     } catch (err) {}
                   }} />
                </label>
              </div>
            </div>
            <textarea required value={newPartner.description} onChange={e => setNewPartner({...newPartner, description: e.target.value})} placeholder="Descrição" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white text-sm h-24 resize-none" />
            <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-6 rounded-xl transition-colors">Salvar</button>
          </form>
        )}

        <div className="grid md:grid-cols-2 gap-6 pt-8">
          {allPartners.map((p, i) => (
            <div key={i} className="relative p-6 bg-[#111111] border border-white/5 rounded-3xl hover:border-indigo-500/30 transition-all group">
              {isAdmin && p.id && (
                <button onClick={() => handleDelete(p.id)} className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:scale-110 transition-transform">
                  {renderIcon(p.icon_url, p.icon_url)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{p.name}</h3>
                  <p className="text-xs font-mono text-indigo-400 mb-3">{p.role}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-4">{p.description}</p>
                  {p.link_url && p.link_url !== '#' && (
                    <a href={p.link_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-widest text-white hover:text-indigo-400 flex items-center gap-1 transition-colors">
                      <Rocket className="w-3 h-3" /> Conhecer Projeto
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
