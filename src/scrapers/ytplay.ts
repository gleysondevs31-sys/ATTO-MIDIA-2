import { YtDlpClient, StalkerEngine, PlayEngine, getYouTubeVideoId, normalizeYoutubeUrl } from "@irithell-js/yt-play";
import path from "path";
import fs from "fs";

export default class AdvancedYtPlay {
  private ytdlp: YtDlpClient;
  private stalker: StalkerEngine;
  private engine: PlayEngine;

  constructor() {
    const cookiesPath = path.join(process.cwd(), "cookies.txt");
    const hasCookies = fs.existsSync(cookiesPath);
    
    this.ytdlp = new YtDlpClient({
      cookiesPath: hasCookies ? cookiesPath : undefined,
    });
    this.stalker = new StalkerEngine(this.ytdlp);
    this.engine = new PlayEngine({
      useAria2c: true,
      cookiesPath: hasCookies ? cookiesPath : undefined,
    });
  }

  async getInfo(url: string) {
    const args = ["-J", "--no-warnings", "--no-playlist", url];
    const raw = await this.ytdlp.exec(args);
    return JSON.parse(raw);
  }

  async getPlaylistInfo(url: string, opts?: any) {
    return await this.ytdlp.getPlaylistInfo(url, opts || {});
  }

  async stalkVideo(url: string) {
    return await this.stalker.stalkVideoOrLive(url);
  }

  async stalkChannel(url: string, opts?: any) {
    return await this.stalker.stalkChannel(url, opts || {});
  }
  
  async getDirectUrl(url: string, format?: string) {
    if (format) {
      const args = ["-f", format, "-g", url];
      const result = await this.ytdlp.exec(args);
      return result.trim().split("\n");
    }
    return await this.ytdlp.getDirectUrl(url, "both");
  }

  async execCustom(url: string, args: string[]) {
    return await this.ytdlp.exec([...args, url]);
  }
}
