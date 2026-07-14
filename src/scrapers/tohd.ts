import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const tmpDir = path.join(__dirname, 'tmp')
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

/* serial fake */
function genSerial() {
  return crypto.randomBytes(16).toString('hex')
}

/* baixar imagem por url */
async function downloadImage(url, filePath) {
  const res = await axios.get(url, { responseType: 'stream' })
  const writer = fs.createWriteStream(filePath)
  res.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

/* headers fixos para PhotoAid */
const headers = {
  origin: 'https://photoaid.com',
  referer: 'https://photoaid.com/en/tools/ai-image-enlarger',
  'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  'content-type': 'text/plain;charset=UTF-8'
}

/* gerar token */
async function token() {
  const t = await axios.post('https://photoaid.com/en/tools/api/tools/token',
    null,
    { headers }
  )
  return t.data?.clientToken || t.data?.token
}

/* upload imagem */
async function upload(imgPath) {
  const base64 = fs.readFileSync(imgPath).toString('base64')
  const tk = await token()

  const up = await axios.post('https://photoaid.com/en/tools/api/tools/upload',
    JSON.stringify({
      base64,
      token: tk,
      reqURL: '/ai-image-enlarger/upload'
    }),
    { headers }
  )

  if (!up.data?.request_id) throw up.data
  return up.data.request_id
}

/* checar resultado */
async function result(jobId) {
  const res = await axios.post('https://photoaid.com/en/tools/api/tools/result',
    JSON.stringify({
      request_id: jobId,
      reqURL: '/ai-image-enlarger/result'
    }),
    { headers }
  )
  return res.data
}

/* função principal: upscale a partir da URL */
async function imgUpscaleFromUrl(url) {
  let tempFile

  try {
    const serial = genSerial()
    tempFile = path.join(tmpDir, `up_${Date.now()}.jpg`)

    // baixa imagem temporária
    await downloadImage(url, tempFile)

    // envia para PhotoAid
    const jobId = await upload(tempFile)

    // polling até ficar pronto
    let check
    do {
      await new Promise(r => setTimeout(r, 3000))
      check = await result(jobId)
    } while (check.statusAPI !== 'ready')

    return {
      ok: true,
      buffer: Buffer.from(check.result, 'base64'),
      contentType: 'image/png',
      engine: 'photoaid'
    }
  } catch (e) {
    return {
      ok: false,
      error: e.message
    }
  } finally {
    if (tempFile && fs.existsSync(tempFile))
      fs.unlinkSync(tempFile)
  }
}

export default { imgUpscaleFromUrl }