import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require("axios");

class Spotify {
  constructor() {
    this.clientID = 'acc6302297e040aeb6e4ac1fbdfd62c3';
    this.clientSecret = '0e8439a1280a43aba9a5bc0a16f3f009';
    this.basic = Buffer.from(`${this.clientID}:${this.clientSecret}`).toString("base64");
    this.tokenEndpoint = 'https://accounts.spotify.com/api/token';
  }

  async spotifyCreds() {
    return new Promise(async(resolve, reject) => {
      const response = await axios.post(this.tokenEndpoint, 'grant_type=client_credentials', {
        headers: { Authorization: 'Basic ' + this.basic },
      }).catch((error) => reject({
        status: false,
        message: 'Failed to retrieve Spotify credentials.',
        statusCode: error.response.statusCode
      }));
      return resolve({
        status: true,
        data: response.data || {},
        statusCode: response.statusCode
      });
    })
  }

  async toTime(ms) {
    return new Promise((resolve, reject) => {
      let hours = Math.floor(ms / 3600000);
      let minutes = Math.floor(ms / 60000) % 60;
      let seconds = Math.floor(ms / 1000) % 60;
      return resolve([hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(":"));
    })
  }

  async searchTracks(query, type = "track", limit = 20) {
    return new Promise(async(resolve, reject) => {
      const creds = await this.spotifyCreds();
      if(!creds.status) return creds;
      const response = await axios.get(`https://api.spotify.com/v1/search?query=${encodeURIComponent(query)}&type=${type}&offset=0&limit=${limit}`, {
        headers: { Authorization: 'Bearer ' + creds.data.access_token },
      }).catch((error) => reject((error)));
      
      if (!response.data[type + 's'] || !response.data[type + 's'].items.length) {
        return reject('Música não encontrada!');
      }
      
      const items = await Promise.all(response.data[type + 's'].items.map(async(item) => ({
        explicitMusic: item?.explicit,
        name: item?.name,
        popularity: item?.popularity + '%',
        url: item.external_urls?.spotify,
        album: {
          images: item.album?.images.map((v, index) => v.url),
          name: item.album?.name,
          releaseDate: item.album?.release_date,
          totalTracks: item.album?.total_tracks,
          artists: item.album?.artists.map((v, index) => v.name).join(', ')
        },
        trackArtist: item?.artists.map((v, index) => v.name).join(', '),
        duration: await this.toTime(item?.duration_ms),
        previewUrl: item?.preview_url
      })));
      
      return resolve(items);
    });
  }

  async downloadTrack(url) {
    return new Promise(async(resolve, reject) => {
        const regex = /^https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)(?:\?.*)?$/;
        if (!url.match(regex)) return reject('Erro! Este URL não pertence a um Track do Spotify.');
        const spotifyDown = await axios.request({
            method: 'POST',
            url: 'https://parsevideoapi.videosolo.com/spotify-api/',
            headers: {
                'Authority': 'parsevideoapi.videosolo.com',
                'User-Agent': 'Postify/1.0.0',
                'Referer': 'https://spotidown.online/',
                'Origin': 'https://spotidown.online'
            },
            data: {
                format: 'web',
                url: 'https://open.spotify.com/track/' + url.match(regex)[1]
            }
        }).catch(() => {
            return reject('Eita, parece que ocorreu um erro ao fazer a requisição, será que é um erro muito grave? Solicite ao desenvolvedor que verifique a API, se for você, preste a atenção no código.');
        });
        if(spotifyDown.data.status === "-4") return reject('URL Inválido, você só pode baixar a faixa (Track), não aceito Playlist ou Album, somente Tracks do Spotify, beijinhos.');
        if (!spotifyDown.data.data.metadata || Object.keys(spotifyDown.data.data.metadata).length === 0) return reject('Metadata indisponível ou inexistente, será que eu cometi um erro na leitura do URL (impossivel)? Tente novamente mais tarde.');
        return resolve({
            dl_link: spotifyDown.data.data.metadata.download,
            albumName: spotifyDown.data.data.metadata.album,
            imageUrl: spotifyDown.data.data.metadata.image,
            duration: await this.toTime(spotifyDown.data.data.metadata.duration),
            trackName: spotifyDown.data.data.metadata.name,
            artistName: spotifyDown.data.data.metadata.artist
        })
    })
  }
}

export default Spotify;