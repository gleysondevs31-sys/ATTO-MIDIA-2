import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { SearchBar } from "./components/SearchBar";
import { PlatformFilter } from "./components/PlatformFilter";
import { MediaGrid } from "./components/MediaGrid";
import { MediaPlayer } from "./components/MediaPlayer";
import { MediaDetailsModal } from "./components/MediaDetailsModal";
import { YoutubeChoiceModal } from "./components/YoutubeChoiceModal";
import { VideoPlayerPage } from "./components/VideoPlayerPage";
import { LoadingState } from "./components/LoadingState";
import { ErrorState } from "./components/ErrorState";
import { NormalizedMedia, SearchHistoryItem } from "./types";
import { AlertCircle, HelpCircle, Film, Sparkles } from "lucide-react";

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [results, setResults] = useState<NormalizedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation View selection
  const [currentView, setCurrentView] = useState<"explore" | "video-player">("explore");

  // Interactive global player & detail modal states
  const [activeMedia, setActiveMedia] = useState<NormalizedMedia | null>(null);
  const [selectedDetailsMedia, setSelectedDetailsMedia] = useState<NormalizedMedia | null>(null);
  const [youtubeChoiceMedia, setYoutubeChoiceMedia] = useState<NormalizedMedia | null>(null);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zerotwo_search_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load search history:", e);
    }

    // Trigger an initial automatic exploration search so the dashboard is beautifully populated on load
    performSearch("col for the summer hardstyle", "all", false);
  }, []);

  // Save history helper
  const saveHistory = (newHistory: SearchHistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem("zerotwo_search_history", JSON.stringify(newHistory));
  };

  const handleClearHistory = () => {
    saveHistory([]);
  };

  const handleAddHistory = (text: string) => {
    if (text.startsWith("http")) return; // Don't add long URL structures to history list
    const filtered = history.filter(h => h.query.toLowerCase() !== text.toLowerCase());
    const updated = [{ query: text, timestamp: Date.now() }, ...filtered].slice(0, 10);
    saveHistory(updated);
  };

  const handleSelectHistory = (pastQuery: string) => {
    setQuery(pastQuery);
    setCurrentView("explore"); // Switch to explore so they can see results
    performSearch(pastQuery, selectedPlatform, false);
  };

  const handleSelectPlatform = (platformId: string) => {
    setSelectedPlatform(platformId);
    setCurrentView("explore"); // Switch to explore so they can see platform filtered results
    // If we have an existing query, re-run with new platform filter
    if (query.trim()) {
      performSearch(query.trim(), platformId, false);
    } else {
      performSearch("lofi chill", platformId, false); // Keep exploration feed filtered
    }
  };

  // Helper when clicking "Play/Tocar" on any media item
  const handlePlayMedia = (media: NormalizedMedia) => {
    if (media.platform === "youtube" && !media.userSelectedType) {
      setYoutubeChoiceMedia(media);
      return;
    }
    setActiveMedia(media);
    if (media.type === "video") {
      setCurrentView("video-player");
    } else {
      setCurrentView("explore");
    }
  };

  // Intercept details click for YouTube to prompt choice first
  const handleSelectDetails = (media: NormalizedMedia) => {
    if (media.platform === "youtube") {
      setYoutubeChoiceMedia(media);
    } else {
      setSelectedDetailsMedia(media);
    }
  };

  // YouTube audio vs video choice callback
  const handleSelectYoutubeOption = (media: NormalizedMedia, option: "audio" | "video" | "details") => {
    setYoutubeChoiceMedia(null);
    if (option === "audio") {
      handlePlayMedia({
        ...media,
        type: "audio",
        userSelectedType: "audio"
      });
    } else if (option === "video") {
      handlePlayMedia({
        ...media,
        type: "video",
        userSelectedType: "video"
      });
    } else if (option === "details") {
      setSelectedDetailsMedia(media);
    }
  };

  // Central search resolver (handles both text queries and link paste)
  const performSearch = async (searchVal: string, platformId: string, isUrl: boolean) => {
    setIsLoading(true);
    setError(null);
    setQuery(searchVal);

    try {
      if (isUrl) {
        // Resolve social media link via backend proxy POST
        const res = await fetch("/api/media/by-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: searchVal })
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Ocorreu um erro ao resolver este link.");
        }
        
        const data = await res.json();
        if (data.status && data.media) {
          setResults([data.media]);
          // Auto-open detail modal so user can inspect and choose to download or stream the resolved link
          setSelectedDetailsMedia(data.media);
        } else {
          throw new Error("Nenhum metadado de mídia pôde ser extraído.");
        }
      } else {
        // Text keyword search
        const encodedQuery = encodeURIComponent(searchVal);
        const res = await fetch(`/api/search?q=${encodedQuery}&platform=${platformId}`);
        
        if (!res.ok) {
          throw new Error("Não foi possível conectar ao servidor proxy.");
        }

        const data = await res.json();
        if (data.status && Array.isArray(data.results)) {
          setResults(data.results);
          handleAddHistory(searchVal);
        } else {
          throw new Error(data.error || "Erro desconhecido ao carregar resultados.");
        }
      }
    } catch (err: any) {
      console.error("Search failed:", err);
      setError(err.message || "Erro de conexão ao servidor proxy. Verifique se o backend está rodando.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="app-root-container" className="min-h-screen flex flex-col bg-dark-bg text-gray-100 font-sans">
      {/* Sleek Translucent Header */}
      <Header />

      {/* Main Responsive Body Area */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Navigation Sidebar */}
        <Sidebar
          history={history}
          onClearHistory={handleClearHistory}
          onSelectHistory={handleSelectHistory}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={handleSelectPlatform}
          currentView={currentView}
          onSelectView={setCurrentView}
          hasActiveVideo={activeMedia?.type === "video"}
        />

        {/* Core Main Viewport */}
        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full pb-32">
          
          {currentView === "explore" ? (
            <>
              {/* Welcome Dashboard Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-[#111111] border border-white/5 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
                <div className="space-y-2 text-center md:text-left z-10">
                  <span className="flex items-center justify-center md:justify-start gap-1.5 text-xs font-mono font-bold text-primary uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" /> Explorador de Mídia Inteligente
                  </span>
                  <h2 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-white animate-fade-in">
                    O que você quer assistir ou ouvir hoje?
                  </h2>
                  <p className="text-sm text-gray-400 max-w-xl">
                    Pesquise por nome no Spotify e SoundCloud ou cole um link do TikTok, YouTube ou Reels do Instagram para reproduzir e baixar.
                  </p>
                </div>
                
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-primary animate-pulse shrink-0">
                  <Film className="w-8 h-8" />
                </div>
              </div>

              {/* Interactive Search Section */}
              <div className="space-y-6">
                <SearchBar 
                  onSearch={(q, isUrl) => performSearch(q, selectedPlatform, isUrl)} 
                  isLoading={isLoading}
                  initialQuery={query}
                />
                
                {/* Horizontal filters for mobile screens */}
                <div className="block lg:hidden">
                  <PlatformFilter 
                    selectedPlatform={selectedPlatform}
                    onSelectPlatform={handleSelectPlatform}
                  />
                </div>
              </div>

              {/* Results Feed Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-gray-400">
                    {query ? `Resultados para "${query}"` : "Explorar Mídias Populares"}
                  </h3>
                  
                  <span className="text-xs font-mono text-gray-500">
                    {results.length} item(ns) encontrado(s)
                  </span>
                </div>

                {/* View State Rendering */}
                {isLoading ? (
                  <LoadingState />
                ) : error ? (
                  <ErrorState 
                    message={error} 
                    onRetry={() => performSearch(query || "lofi chill", selectedPlatform, query.startsWith("http"))} 
                  />
                ) : (
                  <MediaGrid
                    medias={results}
                    onPlay={handlePlayMedia}
                    onSelectDetails={handleSelectDetails}
                    activeMediaId={activeMedia?.id}
                  />
                )}
              </section>
            </>
          ) : (
            /* Dedicated Cinematic Video Player Page */
            <VideoPlayerPage
              activeMedia={activeMedia?.type === "video" ? activeMedia : null}
              relatedMedias={results}
              onPlay={handlePlayMedia}
              onBackToExplore={() => setCurrentView("explore")}
            />
          )}

        </main>
      </div>

      {/* Persistent Floating Media Player (Only for non-video items, i.e., music/audio) */}
      {activeMedia && activeMedia.type !== "video" && (
        <MediaPlayer
          media={activeMedia}
          onClose={() => setActiveMedia(null)}
        />
      )}

      {/* Detailed Metadata Modal Popup */}
      <MediaDetailsModal
        media={selectedDetailsMedia}
        onClose={() => setSelectedDetailsMedia(null)}
        onPlay={handlePlayMedia}
      />

      {/* YouTube Stream Choice Modal Popup */}
      <YoutubeChoiceModal
        media={youtubeChoiceMedia}
        onClose={() => setYoutubeChoiceMedia(null)}
        onSelectOption={handleSelectYoutubeOption}
      />
    </div>
  );
}
