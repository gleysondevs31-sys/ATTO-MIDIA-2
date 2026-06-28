export interface NormalizedMedia {
  id: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'spotify' | 'soundcloud' | 'unknown';
  title: string;
  author: string;
  thumbnail: string;
  duration?: string;
  description?: string;
  originalUrl?: string;
  playableAudioUrl?: string | null;
  playableVideoUrl?: string | null;
  embedUrl?: string | null;
  type: "audio" | "video" | "embed" | "unknown";
  userSelectedType?: "audio" | "video";
  medias?: MediaStreamOption[];
  raw?: any;
}

export interface MediaStreamOption {
  quality: string;
  label: string;
  url: string;
  extension: string;
  type: "video" | "audio";
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export function formatDuration(dur: any): string {
  if (!dur) return "";
  if (typeof dur === "string") return dur;
  if (typeof dur === "object") {
    if (dur.timestamp) return String(dur.timestamp);
    if (dur.label) return String(dur.label);
    if (typeof dur.seconds === "number" || typeof dur.seconds === "string") {
      const totalSecs = Number(dur.seconds);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
  }
  return String(dur);
}

