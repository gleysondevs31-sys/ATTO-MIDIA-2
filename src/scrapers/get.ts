import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require("axios");
const cheerio = require("cheerio");

const getZahwazein = "zenzkey_6e1fb91336"
const getLolhuman = "Space"

function instagramStoryUser(user) {
  return new Promise((resolve, reject) => {
    try {
      axios.get(`https://api.lolhuman.xyz/api/igstory/${user}?apikey=${getLolhuman}`)
      .then((res) => {
         resolve(res.data.result)
     })    
      } catch(e) {
       reject(e)
     }
   })
}

function igProfileStalk(user) {
  return new Promise((resolve, reject) => {
    try {
      axios.get(`https://api.lolhuman.xyz/api/stalkig/${user}?apikey=${getLolhuman}`)
      .then((res) => {
      axios.get(`https://api.zahwazein.xyz/stalker/ig?username=${user}&apikey=${getZahwazein}`)
      .then((data) => {
         resolve({
         profile_photo: data.data.result.hd_profile_pic_url_info.url, 
         username: res.data.result.username, 
         fullname: res.data.result.fullname, 
         is_private: data.data.result.is_private, 
         posts: res.data.result.posts, 
         followers: res.data.result.followers, 
         following: res.data.result.following, 
         biography: res.data.result.bio,
         is_music_on_profile: data.data.result.has_music_on_profile,
         is_business: data.data.result.is_business,
         is_verified: data.data.result.is_verified,
         is_highlight: data.data.result.has_highlight_reels
         })
        })
     })
    } catch(e) {
    resolve({status: false, message: e.message})
    }
  })
}

function unsplashSearch(query) {
  return new Promise((resolve, reject) => {
    try {
      axios.get(`https://vihangayt.me/search/unsplash?q=${query}`)
      .then((res) => {
         resolve(res.data.data)
     })    
      } catch(e) {
       reject(e)
     }
   })
}

// Função para realizar scraping de informações do TikTok
async function tiktokstalker(user) {
    try {
        const response = await axios.get(`https://urlebird.com/user/${user}/`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://urlebird.com/',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        // Extraia as informações do usuário aqui
        const userInfo = {
            pp_user: $('div.col-md-auto.justify-content-center.text-center > img').attr('src'),
            name: $('h1.user').text().trim(),
            username: $('div.content > h5').text().trim(),
            followers: $('div.col-7.col-md-auto.text-truncate').text().trim().split(' ')[1],
            following: $('div.col-auto.d-none.d-sm-block.text-truncate').text().trim().split(' ')[1],
            description: $('div.content > p').text().trim()
        };

        if (userInfo.name) {
            return {
                usuário: userInfo.name,
                nome: userInfo.username,
                seguidores: userInfo.followers,
                seguindo: userInfo.following,
                descrição: userInfo.description,
                profile_photo: userInfo.pp_user
            };
        } else {
            throw new Error('Usuário não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao obter dados do TikTok:', error);
        throw new Error('Erro ao obter dados do TikTok.');
    }
}

export default { 
     instagramStoryUser,
     igProfileStalk,
     unsplashSearch,
     tiktokstalker
} 