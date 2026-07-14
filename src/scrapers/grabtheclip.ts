import { createRequire } from 'module';
const require = createRequire(import.meta.url);
//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Va6riekH5JLwLUFI7P2B

const axios = require('axios')

class GrabTheClip {
constructor() {
this.headers = {
'Content-Type': 'application/json',
'Origin': 'https://www.grabtheclip.com',
'Referer': 'https://www.grabtheclip.com/',
'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
};
this.base = 'https://api.grabtheclip.com';
this.creator = '@paulo_mod_domina';
}
delay(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}

async getInfo(url) {
const { data: reqInfo } = await axios.post(`${this.base}/submit-info`,
{ url },
{ headers: this.headers }
);
let info = await axios.get(`${this.base}/get-info/${reqInfo.task_id}`,
{ headers: this.headers }
);
while (info.data.status === 'Pending') {
await this.delay(500);
info = await axios.get(`${this.base}/get-info/${reqInfo.task_id}`,
{ headers: this.headers }
);
}
return info.data.result;
}

async getVideo(url, height = 360) {
const { data: reqDown } = await axios.post(`${this.base}/submit-download`,
{ height, media_type: 'video', url },
{ headers: this.headers }
);
let down = await axios.get(`${this.base}/get-download/${reqDown.task_id}`,
{ headers: this.headers }
);
while (down.data.status === 'Pending') {
await this.delay(500);
down = await axios.get(`${this.base}/get-download/${reqDown.task_id}`,
{ headers: this.headers }
);
}
return down.data.result;
}

async getAudio(url) {
const { data: reqDown } = await axios.post(`${this.base}/submit-download`,
{ height: 0, media_type: 'audio', url },
{ headers: this.headers }
);
let down = await axios.get(`${this.base}/get-download/${reqDown.task_id}`,
{ headers: this.headers }
);
while (down.data.status === 'Pending') {
await this.delay(500);
down = await axios.get(`${this.base}/get-download/${reqDown.task_id}`,
{ headers: this.headers }
);
}
return down.data.result;
}

/**
 * Executa todas as tarefas e retorna o objeto no formato desejado
 */
async fetchAll(url) {
const [info, video360, video720, audio] = await Promise.all([
this.getInfo(url),
this.getVideo(url, 360),
this.getVideo(url, 720),
this.getAudio(url)
]);
return {
status: true,
criador: this.creator,
resultados: {
info,
video360,
video720,
audio
}
};
}
}

export default GrabTheClip