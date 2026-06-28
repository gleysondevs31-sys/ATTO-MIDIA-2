import React, { useState } from "react";
import { 
  Youtube, Music, Play, Instagram, ArrowRight, Download, Check, 
  HelpCircle, Shield, Zap, Sparkles, Link, Star, Flame, RefreshCw
} from "lucide-react";
import { MediaGrid } from "./MediaGrid";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";

interface ProviderDownloaderProps {
  provider: "youtube" | "tiktok" | "instagram" | "spotify" | "soundcloud";
  onSearch: (q: string, isUrl: boolean) => void;
  isLoading: boolean;
  results: any[];
  onPlay: (media: any) => void;
  onSelectDetails: (media: any) => void;
  activeMediaId?: string;
  error: string | null;
}

export function ProviderDownloader({ 
  provider, 
  onSearch, 
  isLoading,
  results = [],
  onPlay,
  onSelectDetails,
  activeMediaId,
  error
}: ProviderDownloaderProps) {
  const [urlInput, setUrlInput] = useState("");

  const providerConfigs = {
    youtube: {
      title: "YouTube Video & MP3 Downloader",
      subtitle: "O melhor concorrente do Y2Mate e SaveTube. Baixe vídeos em MP4 HD e converta para áudio MP3 de alta fidelidade instantaneamente.",
      placeholder: "Cole um link do YouTube aqui (ex: https://www.youtube.com/watch?v=...) ou pesquise por palavras-chave...",
      colorClass: "from-red-500 to-red-600",
      accentBg: "bg-red-500/10 border-red-500/20 text-red-500",
      textAccent: "text-red-500",
      icon: Youtube,
      faq: [
        { q: "Como converter vídeos do YouTube para MP3?", a: "Cole o link do vídeo, clique em 'Baixar' e selecione a opção de extração de Áudio MP3 para processar e baixar em poucos segundos." },
        { q: "Existe limite de tamanho ou quantidade de downloads?", a: "Não! O ATTO YouTube Downloader é 100% ilimitado e gratuito para todos os usuários." }
      ],
      features: ["Conversão MP3 de alta densidade", "Download de vídeos em Full HD 1080p", "Processamento instantâneo via proxy seguro"]
    },
    tiktok: {
      title: "TikTok Downloader Sem Marca d'Água",
      subtitle: "A alternativa perfeita ao TikTokDL e Snaptik. Salve qualquer vídeo do TikTok em formato MP4 limpo, sem marcas d'água no rolo da sua câmera.",
      placeholder: "Cole o link do vídeo do TikTok aqui (ex: https://vm.tiktok.com/...) ou pesquise pelo nome...",
      colorClass: "from-teal-500 to-teal-600",
      accentBg: "bg-teal-500/10 border-teal-500/20 text-teal-500",
      textAccent: "text-teal-500",
      icon: Play,
      faq: [
        { q: "Os vídeos baixados possuem perda de qualidade?", a: "Não, nosso extrator baixa o arquivo MP4 diretamente dos servidores CDN originais do TikTok com a resolução máxima original." },
        { q: "Funciona no celular ou tablet?", a: "Sim! Nosso site é totalmente responsivo e funciona perfeitamente em dispositivos Android e iOS." }
      ],
      features: ["Remoção completa de marca d'água", "Download rápido em formato MP4", "Download de faixas de música em áudio MP3"]
    },
    instagram: {
      title: "Instagram Downloader (Reels, Vídeos & Fotos)",
      subtitle: "O concorrente definitivo do SaveInsta e SnapInsta. Baixe Reels, postagens de vídeo e fotos do Instagram diretamente para o seu aparelho de forma anônima.",
      placeholder: "Cole um link de Reel, Vídeo ou Foto do Instagram aqui...",
      colorClass: "from-pink-500 to-orange-500",
      accentBg: "bg-pink-500/10 border-pink-500/20 text-pink-500",
      textAccent: "text-pink-500",
      icon: Instagram,
      faq: [
        { q: "Posso baixar Reels do Instagram de forma anônima?", a: "Sim, todos os downloads são feitos através dos nossos servidores de proxy e não expõem seu perfil ou dados." },
        { q: "Como obter o link de um post do Instagram?", a: "Abra o aplicativo, clique no botão 'Compartilhar' (ícone de avião de papel) no post e selecione 'Copiar Link'." }
      ],
      features: ["Download de Reels em alta velocidade", "Imagens e fotos na resolução máxima original", "Acesso anônimo e sem anúncios invasivos"]
    },
    spotify: {
      title: "Spotify Music Downloader & Streamer",
      subtitle: "Baixe músicas, faixas e álbuns inteiros do Spotify convertidos diretamente para MP3 em 320kbps de forma totalmente gratuita.",
      placeholder: "Cole o link de uma música ou álbum do Spotify aqui...",
      colorClass: "from-emerald-500 to-emerald-600",
      accentBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
      textAccent: "text-emerald-500",
      icon: Music,
      faq: [
        { q: "As músicas baixadas incluem metadados (capa, título, autor)?", a: "Sim, nosso sistema busca automaticamente todos os metadados e os incorpora diretamente no arquivo MP3 gerado." },
        { q: "É necessário ter uma conta Spotify Premium?", a: "Não! Você não precisa de nenhuma conta premium do Spotify para reproduzir ou baixar músicas usando o ATTO." }
      ],
      features: ["Conversão direta para MP3 320kbps", "Download de capas de álbuns em alta qualidade", "Player interativo com streaming instantâneo"]
    },
    soundcloud: {
      title: "SoundCloud High-Quality Downloader",
      subtitle: "Converta e baixe faixas do SoundCloud em áudio MP3 em alta fidelidade. O melhor concorrente do SCDownloader online.",
      placeholder: "Cole o link de uma faixa ou playlist do SoundCloud aqui...",
      colorClass: "from-orange-500 to-amber-500",
      accentBg: "bg-orange-500/10 border-orange-500/20 text-orange-500",
      textAccent: "text-orange-500",
      icon: Music,
      faq: [
        { q: "Como baixar uma música do SoundCloud?", a: "Copie a URL da faixa no SoundCloud, cole na caixa de busca acima e clique no botão de download para processar." },
        { q: "O download de playlists é suportado?", a: "Atualmente, você pode baixar faixas individuais em alta velocidade. Suporte a playlists completas em breve." }
      ],
      features: ["Áudio nativo em 320kbps ou AAC", "Metadados sincronizados e integrados", "Servidor de proxy dedicado sem limites de rede"]
    }
  };

  const config = providerConfigs[provider];
  const IconComponent = config.icon;

  const handleDownloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryStr = urlInput.trim();
    if (queryStr) {
      const isUrl = queryStr.startsWith("http://") || 
                    queryStr.startsWith("https://") || 
                    queryStr.includes("youtube.com") || 
                    queryStr.includes("youtu.be") || 
                    queryStr.includes("spotify.com") || 
                    queryStr.includes("soundcloud.com") || 
                    queryStr.includes("tiktok.com") ||
                    queryStr.includes("instagram.com");
      onSearch(queryStr, isUrl);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 py-6 animate-fade-in text-zinc-100 selection:bg-rose-500/30">
      
      {/* Provider Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-2xl bg-zinc-900/50 border border-white/5 shadow-sm">
          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${config.colorClass} text-white`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
            {provider} downloader &middot; 100% livre
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white tracking-tight leading-none">
          {config.title}
        </h2>
        
        <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          {config.subtitle}
        </p>
      </div>

      {/* PASTE BOX (CONCORRENTE DIRECT) */}
      <div className="p-1 rounded-3xl bg-zinc-900/60 border border-white/10 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-2xl max-w-3xl mx-auto relative overflow-hidden">
        <form onSubmit={handleDownloadSubmit} className="flex flex-col sm:flex-row gap-2 items-stretch">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 text-zinc-400 focus-within:text-white transition-colors">
            <Link className={`w-5 h-5 flex-shrink-0 ${config.textAccent}`} />
            <input
              type="text"
              placeholder={config.placeholder}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-transparent text-white placeholder-zinc-500 text-sm outline-none border-none py-1 font-mono text-[13px]"
            />
            {urlInput && (
              <button 
                type="button" 
                onClick={() => setUrlInput("")}
                className="text-xs text-zinc-500 hover:text-white transition-colors mr-1"
              >
                Limpar
              </button>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-primary to-rose-600 hover:from-rose-500 hover:to-rose-700 text-white rounded-2xl text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar / Converter</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* FEATURE BULLETS BENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-4">
        {config.features.map((feat, idx) => (
          <div key={idx} className="flex items-start gap-2.5 p-4 rounded-2xl bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-all">
            <div className={`p-1 rounded-lg ${config.accentBg} shrink-0`}>
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-zinc-300 leading-snug">{feat}</span>
          </div>
        ))}
      </div>

      {/* INDEPENDENT RESULTS AND LOADING AREA */}
      {(isLoading || error || results.length > 0) && (
        <div className="space-y-6 pt-6 border-t border-white/5 max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 px-1">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Resultados Encontrados para {provider.toUpperCase()}
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              {results.length} item(ns)
            </span>
          </div>
          
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState 
              message={error} 
              onRetry={() => onSearch(urlInput || "music", urlInput.startsWith("http"))} 
            />
          ) : (
            <MediaGrid
              medias={results}
              onPlay={onPlay}
              onSelectDetails={onSelectDetails}
              activeMediaId={activeMediaId}
            />
          )}
        </div>
      )}

      {/* DETAILED GUIDE */}
      <div className="p-8 rounded-3xl bg-[#090909]/40 border border-white/5 max-w-4xl mx-auto space-y-6">
        <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" /> Como baixar do {provider.toUpperCase()} passo a passo:
        </h3>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-400 font-sans leading-relaxed">
          <li className="space-y-2">
            <span className="text-xs font-bold font-mono text-zinc-500 block">PASSO 01</span>
            <p><strong>Copie o Link:</strong> Abra o site ou aplicativo do {provider.toUpperCase()} e copie o link direto do vídeo, música ou Reel que deseja baixar.</p>
          </li>
          <li className="space-y-2">
            <span className="text-xs font-bold font-mono text-zinc-500 block">PASSO 02</span>
            <p><strong>Cole o Link:</strong> Cole o link copiado no campo de entrada acima. O sistema identificará automaticamente a plataforma de origem.</p>
          </li>
          <li className="space-y-2">
            <span className="text-xs font-bold font-mono text-zinc-500 block">PASSO 03</span>
            <p><strong>Baixe o Arquivo:</strong> Clique no botão de download, espere alguns segundos pela renderização proxy e escolha baixar como Áudio MP3 ou Vídeo MP4.</p>
          </li>
        </ol>
      </div>

      {/* FAQ ACCORDION FOR SEO RANKING */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5 px-1">
          <HelpCircle className="w-4 h-4 text-primary" /> Perguntas Frequentes
        </h3>
        <div className="space-y-3">
          {config.faq.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-white/5 bg-[#090909]/50 p-5 space-y-2">
              <h4 className="text-xs font-bold text-white font-sans">{item.q}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
