import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const { CookieJar } = require('tough-cookie');

class SoundCloudScraper {
constructor() {
this.baseUrl = 'https://www.forhub.io';
this.downloadUrl = 'https://www.forhub.io/download.php';
this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
this.jar = new CookieJar();
this.client = null;
}

async initializeClient() {
if (!this.client) {
// Carrega dinamicamente o módulo ESM
const { wrapper } = await import('axios-cookiejar-support');
this.client = wrapper(axios.create({ 
jar: this.jar, 
withCredentials: true 
}));
}
return this.client;
}

async getCSRFToken() {
const client = await this.initializeClient();
const response = await client.get(this.downloadUrl, {
headers: { 'User-Agent': this.userAgent }
});
const $ = cheerio.load(response.data);
const csrfToken = $('input[name="csrf_token"]').val();
if (!csrfToken) throw new Error('Token CSRF não encontrado');
return csrfToken;
}

async scrape(url) {
if (!/^(https?:\/\/)?(www\.)?(m\.)?soundcloud\.com\/.+/i.test(url)) {
throw new Error('URL do SoundCloud inválida');
}

const csrfToken = await this.getCSRFToken();
const formData = new FormData();
formData.append('csrf_token', csrfToken);
formData.append('formurl', url);

const client = await this.initializeClient();
const response = await client.post(this.downloadUrl, formData, {
headers: {
...formData.getHeaders(),
'User-Agent': this.userAgent,
Referer: this.downloadUrl,
Origin: this.baseUrl
},
maxRedirects: 5,
timeout: 30000
});

return this.extractResultData(response.data);
}

extractResultData(htmlContent) {
const $ = cheerio.load(htmlContent);
let trackImage = '',
trackTitle = '',
bitrate = '';
let found = false;

$('table').each((i, table) => {
const ths = $(table).find('th');
const hasTrackTitle =
ths.filter((j, th) =>
$(th).text().toLowerCase().includes('track title')
).length > 0;
if (hasTrackTitle && !found) {
let dataRow = $(table).find('tbody tr').first();
if (!dataRow || dataRow.length === 0) {
dataRow = $(table).find('tr').eq(1);
}
const cells = dataRow.find('td');
if (cells.length >= 3) {
trackImage = $(cells[0]).find('img').attr('src') || '';
trackTitle = $(cells[1]).text().trim() || '';
bitrate = $(cells[2]).text().trim() || '';
found = true;
}
}
});

let downloadLink = '';
const dlBtn = $('#dlMP3');
if (dlBtn.length > 0) {
const dataSrc = dlBtn.attr('data-src');
if (dataSrc) {
try {
downloadLink = Buffer.from(dataSrc, 'base64').toString('utf-8');
} catch {
downloadLink = '';
}
}
}

return {
status: true,
criador: '@paulo_mod_domina',
resultados: {
título: trackTitle,
imagen: trackImage,
tamanho: bitrate,
link: downloadLink
}
};
}
}

export default SoundCloudScraper;