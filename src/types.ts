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
