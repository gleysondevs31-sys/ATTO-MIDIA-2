import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require("axios");

const videoQuality = ["1080", "720", "480", "360", "144"];
const audioQuality = ["128", "320"];

async function ddownr(url, type, format) {
  try {
    const mode = ["mp3", "mp4"];
    if (!mode.includes(type))
      return { status: 400, message: `Format Video Tersedia: ${mode.join(", ")}` };

    if (type === "mp4" && !videoQuality.includes(format))
      return { status: 400, message: `Format Video Tersedia: ${videoQuality.join(", ")}` };

    if (type === "mp3" && !audioQuality.includes(format))
      return { status: 400, message: `Format Video Tersedia: ${audioQuality.join(", ")}` };

    const params =
      type === "mp3"
        ? { copyright: "0", format: type, audio_quality: format, url, api: "dfcb6d76f2f6a9894gjkege8a4ab232222" }
        : { copyright: "0", format: format, url, api: "dfcb6d76f2f6a9894gjkege8a4ab232222" };

    const { data: metadata } = await axios.get(
      "https://p.lbserver.xyz/ajax/download.php",
      { params }
    );

    let progress = 0;
    let json;

    return await new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const res = await axios.get(metadata?.progress_url);
          json = res.data;
          progress = json?.progress || progress;

          if (progress >= 1000) {
            console.log("✅ Process selesai");
            return resolve({
              status: 200,
              metadata: {
                title: metadata.title,
                image: metadata.info.image,
              },
              download: json.download_url,
              alternatif: json.alternative_download_urls || [],
            });
          }
        } catch (err) {
          console.error("Error:", err.message);
        }

        setTimeout(poll, 40);
      };

      poll();
    });
  } catch (e) {
    console.error(e);
    return { status: 500, message: e.message };
  }
}

// Exemplo de uso
///ddownr("https://youtube.com/watch?v=AwHUdt5FPu4", "mp3", "128")
//  .then(result => console.log(result))
//  .catch(err => console.error(err));

export default ddownr;