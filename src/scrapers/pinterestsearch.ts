import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');

async function pinterestSearch(query, cookie, csrftoken) {
  const defaultCookie = '_pinterest_sess=...; csrftoken=...';
  const defaultCsrftoken = '...';

  // adiciona sufixo aleatório para variar resultados
  const randomSuffix = Math.floor(Math.random() * 10000);
  const modifiedQuery = `${query} ${randomSuffix}`;

  const userAgents = [
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  ];
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

  const randomPageSize = Math.floor(Math.random() * 30) + 20;

  const url = 'https://br.pinterest.com/resource/BaseSearchResource/get/';
  const headers = {
    'accept': 'application/json, text/javascript, */*, q=0.01',
    'accept-language': 'pt-BR', // força resultados em português
    'content-type': 'application/x-www-form-urlencoded',
    'cookie': cookie || defaultCookie,
    'origin': 'https://br.pinterest.com',
    'referer': `https://br.pinterest.com/search/pins/?q=${encodeURIComponent(modifiedQuery)}&rs=typed`,
    'user-agent': randomUserAgent,
    'x-csrftoken': csrftoken || defaultCsrftoken,
    'x-pinterest-appstate': 'active',
    'x-pinterest-source-url': `/search/pins/?q=${encodeURIComponent(modifiedQuery)}&rs=typed`,
    'x-requested-with': 'XMLHttpRequest',
  };

  const data = new URLSearchParams();
  data.append('source_url', `/search/pins/?q=${encodeURIComponent(modifiedQuery)}&rs=typed`);
  data.append('data', JSON.stringify({
    options: {
      query: modifiedQuery,
      scope: 'pins',
      page_size: randomPageSize,
      rs: 'typed',
      redux_normalize_feed: true,
      bookmarks: [],
    },
    context: {},
  }));

  try {
    const response = await axios.post(url, data, { headers });
    const results = response.data?.resource_response?.data?.results || [];

    const shuffledResults = [...results].sort(() => Math.random() - 0.5);

    return shuffledResults.map((pin) => ({
      id: pin.id,
      titulo: pin.grid_title, // título em português
      descricao: pin.description,
      imagem: pin.images?.['736x']?.url || pin.images?.['474x']?.url,
      video: pin.story_pin_data?.pages?.[0]?.blocks?.[0]?.video?.video_list?.V_HLSV3_MOBILE?.url || null,
      autor: pin.pinner?.full_name,
      usuario: pin.pinner?.username,
      quadro: pin.board?.name,
      quadroUrl: pin.board?.url,
    }));
  } catch (error) {
    console.error('Erro Pinterest:', error.message);
    return [];
  }
}

export default pinterestSearch;