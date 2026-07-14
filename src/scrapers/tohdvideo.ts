import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Configurações do Scraper (unblurimage.ai)
const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36";
const API_BASE = "https://api.unblurimage.ai/api/upscaler";

function productserial() {
    const raw = [UA, process.platform, process.arch, Date.now(), Math.random()].join("|");
    return crypto.createHash("md5").update(raw).digest("hex");
}

const product = productserial();

async function uploadvid(filePath) {
    if (!fs.existsSync(filePath)) throw new Error("Arquivo não encontrado");
    const form = new FormData();
    form.append("video_file_name", path.basename(filePath));
    const res = await axios.post(`${API_BASE}/v1/ai-video-enhancer/upload-video`, form, {
        headers: {
            ...form.getHeaders(),
            "user-agent": UA,
            origin: "https://unblurimage.ai",
            referer: "https://unblurimage.ai/"
        }
    });
    return res.data.result;
}

async function putToOss(uploadUrl, filePath) {
    const stream = fs.createReadStream(filePath);
    await axios.put(uploadUrl, stream, {
        headers: { "content-type": "video/mp4" },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });
}

async function createJob(originalVideoUrl, resolution = "4k", preview = false) {
    const form = new FormData();
    form.append("original_video_file", originalVideoUrl);
    form.append("resolution", resolution);
    form.append("is_preview", preview ? "true" : "false");
    const res = await axios.post(`${API_BASE}/v2/ai-video-enhancer/create-job`, form, {
        headers: {
            ...form.getHeaders(),
            "user-agent": UA,
            origin: "https://unblurimage.ai",
            referer: "https://unblurimage.ai/",
            "product-serial": product
        }
    });
    if (res.data?.code !== 100000) throw new Error(JSON.stringify(res.data));
    return res.data.result.job_id;
}

async function getJob(jobId) {
    const res = await axios.get(`${API_BASE}/v2/ai-video-enhancer/get-job/${jobId}`, {
        headers: {
            "user-agent": UA,
            origin: "https://unblurimage.ai",
            referer: "https://unblurimage.ai/",
            "product-serial": product
        }
    });
    return res.data;
}

async function pollJob(jobId, interval = 1000) { // Intervalo reduzido para 1 segundo
    while (true) {
        const res = await getJob(jobId);
        if (res.code === 100000 && res.result?.output_url) return res.result;
        if (res.code !== 300010) throw new Error(JSON.stringify(res));
        await new Promise(r => setTimeout(r, interval));
    }
}

/**
 * Função principal do Scraper para aprimoramento de vídeo.
 * @param {string} filePath - Caminho local do arquivo de vídeo a ser aprimorado.
 * @param {string} [resolution=\'4k\'] - Resolução desejada para o aprimoramento (ex: \'4k\', \'1080p\').
 * @returns {Promise<string>} URL do vídeo aprimorado.
 */
async function videoEnhancerScraper(filePath, resolution = "4k") {
    console.log("Scraper: Iniciando upload de vídeo...");
    const upload = await uploadvid(filePath);
    console.log("Scraper: Upload concluído. Enviando para OSS...");
    await putToOss(upload.url, filePath);
    const cdnUrl = "https://cdn.unblurimage.ai/" + upload.object_name;
    console.log(`Scraper: Vídeo disponível em CDN: ${cdnUrl}. Criando job de aprimoramento...`);
    const jobId = await createJob(cdnUrl, resolution, false);
    console.log(`Scraper: Job ${jobId} criado. Aguardando conclusão...`);
    const result = await pollJob(jobId);
    console.log("Scraper: Job concluído. Vídeo aprimorado disponível.");
    return result.output_url;
}

export default videoEnhancerScraper;
