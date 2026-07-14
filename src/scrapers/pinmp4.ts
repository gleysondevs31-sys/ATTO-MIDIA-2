import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios')
const cheerio = require('cheerio')

async function scrapePinterestVideo(url) {
try {
const response = await axios.get(url)
const $ = cheerio.load(response.data)
const json = JSON.parse($('script[data-test-id="video-snippet"]').text())
return {
status: response.status,
criador: "@paulo_mod_domina",
créditos: "Licht San",
resultados: {
titulo: json.name,
thumb: json.thumbnailUrl,
video: json.contentUrl
}
}
} catch (error) {
console.error("Erro ao obter dados do Pinterest:", error)
throw new Error("Não foi possível obter os dados.")
}
}

export default scrapePinterestVideo