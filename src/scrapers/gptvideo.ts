import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios')

/**
 * Gera vídeo a partir de texto e retorna o buffer do vídeo.
 * @param {string} prompt - Texto a ser convertido em vídeo.
 * @returns {Promise<Buffer>} Buffer do vídeo gerado.
 */
async function text2Video(prompt) {
try {
const initialResponse = await axios.request({
method: 'POST',
url: 'https://soli.aritek.app/txt2videov3',
headers: {
'authorization': 'eyJzdWIiwsdeOiIyMzQyZmczNHJ0MzR0weMzQiLCJuYW1lIjorwiSm9objMdf0NTM0NT',
'content-type': 'application/json; charset=utf-8',
'accept-encoding': 'gzip',
'user-agent': 'okhttp/4.11.0'
},
data: {
deviceID: Math.random().toString(16).substr(2, 8) + Math.random().toString(16).substr(2, 8),
prompt: prompt,
used: [],
versionCode: 51
}
});
const key = initialResponse.data.key;
const videoResponse = await axios.post('https://soli.aritek.app/video',
{ keys: [key] },
{
headers: {
'authorization': 'eyJzdWIiwsdeOiIyMzQyZmczNHJ0MzR0weMzQiLCJuYW1lIjorwiSm9objMdf0NTM0NT',
'content-type': 'application/json; charset=utf-8',
'accept-encoding': 'gzip',
'user-agent': 'okhttp/4.11.0'
}
}
);
const videoUrl = videoResponse.data.datas[0].url
const videoBufferResponse = await axios.get(videoUrl, {
responseType: 'arraybuffer'
})
return Buffer.from(videoBufferResponse.data)
} catch (error) {
throw error
}
}

export default { text2Video }