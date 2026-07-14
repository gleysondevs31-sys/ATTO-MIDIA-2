import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const play = require('play-dl');
const yts = require('yt-search');
const chalk = require('chalk');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Função para gerar um IP aleatório.
 * @returns {string} - Um IP aleatório.
 */
const generateRandomIp = () => {
  return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
};

/**
 * Função para gerar um User-Agent aleatório.
 * @returns {string} - Um User-Agent aleatório.
 */
const generateRandomUserAgent = () => {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:110.0) Gecko/20100101 Firefox/110.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Mobile Safari/537.36",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

/**
 * Função para configurar os cabeçalhos para as requisições.
 * @returns {Object} - Cabeçalhos configurados para o `yt-search` e `play-dl`.
 */
const configureHeaders = async () => {
  try {
    console.log(chalk.blue('[INFO] Configurando cabeçalhos...'));

    // Gerar User-Agent e IP aleatórios
    const userAgent = generateRandomUserAgent();
    const ip = generateRandomIp();

    // Configurando o token do play-dl com User-Agent e IP
    play.setToken({
      youtube: {
        userAgent: userAgent,
        X_Forwarded_For: ip,
      },
    });

    // Usar axios para obter cookies e outras informações necessárias
    const headers = {
      'User-Agent': userAgent,
      'X-Forwarded-For': ip,
    };

    // Obter cookies do YouTube
    const youtubeUrl = 'https://www.youtube.com/';
    const response = await axios.get(youtubeUrl, { headers });
    const cookies = response.headers['set-cookie'] || []; // Garantir que cookies seja uma lista

    // Verificar se há cookies para evitar o erro de "split" em undefined
    if (cookies.length > 0) {
      const cookieString = cookies.map(cookie => cookie.split(';')[0]).join('; ');
      console.log(chalk.green('[LOG] Cookies extraídos com sucesso.'));
      
      // Atualizar cabeçalhos com cookies extraídos
      headers['Cookie'] = cookieString;
    } else {
      console.warn(chalk.yellow('[AVISO] Nenhum cookie encontrado.'));
    }

    return headers;
  } catch (error) {
    console.error(chalk.red('[ERRO] Falha ao configurar cabeçalhos:', error.message));
    throw error;
  }
};

/**
 * Função para processar a busca e streaming de áudio de um vídeo do YouTube.
 * @param {string} query - Termo de pesquisa ou URL do vídeo.
 * @returns {Object} - Informações do áudio (MP3).
 */
const ytPlayMp3 = async (query) => {
  try {
    console.log(chalk.blue(`[INFO] Iniciando busca de áudio para: "${query}"`));
    const headers = await configureHeaders();

    let video;

    if (play.yt_validate(query) === 'video') {
      console.log(chalk.green('[LOG] URL válida detectada.'));
      video = { url: query };
    } else {
      console.log(chalk.blue('[LOG] Realizando pesquisa no YouTube.'));
      const searchResults = await yts(query, { pages: 1, headers });
      video = searchResults.videos[0];
    }

    if (!video || !video.url) {
      console.warn(chalk.yellow('[AVISO] Nenhum vídeo encontrado.'));
      throw new Error('Nenhum vídeo encontrado.');
    }

    console.log(chalk.green(`[LOG] Vídeo encontrado: ${video.title}`));

    // Passando os options nas requisições para o play.stream
    const options = {
      headers: headers,
      referer: video.url,  // Incluindo referer na requisição, pode ser necessário dependendo do contexto
    };

    const stream = await play.stream(video.url, options);
    console.log(chalk.green('[LOG] Stream de áudio gerado com sucesso.'));

    return {
      type: 'audio',
      title: video.title || 'Sem título',
      thumb: video.thumbnail || '',
      channel: video.author?.name || 'Desconhecido',
      published: video.ago || '',
      views: video.views || 0,
      url: [stream.url],
    };
  } catch (error) {
    console.error(chalk.red('[ERRO] ytPlayMp3:', error.message));
    throw error;
  }
};

/**
 * Função para processar a busca e streaming de vídeo de um vídeo do YouTube.
 * @param {string} query - Termo de pesquisa ou URL do vídeo.
 * @returns {Object} - Informações do vídeo (MP4).
 */
const ytPlayMp4 = async (query) => {
  try {
    console.log(chalk.blue(`[INFO] Iniciando busca de vídeo para: "${query}"`));
    const headers = await configureHeaders();

    let video;

    if (play.yt_validate(query) === 'video') {
      console.log(chalk.green('[LOG] URL válida detectada.'));
      video = { url: query };
    } else {
      console.log(chalk.blue('[LOG] Realizando pesquisa no YouTube.'));
      const searchResults = await yts(query, { pages: 1, headers });
      video = searchResults.videos[0];
    }

    if (!video || !video.url) {
      console.warn(chalk.yellow('[AVISO] Nenhum vídeo encontrado.'));
      throw new Error('Nenhum vídeo encontrado.');
    }

    console.log(chalk.green(`[LOG] Vídeo encontrado: ${video.title}`));

    // Passando os options nas requisições para o play.stream
    const options = {
      headers: headers,
      referer: video.url,  // Incluindo referer na requisição, pode ser necessário dependendo do contexto
    };

    const stream = await play.stream(video.url, options);
    console.log(chalk.green('[LOG] Stream de vídeo gerado com sucesso.'));

    return {
      type: 'video',
      title: video.title || 'Sem título',
      thumb: video.thumbnail || '',
      channel: video.author?.name || 'Desconhecido',
      published: video.ago || '',
      views: video.views || 0,
      url: [stream.url],
    };
  } catch (error) {
    console.error(chalk.red('[ERRO] ytPlayMp4:', error.message));
    throw error;
  }
};

export default {
  ytPlayMp3,
  ytPlayMp4,
};