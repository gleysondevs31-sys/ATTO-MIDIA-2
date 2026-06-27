import React from "react";
import { LayoutGrid, Youtube, Music, Play } from "lucide-react";

interface PlatformFilterProps {
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
}

export function PlatformFilter({ selectedPlatform, onSelectPlatform }: PlatformFilterProps) {
  const categories = [
    { id: "all", name: "Todas Mídias", icon: LayoutGrid, color: "hover:text-white" },
    { id: "youtube", name: "YouTube", icon: Youtube, color: "hover:text-red-400" },
    { id: "soundcloud", name: "Soundcloud", icon: Music, color: "hover:text-orange-400" },
    { id: "spotify", name: "Spotify", icon: Music, color: "hover:text-emerald-400" },
    { id: "tiktok", name: "TikTok", icon: Play, color: "hover:text-sky-400" },
  ];

  return (
    <div id="platform-filter-bar" className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selectedPlatform === cat.id;
        return (
          <button
            key={cat.id}
            id={`tab-platform-${cat.id}`}
            onClick={() => onSelectPlatform(cat.id)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-full border transition-all whitespace-nowrap select-none cursor-pointer ${
              isSelected
                ? "bg-white text-[#050505] border-white font-semibold"
                : `bg-[#111111] border-white/5 text-gray-400 hover:border-white/10 ${cat.color}`
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
