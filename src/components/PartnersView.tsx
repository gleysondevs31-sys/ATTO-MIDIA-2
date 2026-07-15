import React from "react";
import { Handshake, Terminal, Code2, Rocket, Globe } from "lucide-react";

export function PartnersView() {
  const partners = [
    {
      name: "TobyG74",
      role: "Criador da API do TikTok",
      desc: "Responsável pelo excelente pacote @tobyg74/tiktok-api-dl utilizado para downloads de vídeos sem marca d'água.",
      link: "https://github.com/TobyG74",
      icon: <Terminal className="w-6 h-6 text-emerald-400" />
    },
    {
      name: "Irithell JS",
      role: "Engine de YouTube",
      desc: "Pacote @irithell-js/yt-play utilizado como solução robusta de backup para resoluções complexas do YouTube.",
      link: "https://github.com/Irithell",
      icon: <Code2 className="w-6 h-6 text-rose-400" />
    },
    {
      name: "Comunidade Open Source",
      role: "Desenvolvedores & Contribuidores",
      desc: "Agradecimentos a todos os desenvolvedores independentes que ajudam a manter as bibliotecas de scraping e APIs funcionando.",
      link: "#",
      icon: <Globe className="w-6 h-6 text-blue-400" />
    }
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-6 overflow-y-auto">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2">
            <Handshake className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-display font-black text-white">Desenvolvedores Parceiros</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            A plataforma ATTO Downloads não seria possível sem o esforço colaborativo e as bibliotecas open-source de desenvolvedores incríveis ao redor do mundo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-8">
          {partners.map((p, i) => (
            <div key={i} className="p-6 bg-[#111111] border border-white/5 rounded-3xl hover:border-indigo-500/30 transition-all group">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:scale-110 transition-transform">
                  {p.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{p.name}</h3>
                  <p className="text-xs font-mono text-indigo-400 mb-3">{p.role}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-4">{p.desc}</p>
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-widest text-white hover:text-indigo-400 flex items-center gap-1 transition-colors">
                    <Rocket className="w-3 h-3" /> Conhecer Projeto
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
