import React, { useEffect, useState, useRef } from "react";
import { Play, Pause, SkipForward, Volume2, VolumeX, ArrowLeft, Heart, Share2, Music, Youtube, RefreshCw, Zap, Crown, Check, AlertCircle } from "lucide-react";
import { NormalizedMedia } from "../types";
import { useToast } from "./Toast";

interface NowPlayingViewProps {
  media: NormalizedMedia | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onPlayPause: () => void;
  onPlayNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;
  isAutoplayEnabled: boolean;
  onToggleAutoplay: () => void;
  onBack: () => void;
  user: any;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

export function NowPlayingView({
  media,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onPlayPause,
  onPlayNext,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  isAutoplayEnabled,
  onToggleAutoplay,
  onBack,
  user,
  isFavorited,
  onToggleFavorite
}: NowPlayingViewProps) {
  const { toast } = useToast();
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeLyricIndex, setActiveLyricIndex] = useState(0);

  // Generate dynamic aesthetic mock lyrics based on the title
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);

  useEffect(() => {
    if (!media) return;

    // Create custom flowing lyrics that match the song rhythm
    const title = media.title;
    const author = media.author || "Artista";
    const songLyrics = [
      { time: 0, text: "🎵 [Instrumental Intro]" },
      { time: 5, text: `Você está ouvindo "${title}"` },
      { time: 12, text: `Uma obra incrível de ${author}` },
      { time: 18, text: "Transmitido em alta fidelidade pelo Atto Downloads" },
      { time: 25, text: "Sentindo as batidas subirem no peito..." },
      { time: 32, text: "✨ [Refrão Principal]" },
      { time: 38, text: "Nada se compara a essa energia no ar" },
      { time: 44, text: "Cada acorde conta uma história real" },
      { time: 50, text: "Tudo o que eu preciso é deixar o som rolar" },
      { time: 56, text: "E mergulhar nessa harmonia surreal" },
      { time: 62, text: "🎹 [Solo de Teclado & Sintetizador]" },
      { time: 70, text: "O tempo para quando essa música toca" },
      { time: 78, text: "Memórias antigas voltam a acender" },
      { time: 85, text: "E o futuro parece que quer florescer" },
      { time: 92, text: "✨ [Refrão Principal]" },
      { time: 98, text: "Nada se compara a essa energia no ar" },
      { time: 104, text: "Cada acorde conta uma história real" },
      { time: 110, text: "Tudo o que eu preciso é deixar o som rolar" },
      { time: 116, text: "E mergulhar nessa harmonia surreal" },
      { time: 125, text: "🍃 [Transição Suave]" },
      { time: 132, text: "Obrigado por apoiar nosso reprodutor" },
      { time: 140, text: "Qualidade premium sem anúncios ou barreiras" },
      { time: 148, text: "Elevando sua experiência multimídia todos os dias" },
      { time: 155, text: "🎤 [Vocal Outro]" },
      { time: 162, text: "Deixe a música te guiar até o fim..." },
      { time: 170, text: "Deixe levar..." },
      { time: 180, text: "🎵 [Fim da Faixa - Atto Downloads]" }
    ];

    setLyrics(songLyrics);
  }, [media]);

  // Synchronize active lyric line index with playback currentTime
  useEffect(() => {
    if (lyrics.length === 0) return;
    const activeIndex = lyrics.findIndex(
      (lyric, idx) =>
        currentTime >= lyric.time &&
        (idx === lyrics.length - 1 || currentTime < lyrics[idx + 1].time)
    );
    if (activeIndex !== -1 && activeIndex !== activeLyricIndex) {
      setActiveLyricIndex(activeIndex);
      // Smoothly scroll active lyric into view
      if (lyricsContainerRef.current) {
        const activeLineElement = lyricsContainerRef.current.children[activeIndex] as HTMLElement;
        if (activeLineElement) {
          lyricsContainerRef.current.scrollTo({
            top: activeLineElement.offsetTop - lyricsContainerRef.current.offsetHeight / 2 + 30,
            behavior: "smooth"
          });
        }
      }
    }
  }, [currentTime, lyrics, activeLyricIndex]);

  if (!media) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#050505] text-zinc-400">
        <Music className="w-16 h-16 mb-4 text-zinc-600 animate-pulse" />
        <h3 className="text-lg font-bold font-display text-white">Nenhuma música tocando no momento</h3>
        <p className="text-xs text-zinc-500 mt-2 max-w-sm">
          Retorne ao explorador e escolha uma faixa de áudio ou vídeo para reproduzir em alta fidelidade.
        </p>
        <button
          onClick={onBack}
          className="mt-6 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-rose-950/30 transition-all cursor-pointer"
        >
          Voltar ao Explorador
        </button>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  const getPlatformGlow = () => {
    switch (media.platform) {
      case "spotify":
        return "shadow-emerald-500/20 border-emerald-500/30 text-emerald-400";
      case "soundcloud":
        return "shadow-orange-500/20 border-orange-500/30 text-orange-400";
      case "youtube":
        return "shadow-red-500/20 border-red-500/30 text-red-400";
      default:
        return "shadow-rose-500/20 border-rose-500/35 text-primary";
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] w-full overflow-hidden rounded-3xl border border-white/5 bg-[#050505]/95 p-6 md:p-8 lg:p-12">
      {/* Immersive Blurred Background Glow mirroring the Album Art */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 blur-[120px] pointer-events-none scale-110"
        style={{ backgroundImage: `url(${media.thumbnail})` }}
      />
      
      {/* Top action header */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-5 mb-6 md:mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs font-semibold text-gray-200 transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Explorador</span>
        </button>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary uppercase tracking-wider">
            {user?.plan ? `Plano Ativo: ${user.plan}` : "Plano: Grátis"}
          </span>
          <span className="text-xs font-mono font-bold text-zinc-500">
            Tocador Inteligente v2.4
          </span>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column: Rotating Vinyl / Album Art */}
        <div className="lg:col-span-5 flex flex-col items-center text-center space-y-6">
          <div className="relative group">
            {/* Ambient rotating ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary via-orange-500 to-amber-500 opacity-20 blur-xl scale-105 pointer-events-none" />
            
            {/* Main artwork element */}
            <div className={`relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 bg-[#111111] shadow-2xl transition-all duration-700 ${getPlatformGlow()} ${isPlaying ? "animate-spin-slow" : ""}`}>
              {media.thumbnail ? (
                <img 
                  src={media.thumbnail} 
                  alt={media.title} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 bg-zinc-900">
                  <Music className="w-20 h-20 mb-2" />
                  <span className="text-xs font-mono">Sem Album Art</span>
                </div>
              )}
              
              {/* Vinyl center cutout hole */}
              <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#050505] border-4 border-zinc-900/80 flex items-center justify-center shadow-inner z-10">
                <div className="w-3 h-3 rounded-full bg-zinc-800" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-display font-extrabold text-white tracking-tight line-clamp-2 px-4 leading-tight">
              {media.title}
            </h2>
            <p className="text-sm text-zinc-400 font-sans truncate max-w-sm mx-auto">
              por {media.author}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{media.platform} Premium Stream</span>
            </div>
          </div>

          {/* Equalizer Waveform animation */}
          <div className="h-8 flex items-end justify-center gap-[4px] w-48 pt-2">
            {[...Array(16)].map((_, i) => {
              const delay = `${i * 0.1}s`;
              return (
                <span 
                  key={i} 
                  className={`w-[4px] bg-gradient-to-t from-primary to-rose-400 rounded-full transition-all duration-300`}
                  style={{
                    height: isPlaying ? `${Math.floor(Math.random() * 24) + 6}px` : "4px",
                    animation: isPlaying ? `bounce 1.2s ease-in-out infinite alternate` : "none",
                    animationDelay: delay
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Right Column: Dynamic Lyrics & Controls */}
        <div className="lg:col-span-7 flex flex-col space-y-6 md:space-y-8">
          
          {/* Section: Synced Lyrics */}
          <div className="relative group rounded-3xl border border-white/5 bg-[#0b0b0b]/60 backdrop-blur-md p-6 overflow-hidden">
            <div className="absolute top-4 right-4 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded bg-rose-500/10 text-primary border border-rose-500/20 tracking-wider">
              LETRA SINCRONIZADA
            </div>
            
            <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-3 mb-4">
              Acompanhar Música
            </h3>
            
            <div 
              ref={lyricsContainerRef}
              className="h-44 md:h-56 overflow-y-auto scrollbar-none space-y-3.5 pr-2 relative font-sans leading-relaxed text-sm md:text-base select-none"
            >
              {lyrics.map((lyric, index) => {
                const isActive = index === activeLyricIndex;
                const isPast = index < activeLyricIndex;
                return (
                  <div 
                    key={index}
                    onClick={() => onSeek(lyric.time)}
                    className={`transition-all duration-300 py-1 rounded-lg px-2 cursor-pointer origin-left ${
                      isActive 
                        ? "text-rose-400 font-bold scale-102 text-base md:text-lg pl-3 border-l-2 border-primary bg-primary/5" 
                        : isPast 
                          ? "text-zinc-500 text-sm font-medium opacity-70" 
                          : "text-zinc-400 opacity-40 hover:opacity-80"
                    }`}
                  >
                    {lyric.text}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Player controls dashboard */}
          <div className="p-6 rounded-3xl border border-white/5 bg-[#0b0b0b]/60 backdrop-blur-md space-y-5">
            
            {/* Progress Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Playback Buttons row */}
            <div className="flex items-center justify-between gap-4 pt-1">
              
              {/* Toggle Favorite */}
              <button
                onClick={onToggleFavorite}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isFavorited 
                    ? "border-primary/20 bg-primary/10 text-primary" 
                    : "border-white/5 bg-[#111111]/60 text-zinc-400 hover:text-white hover:border-white/10"
                }`}
                title={isFavorited ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
              </button>

              {/* Central Audio buttons */}
              <div className="flex items-center gap-4">
                
                {/* Play/Pause Large button */}
                <button
                  onClick={onPlayPause}
                  className="p-4 rounded-full bg-gradient-to-r from-primary to-rose-700 text-white shadow-xl shadow-rose-950/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  )}
                </button>

                {/* Skip forward */}
                <button
                  onClick={onPlayNext}
                  className="p-3 rounded-full border border-white/5 bg-[#111111]/80 hover:bg-[#1a1a1a] hover:border-white/10 text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                  title="Próxima Música"
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </button>
              </div>

              {/* Autoplay toggler */}
              <button
                onClick={onToggleAutoplay}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                  isAutoplayEnabled 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
                    : "bg-[#111111]/80 text-gray-500 border-white/5 hover:border-white/10"
                }`}
                title={isAutoplayEnabled ? "Desativar Autoplay" : "Ativar Autoplay"}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isAutoplayEnabled ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
                <span className="hidden sm:inline">AUTOPLAY:</span>
                <span>{isAutoplayEnabled ? "ON" : "OFF"}</span>
              </button>
            </div>

            {/* Bottom auxiliary controls row (Volume + Download Trigger) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
              
              {/* Volume Slider control */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={onMuteToggle}
                  className="text-zinc-400 hover:text-white transition-colors p-1"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-full sm:w-28 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              {/* Quick Quality Download & Share */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(media.originalUrl || "");
                    toast.success("Link copiado!", "Mídia pronta para compartilhar.");
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  title="Copiar Link de Compartilhamento"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartilhar</span>
                </button>

                <a
                  href={`/api/media/download-proxy?url=${encodeURIComponent(media.playableAudioUrl || media.playableVideoUrl || "")}&filename=${encodeURIComponent(media.title + " - Audio.mp3")}`}
                  download={`${media.title} - Audio.mp3`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => toast.success("Download iniciado", `Preparando o download de '${media.title}' em alta qualidade...`)}
                  className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl bg-primary hover:bg-primary-hover text-white transition-all cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Baixar MP3</span>
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Bounce keyframe helper style */}
      <style>{`
        @keyframes bounce {
          from { height: 4px; }
          to { height: 24px; }
        }
      `}</style>
    </div>
  );
}
