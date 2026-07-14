import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');
const cheerio = require('cheerio');

async function RealityBBB25() {
const urls = ["https://gshow.globo.com/realities/bbb/bbb-24"];
const resultedReality = [];
for (const url of urls) {
const { data } = await axios.get(url);
const $ = cheerio.load(data);
$('.feed-post.bstn-item-shape.type-materia').each((i, elem) => {
resultedReality.push({
image: $(elem).find('.bstn-fd-picture-image').attr('src'),
title: $(elem).find('._evt').text().trim(),
headline: $(elem).find('.feed-post-body-resumo').text().trim(),
posted: $(elem).find('.feed-post-datetime').text().trim(),
session: $(elem).find('.feed-post-metadata-section').text().trim(),
link: $(elem).find('.feed-post-link.gui-color-primary.gui-color-hover').attr('href')
});
 });
 }
return resultedReality;
}

async function BigDaysBBB25() {
const urls = ["https://gshow.globo.com/realities/bbb/bbb-24/big-day"];
const resultedBigDays = [];
for (const url of urls) {
const { data } = await axios.get(url);
const $ = cheerio.load(data);
$('.feed-post.bstn-item-shape.type-materia').each((i, elem) => {
resultedBigDays.push({
image: $(elem).find('.bstn-fd-picture-image').attr('src'),
title: $(elem).find('._evt').text().trim(),
headline: $(elem).find('.feed-post-body-resumo').text().trim(),
posted: $(elem).find('.feed-post-datetime').text().trim(),
session: $(elem).find('.feed-post-metadata-section').text().trim(),
link: $(elem).find('.feed-post-link.gui-color-primary.gui-color-hover').attr('href')
});
 });
 }
return resultedBigDays;
}

async function ForaDaCasaBBB25() {
const urls = ["https://gshow.globo.com/realities/bbb/bbb-24/fora-da-casa"];
const resultedFDC = [];
for (const url of urls) {
const { data } = await axios.get(url);
const $ = cheerio.load(data);
$('.feed-post.bstn-item-shape.type-materia').each((i, elem) => {
resultedFDC.push({
image: $(elem).find('.bstn-fd-picture-image').attr('src'),
title: $(elem).find('._evt').text().trim(),
headline: $(elem).find('.feed-post-body-resumo').text().trim(),
posted: $(elem).find('.feed-post-datetime').text().trim(),
session: $(elem).find('.feed-post-metadata-section').text().trim(),
link: $(elem).find('.feed-post-link.gui-color-primary.gui-color-hover').attr('href')
});
 });
 }
return resultedFDC;
}

export default { RealityBBB25, ForaDaCasaBBB25, BigDaysBBB25 }