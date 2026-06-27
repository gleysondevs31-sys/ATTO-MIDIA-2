import React from "react";

export function LoadingState() {
  return (
    <div id="loading-state-container" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-dark-card border border-zinc-800 rounded-xl overflow-hidden shadow-lg animate-pulse">
          {/* Thumbnail Skeleton */}
          <div className="aspect-video bg-zinc-800 w-full" />
          
          {/* Info Skeleton */}
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 bg-zinc-800 rounded w-1/4" />
              <div className="h-4 w-4 bg-zinc-800 rounded-full" />
            </div>
            
            <div className="h-4 bg-zinc-800 rounded w-11/12" />
            <div className="h-3 bg-zinc-800 rounded w-2/3" />
            
            <div className="pt-2 flex gap-2">
              <div className="h-8 bg-zinc-800 rounded flex-1" />
              <div className="h-8 w-10 bg-zinc-800 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
