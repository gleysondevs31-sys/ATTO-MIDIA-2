import { createRequire } from 'module';
const require = createRequire(import.meta.url);
/*****
   {credits} Este código foi escrito por LUCAS MOD DOMINA e foi reorganizado por Victor Gabriel, desenvolvedor da Sab's BOT & APIs.
   © Copyright by Lucas & Victor G.
*****/

const axios = require('axios');
const cheerio = require('cheerio');

class Pinterest {
    getCookies() {
        return new Promise((resolve, reject) => {
            axios.get('https://www.pinterest.com/csrf_error/').then((response) => {
                const setCookieHeaders = response.headers['set-cookie'];
                if (setCookieHeaders) {
                    const cookies = setCookieHeaders.map(cookieString => {
                        const cookieParts = cookieString.split(';')
                        const cookieKeyValue = cookieParts[0].trim()
                        return cookieKeyValue;
                    })
                    return resolve(cookies.join('; '));
                } else {
                    console.warn('No set-cookie headers found in the response.')
                    return resolve(null);
                }
            }).catch((error) => reject('Error'));
        })
    }
    
    search(query) {
        return new Promise(async(resolve, reject) => {
            const cookies = await this.getCookies();
            if (!cookies) return reject('Failed to retrieve cookies.');
            const params = {
                source_url: `/search/pins/?q=${query}`,
                data: JSON.stringify({
                    "options": {
                        "isPrefetch": false,
                        "query": query,
                        "scope": "pins",
                        "no_fetch_context_on_resource": false
                    },
                    "context": {}
                }),
                _: Date.now()
            };
            const headers = {
                'accept': 'application/json, text/javascript, */*, q=0.01',
                'accept-encoding': 'gzip, deflate',
                'accept-language': 'en-US,en;q=0.9',
                'cookie': cookies,
                'dnt': '1',
                'referer': 'https://www.pinterest.com/',
                'sec-ch-ua': '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
                'sec-ch-ua-full-version-list': '"Not(A:Brand";v="99.0.0.0", "Microsoft Edge";v="133.0.3065.92", "Chromium";v="133.0.6943.142"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-model': '""',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua-platform-version': '"10.0.0"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0',
                'x-app-version': 'c056fb7',
                'x-pinterest-appstate': 'active',
                'x-pinterest-pws-handler': 'www/[username]/[slug].js',
                'x-pinterest-source-url': '/hargr003/cat-pictures/',
                'x-requested-with': 'XMLHttpRequest'
            }
            
            axios.get('https://br.pinterest.com/resource/BaseSearchResource/get/', {
                headers: headers,
                params: params
            }).then(({ data: response }) => {
                const container = []
                const results = response.resource_response.data.results.filter((v) => v.images?.orig);
                results.forEach((result) => {
                    container.push({
                        by: result.pinner.username,
                        fullname: result.pinner.full_name,
                        followers: result.pinner.follower_count,
                        caption: result.grid_title,
                        image: result.images.orig.url,
                        source: "https://br.pinterest.com/pin/" + result.id,
                    })
                })
                return resolve(container);
            }).catch((error) => reject('Error'));
        })
    }
    
    download(url) {
        return new Promise((resolve, reject) => {
            axios.get(url, {
                headers: {
                   'User-Agent': this.userAgent
                }
            }).then(({ data: html }) => {
                const $ = cheerio.load(html);
                const tagScript = $('script[data-test-id="video-snippet"]');
                const result = JSON.parse(tagScript.text());
                if (!result || !result.name || !result.thumbnailUrl || !result.uploadDate || !result.creator) return reject(this.semResult);
                const user = result.creator.name;
                return resolve({
                   dl_link: result.contentUrl,
                   title: result.name,
                   thumb: result.thumbnailUrl,
                   upload: (new Date(result.uploadDate)).toLocaleDateString('pt-BR', {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'}),
                   source: result["@id"],
                   author: {
                      name: result.creator.alternateName,
                      username: "@" + user,
                      url: result.creator.url
                   },
                   keyword: result.keywords ? result.keywords.split(", ").map(keyword => keyword.trim()) : [] // Palavras-chaves
                });
            }).catch((error) => reject(error));
        });
    }
}

export default Pinterest;