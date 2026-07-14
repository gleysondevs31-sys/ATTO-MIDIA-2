import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

/*

EXEMPLO:

const upscale = require('./base de dados/tohd.js')

app.get('/api/upscale', async (req, res) => {
const { url, resolution, enhance } = req.query
if (!url) return res.status(400).json({ error: 'Parâmetro url ausente' })
try {
const result = await upscale(url, resolution || '1080p', enhance ? enhance === 'true' : true)
// Opção 1: Retornar JSON com metadados
res.json({
success: true,
criador: `${criador}`,
resultados: result
})
// Opção 2: Redirecionar para a imagem processada
// res.redirect(result.url)
} catch (error) {
res.status(500).json({ success: false, error: error.message })
}
})

*/

const axios = require('axios')
const FormData = require('form-data')

async function upscale(imageUrl, resolution = '1080p', enhance = true) {
if (!/^https?:\/\/.+\.(jpe?g|png|webp|gif)$/i.test(imageUrl)) {
throw new Error('URL de imagem inválida');
}
const validResolutions = ['480p', '720p', '1080p', '2k', '4k', '8k', '12k'];
const normalizedResolution = resolution.toLowerCase();
if (!validResolutions.includes(normalizedResolution)) {
throw new Error(`Resolução inválida: escolha entre ${validResolutions.join(', ')}`);
}
try {
const { data: imageBuffer } = await axios.get(imageUrl, {
responseType: 'arraybuffer',
timeout: 30000
});
const form = new FormData();
form.append('image', imageBuffer, { filename: 'image.jpg' });
form.append('resolution', normalizedResolution);
form.append('enhance', enhance.toString());
const { data } = await axios.post('https://upscale.cloudkuimages.guru/hd.php', form, {
headers: {
...form.getHeaders(),
'Origin': 'https://upscale.cloudkuimages.guru',
'Referer': 'https://upscale.cloudkuimages.guru/',
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
},
maxBodyLength: Infinity,
timeout: 60000
});
if (data?.status !== 'success') {
throw new Error(`Falha no upscale: ${data?.message || 'Resposta inválida do servidor'}`);
}
return {
status: 'success',
url: data.data.url,
nome_do_arquivo: data.data.filename,
original: data.data.original,
resolução_de: data.data.original_resolution,
resolução_para: data.data.resolution_now,
enhanced: data.data.enhanced,
tamanho_antes: data.data.original_size,
tamanho_depois: data.data.new_size,
tempo_de_processamento: data.data.processing_time
}
} catch (error) {
console.error('Erro no upscale:', error)
throw new Error(`Processamento falhou: ${error.message}`)
}
}

export default upscale