import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require("axios")
const { randomUUID } = require("crypto")

function rnd() {
  return Math.floor(Math.random() * 1e17)
}

function rndHex() {
  return Math.floor(Math.random() * 1e17).toString(16)
}

function randomStr() {
  return Math.random().toString(36).slice(2)
}

function formatCici(text) {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{2,}/g, " ")
    .replace(/([.!?])\s*/g, "$1 ")
    .trim()
}

async function ciciScraper(question) {
  if (!question) throw new Error("Question is required")

  const random = rnd()
  const cdid = "2" + rndHex().padStart(23, "0")
  const uid = rnd()
  const iid = rnd()
  const device_id = rnd()

  const { data } = await axios.post(
    "https://api-normal-i18n.ciciai.com/im/sse/send/message",
    {
      channel: 3,
      cmd: 100,
      sequence_id: randomUUID(),
      uplink_body: {
        send_message_body: {
          ack_only: false,
          bot_id: "7241547611541340167",
          bot_type: 1,
          content: JSON.stringify({
            im_cmd: -1,
            text: question
          }),
          content_type: 1,
          conversation_id: "485805516280081",
          conversation_type: 3,
          create_time: Math.floor(Date.now() / 1000),
          ext: {
            create_time_ms: Date.now().toString(),
            answer_with_suggest: "1",
            system_language: "en",
            need_net_search: "0",
            send_message_scene: "keyboard"
          },
          local_message_id: rndHex(),
          sender_id: "7584067883349640200",
          unique_key: rndHex()
        }
      },
      version: "1"
    },
    {
      responseType: "text",
      params: {
        device_platform: "android",
        os: "android",
        _rticket: random,
        cdid,
        channel: "googleplay",
        aid: "489823",
        app_name: "nova_ai",
        version_code: rnd(),
        version_name: randomStr(),
        resolution: `${rnd() % 1000}x${rnd() % 1000}`,
        uid,
        iid,
        device_id,
        language: "en",
        region: "US"
      },
      headers: {
        "Content-Type": "application/json; encoding=utf-8",
        "User-Agent": "com.larus.wolf/8090004 (Linux; Android 12)",
        "X-Tt-Token":
          "0329aceacb51f4b2d468e8709307dcc44604a72f48ba71143b3403209f8f98cf37f4111f4fe8bac693d57dd0580c0e13a32d8d230813a3064feaf53b9d8fd9e5ae0256d50c4b29427687873645bd92d3b842a-1.0.0"
      }
    }
  )

  const parts = []
  const regex = /"origin_content"\s*:\s*"([^"]*)"/g
  let match

  while ((match = regex.exec(data))) {
    parts.push(match[1])
  }

  const chat = parts.join("")
  if (!chat) throw new Error("CICI não retornou resposta")

  return formatCici(chat)
}

export default {
  ciciScraper
}