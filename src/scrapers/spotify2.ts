import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require("axios")
const chalk = require("chalk")
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B
const client_id = "acc6302297e040aeb6e4ac1fbdfd62c3"
const client_secret = "0e8439a1280a43aba9a5bc0a16f3f009"
const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64")
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token"
// Função para autenticar no Spotify
async function spotifyCreds() {
try {
const response = await axios.post(
TOKEN_ENDPOINT,
"grant_type=client_credentials",
{
headers: {
Authorization: "Basic " + basic,
},
}
)
return {
status: true,
data: response.data,
}
} catch (error) {
return {
status: false,
msg: "Erro. Verifique As Credenciais.",
}
}
}
// Função para formatar o tempo
const toTime = (ms) => {
let h = Math.floor(ms / 3600000)
let m = Math.floor(ms / 60000) % 60
let s = Math.floor(ms / 1000) % 60
return [h, m, s]
.map((v) => v.toString().padStart(2, "0"))
.join(":")
}
// Classe Spotify
class Spotify {
download = async function dl(url) {
try {
console.log(chalk.blue("🔍 Obtendo informações da música..."))
const response = await axios.get(
`https://api.fabdl.com/spotify/get?url=` + url,
{
headers: {
Accept: "application/json, text/plain, */*",
"Content-Type": "application/json",
"User-Agent":
"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
},
}
).catch((e) => e.response)
if (!response.data.result) {
return {
msg: "❌ Erro Ao Puxar Informações Da Track",
}
}
console.log(chalk.green("🎵 Iniciando o download..."))
const { data } = await axios.get(
`https://api.fabdl.com/spotify/mp3-convert-task/${response.data.result.gid}/${response.data.result.id}`
).catch((e) => e.response)
if (!data?.result?.download_url)
return {
msg: "❌ Download Indisponível",
}
return {
title: response.data.result.name,
duration: toTime(response.data.result.duration_ms),
cover: response.data.result.image,
download: "https://api.fabdl.com" + data?.result?.download_url,
}
} catch (error) {
return {
msg: "❌ Erro Detectado",
err: chalk.red(error.message),
}
}
}
}

export default Spotify