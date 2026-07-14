import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

const https = require('node:https')

const shortenUrl = async (longUrl, options = {}) => {
const {
alias = '',
format = 'json',
type = null
} = options;
if (!longUrl || !longUrl.trim()) {
throw new Error('URL longa é obrigatória');
}
const params = new URLSearchParams();
params.append('api', '1d8a7a0f6fcbf62e8c73105d26990e4ae82a1c0b');
params.append('url', longUrl.trim());
params.append('alias', alias.trim());
if (format === 'text' || format === 'json') {
params.append('format', format);
}
if (type === 0 || type === 1) {
params.append('type', type.toString());
}
const apiUrl = `https://encurta.net/api?${params.toString()}`;
return new Promise((resolve, reject) => {
https.get(apiUrl, (res) => {
let data = '';
res.on('data', (chunk) => {
data += chunk;
});
res.on('end', () => {
try {
if (format === 'text') {
data.trim() ? resolve(data) : reject(new Error('Resposta vazia da API'));
} else {
const result = JSON.parse(data);
if (result.status === 'success') {
resolve(result.shortenedUrl);
} else {
reject(new Error(result.message || 'Erro desconhecido na API'));
}
}
} catch (e) {
reject(new Error(`Falha ao processar resposta: ${e.message}`));
}
});
}).on('error', (err) => {
reject(new Error(`Falha na requisição: ${err.message}`));
});
});
};

export default { shortenUrl }