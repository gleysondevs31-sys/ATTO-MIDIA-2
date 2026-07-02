# Zero Two Media Hub 🎬✨

Uma plataforma web moderna, bonita, rápida e de alto desempenho projetada para pesquisar, localizar e reproduzir mídias de redes sociais como **TikTok**, **YouTube**, **Instagram Reels**, **Spotify** e **SoundCloud** integrada à API **Zero Two**.

## 🚀 Visão Geral
O **Zero Two Media Hub** permite que os usuários façam pesquisas textuais ou cole links diretos de mídias de redes sociais para tocar ou assistir em um player nativo embutido, com bypass de CORS/mixed-content e proteção avançada de chaves de API por meio de um proxy reverso embutido em Node.js (Express).

### ✨ Funcionalidades Principais
1. **Busca Unificada**: Pesquisa integrada no Spotify, SoundCloud e TikTok por texto.
2. **Resolução de Links**: Cole qualquer URL do TikTok, Instagram Reels ou YouTube e obtenha as faixas de vídeo/áudio prontas para tocar.
3. **Player Flutuante Moderno**: Suporte a vídeo e áudio HTML5 nativo com controle de volume, progresso, mute e seletor de qualidade para streams do YouTube.
4. **CORS Bypass Proxy**: Retransmissão automática de fluxos protegidos por CORS ou políticas de hotlink (como SoundCloud/TikTok) diretamente através do servidor proxy.
5. **Painel de Histórico**: Mantém o histórico das últimas 10 pesquisas da sessão localmente.
6. **Design Dark Elegante**: Visual focado em aplicativos de streaming, utilizando a paleta de cores característica da Zero Two (Slate-Dark e Pink Neon) com fontes customizadas (*Space Grotesk* e *Inter*).

---

## 🛠️ Stack Tecnológica
* **Frontend**: React 19 + Vite + TypeScript (com Lucide Icons e Motion)
* **Estilização**: Tailwind CSS v4 (com variáveis de tema personalizadas e tipografia avançada)
* **Backend Proxy**: Node.js + Express (rodando com `tsx` em desenvolvimento e empacotado para CommonJS com `esbuild` em produção)
* **Requisições**: Fetch API nativa unificada

---

## 🔑 Segurança e Proteção de Chaves de API
Por regras de segurança de nível de produção, a chave de API `onnx-ia-key` **nunca** é exposta ao navegador do usuário final. 

* O frontend fala exclusivamente com rotas locais sob o prefixo `/api/*`.
* O backend proxy Express intercepta essas requisições, anexa com segurança a chave de API `onnx-ia-key` nos parâmetros e repassa para os servidores reais da Zero Two.
* Retornos de erros, payloads brutos e status HTTP são tratados centralmente no servidor, protegendo o seu saldo e cota da API.

---

## 🗺️ Endpoints da API Zero Two Utilizados
O proxy backend consome diretamente os seguintes endpoints oficiais descritos em `https://zero-two-apis.store/docs`:

1. **Busca Spotify**: `/api/spotify/search` (Query: `q`, `type=track`, `limit=15`)
2. **Busca SoundCloud**: `/api/soundcloud/search` (Query: `query`)
3. **Busca TikTok (Username/Tags)**: `/download/tiktoksearch` (Query: `username`)
4. **Resolução de Links Multiplataforma**: `/api/dl/multidl` (Query: `url` para TikTok, Instagram Reels, YouTube e Facebook)

---

## ⚙️ Configuração e Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto (copiado a partir de `.env.example`):

```env
# URL de host do Applet (Injetado pelo AI Studio)
APP_URL="http://localhost:3000"

# Credenciais oficiais da Zero Two API
ZERO_TWO_API_KEY="onnx-ia-key"
ZERO_TWO_API_BASE_URL="https://zero-two-apis.store"
```

---

## 💻 Como Executar o Projeto

### Pré-requisitos
* Node.js v18 ou superior instalado.

### 1. Instalar as Dependências
Caso as dependências ainda não estejam prontas, execute no terminal:
```bash
npm install
```

### 2. Rodar em Modo de Desenvolvimento (Frontend + Backend Proxy)
O servidor Express será iniciado na porta `3000` executando a middleware do Vite sob o mesmo processo, o que resolve qualquer problema de CORS local.
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

### 3. Build para Produção
Compila os ativos estáticos do React na pasta `/dist` e empacota o servidor TypeScript em um único arquivo CommonJS ultra-otimizado (`dist/server.cjs`) usando `esbuild`:
```bash
npm run build
```

### 4. Iniciar em Produção
Inicia o aplicativo completo em modo de produção otimizado:
```bash
npm run start
```

---

## ⚠️ Limitações Conhecidas
1. **Vídeos Privados/Restritos**: Mídias protegidas por direitos autorais ou restrições de idade no YouTube podem apresentar falhas de resolução automática pelo scraper da API Zero Two.
2. **SoundCloud HLS**: Certos streams do SoundCloud retornam como listas de reprodução HLS (`.m3u8`). Nestes casos, o player executa a retransmissão de proxy ou indica o botão de "Abrir no site original" para garantir a audição.
3. **Instagram Reels Privados**: A API Zero Two só consegue resolver links de publicações ou Reels públicos. Perfis privados retornarão status `404` ou `Nenhuma mídia encontrada`.
