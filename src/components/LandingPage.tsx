import React from "react";
import { Sparkles, Play, Flame, Compass, Heart, Shield, Database, Download, Music, ArrowRight, Video, List, Check } from "lucide-react";

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenAuth: () => void;
  user: any;
}

export function LandingPage({ onEnterApp, onOpenAuth, user }: LandingPageProps) {
  return (
    <div id="landing-container" className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col justify-between selection:bg-rose-500/30 overflow-x-hidden relative">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Modern Header Navigation */}
      <header className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-rose-700 flex items-center justify-center text-white shadow-md shadow-rose-950/20">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-display font-black tracking-wider text-white uppercase">
                ZeroTwo <span className="text-primary">Media</span>
              </h1>
              <p className="text-[9px] font-mono font-bold text-zinc-500 tracking-widest -mt-0.5 uppercase">
                ATTO Universal System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

      {/* Hero Visual Presentation */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center justify-center flex-1 relative z-10 text-center">
        {/* Release Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-widest mb-6 animate-pulse">
          <Flame className="w-3 h-3 fill-current" /> Versão 2.4 - Sincronização PostgreSQL Completa
        </div>

        {/* Display Heading */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl">
          Todo o conteúdo multimídia da web. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-rose-500 to-rose-400">
            Transmitido e salvo em um só lugar.
          </span>
        </h2>

        {/* Subtitle description */}
        <p className="text-zinc-400 text-sm md:text-base max-w-2xl mt-6 leading-relaxed">
          Pesquise, assista, transmita e faça downloads em alta fidelidade do <b>YouTube</b>, <b>SoundCloud</b>, <b>Spotify</b> e <b>TikTok</b> sem limites. Sincronize suas playlists favoritas no banco de dados persistente.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full sm:w-auto">
          <button
            id="btn-landing-cta-explore"
            onClick={onEnterApp}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-rose-700 hover:from-rose-500 hover:to-rose-800 text-white font-extrabold text-sm font-mono tracking-wider rounded-2xl transition-all shadow-xl shadow-rose-950/20 hover:scale-[1.03] active:scale-95 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>EXPLORAR MEDIAS AGORA</span>
          </button>
          
          {!user && (
            <button
              id="btn-landing-cta-register"
              onClick={onOpenAuth}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 border border-white/10 bg-[#111111]/60 hover:bg-[#111111] hover:border-white/25 text-white font-semibold text-sm rounded-2xl transition-all hover:scale-[1.03] active:scale-95 cursor-pointer"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>CRIAR CONTA PERSISTENTE</span>
            </button>
          )}
        </div>

        {/* High-Contrast Interactive Platform Preview */}
        <div className="w-full max-w-5xl mt-16 md:mt-24 rounded-2xl border border-white/5 bg-[#0a0a0a]/90 overflow-hidden shadow-2xl p-4 md:p-6 text-left relative">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500/20 border border-rose-500" />
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500/20 border border-amber-500" />
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold tracking-wider ml-2">
                Painel ZeroTwo Universal Core
              </span>
            </div>
            <div className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono font-bold text-emerald-400">
              ● POSTGRESQL ONLINE
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="space-y-3 bg-[#111111]/30 border border-white/5 p-4 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Music className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white font-display">Streaming de Áudio Puro</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Navegue e reproduza conteúdo sonoro sem restrições do SoundCloud e do Spotify diretamente pelo player nativo de alta qualidade.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-3 bg-[#111111]/30 border border-white/5 p-4 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white font-display">Opções de Download Direto</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Baixe o conteúdo do YouTube selecionando áudio (.mp3) ou vídeo (.mp4), de acordo com a sua necessidade de armazenamento.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-3 bg-[#111111]/30 border border-white/5 p-4 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white font-display">Playlist Sincronizada</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Salve faixas e vídeos na sua biblioteca. Seus dados são encriptados e arquivados no banco de dados Postgres do Railway de forma segura.
              </p>
            </div>
          </div>
        </div>

        {/* Bento Trust Markers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl mt-12 text-left">
          <div className="p-5 bg-[#0a0a0a]/50 border border-white/5 rounded-xl space-y-2">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Múltiplas Plataformas</span>
            <span className="text-2xl font-black font-display text-white">4 Integradas</span>
            <p className="text-xs text-zinc-500">YouTube, SoundCloud, Spotify, TikTok.</p>
          </div>
          <div className="p-5 bg-[#0a0a0a]/50 border border-white/5 rounded-xl space-y-2">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Banco de Dados</span>
            <span className="text-2xl font-black font-display text-emerald-400">PostgreSQL</span>
            <p className="text-xs text-zinc-500">Suas coleções persistentes seguras.</p>
          </div>
          <div className="p-5 bg-[#0a0a0a]/50 border border-white/5 rounded-xl space-y-2">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Interface Ultra-Fluida</span>
            <span className="text-2xl font-black font-display text-white">Dark Glass</span>
            <p className="text-xs text-zinc-500">Visual moderno, focado no conteúdo.</p>
          </div>
          <div className="p-5 bg-[#0a0a0a]/50 border border-white/5 rounded-xl space-y-2">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Administração Completa</span>
            <span className="text-2xl font-black font-display text-rose-400">Área Admin</span>
            <p className="text-xs text-zinc-500">Gestão de perfis e relatórios detalhados.</p>
          </div>
        </div>
      </main>

      {/* Simplified Elegant Footer */}
      <footer className="border-t border-white/5 bg-[#070707] py-8 text-center text-xs text-zinc-500 font-mono relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-zinc-400">
              <Check className="w-3 h-3" />
            </div>
            <span>ZeroTwo Media Platform &copy; 2026. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 font-bold hover:underline cursor-pointer" onClick={onEnterApp}>Ver Painel Público</span>
            <span>&middot;</span>
            <span>Sistema Seguro de Proxy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
