import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

const axios = require('axios')

function formatarDataBR(dataISO) {
if (!dataISO) return '';
try {
const data = new Date(dataISO);
const offsetBrasil = -3 * 60;
const dataBrasil = new Date(data.getTime() + (offsetBrasil + data.getTimezoneOffset()) * 60000);
return dataBrasil.toLocaleString('pt-BR', {
timeZone: 'America/Sao_Paulo',
day: '2-digit',
month: '2-digit',
year: 'numeric',
hour: '2-digit',
minute: '2-digit',
second: '2-digit',
hour12: false
}).replace(',', '');
} catch (error) {
console.error('Erro ao formatar data:', error);
return '';
}
}

async function _fetchapi(service, url) {
const baseUrl = 'https://backend1.tioo.eu.org/';
try {
const response = await axios.get(`${baseUrl}${service}`, {
params: { url },
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}
});
return response.data;
} catch (error) {
throw new Error(`API request failed: ${error.message}`);
}
}

async function capcut(url) {
try {
const apiResponse = await _fetchapi('capcut', url);
if (!apiResponse || !apiResponse.data) {
throw new Error('Estrutura de resposta inválida');
}
const videoData = apiResponse.data;
return {
status: true,
criador: '@paulo_mod_domina',
resultados: {
titulo: videoData.name || '',
descricao: videoData.description || '',
thumbnail: videoData.thumbnailUrl?.[0] || '',
videoUrl: videoData.contentUrl || '',
dataUpload: formatarDataBR(videoData.uploadDate) || '',
duracao: videoData.meta?.duration ? `${(videoData.meta.duration / 1000).toFixed(2)} segundos` : '',
curtidas: videoData.meta?.like || 0,
visualizacoes: videoData.meta?.play || 0,
autor: videoData.meta?.author?.name || '',
avatarAutor: videoData.meta?.author?.avatarUrl || ''
}
};
} catch (error) {
return {
status: false,
criador: '@paulo_mod_domina',
mensagem: error.message,
nota: 'Verifique a documentação para mais detalhes'
};
}
}

async function instagram(url) {
try {
const apiResponse = await _fetchapi('igdl', url);
if (!Array.isArray(apiResponse) || apiResponse.length === 0) {
throw new Error('Nenhum resultado encontrado');
}
return {
status: true,
criador: '@paulo_mod_domina',
resultados: {
medias: apiResponse.map(item => ({
thumbnail: item.thumbnail || '',
url: item.url || ''
}))
}
};
} catch (error) {
return {
status: false,
criador: '@paulo_mod_domina',
mensagem: error.message,
nota: 'Verifique a documentação para mais detalhes'
};
}
}

// Teste direto (executa apenas quando rodado diretamente)
if (require.main === module) {
(async () => {
console.log('=== Testando CapCut ===');
try {
const capcutUrl = 'https://www.capcut.com/template-detail/7145318728966720770';
const capcutResult = await capcut(capcutUrl);
console.log('Resultado CapCut:', capcutResult);
} catch (e) {
console.error('Erro no teste CapCut:', e);
}
console.log('\n=== Testando Instagram ===');
try {
const igUrl = 'https://www.instagram.com/reel/DJtlpZXO1wH/';
const igdlResult = await instagram(igUrl);
console.log('Resultado Instagram:', igdlResult);
} catch (e) {
console.error('Erro no teste Instagram:', e);
}
})();
}

export default { capcut, instagram }