import React from "react";
import { MediaCard } from "./MediaCard";
import { NormalizedMedia } from "../types";
import { EmptyState } from "./EmptyState";

interface MediaGridProps {
  medias: NormalizedMedia[];
  onPlay: (media: NormalizedMedia) => void;
  onSelectDetails: (media: NormalizedMedia) => void;
  activeMediaId?: string;
  isLoading?: boolean;
}

export function MediaCardSkeleton() {
  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-md animate-pulse">
      {/* Thumbnail Aspect Container */}
      <div className="relative aspect-video w-full bg-zinc-900/40 overflow-hidden">
        {/* Shimmer overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        
        {/* Floating Badges Skeletons */}
        <div className="absolute top-3 left-3">
          <div className="h-5 w-16 bg-zinc-800/80 rounded-full" />
        </div>
        <div className="absolute top-3 right-3">
          <div className="h-5 w-14 bg-zinc-800/80 rounded-md" />
        </div>
        <div className="absolute bottom-3 right-3">
          <div className="h-4 w-10 bg-zinc-800/80 rounded" />
        </div>
      </div>

      {/* Information Container */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Title line */}
          <div className="h-4 bg-zinc-800/80 rounded-md w-11/12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
          {/* Author line */}
          <div className="h-3 bg-zinc-800/80 rounded-md w-2/3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Action Tray */}
        <div className="pt-3 flex items-center justify-between border-t border-white/5">
          <div className="h-7 w-20 bg-zinc-800/80 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>

          <div className="flex items-center gap-1.5">
            <div className="h-7 w-7 bg-zinc-800/80 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>
            <div className="h-7 w-7 bg-zinc-800/80 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>
            <div className="h-7 w-7 bg-zinc-800/80 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MediaGrid({ medias, onPlay, onSelectDetails, activeMediaId, isLoading }: MediaGridProps) {
  if (isLoading) {
    return (
      <div id="media-results-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <MediaCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  if (medias.length === 0) {
    return <EmptyState />;
  }

  return (
    <div id="media-results-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      {medias.map((media) => (
        <MediaCard
          key={media.id}
          media={media}
          onPlay={onPlay}
          onSelectDetails={onSelectDetails}
          isActive={activeMediaId === media.id}
        />
      ))}
    </div>
  );
}
