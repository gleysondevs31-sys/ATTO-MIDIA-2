import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');
const cheerio = require('cheerio');

function gerarUserAgent() {
const userAgents = [
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59 Safari/537.36',
];
return userAgents[Math.floor(Math.random() * userAgents.length)];
}

const searchAnime = async (searchQuery) => {
try {
const response = await axios.get(`https://animesdigital.org/?s=${encodeURIComponent(searchQuery)}`, {
headers: {
'User-Agent': gerarUserAgent(),
},
});
const $ = cheerio.load(response.data); 

const searchPromises = $('.b_flex.b_wrap .itemA').map(async (i, elem) => {
const animeTitle = $(elem).find('a').attr('title').replace('Assistir ', '').replace('Online em HD', '');
const animeUrl = $(elem).find('a').attr('href');
const thumb = $(elem).find('.thumb img').attr('src'); 
const animeDetails = await getAnime(animeUrl); 
return {
title: animeTitle,
link: animeUrl, 
thumb: thumb,
year: animeDetails.year, 
author: animeDetails.author,
director: animeDetails.director,
studio: animeDetails.studio,
genres: animeDetails.genres,
description: animeDetails.description,
}
}).get();
return Promise.all(searchPromises);
} catch (error) {
console.error('Erro ao buscar animes:', error);
throw new Error('Erro ao buscar animes');
}
};

 const getAnime = async (animeUrl) => {
try {
const response = await axios.get(animeUrl, {
headers: {
'User-Agent': gerarUserAgent(),
},
});
const $ = cheerio.load(response.data);
const animeTitle = $('div.dados h1').text().trim();
const animeYear = $('.info').filter((i, elem) => $(elem).text().includes('Ano')).text().split('Ano')[1]?.trim() || 'Desconhecido';
const animeAuthor = $('.info').filter((i, elem) => $(elem).text().includes('Autor')).text().split('Autor')[1]?.trim() || 'Desconhecido';
const animeDirector = $('.info').filter((i, elem) => $(elem).text().includes('Diretor')).text().split('Diretor')[1]?.trim() || 'Desconhecido';
const animeStudio = $('.info').filter((i, elem) => $(elem).text().includes('Estúdio')).text().split('Estúdio')[1]?.trim() || 'Desconhecido';
const animeGenres = [];
$('div.dados .genres .genre a').each((index, element) => {
animeGenres.push($(element).text().trim());
});
const animeDescription = $('div.dados .sinopse').text().trim();
const episodes = [];
let episodeImage = '';
const episodePromises = $('.itens_ep .item_ep').map(async (i, elem) => {
const episodeTitle = $(elem).find('.title_anime').text().trim();
const episodeLink = $(elem).find('a').attr('href');
const episodeImageTemp = $(elem).find('img').data('lazy-src') || $(elem).find('img').attr('src'); 
const episodeDate = $(elem).find('.date').text().trim();

const episodeResponse = await axios.get(episodeLink, {
headers: {
'User-Agent': gerarUserAgent(),
},
});
const $episode = cheerio.load(episodeResponse.data);
const anime = $episode('div.b_itens .info span').eq(1).text().trim();
let episodeNumber = $episode('div.b_itens .info span').eq(3).text().trim();
const audio = $episode('div.b_itens .info span').eq(5).text().trim();
const title = $episode('div.b_itens .info span').eq(7).text().trim();
const uploadDate = $episode('meta[itemprop="uploadDate"]').attr('content');
const videoUrl = $episode('iframe.metaframe').attr('src');
episodeNumber = parseInt(episodeNumber.replace(/\D/g, ''), 10) || 0;
if (episodeTitle && episodeLink) {
episodeImage = episodeImageTemp || episodeImage; 
episodes.push({
tituloAnime: episodeTitle,
animeImage: episodeImage,
lancamento: episodeDate,
animeDetails: { anime, episode: episodeNumber, audio, title, uploadDate, videoUrl }
});
}
}).get();

await Promise.all(episodePromises);
episodes.sort((a, b) => a.animeDetails.episode - b.animeDetails.episode);
const animeData = {
title: animeTitle,
imgUrl: episodeImage,
year: animeYear,
author: animeAuthor,
director: animeDirector,
studio: animeStudio,
total_ep: episodes.length,
genres: animeGenres,
sinopse: animeDescription,
episodes
};
return animeData;
} catch (error) {
console.error('Error fetching anime data:', error.message);
throw new Error('Erro ao buscar dados do anime');
}
};

export default { searchAnime, getAnime };