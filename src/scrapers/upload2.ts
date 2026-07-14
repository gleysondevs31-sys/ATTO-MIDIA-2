import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fileType = require('file-type')
const axios = require('axios')
const zerosite = "https://okarun-api.com.br"
const API_KEY_ZEROTWO = "inovação_2026"

export default async function upload(mediaBuffer, fileName = "file") {
return new Promise(async (resolve, reject) => {
try {// By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
// Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLULwI7P2B
console.log("Iniciando o processamento do media...")
if (Buffer.isBuffer(mediaBuffer)) {
console.log("Media recebido é um buffer. Preparando para upload...")
const mediaType = await fileType.fromBuffer(mediaBuffer)
console.log("Tipo de mídia detectado:", mediaType)
if (!mediaType) {
console.error("Não foi possível determinar o tipo do arquivo.")
return reject("Não foi possível determinar o tipo do arquivo.")
}
try {
const uploadRes = await axios.post(`${zerosite}/api/upload`, {
apikey: API_KEY_ZEROTWO,
media: mediaBuffer,
filename: fileName
}, {
headers: {
'Content-Type': 'multipart/form-data'
}
})
if (uploadRes.data.status) {
console.log("Link gerado com sucesso:", uploadRes.data.resultado)
resolve(uploadRes.data.resultado)
} else {
console.error("Erro ao gerar o link:", uploadRes.data.message || 'Erro desconhecido')
reject("Erro ao gerar o link.")
}
} catch (uploadError) {
console.error("Erro ao enviar para a API de upload:", uploadError.message)
reject("Falha ao enviar a mídia para a API.")
}
} else {
console.error("Erro: O formato do media não é um buffer.")
reject("Formato do media não suportado. Envie um buffer.")
}
} catch (error) {
console.error("Erro ao processar o media:", error.message)
reject("Falha ao processar o media: " + error.message)
}
})
}