import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');

class ScrapperData2 {
    constructor(query) {
        if (!query) {
            throw new Error("A URL é obrigatória para inicializar a classe.");
        }
        this.query = query; // Armazena a URL passada no construtor
    }

    async get() {
        try {
            // Obter o token
            const { data: tokenResponse } = await axios.get("https://y2ts.us.kg/token", {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Referer": "https://y2ts.us.kg/",
                    "Referrer-Policy": "strict-origin-when-cross-origin",
                    "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
                }
            });

            const token = tokenResponse.token;

            // Fazer a requisição com o token
            const { data: responseInfo } = await axios.get(
                `https://y2ts.us.kg/youtube?url=${encodeURIComponent(this.query)}`,
                {
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Referer": "https://y2ts.us.kg/",
                        "Referrer-Policy": "strict-origin-when-cross-origin",
                        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
                        "Authorization-Token": token
                    }
                }
            );

            return responseInfo.result;
        } catch (error) {
            throw new Error(`Erro ao obter dados: ${error.message}`);
        }
    }
}

export default ScrapperData2
