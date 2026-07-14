import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

const axios = require("axios");

/**
 * Módulo que exporta várias funções para download de vídeos
 * Cada função faz uma requisição GET para o endpoint correspondente
 */
export default {
ndown: createRequest("ndown"),
instagram: createRequest("instagram"),
tikdown: createRequest("tikdown"),
ytdown: createRequest("ytdown"),
threads: createRequest("threads"),
twitterdown: createRequest("twitterdown"),
fbdown2: createRequest("fbdown2", (url, apiKey) => ({
url: url,
key: apiKey
})),
GDLink: createRequest("GDLink"),
pintarest: createRequest("pintarest"),
capcut: createRequest("capcut"),
likee: createRequest("likee"),
alldown: createRequest("alldown")
};

/**
 * Cria uma função que fará a chamada à API de download.
 *
 * @param {string} endpoint Nome do endpoint (ex: "ytdown", "instagram")
 * @param {Function} [buildParams]Função opcional para montar os params da requisição
 * @returns {Function}Função que recebe (url, apiKey) e retorna uma Promise com os dados
 */
function createRequest(endpoint, buildParams) {
const name = endpoint.charAt(0).toUpperCase() + endpoint.slice(1);
return async (url, apiKey) => {
try {
const params = buildParams
? buildParams(url, apiKey)
: { url };
const response = await axios.get(`https://nayan-video-downloader.vercel.app/${endpoint}`, { params });
const data = response.data;
const {
developer,
devfb,
devwp,
status: _unusedStatus,
...cleanData
} = data;
return {
[name]: {
status: true,
criador: "@paulo_mod_domina",
resultados: cleanData
}
};
} catch (error) {
return {
[name]: {
status: true,
criador: "@paulo_mod_domina",
resultados: {
msg: `${name} API error`
}
}
};
}
};
}

/**
 * Converte a primeira letra de uma string para maiúscula
 *
 * @param {string} text 
 * @returns {string}
 */
function capitalize(text) {
if (!text) return "";
return text.charAt(0).toUpperCase() + text.slice(1);
}