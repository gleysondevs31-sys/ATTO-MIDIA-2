import React, { useRef, useState, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Download, 
  ExternalLink, 
  ArrowLeft, 
  Clock, 
  Film, 
  Loader2, 
  Music, 
  ChevronDown, 
  ChevronUp, 
  Youtube, 
  Sparkles,
  RefreshCw,
  SkipForward
} from "lucide-react";
import { NormalizedMedia, formatDuration } from "../types";
import { useToast } from "./Toast";
import { AudioEqualizer } from "./AudioEqualizer";

export function getYoutubeVideoId(media: any): string {
  if (!media) return "";
  
  const extractFromUrl = (url: string): string | null => {
    if (!url) return null;
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2] && match[2].length === 11) {
        return match[2];
      }
      
      const urlObj = new URL(url);
      const vParam = urlObj.searchParams.get("v");
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
        return vParam;
      }
      
      const pathParts = urlObj.pathname.split("/");
      for (const part of pathParts) {
        if (part && part.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(part)) {
          return part;
        }
      }
    } catch (e) {
      const match = url.match(/[?&]v=([^&#]+)/) || url.match(/youtu\.be\/([^&#?]+)/);
      if (match && match[1] && match[1].length === 11) {
        return match[1];
      }
    }
    return null;
  };

  if (typeof media.id === "string") {
    const idTrimmed = media.id.trim();
    if (idTrimmed.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(idTrimmed)) {
      return idTrimmed;
    }
    const extracted = extractFromUrl(idTrimmed);
    if (extracted) return extracted;
  }

  if (media.originalUrl) {
    const extracted = extractFromUrl(media.originalUrl);
    if (extracted) return extracted;
  }

  if (media.playableVideoUrl) {
    const extracted = extractFromUrl(media.playableVideoUrl);
    if (extracted) return extracted;
  }
  if (media.playableAudioUrl) {
    const extracted = extractFromUrl(media.playableAudioUrl);
    if (extracted) return extracted;
  }

  return media.id || "";
}

interface VideoPlayerPageProps {
  activeMedia: NormalizedMedia | null;
  relatedMedias: NormalizedMedia[];
  onPlay: (media: NormalizedMedia) => void;
  onBackToExplore: () => void;
  isAutoplayEnabled: boolean;
  onToggleAutoplay: () => void;
}

export function VideoPlayerPage({ 
  activeMedia, 
  relatedMedias, 
  onPlay, 
  onBackToExplore,
  isAutoplayEnabled,
  onToggleAutoplay
}: VideoPlayerPageProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Video playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  // YouTube API Player Refs
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);

  // Load YouTube script on mount if not already present
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }, []);

  // Filter related media to video items only, excluding the currently playing one
  const videosOnly = relatedMedias.filter(
    (item) => item.type === "video" && item.id !== activeMedia?.id
  );

  // Set default quality when media options change
  useEffect(() => {
    if (!activeMedia) return;
    if (activeMedia.medias && activeMedia.medias.length > 0) {
      const defaultOption = activeMedia.medias.find(
        (m) => m.quality === "360p" || m.quality === "480p"
      ) || activeMedia.medias[0];
      setSelectedQuality(defaultOption.quality);
    } else {
      setSelectedQuality("");
    }
    setError(null);
    setDescExpanded(false);
  }, [activeMedia]);

  // Construct final playable URL
  useEffect(() => {
    if (!activeMedia) {
      setMediaUrl("");
      return;
    }

    if (activeMedia.platform === "youtube") {
      setMediaUrl("");
      setIsLoading(true);
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }

    let rawUrl = "";
    if (activeMedia.medias && activeMedia.medias.length > 0 && selectedQuality) {
      const option = activeMedia.medias.find((m) => m.quality === selectedQuality);
      if (option) rawUrl = option.url;
    } else {
      rawUrl = activeMedia.playableVideoUrl || activeMedia.playableAudioUrl || "";
    }

    if (rawUrl) {
      if (activeMedia.platform === "tiktok" || activeMedia.platform === "instagram") {
        setMediaUrl(`/api/media/stream-proxy?url=${encodeURIComponent(rawUrl)}`);
      } else {
        setMediaUrl(rawUrl);
      }
    } else {
      setMediaUrl("");
    }

    setIsLoading(true);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [activeMedia, selectedQuality]);

  // Re-create or load YouTube Player
  useEffect(() => {
    if (!activeMedia || activeMedia.platform !== "youtube") {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
        ytPlayerRef.current = null;
      }
      return;
    }

    let isDestroyed = false;
    let pollInterval: any = null;
    const ytVideoId = getYoutubeVideoId(activeMedia);

    const initYTPlayer = () => {
      if (isDestroyed || !ytContainerRef.current) return;

      const YT = (window as any).YT;

      // Reuse existing player if possible
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
        setIsLoading(true);
        setIsPlaying(false);
        setCurrentTime(0);
        try {
          ytPlayerRef.current.loadVideoById({
            videoId: ytVideoId,
            suggestedQuality: "default"
          });
        } catch (err) {
          console.error("Failed loading video ID into existing YT cinema player, recreating:", err);
          createNewPlayer(YT);
        }
        return;
      }

      createNewPlayer(YT);
    };

    const createNewPlayer = (YT: any) => {
      if (!ytContainerRef.current) return;

      const playerDiv = document.createElement("div");
      playerDiv.id = `yt-player-cinema-${Math.random().toString(36).substr(2, 9)}`;
      ytContainerRef.current.innerHTML = "";
      ytContainerRef.current.appendChild(playerDiv);

      try {
        ytPlayerRef.current = new YT.Player(playerDiv.id, {
          videoId: ytVideoId,
          height: "100%",
          width: "100%",
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 1,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              if (isDestroyed) return;
              setIsLoading(false);
              event.target.setVolume(volume * 100);
              if (isMuted) {
                event.target.mute();
              } else {
                event.target.unMute();
              }
              event.target.playVideo();
              setDuration(event.target.getDuration() || 0);
            },
            onStateChange: (event: any) => {
              if (isDestroyed) return;
              if (event.data === YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setIsLoading(false);
                setDuration(event.target.getDuration() || 0);
              } else if (event.data === YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === YT.PlayerState.BUFFERING) {
                setIsLoading(true);
              } else if (event.data === YT.PlayerState.ENDED) {
                setIsPlaying(false);
                if (isAutoplayEnabled) {
                  handleSkipNext();
                }
              }
            },
            onError: (event: any) => {
              if (isDestroyed) return;
              setIsLoading(false);
              setError("O vídeo do YouTube não permite reprodução incorporada ou possui restrições.");
              console.error("YouTube Player Error in Cinema Mode:", event.data);
            }
          }
        });
      } catch (err) {
        console.error("Failed to create YT player in Cinema mode:", err);
      }
    };

    const checkAndInit = () => {
      const YT = (window as any).YT;
      if (YT && YT.Player) {
        initYTPlayer();
      } else {
        pollInterval = setInterval(() => {
          const innerYT = (window as any).YT;
          if (innerYT && innerYT.Player) {
            clearInterval(pollInterval);
            initYTPlayer();
          }
        }, 100);
      }
    };

    checkAndInit();

    return () => {
      isDestroyed = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [activeMedia, getYoutubeVideoId(activeMedia)]);

  // Poll current time for YouTube player progress bar
  useEffect(() => {
    if (!isPlaying || !activeMedia || activeMedia.platform !== "youtube" || !ytPlayerRef.current) return;

    const interval = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
        setCurrentTime(ytPlayerRef.current.getCurrentTime());
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isPlaying, activeMedia, getYoutubeVideoId(activeMedia)]);

  // Handle Video events (for non-YouTube HTML5 players)
  const handleCanPlay = () => {
    setIsLoading(false);
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Video auto-play error:", err));
    }
  };

  const handlePlayPause = () => {
    if (activeMedia?.platform === "youtube" && ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === "function") {
      const state = ytPlayerRef.current.getPlayerState();
      if (state === 1) { // playing
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
      return;
    }

    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Playback failed:", err);
          setError("Falha ao iniciar reprodução de vídeo.");
        });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (activeMedia?.platform === "youtube" && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      ytPlayerRef.current.seekTo(val, true);
      setCurrentTime(val);
      return;
    }

    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);

    if (activeMedia?.platform === "youtube" && ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === "function") {
      ytPlayerRef.current.setVolume(val * 100);
      ytPlayerRef.current.setMuted(val === 0);
      return;
    }

    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (activeMedia?.platform === "youtube" && ytPlayerRef.current && typeof ytPlayerRef.current.mute === "function") {
      if (nextMuted) {
        ytPlayerRef.current.mute();
      } else {
        ytPlayerRef.current.unMute();
        if (volume === 0) {
          setVolume(0.5);
          ytPlayerRef.current.setVolume(50);
        }
      }
      return;
    }

    if (!videoRef.current) return;
    videoRef.current.muted = nextMuted;
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const handleFullscreen = () => {
    if (activeMedia?.platform === "youtube" && ytPlayerRef.current && typeof ytPlayerRef.current.getIframe === "function") {
      const iframe = ytPlayerRef.current.getIframe();
      if (iframe) {
        if (iframe.requestFullscreen) {
          iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) {
          iframe.webkitRequestFullscreen();
        }
      }
      return;
    }

    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen(); // Safari support
      }
    }
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setError("O player de vídeo falhou ao carregar a mídia. A URL upstream pode ter expirado ou exige requisição autenticada.");
  };

  const handleSkipNext = () => {
    if (!activeMedia) return;
    const currentIndex = relatedMedias.findIndex((item) => item.id === activeMedia.id);
    if (currentIndex !== -1 && currentIndex < relatedMedias.length - 1) {
      const nextMedia = relatedMedias.slice(currentIndex + 1).find((item) => item.type === "video");
      if (nextMedia) {
        onPlay(nextMedia);
        return;
      }
    }
    // Wrap around
    const firstVideo = relatedMedias.find((item) => item.type === "video");
    if (firstVideo && firstVideo.id !== activeMedia.id) {
      onPlay(firstVideo);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (isAutoplayEnabled) {
      handleSkipNext();
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  // Setup download links
  const isYoutube = activeMedia?.platform === "youtube";
  const isTikTok = activeMedia?.platform === "tiktok";

  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

  const handleDownload = async (e: React.MouseEvent<HTMLAnchorElement>, url: string, filename: string) => {
    e.preventDefault();
    if (downloadingUrl) return;
    setDownloadingUrl(url);
    toast.success("Download iniciado", `Processando ${filename}... isso pode levar alguns minutos dependendo do tamanho.`);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro no servidor");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download Concluído", `O arquivo ${filename} foi salvo com sucesso no seu dispositivo!`);
    } catch (err) {
      toast.error("Falha no Download", "Ocorreu um erro ao processar o arquivo.");
    } finally {
      setDownloadingUrl(null);
    }
  };

  const audioDownloadUrl = activeMedia
    ? isYoutube
      ? `/api/media/yt-download?type=audio&url=${encodeURIComponent(activeMedia.originalUrl || "")}`
      : activeMedia.playableAudioUrl
        ? `/api/media/download-proxy?url=${encodeURIComponent(activeMedia.playableAudioUrl)}&filename=${encodeURIComponent(activeMedia.title + " - Audio.mp3")}`
        : null
    : null;

  const videoDownloadUrl = activeMedia
    ? isYoutube
      ? `/api/media/yt-download?type=video&url=${encodeURIComponent(activeMedia.originalUrl || "")}`
      : isTikTok && activeMedia.playableVideoUrl
        ? `/api/media/download-proxy?url=${encodeURIComponent(activeMedia.playableVideoUrl)}&filename=${encodeURIComponent(activeMedia.title + " - Video.mp4")}`
        : activeMedia.playableVideoUrl
          ? `/api/media/download-proxy?url=${encodeURIComponent(activeMedia.playableVideoUrl)}&filename=${encodeURIComponent(activeMedia.title + " - Video.mp4")}`
          : null
    : null;

  const isValidDownloadUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    const urlLower = url.toLowerCase();
    if (urlLower.includes("url=undefined") || urlLower.includes("url=null") || urlLower.includes("url=&") || urlLower.endsWith("url=")) {
      return false;
    }
    return true;
  };

  const isAudioValid = isValidDownloadUrl(audioDownloadUrl);
  const isVideoValid = isValidDownloadUrl(videoDownloadUrl);

  // Determine aspect ratio for aesthetic responsiveness
  // TikTok is typically tall/portrait (9:16), YouTube/Instagram Reels vary but we adapt
  const isPortrait = isTikTok || activeMedia?.title?.toLowerCase().includes("shorts") || activeMedia?.originalUrl?.toLowerCase().includes("shorts") || activeMedia?.originalUrl?.toLowerCase().includes("/reel/");

  if (!activeMedia) {
    return (
      <div id="video-player-empty-state" className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mb-6 shadow-md">
          <Film className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-display font-extrabold text-white mb-2">
          Nenhum vídeo em reprodução
        </h3>
        <p className="text-sm text-gray-400 max-w-md mb-6 leading-relaxed">
          Navegue pelas plataformas ou use a barra de busca para encontrar vídeos do YouTube ou TikTok e iniciá-los aqui no Player Cinema.
        </p>
        <button
          onClick={onBackToExplore}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-zinc-950 bg-white hover:bg-gray-150 rounded-xl transition-all shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para o Explorador</span>
        </button>
      </div>
    );
  }

  return (
    <div id="video-player-page-container" className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start animate-fade-in">
      
      {/* LEFT COLUMN: Main Cinematic Player & Video details */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Navigation back header */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onBackToExplore}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-400 hover:text-white bg-[#111111]/60 hover:bg-[#111111] border border-white/5 hover:border-white/10 rounded-xl transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Explorador</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-[#111111]/30 px-3 py-1.5 rounded-lg border border-white/5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Modo de Exibição Cinema</span>
          </div>
        </div>

        {/* Dynamic Aspect Ratio Video Container */}
        <div 
          className={`relative bg-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden mx-auto group ${
            isPortrait 
              ? "max-w-sm aspect-[9/16]" 
              : "w-full aspect-video"
          }`}
        >
          {/* HTML5 Native Video Tag */}
          {mediaUrl && activeMedia.platform !== "youtube" && (
            <video
              ref={videoRef}
              src={mediaUrl}
              crossOrigin="anonymous"
              className="w-full h-full object-contain"
              onCanPlay={handleCanPlay}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleVideoError}
              onEnded={handleVideoEnded}
              controls={false} // Use custom styled controls!
            />
          )}

          {/* YouTube Player Native Embed */}
          {activeMedia && activeMedia.platform === "youtube" && (
            <div ref={ytContainerRef} className="w-full h-full" />
          )}

          {/* Loading Indicator Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3 z-10">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <span className="text-xs font-mono text-gray-400">Carregando fonte de mídia...</span>
            </div>
          )}

          {/* Error Message Overlay */}
          {error && (
            <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center gap-4 z-10">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Falha ao reproduzir vídeo</h4>
                <p className="text-xs text-gray-400 max-w-sm mt-1 leading-relaxed">
                  {error}
                </p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar Novamente</span>
              </button>
            </div>
          )}

          {/* CUSTOM STYLED CINEMA PLAYER CONTROLS (Floating Overlay) */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-20">
            {/* Playback timeline slider */}
            <div className="flex items-center gap-3 w-full">
              <span className="text-[10px] font-mono text-gray-300 drop-shadow-sm min-w-[32px]">
                {formatTime(currentTime)}
              </span>
              <input
                id="cinema-timeline-slider"
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 bg-white/25 rounded-lg appearance-none cursor-pointer accent-primary hover:h-2 transition-all"
              />
              <span className="text-[10px] font-mono text-gray-300 drop-shadow-sm">
                {formatTime(duration)}
              </span>
            </div>

            {/* Quick buttons & volume */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  id="btn-cinema-play-pause"
                  onClick={handlePlayPause}
                  disabled={isLoading || !!error}
                  className="p-2 bg-white text-zinc-950 rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  title={isPlaying ? "Pausar" : "Tocar"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-zinc-950" /> : <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />}
                </button>

                <button
                  id="btn-cinema-next"
                  onClick={handleSkipNext}
                  disabled={isLoading}
                  className="p-2 bg-[#111111]/80 hover:bg-[#1a1a1a] text-white border border-white/5 hover:border-white/15 rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  title="Próximo Vídeo (Autoplay)"
                >
                  <SkipForward className="w-3.5 h-3.5 fill-white" />
                </button>

                {/* Volume slider */}
                <div className="flex items-center gap-1.5 group/vol">
                  <button
                    onClick={handleMuteToggle}
                    className="text-gray-300 hover:text-white transition-colors p-1"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    id="cinema-volume-slider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white opacity-0 group-hover/vol:opacity-100 focus/vol:opacity-100 transition-opacity duration-200"
                  />
                </div>

                {/* Quality options selector if available */}
                {activeMedia.medias && activeMedia.medias.length > 0 && (
                  <select
                    id="cinema-quality-select"
                    value={selectedQuality}
                    onChange={(e) => setSelectedQuality(e.target.value)}
                    className="bg-black/60 border border-white/10 text-[10px] font-mono text-white rounded px-1.5 py-1 outline-none cursor-pointer"
                  >
                    {activeMedia.medias.map((opt) => (
                      <option key={opt.quality} value={opt.quality} className="bg-zinc-950 text-white">
                        {opt.quality} ({opt.extension})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Action utilities right side */}
              <div className="flex items-center gap-2">
                {/* Autoplay status button */}
                <button
                  id="btn-cinema-autoplay-toggle"
                  onClick={onToggleAutoplay}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all border ${
                    isAutoplayEnabled 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
                      : "bg-[#111111]/80 text-gray-400 border-white/5 hover:border-white/10"
                  }`}
                  title={isAutoplayEnabled ? "Desativar Reprodução Automática" : "Ativar Reprodução Automática"}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isAutoplayEnabled ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
                  <span>AUTOPLAY: {isAutoplayEnabled ? "LIGADO" : "DESLIGADO"}</span>
                </button>

                <div className="relative flex items-center">
                  <AudioEqualizer 
                    videoRef={videoRef} 
                    activeType="video"
                    disabled={activeMedia.platform === "youtube"}
                  />
                </div>

                <button
                  onClick={handleFullscreen}
                  className="p-1.5 text-gray-300 hover:text-white transition-colors"
                  title="Tela Cheia"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video metadata information */}
        <div className="bg-[#111111]/40 border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  activeMedia.platform === "youtube"
                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                    : activeMedia.platform === "tiktok"
                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                      : "bg-white/10 text-gray-400 border border-white/10"
                }`}>
                  {activeMedia.platform}
                </span>
                
                {activeMedia.duration && (
                  <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" />
                    {formatDuration(activeMedia.duration)}
                  </span>
                )}
              </div>
              <h1 className="text-lg md:text-xl font-display font-bold text-white leading-tight">
                {activeMedia.title}
              </h1>
              <p className="text-sm text-gray-400 font-sans">
                Por: <span className="font-semibold text-gray-200">{activeMedia.author}</span>
              </p>
            </div>

            {activeMedia.originalUrl && (
              <a
                href={activeMedia.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-[#111111] border border-white/5 rounded-xl hover:border-white/15 transition-all self-start md:self-auto"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Original</span>
              </a>
            )}
          </div>

          {/* Download card drawer */}
          <div className="border-t border-white/5 pt-4">
            <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">
              Área de Download Direto (Proxy Rápido)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Download Audio MP3 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-300 truncate">Converter para Áudio</p>
                  <p className="text-[10px] text-gray-500 font-mono">Formato .MP3</p>
                </div>
                {isAudioValid ? (
                  <a
                    href={audioDownloadUrl!}
                    download={`${activeMedia.title} - Audio.mp3`}
                    onClick={(e) => handleDownload(e, audioDownloadUrl!, `${activeMedia.title} - Audio.mp3`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    {downloadingUrl === audioDownloadUrl ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{downloadingUrl === audioDownloadUrl ? "Baixando..." : "Baixar"}</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-[#111111] border border-white/5 rounded-lg cursor-not-allowed select-none"
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                    <span>Aguardando Link...</span>
                  </button>
                )}
              </div>

              {/* 2. Download Video MP4 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-300 truncate">Baixar Vídeo</p>
                  <p className="text-[10px] text-gray-500 font-mono">Formato .MP4</p>
                </div>
                {isVideoValid ? (
                  <a
                    href={videoDownloadUrl!}
                    download={`${activeMedia.title} - Video.mp4`}
                    onClick={(e) => handleDownload(e, videoDownloadUrl!, `${activeMedia.title} - Video.mp4`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    {downloadingUrl === videoDownloadUrl ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{downloadingUrl === videoDownloadUrl ? "Baixando..." : "Baixar"}</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-[#111111] border border-white/5 rounded-lg cursor-not-allowed select-none"
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                    <span>Aguardando Link...</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description expandable panel */}
          {activeMedia.description && (
            <div className="border-t border-white/5 pt-4">
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="flex items-center justify-between w-full text-xs font-mono font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
              >
                <span>Descrição da Mídia</span>
                {descExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {descExpanded && (
                <div className="mt-3 text-xs md:text-sm text-gray-400 leading-relaxed bg-[#0a0a0a]/55 border border-white/5 p-4 rounded-xl whitespace-pre-wrap max-h-56 overflow-y-auto">
                  {activeMedia.description}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Recommended Video items */}
      <div className="space-y-4 xl:sticky xl:top-4 self-start">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300">
              Vídeos Relacionados
            </h3>
          </div>
          <span className="text-[10px] font-mono text-gray-500">
            {videosOnly.length} recomendado(s)
          </span>
        </div>

        {videosOnly.length === 0 ? (
          <div className="p-6 bg-[#111111]/30 border border-white/5 rounded-2xl text-center space-y-2">
            <p className="text-xs text-gray-500 font-sans leading-relaxed">
              Sem mais vídeos nos resultados de pesquisa ativos. Faça uma busca por termos como "música", "trend" ou "videoclipe" para preencher esta lista.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] xl:max-h-[80vh] overflow-y-auto pr-1">
            {videosOnly.map((item) => (
              <div
                key={item.id}
                onClick={() => onPlay(item)}
                className="flex gap-3 p-2.5 rounded-xl bg-[#111111]/40 hover:bg-[#111111] border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-24 bg-black/40 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={item.thumbnail || undefined}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  
                  {item.duration && (
                    <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[8px] font-mono text-gray-300 font-bold">
                      {formatDuration(item.duration)}
                    </span>
                  )}
                </div>

                {/* Content info */}
                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-200 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5 font-sans">
                      {item.author}
                    </p>
                  </div>
                  
                  <span className={`text-[8px] font-mono font-bold uppercase self-start px-1.5 py-0.5 rounded ${
                    item.platform === "youtube"
                      ? "bg-rose-500/10 text-rose-500"
                      : "bg-sky-500/10 text-sky-400"
                  }`}>
                    {item.platform}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
