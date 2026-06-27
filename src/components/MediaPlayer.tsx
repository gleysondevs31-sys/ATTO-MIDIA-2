import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, X, Maximize2, ExternalLink, Music, Video, Loader2, SkipForward } from "lucide-react";
import { NormalizedMedia } from "../types";

interface MediaPlayerProps {
  media: NormalizedMedia | null;
  onClose: () => void;
  isAutoplayEnabled: boolean;
  onToggleAutoplay: () => void;
  onPlayNext: () => void;
}

export function MediaPlayer({ media, onClose, isAutoplayEnabled, onToggleAutoplay, onPlayNext }: MediaPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isMediaLoading, setIsMediaLoading] = useState(true);

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

  const activeElement = media?.type === "video" ? videoRef.current : audioRef.current;

  // Auto play when source loads
  const handleCanPlay = () => {
    setIsMediaLoading(false);
    if (activeElement) {
      activeElement.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log("Auto-play error:", err));
    }
  };

  const handlePlayPause = () => {
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
    if (activeElement) {
      activeElement.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (activeElement) {
      activeElement.volume = val;
      activeElement.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const handleMuteToggle = () => {
    if (!activeElement) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
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
      {media.type === "video" ? (
        <video
          ref={videoRef}
          src={mediaUrl || undefined}
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
          className="hidden"
          onCanPlay={handleCanPlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleAudioError}
          onEnded={handleMediaEnded}
        />
      )}

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-6 justify-between">
        
        {/* Left Section: Media Info */}
        <div className="flex items-center gap-4 w-full md:w-1/4 min-w-0">
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
          
          <div className="min-w-0 flex-1">
            <h5 className="font-display font-semibold text-sm text-gray-100 truncate">
              {media.title}
            </h5>
            <p className="text-xs text-gray-400 truncate font-sans">
              {media.author}
            </p>
            <span className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider block mt-0.5">
              {media.platform}
            </span>
          </div>
        </div>

        {/* Center Section: Playback Controls */}
        <div className="flex-1 w-full max-w-xl flex flex-col gap-2">
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
        <div className="w-full md:w-1/4 flex items-center justify-end gap-4 flex-wrap md:flex-nowrap">
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
    </div>
  );
}
