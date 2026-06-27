import React from "react";
import { History, LayoutGrid, Music, HelpCircle, Trash2, ExternalLink, Youtube, Play, Check, Compass, Film } from "lucide-react";
import { SearchHistoryItem } from "../types";

interface SidebarProps {
  history: SearchHistoryItem[];
  onClearHistory: () => void;
  onSelectHistory: (query: string) => void;
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
  currentView: "explore" | "video-player";
  onSelectView: (view: "explore" | "video-player") => void;
  hasActiveVideo: boolean;
}

export function Sidebar({
  history,
  onClearHistory,
  onSelectHistory,
  selectedPlatform,
  onSelectPlatform,
  currentView,
  onSelectView,
  hasActiveVideo
}: SidebarProps) {
  
  const platforms = [
    { id: "all", name: "Tudo", icon: LayoutGrid, color: "text-zinc-400 border-white/5 bg-[#111111]" },
    { id: "youtube", name: "YouTube", icon: Youtube, color: "text-rose-500 border-rose-950/20 bg-rose-950/5" },
    { id: "soundcloud", name: "Soundcloud", icon: Music, color: "text-orange-500 border-orange-950/20 bg-orange-950/5" },
    { id: "spotify", name: "Spotify", icon: Music, color: "text-emerald-500 border-emerald-950/20 bg-emerald-950/5" },
    { id: "tiktok", name: "TikTok", icon: Play, color: "text-sky-400 border-sky-950/20 bg-sky-950/5" }
  ];

  return (
    <aside id="app-sidebar" className="w-full lg:w-72 bg-[#080808] border-r border-white/5 p-6 flex flex-col gap-6 flex-shrink-0">
      
      {/* View Switcher Tabs */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
          Navegação Principal
        </h3>
        <div className="flex flex-col gap-1.5">
          {/* Explorar tab */}
          <button
            id="btn-nav-explore"
            onClick={() => onSelectView("explore")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
              currentView === "explore"
                ? "border-primary/40 bg-primary/10 text-white shadow-md shadow-primary/5"
                : "border-white/5 hover:border-white/15 bg-[#111111]/30 text-gray-400 hover:text-white"
            }`}
          >
            <Compass className="w-4 h-4 text-gray-400" />
            <span>Explorador</span>
          </button>

          {/* Video Player tab */}
          <button
            id="btn-nav-video-player"
            onClick={() => onSelectView("video-player")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all relative ${
              currentView === "video-player"
                ? "border-sky-500/40 bg-sky-500/10 text-white shadow-md shadow-sky-500/5"
                : "border-white/5 hover:border-white/15 bg-[#111111]/30 text-gray-400 hover:text-white"
            }`}
          >
            <Film className="w-4 h-4 text-sky-400" />
            <span>Player de Vídeo</span>
            
            {hasActiveVideo && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Platform Navigator */}
      <div className="space-y-3 border-t border-white/5 pt-5">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
          Navegar Plataformas
        </h3>
        <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 scrollbar-none">
          {platforms.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedPlatform === p.id;
            return (
              <button
                key={p.id}
                id={`btn-platform-${p.id}`}
                onClick={() => onSelectPlatform(p.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? "border-primary/40 bg-primary/10 text-white shadow-md shadow-primary/5"
                    : "border-white/5 hover:border-white/15 bg-[#111111]/30 text-gray-400 hover:text-white"
                }`}
              >
                <div className={`p-1.5 rounded-lg border ${p.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{p.name}</span>
                {isSelected && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary hidden lg:block animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search History */}
      <div className="flex-1 flex flex-col min-h-[200px] border-t border-white/5 pt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-gray-500">
            <History className="w-3.5 h-3.5" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
              Histórico
            </h3>
          </div>
          {history.length > 0 && (
            <button
              id="btn-clear-history"
              onClick={onClearHistory}
              title="Limpar histórico"
              className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-[#111111]/20 border border-dashed border-white/5 rounded-xl">
            <p className="text-xs text-gray-600">Nenhuma busca recente</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto max-h-[250px] lg:max-h-none space-y-1.5 pr-1">
            {history.map((h, i) => (
              <button
                key={i}
                id={`history-item-${i}`}
                onClick={() => onSelectHistory(h.query)}
                className="w-full text-left flex items-center justify-between px-3 py-2 text-xs rounded-lg bg-[#111111]/40 hover:bg-[#111111] border border-white/5 hover:border-white/10 transition-all text-gray-400 hover:text-white group"
              >
                <span className="truncate pr-2">{h.query}</span>
                <span className="text-[10px] text-gray-600 group-hover:text-primary transition-colors font-mono">
                  Buscar
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info Card / Sandbox limitations */}
      <div className="border-t border-white/5 pt-5 text-xs text-gray-500 space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-medium text-gray-400">Sobre o Token</span>
        </div>
        <p className="leading-relaxed bg-[#111111]/40 border border-white/5 p-3 rounded-lg text-[11px] font-sans text-gray-400">
          Esta plataforma utiliza a chave de API <b className="text-primary font-mono select-all">onnx-ia-key</b> no backend proxy. Seus dados estão seguros e as credenciais ocultas de requisições client-side.
        </p>
        <a
          href="https://zero-two-apis.com.br/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between text-[11px] text-gray-400 hover:text-primary transition-colors font-mono border border-white/5 p-2.5 rounded-lg hover:border-white/10 bg-[#111111]/20"
        >
          <span>Acessar Doc Oficial</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
}
