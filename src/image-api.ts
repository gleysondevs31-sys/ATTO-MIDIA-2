import { Router } from "express";
import { createCanvas, loadImage, registerFont } from "canvas";

const router = Router();

// /api/image/welcome?username=Gleyson&avatar=...
router.get("/welcome", async (req, res) => {
  try {
    const { username = "Usuário", avatar } = req.query;
    
    const canvas = createCanvas(800, 300);
    const ctx = canvas.getContext("2d");
    
    // Background
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, 800, 300);
    
    // Add some pattern/gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 0);
    gradient.addColorStop(0, "#059669");
    gradient.addColorStop(1, "#10b981");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 290, 800, 10);
    
    // Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 50px sans-serif";
    ctx.fillText("BEM VINDO!", 250, 130);
    
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "30px sans-serif";
    ctx.fillText(String(username), 250, 180);
    
    // Avatar
    if (avatar && typeof avatar === "string") {
      try {
        const img = await loadImage(avatar);
        ctx.save();
        ctx.beginPath();
        ctx.arc(130, 150, 80, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 50, 70, 160, 160);
        ctx.restore();
      } catch(e) {}
    } else {
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.arc(130, 150, 80, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    }
    
    res.setHeader("Content-Type", "image/png");
    canvas.createPNGStream().pipe(res);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

router.get("/ping", async (req, res) => {
  try {
    const { ms = "24", ip = "127.0.0.1" } = req.query;
    const canvas = createCanvas(600, 200);
    const ctx = canvas.getContext("2d");
    
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, 600, 200);
    
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 60px monospace";
    ctx.fillText(\`\${ms}ms\`, 50, 90);
    
    ctx.fillStyle = "#71717a";
    ctx.font = "20px monospace";
    ctx.fillText(\`PONG! IP: \${ip}\`, 50, 140);
    
    res.setHeader("Content-Type", "image/png");
    canvas.createPNGStream().pipe(res);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

export default router;

router.get("/musiccard", async (req, res) => {
  try {
    const { title = "Unknown Title", artist = "Unknown Artist", cover, progress = "50" } = req.query;
    
    const canvas = createCanvas(800, 250);
    const ctx = canvas.getContext("2d");
    
    // Background
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, 800, 250);
    
    // Cover
    if (cover && typeof cover === "string") {
      try {
        const img = await loadImage(cover);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(30, 30, 190, 190, 20);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 30, 30, 190, 190);
        ctx.restore();
      } catch(e) {}
    } else {
        ctx.fillStyle = "#27272a";
        ctx.beginPath();
        ctx.roundRect(30, 30, 190, 190, 20);
        ctx.closePath();
        ctx.fill();
    }
    
    // Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText(String(title).substring(0, 25) + (String(title).length > 25 ? "..." : ""), 250, 100);
    
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "30px sans-serif";
    ctx.fillText(String(artist).substring(0, 30), 250, 150);
    
    // Progress bar
    const p = Math.min(100, Math.max(0, parseInt(String(progress)) || 0));
    ctx.fillStyle = "#3f3f46";
    ctx.roundRect(250, 190, 500, 10, 5);
    ctx.fill();
    
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.roundRect(250, 190, 500 * (p / 100), 10, 5);
    ctx.fill();
    
    res.setHeader("Content-Type", "image/png");
    canvas.createPNGStream().pipe(res);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

router.get("/menu", async (req, res) => {
  try {
    const { title = "Menu", items = "Item 1,Item 2,Item 3" } = req.query;
    const itemList = String(items).split(",");
    
    const canvas = createCanvas(600, 150 + itemList.length * 50);
    const ctx = canvas.getContext("2d");
    
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Header
    ctx.fillStyle = "#10b981";
    ctx.fillRect(0, 0, canvas.width, 80);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText(String(title), 30, 55);
    
    // Items
    ctx.fillStyle = "#e4e4e7";
    ctx.font = "25px monospace";
    for(let i = 0; i < itemList.length; i++) {
        ctx.fillText(\`\${i+1}. \${itemList[i].trim()}\`, 40, 130 + i * 50);
    }
    
    res.setHeader("Content-Type", "image/png");
    canvas.createPNGStream().pipe(res);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});
