import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const FormData = require('form-data')

async function uploadToCatbox2(imageBuffer) {
try {
const formData = new FormData()
formData.append('reqtype', 'fileupload')
formData.append('fileToUpload', imageBuffer, 'foto.jpg')
const response = await fetch('https://catbox.moe/user/api.php', {
method: 'POST',
body: formData,
headers: formData.getHeaders()
})
if (!response.ok) {
throw new Error(`Erro no upload: ${response.statusText}`)
}
return await response.text()
} catch (error) {
console.error('Erro ao enviar para Catbox:', error)
return null
}
}

export default { uploadToCatbox2 }