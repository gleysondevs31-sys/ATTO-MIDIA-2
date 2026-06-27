import React from "react";
import { X, Music, Video, Info, Sparkles, Youtube, Volume2 } from "lucide-react";
import { NormalizedMedia } from "../types";

interface YoutubeChoiceModalProps {
  media: NormalizedMedia | null;
  onClose: () => void;
  onSelectOption: (media: NormalizedMedia, option: "audio" | "video" | "details") => void;
}

export function YoutubeChoiceModal({ media, onClose, onSelectOption }: YoutubeChoiceModalProps) {
  if (!media) return null;

  return (
    <div 
      id="youtube-choice-modal-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        id="youtube-choice-modal-box"
        className="relative bg-[#080808] border border-white/10 rounded-3xl overflow-hidden max-w-md w-full shadow-2xl p-6 md:p-8 space-y-6 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="btn-close-choice-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-all border border-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header decoration */}
        <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-full w-fit border border-rose-500/20 text-[10px] font-mono font-bold uppercase tracking-widest">
          <Youtube className="w-3.5 h-3.5 fill-rose-500" />
          <span>YouTube Multi-Stream</span>
        </div>

        {/* Media Preview Box */}
        <div className="flex gap-4 p-3 bg-[#111111]/80 border border-white/5 rounded-2xl">
          <div className="relative aspect-video w-24 bg-black rounded-lg overflow-hidden shrink-0 border border-white/5">
            <img 
              src={media.thumbnail || undefined} 
              alt={media.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {media.duration && (
              <span className="absolute bottom-1 right-1 bg-black/85 text-[8px] font-mono text-gray-300 px-1 py-0.5 rounded font-bold">
                {media.duration}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <h4 className="text-xs font-semibold text-gray-100 line-clamp-2 leading-snug">
              {media.title}
            </h4>
            <p className="text-[10px] text-gray-400 truncate mt-1">
              por {media.author}
            </p>
          </div>
        </div>

        {/* Core choices title */}
        <div className="space-y-1">
          <h3 className="text-base font-display font-bold text-white">
            Como você deseja reproduzir?
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Nossos servidores de áudio do YouTube estão 100% ativos e super rápidos para você curtir sem interrupções.
          </p>
        </div>

        {/* Option actions stack */}
        <div className="space-y-3">
          {/* OPTION 1: PLAY AUDIO */}
          <button
            id="choice-btn-audio"
            onClick={() => onSelectOption(media, "audio")}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 to-[#111111] hover:from-rose-500/20 hover:to-[#181818] border border-rose-500/25 hover:border-rose-500/40 text-left transition-all duration-300 group cursor-pointer shadow-lg shadow-rose-950/5"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-rose-500 text-white rounded-xl shadow-md shadow-rose-950/20 group-hover:scale-105 transition-transform">
                <Music className="w-5 h-5 fill-white" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider block mb-0.5">Recomendado</span>
                <span className="text-sm font-semibold text-white block">Ouvir apenas Áudio (MP3)</span>
                <span className="text-[10px] text-gray-400">Excelente para músicas, playlists e podcasts</span>
              </div>
            </div>
            <Volume2 className="w-4 h-4 text-rose-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* OPTION 2: PLAY VIDEO */}
          <button
            id="choice-btn-video"
            onClick={() => onSelectOption(media, "video")}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#111111] hover:bg-[#181818] border border-white/5 hover:border-white/10 text-left transition-all duration-300 group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-white/5 text-sky-400 border border-white/10 rounded-xl group-hover:bg-sky-500/10 group-hover:text-sky-400 transition-colors">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider block mb-0.5">Cinema Mode</span>
                <span className="text-sm font-semibold text-white block">Assistir Vídeo (MP4)</span>
                <span className="text-[10px] text-gray-400">Assista ao clipe completo no Player Cinema</span>
              </div>
            </div>
          </button>

          {/* OPTION 3: VIEW DETAILS */}
          <button
            id="choice-btn-details"
            onClick={() => onSelectOption(media, "details")}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer justify-center border border-transparent hover:border-white/5"
          >
            <Info className="w-4 h-4" />
            <span>Ver mais detalhes e opções de Download</span>
          </button>
        </div>

        {/* Footer info banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-300/80 leading-normal">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <span>Note que alguns servidores de vídeo do YouTube sofrem bloqueios de IP, mas os de áudio funcionam 100% do tempo.</span>
        </div>
      </div>
    </div>
  );
}
