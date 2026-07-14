import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

const axios = require('axios');
const cheerio = require('cheerio');
const tough = require('tough-cookie');

// Variável global para armazenar o wrapper
let wrapper;

// Carregar o wrapper dinamicamente antes de qualquer operação
const initializeWrapper = async () => {
if (!wrapper) {
const module = await import('axios-cookiejar-support');
wrapper = module.wrapper;
}
return wrapper;
};

async function scrapeDotsave(inputUrl) {
try {
// Garantir que o wrapper está carregado
await initializeWrapper();

const jar = new tough.CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));

const baseUrl = 'https://dotsave.app/pt';
const headers = {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
'Referer': baseUrl,
'Origin': 'https://dotsave.app'
};

// [RESTANTE DO CÓDIGO ORIGINAL]
const getResponse = await client.get(baseUrl, { headers });
console.log("Cookies capturados e página principal acessada.");
const html = getResponse.data;
const $ = cheerio.load(html);
const form = $('#myForm');

if (!form.length) {
throw new Error("Formulário com id 'myForm' não encontrado.");
}

const actionRelative = form.attr('action') || '/';
const formAction = new URL(actionRelative, baseUrl).href;
const formMethod = form.attr('method') || 'post';
const formData = new URLSearchParams();

form.find('input[name]').each((i, elem) => {
const name = $(elem).attr('name');
let value = $(elem).attr('value') || '';
if (name.toLowerCase() === 'url') {
value = inputUrl;
};
formData.append(name, value);
});

if (!formData.has('url')) {
formData.append('url', inputUrl);
}

const postResponse = await client.request({
method: formMethod,
url: formAction,
data: formData.toString(),
headers: {
...headers,
'Content-Type': 'application/x-www-form-urlencoded'
},
maxRedirects: 0,
validateStatus: status => status < 500
}).catch(err => {
if (err.response && (err.response.status === 302 || err.response.status === 301)) {
return err.response;
}
throw err;
});

console.log("Resposta da submissão do formulário:", postResponse.status, postResponse.statusText);

if (postResponse.status === 500) {
console.error("Erro 500 recebido. Conteúdo da resposta para análise:");
console.error(postResponse.data);
return { status: false, error: "Erro 500 recebido." };
} 
else if (postResponse.headers.location) {
console.log("Redirecionamento detectado para:", postResponse.headers.location);
return { status: true, redirect: postResponse.headers.location };
} 
else {
const $$ = cheerio.load(postResponse.data);
const headerDiv = $$('.video-header.mb-3');
const thumbnailElem = headerDiv.find('img#thumbnail');
let thumbnail = {};

if (thumbnailElem.length) {
thumbnail = {
link: (thumbnailElem.attr('src') || '').trim(),
alt: (thumbnailElem.attr('alt') || '').trim()
};
}

const videoLinks = [];
const addVideoLink = (href, text) => {
href = href.trim();
text = text.replace(/\s+/g, ' ').trim();
if (!href || !text) return;
if (href.includes('play.google.com')) return;
if (!videoLinks.some(item => item.link === href)) {
videoLinks.push({ title: text, link: href });
}
};

$$('.video-links .download-file').each((i, el) => {
const tagName = $$(el)[0].tagName.toLowerCase();
if (tagName === 'a') {
const href = $$(el).attr('href') || '';
const text = $$(el).text() || '';
addVideoLink(href, text);
} else if (tagName === 'button') {
const text = $$(el).text() || '';
let href = '';
const prevElem = $$(el).prev('a.download-file');
if (prevElem.length && prevElem.attr('hidden') !== undefined) {
href = prevElem.attr('href') || '';
}
if (!href) {
href = $$(el).attr('data-url') || '';
};
addVideoLink(href, text);
}
});

const allComments = [];
$$.root()
.contents()
.each((i, node) => {
if (node.type === 'comment') {
allComments.push(node.data);
}
});

allComments.forEach(comment => {
if (comment.includes('download-file')) {
const $comment = cheerio.load(comment, null, false);
$comment('a.download-file').each((i, el) => {
const href = $comment(el).attr('href') || '';
const text = $comment(el).text() || '';
addVideoLink(href, text);
});
}
});

videoLinks.sort((a, b) => {
if (a.title.includes('Max Speed')) return -1;
if (b.title.includes('Max Speed')) return 1;
return 0;
});

const output = {
status: true,
criador: "@paulo_mod_domina",
resultados: {
thumbnail,
videoLinks
}
};
return output;
}
} catch (error) {
console.error("Erro durante o processo:", error.message);
return { status: false, error: error.message };
}
}

export default scrapeDotsave;