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

// Auth and User Account components
import { AuthModal } from "./components/AuthModal";
import { FavoritesView } from "./components/FavoritesView";
import { ProfileView } from "./components/ProfileView";
import { LandingPage } from "./components/LandingPage";
import { AdminPanel } from "./components/AdminPanel";

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [results, setResults] = useState<NormalizedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation View selection
  const [currentView, setCurrentView] = useState<"explore" | "video-player" | "favorites" | "profile" | "admin" | "landing">("landing");

  // User authentication and database state
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [dbFavorites, setDbFavorites] = useState<NormalizedMedia[]>([]);
  const [dbHistory, setDbHistory] = useState<SearchHistoryItem[]>([]);

  // Interactive global player & detail modal states
  const [activeMedia, setActiveMedia] = useState<NormalizedMedia | null>(null);
  const [selectedDetailsMedia, setSelectedDetailsMedia] = useState<NormalizedMedia | null>(null);
  const [youtubeChoiceMedia, setYoutubeChoiceMedia] = useState<NormalizedMedia | null>(null);

  // Autoplay state (Default to true)
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("zerotwo_autoplay_enabled");
      return saved !== "false";
    } catch {
      return true;
    }
  });

  const handleToggleAutoplay = () => {
    setIsAutoplayEnabled(prev => {
      const newVal = !prev;
      try {
        localStorage.setItem("zerotwo_autoplay_enabled", String(newVal));
      } catch (err) {
        console.error("Failed to save autoplay preference:", err);
      }
      return newVal;
    });
  };

  // ==========================================
  // POSTGRESQL SYNC & AUTHENTICATION HANDLERS
  // ==========================================
  
  const fetchDbFavorites = async (authToken: string) => {
    try {
      const res = await fetch("/api/favorites", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.status && Array.isArray(data.favorites)) {
        setDbFavorites(data.favorites);
      }
    } catch (err) {
      console.error("Failed to fetch favorites from PostgreSQL:", err);
    }
  };

  const fetchDbHistory = async (authToken: string) => {
    try {
      const res = await fetch("/api/history", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.status && Array.isArray(data.history)) {
        const mapped = data.history.map((h: any) => ({
          query: h.query,
          timestamp: Number(h.timestamp)
        }));
        setDbHistory(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch history from PostgreSQL:", err);
    }
  };

  const handleLoginSuccess = (authToken: string, userData: any) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem("zerotwo_auth_token", authToken);
    
    // Load databases
    fetchDbFavorites(authToken);
    fetchDbHistory(authToken);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setDbFavorites([]);
    setDbHistory([]);
    localStorage.removeItem("zerotwo_auth_token");
    setCurrentView("explore");
  };

  const handleUpdateProfile = async (updatedData: { username?: string; avatar?: string; bio?: string }) => {
    if (!token) return false;
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      if (res.ok && data.status && data.user) {
        setUser(data.user);
        return true;
      } else {
        throw new Error(data.error || "Erro ao atualizar perfil");
      }
    } catch (err: any) {
      console.error("Profile update failed:", err.message);
      throw err;
    }
  };

  const handleToggleFavorite = async (media: NormalizedMedia) => {
    if (!user || !token) {
      setIsAuthModalOpen(true);
      return;
    }

    const isAlreadyFavorite = dbFavorites.some(f => f.originalUrl === media.originalUrl);

    try {
      if (isAlreadyFavorite) {
        const res = await fetch("/api/favorites", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ originalUrl: media.originalUrl })
        });
        if (res.ok) {
          fetchDbFavorites(token);
        }
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(media)
        });
        if (res.ok) {
          fetchDbFavorites(token);
        }
      }
    } catch (err) {
      console.error("Error toggling favorites:", err);
    }
  };

  const handleRemoveFavorite = async (originalUrl: string) => {
    if (!token) return;
    try {
      const res = await fetch("/api/favorites", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ originalUrl })
      });
      if (res.ok) {
        fetchDbFavorites(token);
      }
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  const handleClearDbHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/history", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setDbHistory([]);
      }
    } catch (err) {
      console.error("Error clearing search history on Postgres:", err);
    }
  };

  // Load history & Check session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zerotwo_search_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load search history:", e);
    }

    // Auto login check
    const savedToken = localStorage.getItem("zerotwo_auth_token");
    if (savedToken) {
      setToken(savedToken);
      fetch("/api/auth/profile", {
        headers: { "Authorization": `Bearer ${savedToken}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Sessão expirada");
      })
      .then(data => {
        if (data.status && data.user) {
          setUser(data.user);
          fetchDbFavorites(savedToken);
          fetchDbHistory(savedToken);
        }
      })
      .catch(err => {
        console.log("Auto-login failed:", err.message);
        localStorage.removeItem("zerotwo_auth_token");
        setToken(null);
      });
    }

    // Trigger an initial automatic exploration search so the dashboard is beautifully populated on load
    performSearch("lofi chill", "all", false);
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

  const handlePlayNext = () => {
    if (!activeMedia) return;
    
    if (activeMedia.type === "video") {
      const videosOnly = results.filter(item => item.type === "video");
      const currentIndex = videosOnly.findIndex(item => item.id === activeMedia.id);
      if (currentIndex !== -1 && currentIndex < videosOnly.length - 1) {
        handlePlayMedia(videosOnly[currentIndex + 1]);
      } else if (videosOnly.length > 1) {
        handlePlayMedia(videosOnly[0]);
      }
    } else {
      const audiosOnly = results.filter(item => item.type !== "video");
      const currentIndex = audiosOnly.findIndex(item => item.id === activeMedia.id);
      if (currentIndex !== -1 && currentIndex < audiosOnly.length - 1) {
        handlePlayMedia(audiosOnly[currentIndex + 1]);
      } else if (audiosOnly.length > 1) {
        handlePlayMedia(audiosOnly[0]);
      }
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
          if (token) {
            fetch("/api/history", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ query: searchVal, timestamp: Date.now() })
            })
            .then(() => fetchDbHistory(token))
            .catch(err => console.error("Postgres history sync error:", err));
          }
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
      {currentView === "landing" ? (
        <div id="landing-page-root">
          <LandingPage
            onEnterApp={() => setCurrentView("explore")}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            user={user}
          />
        </div>
      ) : (
        <>
          {/* Sleek Translucent Header */}
          <Header />

          {/* Main Responsive Body Area */}
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Navigation Sidebar */}
            <Sidebar
              history={user ? dbHistory : history}
              onClearHistory={user ? handleClearDbHistory : handleClearHistory}
              onSelectHistory={handleSelectHistory}
              selectedPlatform={selectedPlatform}
              onSelectPlatform={handleSelectPlatform}
              currentView={currentView}
              onSelectView={setCurrentView}
              hasActiveVideo={activeMedia?.type === "video"}
              user={user}
              onOpenAuth={() => setIsAuthModalOpen(true)}
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
          ) : currentView === "favorites" ? (
            <FavoritesView
              favorites={dbFavorites}
              onPlay={handlePlayMedia}
              onSelectDetails={handleSelectDetails}
              onRemoveFavorite={handleRemoveFavorite}
              activeMediaId={activeMedia?.id}
            />
          ) : currentView === "profile" && user ? (
            <ProfileView
              user={user}
              onUpdateProfile={handleUpdateProfile}
              onLogout={handleLogout}
              favoritesCount={dbFavorites.length}
              historyCount={dbHistory.length}
            />
          ) : currentView === "admin" && user && token ? (
            <AdminPanel
              token={token}
              currentUser={user}
            />
          ) : (
            /* Dedicated Cinematic Video Player Page */
            <VideoPlayerPage
              activeMedia={activeMedia?.type === "video" ? activeMedia : null}
              relatedMedias={results}
              onPlay={handlePlayMedia}
              onBackToExplore={() => setCurrentView("explore")}
              isAutoplayEnabled={isAutoplayEnabled}
              onToggleAutoplay={handleToggleAutoplay}
            />
          )}

        </main>
      </div>
    </>
  )}

      {/* Persistent Floating Media Player (Only for non-video items, i.e., music/audio) */}
      {activeMedia && activeMedia.type !== "video" && (
        <MediaPlayer
          media={activeMedia}
          onClose={() => setActiveMedia(null)}
          isAutoplayEnabled={isAutoplayEnabled}
          onToggleAutoplay={handleToggleAutoplay}
          onPlayNext={handlePlayNext}
        />
      )}

      {/* Detailed Metadata Modal Popup */}
      <MediaDetailsModal
        media={selectedDetailsMedia}
        onClose={() => setSelectedDetailsMedia(null)}
        onPlay={handlePlayMedia}
        isFavorited={selectedDetailsMedia ? dbFavorites.some(f => f.originalUrl === selectedDetailsMedia.originalUrl) : false}
        onToggleFavorite={selectedDetailsMedia ? () => handleToggleFavorite(selectedDetailsMedia) : undefined}
      />

      {/* YouTube Stream Choice Modal Popup */}
      <YoutubeChoiceModal
        media={youtubeChoiceMedia}
        onClose={() => setYoutubeChoiceMedia(null)}
        onSelectOption={handleSelectYoutubeOption}
      />

      {/* Auth Modal Overlay */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
