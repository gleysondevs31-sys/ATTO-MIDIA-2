import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');
const crypto = require('crypto');

async function downloadYouTube(link, format = '720') {
    const apiBase = "https://media.savetube.me/api";
    const apiCDN = "/random-cdn";
    const apiInfo = "/v2/info";
    const apiDownload = "/download";

    const decryptData = async (enc) => {
        try {
            const key = Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex');
            const data = Buffer.from(enc, 'base64');
            const iv = data.slice(0, 16);
            const content = data.slice(16);

            const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
            let decrypted = decipher.update(content);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            return JSON.parse(decrypted.toString());
        } catch (error) {
            return null;
        }
    };

    const request = async (endpoint, data = {}, method = 'post') => {
        try {
            const { data: response } = await axios({
                method,
                url: `${endpoint.startsWith('http') ? '' : apiBase}${endpoint}`,
                data: method === 'post' ? data : undefined,
                params: method === 'get' ? data : undefined,
                headers: {
                    'accept': '*/*',
                    'content-type': 'application/json',
                    'origin': 'https://yt.savetube.me',
                    'referer': 'https://yt.savetube.me/',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                }
            });
            return { status: true, data: response };
        } catch (error) {
            return { status: false, error: error.message };
        }
    };

    const youtubeID = link.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (!youtubeID) return { status: false, error: "Failed to extract video ID from URL." };

    try {
        const cdnRes = await request(apiCDN, {}, 'get');
        if (!cdnRes.status) return cdnRes;
        const cdn = cdnRes.data.cdn;

        const infoRes = await request(`https://${cdn}${apiInfo}`, { url: `https://www.youtube.com/watch?v=${youtubeID[1]}` });
        if (!infoRes.status) return infoRes;

        const decrypted = await decryptData(infoRes.data.data);
        if (!decrypted) return { status: false, error: "Failed to decrypt video data." };

        const downloadRes = await request(`https://${cdn}${apiDownload}`, {
            id: youtubeID[1],
            downloadType: format === 'mp3' ? 'audio' : 'video',
            quality: format,
            key: decrypted.key
        });

        return {
            dl_link: downloadRes.data.data.downloadUrl,
            title: decrypted.title || "Unknown",
            type: format === 'mp3' ? 'audio' : 'video',
            format: format
        };
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export default { downloadYouTube };