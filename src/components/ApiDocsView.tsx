import React, { useState, useEffect } from "react";
import { Code2, Key, Copy, Check, RefreshCw, Search, Download, ExternalLink, Lock, Terminal, BookOpen, Layers, Globe, Eye, EyeOff, Sparkles, Server, HelpCircle, ArrowRight } from "lucide-react";

interface ApiDocsViewProps {
  user: any;
  token: string | null;
  onOpenAuth: () => void;
}

export function ApiDocsView({ user, token, onOpenAuth }: ApiDocsViewProps) {
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [isLoadingKey, setIsLoadingKey] = useState<boolean>(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Playground - Search State
  const [searchQuery, setSearchQuery] = useState<string>("lofi hip hop");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [copiedSearchCurl, setCopiedSearchCurl] = useState<boolean>(false);

  // Playground - Download State
  const [downloadUrl, setDownloadUrl] = useState<string>("https://www.youtube.com/watch?v=jfKfPfyJRdk");
  const [downloadType, setDownloadType] = useState<"audio" | "video">("audio");
  const [copiedDownloadUrl, setCopiedDownloadUrl] = useState<boolean>(false);

  // Snippets Language Tab
  const [activeLang, setActiveLang] = useState<"curl" | "javascript" | "python">("curl");

  // Fetch API Key if user is logged in
  const fetchApiKey = async (silent = false) => {
    if (!token) return;
    if (!silent) setIsLoadingKey(true);
    setKeyError(null);
    try {
      const res = await fetch("/api/user/api-key", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error("Falha ao carregar chave de API");
      }
      const data = await res.json();
      if (data.status && data.apiKey) {
        setApiKey(data.apiKey);
      }
    } catch (err: any) {
      setKeyError(err.message || "Erro ao obter chave de API.");
    } finally {
      if (!silent) setIsLoadingKey(false);
    }
  };

  const regenerateApiKey = async () => {
    if (!token) return;
    if (!window.confirm("Atenção! Sua chave de API atual deixará de funcionar imediatamente. Deseja realmente gerar uma nova chave?")) return;
    
    setIsLoadingKey(true);
    setKeyError(null);
    try {
      const res = await fetch("/api/user/api-key/regenerate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error("Falha ao regenerar chave de API");
      }
      const data = await res.json();
      if (data.status && data.apiKey) {
        setApiKey(data.apiKey);
        setShowApiKey(true);
      }
    } catch (err: any) {
      setKeyError(err.message || "Erro ao regenerar.");
    } finally {
      setIsLoadingKey(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchApiKey();
    }
  }, [user, token]);

  // Execute Search Test
  const handleTestSearch = async () => {
    if (!apiKey) {
      setSearchError("Você precisa de uma chave de API ativa para testar o playground.");
      return;
    }
    setIsSearching(true);
    setSearchResult(null);
    setSearchError(null);
    try {
      const res = await fetch(`/api/v1/search?apikey=${apiKey}&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro na busca");
      }
      setSearchResult(data);
    } catch (err: any) {
      setSearchError(err.message || "Erro ao realizar busca no playground.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getFullDownloadApiUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const keyToUse = apiKey || "SUA_API_KEY";
    return `${origin}/api/v1/download?apikey=${keyToUse}&type=${downloadType}&url=${encodeURIComponent(downloadUrl)}`;
  };

  const getFullSearchApiUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const keyToUse = apiKey || "SUA_API_KEY";
    return `${origin}/api/v1/search?apikey=${keyToUse}&q=${encodeURIComponent(searchQuery)}`;
  };

  const copyToClipboard = (text: string, callbackSetter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    callbackSetter(true);
    setTimeout(() => callbackSetter(false), 2000);
  };

  // Code snippets generator based on active params
  const getCodeSnippet = (endpointType: "search" | "download") => {
    const keyToUse = apiKey || "SUA_API_KEY";
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    
    if (endpointType === "search") {
      const fullUrl = `${origin}/api/v1/search?apikey=${keyToUse}&q=${encodeURIComponent(searchQuery)}`;
      if (activeLang === "curl") {
        return `curl -X GET "${fullUrl}"`;
      } else if (activeLang === "javascript") {
        return `// Busca de mídias no YouTube\nfetch("${fullUrl}")\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));`;
      } else {
        return `import requests\n\n# Busca de mídias no YouTube\nurl = "${origin}/api/v1/search"\nparams = {\n    "apikey": "${keyToUse}",\n    "q": "${searchQuery}"\n}\n\nresponse = requests.get(url, params=params)\ndata = response.json()\nprint(data)`;
      }
    } else {
      const fullUrl = `${origin}/api/v1/download?apikey=${keyToUse}&type=${downloadType}&url=${encodeURIComponent(downloadUrl)}`;
      if (activeLang === "curl") {
        return `curl -o "media.${downloadType === "audio" ? "mp3" : "mp4"}" -L "${fullUrl}"`;
      } else if (activeLang === "javascript") {
        return `// Baixar arquivo diretamente via Stream de dados\nconst downloadUrl = "${fullUrl}";\n\n// Em Node.js:\nconst fs = require('fs');\nconst https = require('https');\n\nconst file = fs.createWriteStream("media.${downloadType === "audio" ? "mp3" : "mp4"}");\nhttps.get(downloadUrl, (response) => {\n  response.pipe(file);\n  console.log("Download iniciado!");\n});`;
      } else {
        return `import requests\n\n# Baixar arquivo via streaming de dados no Python\nurl = "${fullUrl}"\n\nprint("Iniciando download...")\nwith requests.get(url, stream=True) as r:\n    r.raise_for_status()\n    with open("media.${downloadType === "audio" ? "mp3" : "mp4"}", "wb") as f:\n        for chunk in r.iter_content(chunk_size=8192):\n            f.write(chunk)\nprint("Download concluído com sucesso!")`;
      }
    }
  };

  return (
    <div id="api-docs-container" className="space-y-8 pb-16">
      {/* Visual Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-950/45 to-zinc-900 border border-emerald-500/10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-3 text-center md:text-left z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-bold text-emerald-400 rounded-full uppercase tracking-wider">
            <Code2 className="w-3.5 h-3.5" /> API DE DESENVOLVEDORES v1
          </span>
          <h2 className="text-2xl md:text-3.5xl font-display font-black tracking-tight text-white">
            Integre Downloads ao seu App
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
            Utilize nosso robusto mecanismo <code className="text-emerald-400 font-mono bg-emerald-500/5 px-1.5 py-0.5 rounded">playEngine</code> via endpoints HTTPS de alta velocidade para buscar, reproduzir e baixar mídias do YouTube programaticamente.
          </p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-pulse shrink-0">
          <Server className="w-7 h-7" />
        </div>
      </div>

      {/* Grid: Auth/Key Manager and General Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Credentials manager */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#111111]/80 border border-white/5 rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
              <Key className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Sua Credencial de Acesso</h3>
                <p className="text-[10px] text-zinc-500 font-mono">Use esta chave para autenticar todas as requisições à API</p>
              </div>
            </div>

            {!user ? (
              <div className="py-8 px-4 flex flex-col items-center text-center space-y-4">
                <Lock className="w-10 h-10 text-zinc-600" />
                <div className="space-y-1">
                  <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">Autenticação Requerida</p>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    Você precisa estar logado para visualizar, criar e regenerar suas chaves de API pessoais do ATTO Downloads.
                  </p>
                </div>
                <button
                  onClick={onOpenAuth}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold font-mono text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Entrar ou Cadastrar-se
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {isLoadingKey ? (
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 py-4">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Carregando chave de API...</span>
                  </div>
                ) : keyError ? (
                  <div className="p-4 bg-red-500/15 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono">
                    {keyError}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={apiKey || "Nenhuma chave gerada"}
                          readOnly
                          className="w-full pl-4 pr-10 py-3 bg-[#080808] border border-white/5 focus:outline-none rounded-xl text-xs font-mono text-emerald-400 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyKey}
                          disabled={!apiKey}
                          className="p-3 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all cursor-pointer border border-zinc-700/30 flex items-center justify-center disabled:opacity-50"
                          title="Copiar API Key"
                        >
                          {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={regenerateApiKey}
                          className="px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/30 hover:border-zinc-500/50 text-zinc-300 font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                          title="Gerar Nova Chave"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Regenerar</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5 space-y-2">
                      <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Limites de Requisições
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                        Seu plano atual é <b className="text-primary uppercase font-bold">{user.plan || "Free"}</b>. 
                        Usuários gratuitos contam com limite de <span className="text-white font-bold">10 requisições/minuto</span>. Adquira planos Premium no menu de Planos para usufruir de requisições ilimitadas e maior velocidade de streaming sem throttling.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Specs overview info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#111111]/80 border border-white/5 rounded-2xl p-6 shadow-md space-y-4">
            <h3 className="font-mono font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-400" /> Detalhes Gerais
            </h3>
            <ul className="space-y-3 text-xs font-mono text-zinc-400">
              <li className="flex items-center justify-between border-b border-white/5 pb-2">
                <span>Versão API</span>
                <span className="text-white font-bold">v1.0.0</span>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-2">
                <span>Protocolo</span>
                <span className="text-white font-bold">HTTPS (TLS 1.3)</span>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-2">
                <span>Formato Resposta</span>
                <span className="text-white font-bold">JSON / Binary Stream</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Suporte CORS</span>
                <span className="text-emerald-400 font-bold">Sim (Access-Control-*)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* API Reference & Playground Area */}
      <div className="space-y-6">
        <h3 className="text-base font-display font-extrabold text-white flex items-center gap-2 pt-4">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          Endpoints & Playground de Testes
        </h3>

        {/* ENDPOINT 1: Search YouTube */}
        <div className="bg-[#111111]/80 border border-white/5 rounded-2xl overflow-hidden shadow-md">
          <div className="p-5 bg-zinc-900/45 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono font-bold text-emerald-400 rounded-lg">
                GET
              </span>
              <span className="font-mono text-xs text-zinc-300 font-bold">
                /api/v1/search
              </span>
              <span className="text-zinc-500 text-xs hidden sm:inline">&mdash;</span>
              <span className="text-xs text-zinc-400">Pesquisa vídeos e músicas no YouTube</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Autenticado: apikey
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Input params Form */}
            <div className="xl:col-span-5 space-y-4">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Parâmetros</h4>
              
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 font-bold">apikey <span className="text-rose-500">*</span></span>
                    <span className="text-zinc-500">Query string / Header</span>
                  </div>
                  <input
                    type="text"
                    value={apiKey ? "•".repeat(24) + " (Sua Chave)" : "Faça login para preencher"}
                    readOnly
                    placeholder="Sua chave de API"
                    className="w-full px-3.5 py-2.5 bg-[#080808] border border-white/5 rounded-xl text-xs font-mono text-zinc-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 font-bold">q <span className="text-rose-500">*</span></span>
                    <span className="text-zinc-500">Termo ou palavra-chave</span>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ex: lofi hip hop"
                    className="w-full px-3.5 py-2.5 bg-[#080808] border border-white/5 focus:border-emerald-500/20 focus:outline-none rounded-xl text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleTestSearch}
                  disabled={isSearching || !apiKey}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>{isSearching ? "Buscando..." : "Testar Playground"}</span>
                </button>
              </div>
            </div>

            {/* Response Viewer & Snippets */}
            <div className="xl:col-span-7 flex flex-col h-full min-h-[300px]">
              {/* Language selection tab */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-mono font-bold text-zinc-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-zinc-500" /> Exemplo de Integração
                </span>
                
                <div className="flex items-center gap-1.5">
                  {(["curl", "javascript", "python"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg uppercase tracking-wider border transition-all cursor-pointer ${
                        activeLang === lang
                          ? "bg-zinc-800 border-zinc-700 text-white"
                          : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display code codeblock */}
              <div className="relative group/snippet mb-4">
                <pre className="p-4 bg-[#050505] border border-white/5 rounded-xl text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">
                  {getCodeSnippet("search")}
                </pre>
                <button
                  onClick={() => copyToClipboard(getCodeSnippet("search"), setCopiedSearchCurl)}
                  className="absolute right-3 top-3 p-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all border border-white/5 opacity-0 group-hover/snippet:opacity-100 cursor-pointer"
                  title="Copiar Código"
                >
                  {copiedSearchCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Live JSON output placeholder */}
              <div className="flex-1 flex flex-col bg-[#050505] border border-white/5 rounded-xl p-4 overflow-hidden">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-b border-white/5 pb-2 mb-2 select-none">
                  <span>RESPOSTA DO SERVIDOR (JSON)</span>
                  {searchResult && <span className="text-emerald-400 font-bold">STATUS 200 OK</span>}
                </div>
                
                <div className="flex-1 overflow-y-auto max-h-[160px] text-[10px] font-mono text-zinc-400 select-text scrollbar-thin">
                  {searchError ? (
                    <div className="text-red-400 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                      {searchError}
                    </div>
                  ) : searchResult ? (
                    <pre className="text-emerald-400 leading-normal">
                      {JSON.stringify(searchResult, null, 2)}
                    </pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center select-none py-4">
                      <Code2 className="w-8 h-8 mb-2 text-zinc-800" />
                      <p>Clique em "Testar Playground" para realizar a consulta real.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ENDPOINT 2: Direct download Stream */}
        <div className="bg-[#111111]/80 border border-white/5 rounded-2xl overflow-hidden shadow-md">
          <div className="p-5 bg-zinc-900/45 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono font-bold text-amber-400 rounded-lg">
                GET
              </span>
              <span className="font-mono text-xs text-zinc-300 font-bold">
                /api/v1/download
              </span>
              <span className="text-zinc-500 text-xs hidden sm:inline">&mdash;</span>
              <span className="text-xs text-zinc-400">Pipa e transmite o stream de mídia (MP3 ou MP4) diretamente</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Autenticado: apikey
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Input Form params */}
            <div className="xl:col-span-5 space-y-4">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Parâmetros</h4>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 font-bold">apikey <span className="text-rose-500">*</span></span>
                    <span className="text-zinc-500">Query string / Header</span>
                  </div>
                  <input
                    type="text"
                    value={apiKey ? "•".repeat(24) + " (Sua Chave)" : "Faça login para preencher"}
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-[#080808] border border-white/5 rounded-xl text-xs font-mono text-zinc-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 font-bold">type <span className="text-rose-500">*</span></span>
                    <span className="text-zinc-500">Formato de saída</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDownloadType("audio")}
                      className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                        downloadType === "audio"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                          : "border-white/5 bg-[#080808] text-zinc-500 hover:text-white"
                      }`}
                    >
                      Áudio (MP3)
                    </button>
                    <button
                      onClick={() => setDownloadType("video")}
                      className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                        downloadType === "video"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                          : "border-white/5 bg-[#080808] text-zinc-500 hover:text-white"
                      }`}
                    >
                      Vídeo (MP4)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 font-bold">url <span className="text-rose-500">*</span></span>
                    <span className="text-zinc-500">URL do YouTube</span>
                  </div>
                  <input
                    type="text"
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    placeholder="Cole um link do YouTube..."
                    className="w-full px-3.5 py-2.5 bg-[#080808] border border-white/5 focus:border-emerald-500/20 focus:outline-none rounded-xl text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Action trigger links */}
              <div className="pt-2">
                <a
                  href={apiKey ? getFullDownloadApiUrl() : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!apiKey) {
                      e.preventDefault();
                      alert("Faça login para carregar sua API key antes de testar o stream.");
                    }
                  }}
                  className={`w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm text-center ${
                    !apiKey ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar via Navegador</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Display snippet code block */}
            <div className="xl:col-span-7 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-zinc-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-zinc-500" /> Código de Download Automatizado
                </span>

                <div className="relative group/download">
                  <pre className="p-4 bg-[#050505] border border-white/5 rounded-xl text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">
                    {getCodeSnippet("download")}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(getCodeSnippet("download"), setCopiedDownloadUrl)}
                    className="absolute right-3 top-3 p-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all border border-white/5 opacity-0 group-hover/download:opacity-100 cursor-pointer"
                    title="Copiar Código"
                  >
                    {copiedDownloadUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="mt-4 p-4.5 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-2">
                <h5 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Como funciona o Piping de Stream?
                </h5>
                <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                  Ao realizar a requisição, nossa API não redireciona ou entrega links de expiração curta. Ela realiza o bypass das restrições de IP de forma nativa e entrega os bytes da mídia sob demanda (<code className="text-white font-mono bg-white/5 px-1 py-0.5 rounded">res.pipe()</code>) diretamente para seu cliente, garantindo estabilidade e permitindo downloads de qualquer lugar do mundo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
