import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

const axios = require('axios')

async function getCookies() {
try {
const response = await axios.get('https://www.pinterest.com/csrf_error/')
const setCookieHeaders = response.headers['set-cookie']
if (setCookieHeaders) {
const cookies = setCookieHeaders.map(cookieString => {
const cookieParts = cookieString.split(';')
return cookieParts[0].trim()
})
return cookies.join('; ')
}
console.warn('Nenhum cookie encontrado no cabeçalho da resposta.')
return null
} catch (error) {
console.error('Erro ao obter cookies:', error)
return null
}
}

async function pinterest3(query) {
try {
const cookies = await getCookies()
if (!cookies) return []
const params = {
source_url: `/search/pins/?q=${encodeURIComponent(query)}`,
data: JSON.stringify({
options: {
isPrefetch: false,
query: query,
scope: "pins",
no_fetch_context_on_resource: false,
article: null,
appliedProductFilters: ["videos"]
},
context: {}
}),
_: Date.now()
}
const headers = {
'accept': 'application/json, text/javascript, */*, q=0.01',
'accept-encoding': 'gzip, deflate',
'accept-language': 'en-US,en;q=0.9',
'cookie': cookies,
'dnt': '1',
'referer': 'https://www.pinterest.com/',
'sec-ch-ua': '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
'sec-ch-ua-full-version-list': '"Not(A:Brand";v="99.0.0.0", "Microsoft Edge";v="133.0.3065.92", "Chromium";v="133.0.6943.142"',
'sec-ch-ua-mobile': '?0',
'sec-ch-ua-model': '""',
'sec-ch-ua-platform': '"Windows"',
'sec-ch-ua-platform-version': '"10.0.0"',
'sec-fetch-dest': 'empty',
'sec-fetch-mode': 'cors',
'sec-fetch-site': 'same-origin',
'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0',
'x-app-version': 'c056fb7',
'x-pinterest-appstate': 'active',
'x-pinterest-pws-handler': 'www/[username]/[slug].js',
'x-pinterest-source-url': '/hargr003/cat-pictures/',
'x-requested-with': 'XMLHttpRequest'
}
const response = await axios.get('https://www.pinterest.com/resource/BaseSearchResource/get/', {
headers,
params
})
const results = response.data.resource_response.data.results
const mediaResults = []
for (const result of results) {
try {
const mediaItem = {
upload_by: result.pinner?.username || 'Desconhecido',
fullname: result.pinner?.full_name || 'Sem nome',
followers: result.pinner?.follower_count || 0,
caption: result.grid_title || 'Sem descrição',
source: `https://id.pinterest.com/pin/${result.id}`,
media: [],
type: 'image' // padrão
}
// 1. Primeiro verifica vídeos
if (result.videos?.video_list) {
mediaItem.type = 'video'
for (const [quality, data] of Object.entries(result.videos.video_list)) {
mediaItem.media.push({
url: data.url,
quality,
duration: data.duration,
content_type: data.content_type
})
}
}
// 2. Verifica GIFs (atualizado)
else if (result.images?.orig?.url?.match(/\.gif/i)) {
mediaItem.type = 'gif'
mediaItem.media.push({
url: result.images.orig.url,
content_type: 'image/gif'
})
}
// 3. Verifica vídeos alternativos (novo)
else if (result.embed?.src) {
const url = result.embed.src
if (url.includes('.mp4') || url.includes('.mov')) {
mediaItem.type = 'video'
mediaItem.media.push({
url,
content_type: 'video/mp4'
})
}
}
// 4. Só considera imagens se não encontrar outros tipos
else if (result.images) {
mediaItem.type = 'image'
for (const [size, data] of Object.entries(result.images)) {
mediaItem.media.push({
url: data.url,
content_type: 'image'
})
}
}
// Filtra somente vídeos e gifs, descartando imagens
if (mediaItem.type === 'video' || mediaItem.type === 'gif') {
mediaResults.push(mediaItem)
}
} catch (e) {
console.error('Erro no processamento:', e)
}
}
return {
status: true,
criador: '@paulo_mod_domina',
resultado: mediaResults
}
} catch (error) {
console.error('Erro na busca:', error)
return {
status: false,
error: error.message
}
}
}

export default { pinterest3, getCookies }