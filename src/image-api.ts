import { Router } from "express";
import { ImageCanvasService } from "./services/ImageCanvasService.js";

const router = Router();

// /api/image/welcome?username=Gleyson&avatar=...
router.get("/welcome", async (req, res) => {
  try {
    const { username = "Usuário", avatar, background } = req.query;
    
    const buffer = await ImageCanvasService.generateWelcomeImage({
      username: String(username),
      avatarUrl: avatar ? String(avatar) : undefined,
      backgroundUrl: background ? String(background) : undefined,
    });
    
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

router.get("/ping", async (req, res) => {
  try {
    const { ms = "24", ip = "127.0.0.1" } = req.query;
    
    const buffer = await ImageCanvasService.generatePing(String(ms), String(ip));
    
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

router.get("/musiccard", async (req, res) => {
  try {
    const { title = "Unknown Title", artist = "Unknown Artist", cover, progress = "50" } = req.query;
    
    const buffer = await ImageCanvasService.generateMusicCard({
      title: String(title),
      artist: String(artist),
      coverUrl: cover ? String(cover) : undefined,
      progress: parseInt(String(progress), 10) || 0
    });
    
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

router.get("/menu", async (req, res) => {
  try {
    const { title = "Menu", items = "Item 1,Item 2,Item 3" } = req.query;
    const itemList = String(items).split(",");
    
    const buffer = await ImageCanvasService.generateMenu({
      title: String(title),
      items: itemList
    });
    
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

export default router;
