import React from "react";
import { MediaCardSkeleton } from "./MediaGrid";

export function LoadingState() {
  return (
    <div id="loading-state-container" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <MediaCardSkeleton key={`loading-skeleton-${i}`} />
      ))}
    </div>
  );
}
