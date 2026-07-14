import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require("axios");
const cheerio = require("cheerio");
const FormData = require("form-data");

async function pindl(link) {
    const form = new FormData();
    form.append("url", link);

    const result = {
        status: 200,
        data: {
            creator: "Fruatre Maou",
            platform: "Pinterest",
            source: link,
            type: "video",
            video_url: ""
        }
    };

    const { data } = await axios({
        url: "https://pinterestvideodownloader.com/download.php",
        method: "POST",
        headers: {
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": "_ga=GA1.2.431955486.1718265710; _gid=GA1.2.1691914427.1718265710",
            "Origin": "https://pinterestvideodownloader.com",
            "Referer": "https://pinterestvideodownloader.com/id/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        },
        data: form
    });

    const $ = cheerio.load(data);
    const videoSrc = $("div.col-sm-12 > video").attr("src");
    result.data.video_url = videoSrc || null;

    return result;
}

export default pindl;