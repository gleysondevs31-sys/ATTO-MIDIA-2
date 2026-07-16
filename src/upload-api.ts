import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post("/image", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada" });
    }
    const url = `/uploads/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get("host")}${url}`;
    res.json({ success: true, url, fullUrl });
});

// Image Bank Endpoint
router.get("/gallery", (req, res) => {
    try {
        const files = fs.readdirSync(uploadDir);
        const images = files
            .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
            .map(f => `/uploads/${f}`);
        res.json({ success: true, images });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
