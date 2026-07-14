import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B
async function buscarAptoide(query) {
if (!query) throw new Error("Por favor, insira o nome do aplicativo.")
const aptoide = await axios.get(`https://ws75.aptoide.com/api/7/apps/search?query=${encodeURIComponent(query)}&trusted=true`)
if (aptoide.data.datalist.total === 0) throw new Error("Nenhum aplicativo encontrado.")
const appData = aptoide.data.datalist.list[0]
const appSize = (appData.size / 1048576).toFixed(1)
let phAptoide
try {
phAptoide = await (await fetch(appData.graphic)).buffer()
} catch {
phAptoide = null
}
const lnDown = await axios.get(`https://tinyurl.com/api-create.php?url=${appData.file.path_alt}`)
let apkBuffer
try {
apkBuffer = await (await fetch(appData.file.path)).buffer()
} catch {
throw new Error("Não foi possível baixar o APK no momento.")
}
return {
nome: appData.name,
tamanho: `${appSize} MB`,
desenvolvedor: appData.store.name,
downloads: appData.stats.downloads,
link: lnDown.data,
apkBuffer,
thumbnail: phAptoide
}
}

export default { buscarAptoide }