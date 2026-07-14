import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

const axios = require('axios')

async function getCliptoDownloadLinks(youtubeUrl) {
const csrfRes = await axios.get('https://www.clipto.com/api/csrf', {
headers: { 'Accept': 'application/json, text/plain, */*' }
});
const xsrfToken = csrfRes.data?.token || csrfRes.headers['set-cookie']?.find(c => c.startsWith('XSRF-TOKEN='));
const cookies = csrfRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ');
const postRes = await axios.post(
'https://www.clipto.com/api/youtube',
{ url: youtubeUrl },
{
headers: {
'Content-Type': 'application/json',
'Cookie': cookies,
'x-xsrf-token': xsrfToken,
'Origin': 'https://www.clipto.com',
'Referer': 'https://www.clipto.com/pt/media-downloader/youtube-downloader',
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
}
}
);
const data = postRes.data;
const videos = data.medias.filter(m => m.type === 'video' && m.ext === 'mp4');
videos.sort((a, b) => (b.height || 0) - (a.height || 0));
const bestVideo = videos[0];
let bestAudio;
const audiosMp3 = data.medias.filter(m => m.type === 'audio' && m.ext === 'mp3');
if (audiosMp3.length) {
audiosMp3.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
bestAudio = audiosMp3[0];
} else {
const audiosM4a = data.medias.filter(m => m.type === 'audio' && m.ext === 'm4a');
audiosM4a.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
bestAudio = audiosM4a[0];
}
const formatted = {
status: data.success,
criador: '@paulo_mod_domina',
resultados: {
source: data.source,
title: data.title,
author: data.author,
thumbnail: data.thumbnail,
duration: data.duration,
url: data.url,
video: {
formatId: bestVideo.formatId,
label: bestVideo.label,
type: bestVideo.ext,
links: { mp4: bestVideo.url }
},
audio: {
formatId: bestAudio.formatId,
label: bestAudio.label,
type: bestAudio.ext,
links: { [bestAudio.ext]: bestAudio.url }
}
}
};
// console.dir(formatted, { depth: 5 });
return formatted;
}

export default { getCliptoDownloadLinks }

// Exemplo de uso
// getCliptoDownloadLinks('https://youtube.com/watch?v=dWDa-AcL6uU')
// .then(result => console.log('Resultado formatado:', result))
// .catch(err => console.error('Erro ao obter resultados:', err))