import React, { useState } from "react";
import { 
  Sparkles, Play, Flame, Compass, Heart, Shield, Database, Download, 
  Music, ArrowRight, Video, List, Check, Search, Link, Cpu, HelpCircle, 
  TrendingUp, Globe, AlertTriangle, ArrowUpRight, Zap, Sun, Moon, Youtube, Instagram
} from "lucide-react";
import { AttoLogo } from "./AttoLogo";

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenAuth: () => void;
  user: any;
  onSelectLegalView: (tab: "terms" | "privacy" | "conditions" | "links") => void;
  onSearch: (q: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onSelectView?: (view: string) => void;
  onSelectPlatform?: (platform: string) => void;
}

export function LandingPage({ 
  onEnterApp, 
  onOpenAuth, 
  user, 
  onSelectLegalView,
  onSearch,
  theme,
  onToggleTheme,
  onSelectView,
  onSelectPlatform
}: LandingPageProps) {
  const [searchValue, setSearchValue] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    } else {
      onEnterApp();
    }
  };

  const trendingShortcuts = [
    { name: "Lofi Beats", query: "lofi chill" },
    { name: "TikTok Hits", query: "tiktok trends" },
    { name: "Phonk Mix", query: "phonk remix" },
    { name: "Sertanejo", query: "sertanejo 2026" },
    { name: "Synthwave", query: "synthwave retro" }
  ];

  const faqItems = [
    {
      q: "O ATTO Downloads é totalmente gratuito?",
      a: "Sim! O ATTO Downloads é 100% gratuito e ilimitado. Você pode pesquisar, transmitir e baixar quantas mídias desejar sem pagar nenhuma taxa ou assinatura."
    },
    {
      q: "Como baixar vídeos do TikTok sem a marca d'água?",
      a: "Basta colar o link do vídeo do TikTok na nossa barra de pesquisa. Nosso motor de processamento irá limpar automaticamente toda e qualquer marca d'água, disponibilizando o arquivo MP4 limpo para download."
    },
    {
      q: "Como funciona a sincronização em nuvem e favoritos?",
      a: "Ao criar uma conta gratuita no ATTO Downloads, suas mídias favoritas e histórico de busca são salvos em nosso banco de dados relacional PostgreSQL. Isso significa que você pode acessar sua coleção personalizada de qualquer dispositivo."
    },
    {
      q: "Quais formatos e resoluções de download estão disponíveis?",
      a: "Para mídias de vídeo (YouTube/TikTok/Instagram Reels), oferecemos downloads diretos em alta definição MP4. Para mídias de áudio (YouTube Music), nosso sistema extrai e converte a faixa para MP3 em alta fidelidade."
    }
  ];

  const steps = [
    {
      step: "01",
      title: "Pesquise ou Cole o Link",
      desc: "Digite termos de busca ou cole URLs diretas do YouTube, TikTok ou Instagram.",
      color: "from-rose-500 to-rose-600"
    },
    {
      step: "02",
      title: "Processamento Proxy",
      desc: "Nosso backend processa a mídia em alta velocidade através da API ZeroTwo, contornando bloqueios de rede.",
      color: "from-primary to-rose-500"
    },
    {
      step: "03",
      title: "Curta & Faça Download",
      desc: "Assista ou escute direto no player integrado, favorite ou baixe os arquivos em áudio MP3 e vídeo MP4.",
      color: "from-rose-600 to-emerald-500"
    }
  ];

  return (
    <div id="landing-container" className="min-h-screen bg-[#040404] text-zinc-100 flex flex-col justify-between selection:bg-rose-500/30 overflow-x-hidden relative">
      
      {/* Background Decorative Ambient Mesh Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Modern Header Navigation */}
      <header className="border-b border-white/5 bg-[#080808]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AttoLogo size={36} />
            <div>
              <h1 className="text-sm font-display font-black tracking-wider text-white uppercase flex items-center gap-1">
                ATTO <span className="text-primary font-bold">Downloads</span>
              </h1>
              <p className="text-[9px] font-mono font-bold text-zinc-500 tracking-widest -mt-0.5 uppercase">
                ZeroTwo Premium Downloader
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Pricing / plans link */}
            <button
              onClick={() => onSelectView?.("plans")}
              className="px-3.5 py-2 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 transition-all cursor-pointer flex items-center gap-1 bg-amber-500/10 rounded-xl border border-amber-500/20 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>PREÇOS / PRO</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              id="btn-landing-theme-toggle"
              onClick={onToggleTheme}
              title={theme === "light" ? "Mudar para Modo Escuro" : "Mudar para Modo Claro"}
              className="p-2 rounded-xl border border-white/10 bg-[#111111]/80 text-gray-300 hover:text-white hover:border-white/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-md hover:bg-primary/10 hover:text-primary"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {user ? (
              <button
                id="btn-landing-nav-dashboard"
                onClick={onEnterApp}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-rose-700 hover:from-rose-500 hover:to-rose-800 text-white text-xs font-bold font-mono tracking-wider transition-all active:scale-95 shadow-md shadow-rose-950/20 cursor-pointer"
              >
                <span>IR PARA PAINEL</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  id="btn-landing-nav-enter-free"
                  onClick={onEnterApp}
                  className="px-4 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold tracking-wide transition-all cursor-pointer"
                >
                  Entrar como Visitante
                </button>
                <button
                  id="btn-landing-nav-auth"
                  onClick={onOpenAuth}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-rose-500 text-white text-xs font-bold font-mono tracking-wider transition-all active:scale-95 cursor-pointer shadow-md shadow-rose-950/10"
                >
                  ENTRAR / CADASTRAR
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="flex-1 relative z-10">
        
        {/* HERO SECTION WITH SEARCH BAR PREVIEW */}
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center flex flex-col items-center justify-center">
          
          {/* Release Status Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-widest mb-6 shadow-sm">
            <Flame className="w-3 h-3 fill-current animate-bounce" /> VERSÃO 2.4 - DOWNLOAD ULTRA RÁPIDO & POSTGRESQL ATIVO
          </div>

          {/* Core Display Heading */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black text-white tracking-tight leading-[1.08] max-w-4xl">
            Todo o conteúdo multimídia <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-rose-500 to-amber-500">
              da web em suas mãos.
            </span>
          </h2>

          {/* Subtitle Description */}
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl mt-6 leading-relaxed font-sans">
            Baixe e pesquise <strong>vídeos, músicas e fotos</strong> do <strong>YouTube, Instagram, e TikTok</strong> de forma simples. Basta colar o link de qualquer vídeo na barra abaixo e clicar em pesquisar! Nossa plataforma converte links e facilita sua vida.
          </p>

          {/* INTERACTIVE SEARCH AND PASTE BAR */}
          <div className="w-full max-w-3xl mt-10 p-1.5 rounded-2xl bg-zinc-900/80 border border-white/20 focus-within:border-emerald-500/50 focus-within:ring-4 focus-within:ring-emerald-500/20 transition-all shadow-2xl relative backdrop-blur-xl">
            <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-2 items-stretch">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 text-zinc-400 focus-within:text-white transition-colors">
                <Search className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Cole o link do YouTube, Instagram, TikTok aqui... Ou busque uma música!"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full bg-transparent text-white placeholder-zinc-500 text-base md:text-lg outline-none border-none py-1"
                />
                {searchValue && (
                  <button 
                    type="button" 
                    onClick={() => setSearchValue("")}
                    className="text-xs text-zinc-500 hover:text-white transition-colors"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-primary hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-950/40 active:scale-95"
              >
                <span>Buscar / Baixar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Trending Hot Searches / Shortcuts */}
          <div className="flex items-center justify-center flex-wrap gap-2 mt-4 text-xs">
            <span className="text-zinc-500 flex items-center gap-1 font-mono uppercase tracking-wider text-[10px] mr-1">
              <TrendingUp className="w-3.5 h-3.5 text-primary" /> Tendências:
            </span>
            {trendingShortcuts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSearchValue(item.query);
                  onSearch(item.query);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white text-[11px] transition-all cursor-pointer font-sans"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Call to action secondary / Visit button */}
          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={onEnterApp}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-zinc-300 hover:text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Navegar como Visitante</span>
              <Compass className="w-4 h-4" />
            </button>
          </div>

        </section>

        {/* BENTO GRID PLATFORMS STATUS */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div 
              onClick={() => {
                onSelectPlatform?.("youtube");
                onEnterApp();
              }}
              className="p-6 rounded-3xl bg-[#090909] border border-white/5 hover:border-red-500/20 hover:bg-gradient-to-b hover:from-[#0c0c0c] hover:to-red-950/5 transition-all duration-300 group cursor-pointer active:scale-98 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-950/5 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                <Youtube className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mt-4 font-display">YouTube Player</h4>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Extraia áudios em MP3 de alta fidelidade e baixe vídeos HD em MP4 de forma limpa.
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-[9px] font-mono font-bold text-red-400 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">
                ● DOWNLOAD DISPONÍVEL
              </div>
            </div>

            <div 
              onClick={() => {
                onSelectPlatform?.("instagram");
                onEnterApp();
              }}
              className="p-6 rounded-3xl bg-[#090909] border border-white/5 hover:border-pink-500/20 hover:bg-gradient-to-b hover:from-[#0c0c0c] hover:to-pink-950/5 transition-all duration-300 group cursor-pointer active:scale-98 hover:scale-[1.02] hover:shadow-xl hover:shadow-pink-950/5 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                <Instagram className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mt-4 font-display">Instagram Reels</h4>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Baixe Reels, fotos de posts e carrosséis com segurança de forma totalmente anônima.
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-[9px] font-mono font-bold text-pink-400 bg-pink-500/5 px-2 py-0.5 rounded border border-pink-500/10">
                ● DOWNLOAD DE REELS
              </div>
            </div>

            <div 
              onClick={() => {
                onSelectPlatform?.("tiktok");
                onEnterApp();
              }}
              className="p-6 rounded-3xl bg-[#090909] border border-white/5 hover:border-amber-500/20 hover:bg-gradient-to-b hover:from-[#0c0c0c] hover:to-amber-950/5 transition-all duration-300 group cursor-pointer active:scale-98 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-950/5 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mt-4 font-display">TikTok Watermark Clean</h4>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Insira o link e salve vídeos do TikTok sem marcas d'água no rolo da sua câmera.
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                ● 100% LIMPO
              </div>
            </div>

            <div 
              onClick={() => {
                onSelectPlatform?.("all");
                onEnterApp();
              }}
              className="p-6 rounded-3xl bg-[#090909] border border-white/5 hover:border-sky-500/20 hover:bg-gradient-to-b hover:from-[#0c0c0c] hover:to-sky-950/5 transition-all duration-300 group cursor-pointer active:scale-98 hover:scale-[1.02] hover:shadow-xl hover:shadow-sky-950/5 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                <Globe className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mt-4 font-display">Proxy Ultrarrápido</h4>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Toda transferência passa pelos nossos servidores de alto desempenho, garantindo alta velocidade de download.
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-[9px] font-mono font-bold text-sky-400 bg-sky-500/5 px-2 py-0.5 rounded border border-sky-500/10">
                ● PROXIED
              </div>
            </div>

          </div>
        </section>

        {/* STEP-BY-STEP PROCESS WORKFLOW */}
        <section className="max-w-7xl mx-auto px-6 py-12 md:py-20 border-t border-white/5">
          <div className="text-center space-y-3 mb-16">
            <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest block">
              COMO FUNCIONA O ATTO
            </span>
            <h3 className="text-2xl md:text-3.5xl font-display font-black text-white">
              Baixe ou Reproduza em 3 Passos Simples
            </h3>
            <p className="text-zinc-500 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
              Desenvolvemos uma estrutura simplificada para que o seu download ocorra em poucos segundos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item, idx) => (
              <div key={idx} className="relative p-8 rounded-3xl bg-[#090909]/40 border border-white/5 flex flex-col justify-between group overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${item.color} opacity-70`} />
                <div className="space-y-4">
                  <span className="text-3xl font-display font-black bg-clip-text text-transparent bg-gradient-to-r from-zinc-600 to-zinc-400">
                    {item.step}
                  </span>
                  <h4 className="text-base font-bold text-white font-display">{item.title}</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed font-sans">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PLATFORM METRICS AND TECH SPECIFICATIONS */}
        <section className="max-w-7xl mx-auto px-6 py-12 md:py-16 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
            
            <div className="lg:col-span-1 space-y-4">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                TECNOLOGIA & INFRAESTRUTURA
              </span>
              <h3 className="text-2xl md:text-3xl font-display font-black text-white">
                Infraestrutura Escalável com Banco Relacional
              </h3>
              <p className="text-zinc-400 text-xs md:text-sm leading-relaxed font-sans">
                O ATTO Downloads está conectado diretamente a um banco de dados relacional robusto no PostgreSQL para gerenciamento persistente de favoritos de mídia, histórico e perfis.
              </p>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-white block">Sincronização Ativa</span>
                  <span className="text-[10px] text-zinc-500 font-sans block">Sua conta sincronizada em tempo real.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-6 rounded-3xl bg-[#090909]/80 border border-white/5 space-y-3">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">SEGURANÇA</span>
                <h4 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" /> Criptografia de Ponta a Ponta
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Todos os dados de usuários e credenciais são encriptados localmente usando algoritmos Hashing Bcrypt unidirecionais de alta densidade.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#090909]/80 border border-white/5 space-y-3">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">ESTATÍSTICAS</span>
                <h4 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-500" /> Sem Quedas ou Bloqueios
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Usamos o motor inteligente de redirecionamento de links proxy para as APIs ZeroTwo, garantindo bypass confiável em limites de rede de mídia.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#090909]/80 border border-white/5 space-y-3">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">PERSONALIZAÇÃO</span>
                <h4 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-purple-400" /> Perfil e Sistema de Nível
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Sua conta ganha pontuação acumulada por fazer pesquisas e favoritar itens, permitindo que você suba de nível e ganhe títulos exclusivos de perfil.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#090909]/80 border border-white/5 space-y-3">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">CONFIABILIDADE</span>
                <h4 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" /> Conversão em Tempo Real
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Não é necessário esperar horas para converter o áudio. Nosso processador em nuvem fornece o arquivo MP3 otimizado em poucos segundos.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* LANDING PRICING SECTION */}
        <section className="max-w-7xl mx-auto px-6 py-12 md:py-20 border-t border-white/5">
          <div className="text-center space-y-3 mb-16">
            <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block">
              TABELA DE PREÇOS
            </span>
            <h3 className="text-2xl md:text-3.5xl font-display font-black text-white">
              Planos Flexíveis Para Suas Necessidades
            </h3>
            <p className="text-zinc-500 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
              Escolha o plano ideal para você e libere downloads em Full HD, áudio de 320 kbps e remoção completa de marcas d'água do TikTok.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="p-8 rounded-3xl bg-[#090909]/40 border border-white/5 flex flex-col justify-between relative group overflow-hidden">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest block mb-1">PLANO CASUAL</span>
                  <h4 className="text-xl font-bold text-white font-display">Plano Grátis</h4>
                  <p className="text-xs text-zinc-500 mt-2 min-h-[32px]">Para downloads básicos casuais do dia a dia.</p>
                </div>
                <div className="py-2">
                  <span className="text-3xl font-display font-black text-white">R$ 0,00</span>
                  <span className="text-xs text-zinc-500 ml-1">para sempre</span>
                </div>
                <ul className="space-y-3 text-xs text-zinc-400">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Downloads de áudio (até 128 kbps)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Downloads de vídeo (até 360p)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Fila de processamento padrão</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Até 10 buscas e downloads por dia</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onEnterApp}
                className="w-full mt-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-xs font-bold font-mono tracking-wider transition-all cursor-pointer text-center"
              >
                COMEÇAR GRÁTIS
              </button>
            </div>

            {/* Atto PRO Plan */}
            <div className="p-8 rounded-3xl bg-amber-950/5 border border-amber-500/20 flex flex-col justify-between relative group overflow-hidden shadow-lg shadow-amber-950/5">
              <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-300 border-l border-b border-amber-500/25 px-3 py-1 rounded-bl-xl text-[9px] font-mono font-bold tracking-wider uppercase">
                Mais Popular
              </div>
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">MÚSICA & HD</span>
                  <h4 className="text-xl font-bold text-white font-display">Atto PRO</h4>
                  <p className="text-xs text-zinc-500 mt-2 min-h-[32px]">O melhor custo-benefício para quem ama música e vídeos em HD.</p>
                </div>
                <div className="py-2">
                  <span className="text-3xl font-display font-black text-amber-400">R$ 9,90</span>
                  <span className="text-xs text-zinc-500 ml-1">/mês</span>
                </div>
                <ul className="space-y-3 text-xs text-zinc-400">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="font-semibold text-zinc-200">Áudio alta fidelidade (320 kbps)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Downloads de vídeo HD (720p)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Velocidade de download 5x mais rápida</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Downloads ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Acesso ilimitado a todos os downloaders</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  if (user) {
                    onSelectView?.("plans");
                  } else {
                    onOpenAuth();
                  }
                }}
                className="w-full mt-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold font-mono tracking-wider transition-all cursor-pointer text-center"
              >
                ASSINAR PRO
              </button>
            </div>

            {/* Atto PREMIUM Plan */}
            <div className="p-8 rounded-3xl bg-rose-950/5 border border-primary/20 flex flex-col justify-between relative group overflow-hidden shadow-lg shadow-rose-950/5">
              <div className="absolute top-0 right-0 bg-primary/20 text-primary border-l border-b border-primary/25 px-3 py-1 rounded-bl-xl text-[9px] font-mono font-bold tracking-wider uppercase">
                Ultra Velocidade
              </div>
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest block mb-1">EXPERIÊNCIA SUPREMA</span>
                  <h4 className="text-xl font-bold text-white font-display">Atto PREMIUM</h4>
                  <p className="text-xs text-zinc-500 mt-2 min-h-[32px]">Acesso absoluto, sem limitações e com recursos exclusivos de ponta.</p>
                </div>
                <div className="py-2">
                  <span className="text-3xl font-display font-black text-primary">R$ 19,90</span>
                  <span className="text-xs text-zinc-500 ml-1">/mês</span>
                </div>
                <ul className="space-y-3 text-xs text-zinc-400">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="font-semibold text-zinc-200">Vídeos Full HD 1080p e 4K</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="font-semibold text-zinc-200">TikTok Sem Marca d'Água HD</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Instagram Reels original</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Fila premium com prioridade máxima</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Extração de playlists inteiras</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  if (user) {
                    onSelectView?.("plans");
                  } else {
                    onOpenAuth();
                  }
                }}
                className="w-full mt-8 py-3 rounded-xl bg-primary hover:bg-rose-500 text-white text-xs font-bold font-mono tracking-wider transition-all cursor-pointer text-center"
              >
                ASSINAR PREMIUM
              </button>
            </div>
          </div>
        </section>

        {/* ACCORDION FAQ SECTION */}
        <section className="max-w-4xl mx-auto px-6 py-12 md:py-20 border-t border-white/5">
          <div className="text-center space-y-3 mb-12">
            <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block">
              DÚVIDAS FREQUENTES
            </span>
            <h3 className="text-2xl md:text-3xl font-display font-black text-white">
              Perguntas & Respostas Frequentes
            </h3>
            <p className="text-zinc-500 text-xs md:text-sm max-w-md mx-auto leading-relaxed">
              Tem alguma dúvida sobre downloads, privacidade ou como usar? Dê uma olhada rápida abaixo.
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="rounded-2xl border border-white/5 bg-[#090909]/50 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between text-white text-xs font-bold font-sans tracking-wide hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center bg-white/5 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      ↓
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 text-zinc-400 text-xs leading-relaxed font-sans border-t border-white/5 bg-[#070707]">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Rich Multi-Column Professional Footer with Useful Links, Terms & Privacy */}
      <footer className="border-t border-white/5 bg-[#060606] pt-16 pb-12 text-xs text-zinc-500 font-sans relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/5">
            
            {/* Column 1: Brand & Bio */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AttoLogo size={32} />
                <span className="text-sm font-display font-black tracking-wider text-white uppercase">
                  ATTO <span className="text-primary">Downloads</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                A melhor e mais rápida plataforma online para pesquisar, reproduzir, converter e baixar vídeos ou áudios do YouTube, TikTok e Instagram de forma totalmente gratuita e segura.
              </p>
              <div className="text-[10px] font-mono font-bold text-zinc-500">
                PROXIED VIA ATTO CORE API v2.4
              </div>
            </div>

            {/* Column 2: Mídias & Plataformas (Useful features) */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                Downloaders
              </h4>
              <ul className="space-y-2 text-zinc-400">
                <li>
                  <button onClick={onEnterApp} className="hover:text-primary transition-colors cursor-pointer text-left">
                    YouTube para Vídeo (.mp4)
                  </button>
                </li>
                <li>
                  <button onClick={onEnterApp} className="hover:text-primary transition-colors cursor-pointer text-left">
                    Conversor YouTube MP3 (.mp3)
                  </button>
                </li>
                <li>
                  <button onClick={onEnterApp} className="hover:text-primary transition-colors cursor-pointer text-left">
                    TikTok Sem Marca D'água
                  </button>
                </li>
                <li>
                  <button onClick={onEnterApp} className="hover:text-primary transition-colors cursor-pointer text-left">
                    Instagram Reels & Posts
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Políticas Legais */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                Políticas & Termos
              </h4>
              <ul className="space-y-2 text-zinc-400">
                <li>
                  <button onClick={() => onSelectLegalView("terms")} className="hover:text-white hover:underline transition-colors cursor-pointer text-left">
                    Termos de Uso Gerais
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectLegalView("privacy")} className="hover:text-white hover:underline transition-colors cursor-pointer text-left">
                    Política de Privacidade (LGPD)
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectLegalView("conditions")} className="hover:text-white hover:underline transition-colors cursor-pointer text-left">
                    Condições de Download Seguro
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectLegalView("links")} className="hover:text-white hover:underline transition-colors cursor-pointer text-left">
                    Direitos Autorais e Isenção
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Links Úteis & Suporte */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                Links Úteis & FAQ
              </h4>
              <ul className="space-y-2 text-zinc-400">
                <li>
                  <button onClick={() => onSelectLegalView("links")} className="hover:text-white hover:underline transition-colors cursor-pointer text-left">
                    Perguntas Frequentes (FAQ)
                  </button>
                </li>
                <li>
                  <a href="https://zero-two-apis.store/docs" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition-colors block">
                    Documentação Oficial API
                  </a>
                </li>
                <li>
                  <a href="https://github.com/GleysonF" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition-colors block">
                    Repositório do Desenvolvedor
                  </a>
                </li>
                <li>
                  <a href="mailto:gleysonferreira531@gmail.com" className="hover:text-primary hover:underline transition-colors block">
                    Contato e Ouvidoria Suporte
                  </a>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-600 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-zinc-500 border border-white/5">
                ✓
              </div>
              <span>ATTO Media &copy; 2026. Todos os direitos reservados.</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onEnterApp} className="text-emerald-500 font-bold hover:underline cursor-pointer">
                Ver Painel Público
              </button>
              <span>&middot;</span>
              <span>Protegido por Criptografia SSL</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
