import { createRequire } from 'module';
const require = createRequire(import.meta.url);
/**
* Scrapper Created By: Victor Gabriela 
* Stalk & Search Vídeo & Download Vídeo (Off)
*/


const setClass = new Object({
query: '',
cookie: ''
})

export default class Kwai {
constructor(config = {}) {
const { query, cookie } = Object.assign(setClass, config)
this.query = query
this.cookie = cookie
}
get() {
if (!this.query) return Promise.reject("Campo Está Sem Dados, Informe Um Link De Vídeo, Um Usuário Pra Stalkear Ou Um Parâmetro Para Buscar Vídeos")
const Regex = /@([A-Za-z0-9._]+)/
const url = this.isUrl()
const user = Regex.test(this.query) && this.query.match(Regex)[0]
if (url) {
this.query = url[0]
return /\/(old\/photo|p)\//.test(this.query) ? this.gerais() : this.video()
} else if (user) {
this.query = user
return this.user()
} else {
return this.search()
}
};
isUrl(url = this.query) {
const m1 = /((?:https?:\/\/)?(?:(www|m)\.)?kwai\.com(?:\/([^/?#&]+)|)\/(video|photo)\/([0-9]+)).*/
const m2 = /((?:https?:\/\/)?(?:(www|m|k)\.)?kwai\.com\/p\/([a-zA-Z]+)).*/
return url.match(m1.test(url) ? m1 : m2)
};
search() {
if (!(this.query && !this.isUrl() && typeof this.query == 'string')) {
return Promise.reject("Campo Vazio! Insira Algo");
}
const data = JSON.stringify({
fromPage: 'PWA_NEW_SEARCH',
fromUser: true,
infiniteType: 'search_boost_feed',
pcursor: 0,
searchWord: this.query
});
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
return fetch("https://www.kwai.com/rest/o/w/pwa/feed/searchNew", {
method: 'POST',
headers: {
Cookie: this.cookie,
Origin: 'https://www.kwai.com',
Referer: 'https://www.kwai.com/discover/'+encodeURIComponent(this.query),
'User-Agent': this.userAgent(),
'Accept-Language': "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
Accept: 'application/json, text/plain, */*',
'Content-Type': 'application/json',
'Sec-Ch-Ua-Platform': "Android",
'Content-Length': data.length
},
body: data
}).then(i => i.json()).then(i => i.data.map(o => ({   
name: (o.data.feeds.ugcSoundAuthorName || ''),
user: o.data.feeds.kwai_id,
icon: o.data.feeds.headurls[0].url,
caption: o.data.feeds.caption,
comments: o.data.feeds.comment_count,
likes: o.data.feeds.like_count,
views: o.data.feeds.view_count,
sharing: o.data.feeds.forward_count,
url: 'https://www.kwai.com/@'+o.data.feeds.kwai_id+'/video/'+o.data.feeds.photo_id_str+'?page_source=discover'
})))
};

interactionStatistic(o) {
const rest = {}
for (let i of o.map(i => ({ count: i.userInteractionCount, type: i.interactionType['@type'].split('/').pop().replace('Action', '').toLowerCase() }))) {
Object.assign(rest, { [i.type]: i.count })
}
return rest
};
cheerioEqJson(html, index = 0) {
const cheerio = require('cheerio');
const $ = cheerio.load(html)
const str = JSON.parse($('script[type="application/ld+json"]').eq(index).html())
return str
};
gerais() {
if (!(this.query && this.isUrl() && /\/(old\/photo|p)\//.test(this.query))) {
return Promise.reject("É necessário que seja um link de old/photo.");
}
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
return fetch(this.query, {
method: 'GET',
headers: {
'User-Agent': this.userAgent(),
'Sec-Ch-Ua-Platform': "Android"
}
}).then(i => i.text()).then(html => {
const { thumbnailUrl } = this.cheerioEqJson(html)
this.query = thumbnailUrl
return this.video()
});
};
video() {
if (!(this.query && this.isUrl() && /\/(video|photo)\//.test(this.query))) {
return Promise.reject("É necessário que seja um link de vídeo.");
}
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
return fetch(this.query, {
method: 'GET',
headers: {
'User-Agent': this.userAgent(),
'Sec-Ch-Ua-Platform': "Android"
}
}).then(i => i.text()).then(html => {
let { description, uploadDate, contentUrl, audio, creator: { mainEntity }, commentCount, interactionStatistic, genre } = this.cheerioEqJson(html)
interactionStatistic = this.interactionStatistic(interactionStatistic)
mainEntity.interactionStatistic = this.interactionStatistic(mainEntity.interactionStatistic)
return Promise.resolve({   
description,
date: uploadDate,
dl: contentUrl,
audioName: audio.name,
audioAuthor: audio.author,
genre: (genre || []),
comments: commentCount,
...interactionStatistic,
profile: {
name: mainEntity.name,
user: mainEntity.alternateName,
...mainEntity.interactionStatistic,
publications: mainEntity.agentInteractionStatistic.userInteractionCount,
description: mainEntity.description,
icon: mainEntity.image,
url: mainEntity.url,
networks: mainEntity.sameAs
}
});
});
};
user() {
if (!/@([A-Za-z0-9._]+)/.test(this.query)) return Promise.reject("O campo de texto não contém um usuário. Por favor, insira um usuário para realizar a busca.")
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
return fetch("https://www.kwai.com/"+this.query+"?page_source=video_detail", {
method: 'GET',
headers: {
'User-Agent': this.userAgent(),
'Sec-Ch-Ua-Platform': "Android"
}
}).then(i => i.text()).then(html => {
let { dateCreated, mainEntity } = this.cheerioEqJson(html)
mainEntity.interactionStatistic = this.interactionStatistic(mainEntity.interactionStatistic)
return Promise.resolve({
dateCreated,
name: mainEntity.name,
user: mainEntity.alternateName,
...mainEntity.interactionStatistic,
publications: mainEntity.agentInteractionStatistic.userInteractionCount,
description: mainEntity.description,
icon: mainEntity.image,
url: mainEntity.url,
networks: mainEntity.sameAs
});
});
};
userAgent() {
const oos = [ 'Macintosh; Intel Mac OS X 10_15_7', 'Macintosh; Intel Mac OS X 10_15_5', 'Macintosh; Intel Mac OS X 10_11_6', 'Macintosh; Intel Mac OS X 10_6_6', 'Macintosh; Intel Mac OS X 10_9_5', 'Macintosh; Intel Mac OS X 10_10_5', 'Macintosh; Intel Mac OS X 10_7_5', 'Macintosh; Intel Mac OS X 10_11_3', 'Macintosh; Intel Mac OS X 10_10_3', 'Macintosh; Intel Mac OS X 10_6_8', 'Macintosh; Intel Mac OS X 10_10_2', 'Macintosh; Intel Mac OS X 10_10_3', 'Macintosh; Intel Mac OS X 10_11_5', 'Windows NT 10.0; Win64; x64', 'Windows NT 10.0; WOW64', 'Windows NT 10.0' ];
return `Mozilla/5.0 (${oos[Math.floor(Math.random() * oos.length)]}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${Math.floor(Math.random() * 3) + 87}.0.${Math.floor(Math.random() * 190) + 4100}.${Math.floor(Math.random() * 50) + 140} Safari/537.36`;
};
}

/**
* Fim Da Scrapper 
* Uso:
const kwaiii = new Kwai({
query: q //Link, Usuário Ou Texto,
cookie: `kpn=KWAI; apptype=41; sys=KWAI; client_type=3001; bucket=br; client_key=65890b29; countryInfo=BRA; webDid=7abb4b35-3b6c-454d-b63c-4e65ffdc7bfd; did=7abb4b35-3b6c-454d-b63c-4e65ffdc7bfd; webDidWithTime=7abb4b35-3b6c-454d-b63c-4e65ffdc7bfd_1710089651902; sessionId=2cfe40bb-f352-4d2f-9c10-c3b3898d0b8f; i18n_redirected=pt-BR`
})
await kwaiii.get().then(console.log)
*/