import React, { useState } from "react";
import { 
  Shield, FileText, Scale, HelpCircle, ExternalLink, ChevronRight, 
  ArrowLeft, CheckCircle2, Mail, Info, Globe, AlertTriangle, Cpu, Terminal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LegalViewProps {
  onBackToExplore: () => void;
  initialTab?: "terms" | "privacy" | "conditions" | "links";
}

export function LegalView({ onBackToExplore, initialTab = "terms" }: LegalViewProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "conditions" | "links">(initialTab);

  const tabs = [
    { id: "terms", name: "Termos de Uso", icon: FileText, desc: "Regras de utilização do serviço" },
    { id: "privacy", name: "Privacidade", icon: Shield, desc: "Como protegemos os seus dados" },
    { id: "conditions", name: "Condições", icon: Scale, desc: "Responsabilidades e downloads" },
    { id: "links", name: "Links Úteis & FAQ", icon: HelpCircle, desc: "Recursos externos e suporte" },
  ] as const;

  return (
    <div id="legal-view-wrapper" className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e0e0e] via-[#090909] to-[#040404] border border-white/5 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToExplore}
              className="p-2 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white cursor-pointer transition-colors active:scale-95"
              title="Voltar ao Explorador"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-2xl font-display font-black text-white tracking-tight">
              Central de Informações Legais
            </h2>
          </div>
          <p className="text-xs text-zinc-400 font-sans max-w-md">
            Consulte os Termos de Uso, Política de Privacidade, Condições Gerais de Download e Links Úteis de Suporte.
          </p>
        </div>

        <button
          onClick={onBackToExplore}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer active:scale-95"
        >
          <span>Ir para Explorador</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? "border-primary bg-primary/10 text-white shadow-xl scale-[1.02]"
                  : "border-white/5 bg-[#0a0a0a] text-zinc-400 hover:text-white hover:bg-[#111111]/40 hover:border-white/10"
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full blur-xl pointer-events-none" />
              )}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                isSelected ? "bg-primary text-white" : "bg-white/5 text-zinc-400"
              }`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider block">
                  {tab.name}
                </h3>
                <span className="text-[10px] text-zinc-500 font-sans mt-0.5 block leading-tight">
                  {tab.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden min-h-[450px]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait">
          {activeTab === "terms" && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-zinc-300 text-xs leading-relaxed font-sans"
            >
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  Termos e Condições Gerais de Uso
                </h3>
              </div>

              <div className="space-y-4">
                <p>
                  Bem-vindo ao <strong>ATTO Downloads</strong>. Ao acessar e utilizar nossa plataforma de busca, streaming e conversão de mídia proxy, você concorda em cumprir e estar vinculado aos seguintes Termos de Uso.
                </p>

                <div className="bg-[#111111]/40 border border-white/5 rounded-2xl p-4 space-y-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-500 uppercase">
                    <AlertTriangle className="w-4 h-4" /> Nota de Responsabilidade Legal
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    O ATTO Downloads funciona estritamente como um indexador técnico, reprodutor em nuvem e intermediário de fluxo de rede (proxy). Nós não armazenamos, hospedamos ou transmitimos arquivos piratas ou protegidos por copyright proprietário em nossos servidores locais de forma pública ou permanente. Todo o conteúdo acessado é de responsabilidade exclusiva de seus criadores e das respectivas plataformas hospedeiras (YouTube, SoundCloud, Spotify, TikTok).
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    1. Elegibilidade e Cadastro
                  </h4>
                  <p>
                    Para usufruir de recursos avançados, como banco de dados em nuvem para favoritos e histórico de buscas (PostgreSQL), você deve criar uma conta de usuário com e-mail válido. Ao se registrar, você concorda em manter a segurança da sua senha e assume total responsabilidade por todas as atividades realizadas na sua conta.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    2. Diretrizes de Uso Aceitável
                  </h4>
                  <p>
                    A nossa plataforma foi projetada para fins educativos, de demonstração de APIs e curadoria pessoal de mídias públicas. É expressamente proibido:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                    <li>Utilizar scripts de automação, robôs ou scrapers externos para bombardear os servidores e APIs do ATTO.</li>
                    <li>Baixar e redistribuir comercialmente mídias sem a autorização explícita dos detentores de direitos autorais originais.</li>
                    <li>Utilizar identidades falsas ou tentar invadir as contas de outros membros e administradores da plataforma.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    3. Limitação de Garantia e Desempenho
                  </h4>
                  <p>
                    Nossos recursos de download e proxy dependem de conexões com APIs de terceiros. Nós não garantimos que a plataforma estará livre de interrupções, bugs, bloqueios do YouTube ou alterações súbitas nos endpoints parceiros. Nos reservamos o direito de suspender ou alterar o funcionamento de qualquer ferramenta de download a qualquer momento para garantir a segurança operacional.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 text-[10px] text-zinc-500 font-mono text-center">
                Última atualização: Junho de 2026 • Versão de Termos: 2.4.2
              </div>
            </motion.div>
          )}

          {activeTab === "privacy" && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-zinc-300 text-xs leading-relaxed font-sans"
            >
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  Diretrizes de Privacidade e Proteção de Dados
                </h3>
              </div>

              <div className="space-y-4">
                <p>
                  No <strong>ATTO Downloads</strong>, a privacidade dos nossos usuários é de extrema importância. Esta política descreve quais tipos de dados pessoais coletamos, como os armazenamos de forma segura no PostgreSQL e os seus direitos de controle de dados.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-white/5 bg-[#111111]/30 space-y-2">
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 uppercase">
                      <CheckCircle2 className="w-3.5 h-3.5" /> O que Coletamos
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[11px]">
                      <li>E-mail e nome de usuário de cadastro.</li>
                      <li>Histórico pessoal de consultas (pesquisas efetuadas).</li>
                      <li>Registros de mídia favoritadas por você.</li>
                      <li>Tokens JWT para validação de sessões criptografadas.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-white/5 bg-[#111111]/30 space-y-2">
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-rose-400 uppercase">
                      <CheckCircle2 className="w-3.5 h-3.5" /> O que NÃO Coletamos
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[11px]">
                      <li>Nenhum dado de pagamento ou cartão de crédito.</li>
                      <li>Suas senhas sem criptografia de via única (Hashing Bcrypt).</li>
                      <li>Informações de geolocalização exata ou cookies de terceiros.</li>
                      <li>Arquivos baixados por você de forma permanente em nossos servidores.</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Uso de Cookies e Sessões Locais
                  </h4>
                  <p>
                    Utilizamos o armazenamento local do navegador (<code>localStorage</code>) estritamente para manter você logado de forma automática (através do token JWT seguro) e salvar preferências de exibição de layout, como o status de reprodução automática (autoplay) e o tema selecionado. Nenhum cookie de rastreamento de marketing invasivo é utilizado.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Seus Direitos (LGPD e RGPD)
                  </h4>
                  <p>
                    Garantimos total soberania sobre os seus próprios dados. Você tem o direito de:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                    <li>Visualizar e exportar o seu histórico completo diretamente pelo seu Painel de Configurações.</li>
                    <li>Alterar seus dados cadastrais (como assinatura, avatar e e-mail) a qualquer momento.</li>
                    <li>Utilizar os botões da <strong>Danger Zone (Zona de Perigo)</strong> no seu painel para apagar completamente todo o seu histórico de pesquisas e favoritos salvos no banco de dados com efeito imediato e permanente.</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 text-[10px] text-zinc-500 font-mono text-center">
                Segurança garantida por PostgreSQL e Criptografia Hashing Bcrypt
              </div>
            </motion.div>
          )}

          {activeTab === "conditions" && (
            <motion.div
              key="conditions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-zinc-300 text-xs leading-relaxed font-sans"
            >
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Scale className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  Condições Gerais de Download e Transmissão
                </h3>
              </div>

              <div className="space-y-4">
                <p>
                  As presentes condições de serviço regulam o processo de extração, conversão técnica e download direto promovidos pelos motores de processamento em nuvem do <strong>ATTO Downloads</strong>.
                </p>

                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-primary" /> 1. Arquitetura de Cache e Streaming Proxy
                  </h4>
                  <p>
                    Para contornar restrições severas de rede e blocos 403 (Forbidden) impostos pelas plataformas de hospedagem, nossa tecnologia realiza requisições do lado do servidor (Server-Side) para as APIs do Zero Two, convertendo o arquivo de mídia de forma transparente:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                    <li><strong>Mídias de Áudio (Spotify/SoundCloud):</strong> São transmitidas por fluxo contínuo ou convertidas temporariamente sob demanda para formato <code>.mp3</code> ou <code>.aac</code> em alta definição.</li>
                    <li><strong>Mídias de Vídeo (YouTube/TikTok):</strong> São processadas em tempo real e redirecionadas diretamente aos canais confiáveis da CDN do Catbox ou servidores de streaming do GoogleVideo, impedindo que o seu IP enfrente lentidão ou gargalos.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" /> 2. Limites de Taxa e Rate Limits
                  </h4>
                  <p>
                    Embora o serviço seja gratuito, estabelecemos barreiras técnicas preventivas para garantir que nenhum ataque de negação de serviço (DDoS) derrube as aplicações:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                    <li>Máximo de 3 requisições de download em lote paralelas por IP por minuto.</li>
                    <li>Sessões ativas do player de áudio são reiniciadas se ficarem inativas por mais de 3 horas consecutivas.</li>
                    <li>Downloads de arquivos que excedam 2 horas de duração total de áudio ou vídeo podem sofrer compressão automática.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    3. Conformidade com Direitos Autorais
                  </h4>
                  <p>
                    O usuário se declara o único responsável legal pela destinação do conteúdo baixado. A plataforma desencoraja fortemente qualquer pirataria comercial. Faça uso do downloader apenas para fins de visualização de backup offline de conteúdos dos quais você possui direitos ou acesso legítimo de reprodução.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 text-[10px] text-zinc-500 font-mono text-center">
                Motor de Conversão: Zero Two APIs Universal Engine
              </div>
            </motion.div>
          )}

          {activeTab === "links" && (
            <motion.div
              key="links"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-zinc-300 text-xs leading-relaxed font-sans"
            >
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <HelpCircle className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  Links Úteis, FAQs e Suporte Técnico
                </h3>
              </div>

              {/* FAQs accordion / card list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* FAQs card */}
                <div className="bg-[#111111]/40 border border-white/5 p-5 rounded-2xl space-y-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                    Perguntas Frequentes (FAQs)
                  </span>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h5 className="font-bold text-white">O download do TikTok vem com a marca d'água?</h5>
                      <p className="text-[11px] text-zinc-400">Não! Nosso downloader TikTok limpa todas as marcas d'água para que você tenha o vídeo com tela pura.</p>
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-bold text-white">Por que o download de música abre uma nova aba às vezes?</h5>
                      <p className="text-[11px] text-zinc-400">Para garantir alta confiabilidade contra bloqueios e downloads rápidos, redirecionamos o navegador para o link direto de áudio verificado.</p>
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-bold text-white">Como funciona o ganho de pontuação e níveis?</h5>
                      <p className="text-[11px] text-zinc-400">Ao favoritar mídias ou fazer novas pesquisas conectado na sua conta, você ganha pontos para subir de nível e desbloquear conquistas exclusivas!</p>
                    </div>
                  </div>
                </div>

                {/* Useful Links card */}
                <div className="bg-[#111111]/40 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                      Recursos e Portais Recomendados
                    </span>

                    <div className="space-y-2.5">
                      <a 
                        href="https://zero-two-apis.store/docs" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all font-mono text-[11px] border border-white/5 cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-primary" /> Documentação das APIs Zero Two</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <a 
                        href="https://github.com/GleysonF" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all font-mono text-[11px] border border-white/5 cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-zinc-400" /> Repositório Oficial do Github</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <a 
                        href="https://catbox.moe" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all font-mono text-[11px] border border-white/5 cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-sky-400" /> Host de Armazenamento Catbox</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Contact section */}
                  <div className="pt-4 border-t border-white/5 space-y-1">
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-zinc-400 uppercase">
                      <Mail className="w-3.5 h-3.5 text-primary" /> Canal de Suporte e Ouvidoria
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Envie feedbacks para: <a href="mailto:gleysonferreira531@gmail.com" className="text-primary hover:underline font-bold">gleysonferreira531@gmail.com</a>
                    </p>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
