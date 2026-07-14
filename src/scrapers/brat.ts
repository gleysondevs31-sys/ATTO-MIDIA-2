import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// Classe BratService
const axios = require("axios");

class BratService {
  constructor(host = 1) {
    this.BASE_URLS = {
      1: "https://aqul-brat.hf.space/?text=", // Imagem estática
      2: "https://skyzxu-brat.hf.space/brat-animated?text=" // Vídeo animado
    };

    const totalHosts = Object.keys(this.BASE_URLS).length;
    const validHost = Math.min(Math.max(host, 1), totalHosts);

    this.BASE_URL = this.BASE_URLS[validHost];
  }

  async fetchCommand(text) {
    const url = `${this.BASE_URL}${encodeURIComponent(text)}`;
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Error fetching: ${error.message}`);
    }
  }
}

export default BratService;

// Exemplo de instância
// const service = new BratService(1);
// service.fetchCommand("teste").then(console.log).catch(console.error);