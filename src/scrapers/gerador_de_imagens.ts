import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

/*

* EXEMPLO:

const generateImage = require('./seu-modulo');

// Rota para gerar e servir a imagem diretamente
app.get('/imagem', async (req, res) => {
const prompt = req.query.prompt;
if (!prompt) {
return res.status(400).send('Parâmetro "prompt" é obrigatório');
}
try {
const imageUrl = await generateImage(prompt)
const imageResponse = await fetch(imageUrl)
if (!imageResponse.ok) {
throw new Error(`Erro ao baixar imagem: ${imageResponse.statusText}`)
}
const imageBuffer = await imageResponse.buffer()
const contentType = imageResponse.headers.get('content-type') || 'image/png'
res.setHeader('Content-Type', contentType)
res.setHeader('Content-Length', imageBuffer.length)
res.setHeader('Cache-Control', 'public, max-age=604800')
res.send(imageBuffer)
} catch (error) {
console.error('Erro:', error)
res.status(500).send('Erro ao gerar imagem: ' + error.message)
}
})

*/

const FormData = require('form-data')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

export default async function generateImage(prompt) {
try {
const HF_API_TOKEN = "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";
const HF_API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
const hfResponse = await fetch(HF_API_URL, {
method: "POST",
headers: {
"Authorization": `Bearer ${HF_API_TOKEN}`,
"Content-Type": "application/json"
},
body: JSON.stringify({
inputs: prompt,
parameters: {
width: 1024,
height: 1024,
num_inference_steps: 50,
guidance_scale: 7.5
}
})
});
if (!hfResponse.ok) {
const error = await hfResponse.text();
throw new Error(`Hugging Face API error: ${error}`);
}
const imageBuffer = await hfResponse.buffer()
const form = new FormData();
form.append('reqtype', 'fileupload');
form.append('fileToUpload', imageBuffer, {
filename: 'image.png',
contentType: 'image/png'
})
const catboxResponse = await fetch('https://catbox.moe/user/api.php', {
method: 'POST',
body: form
})
return await catboxResponse.text()
} catch (error) {
console.error('Erro no processo:', error)
throw new Error('Falha ao gerar imagem')
}
}