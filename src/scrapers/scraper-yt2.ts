//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Vb69bDnAe5VmzSMwBH11

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Extrai o ID do vídeo do YouTube a partir da URL
 * @param {string} url - URL do YouTube
 * @returns {string|null} - ID do vídeo
 */
function extractId(url = '') {
const patterns = [
/youtu\.be\/([^&?/]+)/,
/youtube\.com\/watch\?v=([^&?/]+)/,
/youtube\.com\/embed\/([^&?/]+)/,
/youtube\.com\/v\/([^&?/]+)/,
/youtube\.com\/shorts\/([^&?/]+)/
];
for (const pattern of patterns) {
const match = String(url).match(pattern);
if (match && match[1]) {
return match[1];
}
}
return null;
}

/**
 * Converte vídeo do YouTube para MP3/MP4 usando a API do Cobalt (Instância Pública)
 * @param {string} url - URL do YouTube
 * @returns {Promise<object>} - Objeto com links de download
 */
async function ytmp3(url) {
const videoId = extractId(url);
if (!videoId) {
throw new Error('URL do YouTube inválida ou não suportada');
}

// Lista de instâncias públicas do Cobalt para fallback
const instances = [
'api.qwkuns.me',
'api.dl.woof.monster',
'cobalt-api.kwiatekmiki.com'
];

const headers = {
'Accept': 'application/json',
'Content-Type': 'application/json',
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
};

/**
 * Tenta converter usando uma instância específica
 */
async function tryInstance(instance, format) {
const response = await fetch(`https://${instance}/`, {
method: 'POST',
headers,
body: JSON.stringify({
url: url,
videoQuality: 'max',
audioFormat: format === 'mp3' ? 'best' : 'best',
downloadMode: format === 'mp3' ? 'audio' : 'auto',
youtubeVideoCodec: 'h264'
})
});
if (!response.ok) {
const errorData = await response.json().catch(() => ({}));
throw new Error(errorData.error?.code || `HTTP ${response.status}`);
}
const data = await response.json();
if (data.status === 'error') {
throw new Error(data.error.code);
}
return {
url: data.url,
title: data.filename || 'YouTube Video',
status: data.status
};
}
const results = {
id: videoId,
title: 'YouTube Video',
mp3: null,
mp4: null,
mp3Info: null,
mp4Info: null
};
for (const instance of instances) {
try {
console.log(`Tentando instância ${instance} (Qualidade Máxima)...`);
const [mp3Res, mp4Res] = await Promise.allSettled([
tryInstance(instance, 'mp3'),
tryInstance(instance, 'mp4')
]);
if (mp3Res.status === 'fulfilled') {
results.mp3 = mp3Res.value.url;
results.mp3Info = { title: mp3Res.value.title };
results.title = mp3Res.value.title;
}
if (mp4Res.status === 'fulfilled') {
results.mp4 = mp4Res.value.url;
results.mp4Info = { title: mp4Res.value.title };
results.title = mp4Res.value.title;
}
if (results.mp3 || results.mp4) {
break; // Sucesso em pelo menos um formato
}
} catch (err) {
console.error(`Erro na instância ${instance}: ${err.message}`);
continue; // Tenta a próxima instância
}
}
if (!results.mp3 && !results.mp4) {
throw new Error('Não foi possível converter o vídeo em nenhuma das instâncias disponíveis.');
}
return results;
}

/**
 * Valida se uma URL é do YouTube
 * @param {string} url - URL para validar
 * @returns {boolean}
 */
function isValidYouTubeUrl(url) {
const youtubeDomains = [
'youtube.com',
'youtu.be',
'www.youtube.com',
'm.youtube.com'
];
try {
const urlObj = new URL(url);
return youtubeDomains.includes(urlObj.hostname.replace('www.', ''));
} catch {
return false;
}
}

export default { ytmp3, extractId, isValidYouTubeUrl }