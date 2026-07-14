import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// caso seu node-fetch seja a versão mais recente 
// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
// caso for a versão que não e módulo ES
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const cheerio = require('cheerio')
const chalk = require("chalk")

// Direitos autorais e atribuição:
// ©2025 Lucas Mod Domina. Todos os direitos reservados.
// Código criado por @lucas_mod_domina, sujeito aos termos de uso e condições da plataforma.
// Propriedade intelectual reservada. Não é permitida a reprodução ou distribuição sem autorização.
// Este código é de uso exclusivo para fins educativos e de demonstração.
// Qualquer violação dos direitos autorais pode resultar em ações legais.
// Lista de User-Agents aleatórios

const userAgents = ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:34.0) Gecko/20100101 Firefox/34.0', 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36 Edge/15.15063']
function getRandomUserAgent() {
const randomIndex = Math.floor(Math.random() * userAgents.length)
return userAgents[randomIndex]
}
function cleanText(text) {
return text.replace(/\s+/g, ' ').trim()
}
async function tiktokStalk_v3(usuario) {
console.log(chalk.green(`[SUCESSO] Iniciando scraper tiktok_stalker.js:`))
const url = `https://countik.com/tiktok-analytics/user/@${usuario}`
const userAgent = getRandomUserAgent()
try {
const response = await fetch(url, { headers: { 'User-Agent': userAgent } })
const body = await response.text()
const $ = cheerio.load(body)
const userData = {
status: true,
criador: "@lucas_mod_domina",
resultado: {
usuario: cleanText($('.username h2').text()),
apelido: cleanText($('.nickname').text()),
pais: cleanText($('.acc-country').text()),
foto_perfil: $('.pic img').attr('src'),
url_perfil: $('.visit-btn a').attr('href'),
seguidores_totais: cleanText($('.user-stats .block:nth-child(1) p').text()),
curtidas_totais: cleanText($('.user-stats .block:nth-child(2) p').text()),
videos_totais: cleanText($('.user-stats .block:nth-child(3) p').text()),
seguindo: cleanText($('.user-stats .block:nth-child(4) p').text()),
engajamento_geral: cleanText($('.total-engagement-rates .block:nth-child(1) p').text()),
taxa_curtidas: cleanText($('.total-engagement-rates .block:nth-child(2) p').text()),
taxa_comentarios: cleanText($('.total-engagement-rates .block:nth-child(4) p').text()),
taxa_compartilhamentos: cleanText($('.total-engagement-rates .block:nth-child(3) p').text()),
media_visualizacoes: cleanText($('.average-video-performance .block:nth-child(1) p').text()),
media_curtidas: cleanText($('.average-video-performance .block:nth-child(2) p').text()),
media_comentarios: cleanText($('.average-video-performance .block:nth-child(3) p').text()),
media_compartilhamentos: cleanText($('.average-video-performance .block:nth-child(4) p').text()),
hashtags: [],
hashtags_mais_usadas: [],
posts_recentes: []
}
}
$('.hashtags .item:nth-child(1) .mem').each((i, el) => {
userData.resultado.hashtags.push($(el).text())
})
$('.hashtags .item:nth-child(2) .span-tag').each((i, el) => {
const hashtag = cleanText($(el).find('.chosen').text())
const count = cleanText($(el).find('.count').text())
userData.resultado.hashtags_mais_usadas.push({ hashtag, count })
})
$('.recent-posts .item').each((i, el) => {
const post = {
imagem: $(el).find('.post-img img').attr('src'),
visualizacoes: cleanText($(el).find('.post-data .data:nth-child(1) .value').text()),
curtidas: cleanText($(el).find('.post-data .data:nth-child(2) .value').text()),
comentarios: cleanText($(el).find('.post-data .data:nth-child(3) .value').text()),
compartilhamentos: cleanText($(el).find('.post-data .data:nth-child(4) .value').text()),
count_hashtags: cleanText($(el).find('.post-data .data:nth-child(5) .value').text()),
mencoes: cleanText($(el).find('.post-data .data:nth-child(6) .value').text()),
saves: cleanText($(el).find('.post-data .data:nth-child(7) .value').text()),
taxa_engajamento: cleanText($(el).find('.post-data .medium-engagement .value').text()),
descricao: cleanText($(el).find('.post-data .desc').text()),
musica: {
titulo: cleanText($(el).find('.music-details a').text()),
url_audio: $(el).find('.music-info audio source').attr('src')
},
criado_em: cleanText($(el).find('.extra-data .create-time p').text())
}
userData.resultado.posts_recentes.push(post);
})
return userData
//console.log(JSON.stringify(userData, null, 2))
} catch (error) {
console.error('Erro ao buscar dados:', error)
return { status: false, message: error.message }
}
}

export default { tiktokStalk_v3 }