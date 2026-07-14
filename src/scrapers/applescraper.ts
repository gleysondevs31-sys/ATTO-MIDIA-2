import { createRequire } from 'module';
const require = createRequire(import.meta.url);
/**
 * Scraper do Apple Music
 * Desenvolvido por: @paulo_mod_domina
 * Atualizado: 2025
 */

const axios = require("axios")
const cheerio = require("cheerio")
const fs = require("fs")
const FormData = require("form-data")
const path = require("path")
const CRIADOR = "@paulo_mod_domina"

/**
 * Busca músicas no Apple Music/iTunes
 * @param {string} q - Termo de busca
 * @returns {Promise<Object>} Objeto com status, criador e resultados
 */
async function search2(q) {
try {
const resposta = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=25`, {
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
},
timeout: 10000
})
if (resposta.data && resposta.data.results && resposta.data.results.length > 0) {
const resultados = [];
for (const item of resposta.data.results) {
if (item.trackName && item.artistName) {
resultados.push({
titulo: item.trackName,
imagem: item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '600x600') : '',
musica: item.trackViewUrl,
artista: {
nome: item.artistName,
url: item.artistViewUrl || ''
},
preview: item.previewUrl || null,
idFaixa: item.trackId,
genero: item.primaryGenreName || '',
pais: item.country || '',
dataLancamento: item.releaseDate || '',
duracao: item.trackTimeMillis ? Math.floor(item.trackTimeMillis / 1000) : 0,
album: item.collectionName || '',
idAlbum: item.collectionId || '',
preco: item.trackPrice || '',
moeda: item.currency || '',
explicito: item.trackExplicitness === 'explicit'
})
}
}
return {
status: true,
criador: CRIADOR,
resultados: resultados
}
}
const respostaHtml = await axios.get(`https://music.apple.com/search?term=${encodeURIComponent(q)}`, {
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
}
})
const $ = cheerio.load(respostaHtml.data)
const resultados = [];
$('.songs-list-row, .shelf-grid__item, .tracklist-item').each((i, el) => {
try {
const titulo = $(el).find('.songs-list-row__song-name, .tracklist-item__text__headline, .product-lockup__title').text().trim()
const nomeArtista = $(el).find('.songs-list-row__by-line, .tracklist-item__text__artist, .product-lockup__subtitle').text().trim()
const urlArtista = $(el).find('.songs-list-row__by-line a, .tracklist-item__text__artist a, .product-lockup__subtitle a').attr('href') || ''
const urlMusica = $(el).find('a.songs-list-row__song-link, a.tracklist-item__target, a.product-lockup__title').attr('href') ||
$(el).find('a').first().attr('href')
let imagem = $(el).find('img').attr('src') || ''
if (imagem && imagem.includes('?')) {
imagem = imagem.split('?')[0]
}
if (titulo && nomeArtista && urlMusica) {
resultados.push({
titulo: titulo,
imagem: imagem,
musica: urlMusica,
artista: {
nome: nomeArtista,
url: urlArtista
}
})
}
} catch (erro) {
console.error('Erro ao processar item:', erro.message)
}
})
return {
status: true,
criador: CRIADOR,
resultados: resultados
}
} catch (erro) {
console.error('Erro na busca:', erro.message)
return {
status: false,
criador: CRIADOR,
erro: `Falha na busca: ${erro.message}`,
resultados: []
}
}
}

/**
 * Baixa informações e links de download a partir da URL da música
 * @param {string} url - URL da música no Apple Music/iTunes
 * @returns {Promise<Object>} Informações da música e links de download
 */
async function download(url) {
try {
if (!url.includes('itunes.apple.com') && !url.includes('music.apple.com')) {
return {
status: false,
criador: CRIADOR,
erro: 'URL inválida. Deve ser uma URL do iTunes ou Apple Music.',
resultados: null
}
}
let idFaixa = null
if (url.includes('i=')) {
idFaixa = url.split('i=')[1]
if (idFaixa && idFaixa.includes('&')) {
idFaixa = idFaixa.split('&')[0]
}
} else if (url.includes('/id')) {
const idMatch = url.match(/\/id(\d+)/)
if (idMatch && idMatch[1]) {
idFaixa = idMatch[1]
}
}
const info = {
metadados: {
nome: '',
artista: '',
album: '',
imagem: '',
url: url,
genero: '',
dataLancamento: '',
duracao: 0,
pais: '',
explicito: false
},
musica: url,
download: null,
download_completo: null,
download_catbox: null,
preview: null,
preview_catbox: null,
downloads_alternativos: []
}
let dadosApi = null
if (idFaixa) {
try {
const respostaApi = await axios.get(`https://itunes.apple.com/lookup?id=${idFaixa}`, {
timeout: 8000
})
if (respostaApi.data && respostaApi.data.results && respostaApi.data.results.length > 0) {
dadosApi = respostaApi.data.results[0]
info.metadados = {
nome: dadosApi.trackName || '',
artista: dadosApi.artistName || '',
album: dadosApi.collectionName || '',
imagem: dadosApi.artworkUrl100 ? dadosApi.artworkUrl100.replace('100x100', '600x600') : '',
url: url,
genero: dadosApi.primaryGenreName || '',
dataLancamento: dadosApi.releaseDate || '',
duracao: dadosApi.trackTimeMillis ? Math.floor(dadosApi.trackTimeMillis / 1000) : 0,
pais: dadosApi.country || '',
explicito: dadosApi.trackExplicitness === 'explicit',
idFaixa: dadosApi.trackId,
idArtista: dadosApi.artistId,
idAlbum: dadosApi.collectionId
}
if (dadosApi.previewUrl) {
info.preview = dadosApi.previewUrl
}
if (dadosApi.trackViewUrl) {
info.musica = dadosApi.trackViewUrl
}
}
} catch (erroApi) {
console.error('Erro na API do iTunes:', erroApi.message)
}
}
const resposta = await axios.get(url, {
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
},
timeout: 10000
})
const $ = cheerio.load(resposta.data)
if (!dadosApi) {
info.metadados.nome = $('meta[property="og:title"]').attr('content') || 
$('.product-name, h1.song-name, h1').first().text().trim() || 
'Música Desconhecida'
let nomeArtista = $('meta[property="og:description"]').attr('content') || 
$('.product-artist, .artist-name').text().trim() || 
'Artista Desconhecido'
if (nomeArtista.includes('Song by') || nomeArtista.includes('Álbum por')) {
nomeArtista = nomeArtista.replace(/(Song by|Álbum por)/i, '').trim()
}
info.metadados.artista = nomeArtista
info.metadados.album = $('.product-info__parent-link, .album-link').text().trim() || 'Álbum Desconhecido'
info.metadados.imagem = $('meta[property="og:image"]').attr('content') || 
 $('.we-artwork__image, .product-artwork img').attr('src') || ''
}
const conteudoPagina = resposta.data
const padraoMedia = /(https?:\/\/[^"'\s]+\.(mp3|mp4|m4a|aac|wav))/gi;
const mediaEncontradas = conteudoPagina.match(padraoMedia) || []
const scriptTags = $('script').toArray()
let jsonData = null
for (const tag of scriptTags) {
const scriptContent = $(tag).html()
if (scriptContent && scriptContent.includes('musicKit') && scriptContent.includes('song')) {
try {
const matches = scriptContent.match(/(\{.*?\})/g)
if (matches) {
for (const match of matches) {
try {
const data = JSON.parse(match)
if (data && (data.songId || data.previewUrl || data.assetUrl)) {
jsonData = data
break
}
} catch (e) {
}
}
}
} catch (e) {
console.error('Erro ao extrair JSON:', e.message)
}
}
}
$('[data-preview-url], [data-asset-url], [data-url]').each((i, el) => {
const previewUrl = $(el).attr('data-preview-url')
const assetUrl = $(el).attr('data-asset-url')
const dataUrl = $(el).attr('data-url')
if (previewUrl && previewUrl.includes('http')) {
mediaEncontradas.push(previewUrl)
}
if (assetUrl && assetUrl.includes('http')) {
mediaEncontradas.push(assetUrl)
}
if (dataUrl && dataUrl.includes('http') && (dataUrl.includes('.mp3') || dataUrl.includes('.mp4'))) {
mediaEncontradas.push(dataUrl)
}
})
const padraoApple = /(https?:\/\/[^"'\s]+\.music\.apple\.com[^"'\s]+)/gi;
const urlsApple = conteudoPagina.match(padraoApple) || []
const padroesMedia = [
/previewURL\s*=\s*["']([^"']+)["']/i,
/assetURL\s*=\s*["']([^"']+)["']/i,
/streamURL\s*=\s*["']([^"']+)["']/i,
/"preview":"([^"]+)"/i,
/"asset":"([^"]+)"/i,
/"stream":"([^"]+)"/i
];
for (const padrao of padroesMedia) {
const match = conteudoPagina.match(padrao)
if (match && match[1]) {
const url = match[1].replace(/\\u002F/g, '/')
if (url.startsWith('http')) {
mediaEncontradas.push(url)
}
}
}
const mediaUnica = [...new Set(mediaEncontradas)]
const previews = mediaUnica.filter(url => 
url.includes('preview') || 
url.includes('30sec') || 
url.includes('snippet')
)
const potenciaisCompletas = mediaUnica.filter(url => 
!url.includes('preview') && 
!url.includes('30sec') && 
!url.includes('snippet') &&
(url.includes('.mp3') || url.includes('.mp4') || url.includes('.m4a'))
)
if (previews.length > 0) {
info.preview = previews[0]
}
if (potenciaisCompletas.length > 0) {
info.download_completo = potenciaisCompletas[0]
potenciaisCompletas.forEach((url, index) => {
if (index > 0) {
info.downloads_alternativos.push({
fonte: 'extração-html',
url: url,
qualidade: 'desconhecida'
})
}
})
}
try {
const termoBusca = `${info.metadados.nome} ${info.metadados.artista} ${info.metadados.album} audio oficial`
if (info.musica && !info.download_completo) {
info.download_completo = info.musica
info.downloads_alternativos.push({
fonte: 'apple-music',
url: info.musica,
qualidade: 'original'
})
}
try {
const respostaYt = await axios.get(`https://music-finder-api.vercel.app/api/search?q=${encodeURIComponent(termoBusca)}`, { 
timeout: 12000
})
if (respostaYt.data && respostaYt.data.results && respostaYt.data.results.length > 0) {
const primeiroResultado = respostaYt.data.results[0]
if (!info.download_completo) {
info.download_completo = primeiroResultado.url
}
info.downloads_alternativos.push({
fonte: 'youtube-music',
url: primeiroResultado.url,
qualidade: 'alta'
})
}
} catch (erro) {
}
if (!info.download_completo) {
try {
const respostaAlt2 = await axios.get(`https://mp3-api.vercel.app/api/download?search=${encodeURIComponent(termoBusca)}`, {
timeout: 12000
})
if (respostaAlt2.data && respostaAlt2.data.url) {
info.download_completo = respostaAlt2.data.url
info.downloads_alternativos.push({
fonte: 'mp3-api',
url: respostaAlt2.data.url,
qualidade: 'média'
})
}
} catch (erro) {
}
}
if (!info.download_completo) {
try {
const respostaAlt3 = await axios.get(`https://yt-dlapi.vercel.app/api/download?url=https://music.youtube.com/search?q=${encodeURIComponent(termoBusca)}`, {
timeout: 12000
})
if (respostaAlt3.data && respostaAlt3.data.url) {
info.download_completo = respostaAlt3.data.url
info.downloads_alternativos.push({
fonte: 'yt-dlapi',
url: respostaAlt3.data.url,
qualidade: 'alta'
})
}
} catch (erro) {
}
}
if (!info.download_completo) {
try {
const respostaAlt4 = await axios.get(`https://ytmusic-download.vercel.app/api/search?q=${encodeURIComponent(termoBusca)}`, {
timeout: 15000
})
if (respostaAlt4.data && respostaAlt4.data.results && respostaAlt4.data.results.length > 0) {
const track = respostaAlt4.data.results[0]
if (track.downloadUrl) {
info.download_completo = track.downloadUrl
info.downloads_alternativos.push({
fonte: 'ytmusic-download',
url: track.downloadUrl,
qualidade: 'máxima'
})
}
}
} catch (erro) {
}
}
} catch (erro) {
console.error('Erro ao buscar versão completa:', erro.message)
}
info.download = info.musica || info.download_completo || info.preview || null
if (info.musica && !info.download_catbox) {
try {
console.log('Tentando obter música completa do iTunes/Apple Music...')
const consultaEspecifica = `${info.metadados.nome} ${info.metadados.artista} ${info.metadados.album} completa mp3 download`
let musicaEncontrada = false
try {
const respostaDirect = await axios.get(`https://music-dl-api.herokuapp.com/api/find?query=${encodeURIComponent(consultaEspecifica)}`, {
timeout: 15000
})
if (respostaDirect.data && respostaDirect.data.url) {
console.log('Música encontrada via Direct Link Finder')
const urlDownload = respostaDirect.data.url
const respostaMusica = await axios({
method: 'get',
url: urlDownload,
responseType: 'arraybuffer',
timeout: 30000,
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
}
})
if (respostaMusica.status === 200) {
const extensao = 'mp3'
const nomeArquivoMusica = `musica_${info.metadados.artista.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${info.metadados.nome.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${Date.now()}.${extensao}`
info.download_catbox = await uploadToCatbox(Buffer.from(respostaMusica.data), nomeArquivoMusica)
console.log('Música completa disponível em:', info.download_catbox)
musicaEncontrada = true
}
}
} catch (erroDirect) {
console.error('Erro ao usar Direct Link Finder:', erroDirect.message)
}
if (!musicaEncontrada) {
try {
const respostaYT = await axios.get(`https://ytmusic-downloader.vercel.app/api/search?q=${encodeURIComponent(consultaEspecifica)}`, {
timeout: 15000
})
if (respostaYT.data && respostaYT.data.results && respostaYT.data.results.length > 0) {
console.log('Música encontrada via YT Music Downloader')
const track = respostaYT.data.results[0]
if (track.downloadUrl) {
const respostaMusica = await axios({
method: 'get',
url: track.downloadUrl,
responseType: 'arraybuffer',
timeout: 30000,
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
}
})
if (respostaMusica.status === 200) {
const extensao = track.downloadUrl.includes('.mp3') ? 'mp3' : (track.downloadUrl.includes('.mp4') ? 'mp4' : 'mp3')
const nomeArquivoMusica = `musica_${info.metadados.artista.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${info.metadados.nome.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${Date.now()}.${extensao}`
info.download_catbox = await uploadToCatbox(Buffer.from(respostaMusica.data), nomeArquivoMusica)
console.log('Música completa disponível em:', info.download_catbox)
musicaEncontrada = true
}
}
}
} catch (erroYT) {
console.error('Erro ao usar YT Music Downloader:', erroYT.message)
}
}
if (!musicaEncontrada) {
try {
const respostaMP3 = await axios.get(`https://mp3-juice-api.vercel.app/api/download?query=${encodeURIComponent(consultaEspecifica)}`, {
timeout: 15000
})
if (respostaMP3.data && respostaMP3.data.url) {
console.log('Música encontrada via MP3 Juices')
const urlDownload = respostaMP3.data.url
const respostaMusica = await axios({
method: 'get',
url: urlDownload,
responseType: 'arraybuffer',
timeout: 30000,
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
}
})
if (respostaMusica.status === 200) {
const extensao = 'mp3'
const nomeArquivoMusica = `musica_${info.metadados.artista.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${info.metadados.nome.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${Date.now()}.${extensao}`
info.download_catbox = await uploadToCatbox(Buffer.from(respostaMusica.data), nomeArquivoMusica)
console.log('Música completa disponível em:', info.download_catbox)
musicaEncontrada = true
}
}
} catch (erroMP3) {
console.error('Erro ao usar MP3 Juices:', erroMP3.message)
}
}
if (!musicaEncontrada && info.download_completo) {
try {
const respostaMusica = await axios({
method: 'get',
url: info.download_completo,
responseType: 'arraybuffer',
timeout: 30000,
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
}
})
if (respostaMusica.status === 200) {
const extensao = info.download_completo.includes('.mp3') ? 'mp3' : (info.download_completo.includes('.mp4') ? 'mp4' : 'mp3')
const nomeArquivoMusica = `musica_${info.metadados.artista.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${info.metadados.nome.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${Date.now()}.${extensao}`
info.download_catbox = await uploadToCatbox(Buffer.from(respostaMusica.data), nomeArquivoMusica)
console.log('Música completa disponível em:', info.download_catbox)
musicaEncontrada = true
}
} catch (erroVid) {
console.error('Erro ao usar download completo existente:', erroVid.message)
}
}
if (!musicaEncontrada) {
try {
console.log('Tentando baixar diretamente da URL:', info.musica)
const respostaMusica = await axios({
method: 'get',
url: info.musica,
responseType: 'arraybuffer',
timeout: 30000,
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
'Referer': 'https://music.apple.com/',
'Accept': 'audio/mpeg, audio/mp4, */*'
}
})
if (respostaMusica.status === 200 && respostaMusica.headers['content-type'] && 
(respostaMusica.headers['content-type'].includes('audio') || 
 respostaMusica.headers['content-type'].includes('octet-stream'))) {
const contentType = respostaMusica.headers['content-type']
let extensao = 'mp3'
if (contentType.includes('mp4')) extensao = 'mp4'
else if (contentType.includes('mpeg')) extensao = 'mp3'
else if (contentType.includes('aac')) extensao = 'aac'
else if (contentType.includes('wav')) extensao = 'wav'
const nomeArquivoMusica = `original_${info.metadados.artista.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${info.metadados.nome.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${Date.now()}.${extensao}`
info.download_catbox = await uploadToCatbox(Buffer.from(respostaMusica.data), nomeArquivoMusica)
console.log('Música original disponível em:', info.download_catbox)
} else {
console.log('A resposta não contém um arquivo de áudio válido')
}
} catch (erroOriginal) {
console.error('Erro ao baixar música original para Catbox:', erroOriginal.message)
}
}
} catch (erroMusica) {
console.error('Erro ao baixar música para Catbox:', erroMusica.message)
}
}
if (info.preview) {
try {
console.log('Baixando preview para upload no Catbox...')
const respostaPreview = await axios({
method: 'get',
url: info.preview,
responseType: 'arraybuffer',
timeout: 15000,
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
}
})
if (respostaPreview.status === 200) {
const nomeArquivoPreview = `preview_${info.metadados.artista.replace(/[^\w\s]/gi, '')}_${info.metadados.nome.replace(/[^\w\s]/gi, '')}_${Date.now()}.mp4`
info.preview_catbox = await uploadToCatbox(Buffer.from(respostaPreview.data), nomeArquivoPreview)
console.log('Preview disponível em:', info.preview_catbox)
}
} catch (erroPreview) {
console.error('Erro ao baixar preview para Catbox:', erroPreview.message)
}
}
info.download = info.download_catbox || info.musica || info.download_completo || info.preview_catbox || info.preview || null
return {
status: true,
criador: CRIADOR,
resultados: info
}
} catch (erro) {
console.error('Erro ao obter informações:', erro.message)
return {
status: false,
criador: CRIADOR,
erro: `Falha ao baixar informações: ${erro.message}`,
resultados: null
}
}
}

/**
 * Faz upload de um arquivo para o Catbox
 * @param {Buffer} fileBuffer - Buffer do arquivo
 * @param {string} fileName - Nome do arquivo
 * @returns {Promise<string>} URL do arquivo no Catbox
 */
async function uploadToCatbox(fileBuffer, fileName) {
try {
const formData = new FormData()
formData.append('reqtype', 'fileupload')
formData.append('userhash', '')
const tempFilePath = path.join(__dirname, fileName)
fs.writeFileSync(tempFilePath, fileBuffer)
formData.append('fileToUpload', fs.createReadStream(tempFilePath))
const response = await axios.post('https://catbox.moe/user/api.php', formData, {
headers: {
...formData.getHeaders()
},
timeout: 30000
})
fs.unlinkSync(tempFilePath)
if (response.data && typeof response.data === 'string' && response.data.startsWith('http')) {
return response.data
} else {
throw new Error('Resposta do Catbox não contém URL válida')
}
} catch (erro) {
console.error('Erro no upload para Catbox:', erro.message)
throw erro
}
}

/**
 * Baixa o arquivo de preview diretamente
 * @param {string} urlPreview - URL do preview da música
 * @returns {Promise<Object>} Resultado do download
 */
async function downloadPreview(urlPreview) {
try {
if (!urlPreview) {
return {
status: false,
criador: CRIADOR,
erro: "URL de preview não fornecida",
resultados: null
}
}
if (!urlPreview.startsWith('http')) {
return {
status: false,
criador: CRIADOR,
erro: "URL de preview inválida",
resultados: null
}
}
const resposta = await axios({
method: 'get',
url: urlPreview,
responseType: 'arraybuffer',
timeout: 15000,
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
}
})
if (resposta.status !== 200) {
return {
status: false,
criador: CRIADOR,
erro: `Erro ao baixar preview: status ${resposta.status}`,
resultados: null
}
}
const nomeArquivo = `preview_${Date.now()}.mp4`
try {
const urlCatbox = await uploadToCatbox(Buffer.from(resposta.data), nomeArquivo)
return {
status: true,
criador: CRIADOR,
resultados: {
url: urlCatbox,
tamanhoArquivo: resposta.data.length,
mensagem: `Preview disponível em ${urlCatbox}`
}
}
} catch (erroUpload) {
console.error("Erro no upload:", erroUpload)
fs.writeFileSync(nomeArquivo, Buffer.from(resposta.data))
return {
status: true,
criador: CRIADOR,
resultados: {
nomeArquivo: nomeArquivo,
tamanhoArquivo: resposta.data.length,
mensagem: `Preview salvo localmente como ${nomeArquivo} (falha no upload)`
}
}
}
} catch (erro) {
console.error("Erro ao baixar preview:", erro)
return {
status: false,
criador: CRIADOR,
erro: `Erro ao baixar preview: ${erro.message}`,
resultados: null
}
}
}

/**
 * Baixa o arquivo de música completa e faz upload para o Catbox
 * @param {string} urlMusica - URL da música
 * @returns {Promise<Object>} Resultado do download com URL do Catbox
 */
async function downloadMusica(urlMusica) {
try {
if (!urlMusica) {
return {
status: false,
criador: CRIADOR,
erro: "URL da música não fornecida",
resultados: null
}
}
if (!urlMusica.startsWith('http')) {
return {
status: false,
criador: CRIADOR,
erro: "URL da música inválida",
resultados: null
};

}
const infoMusica = await download(urlMusica)
if (!infoMusica.status || !infoMusica.resultados) {
return {
status: false,
criador: CRIADOR,
erro: "Não foi possível obter informações da música",
resultados: null
}
}
const info = infoMusica.resultados
const artistName = info.metadados.artista || ''
const trackName = info.metadados.nome || ''
const albumName = info.metadados.album || ''
const previewUrl = info.preview || ''
console.log(`Tentando baixar versão completa da música: "${trackName}" por "${artistName}"`)
if (previewUrl) {
console.log("Tentando método AppleCoreMedia para obter música completa...")
const userAgent = 'AppleCoreMedia/1.0.0.9B206 (iPad; U; CPU OS 5_1_1 like Mac OS X; en_us)'
try {
const appleMusicHeaders = {
'User-Agent': userAgent,
'Referer': 'https://music.apple.com/',
'Accept': '*/*',
'Accept-Encoding': 'identity',
'Range': 'bytes=0-',
'Connection': 'keep-alive'
}
const respostaMusica = await axios({
method: 'get',
url: previewUrl,
responseType: 'arraybuffer',
timeout: 60000,
headers: appleMusicHeaders,
maxContentLength: 50 * 1024 * 1024
})
if (respostaMusica.status === 200 && respostaMusica.data) {
const tamanho = respostaMusica.data.length
const tamanhoEmMB = (tamanho / (1024 * 1024)).toFixed(2)
console.log(`Download concluído! Tamanho: ${tamanhoEmMB} MB`)
if (tamanho > 500000) {
console.log("✅ Música completa encontrada via AppleCoreMedia!")
const nomeArquivo = `${artistName.replace(/[^\w\s]/gi, '')}_${trackName.replace(/[^\w\s]/gi, '')}_completa.mp4`
const urlCatbox = await uploadToCatbox(Buffer.from(respostaMusica.data), nomeArquivo)
console.log(`Música disponível em: ${urlCatbox}`)
return {
status: true,
criador: CRIADOR,
resultados: {
url: urlCatbox,
nomeArquivo: nomeArquivo,
tamanhoArquivo: tamanho,
tamanhoEmMB: tamanhoEmMB,
metodo: 'AppleCoreMedia User-Agent',
mensagem: `Música completa disponível em ${urlCatbox}`,
metadados: info.metadados
}
}
}
}
} catch (erro) {
console.error(`Erro com AppleCoreMedia: ${erro.message}`)
}
}
const consultaYoutube = `${trackName} ${artistName} official audio`
console.log(`Buscando no YouTube Music: "${consultaYoutube}"`)
try {
const respostaYT = await axios.get(`https://youtube-music-api-download.vercel.app/api/search?q=${encodeURIComponent(consultaYoutube)}`, {
timeout: 30000
})
if (respostaYT.data && respostaYT.data.results && respostaYT.data.results.length > 0) {
const firstItem = respostaYT.data.results[0]
if (firstItem.downloadUrl) {
console.log("✅ YouTube Music API encontrou música!")
const respostaMusica = await axios({
method: 'get',
url: firstItem.downloadUrl,
responseType: 'arraybuffer',
timeout: 60000
})
if (respostaMusica.status === 200 && respostaMusica.data) {
const tamanho = respostaMusica.data.length
const tamanhoEmMB = (tamanho / (1024 * 1024)).toFixed(2)
console.log(`Download completo! Tamanho: ${tamanhoEmMB} MB`)
const nomeArquivo = `${artistName.replace(/[^\w\s]/gi, '')}_${trackName.replace(/[^\w\s]/gi, '')}_completa.mp3`
const urlCatbox = await uploadToCatbox(Buffer.from(respostaMusica.data), nomeArquivo)
console.log(`Música disponível em: ${urlCatbox}`)
return {
status: true,
criador: CRIADOR,
resultados: {
url: urlCatbox,
nomeArquivo: nomeArquivo,
tamanhoArquivo: tamanho,
tamanhoEmMB: tamanhoEmMB,
metodo: 'YouTube Music API',
mensagem: `Música completa disponível em ${urlCatbox}`,
metadados: info.metadados
}
}
}
}
}
} catch (erro) {
console.error(`Erro com YouTube Music API: ${erro.message}`)
}
if (info.preview_catbox) {
return {
status: true,
criador: CRIADOR,
resultados: {
url: info.preview_catbox,
mensagem: "Apenas prévia disponível. Não foi possível obter a música completa.",
metadados: info.metadados
}
}
} else if (info.preview) {
const previewResult = await downloadPreview(info.preview)
return {
status: previewResult.status,
criador: CRIADOR,
resultados: previewResult.status ? {
url: previewResult.resultados.url,
mensagem: "Apenas prévia disponível. Não foi possível obter a música completa.",
metadados: info.metadados
} : null,
erro: previewResult.status ? null : "Não foi possível baixar nem a prévia da música"
}
}
return {
status: false,
criador: CRIADOR,
erro: "Não foi possível obter a música completa nem sua prévia",
resultados: null
}
} catch (erro) {
console.error("Erro ao baixar música:", erro)
return {
status: false,
criador: CRIADOR,
erro: `Erro ao baixar música: ${erro.message}`,
resultados: null
}
}
}

export default { search2, download, downloadPreview, downloadMusica, uploadToCatbox }