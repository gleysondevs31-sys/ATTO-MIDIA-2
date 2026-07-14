import { createRequire } from 'module';
const require = createRequire(import.meta.url);
/**
 * Copilot2 — Microsoft Copilot
 * Dep.: npm i ws axios
 */

export default {
  name: 'Microsoft Copilot2',
  path: '/api/copilot2',
  type: 'get',
  description: 'Chat com o Microsoft Copilot (WebSocket v2).',
  tags: 'IA',
  params: { 
    text: 'Pergunta obrigatória', 
    model: 'default | think-deeper | gpt-5 (opcional, padrão: default)' 
  },
  hidden: false,
  isDisable: false,

  code: async (req, res) => {
    try {
      if (module.exports.isDisable) return res.json({ status: false, msg: 'Rota em manutenção' });

      const text = (req.query.text || '').toString().trim();
      const modelReq = (req.query.model || 'default').toString().trim().toLowerCase();

      if (!text) return res.status(400).json({ status: false, error: 'Parâmetro ?text= é obrigatório' });

      const axios = require('axios');
      const WebSocket = require('ws');

      const MODELS = { default: 'chat', 'think-deeper': 'reasoning', 'gpt-5': 'smart' };
      if (!MODELS[modelReq]) return res.status(400).json({ status: false, error: `Modelo inválido. Use: ${Object.keys(MODELS).join(', ')}` });

      const HEADERS = {
        origin: 'https://copilot.microsoft.com',
        'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
        'accept': '*/*',
        'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'sec-ch-ua': '"Chromium";v="130", "Android WebView";v="130", "Not=A?Brand";v="99"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"'
      };

      const convRes = await axios.post('https://copilot.microsoft.com/c/api/conversations', null, { headers: HEADERS, timeout: 10000 });
      const conversationId = convRes?.data?.id;
      if (!conversationId) return res.status(502).json({ status: false, error: 'Falha ao iniciar conversa com Copilot' });

      const wsUrl = 'wss://copilot.microsoft.com/c/api/chat?api-version=2&features=-,ncedge,edgepagecontext&setflight=-,ncedge,edgepagecontext&ncedge=1';

      const result = await new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl, { headers: HEADERS });
        const out = { text: '', citations: [] };
        let done = false;

        const kill = setTimeout(() => {
          if (!done) { done = true; ws.terminate(); reject(new Error('timeout')); }
        }, 120000);

        ws.on('open', () => {
          ws.send(JSON.stringify({
            event: 'setOptions',
            supportedFeatures: ['partial-generated-images'],
            supportedCards: ['weather','local','image','sports','video','ads','safetyHelpline','quiz','finance','recipe'],
            ads: { supportedTypes: ['text','product','multimedia','tourActivity','propertyPromotion'] }
          }));
          ws.send(JSON.stringify({
            event: 'send',
            mode: MODELS[modelReq],
            conversationId,
            content: [{ type: 'text', text }],
            context: {}
          }));
        });

        ws.on('message', (data) => {
          let msg;
          try { msg = JSON.parse(data.toString()); } catch { return; }

          if (msg.event === 'appendText') out.text += msg.text || '';
          else if (msg.event === 'citation') out.citations.push({ title: msg.title, icon: msg.iconUrl || null, url: msg.url });
          else if (msg.event === 'done' || msg.event === 'suggestedFollowups') {
            if (!done) { done = true; clearTimeout(kill); ws.close(); resolve(out); }
          } else if (msg.event === 'error') {
            if (!done) { done = true; clearTimeout(kill); ws.close(); reject(new Error(msg.message || 'erro ws')); }
          }
        });

        ws.on('error', (e) => { if (!done) { done = true; clearTimeout(kill); reject(e); } });
        ws.on('close', () => { if (!done) { done = true; clearTimeout(kill); resolve(out); } });
      });

      res.json({
        status: true,
        creator: '@paulo_mod_domina',
        model: modelReq,
        conversationId,
        result: result.text.trim(),
        citations: result.citations
      });

    } catch (e) {
      const msg = e.message || String(e);
      res.status(500).json({ status: false, error: msg.includes('timeout') ? 'Timeout ao conectar com Copilot' : msg });
    }
  }
};