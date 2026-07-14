import { createRequire } from 'module';
const require = createRequire(import.meta.url);
/**
* Scrappers Created By: Lk
* Adapted By: Lk
**/

const axios = require("axios");
const cheerio = require("cheerio");

class AppleMusic {
search = async function search(q) {
return new Promise(async (resolve, reject) => {
await axios.get(`https://music.apple.com/id/search?term=${encodeURIComponent(q)}`).then((a) => {
let $ = cheerio.load(a.data);
let array = [];
$(".shelf-grid__body ul li .track-lockup").each((a, i) => {
let title = $(i).find(".track-lockup__content li").eq(0).find("a").text().trim();
let album = $(i).find(".track-lockup__content li").eq(0).find("a").attr("href");
let crop = $(i).find(".track-lockup__content li").eq(0).find("a").attr("href").split("/").pop();
let song = album.replace(crop, "").trim().replace("/album/", "/song/").trim() + album.split("i=")[1];
let image = $(i).find(".svelte-3e3mdo source").eq(1).attr("srcset").split(",")[1].split(" ")[0].trim();
let artist = {
name: $(i).find(".track-lockup__content li").eq(1).find("a").text().trim(),
url: $(i).find(".track-lockup__content li").eq(1).find("a").attr("href"),
};
array.push({
title,
image,
song,
artist,
});
});
resolve(array);
});
});
};
//Downloader
download = async function download(url) {
return new Promise(async (resolve, reject) => {
try {
const response = await axios.get(url);
const $ = cheerio.load(response.data);
const json = JSON.parse($("script").eq(0).text());
let info = { metadata: {}, download: {} };
if (json.audio) {
if (json.audio["@type"]) delete json.audio["@type"];
if (json.audio.audio) delete json.audio.audio;
if (json.audio.inAlbum) {
delete json.audio.inAlbum["@type"];
delete json.audio.inAlbum.byArtist;
}
if (Array.isArray(json.audio.byArtist) && json.audio.byArtist.length > 0) {
json.audio.artist = json.audio.byArtist[0];
delete json.audio.artist["@type"];
delete json.audio.byArtist;
} else {
json.audio.artist = { name: "Unknown Artist" };
}
info.metadata = {
name: json.audio.name || "Indisponível",
artist: json.audio.artist.name || "Indisponível",
album: json.audio.inAlbum?.name || "Indisponível",
url: json.audio.url || "Indisponível",
};
const { data } = await axios.get("https://aaplmusicdownloader.com/api/composer/ytsearch/mytsearch.php", {
params: {
name: info.metadata.name,
artist: info.metadata.artist,
album: info.metadata.album,
link: info.metadata.url,
},
});
if (!data.videoid) return reject(data);
const download = await axios.get(`https://aaplmusicdownloader.com/api/ytdl.php?q=${data.videoid}`);
info.download = download.data.dlink;
resolve(info);
} else {
reject("Estrutura Do Json Inválida Very 🫦");
}
} catch (error) {
console.error("Erro:", error);
reject(error.message);
}
});
};
}

export default new AppleMusic();