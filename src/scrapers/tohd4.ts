import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

const axios = require('axios')
const FormData = require('form-data')

async function upscaleImage(imageBuffer, mimetype = 'image/jpeg') {
const form = new FormData();
form.append('myfile', imageBuffer, {
filename: 'image.jpg',
contentType: mimetype
});
form.append('scaleRadio', '2');
const uploadResponse = await axios.post('https://get1.imglarger.com/api/UpscalerNew/UploadNew', form, {
headers: {
'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
'Accept': 'application/json, text/plain, */*',
'origin': 'https://imgupscaler.com',
'referer': 'https://imgupscaler.com/',
...form.getHeaders()
}
}
);
if (uploadResponse.data.code !== 200) {
throw new Error(`Upload failed: ${uploadResponse.data.msg}`);
}
const { code } = uploadResponse.data.data;
for (let i = 0; i < 30; i++) {
await new Promise(resolve => setTimeout(resolve, 2000));
const statusResponse = await axios.post('https://get1.imglarger.com/api/UpscalerNew/CheckStatusNew', { code, scaleRadio: 2 }, {
headers: {
'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
'Accept': 'application/json, text/plain, */*',
'Content-Type': 'application/json',
'origin': 'https://imgupscaler.com',
'referer': 'https://imgupscaler.com/'
}
}
);
if (statusResponse.data.code === 200 && statusResponse.data.data.status === 'success') {
const imageDownload = await axios.get(statusResponse.data.data.downloadUrls[0], {
responseType: 'arraybuffer'
})
return imageDownload.data
}
if (statusResponse.data.data.status === 'error') {
throw new Error('Processing failed on server')
}
}
throw new Error('Processing timeout - maximum retries exceeded')
}

export default { upscaleImage }