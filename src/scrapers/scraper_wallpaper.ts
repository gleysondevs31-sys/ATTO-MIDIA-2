import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const cheerio = require('cheerio')
const chalk = require('chalk')
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B
async function scrapeWallpapers(query) {
const baseUrl = 'https://alphacoders.com'
const apiKey = '8b3d8c747d2841424b79f5101f605251'
const url = `${baseUrl}/${query}`
console.log(chalk.blue('Iniciando a raspagem de wallpapers da URL:', url))
try {
console.log(chalk.yellow('Enviando requisição para o ScraperAPI...'))
const response = await fetch(`https://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(url)}`)
console.log(chalk.yellow('Requisição enviada. Status:', response.status))
if (!response.ok) {
console.error(chalk.red('Erro na resposta da requisição:', response.statusText))
return
}
const html = await response.text()
console.log(chalk.yellow('Conteúdo HTML da página obtido com sucesso.'))
const $ = cheerio.load(html)
console.log(chalk.yellow('HTML carregado e preparado para análise.'))
const wallpapers = []
$('img').each((index, element) => {
const imgSrc = $(element).attr('src')
if (imgSrc && imgSrc.includes('thumb')) {
wallpapers.push(imgSrc)
}
})
if (wallpapers.length > 0) {
console.log(chalk.green('Imagens de wallpapers encontradas:', wallpapers.length))
console.log(wallpapers)
return wallpapers
} else {
console.log(chalk.red('Nenhuma imagem de wallpaper encontrada.'))
return []
}
} catch (error) {
console.error(chalk.red('Erro ao raspar a página:', error))
return []
} finally {
console.log(chalk.blue('Raspagem concluída.'))
}
}

export default { scrapeWallpapers }