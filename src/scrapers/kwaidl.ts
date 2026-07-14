import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios')
const cheerio = require('cheerio')

async function kwaiDownload(url) {
try {
const response = await axios.get(url, {
headers: {
"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
}
});
const $ = cheerio.load(response.data);
const scriptTag = $('script#VideoObject');
if (!scriptTag.length) {
return { error: "deu erro" };
}
const videoData = JSON.parse(scriptTag.html());
return {
status: true,
criador: '@paulo_mod_domina',
resultados: {
titulo: videoData.name,
descricao: videoData.description || "Sem descrição",
thumbnail: videoData.thumbnailUrl[0],
publicado: videoData.uploadDate,
video: videoData.contentUrl,
duracao: videoData.duration,
criador: {
nome: videoData.creator.mainEntity.name,
usuario: videoData.creator.mainEntity.alternateName,
perfil: videoData.creator.mainEntity.url
}
}
};
} catch (error) {
return { error: "Erro ao processar a página", detalhe: error.message };
}
};

async function kwaistalk(query) {
try {
const url = `https://www.kwai.com/@${query}`;
const response = await axios.get(url, {
headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36" }
});
const $ = cheerio.load(response.data);
const scriptTag = $('script#Person');
const videosTag = $('script#ItemList');
if (!scriptTag.length) return { erro: "Perfil não encontrado." };
const perfilData = JSON.parse(scriptTag.html());
const usuario = perfilData.mainEntity;
const seguidores = usuario.interactionStatistic.find(stat => stat.interactionType["@type"].includes("FollowAction"))?.userInteractionCount || 0;
const curtidas = usuario.interactionStatistic.find(stat => stat.interactionType["@type"].includes("LikeAction"))?.userInteractionCount || 0;
let dados = {
id_usuario: usuario.identifier,
nome: usuario.name,
nome_usuario: usuario.alternateName,
data_criacao: perfilData.dateCreated,
seguidores: seguidores,
seguindo: usuario.agentInteractionStatistic?.userInteractionCount || 0,
curtidas: curtidas,
bio: usuario.description || "Sem biografia",
foto_perfil: usuario.image,
url_perfil: usuario.url,
links_alternativos: usuario.sameAs || []
};
if (videosTag.length) {
const videosData = JSON.parse(videosTag.html());
const videos = videosData.itemListElement.map(video => ({
titulo: video.name,
descricao: video.description || "Sem descrição",
url: video.url,
thumbnail: video.thumbnailUrl[0],
data_upload: video.uploadDate,
duracao: video.duration,
resolucao: { largura: video.width, altura: video.height },
curtidas: video.interactionStatistic.find(stat => stat.interactionType["@type"].includes("LikeAction"))?.userInteractionCount || 0,
comentarios: video.commentCount || 0,
compartilhamentos: video.interactionStatistic.find(stat => stat.interactionType["@type"].includes("ShareAction"))?.userInteractionCount || 0
}));
dados.total_videos = videos.length;
dados.videos = videos;
};
return {
status: true,
criador: '@paulo_mod_domina',
resultados: dados
};
} catch (error) {
return { erro: "deu erro ao encontrar o usuário", detalhe: error.message };
}
};

export default { kwaiDownload, kwaistalk };