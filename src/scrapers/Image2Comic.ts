import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

/* 
• Scrape Imagem para Quadrinhos
• Author : SaaOfc's
*/

const axios = require('axios')
const FormData = require('form-data')

async function Image2Comic(imageUrl) {
try {
const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' })
const imageBuffer = Buffer.from(imageRes.data)
const form = new FormData()
form.append('hidden_image_width', '1712')
form.append('hidden_image_height', '2560')
form.append('upload_file', imageBuffer, {
filename: 'image.jpg',
contentType: 'image/jpeg'
})
form.append('brightness', '50')
form.append('line_size', '2')
form.append('screentone', 'true')
const id = Math.random().toString(36).substring(2, 15)
const uploadUrl = `https://tech-lagoon.com/canvas/image-to-comic?id=${id}&new_file=true`
const uploadRes = await axios.post(uploadUrl, form, {
headers: {
...form.getHeaders(),
'origin': 'https://tech-lagoon.com',
'referer': 'https://tech-lagoon.com/imagechef/en/image-to-comic.html',
'x-requested-with': 'XMLHttpRequest',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
},
})
if (!Array.isArray(uploadRes.data)) {
throw new Error('Não foi possível obter resultados')
}
const [resId, filename] = uploadRes.data
const n = Math.floor(Math.random() * 9000 + 1000)
const hasil = `https://tech-lagoon.com/imagechef/image-to-comic/${resId}?n=${n}`
return { hasil }
} catch (err) {
console.error('Error:', err.message)
throw err
}
}

export default { Image2Comic }