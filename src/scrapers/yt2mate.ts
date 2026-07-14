import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// yt2mate.js
// Scraper para obter link de download (mp3/mp4) a partir de v1.y2mate.nu + eta.etacloud.org
// Uso: const { yt2mate, ddownr } = require('./yt2mate')
// yt2mate(url, format = 'mp3', quality) -> { id, title, format, download, status: 200 }

const axios = require('axios')

let jsonCache = null
const gB = Buffer.from('ZXRhY2xvdWQub3Jn', 'base64').toString('utf8') // "etacloud.org"

const defaultHeaders = {
  origin: 'https://v1.y2mate.nu',
  referer: 'https://v1.y2mate.nu/',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  accept: '*/*'
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
function ts() {
  return Math.floor(Date.now() / 1000)
}

async function fetchPageJson({ url = 'https://v1.y2mate.nu', headers = defaultHeaders, timeout = 10000 } = {}) {
  if (jsonCache) return jsonCache

  const res = await axios.get(url, { headers, timeout })
  const html = res.data
  const m = /var\s+json\s*=\s*JSON\.parse\('([^']+)'\)/.exec(html)
  if (!m) throw new Error('payload json não encontrado na página v1.y2mate.nu')
  try {
    jsonCache = JSON.parse(m[1])
  } catch (err) {
    throw new Error('falha ao parsear payload json: ' + err.message)
  }
  return jsonCache
}

function makeAuthorization(j) {
  if (!j) throw new Error('json não inicializado para gerar authorization')
  let e = ''
  for (let i = 0; i < j[0].length; i++) {
    const a = j[0][i]
    const b = j[2][j[2].length - (i + 1)]
    e += String.fromCharCode(a - b)
  }
  if (j[1]) e = e.split('').reverse().join('')
  return e.length > 32 ? e.slice(0, 32) : e
}

function extractVideoId(url) {
  // tenta padrões comuns e fallback para query param v
  const m =
    /youtu\.be\/([a-zA-Z0-9_-]{11})/.exec(url) ||
    /v=([a-zA-Z0-9_-]{11})/.exec(url) ||
    /\/shorts\/([a-zA-Z0-9_-]{11})/.exec(url) ||
    /\/live\/([a-zA-Z0-9_-]{11})/.exec(url)
  if (m) return m[1]
  try {
    const u = new URL(url)
    const v = u.searchParams.get('v')
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
  } catch (e) {
    // ignore
  }
  throw new Error('url do youtube inválida')
}

async function initApi(headers = defaultHeaders) {
  const j = await fetchPageJson({ headers })
  const key = String.fromCharCode(j[6])
  const auth = makeAuthorization(j)
  const url = `https://eta.${gB}/api/v1/init?${encodeURIComponent(key)}=${encodeURIComponent(auth)}&t=${ts()}`
  const res = await axios.get(url, { headers, timeout: 10000 })
  const data = res.data
  if (data && data.error && data.error !== 0 && data.error !== '0') throw data
  return data
}

/**
 * yt2mate(videoUrl, format = 'mp3', quality = undefined)
 * - videoUrl: string (YouTube URL)
 * - format: 'mp3' | 'mp4' | other (the scraper will pass as 'f' param)
 * - quality: optional string/number to pass to convertURL as extra param (if backend supports)
 *
 * retorno: Promise resolve { id, title, format, download, status: 200 } ou rejeita com erro/objeto recebido do backend
 */
async function yt2mate(videoUrl, format = 'mp3', quality) {
  // Cache json if not fetched
  await fetchPageJson()

  const videoId = extractVideoId(videoUrl)
  const initRes = await initApi()

  // monta URL de conversão retornada pelo init
  let convertUrl = initRes.convertURL
  if (!convertUrl) throw new Error('convertURL não disponível no init response')

  // adiciona parâmetros
  convertUrl += `&v=${encodeURIComponent(videoId)}&f=${encodeURIComponent(format)}&t=${ts()}&_=${Math.random()}`
  // se informou qualidade, anexa (nome 'q' é um fallback genérico)
  if (quality) convertUrl += `&q=${encodeURIComponent(quality)}`

  // chama a API de conversão
  const convertRes = await axios.get(convertUrl, { headers: defaultHeaders, timeout: 20000 })
  let data = convertRes.data
  if (data && data.error && data.error !== 0 && data.error !== '0') throw data

  // se redirecionou para um outro host
  if (data && data.redirect === 1 && data.redirectURL) {
    const r2 = await axios.get(`${data.redirectURL}&t=${ts()}`, { headers: defaultHeaders, timeout: 20000 })
    data = r2.data
    if (data && data.error && data.error !== 0 && data.error !== '0') throw data
  }

  // se já veio com download direto
  if (data && data.downloadURL && !data.progressURL) {
    return {
      id: videoId,
      title: data.title || '',
      format,
      download: data.downloadURL,
      status: 200
    }
  }

  // se precisa de polling na progressURL
  if (!data || !data.progressURL) throw new Error('Nem downloadURL nem progressURL foram retornados pelo serviço')

  const maxAttempts = 20
  let attempt = 0
  let backoff = 3000

  while (attempt < maxAttempts) {
    attempt++
    await sleep(backoff)
    backoff = Math.min(8000, backoff + 1000) // backoff incremental até 8s

    let progressRes
    try {
      progressRes = await axios.get(`${data.progressURL}&t=${ts()}`, { headers: defaultHeaders, timeout: 20000 })
    } catch (err) {
      // retry on network errors
      if (attempt >= maxAttempts) throw err
      continue
    }

    const p = progressRes.data
    if (p && p.error && p.error !== 0 && p.error !== '0') throw p

    // Se job finalizado (progress === 3) retorna com downloadURL
    if (p && p.progress === 3 && p.downloadURL) {
      return {
        id: videoId,
        title: p.title || data.title || '',
        format,
        download: p.downloadURL || data.downloadURL,
        status: 200
      }
    }

    // Atualiza possível downloadURL vindo do polling
    if (p && p.downloadURL) {
      return {
        id: videoId,
        title: p.title || data.title || '',
        format,
        download: p.downloadURL,
        status: 200
      }
    }

    // une campos para próxima iteração (alguns backends atualizam fields)
    data = Object.assign({}, data, p)
  }

  throw new Error('timeout aguardando processamento do arquivo (polling excedeu tentativas)')
}

// alias para compatibilidade com seu nome anterior (ddownr)
async function ddownr(videoUrl, format = 'mp3', quality) {
  return yt2mate(videoUrl, format, quality)
}

export default { yt2mate, ddownr }