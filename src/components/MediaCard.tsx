import React, { useState } from "react";
import { Play, Info, ExternalLink, Copy, Check, Music, Video } from "lucide-react";
import { NormalizedMedia, formatDuration } from "../types";

interface MediaCardProps {
  media: NormalizedMedia;
  onPlay: (media: NormalizedMedia) => void;
  onSelectDetails: (media: NormalizedMedia) => void;
  isActive: boolean;
  key?: React.Key;
}

export function MediaCard({ media, onPlay, onSelectDetails, isActive }: MediaCardProps) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const getPlatformStyle = (platform: string) => {
    switch (platform) {
      case "youtube":
        return { label: "YouTube", bg: "bg-red-500/10 text-red-400 border-red-500/20" };
      case "soundcloud":
        return { label: "Soundcloud", bg: "bg-orange-500/10 text-orange-400 border-orange-500/20" };
      case "spotify":
        return { label: "Spotify", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
      case "tiktok":
        return { label: "TikTok", bg: "bg-sky-500/10 text-sky-400 border-sky-500/20" };
      case "instagram":
        return { label: "Instagram", bg: "bg-pink-500/10 text-pink-400 border-pink-500/20" };
      default:
        return { label: "Mídia", bg: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!media.originalUrl) return;
    navigator.clipboard.writeText(media.originalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platformStyle = getPlatformStyle(media.platform);

  return (
    <div 
      id={`media-card-${media.id}`}
      onClick={() => onSelectDetails(media)}
      className={`group bg-[#111111] border rounded-2xl overflow-hidden hover:border-[#f43f5e]/35 transition-all duration-300 flex flex-col shadow-md cursor-pointer ${
        isActive ? "border-primary ring-1 ring-primary/25" : "border-white/5"
      }`}
    >
      {/* Thumbnail Aspect Container */}
      <div className="relative aspect-video w-full bg-black/40 overflow-hidden">
        {imgError || !media.thumbnail ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-gray-600 gap-2">
            <Music className="w-8 h-8" />
            <span className="text-[10px] font-mono">Sem Imagem</span>
          </div>
        ) : (
          <img
            src={media.thumbnail || undefined}
            alt={media.title}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
          />
        )}
        
        {/* Play Overlay Button */}
        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            id={`btn-overlay-play-${media.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(media);
            }}
            className="p-3.5 bg-primary hover:bg-primary-hover hover:scale-105 active:scale-95 text-white rounded-full shadow-lg transition-all"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md uppercase tracking-wider ${platformStyle.bg}`}>
            {platformStyle.label}
          </span>
          {media.type === "video" ? (
            <span className="bg-black/60 text-white border border-white/5 px-2 py-1 rounded-md text-[9px] flex items-center gap-1 font-mono">
              <Video className="w-2.5 h-2.5" /> VIDEO
            </span>
          ) : (
            <span className="bg-black/60 text-white border border-white/5 px-2 py-1 rounded-md text-[9px] flex items-center gap-1 font-mono">
              <Music className="w-2.5 h-2.5" /> AUDIO
            </span>
          )}
        </div>

        {/* Duration Badge */}
        {media.duration && (
          <span className="absolute bottom-3 right-3 bg-black/75 border border-white/5 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-mono">
            {formatDuration(media.duration)}
          </span>
        )}
      </div>

      {/* Information Container */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <h4 className="font-display font-semibold text-sm text-gray-100 group-hover:text-primary transition-colors line-clamp-1 leading-snug">
            {media.title}
          </h4>
          <p className="text-xs text-gray-400 truncate font-sans">
            por {media.author}
          </p>
        </div>

        {/* Action Tray */}
        <div className="pt-2 flex items-center justify-between border-t border-white/5">
          <button
            id={`btn-card-play-${media.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(media);
            }}
            className="flex items-center gap-1.5 text-xs text-white bg-[#080808]/80 border border-white/5 hover:border-primary group-hover:bg-primary group-hover:border-primary px-3 py-1.5 rounded-lg font-medium transition-all"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Tocar</span>
          </button>

          <div className="flex items-center gap-1">
            {/* Copy Link */}
            {media.originalUrl && (
              <button
                id={`btn-card-copy-${media.id}`}
                onClick={handleCopyLink}
                title="Copiar link original"
                className="p-1.5 text-gray-500 hover:text-white rounded-md hover:bg-[#080808] border border-transparent hover:border-white/5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Open Original */}
            {media.originalUrl && (
              <a
                id={`link-card-original-${media.id}`}
                href={media.originalUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Abrir no site original"
                className="p-1.5 text-gray-500 hover:text-primary rounded-md hover:bg-[#080808] border border-transparent hover:border-white/5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Details modal trigger */}
            <button
              id={`btn-card-details-${media.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectDetails(media);
              }}
              title="Mais detalhes"
              className="p-1.5 text-gray-500 hover:text-white rounded-md hover:bg-[#080808] border border-transparent hover:border-white/5 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
