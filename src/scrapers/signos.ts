import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B
const axios = require('axios')
const cheerio = require('cheerio')
const criador = "@lucas_mod_dominw"

async function scrapeData(query) {
try {
const signosValidos = [
"aries", "touro", "gemeos", "cancer", "leao", "virgem", 
"libra", "escorpiao", "sagitario", "capricornio", "aquario", "peixes"
]
if (!query) {
return { status: false, criador: `${criador}`,  error: "Por favor, forneça o nome do signo." }
}
if (!signosValidos.includes(query.toLowerCase())) {
return { 
status: false, 
criador, 
error: `O signo "${query}" não é válido. Signos válidos: ${signosValidos.join(', ')}` 
}
}
const { data } = await axios.get(`https://www.horoscopovirtual.com.br/horoscopo/${query}`, { 
headers: { 
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' 
} 
})
const $ = cheerio.load(data)
const imagem = $('link[rel="image_src"]').attr('href')
const tituloPrincipal = $('h1').text().trim()
const subtitulo = $('h2').text().trim()
const periodo = $('p').first().text().trim()
const paragrafos = []
let horoscopoFound = false
$('p').each((_, element) => {
const text = $(element).text().trim()
if (text.includes("Hoje") || text.includes("Amanhã")) {
horoscopoFound = true
}
if (horoscopoFound) {
paragrafos.push(text)
if (text.endsWith('.')) return false
}
})
let relevantParagrafo = paragrafos.join('\n').trim()
relevantParagrafo = relevantParagrafo.replace(/(Amanhã)/g, '').trim()
relevantParagrafo = relevantParagrafo.replace(/(Você irá receber gratuitamente[\s\S]*?às 6h da manhã\.)/g, '').trim()
relevantParagrafo = relevantParagrafo.replace(/(Compartilhar[\s\S]*)/g, '').trim()
return { 
status: true, 
criador: `${criador}`, 
resultado: { 
imagem, 
tituloPrincipal, 
subtitulo, 
periodo, 
horoscopo: relevantParagrafo 
}}
} catch (error) {
return { status: false, criador: `${criador}`, error: error.message }
}
}

export default { scrapeData }