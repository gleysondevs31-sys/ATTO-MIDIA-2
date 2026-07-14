import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');

class ScrapperData {
    static async WhatsAppChannel(query) {
        return new Promise((resolve, reject) => {
           axios.get('https://itzpire.com/stalk/whatsapp-channel?url=' + query?.trim())
            .then((response) => {
                return resolve({ imageUrl: response.data.data.img?.trim() || null, channelName: response.data.data.title?.trim(), followersCount: response.data.data.followers || 0, description: response.data.data.description?.trim() || "Sem descrição." });
            }).catch((error) => {
                return reject(error.message?.trim());
            })
        })
    }
}

export default ScrapperData;