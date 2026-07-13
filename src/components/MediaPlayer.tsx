import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, X, Maximize2, ExternalLink, Music, Video, Loader2, SkipForward, Share2 } from "lucide-react";
import { NormalizedMedia } from "../types";
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

interface MediaPlayerProps {
  media: NormalizedMedia | null;
  onClose: () => void;
  isAutoplayEnabled: boolean;
  onToggleAutoplay: () => void;
  onPlayNext: () => void;
  onSelectView?: (view: string) => void;
  onStateChange?: (state: any) => void;
  registerControls?: (controls: any) => void;
}

export function MediaPlayer({
  media,
  onClose,
  isAutoplayEnabled,
  onToggleAutoplay,
  onPlayNext,
  onSelectView,
  onStateChange,
  registerControls
}: MediaPlayerProps) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleShare = () => {
    if (!media || !media.originalUrl) return;
    navigator.clipboard.writeText(media.originalUrl)
      .then(() => {
        toast.success("Link copiado!", "O link original da mídia foi copiado para a área de transferência.");
      })
      .catch((err) => {
        console.error("Falha ao copiar link:", err);
        toast.error("Erro ao compartilhar", "Não foi possível copiar o link.");
      });
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isMediaLoading, setIsMediaLoading] = useState(true);

  const activeElement = media?.type === "video" ? videoRef.current : audioRef.current;

  // YT API Player Refs
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);

  // Load YouTube script on mount
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.onerror = () => {
        console.warn("YouTube standard iframe_api failed (possibly SSL/Cert issue), trying nocookie...");
        const fallbackTag = document.createElement("script");
        fallbackTag.src = "https://www.youtube-nocookie.com/iframe_api";
        fallbackTag.onerror = () => {
          console.error("Both YouTube iframe API URLs failed to load.");
        };
        const firstScript = document.getElementsByTagName("script")[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(fallbackTag, firstScript);
        } else {
          document.head.appendChild(fallbackTag);
        }
      };
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }, []);

  // Sync state changes with the parent App component for the NowPlayingView
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isMediaLoading
      });
    }
  }, [isPlaying, currentTime, duration, volume, isMuted, isMediaLoading, onStateChange]);

  // Register interactive controls for the NowPlayingView
  useEffect(() => {
    if (registerControls) {
      registerControls({
        togglePlay: () => {
          if (media?.platform === "youtube" && ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === "function") {
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

          if (!activeElement) return;
          if (isPlaying) {
            activeElement.pause();
            setIsPlaying(false);
          } else {
            activeElement.play()
              .then(() => setIsPlaying(true))
              .catch(err => console.log("Play failed:", err));
          }
        },
        seek: (time: number) => {
          if (media?.platform === "youtube" && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
            ytPlayerRef.current.seekTo(time, true);
            setCurrentTime(time);
            return;
          }

          if (activeElement) {
            activeElement.currentTime = time;
            setCurrentTime(time);
          }
        },
        setVolume: (vol: number) => {
          setVolume(vol);
          setIsMuted(vol === 0);

          if (media?.platform === "youtube" && ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === "function") {
            ytPlayerRef.current.setVolume(vol * 100);
            if (vol === 0) {
              ytPlayerRef.current.mute();
            } else {
              ytPlayerRef.current.unMute();
            }
            return;
          }

          if (activeElement) {
            activeElement.volume = vol;
            activeElement.muted = vol === 0;
          }
        },
        toggleMute: () => {
          const nextMuted = !isMuted;
          setIsMuted(nextMuted);

          if (media?.platform === "youtube" && ytPlayerRef.current && typeof ytPlayerRef.current.mute === "function") {
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

          if (!activeElement) return;
          activeElement.muted = nextMuted;
          if (!nextMuted && volume === 0) {
            setVolume(0.5);
            activeElement.volume = 0.5;
          }
        }
      });
    }
  }, [isPlaying, volume, isMuted, mediaUrl, registerControls, activeElement, media, isPlaying]);

  // Set selected quality if media options are available
  useEffect(() => {
    if (!media) return;
    if (media.medias && media.medias.length > 0) {
      // Prioritize 360p or 480p or the first video
      const defaultOption = media.medias.find(m => m.quality === "360p" || m.quality === "480p") || media.medias[0];
      setSelectedQuality(defaultOption.quality);
    } else {
      setSelectedQuality("");
    }
  }, [media]);

  // Construct final playable URL
  useEffect(() => {
    if (!media) {
      setMediaUrl("");
      return;
    }
    // If it is YouTube, we do not need custom direct stream extraction URLs
    if (media.platform === "youtube") {
      setMediaUrl("");
      setIsMediaLoading(true);
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }

    let rawUrl = "";
    if (media.medias && media.medias.length > 0 && selectedQuality) {
      const option = media.medias.find(m => m.quality === selectedQuality);
      if (option) rawUrl = option.url;
    } else {
      rawUrl = media.type === "audio" ? (media.playableAudioUrl || media.playableVideoUrl || "") : (media.playableVideoUrl || media.playableAudioUrl || "");
    }

    if (rawUrl) {
      // Direct stream proxies for CORS/hotlinking issues
      if (media.platform === "soundcloud" || media.platform === "tiktok" || media.platform === "instagram") {
        setMediaUrl(`/api/media/stream-proxy?url=${encodeURIComponent(rawUrl)}`);
      } else {
        setMediaUrl(rawUrl);
      }
    } else {
      setMediaUrl("");
    }
    
    setIsMediaLoading(true);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [media, selectedQuality]);

  // Initialize and recreate YT Player
  useEffect(() => {
    if (!media || media.platform !== "youtube") {
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
    const ytVideoId = getYoutubeVideoId(media);

    const initYTPlayer = () => {
      if (isDestroyed || !ytContainerRef.current) return;

      const YT = (window as any).YT;

      // If there is already an active player and loadVideoById is available, reuse it
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
        setIsMediaLoading(true);
        setIsPlaying(false);
        setCurrentTime(0);
        try {
          ytPlayerRef.current.loadVideoById({
            videoId: ytVideoId,
            suggestedQuality: "default"
          });
        } catch (err) {
          console.error("Failed loading video ID into existing YT player, re-creating:", err);
          createNewPlayer(YT);
        }
        return;
      }

      createNewPlayer(YT);
    };

    const createNewPlayer = (YT: any) => {
      if (!ytContainerRef.current) return;
      
      const playerDiv = document.createElement("div");
      playerDiv.id = `yt-player-el-${Math.random().toString(36).substr(2, 9)}`;
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
            fs: 0,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              if (isDestroyed) return;
              setIsMediaLoading(false);
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
              // Player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
              if (event.data === YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setIsMediaLoading(false);
                setDuration(event.target.getDuration() || 0);
              } else if (event.data === YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === YT.PlayerState.BUFFERING) {
                setIsMediaLoading(true);
              } else if (event.data === YT.PlayerState.ENDED) {
                setIsPlaying(false);
                if (isAutoplayEnabled) {
                  onPlayNext();
                }
              }
            },
            onError: (event: any) => {
              if (isDestroyed) return;
              setIsMediaLoading(false);
              console.error("YouTube Player API Error:", event.data);
              // Fallback: Skip if error playing
              if (isAutoplayEnabled) {
                onPlayNext();
              }
            }
          }
        });
      } catch (err) {
        console.error("Failed to create YT player:", err);
      }
    };

    const checkAndInit = () => {
      const YT = (window as any).YT;
      if (YT && YT.Player) {
        initYTPlayer();
      } else {
        let attempts = 0;
        pollInterval = setInterval(() => {
          attempts++;
          const innerYT = (window as any).YT;
          if (innerYT && innerYT.Player) {
            clearInterval(pollInterval);
            initYTPlayer();
          } else if (attempts >= 50) { // 5 seconds
            clearInterval(pollInterval);
            setIsMediaLoading(false);
            toast.error("Erro no Player", "Não foi possível carregar o reprodutor do YouTube (Erro de SSL/Rede). Tente abrir em uma nova aba.");
            console.error("YouTube iframe API load timeout.");
          }
        }, 100);
      }
    };

    checkAndInit();

    return () => {
      isDestroyed = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [media, getYoutubeVideoId(media)]);

  // Poll current time for YouTube player progress bar
  useEffect(() => {
    if (!isPlaying || !media || media.platform !== "youtube" || !ytPlayerRef.current) return;

    const interval = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
        setCurrentTime(ytPlayerRef.current.getCurrentTime());
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isPlaying, media, getYoutubeVideoId(media)]);

  // Auto play when source loads (for non-YouTube HTML5 players)
  const handleCanPlay = () => {
    setIsMediaLoading(false);
    if (activeElement) {
      activeElement.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log("Auto-play error:", err));
    }
  };

  const handlePlayPause = () => {
    if (media?.platform === "youtube" && ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === "function") {
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

    if (!activeElement) return;
    if (isPlaying) {
      activeElement.pause();
      setIsPlaying(false);
    } else {
      activeElement.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log("Play failed:", err));
    }
  };

  const handleTimeUpdate = () => {
    if (activeElement) {
      setCurrentTime(activeElement.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (activeElement) {
      setDuration(activeElement.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (media?.platform === "youtube" && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      ytPlayerRef.current.seekTo(val, true);
      setCurrentTime(val);
      return;
    }

    if (activeElement) {
      activeElement.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);

    if (media?.platform === "youtube" && ytPlayerRef.current) {
      if (typeof ytPlayerRef.current.setVolume === "function") {
        ytPlayerRef.current.setVolume(val * 100);
      }
      if (val === 0) {
        if (typeof ytPlayerRef.current.mute === "function") {
          ytPlayerRef.current.mute();
        }
      } else {
        if (typeof ytPlayerRef.current.unMute === "function") {
          ytPlayerRef.current.unMute();
        }
      }
      return;
    }

    if (activeElement) {
      activeElement.volume = val;
      activeElement.muted = val === 0;
    }
  };

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (media?.platform === "youtube" && ytPlayerRef.current && typeof ytPlayerRef.current.mute === "function") {
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

    if (!activeElement) return;
    activeElement.muted = nextMuted;
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      activeElement.volume = 0.5;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  const handleVideoError = () => {
    setIsMediaLoading(false);
    console.error("HTML5 video playback failure");
  };

  const handleAudioError = () => {
    setIsMediaLoading(false);
    console.error("HTML5 audio playback failure");
  };

  const handleMediaEnded = () => {
    setIsPlaying(false);
    if (isAutoplayEnabled) {
      onPlayNext();
    }
  };

  const hasQualities = media?.medias && media.medias.length > 0;

  if (!media) return null;

  return (
    <div id="global-floating-player" className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 border-t border-white/5 backdrop-blur-xl shadow-2xl p-4 md:p-6 transition-all duration-300">
      {/* Hidden Players */}
      {media.platform === "youtube" ? (
        <div ref={ytContainerRef} className="hidden" />
      ) : media.type === "video" ? (
        <video
          ref={videoRef}
          src={mediaUrl || undefined}
          crossOrigin="anonymous"
          className="hidden"
          onCanPlay={handleCanPlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleVideoError}
          onEnded={handleMediaEnded}
        />
      ) : (
        <audio
          ref={audioRef}
          src={mediaUrl || undefined}
          crossOrigin="anonymous"
          className="hidden"
          onCanPlay={handleCanPlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleAudioError}
          onEnded={handleMediaEnded}
        />
      )}

      {/* Progress Timeline for Mobile (super slim progress indicator at the very top edge of player container) */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden">
        <div 
          className="bg-[#f43f5e] h-full transition-all duration-300"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>

      {/* Desktop Layout (Hidden on mobile) */}
      <div className="hidden md:flex max-w-7xl mx-auto flex-row items-center gap-6 justify-between">
        
        {/* Left Section: Media Info */}
        <div className="flex items-center gap-4 w-1/4 min-w-0">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/5 shadow-md">
            {media.thumbnail ? (
              <img 
                src={media.thumbnail || undefined} 
                alt={media.title} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <Music className="w-5 h-5" />
              </div>
            )}
            
            {/* Spinning Indicator */}
            {isMediaLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
            )}
          </div>
          
          <div className="min-w-0 flex-1 group/title">
            <div className="flex items-center gap-1.5 justify-between">
              <h5 
                onClick={() => onSelectView && onSelectView("now-playing")}
                className="font-display font-semibold text-sm text-gray-100 hover:text-primary transition-colors cursor-pointer truncate flex-1"
                title="Clique para ver letra e detalhes da música"
              >
                {media.title}
              </h5>
              <button
                onClick={() => onSelectView && onSelectView("now-playing")}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-all opacity-100 xs:opacity-50 hover:opacity-100 group-hover/title:opacity-100"
                title="Expandir para tela cheia (Letra & Detalhes)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 truncate font-sans">
              por {media.author}
            </p>
            <span className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider block mt-0.5">
              {media.platform}
            </span>
          </div>
        </div>

        {/* Center Section: Playback Controls */}
        <div className="flex-1 max-w-xl flex flex-col gap-2">
          {/* Controls row */}
          <div className="flex items-center justify-center gap-4">
            {/* Play/Pause */}
            <button
              id="btn-player-play-pause"
              onClick={handlePlayPause}
              disabled={isMediaLoading}
              className={`p-3 rounded-full text-zinc-950 shadow-md transition-all ${
                isMediaLoading 
                  ? "bg-[#111111] text-gray-600 cursor-not-allowed" 
                  : "bg-white hover:bg-gray-150 active:scale-95 cursor-pointer"
              }`}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-zinc-950" />
              ) : (
                <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />
              )}
            </button>

            {/* Skip Next */}
            <button
              id="btn-player-next"
              onClick={onPlayNext}
              disabled={isMediaLoading}
              className={`p-2.5 rounded-full border border-white/5 transition-all ${
                isMediaLoading
                  ? "text-gray-600 bg-transparent cursor-not-allowed"
                  : "text-gray-300 hover:text-white bg-[#111111]/80 hover:bg-[#1a1a1a] hover:border-white/10 active:scale-95 cursor-pointer"
              }`}
              title="Próxima Faixa (Autoplay)"
            >
              <SkipForward className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>

          {/* Progress Timeline slider */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-[10px] font-mono text-gray-500 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              id="player-timeline-slider"
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            />
            <span className="text-[10px] font-mono text-gray-500 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right Section: Volume & Utilities */}
        <div className="w-1/4 flex items-center justify-end gap-4">
          {/* Quality Selector (YouTube only) */}
          {hasQualities && (
            <div className="flex items-center gap-1 bg-[#111111] border border-white/5 rounded-lg px-2 py-1">
              <span className="text-[9px] font-mono text-gray-500">QUALIDADE:</span>
              <select
                id="select-media-quality"
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                className="bg-transparent border-none text-[10px] font-mono text-white outline-none cursor-pointer"
              >
                {media.medias?.map((opt) => (
                  <option key={opt.quality} value={opt.quality} className="bg-black text-white text-[10px] font-mono">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Autoplay Toggle */}
          <button
            id="btn-player-autoplay-toggle"
            onClick={onToggleAutoplay}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all border ${
              isAutoplayEnabled 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
                : "bg-[#111111]/80 text-gray-500 border-white/5 hover:border-white/10"
            }`}
            title={isAutoplayEnabled ? "Desativar Reprodução Automática" : "Ativar Reprodução Automática"}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAutoplayEnabled ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
            <span>AUTOPLAY: {isAutoplayEnabled ? "ON" : "OFF"}</span>
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              id="btn-player-mute"
              onClick={handleMuteToggle}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              id="player-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          <div className="h-4 w-px bg-white/5 hidden md:block" />
          
          <div className="relative flex items-center">
            <AudioEqualizer 
              audioRef={audioRef} 
              videoRef={videoRef} 
              activeType={media.type as "audio" | "video"}
              disabled={media.platform === "youtube"}
            />
          </div>

          {/* Share Button */}
          <button
            id="btn-player-share"
            onClick={handleShare}
            className="text-gray-400 hover:text-white transition-colors p-1 bg-[#111111] hover:bg-[#1a1a1a] rounded-md border border-white/5 cursor-pointer"
            title="Compartilhar Mídia"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Close Player */}
          <button
            id="btn-player-close"
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1 bg-[#111111] hover:bg-[#1a1a1a] rounded-md border border-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Mobile Layout (Sleek, slim & premium) */}
      <div className="flex md:hidden items-center justify-between w-full gap-3 pt-1">
        {/* Left Section: Info (opens full screen detail view on tap) */}
        <div 
          onClick={() => onSelectView && onSelectView("now-playing")}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        >
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/5 shadow-md">
            {media.thumbnail ? (
              <img 
                src={media.thumbnail || undefined} 
                alt={media.title} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <Music className="w-4 h-4" />
              </div>
            )}
            
            {/* Loading Spinner */}
            {isMediaLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h5 className="font-display font-semibold text-xs text-gray-100 truncate">
              {media.title}
            </h5>
            <p className="text-[10px] text-gray-400 truncate">
              {media.author}
            </p>
          </div>
        </div>

        {/* Right Section: Compact Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            disabled={isMediaLoading}
            className={`p-2 rounded-full text-zinc-950 shadow-sm transition-all ${
              isMediaLoading 
                ? "bg-[#111111] text-gray-600" 
                : "bg-white hover:bg-gray-150 active:scale-95"
            }`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-zinc-950" />
            ) : (
              <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />
            )}
          </button>

          {/* Skip Next */}
          <button
            onClick={onPlayNext}
            disabled={isMediaLoading}
            className="p-2 rounded-full bg-[#111111] border border-white/5 text-gray-300 hover:text-white active:scale-95"
            title="Próxima Faixa"
          >
            <SkipForward className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Close Player */}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#111111] border border-white/5 text-gray-500 hover:text-white"
            title="Fechar Reprodutor"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
