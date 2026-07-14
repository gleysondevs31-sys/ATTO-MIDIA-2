import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

class AmpDownloader {
constructor() {
this.axios = require('axios');
this.wrapper = require('axios-cookiejar-support').wrapper;
this.FormData = require('form-data');
this.WebSocket = require('ws');
this.cheerio = require('cheerio');
this.CookieJar = require('tough-cookie').CookieJar;
this.crypto = require('crypto');
this.config = {
apiBase: {
video: 'https://amp4.cc',
audio: 'https://amp3.cc'
},
headers: {
Accept: 'application/json',
'User-Agent': 'Postify/1.0.0'
},
ytRegex: /^((?:https?:)?\/\/)?((?:www|m|music)\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([a-zA-Z0-9_-]{11})/,
formats: {
video: ['144p', '240p', '360p', '480p', '720p', '1080p'],
audio: ['64k', '128k', '192k', '256k', '320k']
}
};
this.jar = new this.CookieJar();
this.client = this.wrapper(this.axios.create({ jar: this.jar }));
}
validateUrl(url) {
if (!url) return { error: "❌ Cadê o link? Não dá pra baixar sem link! 🗿" };
const match = url.match(this.config.ytRegex);
if (!match) return { error: "❌ Link inválido! Por favor, envie um link do YouTube. 🎬" };
return { id: match[3] };
}
validateFormat(quality, isAudio) {
const available = isAudio ? this.config.formats.audio : this.config.formats.video;
if (!quality || !available.includes(quality)) {
return {
error: `❌ Qualidade/formato não disponível!`,
available
};
}
return true;
}

solveCaptcha(challenge) {
const crypto = this.crypto;
return new Promise((resolve, reject) => {
const { algorithm, challenge: data, salt, maxnumber } = challenge;
let found = false;
for (let i = 0; i <= maxnumber; i++) {
const hash = crypto.createHash(algorithm.toLowerCase())
.update(salt + i)
.digest('hex');
if (hash === data) {
found = true;
return resolve(Buffer.from(JSON.stringify({
algorithm,
challenge: data,
number: i,
salt,
signature: challenge.signature,
took: Date.now()
})).toString('base64'));
}
}
if (!found) reject(new Error('❌ Falha na verificação do captcha! 🤖'));
});
}
createWebSocket(id, isAudio) {
const WebSocket = this.WebSocket;
const config = this.config;
return new Promise((resolve, reject) => {
const ws = new WebSocket(`wss://${isAudio ? 'amp3' : 'amp4'}.cc/ws`, ['json'], {
headers: { ...config.headers, Origin: config.apiBase[isAudio ? 'audio' : 'video'] },
rejectUnauthorized: false
});
const timeout = setTimeout(() => {
ws.close();
reject(new Error('⏰ Tempo de conexão esgotado! Tente novamente.'));
}, 30000);
let fileInfo = {};
ws.on('open', () => ws.send(id));
ws.on('message', (data) => {
const res = JSON.parse(data);
if (res.event === 'query' || res.event === 'queue') {
fileInfo = {
thumbnail: res.thumbnail,
title: res.title,
duration: res.duration,
uploader: res.uploader
};
} else if (res.event === 'file' && res.done) {
clearTimeout(timeout);
ws.close();
resolve({ ...fileInfo, ...res });
}
});
ws.on('error', (err) => {
clearTimeout(timeout);
reject(new Error('❌ Erro na conexão WebSocket! 🚫'));
});
});
}

convertMedia(url, format, quality, isAudio = false) {
const self = this;
return new Promise((resolve, reject) => {
const urlValidation = self.validateUrl(url);
if (urlValidation.error) return resolve({ error: urlValidation.error });
const formatValidation = self.validateFormat(quality, isAudio);
if (formatValidation.error) return resolve(formatValidation);
const baseUrl = self.config.apiBase[isAudio ? 'audio' : 'video'];
const videoId = urlValidation.id;
self.client.get(baseUrl).then(({ data }) => {
const $ = self.cheerio.load(data);
const csrfToken = $('meta[name="csrf-token"]').attr('content');
if (!csrfToken) return reject(new Error('❌ Token de segurança não encontrado! 🔒'));
const form = new self.FormData();
form.append('url', `https://youtu.be/${videoId}`);
form.append('format', format);
form.append('quality', quality);
form.append('service', 'youtube');
form.append('_token', csrfToken);
if (isAudio) form.append('playlist', 'false');
self.client.get(`${baseUrl}/captcha`, {
headers: { ...self.config.headers, Origin: baseUrl, Referer: baseUrl }
}).then(({ data: captcha }) => {
if (captcha) {
self.solveCaptcha(captcha).then((altcha) => {
form.append('altcha', altcha);
submitForm();
}).catch(() => {
submitForm();
});
} else {
submitForm();
}
}).catch(() => {
submitForm();
});

function submitForm() {
const endpoint = isAudio ? '/convertAudio' : '/convertVideo';
self.client.post(`${baseUrl}${endpoint}`, form, {
headers: {
...form.getHeaders(),
...self.config.headers,
Origin: baseUrl,
Referer: baseUrl
}
}).then(({ data: response }) => {
if (!response.success) return reject(new Error(`❌ Erro ao converter: ${response.message || 'Falha desconhecida.'} 😢`));
self.createWebSocket(response.message, isAudio).then((wsResult) => {
const downloadUrl = `${baseUrl}/dl/${wsResult.worker}/${response.message}/${encodeURIComponent(wsResult.file)}`;
resolve({
dl_link: downloadUrl,
title: wsResult.title || "Sem título",
type: isAudio ? 'audio' : 'video',
format,
thumbnail: wsResult.thumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
id: videoId,
duration: wsResult.duration,
quality,
channel_uploader: wsResult.uploader
});
}).catch((err) => {
resolve({ error: `❌ Erro ao conectar ao WebSocket: ${err.message} 🚫` });
});
}).catch((error) => {
resolve({ error: `❌ Erro ao enviar o formulário: ${error.message} 📤` });
});
}
}).catch((error) => {
resolve({ error: `❌ Erro ao acessar o site: ${error.message} 🌐` });
});
});
}
}

export default AmpDownloader;

//new AmpDownloader().convertMedia('https://www.youtube.com/watch?v=hv8Wx5UNTak', 'mp4', '720p', false).then(console.log)