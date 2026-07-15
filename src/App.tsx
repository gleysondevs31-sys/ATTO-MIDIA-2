import React, { useState, useEffect, useRef } from "react";
import { get, set } from "idb-keyval";
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
import { AlertCircle, HelpCircle, Film, Sparkles, History, Trash2 } from "lucide-react";
import { useToast } from "./components/Toast";

// Auth and User Account components
import { AuthModal } from "./components/AuthModal";
import { FavoritesView } from "./components/FavoritesView";
import { ProfileView } from "./components/ProfileView";
import { CommunityView } from "./components/CommunityView";
import { PartnersView } from "./components/PartnersView";
import { ImageBankView } from "./components/ImageBankView";
import { LandingPage } from "./components/LandingPage";
import { AdminPanel } from "./components/AdminPanel";

import { LegalView } from "./components/LegalView";
import { DynamicHelmet } from "./components/DynamicHelmet";
import { PlansView } from "./components/PlansView";
import { ProviderDownloader } from "./components/ProviderDownloader";
import { NowPlayingView } from "./components/NowPlayingView";
import { BannerDisplay } from "./components/BannerDisplay";
import { ApiDocsView } from "./components/ApiDocsView";
import { ScrapersDocsView } from "./components/ScrapersDocsView";

export default function App() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [results, setResults] = useState<NormalizedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation View selection
  const [currentView, setCurrentView] = useState<string>("landing");
  const [legalTab, setLegalTab] = useState<"terms" | "privacy" | "conditions" | "links">("terms");

  // State synchronization for Spotify-style Now Playing view
  const [sharedPlayerState, setSharedPlayerState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    isMediaLoading: false,
  });

  const playerControlsRef = useRef<{
    togglePlay: () => void;
    seek: (time: number) => void;
    setVolume: (vol: number) => void;
    toggleMute: () => void;
  } | null>(null);

  // Light/Dark Theme state (White is default)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("atto-theme");
      return saved === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("atto-theme", theme);
    } catch (e) {
      console.warn("Could not save theme:", e);
    }
  }, [theme]);

  // User authentication and database state
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });
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

  const [customPlatforms, setCustomPlatforms] = useState<any[]>([]);

  const fetchPlatforms = () => {
    fetch("/api/platforms")
      .then(res => res.json())
      .then(data => {
        if (data.status && Array.isArray(data.platforms)) {
          setCustomPlatforms(data.platforms);
        }
      })
      .catch(err => {
        console.error("Erro ao carregar plataformas:", err);
      });
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  // Automatically close sidebar when transitioning to full-width/panel screens, or on mobile for any navigation
  useEffect(() => {
    const isPanelScreen = ["admin", "profile", "plans", "legal", "api-docs"].includes(currentView);
    if (isPanelScreen || window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [currentView]);

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
      const cached = await get(`favorites_${authToken}`);
      if (cached && Array.isArray(cached)) setDbFavorites(cached);
    } catch (e) {
      console.warn("Failed to read favorites from IndexedDB", e);
    }

    try {
      const res = await fetch("/api/favorites", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.status && Array.isArray(data.favorites)) {
        setDbFavorites(data.favorites);
        set(`favorites_${authToken}`, data.favorites).catch(err => console.warn("Failed to cache favorites", err));
      }
    } catch (err) {
      console.error("Failed to fetch favorites from PostgreSQL, showing offline cache:", err);
    }
  };

  const fetchDbHistory = async (authToken: string) => {
    try {
      const cached = await get(`history_${authToken}`);
      if (cached && Array.isArray(cached)) setDbHistory(cached);
    } catch (e) {
      console.warn("Failed to read history from IndexedDB", e);
    }

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
        set(`history_${authToken}`, mapped).catch(err => console.warn("Failed to cache history", err));
      }
    } catch (err) {
      console.error("Failed to fetch history from PostgreSQL, showing offline cache:", err);
    }
  };

  const handleLoginSuccess = (authToken: string, userData: any) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem("zerotwo_auth_token", authToken);
    
    // Load databases
    fetchDbFavorites(authToken);
    fetchDbHistory(authToken);

    toast.success("Login realizado", `Bem-vindo(a) de volta, ${userData.username}!`);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setDbFavorites([]);
    setDbHistory([]);
    localStorage.removeItem("zerotwo_auth_token");
    setCurrentView("explore");

    toast.info("Sessão encerrada", "Você saiu da sua conta com sucesso.");
  };

  const handleUpdateProfile = async (updatedData: { username?: string; avatar?: string; bio?: string; theme?: string }) => {
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
        toast.success("Perfil atualizado", "Suas informações de perfil e preferências foram salvas.");
        return true;
      } else {
        throw new Error(data.error || "Erro ao atualizar perfil");
      }
    } catch (err: any) {
      console.error("Profile update failed:", err.message);
      toast.error("Erro ao atualizar perfil", err.message);
      throw err;
    }
  };

  // Synchronize Accent Theme with User Preference
  useEffect(() => {
    const accentTheme = user && user.theme && user.theme !== "dark" ? user.theme : "rose";
    document.documentElement.setAttribute("data-accent-theme", accentTheme);
  }, [user]);

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
          toast.info("Removido dos favoritos", `'${media.title}' foi removido da sua lista.`);
        } else {
          toast.error("Erro ao remover", "Não foi possível remover dos favoritos.");
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
          toast.success("Adicionado aos favoritos", `'${media.title}' foi salvo na sua coleção!`);
        } else {
          toast.error("Erro ao salvar", "Não foi possível adicionar aos favoritos.");
        }
      }
    } catch (err) {
      // Offline fallback
      let newFavs;
      if (isAlreadyFavorite) {
          newFavs = dbFavorites.filter(f => f.originalUrl !== media.originalUrl);
          toast.info("Aviso Offline", "Removido localmente. Será sincronizado quando reconectar.");
      } else {
          newFavs = [{ ...media, created_at: new Date().toISOString() }, ...dbFavorites];
          toast.info("Aviso Offline", "Salvo localmente. Será sincronizado quando reconectar.");
      }
      setDbFavorites(newFavs);
      set(`favorites_${token}`, newFavs).catch(()=>null);
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
        toast.info("Removido dos favoritos", "O item foi removido com sucesso.");
      } else {
        toast.error("Erro ao remover", "Não foi possível remover dos favoritos.");
      }
    } catch (err) {
      // Offline fallback
      const newFavs = dbFavorites.filter(f => f.originalUrl !== originalUrl);
      setDbFavorites(newFavs);
      set(`favorites_${token}`, newFavs).catch(()=>null);
      toast.info("Aviso Offline", "Removido localmente. Será sincronizado quando reconectar.");
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
        toast.info("Histórico limpo", "Seu histórico de pesquisas foi apagado.");
      }
    } catch (err) {
      console.error("Error clearing search history on Postgres:", err);
    }
  };

  const handleClearDbFavorites = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/favorites/clear", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setDbFavorites([]);
        toast.success("Favoritos limpos", "Todos os seus favoritos foram removidos.");
      } else {
        toast.error("Erro", "Não foi possível limpar os favoritos.");
      }
    } catch (err) {
      console.error("Error clearing favorites on Postgres:", err);
      toast.error("Erro de conexão", "Falha ao conectar com o banco de dados.");
    }
  };

  const handleRemoveHistoryItem = async (queryText: string) => {
    if (!token) return;
    try {
      const res = await fetch("/api/history/item", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ query: queryText })
      });
      if (res.ok) {
        setDbHistory(prev => prev.filter(h => h.query !== queryText));
        toast.info("Histórico atualizado", "Consulta removida com sucesso.");
      }
    } catch (err) {
      console.error("Error removing history item on Postgres:", err);
    }
  };

  const handleSearchFromProfile = (q: string) => {
    setQuery(q);
    setCurrentView("explore");
    performSearch(q, selectedPlatform, false);
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
    
    const fetchUser = (authToken: string) => {
      fetch("/api/auth/profile", {
        headers: { "Authorization": `Bearer ${authToken}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Sessão expirada");
      })
      .then(data => {
        if (data.status && data.user) {
          setUser(data.user);
          fetchDbFavorites(authToken);
          fetchDbHistory(authToken);
        }
      })
      .catch(err => {
        console.log("Auto-login failed:", err.message);
        if (authToken) {
          toast.warning("Sessão Expirada", "Sua sessão anterior expirou. Por favor, conecte-se novamente.");
        }
        localStorage.removeItem("zerotwo_auth_token");
        setToken(null);
      });
    };

    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken);
    }

    const onAuthRefresh = () => {
      const currentToken = localStorage.getItem("zerotwo_auth_token");
      if (currentToken) fetchUser(currentToken);
    };
    window.addEventListener("force-auth-refresh", onAuthRefresh);

    // Handle MercadoPago return URLs
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("status");
    const paymentPlan = urlParams.get("plan");

    if (paymentStatus === "success" && paymentPlan && savedToken) {
      toast.success("Pagamento Aprovado!", `Processando seu upgrade para o plano ${paymentPlan.toUpperCase()}...`);
      // Re-trigger the upgrade to actually grant the plan since MP return is client-side in this mock flow
      // In production, this would be a webhook.
      fetch("/api/auth/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${savedToken}`
        },
        body: JSON.stringify({ plan: paymentPlan })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status) {
           toast.success("Assinatura Confirmada!", `Parabéns! Você agora é ${paymentPlan.toUpperCase()}!`);
           window.dispatchEvent(new Event("force-auth-refresh"));
           // clear url
           window.history.replaceState({}, document.title, window.location.pathname);
           setCurrentView("profile");
        }
      })
      .catch(() => toast.error("Erro no upgrade", "Falha ao processar assinatura pós-pagamento."));
    } else if (paymentStatus === "failure") {
       toast.error("Pagamento Recusado", "Infelizmente houve um erro na transação do Mercado Pago.");
       window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === "pending") {
       toast.info("Pagamento Pendente", "Seu pagamento está sendo processado. Você receberá o upgrade em breve.");
       window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Trigger an initial automatic exploration search so the dashboard is beautifully populated on load
    performSearch("lofi chill", "all", false);
    
    return () => {
      window.removeEventListener("force-auth-refresh", onAuthRefresh);
    };
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
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await res.json();
            throw new Error(errData.error || "Ocorreu um erro ao resolver este link.");
          } else {
            throw new Error("A API principal está em manutenção no momento. Tente buscar na barra em vez de colar links.");
          }
        }
        
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("A API principal está em manutenção. Não foi possível extrair a mídia.");
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
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await res.json();
            throw new Error(errData.error || "Não foi possível conectar ao servidor.");
          } else {
            throw new Error("⚠️ A API principal está em manutenção. Estamos operando com recursos limitados.");
          }
        }

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("⚠️ A API principal está em manutenção. Estamos operando com recursos limitados.");
        }
        const data = await res.json();
        if (data.status && Array.isArray(data.results)) {
          setResults(data.results);
          handleAddHistory(searchVal);
          if (token) {
            const newItem = { query: searchVal, timestamp: Date.now() };
            fetch("/api/history", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify(newItem)
            })
            .then(() => fetchDbHistory(token))
            .catch(err => {
              console.error("Postgres history sync error:", err);
              // Offline fallback
              const updatedDbHistory = [newItem, ...dbHistory.filter(h => h.query.toLowerCase() !== searchVal.toLowerCase())].slice(0, 50);
              setDbHistory(updatedDbHistory);
              set(`history_${token}`, updatedDbHistory).catch(()=>null);
            });
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
    <div 
      id="app-root-container" 
      className={`flex flex-col bg-dark-bg text-gray-100 font-sans ${
        currentView === "landing" ? "min-h-screen" : "h-screen overflow-hidden"
      }`}
    >
      <DynamicHelmet
        currentView={currentView}
        query={query}
        selectedPlatform={selectedPlatform}
        activeMedia={activeMedia}
        selectedDetailsMedia={selectedDetailsMedia}
      />
      {currentView === "landing" ? (
        <div id="landing-page-root">
          <LandingPage
            onEnterApp={() => setCurrentView("explore")}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            user={user}
            onSelectLegalView={(tab) => {
              setLegalTab(tab);
              setCurrentView("legal");
            }}
            onSearch={(q) => {
              setQuery(q);
              setCurrentView("explore");
              const isUrl = q.startsWith("http://") || q.startsWith("https://") || q.includes("youtube.com") || q.includes("youtu.be") || q.includes("tiktok.com") || q.includes("instagram.com");
              performSearch(q, selectedPlatform, isUrl);
            }}
            theme={theme}
            onToggleTheme={() => setTheme(prev => prev === "light" ? "dark" : "light")}
            onSelectView={setCurrentView}
            onSelectPlatform={(platform) => setSelectedPlatform(platform)}
          />
        </div>
      ) : (
        <>
          {/* Sleek Translucent Header */}
          <Header 
            user={user} 
            onOpenAuth={() => setIsAuthModalOpen(true)} 
            onLogout={handleLogout}
            onSelectView={setCurrentView}
            currentView={currentView}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
            theme={theme}
            onToggleTheme={() => setTheme(prev => prev === "light" ? "dark" : "light")}
          />

          {/* Main Responsive Body Area */}
          <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
            {/* Navigation Sidebar */}
            <Sidebar
              currentView={currentView}
              onSelectView={setCurrentView}
              hasActiveVideo={activeMedia?.type === "video"}
              user={user}
              selectedPlatform={selectedPlatform}
              onSelectPlatform={handleSelectPlatform}
              history={user ? dbHistory : history}
              onClearHistory={user ? handleClearDbHistory : handleClearHistory}
              onSelectHistory={handleSelectHistory}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />

            {/* Core Main Viewport */}
            <main className={`flex-1 p-6 md:p-8 space-y-8 mx-auto w-full pb-32 transition-all duration-300 overflow-y-auto h-full ${
              isSidebarOpen 
                ? "max-w-7xl" 
                : "max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1680px]"
            }`}>
              
              {currentView.startsWith("downloader-") ? (
                <ProviderDownloader
                  provider={currentView.substring("downloader-".length) as any}
                  onSearch={(q, isUrl) => performSearch(q, currentView.substring("downloader-".length), isUrl)}
                  isLoading={isLoading}
                  results={results.filter(item => item.platform === currentView.substring("downloader-".length))}
                  onPlay={handlePlayMedia}
                  onSelectDetails={handleSelectDetails}
                  activeMediaId={activeMedia?.id}
                  error={error}
                />
              ) : currentView === "explore" ? (
            <>
              {/* Welcome Dashboard Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-[#111111]/80 border border-white/5 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
                <div className="space-y-2 text-center md:text-left z-10">
                  <span className="flex items-center justify-center md:justify-start gap-1.5 text-xs font-mono font-bold text-primary uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" /> Explorador de Mídia Inteligente
                  </span>
                  <h2 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-white animate-fade-in">
                    O que você quer assistir ou ouvir hoje?
                  </h2>
                  <p className="text-sm text-gray-400 max-w-xl">
                    Pesquise por nome de vídeos e músicas do YouTube ou cole um link do TikTok, YouTube ou Reels do Instagram para reproduzir e baixar.
                  </p>
                </div>
                
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse shrink-0">
                  <Film className="w-6 h-6" />
                </div>
              </div>

              <BannerDisplay />

              {/* Interactive Search Section */}
              <div className="bg-[#111111]/30 border border-white/5 p-6 rounded-2xl">
                <SearchBar 
                  onSearch={(q, isUrl) => performSearch(q, selectedPlatform, isUrl)} 
                  isLoading={isLoading}
                  initialQuery={query}
                  selectedPlatform={selectedPlatform}
                />
              </div>



              {/* Results Feed Section */}
              <section className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                    {query ? `Resultados para "${query}"` : "Explorar Mídias Populares"}
                  </h3>
                  
                  <span className="text-xs font-mono text-zinc-500">
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
              favorites={dbFavorites}
              history={dbHistory}
              token={token}
              onClearHistory={handleClearDbHistory}
              onClearFavorites={handleClearDbFavorites}
              onSearchQuery={handleSearchFromProfile}
              onRemoveHistoryItem={handleRemoveHistoryItem}
            />
          ) : currentView === "plans" ? (
            <PlansView
              user={user}
              onUpdateUser={setUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onSelectView={setCurrentView}
            />
          ) : currentView === "now-playing" ? (
            <NowPlayingView
              media={activeMedia}
              isPlaying={sharedPlayerState.isPlaying}
              currentTime={sharedPlayerState.currentTime}
              duration={sharedPlayerState.duration}
              volume={sharedPlayerState.volume}
              isMuted={sharedPlayerState.isMuted}
              onPlayPause={() => playerControlsRef.current?.togglePlay()}
              onPlayNext={handlePlayNext}
              onSeek={(t) => playerControlsRef.current?.seek(t)}
              onVolumeChange={(v) => playerControlsRef.current?.setVolume(v)}
              onMuteToggle={() => playerControlsRef.current?.toggleMute()}
              isAutoplayEnabled={isAutoplayEnabled}
              onToggleAutoplay={handleToggleAutoplay}
              onBack={() => setCurrentView("explore")}
              user={user}
              isFavorited={activeMedia ? dbFavorites.some(f => f.originalUrl === activeMedia.originalUrl) : false}
              onToggleFavorite={activeMedia ? () => handleToggleFavorite(activeMedia) : () => {}}
            />
          ) : currentView === "legal" ? (
            <LegalView
              onBackToExplore={() => setCurrentView("explore")}
              initialTab={legalTab}
            />
          ) : currentView === "scrapers" ? (
            <ScrapersDocsView />
          ) : currentView === "api-docs" ? (
            <ApiDocsView
              user={user}
              token={token}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          ) : currentView === "admin" && user && token ? (
            <AdminPanel
              token={token}
              currentUser={user}
              customPlatforms={customPlatforms}
              onRefreshPlatforms={fetchPlatforms}
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

          {/* Dynamic Panel Footer */}
          {currentView !== "landing" && currentView !== "legal" && (
            <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 font-mono">
              <div>
                ATTO Downloads &copy; 2026 &middot; Conexões encriptadas via HTTPS
              </div>
              <div className="flex items-center gap-4 flex-wrap text-xs md:text-[11px]">
                <button onClick={() => { setLegalTab("terms"); setCurrentView("legal"); }} className="hover:text-white transition-colors cursor-pointer">
                  Termos de Uso
                </button>
                <span>&middot;</span>
                <button onClick={() => { setLegalTab("privacy"); setCurrentView("legal"); }} className="hover:text-white transition-colors cursor-pointer">
                  Privacidade
                </button>
                <span>&middot;</span>
                <button onClick={() => { setLegalTab("conditions"); setCurrentView("legal"); }} className="hover:text-white transition-colors cursor-pointer">
                  Condições
                </button>
                <span>&middot;</span>
                <button onClick={() => { setLegalTab("links"); setCurrentView("legal"); }} className="hover:text-white transition-colors cursor-pointer text-primary font-bold">
                  Links Úteis & FAQ
                </button>
              </div>
            </footer>
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
          onSelectView={setCurrentView}
          onStateChange={setSharedPlayerState}
          registerControls={(ctrls) => { playerControlsRef.current = ctrls; }}
        />
      )}

      {/* Detailed Metadata Modal Popup */}
      <MediaDetailsModal
        media={selectedDetailsMedia}
        onClose={() => setSelectedDetailsMedia(null)}
        onPlay={handlePlayMedia}
        isFavorited={selectedDetailsMedia ? dbFavorites.some(f => f.originalUrl === selectedDetailsMedia.originalUrl) : false}
        onToggleFavorite={selectedDetailsMedia ? () => handleToggleFavorite(selectedDetailsMedia) : undefined}
        user={user}
        onSelectView={setCurrentView}
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
