import React, { useState } from "react";
import { X, Play, ExternalLink, Calendar, Music, Clock, User, CheckSquare, Download, Video, Loader2, Heart, Share2, Sparkles, Crown, Zap, ShieldAlert } from "lucide-react";
import { NormalizedMedia, formatDuration } from "../types";
import { useToast } from "./Toast";

interface MediaDetailsModalProps {
  media: NormalizedMedia | null;
  onClose: () => void;
  onPlay: (media: NormalizedMedia) => void;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  user?: any;
  onSelectView?: (view: string) => void;
}

export function MediaDetailsModal({ 
  media, 
  onClose, 
  onPlay, 
  isFavorited = false, 
  onToggleFavorite,
  user,
  onSelectView
}: MediaDetailsModalProps) {
  if (!media) return null;
  const { toast } = useToast();
  const [requiredPlanForUpgrade, setRequiredPlanForUpgrade] = useState<"pro" | "premium" | null>(null);

  const handleDownloadClick = (qualityName: string, requiredTier: "free" | "pro" | "premium", downloadUrl: string | null, filename: string) => {
    if (!downloadUrl) {
      toast.error("Link indisponível", "Aguardando geração do link de mídia pelo proxy.");
      return;
    }

    const currentPlan = user?.plan || "free";
    
    // Check authorization
    if (requiredTier === "pro") {
      if (currentPlan !== "pro" && currentPlan !== "premium") {
        setRequiredPlanForUpgrade("pro");
        return;
      }
    } else if (requiredTier === "premium") {
      if (currentPlan !== "premium") {
        setRequiredPlanForUpgrade("premium");
        return;
      }
    }

    // If authorized, start download!
    toast.success("Download iniciado", `Preparando download de '${media.title}' em ${qualityName}...`);
    
    // Trigger download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.target = "_blank";
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (!media.originalUrl) return;
    navigator.clipboard.writeText(media.originalUrl)
      .then(() => {
        toast.success("Link copiado!", "O link original da mídia foi copiado para a área de transferência.");
      })
      .catch((err) => {
        console.error("Falha ao copiar link:", err);
        toast.error("Erro ao compartilhar", "Não foi possível copiar o link.");
      });
  };

  const playAudio = () => {
    onPlay({
      ...media,
      type: "audio",
      playableAudioUrl: media.playableAudioUrl || media.playableVideoUrl // fallback
    });
    onClose();
  };

  const playVideo = () => {
    onPlay({
      ...media,
      type: "video",
      playableVideoUrl: media.playableVideoUrl || media.playableAudioUrl // fallback
    });
    onClose();
  };

  // Determine appropriate download links
  const isYoutube = media.platform === "youtube";
  const isTikTok = media.platform === "tiktok";
  const isAudioOnly = media.platform === "spotify" || media.platform === "soundcloud";

  const audioDownloadUrl = isYoutube
    ? `/api/media/yt-download?type=audio&url=${encodeURIComponent(media.originalUrl)}`
    : media.playableAudioUrl
      ? `/api/media/download-proxy?url=${encodeURIComponent(media.playableAudioUrl)}&filename=${encodeURIComponent(media.title + " - Audio.mp3")}`
      : null;

  const videoDownloadUrl = isYoutube
    ? `/api/media/yt-download?type=video&url=${encodeURIComponent(media.originalUrl)}`
    : isTikTok && media.playableVideoUrl
      ? `/api/media/download-proxy?url=${encodeURIComponent(media.playableVideoUrl)}&filename=${encodeURIComponent(media.title + " - Video.mp4")}`
      : null;

  const getAudioUrl = (tier: "free" | "pro") => {
    if (!audioDownloadUrl) return null;
    return `${audioDownloadUrl}&quality=${tier === "pro" ? "320" : "128"}`;
  };

  const getVideoUrl = (tier: "free" | "pro" | "premium") => {
    if (!videoDownloadUrl) return null;
    let q = "360p";
    if (tier === "pro") q = "720p";
    if (tier === "premium") q = "1080p";
    return `${videoDownloadUrl}&quality=${q}`;
  };

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

  return (
    <div id="media-details-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        id="media-details-modal-box"
        className="relative bg-[#080808] border border-white/5 rounded-3xl overflow-hidden max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-scale-up"
      >
        {/* Close Button */}
        <button
          id="btn-close-details-modal"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-[#111111] rounded-full text-gray-400 hover:text-white transition-colors border border-white/5 backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          {/* Header Banner */}
          <div className="relative aspect-video bg-black/40 border-b border-white/5 overflow-hidden">
            {media.thumbnail ? (
              <img 
                src={media.thumbnail || undefined} 
                alt={media.title} 
                className="w-full h-full object-cover opacity-85"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-700 bg-[#111111]">
                <Music className="w-12 h-12" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />
            
            {/* Quick Play Action Banner CTA */}
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                  {media.platform}
                </span>
                <h3 className="text-xl md:text-2xl font-display font-bold text-white mt-3 line-clamp-1">
                  {media.title}
                </h3>
              </div>
              
              <div className="flex items-center gap-2.5 shrink-0">
                {media.originalUrl && (
                  <button
                    id="btn-modal-share-cta"
                    onClick={handleShare}
                    title="Compartilhar Mídia"
                    className="p-4 rounded-full border bg-black/60 border-white/10 text-gray-400 hover:text-white hover:border-white/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                )}

                {onToggleFavorite && (
                  <button
                    id="btn-modal-favorite-cta"
                    onClick={onToggleFavorite}
                    title={isFavorited ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                    className={`p-4 rounded-full border transition-all flex items-center justify-center cursor-pointer active:scale-95 hover:scale-105 ${
                      isFavorited
                        ? "bg-rose-500/15 border-rose-500/30 text-rose-500 hover:bg-rose-500/25"
                        : "bg-black/60 border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${isFavorited ? "fill-current" : ""}`} />
                  </button>
                )}

                <button
                  id="btn-modal-play-cta"
                  onClick={() => {
                    if (media.type === "video") {
                      playVideo();
                    } else {
                      playAudio();
                    }
                  }}
                  className="p-4 bg-primary hover:bg-primary-hover text-white rounded-full shadow-lg shadow-rose-950/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                >
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Details Content Body */}
          <div className="p-6 space-y-6">
            {/* Quick Metadata Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#111111] border border-white/5 p-3.5 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase">Autor</span>
                </div>
                <span className="text-sm font-semibold text-gray-100 truncate">{media.author}</span>
              </div>

              {media.duration && (
                <div className="bg-[#111111] border border-white/5 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase">Duração</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-100">{formatDuration(media.duration)}</span>
                </div>
              )}

              <div className="bg-[#111111] border border-white/5 p-3.5 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase">Canal</span>
                </div>
                <span className="text-sm font-semibold text-gray-100 capitalize">{media.platform}</span>
              </div>

              <div className="bg-[#111111] border border-white/5 p-3.5 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase">Formato</span>
                </div>
                <span className="text-sm font-semibold text-gray-100 uppercase">{media.type}</span>
              </div>
            </div>

            {/* Description Block */}
            {media.description && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                  Descrição
                </h4>
                <p className="text-gray-400 text-xs md:text-sm leading-relaxed bg-[#111111]/30 border border-white/5 p-4 rounded-2xl max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {media.description}
                </p>
              </div>
            )}

            {/* OPÇÕES DE REPRODUÇÃO E DOWNLOAD MULTI-QUALIDADE */}
            <div className="space-y-4 pt-2 relative">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                  Opções de Play e Download
                </h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary uppercase">
                  {user?.plan ? `Plano Ativo: ${user.plan}` : "Plano: Grátis"}
                </span>
              </div>

              {/* CONTROLES DE REPRODUÇÃO RÁPIDA */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={playAudio}
                  className="flex items-center justify-center gap-2 py-2.5 bg-[#111111]/80 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl text-xs font-semibold text-gray-200 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
                  <span>Ouvir Áudio</span>
                </button>
                {!isAudioOnly ? (
                  <button
                    onClick={playVideo}
                    className="flex items-center justify-center gap-2 py-2.5 bg-[#111111]/80 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl text-xs font-semibold text-gray-200 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 text-sky-400 fill-sky-400" />
                    <span>Ver Vídeo</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-center py-2.5 bg-[#111111]/30 border border-dashed border-white/5 rounded-2xl text-[10px] font-mono text-gray-500 select-none">
                    Apenas Áudio Disponível
                  </div>
                )}
              </div>

              {/* SEÇÃO MULTI-QUALIDADE DE ÁUDIO */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">Formatos de Áudio</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* ÁUDIO PADRÃO (FREE) */}
                  <div className="p-3 bg-[#111111]/40 border border-white/5 rounded-2xl flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs font-bold text-gray-200">MP3 Standard</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">Velocidade padrão • 128 kbps</p>
                    </div>
                    {isAudioValid ? (
                      <button
                        onClick={() => handleDownloadClick("MP3 Standard (128 kbps)", "free", getAudioUrl("free"), `${media.title} - 128kbps.mp3`)}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl text-white transition-all cursor-pointer"
                      >
                        Baixar Grátis
                      </button>
                    ) : (
                      <div className="w-full py-2 bg-[#111111] border border-white/5 text-[10px] text-gray-500 font-mono text-center rounded-xl flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Aguardando link...</span>
                      </div>
                    )}
                  </div>

                  {/* ÁUDIO ULTRA HQ (PRO) */}
                  <div className="p-3 bg-amber-950/5 border border-amber-500/10 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden group">
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase rounded bg-amber-500/20 text-amber-400 border border-amber-500/35">
                      PRO
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-amber-300">MP3 Ultra HQ</span>
                      </div>
                      <p className="text-[10px] text-amber-500/60 mt-1">Velocidade 5x • Estúdio 320 kbps</p>
                    </div>
                    {isAudioValid ? (
                      <button
                        onClick={() => handleDownloadClick("MP3 Ultra HQ (320 kbps)", "pro", getAudioUrl("pro"), `${media.title} - Ultra_320kbps.mp3`)}
                        className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl text-amber-300 transition-all cursor-pointer"
                      >
                        Baixar HQ
                      </button>
                    ) : (
                      <div className="w-full py-2 bg-[#111111] border border-white/5 text-[10px] text-gray-500 font-mono text-center rounded-xl flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Aguardando link...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SEÇÃO MULTI-QUALIDADE DE VÍDEO */}
              {!isAudioOnly && (
                <div className="space-y-2">
                  <h5 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">Resoluções de Vídeo</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* VÍDEO COMPACTO (FREE) */}
                    <div className="p-3 bg-[#111111]/40 border border-white/5 rounded-2xl flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-xs font-bold text-gray-200">Vídeo 360p</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Velocidade padrão • MP4 SD</p>
                      </div>
                      {isVideoValid ? (
                        <button
                          onClick={() => handleDownloadClick("Vídeo SD (360p)", "free", getVideoUrl("free"), `${media.title} - 360p.mp4`)}
                          className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl text-white transition-all cursor-pointer"
                        >
                          Baixar Grátis
                        </button>
                      ) : (
                        <div className="w-full py-2 bg-[#111111] border border-white/5 text-[10px] text-gray-500 font-mono text-center rounded-xl flex items-center justify-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Aguardando link...</span>
                        </div>
                      )}
                    </div>

                    {/* VÍDEO HD 720P (PRO) */}
                    <div className="p-3 bg-amber-950/5 border border-amber-500/10 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden group">
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase rounded bg-amber-500/20 text-amber-400 border border-amber-500/35">
                        PRO
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-bold text-amber-300">HD 720p</span>
                        </div>
                        <p className="text-[10px] text-amber-500/60 mt-1">Velocidade 5x • Alta Definição</p>
                      </div>
                      {isVideoValid ? (
                        <button
                          onClick={() => handleDownloadClick("Vídeo HD (720p)", "pro", getVideoUrl("pro"), `${media.title} - HD_720p.mp4`)}
                          className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl text-amber-300 transition-all cursor-pointer"
                        >
                          Baixar HD
                        </button>
                      ) : (
                        <div className="w-full py-2 bg-[#111111] border border-white/5 text-[10px] text-gray-500 font-mono text-center rounded-xl flex items-center justify-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Aguardando link...</span>
                        </div>
                      )}
                    </div>

                    {/* VÍDEO FULL HD 1080P (PREMIUM) */}
                    <div className="p-3 bg-rose-950/5 border border-primary/20 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden group">
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase rounded bg-primary/20 text-primary border border-primary/35">
                        PREMIUM
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-bold text-rose-300">Full HD 1080p</span>
                        </div>
                        <p className="text-[10px] text-rose-500/60 mt-1">Fila Prioritária • Máxima Nitidez</p>
                      </div>
                      {isVideoValid ? (
                        <button
                          onClick={() => handleDownloadClick("Vídeo Full HD (1080p)", "premium", getVideoUrl("premium"), `${media.title} - Full_HD_1080p.mp4`)}
                          className="w-full py-2 bg-primary/10 hover:bg-primary/25 border border-primary/30 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl text-primary transition-all cursor-pointer"
                        >
                          Baixar Ultra
                        </button>
                      ) : (
                        <div className="w-full py-2 bg-[#111111] border border-white/5 text-[10px] text-gray-500 font-mono text-center rounded-xl flex items-center justify-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Aguardando link...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* OVERLAY EXCLUSIVO DA CONTA PREMIUM */}
              {requiredPlanForUpgrade && (
                <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-3xl border border-white/10">
                  <div className="p-4 bg-primary/10 border border-primary/25 rounded-full text-primary">
                    {requiredPlanForUpgrade === "pro" ? <Zap className="w-8 h-8 animate-pulse text-amber-400" /> : <Crown className="w-8 h-8 animate-bounce text-primary" />}
                  </div>
                  <h3 className="text-lg font-bold text-white font-display">Recurso Exclusivo Atto {requiredPlanForUpgrade.toUpperCase()}!</h3>
                  <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                    O download em alta qualidade ({requiredPlanForUpgrade === "pro" ? "HD 720p / 320kbps" : "Full HD 1080p / Sem Marca d'água"}) requer uma assinatura ativa.
                  </p>
                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setRequiredPlanForUpgrade(null)}
                      className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider font-mono bg-[#111111] hover:bg-white/5 border border-white/5 text-gray-400 rounded-xl transition-all cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRequiredPlanForUpgrade(null);
                        onClose();
                        if (onSelectView) onSelectView("plans");
                      }}
                      className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider font-mono bg-primary hover:bg-primary-hover text-white rounded-xl shadow-lg shadow-rose-950/20 transition-all cursor-pointer"
                    >
                      Assinar Plano
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Platform Original Link */}
            {media.originalUrl && (
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <a
                  id="link-original-modal-footer"
                  href={media.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white bg-[#111111] border border-white/5 hover:border-white/10 px-4 py-3 rounded-xl transition-all w-full sm:w-auto justify-center"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir no site original</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
