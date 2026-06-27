import React from "react";
import { X, Play, ExternalLink, Calendar, Music, Clock, User, CheckSquare, Download, Video } from "lucide-react";
import { NormalizedMedia } from "../types";

interface MediaDetailsModalProps {
  media: NormalizedMedia | null;
  onClose: () => void;
  onPlay: (media: NormalizedMedia) => void;
}

export function MediaDetailsModal({ media, onClose, onPlay }: MediaDetailsModalProps) {
  if (!media) return null;

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
              
              <button
                id="btn-modal-play-cta"
                onClick={() => {
                  if (media.type === "video") {
                    playVideo();
                  } else {
                    playAudio();
                  }
                }}
                className="p-4 bg-primary hover:bg-primary-hover text-white rounded-full shadow-lg shadow-rose-950/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0"
              >
                <Play className="w-6 h-6 fill-white ml-0.5" />
              </button>
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
                  <span className="text-sm font-semibold text-gray-100">{media.duration}</span>
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

            {/* OPÇÕES DE REPRODUÇÃO E DOWNLOAD */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                Opções de Play e Download (Áudio & Vídeo)
              </h4>
              <div className="space-y-2.5">
                {/* 1. OPÇÃO ÁUDIO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#111111]/60 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-500/10 text-primary border border-rose-500/20 rounded-xl">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-gray-200">Áudio (MP3 / Música)</h5>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">Ideal para streaming rápido ou fones</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={playAudio}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Tocar</span>
                    </button>
                    {audioDownloadUrl ? (
                      <a
                        href={audioDownloadUrl}
                        download={`${media.title} - Audio.mp3`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl transition-all shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-gray-600 font-mono px-2 py-1">Indisponível</span>
                    )}
                  </div>
                </div>

                {/* 2. OPÇÃO VÍDEO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#111111]/60 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-gray-200">Vídeo (MP4 / Clipe)</h5>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">Assista em alta qualidade com visual original</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {!isAudioOnly ? (
                      <>
                        <button
                          onClick={playVideo}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Tocar</span>
                        </button>
                        {videoDownloadUrl ? (
                          <a
                            href={videoDownloadUrl}
                            download={`${media.title} - Video.mp4`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl transition-all shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Baixar</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-600 font-mono px-2 py-1">Carregando...</span>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-mono italic px-2 py-1 bg-white/5 rounded-lg border border-white/5">Apenas em Áudio</span>
                    )}
                  </div>
                </div>
              </div>
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
