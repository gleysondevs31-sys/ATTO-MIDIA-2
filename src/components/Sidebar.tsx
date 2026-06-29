import React from "react";
import { Compass, Film, Heart, Settings, Shield, Info, ExternalLink, HelpCircle, LayoutGrid, Youtube, Music, Play, History, Trash2, X, Instagram, Sparkles } from "lucide-react";
import { AttoLogo } from "./AttoLogo";

interface SidebarProps {
  currentView: string;
  onSelectView: (view: any) => void;
  hasActiveVideo: boolean;
  user: any;
  selectedPlatform?: string;
  onSelectPlatform?: (platform: string) => void;
  history?: { query: string; timestamp: string }[];
  onClearHistory?: () => void;
  onSelectHistory?: (query: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  currentView,
  onSelectView,
  hasActiveVideo,
  user,
  selectedPlatform = "all",
  onSelectPlatform,
  history = [],
  onClearHistory,
  onSelectHistory,
  isOpen,
  onClose
}: SidebarProps) {
  const categories = [
    { id: "all", name: "Todas Mídias", icon: LayoutGrid, color: "hover:text-white" },
    { id: "youtube", name: "YouTube", icon: Youtube, color: "hover:text-red-400" },
    { id: "soundcloud", name: "Soundcloud", icon: Music, color: "hover:text-orange-400" },
    { id: "spotify", name: "Spotify", icon: Music, color: "hover:text-emerald-400" },
    { id: "tiktok", name: "TikTok", icon: Play, color: "hover:text-sky-400" },
  ];

  const handleSelectNav = (view: string) => {
    onSelectView(view);
    // On mobile, auto-close sidebar after selection
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop for mobile drawer */}
      <div
        id="sidebar-overlay-backdrop"
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 left-0 h-full lg:h-full bg-[#080808] flex-col gap-6 flex-shrink-0 z-50 transition-all duration-300 shadow-2xl lg:shadow-none overflow-y-auto scrollbar-thin ${
          isOpen 
            ? "w-72 lg:w-64 p-5 translate-x-0 opacity-100 border-r border-white/5 flex" 
            : "-translate-x-full lg:-translate-x-full w-0 lg:w-0 p-0 lg:p-0 border-r-0 lg:border-r-0 opacity-0 overflow-hidden pointer-events-none lg:pointer-events-none hidden lg:hidden"
        }`}
      >
        {/* Mobile Header Inside Sidebar */}
        <div className="flex items-center justify-between lg:hidden border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <AttoLogo size={24} />
            <span className="text-sm font-bold tracking-tight text-white font-display">ATTO MENU</span>
          </div>
          <button
            id="btn-sidebar-mobile-close"
            onClick={onClose}
            title="Fechar Menu"
            className="p-1.5 rounded-lg border border-white/5 bg-[#111111] text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Group */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 px-2">
            Navegação
          </h3>
          <div className="flex flex-col gap-1">
            {/* Apresentação (Landing) */}
            <button
              id="btn-nav-landing"
              onClick={() => handleSelectNav("landing")}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                currentView === "landing"
                  ? "border-primary/30 bg-primary/10 text-white shadow-sm"
                  : "border-transparent hover:border-white/10 hover:bg-[#111111]/40 text-gray-400 hover:text-white"
              }`}
            >
              <Info className="w-4 h-4 text-zinc-400" />
              <span>Apresentação</span>
            </button>

            {/* Explorador */}
            <button
              id="btn-nav-explore"
              onClick={() => handleSelectNav("explore")}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                currentView === "explore"
                  ? "border-primary/30 bg-primary/10 text-white shadow-sm"
                  : "border-transparent hover:border-white/10 hover:bg-[#111111]/40 text-gray-400 hover:text-white"
              }`}
            >
              <Compass className="w-4 h-4 text-zinc-400" />
              <span>Explorador</span>
            </button>

            {/* Video Player */}
            <button
              id="btn-nav-video-player"
              onClick={() => handleSelectNav("video-player")}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all relative cursor-pointer ${
                currentView === "video-player"
                  ? "border-primary/30 bg-primary/10 text-white shadow-sm"
                  : "border-transparent hover:border-white/10 hover:bg-[#111111]/40 text-gray-400 hover:text-white"
              }`}
            >
              <Film className="w-4 h-4 text-zinc-400" />
              <span>Player de Vídeo</span>
              {hasActiveVideo && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>

            {/* Favoritos */}
            <button
              id="btn-nav-favorites-tab"
              onClick={() => handleSelectNav("favorites")}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                currentView === "favorites"
                  ? "border-primary/30 bg-primary/10 text-white shadow-sm"
                  : "border-transparent hover:border-white/10 hover:bg-[#111111]/40 text-gray-400 hover:text-white"
              }`}
            >
              <Heart className="w-4 h-4 text-zinc-400" />
              <span>Favoritos</span>
            </button>

            {/* Planos Premium */}
            <button
              id="btn-nav-plans-tab"
              onClick={() => handleSelectNav("plans")}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer relative overflow-hidden group ${
                currentView === "plans"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-sm"
                  : "border-transparent hover:border-amber-500/20 hover:bg-amber-950/5 text-gray-400 hover:text-amber-300"
              }`}
            >
              <Sparkles className={`w-4 h-4 text-amber-400 shrink-0 ${currentView === "plans" ? "animate-pulse" : "group-hover:animate-pulse"}`} />
              <span>Planos Premium</span>
              <span className="absolute right-2.5 top-2.5 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
            </button>

            {/* Perfil */}
            <button
              id="btn-nav-profile-tab"
              onClick={() => handleSelectNav("profile")}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                currentView === "profile"
                  ? "border-primary/30 bg-primary/10 text-white shadow-sm"
                  : "border-transparent hover:border-white/10 hover:bg-[#111111]/40 text-gray-400 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              <span>Configurações</span>
            </button>

            {/* Termos e Ajuda */}
            <button
              id="btn-nav-legal"
              onClick={() => handleSelectNav("legal")}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                currentView === "legal"
                  ? "border-primary/30 bg-primary/10 text-white shadow-sm"
                  : "border-transparent hover:border-white/10 hover:bg-[#111111]/40 text-gray-400 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4 text-zinc-400" />
              <span>Termos & Ajuda</span>
            </button>

            {/* Admin panel */}
            {user && user.role === "admin" && (
              <button
                id="btn-nav-admin"
                onClick={() => handleSelectNav("admin")}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  currentView === "admin"
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-sm"
                    : "border-transparent hover:border-white/10 hover:bg-rose-950/10 text-rose-300 hover:text-white"
                }`}
              >
                <Shield className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>Painel Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Downloaders Group */}
        <div className="space-y-3 border-t border-white/5 pt-5">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 px-2">
            Downloaders
          </h3>
          <div className="flex flex-col gap-1">
            <button
              id="btn-nav-dl-youtube"
              onClick={() => handleSelectNav("downloader-youtube")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                currentView === "downloader-youtube"
                  ? "border-red-500/30 bg-red-500/10 text-white shadow-sm"
                  : "border-transparent hover:border-white/10 hover:bg-[#111111]/40 text-gray-400 hover:text-white"
              }`}
            >
              <Youtube className="w-4 h-4 text-red-500" />
              <span>YouTube MP4/MP3</span>
            </button>

            <button
              id="btn-nav-dl-tiktok"
              onClick={() => handleSelectNav("downloader-tiktok")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                currentView === "downloader-tiktok"
                  ? "border-teal-500/30 bg-teal-500/10 text-white shadow-sm"
                  : "border-transparent hover:border-white/10 hover:bg-[#111111]/40 text-gray-400 hover:text-white"
              }`}
            >
              <Play className="w-4 h-4 text-teal-400" />
              <span>TikTok Downloader</span>
            </button>

            <button
              id="btn-nav-dl-instagram"
              onClick={() => handleSelectNav("downloader-instagram")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                currentView === "downloader-instagram"
                  ? "border-pink-500/30 bg-pink-500/10 text-white shadow-sm"
                  : "border-transparent hover:border-white/10 hover:bg-[#111111]/40 text-gray-400 hover:text-white"
              }`}
            >
              <Instagram className="w-4 h-4 text-pink-500" />
              <span>Instagram Reels</span>
            </button>

            <button
              id="btn-nav-dl-spotify"
              onClick={() => handleSelectNav("downloader-spotify")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                currentView === "downloader-spotify"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-white shadow-sm"
                  : "border-transparent hover:border-white/10 hover:bg-[#111111]/40 text-gray-400 hover:text-white"
              }`}
            >
              <Music className="w-4 h-4 text-emerald-500" />
              <span>Spotify MP3</span>
            </button>

            <button
              id="btn-nav-dl-soundcloud"
              onClick={() => handleSelectNav("downloader-soundcloud")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                currentView === "downloader-soundcloud"
                  ? "border-orange-500/30 bg-orange-500/10 text-white shadow-sm"
                  : "border-transparent hover:border-white/10 hover:bg-[#111111]/40 text-gray-400 hover:text-white"
              }`}
            >
              <Music className="w-4 h-4 text-orange-500" />
              <span>SoundCloud Audio</span>
            </button>
          </div>
        </div>

        {/* Dynamic Explore Controls inside Sidebar */}
        {currentView === "explore" && (
          <div className="space-y-5 border-t border-white/5 pt-5">
            <div className="space-y-2">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 px-2">
                Plataformas
              </h3>
              <div className="flex flex-col gap-1">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedPlatform === cat.id;
                  return (
                    <button
                      key={cat.id}
                      id={`sidebar-platform-${cat.id}`}
                      onClick={() => {
                        onSelectPlatform && onSelectPlatform(cat.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`flex items-center gap-3 px-3.5 py-2 rounded-xl border text-xs font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary/40 bg-primary/10 text-white shadow-sm font-bold"
                          : `border-transparent hover:border-white/5 hover:bg-[#111111]/30 text-gray-400 hover:text-white ${cat.color}`
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {history.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                    <History className="w-3 h-3 text-primary" /> Buscas
                  </h3>
                  <button
                    id="btn-sidebar-clear-history"
                    onClick={onClearHistory}
                    className="text-[9px] font-mono uppercase font-bold text-zinc-500 hover:text-red-400 cursor-pointer transition-colors"
                  >
                    Limpar
                  </button>
                </div>
                <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto scrollbar-none">
                  {history.slice(0, 6).map((item, idx) => (
                    <button
                      key={idx}
                      id={`sidebar-history-${idx}`}
                      onClick={() => {
                        onSelectHistory && onSelectHistory(item.query);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-[11px] font-mono text-zinc-400 hover:text-white hover:bg-[#111111]/40 rounded-lg text-left truncate cursor-pointer transition-all border border-transparent hover:border-white/5"
                      title={item.query}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="truncate">{item.query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto space-y-4">
          {/* Connection status/limitations */}
          <div className="border-t border-white/5 pt-4 text-[11px] text-zinc-500 space-y-2">
            <div className="flex items-center gap-1.5 px-2">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-semibold text-zinc-400">Ambiente</span>
            </div>
            <p className="leading-relaxed bg-[#111111]/60 border border-white/5 p-3 rounded-xl text-[10px] text-zinc-400 font-mono">
              Chave de API <b className="text-primary select-all">onnx-ia-key</b> ativa em modo proxy.
            </p>
            <a
              href="https://zero-two-apis.com.br/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between text-[10px] text-zinc-400 hover:text-primary transition-all font-mono border border-white/5 p-2.5 rounded-xl hover:border-white/10 bg-[#111111]/20 cursor-pointer"
            >
              <span>Docs das APIs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
