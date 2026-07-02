import React, { useEffect, useState } from "react";
import { AlertCircle, Info, Megaphone, X, Sparkles } from "lucide-react";

interface Banner {
  id: number;
  title: string;
  message: string;
  link_url?: string;
  type: string;
}

export function BannerDisplay() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/banners/active")
      .then(res => res.json())
      .then(data => {
        if (data.status && data.banners) {
          setBanners(data.banners);
        }
      })
      .catch(console.error);
  }, []);

  const handleDismiss = (id: number) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const activeBanners = banners.filter(b => !dismissed.has(b.id));

  if (activeBanners.length === 0) return null;

  return (
    <div className="space-y-3 mb-6 w-full animate-fade-in">
      {activeBanners.map(banner => {
        let colors = "bg-[#111111]/80 border-white/5 text-zinc-300";
        let Icon = Megaphone;

        if (banner.type === "warning") {
          colors = "bg-amber-500/10 border-amber-500/20 text-amber-400";
          Icon = AlertCircle;
        } else if (banner.type === "success") {
          colors = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
          Icon = Info;
        } else if (banner.type === "promo") {
          colors = "bg-rose-500/10 border-rose-500/20 text-rose-400";
          Icon = Sparkles;
        }

        return (
          <div key={banner.id} className={`relative overflow-hidden rounded-xl border p-4 flex items-start sm:items-center justify-between gap-4 shadow-sm ${colors}`}>
            <div className="flex items-start sm:items-center gap-3">
              <Icon className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <h4 className="text-sm font-bold">{banner.title}</h4>
                <p className="text-xs opacity-80 mt-0.5">{banner.message}</p>
                {banner.link_url && (
                  <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs font-bold underline opacity-90 hover:opacity-100">
                    Saber mais
                  </a>
                )}
              </div>
            </div>
            <button onClick={() => handleDismiss(banner.id)} className="p-1 hover:bg-black/20 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
