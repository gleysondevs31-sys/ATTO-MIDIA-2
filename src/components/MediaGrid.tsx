import React from "react";
import { MediaCard } from "./MediaCard";
import { NormalizedMedia } from "../types";
import { EmptyState } from "./EmptyState";

interface MediaGridProps {
  medias: NormalizedMedia[];
  onPlay: (media: NormalizedMedia) => void;
  onSelectDetails: (media: NormalizedMedia) => void;
  activeMediaId?: string;
}

export function MediaGrid({ medias, onPlay, onSelectDetails, activeMediaId }: MediaGridProps) {
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
