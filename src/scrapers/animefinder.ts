import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

const axios = require('axios')
const FormData = require('form-data')

async function translateText(text) {
if (!text) return '';
try {
const response = await axios.get('https://okarun-api.com.br/api/info/translate', {
params: {
texto: text,
ling: 'pt',
apikey: 'inovação_2025'
}
});
return response.data.status 
? response.data.result 
: text;
} catch (err) {
console.error('Erro na tradução:', err.message);
return text;
}
}

async function identifyAnime(imageUrl) {
if (!imageUrl) throw 'O link da imagem não pode estar vazio.';
try {
const imageBuffer = (await axios.get(imageUrl, {
responseType: 'arraybuffer',
})).data;
const form = new FormData();
form.append('image', imageBuffer, {
filename: 'anime.jpg',
contentType: 'image/jpeg'
});
const response = await axios.post('https://www.animefinder.xyz/api/identify', form, {
headers: {
...form.getHeaders(),
'Origin': 'https://www.animefinder.xyz',
'Referer': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
},
maxBodyLength: Infinity,
});
const result = response.data;
const [descricaoPT, sinopsePT] = await Promise.all([
translateText(result.description),
translateText(result.synopsis)
]);
return {
status: true,
criador: "@paulo_mod_domina",
resultados: {
anime: result.animeTitle,
personagem: result.character,
gêneros: result.genres,
estreia: result.premiereDate,
produção: result.productionHouse,
//description: result.description,
descrição: descricaoPT,
//sinopse: result.synopsis,
sinopse: sinopsePT,
referências: result.references || [],
imagem: imageUrl
}
};
} catch (err) {
return {
status: false,
message: 'Falha ao identificar o anime na imagem',
error: err.response?.data || err.message
};
}
}

export default { identifyAnime }