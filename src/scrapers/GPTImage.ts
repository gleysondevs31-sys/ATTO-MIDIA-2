import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require("axios");

/**
 * GPTImage - Versão "Inquebrável"
 * Adicionado Pollinations AI como fallback mestre (não bloqueia IP facilmente).
 */
const GPTImage = {
  config: {
    gpt5: {
      url: 'https://chatgpt5free.com/wp-json/chatgpt-pro/v1/image',
      referer: 'https://chatgpt5free.com/chat/',
      origin: 'https://chatgpt5free.com'
    },
    unrestricted: {
      url: "https://unrestrictedaiimagegenerator.com/",
    },
    agents: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1"
    ]
  },

  /**
   * Método Principal - Agora com 3 tentativas!
   */
  generate: async function (prompt) {
    if (!prompt) return { success: false, message: "Prompt vazio" };

    // 1. Tenta Pollinations AI (O mais rápido e quase impossível de bloquear)
    try {
      return await this.fromPollinations(prompt);
    } catch (e) {}

    // 2. Tenta GPT-5
    try {
      const res = await this.fromGPT5(prompt);
      if (res.success) return res;
    } catch (e) {}

    // 3. Tenta Unrestricted
    try {
      return await this.fromUnrestricted(prompt);
    } catch (error) {
      return {
        success: false,
        message: "Todos os serviços falharam. O IP do servidor pode estar em uma blacklist global.",
        error: error.message,
        owners: "paulo_mod_domina"
      };
    }
  },

  /**
   * Pollinations AI - Ultra Rápido e Sem Bloqueio
   */
  fromPollinations: async function (prompt) {
    // Pollinations gera a URL instantaneamente, é o melhor para quando o IP está bloqueado
    const encodedPrompt = encodeURIComponent(prompt);
    const width = 1024;
    const height = 1024;
    const seed = Math.floor(Math.random() * 1000000);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    // Fazemos um pequeno head check para garantir que o serviço está online
    await axios.head(url, { timeout: 5000 });

    return {
      success: true,
      url: url,
      provider: "Pollinations (Anti-Block)",
      owners: "paulo_mod_domina"
    };
  },

  fromGPT5: async function (prompt) {
    const agent = this.config.agents[Math.floor(Math.random() * this.config.agents.length)];
    const response = await axios.post(this.config.gpt5.url, 
      { prompt, provider: "openai" },
      {
        timeout: 8000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': agent,
          'Referer': this.config.gpt5.referer,
          'Origin': this.config.gpt5.origin
        }
      }
    );

    if (response.data?.data?.[0]?.url) {
      return {
        success: true,
        url: response.data.data[0].url,
        provider: "GPT-5",
        owners: "paulo_mod_domina"
      };
    }
    throw new Error("Falha no GPT5");
  },

  fromUnrestricted: async function (prompt) {
    const agent = this.config.agents[0];
    const { data: html, headers } = await axios.get(this.config.unrestricted.url, {
      timeout: 5000,
      headers: { 'User-Agent': agent }
    });

    const cookies = headers['set-cookie']?.join('; ');
    const nonceMatch = html.match(/name="_wpnonce" value="([^"]+)"/);
    const nonce = nonceMatch ? nonceMatch[1] : null;

    if (!nonce) throw new Error("Bloqueio de IP no Unrestricted");

    const form = new URLSearchParams({
      generate_image: "true",
      image_description: prompt,
      image_style: "anime",
      _wpnonce: nonce
    });

    const res = await axios.post(this.config.unrestricted.url, form.toString(), {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies || '',
        'User-Agent': agent,
        'Referer': this.config.unrestricted.url,
        'Origin': 'https://unrestrictedaiimagegenerator.com'
      }
    });

    const imgMatch = res.data.match(/id="resultImage" src="([^"]+)"/);
    if (imgMatch && imgMatch[1]) {
      return {
        success: true,
        url: imgMatch[1],
        provider: "Unrestricted",
        owners: "paulo_mod_domina"
      };
    }
    throw new Error("Imagem não encontrada");
  }
};

export default GPTImage;
