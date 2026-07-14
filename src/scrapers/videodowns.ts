import { createRequire } from 'module';
const require = createRequire(import.meta.url);
/* Scrape Youtube Downloader
• Source: https://whatsapp.com/channel/0029VakezCJDp2Q68C61RH2C
• New Update 21 Juni 2025.
*/

class VideoDownsDownloader {
constructor() {
this.axios = require('axios');
this.FormData = require('form-data');
}
ytdl(url, reqFormat = 'best', callback) {
const self = this;
try {
const form = new self.FormData();
form.append('url', url);
const headers = {
...form.getHeaders(),
origin: 'https://www.videodowns.com',
referer: 'https://www.videodowns.com/youtube-video-downloader.php',
'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
};
self.axios.post(
'https://www.videodowns.com/youtube-video-downloader.php?action=get_info',
form,
{ headers }
).then(function (response) {
const data = response.data;
if (!data.success || !data.formats)
return callback(new Error('❌ Falha ao obter dados do vídeo.'));
const formats = data.formats;
const formatMap = {
best: 'best',
'720p': 'medium',
'480p': 'low',
mp3: 'audio'
};
const selectedKey = formatMap[reqFormat.toLowerCase()] || 'best';
const selected = formats[selectedKey];
if (!selected || !selected.ext)
return callback(new Error(`❌ Formato "${reqFormat}" não está disponível.`));
const info = data.info;
const title = info.title || 'Vídeo';
const downloadURL = `https://www.videodowns.com/youtube-video-downloader.php?download=1&url=${encodeURIComponent(url)}&format=${selectedKey}`;
return callback(null, {
title,
thumbnail: data.thumbnail,
sanitized: data.sanitized,
format: selectedKey,
ext: selected.ext || 'mp4',
url: downloadURL,
allFormats: formats,
channel: info.channel || info.author || 'Desconhecido',
views: info.view_count || 0
});
}).catch(function (err) {
return callback(new Error(`❌ Erro ao acessar o serviço: ${err?.message || err}`));
});
} catch (err) {
return callback(new Error(`❌ Erro inesperado: ${err?.message || err}`));
}
}
}

/*const downloader = new VideoDownsDownloader();
downloader.ytdl('https://youtube.com/watch?v=qdpXxGPqW-Y', 'mp3', function (err, result) {
if (err) {
console.error('Erro:', err.message);
} else {
console.log(result);
}
}); */

export default VideoDownsDownloader;