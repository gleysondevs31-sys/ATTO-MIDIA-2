import { createRequire } from 'module';
const require = createRequire(import.meta.url);
/*****
   {credits} Paulo 
   Corrigido e Otimizado por Manus
*****/
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuração do Logger
let logger;
try {
    logger = require("./database/logger.js");
} catch (e) {
    logger = {
        infoLog: (...args) => console.log("[INFO]", ...args),
        successLog: (...args) => console.log("[SUCCESS]", ...args),
        errorLog: (...args) => console.error("[ERROR]", ...args),
        warningLog: (...args) => console.warn("[WARNING]", ...args)
    };
}
const { infoLog, successLog, errorLog, warningLog } = logger;

infoLog("System de Metadinha Ativos e operando Momo Ayase");

class Pinterest {
    async search(query) {
        try {
            // Técnica: Usar a URL de busca mobile que é menos restritiva
            const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
            const headers = {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9'
            };
            
            const { data: html } = await axios.get(url, { headers, timeout: 15000 });
            
            // Extração agressiva de URLs de imagens
            // O Pinterest usa URLs i.pinimg.com para todas as imagens de pins
            const regex = /https:\/\/i\.pinimg\.com\/[a-z0-9\/]+\/[a-z0-9\/]+\.(jpg|png|gif)/g;
            const matches = html.match(regex) || [];
            
            // Limpa e converte para alta resolução (originals)
            const images = [...new Set(matches)]
                .filter(u => !u.includes('user_main') && !u.includes('75x75'))
                .map(u => u.replace(/\/(170x|236x|474x|564x|736x)\//, '/originals/'));
            
            return images.map(img => ({ image: img, caption: 'Metadinha Anime' }));
        } catch (error) {
            errorLog('Erro na busca: ' + error.message);
            return [];
        }
    }
}

async function uploadToCatbox(buffer, filename = 'meta.png') {
  try {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', buffer, { filename });
    const { data } = await axios.post('https://catbox.moe/user/api.php', formData, { 
        headers: formData.getHeaders(),
        timeout: 30000 
    });
    return data;
  } catch (error) {
    return null;
  }
}

async function atualizarMetadinhasAnime(limite = 10, outputFile = 'database/metadinhas.json') {
  const pinterest = new Pinterest();
  try {
    // RESOLVE O ERRO DE DIRETÓRIO (ENOENT)
    // Garante que o caminho seja absoluto e o diretório exista
    const absolutePath = path.isAbsolute(outputFile) ? outputFile : path.resolve(process.cwd(), outputFile);
    const dir = path.dirname(absolutePath);
    
    if (!fs.existsSync(dir)) {
        infoLog(`Criando diretório ausente: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }

    infoLog("Iniciando busca no Pinterest...");
    let resultados = await pinterest.search("metadinha anime casal");
    
    if (resultados.length < 2) {
        infoLog("Tentando busca alternativa...");
        resultados = await pinterest.search("matching icons anime");
    }

    infoLog(`Encontrados ${resultados.length} resultados potenciais.`);

    if (resultados.length < 2) {
        errorLog("Não foi possível encontrar imagens suficientes. O Pinterest pode estar bloqueando o acesso temporariamente.");
        return [];
    }

    let metadinhas = [];
    if (fs.existsSync(absolutePath)) {
        try {
            const content = fs.readFileSync(absolutePath, 'utf8');
            metadinhas = content ? JSON.parse(content) : [];
        } catch (e) { 
            warningLog("Erro ao ler arquivo existente, criando novo.");
            metadinhas = []; 
        }
    }
    
    const usados = new Set(metadinhas.map(m => `${m.url_parte1}|${m.url_parte2}`));
    let contador = metadinhas.length + 1;
    let novosAdicionados = 0;

    // Processa em pares
    for (let i = 0; i < resultados.length - 1 && metadinhas.length < limite; i += 2) {
      const img1 = resultados[i].image;
      const img2 = resultados[i + 1].image;
      
      if (usados.has(`${img1}|${img2}`)) continue;
      usados.add(`${img1}|${img2}`);

      try {
        infoLog(`Processando par ${contador}...`);
        const [res1, res2] = await Promise.all([
          axios.get(img1, { responseType: 'arraybuffer', timeout: 10000 }).catch(() => null),
          axios.get(img2, { responseType: 'arraybuffer', timeout: 10000 }).catch(() => null)
        ]);

        if (!res1 || !res2) continue;

        const [url1, url2] = await Promise.all([
          uploadToCatbox(Buffer.from(res1.data), `meta${contador}_1.png`),
          uploadToCatbox(Buffer.from(res2.data), `meta${contador}_2.png`)
        ]);
        
        if (url1 && url2 && url1.startsWith('http') && url2.startsWith('http')) {
            metadinhas.push({ 
                id: contador, 
                nome: `Metadinha Anime ${contador}`, 
                url_parte1: url1, 
                url_parte2: url2, 
                tags: ["anime", "metadinha"] 
            });
            successLog(`✅ Par ${contador} adicionado com sucesso!`);
            contador++;
            novosAdicionados++;
        }
      } catch (err) {
          errorLog(`Erro no par ${contador}: ${err.message}`);
      }
    }

    fs.writeFileSync(absolutePath, JSON.stringify(metadinhas, null, 2));
    successLog(`\n🎉 Finalizado! JSON atualizado em: ${absolutePath}`);
    successLog(`Total de metadinhas no arquivo: ${metadinhas.length} (${novosAdicionados} novas).`);
    return metadinhas;
  } catch (err) {
    errorLog("Erro crítico no sistema: " + err.message);
  }
}

// Execução direta para teste
if (require.main === module) {
    atualizarMetadinhasAnime(5).then(() => infoLog("Processo concluído."));
}

export default { atualizarMetadinhasAnime };
