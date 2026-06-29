import React, { useState } from "react";
import { Check, Star, Crown, Zap, ShieldCheck, CreditCard, Sparkles, AlertCircle, Loader2, Landmark } from "lucide-react";
import { useToast } from "./Toast";

interface PlansViewProps {
  user: any;
  onUpdateUser: (updatedUser: any) => void;
  onOpenAuth: () => void;
  onSelectView: (view: string) => void;
}

interface PlanItem {
  id: string;
  name: string;
  price: string;
  period: string;
  icon: any;
  iconColor: string;
  borderColor: string;
  bgColor: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  features: string[];
}

export function PlansView({ user, onUpdateUser, onOpenAuth, onSelectView }: PlansViewProps) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [checkoutMethod, setCheckoutMethod] = useState<"pix" | "card" | "mercadopago">("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const plans: PlanItem[] = [
    {
      id: "free",
      name: "Plano Grátis",
      price: "R$ 0,00",
      period: "para sempre",
      icon: Star,
      iconColor: "text-zinc-400",
      borderColor: "border-white/5",
      bgColor: "bg-[#111111]/40",
      description: "Para downloads básicos casuais do dia a dia.",
      features: [
        "Downloads básicos de áudio (até 128 kbps)",
        "Downloads básicos de vídeo (até 360p)",
        "Processamento padrão na fila de servidores",
        "Até 10 buscas e downloads por dia",
        "Histórico de buscas local no navegador"
      ]
    },
    {
      id: "pro",
      name: "Atto PRO",
      price: "R$ 9,90",
      period: "/mês",
      icon: Zap,
      iconColor: "text-amber-400 animate-pulse",
      borderColor: "border-amber-500/30",
      bgColor: "bg-amber-950/10",
      badge: "Mais Popular",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      description: "O melhor custo-benefício para quem ama música e vídeos em HD.",
      features: [
        "Downloads de áudio de alta fidelidade (320 kbps)",
        "Downloads de vídeo HD (720p)",
        "Velocidade de download 5x mais rápida",
        "Downloads ilimitados de qualquer plataforma",
        "Acesso total ao SoundCloud, Spotify e YouTube",
        "Suporte a salvamento na nuvem (Favoritos & Histórico)"
      ]
    },
    {
      id: "premium",
      name: "Atto PREMIUM",
      price: "R$ 19,90",
      period: "/mês",
      icon: Crown,
      iconColor: "text-rose-400 animate-bounce",
      borderColor: "border-primary/40",
      bgColor: "bg-rose-950/15",
      badge: "Ultra Velocidade",
      badgeColor: "bg-primary/20 text-primary border-primary/30",
      description: "Acesso absoluto, sem limitações e com recursos exclusivos de ponta.",
      features: [
        "Vídeos em altíssima resolução (1080p Full HD e 4K)",
        "TikTok sem marca d'água em HD nativo",
        "Instagram Reels em resolução máxima original",
        "Fila premium com prioridade máxima nos servidores",
        "Extração ultra-rápida de playlists inteiras",
        "Suporte prioritário e avatares especiais personalizados",
        "Acesso ao Bot exclusivo do WhatsApp (em breve)"
      ]
    }
  ];

  const currentPlanId = user?.plan || "free";

  const handleSubscribeClick = (plan: PlanItem) => {
    if (!user) {
      toast.error("Autenticação necessária", "Por favor, faça login ou crie uma conta para assinar um plano.");
      onOpenAuth();
      return;
    }
    if (plan.id === currentPlanId) {
      toast.success("Plano ativo", `Você já possui o plano ${plan.name} ativo em sua conta!`);
      return;
    }
    setSelectedPlan(plan);
  };

  const handleMockCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPlan) return;

    setIsProcessing(true);
    
    // Simulate payment processing time
    setTimeout(async () => {
      try {
        const response = await fetch("/api/auth/upgrade", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
          },
          body: JSON.stringify({ plan: selectedPlan.id })
        });

        const data = await response.json();

        if (response.ok && data.status) {
          toast.success("Assinatura Confirmada!", `Parabéns! Você agora é ${selectedPlan.name.toUpperCase()}!`);
          
          // Update the global user context
          onUpdateUser({
            ...user,
            plan: selectedPlan.id
          });
          
          // Close modal & reset fields
          setSelectedPlan(null);
          setCardNumber("");
          setCardName("");
          setCardExpiry("");
          setCardCvv("");
        } else {
          toast.error("Erro no upgrade", data.error || "Não foi possível processar o upgrade.");
        }
      } catch (err: any) {
        toast.error("Falha na conexão", "Erro de rede ao processar o upgrade.");
      } finally {
        setIsProcessing(false);
      }
    }, 2500);
  };

  return (
    <div id="plans-view-container" className="space-y-10 animate-fade-in py-2">
      {/* Upper header section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SISTEMA DE PLANOS ATTO</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white">
          Liberte o Máximo Poder de <span className="text-primary">Download</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed">
          Tenha acesso a downloads em altíssima qualidade (1080p, 4K, 320kbps), downloads ilimitados de TikTok sem marca d'água e velocidade ultra-rápida de servidor.
        </p>
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const PlanIcon = plan.icon;
          const isCurrent = plan.id === currentPlanId;
          
          return (
            <div
              key={plan.id}
              id={`plan-card-${plan.id}`}
              className={`relative rounded-3xl p-6 border flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] shadow-xl ${plan.borderColor} ${plan.bgColor} ${
                isCurrent ? "ring-2 ring-primary/40 bg-gradient-to-b from-[#080808] to-primary/5" : "bg-[#0c0c0c]/90"
              }`}
            >
              {plan.badge && (
                <span className={`absolute -top-3 right-6 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full border shadow-sm ${plan.badgeColor}`}>
                  {plan.badge}
                </span>
              )}

              <div className="space-y-5">
                {/* Icon & Plan Title */}
                <div className="flex items-center gap-3">
                  <div className={`p-3 bg-white/5 rounded-2xl border border-white/5`}>
                    <PlanIcon className={`w-6 h-6 ${plan.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-100 font-display">{plan.name}</h3>
                    <p className="text-xs text-gray-400">{plan.description}</p>
                  </div>
                </div>

                {/* Price Display */}
                <div className="border-t border-b border-white/5 py-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black font-display text-white">{plan.price}</span>
                    <span className="text-xs text-gray-500 font-mono font-semibold uppercase">{plan.period}</span>
                  </div>
                </div>

                {/* Feature List */}
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-300 leading-tight">
                      <div className="p-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Subscribe/Action Button */}
              <button
                id={`btn-plan-action-${plan.id}`}
                onClick={() => handleSubscribeClick(plan)}
                className={`w-full mt-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest font-mono transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-[#111111] border border-emerald-500/20 text-emerald-400 cursor-default"
                    : plan.id === "premium"
                      ? "bg-primary hover:bg-primary-hover text-white shadow-lg shadow-rose-950/20 active:scale-98"
                      : "bg-white/5 hover:bg-white/10 text-white border border-white/10 active:scale-98"
                }`}
              >
                {isCurrent ? "✓ Seu Plano Ativo" : plan.id === "free" ? "Usar Grátis" : "Fazer Upgrade"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Security note */}
      <div className="max-w-md mx-auto bg-[#111111]/40 border border-white/5 rounded-2xl p-4 flex items-center gap-3 text-center md:text-left justify-center">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <span className="text-xs text-gray-400">
          Pagamento 100% criptografado e seguro. Ambiente de demonstração em conformidade com as diretrizes do sistema.
        </span>
      </div>

      {/* MODAL CHECKOUT */}
      {selectedPlan && (
        <div id="checkout-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#080808] border border-white/10 rounded-3xl p-6 max-w-md w-full relative space-y-6 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-4 right-4 p-1.5 bg-[#111111] hover:bg-white/5 border border-white/5 text-gray-400 hover:text-white rounded-lg transition-all"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">Finalizar Assinatura</span>
              <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
                Upgrade para <span className="text-primary">{selectedPlan.name}</span>
              </h3>
              <p className="text-xs text-gray-400">
                Você escolheu assinar por <b className="text-white font-mono">{selectedPlan.price}</b>. Selecione o método de simulação abaixo:
              </p>
            </div>

            {/* Selector Tab for payment method */}
            <div className="grid grid-cols-3 gap-2 bg-[#111111] p-1.5 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => setCheckoutMethod("pix")}
                className={`py-2 text-[10px] sm:text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  checkoutMethod === "pix" ? "bg-primary text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>PIX</span>
              </button>
              <button
                type="button"
                onClick={() => setCheckoutMethod("card")}
                className={`py-2 text-[10px] sm:text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  checkoutMethod === "card" ? "bg-primary text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cartão</span>
              </button>
              <button
                type="button"
                onClick={() => setCheckoutMethod("mercadopago")}
                className={`py-2 text-[10px] sm:text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  checkoutMethod === "mercadopago" ? "bg-sky-500 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Mercado Pago</span>
              </button>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleMockCheckout} className="space-y-4">
              {checkoutMethod === "pix" ? (
                <div className="space-y-4 text-center p-4 bg-[#111111]/40 border border-white/5 rounded-2xl">
                  <div className="w-40 h-40 bg-white p-2.5 mx-auto rounded-2xl flex items-center justify-center shadow-lg border border-primary/20">
                    {/* Generates a stylized, mock QR code using basic shapes */}
                    <div className="grid grid-cols-4 gap-2 w-full h-full text-[#080808]">
                      <div className="bg-[#080808] rounded-xs" />
                      <div className="bg-[#080808] rounded-xs" />
                      <div className="bg-transparent" />
                      <div className="bg-[#080808] rounded-xs" />
                      <div className="bg-[#080808] rounded-xs" />
                      <div className="bg-[#080808] rounded-xs" />
                      <div className="bg-[#080808] rounded-xs" />
                      <div className="bg-transparent" />
                      <div className="bg-transparent" />
                      <div className="bg-[#080808] rounded-xs" />
                      <div className="bg-transparent" />
                      <div className="bg-[#080808] rounded-xs" />
                      <div className="bg-[#080808] rounded-xs" />
                      <div className="bg-transparent" />
                      <div className="bg-[#080808] rounded-xs" />
                      <div className="bg-[#080808] rounded-xs" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-emerald-400 flex items-center justify-center gap-1.5 font-semibold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Aguardando pagamento PIX simulado...</span>
                    </p>
                    <div className="p-2.5 bg-[#161616] border border-white/5 rounded-xl flex items-center justify-between text-left">
                      <span className="text-[10px] font-mono text-gray-400 truncate max-w-[240px]">
                        00020101021226870014br.gov.bcb.pix0123atto.downloads.upgrade.9902
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("00020101021226870014br.gov.bcb.pix0123atto.downloads.upgrade.9902");
                          toast.success("Copiado!", "Código PIX Copia e Cola copiado para a área de transferência.");
                        }}
                        className="text-[10px] font-mono font-bold text-primary hover:underline shrink-0"
                      >
                        Copiar Código
                      </button>
                    </div>
                  </div>
                </div>
              ) : checkoutMethod === "mercadopago" ? (
                <div className="space-y-4 text-center p-6 bg-sky-900/10 border border-sky-500/20 rounded-2xl">
                   <div className="w-16 h-16 bg-sky-500 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-sky-500/20">
                     <ShieldCheck className="w-8 h-8" />
                   </div>
                   <div>
                     <h4 className="text-sm font-bold text-sky-400 font-display mb-1">Checkout Transparente</h4>
                     <p className="text-xs text-gray-400">
                       Você será redirecionado para a plataforma segura do Mercado Pago para finalizar a sua assinatura.
                     </p>
                   </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">Número do Cartão</label>
                    <input
                      type="text"
                      required
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                      className="w-full bg-[#111111] border border-white/5 focus:border-primary/50 text-xs px-3.5 py-3 rounded-xl outline-none text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">Nome do Titular</label>
                    <input
                      type="text"
                      required
                      placeholder="FULANO DE TAL"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      className="w-full bg-[#111111] border border-white/5 focus:border-primary/50 text-xs px-3.5 py-3 rounded-xl outline-none text-white font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">Expiração</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/AA"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-[#111111] border border-white/5 focus:border-primary/50 text-xs px-3.5 py-3 rounded-xl outline-none text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">CVV</label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full bg-[#111111] border border-white/5 focus:border-primary/50 text-xs px-3.5 py-3 rounded-xl outline-none text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Warning box */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-300 leading-normal">
                  <b>Ambiente de Demonstração:</b> Esta é uma transação simulada e gratuita. Nenhum dinheiro real será cobrado de seu saldo PIX ou cartão de crédito.
                </p>
              </div>

              {/* Action trigger button */}
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-3.5 ${checkoutMethod === "mercadopago" ? "bg-sky-500 hover:bg-sky-600 shadow-sky-500/30" : "bg-primary hover:bg-primary-hover shadow-rose-950/30"} text-white rounded-2xl text-xs font-bold uppercase tracking-widest font-mono flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processando Assinatura...</span>
                  </>
                ) : checkoutMethod === "mercadopago" ? (
                  <span>Pagar com Mercado Pago</span>
                ) : (
                  <span>Confirmar Pagamento Simulado</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
