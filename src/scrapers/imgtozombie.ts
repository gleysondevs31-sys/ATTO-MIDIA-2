import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');
const FormData = require('form-data');

async function toZombie(imageUrl) {
    let { data } = await axios.get(imageUrl, { responseType: "arraybuffer" });
    let formData = new FormData();
    formData.append("photofile", data, { filename: "image.jpg" });
    formData.append("action", "upload");
    let { data: uploadResponse } = await axios.post("https://makemezombie.com/response.php", formData, {
        headers: formData.getHeaders(),
    });
    let key = uploadResponse.key;
    let result;
    let tentativas = 0;
    while (tentativas < 10) {
        let checkData = new FormData();
        checkData.append("action", "check");
        checkData.append("image_id", key);
        let res = await axios.post("https://makemezombie.com/response.php", checkData, {
            headers: checkData.getHeaders(),
        });
        if (res.data && res.data.ready == "1") {
            result = res.data;
            break;
        }
        tentativas++;
        await new Promise(res => setTimeout(res, 1000));
    }
    if (!result) {
        throw new Error("Imagem não ficou pronta depois de várias tentativas.");
    }
    let finalImageUrl = result;
    return finalImageUrl;
}

export default toZombie;

//toZombie("https://files.catbox.moe/xx3mk4.png").then(console.log).catch(console.error);
  
 