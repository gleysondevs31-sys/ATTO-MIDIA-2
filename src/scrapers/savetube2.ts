import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');
const crypto = require('crypto');

const savetube2 = {
  api: {
    base: 'https://media.savetube.me/api',
    cdn: '/random-cdn',
    info: '/v2/info',
    download: '/download'
  },
  headers: {
    'accept': '*/*',
    'content-type': 'application/json',
    'origin': 'https://yt.savetube.me',
    'referer': 'https://yt.savetube.me/',
    'user-agent': 'Postify/1.0.0'
  },
  formats: ['144', '240', '360', '480', '720', '1080', 'mp3'],
  crypto: {
    hexToBuffer: (hexString) => {
      try {
        const matches = hexString.match(/.{1,2}/g);
        if (!matches) throw new Error('Invalid hex string');
        return Buffer.from(matches.join(''), 'hex');
      } catch (error) {
        throw new Error(`Failed to convert hex to buffer: ${error.message}`);
      }
    },
    decrypt: async (enc) => {
      try {
        if (!enc) throw new Error('No encrypted data provided');
        const secretKey = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
        const data = Buffer.from(enc, 'base64');
        if (data.length < 16) throw new Error('Invalid encrypted data');
        const iv = data.slice(0, 16);
        const content = data.slice(16);
        const key = savetube2.crypto.hexToBuffer(secretKey);
        const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        let decrypted = decipher.update(content);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return JSON.parse(decrypted.toString());
      } catch (error) {
        throw new Error(`Decryption failed: ${error.message}`);
      }
    }
  },
  youtube: (url) => {
    if (!url) return null;
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  },
  request: async (endpoint, data = {}, method = 'post') => {
    try {
      const response = await axios({
        method,
        url: `${endpoint.startsWith('http') ? '' : savetube2.api.base}${endpoint}`,
        data: method === 'post' ? data : undefined,
        params: method === 'get' ? data : undefined,
        headers: savetube2.headers
      });
      if (response.status >= 400) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      return {
        status: true,
        code: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        status: false,
        code: error.response?.status || 500,
        error: `Request failed: ${error.message}`
      };
    }
  },
  getCDN: async () => {
    const response = await savetube2.request(savetube2.api.cdn, {}, 'get');
    if (!response.status || !response.data?.cdn) {
      return {
        status: false,
        code: response.code || 500,
        error: 'Failed to retrieve CDN'
      };
    }
    return {
      status: true,
      code: 200,
      data: response.data.cdn
    };
  },
  download: async (link, format) => {
    if (!link) {
      return {
        status: false,
        code: 400,
        error: 'No link provided'
      };
    }
    if (!format || !savetube2.formats.includes(format)) {
      return {
        status: false,
        code: 400,
        error: `Invalid format. Available formats: ${savetube2.formats.join(', ')}`
      };
    }
    const id = savetube2.youtube(link);
    if (!id) {
      return {
        status: false,
        code: 400,
        error: 'Invalid YouTube link'
      };
    }
    try {
      const cdnx = await savetube2.getCDN();
      if (!cdnx.status) return cdnx;
      const cdn = cdnx.data;
      const info = await savetube2.request(`https://${cdn}${savetube2.api.info}`, {
        url: `https://www.youtube.com/watch?v=${id}`
      });
      if (!info.status) return info;
      const decrypted = await savetube2.crypto.decrypt(info.data.data);
      const dl = await savetube2.request(`https://${cdn}${savetube2.api.download}`, {
        id,
        downloadType: format === 'mp3' ? 'audio' : 'video',
        quality: format === 'mp3' ? '128' : format,
        key: decrypted.key
      });
      if (!dl.status || !dl.data?.data?.downloadUrl) {
        return {
          status: false,
          code: dl.code || 500,
          error: 'Failed to retrieve download URL'
        };
      }
      return {
        status: true,
        code: 200,
        result: {
          title: decrypted.title || 'Unknown',
          type: format === 'mp3' ? 'audio' : 'video',
          format,
          thumbnail: decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/0.jpg`,
          download: dl.data.data.downloadUrl,
          id,
          key: decrypted.key,
          duration: decrypted.duration || 'Unknown',
          quality: format === 'mp3' ? '128' : format,
          downloaded: dl.data.data.downloaded || false
        }
      };
    } catch (error) {
      return {
        status: false,
        code: 500,
        error: `Download failed: ${error.message}`
      };
    }
  }
};

export default savetube2;