import React, { useState, useEffect } from "react";
import { Search, Link, X, Loader2, PlayCircle } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string, isUrl: boolean) => void;
  isLoading: boolean;
  initialQuery?: string;
}

export function SearchBar({ onSearch, isLoading, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const detectIsUrl = (text: string): boolean => {
    try {
      const trimmed = text.trim();
      return trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes(".com") || trimmed.includes(".be");
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const isUrl = detectIsUrl(query);
    onSearch(query.trim(), isUrl);
  };

  const handleClear = () => {
    setQuery("");
  };

  const isUrl = detectIsUrl(query);

  return (
    <form id="search-bar-form" onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="relative flex flex-col md:flex-row gap-3">
        {/* Main Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-500">
            {isUrl ? (
              <Link className="w-5 h-5 text-primary animate-pulse" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>
          
          <input
            id="input-media-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquise por música/artista ou cole uma URL do TikTok, YouTube ou Instagram..."
            className="w-full bg-[#111111] border border-white/10 focus:border-[#f43f5e]/50 focus:ring-1 focus:ring-[#f43f5e]/30 text-white rounded-full py-4.5 pl-12 pr-12 text-sm transition-all shadow-inner outline-none placeholder:text-gray-600"
          />

          {query && (
            <button
              id="btn-clear-search"
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-5 flex items-center text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Action Button */}
        <button
          id="btn-submit-search"
          type="submit"
          disabled={isLoading || !query.trim()}
          className={`px-7 py-4.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 select-none shadow-md ${
            isLoading || !query.trim()
              ? "bg-[#111111] text-gray-600 border border-white/5 cursor-not-allowed"
              : isUrl
              ? "bg-gradient-to-br from-[#f43f5e] to-[#9f1239] hover:opacity-95 active:scale-98 text-white shadow-lg shadow-rose-950/35 cursor-pointer"
              : "bg-white hover:bg-gray-150 text-[#050505] active:scale-98 cursor-pointer"
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isUrl ? (
            <PlayCircle className="w-4 h-4" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>{isUrl ? "Resolver Link" : "Buscar Mídia"}</span>
        </button>
      </div>

      {/* Input Hint */}
      <div className="flex items-center gap-4 text-xs text-zinc-500 px-1 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Cole links: TikTok, Instagram Reels, YouTube Videos</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          <span>Busca por texto: Spotify e Soundcloud</span>
        </div>
      </div>
    </form>
  );
}
