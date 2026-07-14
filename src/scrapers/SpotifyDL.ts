import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require("axios");

class SpotifyDL {
  constructor() {
    this.clientID = 'acc6302297e040aeb6e4ac1fbdfd62c3';
    this.clientSecret = '0e8439a1280a43aba9a5bc0a16f3f009';
    this.basic = Buffer.from(`${this.clientID}:${this.clientSecret}`).toString("base64");
    this.tokenEndpoint = 'https://accounts.spotify.com/api/token';
  }

  async spotifyCreds() {
    const response = await axios.post(
      this.tokenEndpoint,
      'grant_type=client_credentials',
      {
        headers: { Authorization: 'Basic ' + this.basic }
      }
    )
    return response.data
  }

  async toTime(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
  }

  // 🎶 PLAYLIST
  async playlist(url) {
    const playlistId = url.match(/playlist\/([a-zA-Z0-9]+)/)?.[1]
    if (!playlistId)
      throw 'Erro! URL não pertence a uma Playlist do Spotify.'

    const creds = await this.spotifyCreds()
    const token = creds.access_token

    let offset = 0
    let limit = 100
    let tracks = []

    while (true) {
      const { data } = await axios.get(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (!data.items.length) break

      for (const item of data.items) {
        if (!item.track) continue

        tracks.push({
          name: item.track.name,
          artists: item.track.artists.map(a => a.name).join(', '),
          duration: await this.toTime(item.track.duration_ms),
          explicit: item.track.explicit,
          popularity: item.track.popularity,
          album: {
            name: item.track.album.name,
            release_date: item.track.album.release_date,
            images: item.track.album.images.map(i => i.url)
          },
          url: item.track.external_urls.spotify
        })
      }

      offset += limit
    }

    return {
      playlist_id: playlistId,
      total: tracks.length,
      tracks
    }
  }

  // 🔽 DOWNLOAD TRACK
  async downloadTrack(url) {
    const regex = /^https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)(?:\?.*)?$/
    if (!url.match(regex))
      throw 'Erro! Este URL não pertence a um Track do Spotify.'

    const spotifyDown = await axios.post(
      'https://parsevideoapi.videosolo.com/spotify-api/',
      {
        format: 'web',
        url: 'https://open.spotify.com/track/' + url.match(regex)[1]
      },
      {
        headers: {
          'User-Agent': 'Postify/1.0.0',
          'Referer': 'https://spotidown.online/',
          'Origin': 'https://spotidown.online'
        }
      }
    )

    if (spotifyDown.data.status === "-4")
      throw 'URL inválido, apenas Track é aceito.'

    const meta = spotifyDown.data.data.metadata

    return {
      dl_link: meta.download,
      albumName: meta.album,
      imageUrl: meta.image,
      duration: await this.toTime(meta.duration),
      trackName: meta.name,
      artistName: meta.artist
    }
  }
}

export default SpotifyDL