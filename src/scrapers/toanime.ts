import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B
const axios = require("axios")
const FormData = require("form-data")
const fs = require("fs")
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const cheerio = require("cheerio")

async function toAnime(url) {
return new Promise(async (resolve, reject) => {
const formData = new FormData()
formData.append("image-url", url)
try {
const response = await axios.post(
"https://tools.revesery.com/image-anime/convert.php",
formData,
{
headers: {
Accept: "application/json",
...formData.getHeaders(),
},
}
)
console.log(response.data)
resolve(response.data)
} catch (error) {
console.error(error?.response?.data)
resolve(error?.response?.data)
}
})
}

export default { toAnime }