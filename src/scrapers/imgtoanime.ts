import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require("axios");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const FormData = require("form-data");
const { fromBuffer } = require("file-type");

// Upload para Catbox
const up = async (buffer) => {
  let { ext } = await fromBuffer(buffer);
  let bodyForm = new FormData();
  bodyForm.append("fileToUpload", buffer, "file." + ext);
  bodyForm.append("reqtype", "fileupload");

  let res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: bodyForm,
  });

  return await res.text();
};

// Função para transformar em anime via API Anisa (aceita URL)
async function img2anime(imgUrl, options = {}) {
  const {
    prompt = "convert this photo into anime style, masterpiece, best quality",
  } = options;

  // Baixa a imagem da URL
  const res = await axios.get(imgUrl, { responseType: "arraybuffer" });
  const buffer = Buffer.from(res.data);
  const imageBase64 = buffer.toString("base64");

  // Payload para API
  const payload = {
    image: imageBase64,
    prompt,
  };

  // Faz a requisição
  const apiRes = await axios.post(
    "https://ai-studio.anisaofc.my.id/api/edit-image",
    payload,
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*",
        "Content-Type": "application/json",
        "Origin": "https://ai-studio.anisaofc.my.id",
        "Referer": "https://ai-studio.anisaofc.my.id/",
      },
    }
  );

  // Baixa o resultado da API
  const resultUrl = apiRes.data.imageUrl;
  const resultRes = await axios.get(resultUrl, { responseType: "arraybuffer" });
  const resultBuffer = Buffer.from(resultRes.data);

  return resultBuffer;
}

// Função principal
async function main(imgUrl) {
  const jpegBuffer = await img2anime(imgUrl, {
    prompt: "Anime Style, masterpiece, best quality",
  });

  let uploadedUrl = await up(jpegBuffer);
  return {
    img_url: uploadedUrl,
    mimetype: "image/jpeg",
  };
}

export default main;

// Exemplo de uso:
// main("https://telegra.ph/file/01b448987d90701414936.jpg").then(console.log);