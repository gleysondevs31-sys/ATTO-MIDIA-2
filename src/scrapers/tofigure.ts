import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require("axios");
const fs = require("fs");
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

// Transforma imagem em estilo "figure"
async function tofigure(input, options = {}) {
  const {
    prompt = "convert this photo into anime figure style, high quality collectible sculpture, dynamic pose"
  } = options;

  let buffer;
  if (/^https?:\/\//.test(input)) {
    const res = await axios.get(input, { responseType: "arraybuffer" });
    buffer = Buffer.from(res.data);
  } else {
    buffer = fs.readFileSync(input);
  }

  const imageBase64 = buffer.toString("base64");

  const payload = {
    image: imageBase64,
    prompt
  };

  const res = await axios.post(
    "https://ai-studio.anisaofc.my.id/api/edit-image",
    payload,
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*",
        "Content-Type": "application/json",
        "Origin": "https://ai-studio.anisaofc.my.id",
        "Referer": "https://ai-studio.anisaofc.my.id/"
      }
    }
  );

  const resultUrl = res.data.imageUrl;
  const resultRes = await axios.get(resultUrl, { responseType: "arraybuffer" });
  const resultBuffer = Buffer.from(resultRes.data);

  const uploadedUrl = await up(resultBuffer);
  return {
    img_url: uploadedUrl,
    mimetype: "image/jpeg"
  };
}

export default tofigure;

// Exemplo de uso:
// tofigure("https://telegra.ph/file/01b448987d90701414936.jpg").then(console.log);
// tofigure("./background.jpg").then(console.log);