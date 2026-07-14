import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

const axios = require('axios');
const cheerio = require('cheerio');

async function getTiposEIdiomas() {
const url = 'https://aipoemgenerator.io';
const { data: html } = await axios.get(url, {
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
});
const $ = cheerio.load(html);
const tipos = [];
$('.poem__types li, .peom__types__list li').each((i, el) => {
const t = $(el).text().trim();
if (t && !tipos.includes(t) && t !== 'Default') tipos.push(t);
});
const idiomas = [];
$('.poem__langs li').each((i, el) => {
const lang = $(el).text().trim();
if (lang && !idiomas.includes(lang)) idiomas.push(lang);
});
const comprimentos = ['short', 'medium', 'long'];
return { tipos, idiomas, comprimentos };
}

async function gerarPoema({
topico = 'amor',
comprimento = 'long',
tipo = 'Sonnet',
idioma = 'Portuguese'
} = {}) {
try {
const url = 'https://aipoemgenerator.io';
const respostaGet = await axios.get(url, {
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
});
const tokenEncontrado = respostaGet.data.match(/<meta name="_token" content="(.*?)"/);
if (!tokenEncontrado) throw 'Token não encontrado.';
const token = tokenEncontrado[1];
const cookies = respostaGet.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || '';
const formulario = new URLSearchParams();
formulario.append('topic', topico);
formulario.append('length', comprimento);
formulario.append('type', tipo);
formulario.append('lang', idioma);
formulario.append('poemVersion', '1');
formulario.append('_token', token);
const respostaPost = await axios.post(`${url}/generate_poem`, formulario.toString(), {
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
'Content-Type': 'application/x-www-form-urlencoded',
'Cookie': cookies,
'Referer': `${url}/`,
'Origin': url,
'X-Requested-With': 'XMLHttpRequest'
}
});
return {
status: true,
criador: '@paulo_mod_domina',
resultado: {
tipo: tipo,
topico: topico,
comprimento: comprimento,
idioma: idioma,
poema: respostaPost.data?.trim()
}
};
} catch (erro) {
return {
status: false,
criador: '@paulo_mod_domina',
mensagem: 'Erro na requisição',
erro: erro?.message || erro
};
}
}

export default { gerarPoema, getTiposEIdiomas }