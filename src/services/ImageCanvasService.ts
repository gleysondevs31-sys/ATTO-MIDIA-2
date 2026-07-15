import { createCanvas, loadImage, registerFont } from 'canvas';
import sharp from 'sharp';

export interface WelcomeOptions {
  username: string;
  avatarUrl?: string;
  backgroundUrl?: string;
}

export interface MusicCardOptions {
  title: string;
  artist: string;
  coverUrl?: string;
  progress: number; // 0 to 100
}

export interface MenuOptions {
  title: string;
  items: string[];
}

export class ImageCanvasService {
  /**
   * Generates a Welcome image.
   * Uses Canvas for drawing text and basic shapes, and Sharp for background filters.
   */
  static async generateWelcomeImage(options: WelcomeOptions): Promise<Buffer> {
    const { username, avatarUrl, backgroundUrl } = options;
    const width = 800;
    const height = 300;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Default background
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, width, height);

    if (backgroundUrl) {
      try {
        const bgBuffer = await this.fetchImageBuffer(backgroundUrl);
        // Use Sharp to resize and apply a slight dark overlay
        const processedBg = await sharp(bgBuffer)
          .resize(width, height, { fit: 'cover' })
          .composite([{ input: Buffer.from(`<svg><rect x="0" y="0" width="${width}" height="${height}" fill="rgba(0,0,0,0.6)"/></svg>`), blend: 'over' }])
          .png()
          .toBuffer();

        const bgImage = await loadImage(processedBg);
        ctx.drawImage(bgImage, 0, 0, width, height);
      } catch (e) {
        console.error('Failed to load background:', e);
      }
    } else {
      // Add gradient
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#059669');
      gradient.addColorStop(1, '#10b981');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, height - 10, width, 10);
    }

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText('BEM VINDO!', 250, 130);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '30px sans-serif';
    ctx.fillText(username, 250, 180);

    // Avatar
    if (avatarUrl) {
      try {
        const avatarBuffer = await this.fetchImageBuffer(avatarUrl);
        // Process avatar with Sharp to make it circular and resize
        const size = 160;
        const circleSvg = `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`;
        const processedAvatar = await sharp(avatarBuffer)
          .resize(size, size)
          .composite([{ input: Buffer.from(circleSvg), blend: 'dest-in' }])
          .png()
          .toBuffer();

        const img = await loadImage(processedAvatar);
        ctx.drawImage(img, 50, 70, size, size);
      } catch (e) {
        console.error('Failed to load avatar:', e);
        this.drawPlaceholderAvatar(ctx, 50, 70, 160);
      }
    } else {
      this.drawPlaceholderAvatar(ctx, 50, 70, 160);
    }

    return canvas.toBuffer('image/png');
  }

  /**
   * Generates a Music Card.
   */
  static async generateMusicCard(options: MusicCardOptions): Promise<Buffer> {
    const { title, artist, coverUrl, progress } = options;
    const width = 800;
    const height = 250;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, width, height);

    // Cover
    if (coverUrl) {
      try {
        const coverBuffer = await this.fetchImageBuffer(coverUrl);
        const size = 190;
        // Rounded corners for cover using Sharp
        const roundedSvg = `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="20" ry="20" fill="white"/></svg>`;
        const processedCover = await sharp(coverBuffer)
          .resize(size, size, { fit: 'cover' })
          .composite([{ input: Buffer.from(roundedSvg), blend: 'dest-in' }])
          .png()
          .toBuffer();

        const img = await loadImage(processedCover);
        ctx.drawImage(img, 30, 30, size, size);
      } catch (e) {
        console.error('Failed to load cover:', e);
        this.drawPlaceholderCover(ctx, 30, 30, 190);
      }
    } else {
      this.drawPlaceholderCover(ctx, 30, 30, 190);
    }

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(title.substring(0, 25) + (title.length > 25 ? '...' : ''), 250, 100);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '30px sans-serif';
    ctx.fillText(artist.substring(0, 30), 250, 150);

    // Progress bar
    const p = Math.min(100, Math.max(0, progress));
    ctx.fillStyle = '#3f3f46';
    ctx.beginPath();
    ctx.roundRect(250, 190, 500, 10, 5);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(250, 190, 500 * (p / 100), 10, 5);
    ctx.fill();

    return canvas.toBuffer('image/png');
  }

  /**
   * Generates a Menu image.
   */
  static async generateMenu(options: MenuOptions): Promise<Buffer> {
    const { title, items } = options;
    const width = 600;
    const height = 150 + items.length * 50;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, 0, width, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(title, 30, 55);

    // Items
    ctx.fillStyle = '#e4e4e7';
    ctx.font = '25px monospace';
    for (let i = 0; i < items.length; i++) {
      ctx.fillText(`${i + 1}. ${items[i].trim()}`, 40, 130 + i * 50);
    }

    return canvas.toBuffer('image/png');
  }

  /**
   * Generates a Ping/Status image.
   */
  static async generatePing(ms: string, ip: string): Promise<Buffer> {
    const width = 600;
    const height = 200;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 60px monospace';
    ctx.fillText(`${ms}ms`, 50, 90);

    ctx.fillStyle = '#71717a';
    ctx.font = '20px monospace';
    ctx.fillText(`PONG! IP: ${ip}`, 50, 140);

    return canvas.toBuffer('image/png');
  }

  // Helpers
  private static async fetchImageBuffer(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private static drawPlaceholderAvatar(ctx: any, x: number, y: number, size: number) {
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
  }

  private static drawPlaceholderCover(ctx: any, x: number, y: number, size: number) {
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 20);
    ctx.closePath();
    ctx.fill();
  }
}
