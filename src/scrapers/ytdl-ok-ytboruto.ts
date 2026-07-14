/**
 * ytboruto - YouTube Scraper Atualizado (2026)
 * Sistema corrigido utilizando os novos endpoints do ytconvert/ytmp3.gg
 */

const ytboruto = {
    headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        'accept': 'application/json',
        'origin': 'https://ytmp3.gg',
        'referer': 'https://ytmp3.gg/'
    },

    /**
     * Realiza a busca de vídeos no YouTube
     * @param {string} query - Termo de busca
     */
    async search(query) {
        try {
            const url = `https://search.ytconvert.org/api/youtube/search?q=${encodeURIComponent(query)}`;
            const r = await fetch(url, { headers: this.headers });
            const data = await r.json();

            if (!data.items) return [];

            return data.items
                .filter(item => item.type === 'stream')
                .map(item => {
                    const videoId = item.id.includes('watch?v=') ? item.id.split('v=')[1] : item.id;
                    return {
                        title: item.title,
                        videoId: videoId,
                        url: `https://www.youtube.com/watch?v=${videoId}`,
                        thumbnail: item.thumbnailUrl,
                        uploader: item.uploaderName,
                        duration: item.duration,
                        viewCount: item.viewCount,
                        uploadDate: item.uploadDate
                    };
                });
        } catch (e) {
            throw new Error(`Falha na busca: ${e.message}`);
        }
    },

    /**
     * Converte e obtém o link de download de um vídeo
     * @param {string} url - URL do vídeo do YouTube
     * @param {string} format - 'mp3' ou 'mp4'
     * @param {string} quality - Qualidade (ex: '320' para mp3, '720' para mp4)
     */
    async download(url, format = "mp3", quality = null) {
        try {
            const type = format === "mp4" ? "video" : "audio";
            const q = quality || (type === "video" ? "720" : "320");

            const payload = {
                url,
                output: {
                    type,
                    format,
                    audioFormat: format,
                    audioBitrate: String(q),
                    videoQuality: String(q)
                }
            };

            // 1. Inicia a conversão
            const r = await fetch('https://hub.ytconvert.org/api/download', {
                method: 'POST',
                headers: { ...this.headers, 'content-type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await r.json();

            if (data.error) throw new Error(data.error.message);
            if (!data.statusUrl) throw new Error('URL de status não retornada pela API');

            // 2. Polling para verificar o progresso
            for (let i = 0; i < 30; i++) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                const rStatus = await fetch(data.statusUrl, { headers: this.headers });
                const statusData = await rStatus.json();

                if (statusData.status === 'completed') {
                    return {
                        title: statusData.title || "YouTube Video",
                        downloadURL: statusData.downloadUrl,
                        duration: statusData.duration,
                        format,
                        quality: q,
                        source: "ytconvert-api"
                    };
                }

                if (statusData.status === 'failed') {
                    throw new Error('A conversão falhou no servidor');
                }
            }

            throw new Error('Timeout: O processamento demorou demais');
        } catch (e) {
            throw new Error(`Falha no download: ${e.message}`);
        }
    }
};

export default ytboruto;
