import React, { useState } from "react";
import { Star, LayoutGrid, Heart, Music, Play, Youtube, Trash2, Search, Film } from "lucide-react";
import { NormalizedMedia } from "../types";

interface FavoritesViewProps {
  favorites: NormalizedMedia[];
  onPlay: (media: NormalizedMedia) => void;
  onSelectDetails: (media: NormalizedMedia) => void;
  onRemoveFavorite: (originalUrl: string) => void;
  activeMediaId?: string;
}

export function FavoritesView({
  favorites,
  onPlay,
  onSelectDetails,
  onRemoveFavorite,
  activeMediaId,
}: FavoritesViewProps) {
  const [localFilter, setLocalFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const platforms = [
    { id: "all", name: "Todos", icon: LayoutGrid },
    { id: "youtube", name: "YouTube", icon: Youtube },
    { id: "soundcloud", name: "Soundcloud", icon: Music },
    { id: "spotify", name: "Spotify", icon: Music },
    { id: "tiktok", name: "TikTok", icon: Play },
  ];

  // Apply filters
  const filteredFavorites = favorites.filter((item) => {
    const matchesPlatform = localFilter === "all" || item.platform === localFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  return (
    <div id="favorites-view-container" className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#18080c] to-[#0a0a0a] border border-rose-950/10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 text-center md:text-left z-10">
          <span className="flex items-center justify-center md:justify-start gap-1.5 text-xs font-mono font-bold text-rose-500 uppercase tracking-widest">
            <Star className="w-3.5 h-3.5 fill-rose-500 animate-pulse" /> Playlists e Bookmarks Persistentes
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-white">
            Seus Favoritos Salvos
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl">
            Todas as faixas de áudio e vídeos salvos em sua conta, armazenados com segurança no banco de dados PostgreSQL do Railway.
          </p>
        </div>

        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
          <Heart className="w-8 h-8 fill-rose-500/20" />
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0d0d0d] border border-white/5 p-4 rounded-xl">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            id="favorites-search-input"
            type="text"
            placeholder="Filtrar favoritos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500/50 transition-colors"
          />
        </div>

        {/* Platform Selection */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {platforms.map((p) => {
            const Icon = p.icon;
            const isSelected = localFilter === p.id;
            return (
              <button
                key={p.id}
                id={`btn-favorites-filter-${p.id}`}
                onClick={() => setLocalFilter(p.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                  isSelected
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-sm"
                    : "bg-[#111111] border-white/5 hover:border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Favorites Display */}
      {filteredFavorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-white/5 bg-[#111111]/10">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-600 mb-4">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-300">Nenhum favorito encontrado</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm leading-relaxed">
            {searchQuery || localFilter !== "all"
              ? "Não encontramos mídias salvas que atendam aos filtros aplicados."
              : "Pesquise mídias no Explorador e clique em 'Favoritar' para criar sua biblioteca persistente!"}
          </p>
        </div>
      ) : (
        <div id="favorites-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredFavorites.map((media) => {
            const isPlayingNow = activeMediaId === media.id;
            return (
              <div
                key={media.originalUrl}
                className="group relative flex flex-col bg-[#111111]/40 border border-white/5 hover:border-white/10 rounded-xl overflow-hidden transition-all hover:scale-[1.02] shadow-md hover:shadow-xl hover:shadow-black/25"
              >
                {/* Thumbnail & Badges */}
                <div className="relative aspect-video overflow-hidden bg-zinc-950">
                  <img
                    src={media.thumbnail}
                    alt={media.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Platform Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-black/85 border border-white/10 text-white backdrop-blur-sm shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>{media.platform}</span>
                  </div>

                  {/* Play Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                    <button
                      id={`btn-favorites-play-hover-${media.id}`}
                      onClick={() => onPlay(media)}
                      className="p-3.5 rounded-full bg-rose-500 hover:bg-rose-400 text-white shadow-lg active:scale-95 transition-all transform scale-90 group-hover:scale-100 cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>

                {/* Body Text */}
                <div className="flex-1 p-4 flex flex-col justify-between gap-3 bg-[#0d0d0d]/80">
                  <div className="space-y-1.5">
                    <h4
                      onClick={() => onSelectDetails(media)}
                      className="text-xs font-semibold text-white tracking-tight leading-snug line-clamp-2 cursor-pointer hover:text-rose-400 transition-colors"
                    >
                      {media.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-medium truncate">
                      por {media.author}
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase bg-[#111111] border border-white/5 px-2 py-0.5 rounded-md">
                      {media.type === "video" ? "VÍDEO" : "ÁUDIO"}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Play Button */}
                      <button
                        id={`btn-favorites-play-${media.id}`}
                        onClick={() => onPlay(media)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer border ${
                          isPlayingNow
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-white/5 border-white/5 hover:border-white/10 text-white hover:bg-white/10"
                        }`}
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>{isPlayingNow ? "TOCANDO" : "TOCAR"}</span>
                      </button>

                      {/* Remove Button */}
                      <button
                        id={`btn-favorites-remove-${media.id}`}
                        onClick={() => onRemoveFavorite(media.originalUrl || "")}
                        title="Remover dos Favoritos"
                        className="p-1.5 rounded-lg border border-white/5 bg-[#111111] hover:bg-rose-950/15 text-zinc-500 hover:text-rose-400 hover:border-rose-500/20 transition-all cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
