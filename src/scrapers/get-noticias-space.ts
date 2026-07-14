import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

/**
 * Space News Scraper
 * @paulo_mod_domina
 
 * Exemplo de uso em APIs:
 * const express = require('express')
 * const SpaceNewsScraper = require('./get-noticias-space')
 * const app = express()
 * const scraper = new SpaceNewsScraper()

 * app.get('/noticias-espaciais', async (req, res) => {
 * try {
 * const limit = req.query.limit || 5
 * const resultado = await scraper.executar(Number(limit))
 * res.json(resultado)
 * } catch (error) {
 * console.error(error)
 * res.status(500).json({ error: 'Erro ao coletar notícias' })
 * }
 * })

 * app.listen(3000, () => console.log('Servidor rodando na porta 3000'))
 */
 
const axios = require('axios')
const cheerio = require('cheerio')
const util = require('util')

class SpaceNewsScraper {
constructor() {
this.baseUrl = "https://spacenews.com"
this.translateApiUrl = "https://translate.googleapis.com/translate_a/single"
this.headers = {
"User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36",
"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
"Accept-Language": "pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3"
}
}

async traduzirTexto(texto, tentativas = 3) {
if (!texto || texto === 'N/A') return 'N/A'
if (await this.detectarIdioma(texto)) {
return texto
}
const maxLength = 1000
const partes = []
for (let i = 0; i < texto.length; i += maxLength) {
partes.push(texto.slice(i, i + maxLength))
}
try {
const traducoesPromises = partes.map(async (parte) => {
for (let i = 0; i < tentativas; i++) {
try {
const params = new URLSearchParams({
client: 'gtx',
sl: 'en',
tl: 'pt',
dt: 't',
q: parte
})
const response = await axios.get(`${this.translateApiUrl}?${params}`, {
timeout: 10000,
headers: {
'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36'
}
})
if (response.data && response.data[0] && response.data[0][0]) {
await new Promise(resolve => setTimeout(resolve, 300))
return response.data[0][0][0]
}
} catch (erro) {
if (i === tentativas - 1) {
console.error(`Erro na tradução após ${tentativas} tentativas:`, erro.message)
return parte
}
await new Promise(resolve => setTimeout(resolve, 1000))
}
}
return parte
})
const traducoes = await Promise.all(traducoesPromises)
return traducoes.join(' ').replace(/\s+/g, ' ').trim()
} catch (erro) {
console.error('Erro na tradução:', erro.message)
return texto
}
}

async detectarIdioma(texto) {
if (!texto) return false
try {
const palavrasPortugues = [
'de', 'da', 'do', 'das', 'dos', 'em', 'para', 'com', 'são', 'está',
'que', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as',
'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'seu', 'sua',
'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'eu', 'também', 'só'
]
const textoLimpo = texto.toLowerCase()
.replace(/[^\w\s]/g, ' ')
.replace(/\s+/g, ' ')
.trim()
const palavras = textoLimpo.split(' ')
const palavrasEncontradas = palavrasPortugues.filter(palavra => 
palavras.includes(palavra))
return palavrasEncontradas.length >= 3
} catch {
return false
}
}

async formatarData(data) {
if (!data) return null
try {
const dataObj = new Date(data)
return dataObj.toLocaleString('pt-BR', {
day: '2-digit',
month: '2-digit',
year: 'numeric',
hour: '2-digit',
minute: '2-digit',
second: '2-digit',
timeZone: 'America/Sao_Paulo'
})
} catch {
return data
}
}

async limparTexto(texto) {
if (!texto) return '';
return texto
.replace(/\t+/g, ' ')
.replace(/\n+/g, ' ')
.replace(/\s+/g, ' ')
.replace(/\.{3,}/g, '...')
.trim()
}

async obterDetalhesNoticia(url) {
try {
const response = await axios.get(url, { headers: this.headers })
const $ = cheerio.load(response.data)
const conteudo = $('article, .post-content, .entry-content').first()
const paragrafos = conteudo.find('p')
.map((_, el) => $(el).text().trim())
.get()
.filter(p => p.length > 0)
const imagens = conteudo.find('img')
.map((_, el) => $(el).attr('src'))
.get()
.filter(img => img && !img.includes('avatar') && !img.includes('logo'))
.map(img => img.startsWith('http') ? img : `${this.baseUrl}${img}`)
const autor = await this.traduzirTexto(conteudo.find('.author, .byline').first().text().trim())
const categoria = await this.traduzirTexto(conteudo.find('.category, .categories').first().text().trim())
const dataPublicacao = conteudo.find('time, .date, .published').first().attr('datetime')
const tempoLeitura = Math.ceil(paragrafos.join(' ').split(' ').length / 200)
const tags = await Promise.all(conteudo.find('.tags, .topics, .keywords')
.find('a')
.map((_, el) => $(el).text().trim())
.get()
.filter(tag => tag.length > 0)
.map(tag => this.traduzirTexto(tag)))
const linksRelacionados = await Promise.all(conteudo.find('a')
.map((_, el) => {
const href = $(el).attr('href')
const texto = $(el).text().trim()
if (href && href.includes('spacenews.com') && !href.includes('#')) {
return {
url: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
titulo: this.traduzirTexto(texto)
}
}
return null
})
.get()
.filter(link => link !== null))
const citacoes = await Promise.all(conteudo.find('blockquote, q')
.map((_, el) => $(el).text().trim())
.get()
.filter(q => q.length > 0)
.map(citacao => this.traduzirTexto(citacao)))
const videos = conteudo.find('iframe[src*="youtube"], iframe[src*="vimeo"], video')
.map((_, el) => $(el).attr('src'))
.get()
.filter(src => src)
const documentos = await Promise.all(conteudo.find('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"]')
.map((_, el) => ({
url: $(el).attr('href'),
nome: this.traduzirTexto($(el).text().trim() || 'Documento')
})).get())
const resultado = {
conteudo_completo: await this.traduzirTexto(paragrafos.join('\n')),
midia: {}
}
if (imagens.length > 0) resultado.midia.imagens = imagens
if (videos.length > 0) resultado.midia.videos = videos
if (documentos.length > 0) resultado.midia.documentos = documentos
resultado.metadados = {
autor: autor || null,
categoria: categoria || null,
data_publicacao: await this.formatarData(dataPublicacao) || null,
tempo_leitura: `${tempoLeitura} minutos`,
estatisticas: {
total_palavras: paragrafos.join(' ').split(' ').length,
total_paragrafos: paragrafos.length,
total_imagens: imagens.length,
total_videos: videos.length,
total_documentos: documentos.length
}
}
if (tags.length > 0) resultado.metadados.tags = tags
if (linksRelacionados.length > 0) resultado.metadados.links_relacionados = linksRelacionados
if (citacoes.length > 0) resultado.metadados.citacoes = citacoes
return resultado
} catch (erro) {
console.error('Erro ao obter detalhes:', erro.message)
return null
}
}

async coletarNoticias(limit = 10) {
try {
console.log('\nIniciando coleta e tradução das notícias...\n')
const response = await axios.get(this.baseUrl, { 
headers: this.headers,
timeout: 30000
})
const $ = cheerio.load(response.data)
const artigos = $('article, .post, .article, .news-item').slice(0, limit)
const noticias = []
for (let i = 0; i < artigos.length; i++) {
console.log(`\nProcessando notícia ${i + 1} de ${limit}...`)
const artigo = $(artigos[i])
const titulo = await this.limparTexto(artigo.find('h1, h2, h3, .title, .headline').first().text())
const resumo = await this.limparTexto(artigo.find('p, .excerpt, .description, .summary').first().text())
const data = artigo.find('time, .date, .published').first().text().trim()
const link = artigo.find('a').first().attr('href')
const imagem = artigo.find('img').first().attr('src')
if (!titulo) {
console.log('Notícia sem título, pulando...')
continue
}
const urlCompleta = link?.startsWith('http') ? link : `${this.baseUrl}${link}`
console.log(`Obtendo detalhes de: ${urlCompleta}`)
const detalhes = urlCompleta ? await this.obterDetalhesNoticia(urlCompleta) : null
console.log('Traduzindo conteúdo...')
const noticia = {
titulo: await this.traduzirTexto(titulo),
resumo: await this.traduzirTexto(resumo || 'N/A'),
conteudo: detalhes?.conteudo_completo || null,
data: await this.formatarData(data || new Date().toISOString()),
link: urlCompleta
}
if (imagem) {
noticia.midia = {
imagem_principal: imagem.startsWith('http') ? imagem : `${this.baseUrl}${imagem}`,
...detalhes?.midia
}
}
if (detalhes?.metadados) {
noticia.metadados = detalhes.metadados
}
noticias.push(noticia)
console.log(`Notícia ${i + 1} processada e traduzida com sucesso!`)
}
console.log('\nTodas as notícias foram coletadas e traduzidas com sucesso!')
return {
status: true,
codigo: 200,
criador: "@paulo_mod_domina",
//timestamp: new Date().toLocaleString('pt-BR', {
//timeZone: 'America/Sao_Paulo'
//}),
resultados: {
total_noticias: noticias.length,
fonte: this.baseUrl,
ultima_atualizacao: new Date().toLocaleString('pt-BR', {
timeZone: 'America/Sao_Paulo'
}),
noticias: noticias
}
}
} catch (erro) {
console.error('\nErro durante a coleta:', erro.message)
return {
status: false,
codigo: erro.response?.status || 500,
criador: "@paulo_mod_domina",
timestamp: new Date().toLocaleString('pt-BR', {
timeZone: 'America/Sao_Paulo'
}),
resultados: {
erro: {
mensagem: erro.message,
detalhes: erro.response?.data || null
},
total_noticias: 0,
fonte: this.baseUrl,
noticias: []
}
}
}
}

async executar(limit = 10) {
const resultado = await this.coletarNoticias(limit)
if (require.main === module) {
console.log('\nResultado final da coleta:')
console.log('========================\n')
console.log(util.inspect(resultado, {
depth: null,
colors: true,
maxArrayLength: null,
maxStringLength: null,
compact: false
}))
return
}
return resultado
}
}
if (require.main === module) {
const scraper = new SpaceNewsScraper()
scraper.executar().catch(erro => {
console.error('\nErro ao executar o scraper:', erro)
process.exit(1)
})
}

export default SpaceNewsScraper