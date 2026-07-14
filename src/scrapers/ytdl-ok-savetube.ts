import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios')
const crypto = require('crypto')

const anu = Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex')

function decrypt(enc) {
  const b = Buffer.from(enc.replace(/\s/g, ''), 'base64')
  const iv = b.subarray(0, 16)
  const data = b.subarray(16)
  const d = crypto.createDecipheriv('aes-128-cbc', anu, iv)
  return JSON.parse(Buffer.concat([d.update(data), d.final()]).toString())
}

async function savetube(url) {
  const random = await axios.get('https://media.savetube.vip/api/random-cdn', {
    headers: {
      origin: 'https://save-tube.com',
      referer: 'https://save-tube.com/',
      'User-Agent': 'Mozilla/5.0'
    }
  })

  const cdn = random.data.cdn

  const info = await axios.post(`https://${cdn}/v2/info`,
    { url },
    {
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://save-tube.com',
        referer: 'https://save-tube.com/',
        'User-Agent': 'Mozilla/5.0'
      }
    }
  )

  if (!info.data || !info.data.status) return { status: false }

  const json = decrypt(info.data.data)

  async function download(type, quality) {
    const r = await axios.post(`https://${cdn}/download`,
      {
        id: json.id,
        key: json.key,
        downloadType: type,
        quality: String(quality)
      },
      {
        headers: {
          'Content-Type': 'application/json',
          origin: 'https://save-tube.com',
          referer: 'https://save-tube.com/',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    )
    return r.data && r.data.data ? r.data.data.downloadUrl : null
  }

  const videos = []

  for (const v of json.video_formats) {
    videos.push({
      quality: v.quality,
      label: v.label,
      url: await download('video', v.quality)
    })
  }

  for (const a of json.audio_formats) {
    videos.push({
      quality: a.quality,
      label: a.label,
      url: await download('audio', a.quality)
    })
  }

  return {
    title: json.title,
    duration: json.duration,
    thumbnail: json.thumbnail,
    videos
  }
}

export default savetube