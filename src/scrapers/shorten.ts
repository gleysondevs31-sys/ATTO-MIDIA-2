import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios')

async function shortenWithYandex(longUrl) {
try {
const response = await axios.post('https://clck.ru/--',`url=${encodeURIComponent(longUrl)}`, {
headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
})
return response.data
} catch (error) {
console.error('❌ Erro no Yandex:', error.message)
return longUrl
}
}

export default { shortenWithYandex }