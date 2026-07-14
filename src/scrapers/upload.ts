import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const FormData = require('form-data')
const { fromBuffer } = require('file-type')
const axios = require('axios')

async function uploadToImgur(buffer) {
return new Promise(async (resolve, reject) => {
try {
const base64Image = buffer.toString('base64')
const response = await axios.post('https://api.imgur.com/3/image', {
image: base64Image,
type: 'base64'
}, {
headers: {
'Authorization': 'Client-ID b3db908dbe6a8a1'
}
})
if (response.data && response.data.data && response.data.data.link) {
resolve(response.data.data.link)
} else {
reject(new Error('Erro no retorno da API do Imgur: ' + JSON.stringify(response.data)))
}
} catch (erro) {
reject('Erro no upload para o Imgur: ' + erro.message)
}
})
}

export default async (buffer) => {
try {
const { ext } = await fromBuffer(buffer)
let form = new FormData()
form.append('file', buffer, 'tmp.' + ext)
let res = await fetch('https://telegra.ph/upload', {
method: 'POST',
body: form
})
let img = await res.json()
if (img.error) throw img.error
return 'https://telegra.ph' + img[0].src
} catch (erro) {
console.log(`Erro no upload para Telegra.ph: ${erro.message}. Tentando Imgur...`)
try {
const imgurLink = await uploadToImgur(buffer)
return imgurLink
} catch (imgurErro) {
throw new Error(`Falha no upload tanto para Telegra.ph quanto para Imgur: ${imgurErro.message}`)
}
}
}