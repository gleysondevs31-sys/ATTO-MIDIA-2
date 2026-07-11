import { useEffect } from "react";
import { NormalizedMedia } from "../types";

interface DynamicHelmetProps {
  currentView: "explore" | "video-player" | "favorites" | "profile" | "admin" | "landing" | "legal";
  query: string;
  selectedPlatform: string;
  activeMedia: NormalizedMedia | null;
  selectedDetailsMedia: NormalizedMedia | null;
}

export function DynamicHelmet({
  currentView,
  query,
  selectedPlatform,
  activeMedia,
  selectedDetailsMedia
}: DynamicHelmetProps) {
  useEffect(() => {
    // 1. Determine Title and Description based on active states
    let title = "ATTO Downloads - Baixar Vídeos do YouTube, TikTok e Instagram";
    let description = "A melhor e mais rápida plataforma online para pesquisar, reproduzir, converter e baixar vídeos ou áudios do YouTube, TikTok (sem marca d'água) e Instagram Reels. 100% gratuito, seguro e ilimitado.";
    let image = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80"; // Default professional brand image
    let url = "https://atto-downloads.com/";
    let keywords = "baixar video youtube, downloader tiktok, salvar video tiktok sem marca d'agua, conversor youtube mp3, baixar reels instagram, instagram downloader, media proxy downloader, zero two atto, conversor de video online gratis";

    // Format platform name for readability
    const getPlatformLabel = (plat: string) => {
      if (!plat || plat === "all" || plat === "unknown") return "Multi-plataforma";
      return plat.charAt(0).toUpperCase() + plat.slice(1);
    };

    // Prioritize:
    // A. Details View / Media Selection
    if (selectedDetailsMedia) {
      const platLabel = getPlatformLabel(selectedDetailsMedia.platform);
      title = `Baixar ${selectedDetailsMedia.title} - ${platLabel} Downloader | ATTO Downloads`;
      description = `Baixe ou assista '${selectedDetailsMedia.title}' de ${selectedDetailsMedia.author || "Criador"} no ${platLabel} gratuitamente. Extração de áudio MP3 e download de vídeo MP4 seguro com o ATTO Downloads.`;
      if (selectedDetailsMedia.thumbnail) {
        image = selectedDetailsMedia.thumbnail;
      }
      url = `https://atto-downloads.com/?media=${encodeURIComponent(selectedDetailsMedia.id)}&platform=${selectedDetailsMedia.platform}`;
      keywords = `${selectedDetailsMedia.title.toLowerCase()}, baixar ${selectedDetailsMedia.title.toLowerCase()}, download ${platLabel.toLowerCase()}, ${selectedDetailsMedia.author?.toLowerCase() || ""}, conversor de video, converter mp3, ${keywords}`;
    }
    // B. Active Player
    else if (activeMedia) {
      const platLabel = getPlatformLabel(activeMedia.platform);
      title = `Ouvindo: ${activeMedia.title} - ${activeMedia.author || "Criador"} | ATTO Downloads`;
      description = `Reproduzindo e baixando '${activeMedia.title}' de ${activeMedia.author || "Criador"}. Obtenha mídia do ${platLabel} em alta definição sem marca d'água no ATTO Downloads.`;
      if (activeMedia.thumbnail) {
        image = activeMedia.thumbnail;
      }
      url = `https://atto-downloads.com/?play=${encodeURIComponent(activeMedia.id)}&platform=${activeMedia.platform}`;
      keywords = `ouvir ${activeMedia.title.toLowerCase()}, baixar musica ${activeMedia.title.toLowerCase()}, ${activeMedia.author?.toLowerCase() || ""}, ${platLabel.toLowerCase()} downloader, ${keywords}`;
    }
    // C. General Views
    else {
      switch (currentView) {
        case "explore":
          if (query && query.trim() !== "" && query.toLowerCase() !== "lofi chill") {
            const cleanQuery = query.trim();
            const platLabel = selectedPlatform !== "all" ? ` no ${getPlatformLabel(selectedPlatform)}` : "";
            title = `Resultados para "${cleanQuery}"${platLabel} | ATTO Downloads`;
            description = `Pesquise, ouça e faça o download de mídias relacionadas a '${cleanQuery}'${platLabel}. Encontre vídeos, áudios e playlists de forma rápida e segura.`;
            url = `https://atto-downloads.com/?q=${encodeURIComponent(cleanQuery)}&platform=${selectedPlatform}`;
            keywords = `${cleanQuery.toLowerCase()}, pesquisar ${cleanQuery.toLowerCase()}, baixar ${cleanQuery.toLowerCase()}, converter ${cleanQuery.toLowerCase()}, ${keywords}`;
          } else {
            title = "Explorar Mídias Populares - YouTube, TikTok, Instagram | ATTO Downloads";
            description = "Descubra e explore as músicas, vídeos e Reels que estão bombando nas redes. Filtre por plataforma e faça o download instantâneo em alta fidelidade.";
            url = "https://atto-downloads.com/?view=explore";
          }
          break;

        case "favorites":
          title = "Minhas Mídias Favoritas & Downloads Salvos | ATTO Downloads";
          description = "Acesse sua biblioteca pessoal de mídias favoritadas e downloads salvos na nuvem pelo ATTO Downloads. Seu histórico e coleção de músicas e vídeos sincronizados.";
          url = "https://atto-downloads.com/?view=favorites";
          keywords = "meus favoritos, midias salvas, playlist pessoal, biblioteca de downloads, " + keywords;
          break;

        case "profile":
          title = "Painel de Perfil & Progresso do Usuário | ATTO Downloads";
          description = "Monitore seu nível de usuário, ganhe conquistas, configure preferências de reprodução automática e gerencie seus dados com segurança no ATTO Downloads.";
          url = "https://atto-downloads.com/?view=profile";
          break;

        case "legal":
          title = "Termos de Uso, Privacidade, Ajuda & FAQ | ATTO Downloads";
          description = "Consulte os Termos de Serviço Gerais, nossa Política de Privacidade em total conformidade com a LGPD, Condições de Download e Canais de Suporte Técnico.";
          url = "https://atto-downloads.com/?view=legal";
          keywords = "termos de uso, politica de privacidade, ajuda, faq, lgpd, suporte atto, " + keywords;
          break;

        case "admin":
          title = "Painel Administrativo do Sistema | ATTO Downloads";
          description = "Módulo de controle operacional interno para supervisão de tráfego, auditoria de dados de usuários e métricas do sistema ATTO.";
          url = "https://atto-downloads.com/?view=admin";
          break;

        case "video-player":
          title = "Assistindo Vídeo em Alta Definição | ATTO Downloads";
          description = "Reprodutor de vídeo imersivo com controle de autoplay e downloads integrados do ATTO Downloads.";
          url = "https://atto-downloads.com/?view=video-player";
          break;

        case "landing":
        default:
          title = "ATTO Downloads - Baixar Vídeos do YouTube, TikTok e Instagram";
          description = "A melhor e mais rápida plataforma online para pesquisar, reproduzir, converter e baixar vídeos ou áudios do YouTube, TikTok (sem marca d'água) e Instagram Reels. 100% gratuito, seguro e ilimitado.";
          url = "https://atto-downloads.com/";
          break;
      }
    }

    // 2. DOM Updates
    // Update Document Title
    document.title = title;

    // Helper to create or update meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        if (isProperty) {
          element.setAttribute("property", name);
        } else {
          element.setAttribute("name", name);
        }
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Update Meta Tags
    updateMeta("title", title);
    updateMeta("description", description);
    updateMeta("keywords", keywords);

    // Update Open Graph Tags (Facebook, Discord, WhatsApp)
    updateMeta("og:title", title, true);
    updateMeta("og:description", description, true);
    updateMeta("og:image", image, true);
    updateMeta("og:url", url, true);

    // Update Twitter Tags
    updateMeta("twitter:title", title, true);
    updateMeta("twitter:description", description, true);
    updateMeta("twitter:image", image, true);
    updateMeta("twitter:url", url, true);

    // Update Canonical Link
    let canonical = document.head.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

  }, [currentView, query, selectedPlatform, activeMedia, selectedDetailsMedia]);

  return null; // This component operates strictly as a declarative side-effect trigger
}
