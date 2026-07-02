import React, { useState } from "react";
import { 
  User, Shield, Key, Database, LayoutGrid, Heart, Sparkles, 
  Loader2, Save, LogOut, Award, BarChart2, Calendar, Search, 
  Trash2, Lock, CheckCircle2, ChevronRight, HelpCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";
import { NormalizedMedia, SearchHistoryItem } from "../types";

interface ProfileViewProps {
  user: {
    id: number;
    username: string;
    email: string;
    avatar: string;
    bio: string;
    role: string;
    theme: string;
    created_at?: string;
    plan?: string;
    coins?: number;
  };
  onUpdateProfile: (updatedData: { username?: string; avatar?: string; bio?: string; theme?: string }) => Promise<boolean>;
  onLogout: () => void;
  favorites: NormalizedMedia[];
  history: SearchHistoryItem[];
  token: string | null;
  onClearHistory: () => Promise<void>;
  onClearFavorites: () => Promise<void>;
  onSearchQuery?: (q: string) => void;
  onRemoveHistoryItem?: (q: string) => Promise<void>;
}

export function ProfileView({
  user,
  onUpdateProfile,
  onLogout,
  favorites,
  history,
  token,
  onClearHistory,
  onClearFavorites,
  onSearchQuery,
  onRemoveHistoryItem,
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "achievements" | "history" | "giftcards">("profile");
  
  // Profile Form States
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || "");
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [selectedTheme, setSelectedTheme] = useState(user.theme === "dark" || !user.theme ? "rose" : user.theme);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Gift Card States
  const [giftCardCode, setGiftCardCode] = useState("");
  const [isRedeemingCard, setIsRedeemingCard] = useState(false);
  const [giftCardMessage, setGiftCardMessage] = useState<{type: "error" | "success", text: string} | null>(null);

  // Danger Zone confirmation states
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);
  const [showClearFavoritesConfirm, setShowClearFavoritesConfirm] = useState(false);

  // Avatar Presets
  const avatarPresets = [
    { name: "Robô Futurista", url: "https://api.dicebear.com/7.x/bottts/svg?seed=zerotwo" },
    { name: "Pixel Art Hero", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=attonet" },
    { name: "Gatinho Retrô", url: "https://api.dicebear.com/7.x/identicon/svg?seed=luna" },
    { name: "Monstrinho Fofo", url: "https://api.dicebear.com/7.x/miniavs/svg?seed=cyber" },
    { name: "Aventureiro Espacial", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=star" },
    { name: "Gamer Cyberpunk", url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=game" },
  ];

  // Accent Theme Options
  const themePresets = [
    { key: "rose", name: "Rose", color: "bg-[#f43f5e]" },
    { key: "violet", name: "Violet", color: "bg-[#8b5cf6]" },
    { key: "emerald", name: "Emerald", color: "bg-[#10b981]" },
    { key: "amber", name: "Amber", color: "bg-[#f59e0b]" },
    { key: "sky", name: "Sky", color: "bg-[#0ea5e9]" },
  ];

  // Sync theme changes with DOM dataset
  React.useEffect(() => {
    document.documentElement.setAttribute("data-accent-theme", selectedTheme);
  }, [selectedTheme]);

  // Handle profile details save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setIsSavingProfile(true);

    if (!username.trim()) {
      setProfileError("O nome de usuário não pode estar vazio.");
      setIsSavingProfile(false);
      return;
    }

    try {
      const ok = await onUpdateProfile({
        username: username.trim(),
        bio: bio.trim(),
        avatar: selectedAvatar,
        theme: selectedTheme,
      });

      if (ok) {
        setProfileSuccess("Perfil atualizado com sucesso!");
        setTimeout(() => setProfileSuccess(null), 4000);
      } else {
        throw new Error("Não foi possível salvar as alterações.");
      }
    } catch (err: any) {
      setProfileError(err.message || "Erro ao salvar alterações no banco de dados.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle password change request
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Todos os campos de senha são obrigatórios.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("A nova senha e a confirmação não coincidem.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("A nova senha deve possuir no mínimo 6 caracteres.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok && data.status) {
        setPasswordSuccess("Sua senha foi alterada com sucesso!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(null), 5000);
      } else {
        throw new Error(data.error || "Senha atual incorreta ou erro interno.");
      }
    } catch (err: any) {
      setPasswordError(err.message || "Erro ao conectar com o servidor.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle gift card redemption
  const handleRedeemGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setGiftCardMessage(null);
    if (!giftCardCode.trim()) return;
    
    setIsRedeemingCard(true);
    try {
      const response = await fetch("/api/gift-cards/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ code: giftCardCode.trim() })
      });
      const data = await response.json();
      
      if (response.ok && data.status) {
        setGiftCardMessage({ type: "success", text: data.message });
        setGiftCardCode("");
        // Fire event or use a callback to re-fetch the user details
        if (data.user) {
          // A trick to update local user view without full reload if onUpdateProfile allows it
          // Or just dispatch a window event to trigger re-auth in App.tsx
          window.dispatchEvent(new Event("force-auth-refresh"));
        }
      } else {
        throw new Error(data.error || "Erro ao resgatar o código.");
      }
    } catch (err: any) {
      setGiftCardMessage({ type: "error", text: err.message });
    } finally {
      setIsRedeemingCard(false);
    }
  };

  // Gamification & Badges Calculations
  const favoritesCount = favorites.length;
  const historyCount = history.length;
  const activeScore = (favoritesCount * 5) + (historyCount * 2);
  
  // Levels definition
  const currentLevel = Math.max(1, Math.floor(Math.sqrt(activeScore / 4)) + 1);
  const nextLevelScore = Math.pow(currentLevel, 2) * 4;
  const prevLevelScore = Math.pow(currentLevel - 1, 2) * 4;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((activeScore - prevLevelScore) / (nextLevelScore - prevLevelScore)) * 100)
  );

  const getLevelTitle = (lvl: number) => {
    if (lvl >= 10) return "Lenda do Streaming";
    if (lvl >= 7) return "Arquivista de Mídia";
    if (lvl >= 5) return "Explorador Veterano";
    if (lvl >= 3) return "Curador Dinâmico";
    return "Membro Iniciante";
  };

  // Achievements/Badges List
  const achievements = [
    {
      id: "welcomed",
      title: "Boas-vindas",
      desc: "Criou sua conta e iniciou sua jornada no Zero Two ATTO.",
      icon: Sparkles,
      color: "from-rose-500 to-amber-500",
      unlocked: true,
    },
    {
      id: "search_master",
      title: "Mestre da Busca",
      desc: "Pesquisou mais de 10 vezes no acervo global.",
      icon: Search,
      color: "from-violet-500 to-sky-500",
      unlocked: historyCount >= 10,
      progress: `${historyCount}/10`
    },
    {
      id: "music_fan",
      title: "Melômano",
      desc: "Salvou 5 ou mais mídias de música (Spotify / SoundCloud) nos favoritos.",
      icon: Heart,
      color: "from-emerald-500 to-teal-500",
      unlocked: favorites.filter(f => f.platform === "spotify" || f.platform === "soundcloud").length >= 5,
      progress: `${favorites.filter(f => f.platform === "spotify" || f.platform === "soundcloud").length}/5`
    },
    {
      id: "collector_elite",
      title: "Colecionador Elite",
      desc: "Montou uma biblioteca incrível com mais de 10 favoritos.",
      icon: Award,
      color: "from-yellow-500 to-amber-600",
      unlocked: favoritesCount >= 10,
      progress: `${favoritesCount}/10`
    },
    {
      id: "tiktok_lover",
      title: "Cineasta TikTok",
      desc: "Adicionou pelo menos 3 vídeos do TikTok aos seus favoritos.",
      icon: LayoutGrid,
      color: "from-cyan-400 to-blue-600",
      unlocked: favorites.filter(f => f.platform === "tiktok").length >= 3,
      progress: `${favorites.filter(f => f.platform === "tiktok").length}/3`
    },
    {
      id: "unlimited_explorer",
      title: "Explorador Infinito",
      desc: "Completou um histórico massivo de 30 buscas de mídia.",
      icon: Database,
      color: "from-fuchsia-500 to-rose-700",
      unlocked: historyCount >= 30,
      progress: `${historyCount}/30`
    }
  ];

  // Recharts Favorites Platform Stats
  const platformStats = [
    { name: "YouTube", value: favorites.filter(f => f.platform === "youtube").length, color: "#f43f5e" },
    { name: "Spotify", value: favorites.filter(f => f.platform === "spotify").length, color: "#10b981" },
    { name: "SoundCloud", value: favorites.filter(f => f.platform === "soundcloud").length, color: "#f59e0b" },
    { name: "TikTok", value: favorites.filter(f => f.platform === "tiktok").length, color: "#0ea5e9" },
  ].filter(stat => stat.value > 0);

  const formattedJoinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Data desconhecida";

  return (
    <div id="profile-view-wrapper" className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e0e0e] via-[#090909] to-[#040404] border border-white/5 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* User Large Avatar Display with animated level badge */}
        <div className="relative shrink-0">
          <div className="w-28 h-28 rounded-2xl border-2 border-primary bg-[#121212] p-2 flex items-center justify-center shadow-2xl relative group overflow-hidden">
            <img
              src={selectedAvatar}
              alt="Avatar principal"
              className="w-full h-full object-contain transition-transform group-hover:scale-110"
            />
          </div>
          <span className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-primary border border-black text-[10px] font-mono font-bold text-white uppercase tracking-wider shadow-lg">
            Nív. {currentLevel}
          </span>
        </div>

        {/* User Quick Info */}
        <div className="space-y-2 text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <h2 className="text-2xl font-display font-black text-white tracking-tight">
              {user.username}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-mono text-zinc-400">
              ID: #{user.id}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-mono font-semibold text-primary uppercase tracking-wide">
              {getLevelTitle(currentLevel)}
            </span>
            {user.plan && user.plan !== "free" ? (
              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wide flex items-center gap-1 shadow-sm
                ${user.plan === 'ultra' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                  user.plan === 'premium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                  'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                {user.plan === 'ultra' ? 'Plano Ultra' : user.plan === 'premium' ? 'Plano Premium' : 'Plano Pro'}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-zinc-500/10 border border-zinc-500/20 text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wide">
                Plano Gratuito
              </span>
            )}
          </div>
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-mono text-zinc-500 pt-1 mb-2">
            <span>@{user.username.toLowerCase().replace(/\s+/g, "")}</span>
            <span>•</span>
            <span>{user.email}</span>
          </div>
          <p className="text-xs text-zinc-400 font-sans max-w-md italic">
            "{bio || "Adoro ouvir música e baixar mídias!"}"
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-mono text-zinc-500 pt-1">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Desde {formattedJoinDate}</span>
            <span className="text-zinc-700">•</span>
            <span className="flex items-center gap-1.5 text-zinc-400"><Database className="w-3.5 h-3.5" /> Pontuação: {activeScore}</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          id="btn-profile-logout"
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-rose-500/10 hover:border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>

      {/* Gamification Level Status Bar */}
      <div className="bg-[#0b0b0b] border border-white/5 p-5 rounded-2xl shadow-xl space-y-3">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="font-mono text-zinc-400">Progresso do Nível {currentLevel}</span>
          </div>
          <span className="font-mono font-bold text-zinc-300">
            {activeScore} / {nextLevelScore} pts
          </span>
        </div>
        <div className="w-full bg-[#181818] h-3 rounded-full overflow-hidden border border-white/5 p-0.5">
          <div 
            className="bg-primary h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-zinc-500">
          <span>Nível {currentLevel} ({getLevelTitle(currentLevel)})</span>
          <span>Próximo nível em {nextLevelScore - activeScore} pontos</span>
        </div>
      </div>

      {/* Profile Sections & Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "profile"
              ? "bg-primary text-white shadow-lg"
              : "bg-[#111111]/40 text-zinc-400 hover:text-white border border-white/5 hover:bg-[#111111]"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Perfil & Preferências</span>
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "security"
              ? "bg-primary text-white shadow-lg"
              : "bg-[#111111]/40 text-zinc-400 hover:text-white border border-white/5 hover:bg-[#111111]"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Alterar Senha</span>
        </button>
        <button
          onClick={() => setActiveTab("achievements")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "achievements"
              ? "bg-primary text-white shadow-lg"
              : "bg-[#111111]/40 text-zinc-400 hover:text-white border border-white/5 hover:bg-[#111111]"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Conquistas & Insights</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-primary text-white shadow-lg"
              : "bg-[#111111]/40 text-zinc-400 hover:text-white border border-white/5 hover:bg-[#111111]"
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Histórico Detalhado ({historyCount})</span>
        </button>
        <button
          onClick={() => setActiveTab("giftcards")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "giftcards"
              ? "bg-primary text-white shadow-lg"
              : "bg-[#111111]/40 text-zinc-400 hover:text-white border border-white/5 hover:bg-[#111111]"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Gift Cards</span>
        </button>
      </div>

      {/* Tab Panels with AnimatePresence */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Profile Details Edit Form */}
              <div className="md:col-span-2 bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                    Editar Detalhes do Perfil
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">Altere sua assinatura de usuário, avatar e tema de cores do painel.</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {profileError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono">
                      {profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{profileSuccess}</span>
                    </div>
                  )}

                  {/* Input Username */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                      Nome de Usuário
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors font-sans"
                    />
                  </div>

                  {/* Input Bio */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                      Assinatura / Biografia
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Escreva sobre suas mídias favoritas..."
                      className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors resize-none font-sans"
                    />
                  </div>

                  {/* Select Avatar Preset */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                      Escolha seu Estilo de Avatar
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {avatarPresets.map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedAvatar(preset.url)}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                            selectedAvatar === preset.url
                              ? "border-primary bg-primary/10 shadow-lg scale-105"
                              : "border-white/5 bg-[#111111]/30 hover:border-white/10 hover:bg-[#111111]"
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-10 h-10 object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Accent Color Theme */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                      Tema de Cor de Destaque (Accent Theme)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {themePresets.map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => setSelectedTheme(preset.key)}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                            selectedTheme === preset.key
                              ? "border-primary bg-primary/10 shadow-md scale-105"
                              : "border-white/5 bg-[#111111]/30 hover:border-white/10 hover:bg-[#111111]"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full ${preset.color} border border-white/20 shadow-sm`} />
                          <span className="text-[11px] font-semibold text-gray-300 font-mono">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="bg-primary hover:bg-rose-500 text-white font-semibold rounded-xl px-6 py-3.5 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando alterações...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Salvar Informações</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Server Info Side card */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
                <div className="space-y-5">
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-3">
                    Conexão & Segurança
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 uppercase">
                        <Database className="w-3.5 h-3.5" /> Banco de Dados Ativo
                      </span>
                      <p className="text-xs text-zinc-400 font-mono bg-emerald-950/10 border border-emerald-900/20 p-2.5 rounded-xl leading-relaxed">
                        PostgreSQL Database
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-sky-400 uppercase">
                        <Shield className="w-3.5 h-3.5" /> Criptografia de Ponta
                      </span>
                      <p className="text-xs text-zinc-400 font-mono bg-[#111111] border border-white/5 p-2.5 rounded-xl leading-relaxed">
                        JSON Web Tokens (JWT) + Hashing Bcrypt
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-500 uppercase">
                        <Key className="w-3.5 h-3.5" /> Busca Aprimorada Activa
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-relaxed bg-[#111111] border border-white/5 p-2.5 rounded-xl font-sans">
                        Seu buscador utiliza o módulo inteligente <b>yt-search</b> para carregar vídeos com alto desempenho sem rate-limits do YouTube.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 text-center text-[10px] text-zinc-600 font-mono">
                  Powered by ATTO Premium
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl mx-auto bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl"
            >
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  Alteração de Senha Segura
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Sua nova senha deve possuir no mínimo 6 caracteres contendo letras e números.</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                {passwordError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Sua senha de login atual..."
                    className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors font-mono"
                  />
                </div>

                {/* New Password */}
                <div className="space-y-1.5 font-mono">
                  <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Sua nova senha super secreta..."
                    className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors font-mono"
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5 font-mono">
                  <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha secreta..."
                    className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full bg-primary hover:bg-rose-500 text-white font-semibold rounded-xl py-3.5 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Alterando senha no Postgres...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Atualizar Senha Secreta</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === "achievements" && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Analytics Summary + Recharts chart */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Stats Counter Boxes */}
                <div className="space-y-4">
                  <div className="bg-[#0c0c0c] border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Favoritos Adicionados</p>
                      <h4 className="text-3xl font-display font-black text-white mt-1">{favoritesCount}</h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <Heart className="w-5 h-5 fill-rose-500/10" />
                    </div>
                  </div>

                  <div className="bg-[#0c0c0c] border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Consultas Efetuadas</p>
                      <h4 className="text-3xl font-display font-black text-white mt-1">{historyCount}</h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                      <Search className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-[#0c0c0c] border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Conquistas Desbloqueadas</p>
                      <h4 className="text-3xl font-display font-black text-white mt-1">
                        {achievements.filter(a => a.unlocked).length} <span className="text-sm font-sans font-medium text-zinc-500">de {achievements.length}</span>
                      </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Award className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Recharts Graphical Distribution */}
                <div className="md:col-span-2 bg-[#0c0c0c] border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                      Distribuição de Preferências por Plataforma
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Visão detalhada sobre quais mídias você mais favoritou no sistema.</p>
                  </div>

                  {platformStats.length > 0 ? (
                    <div className="w-full h-44 flex items-center justify-center mt-3 font-mono">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={platformStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                          <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}
                            labelStyle={{ color: "#ffffff", fontWeight: "bold", fontSize: "11px" }}
                            itemStyle={{ color: "#f43f5e", fontSize: "11px" }}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {platformStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="w-full h-40 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl bg-[#111111]/10 p-4 mt-4">
                      <HelpCircle className="w-8 h-8 text-zinc-600 animate-pulse" />
                      <p className="text-xs text-zinc-500 text-center mt-2 max-w-xs font-sans">
                        Favoritos vazios. Adicione mídias de música ou vídeo para gerar gráficos informativos de seu perfil.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4 items-center justify-center text-[10px] font-mono text-zinc-500 pt-2 border-t border-white/5">
                    {platformStats.map((stat, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                        {stat.name} ({stat.value})
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Achievements Badges Grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2">
                  Biblioteca de Conquistas de Usuário
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((ach) => {
                    const IconComp = ach.icon;
                    return (
                      <div 
                        key={ach.id}
                        className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                          ach.unlocked 
                            ? "bg-[#111111]/40 border-white/5 hover:border-white/10 hover:shadow-lg hover:scale-[1.01]" 
                            : "bg-[#111111]/10 border-white/5 opacity-50"
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ach.unlocked ? ach.color : 'from-zinc-800 to-zinc-900'} p-3 flex items-center justify-center text-white shrink-0 shadow-lg`}>
                          <IconComp className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h5 className={`text-xs font-mono font-bold ${ach.unlocked ? "text-white" : "text-zinc-500"}`}>
                              {ach.title}
                            </h5>
                            {ach.unlocked && <span className="px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] uppercase font-mono rounded">Desbloqueado</span>}
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{ach.desc}</p>
                          {ach.progress && !ach.unlocked && (
                            <span className="text-[9px] font-mono text-zinc-500 block pt-1">Progresso: {ach.progress}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Detailed search queries list */}
              <div className="bg-[#0c0c0c] border border-white/5 p-6 rounded-2xl space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                      Linha do Tempo de Pesquisas
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">Clique em uma busca anterior para rodá-la no painel explorador instantaneamente.</p>
                  </div>

                  {/* Clear Button */}
                  {history.length > 0 && (
                    <button
                      onClick={() => setShowClearHistoryConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/10 hover:border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-xs font-bold font-mono transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar Histórico</span>
                    </button>
                  )}
                </div>

                {/* History interactive timeline list */}
                {history.length > 0 ? (
                  <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    {history.map((item, idx) => {
                      const timeString = new Date(item.timestamp).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                      const dateString = new Date(item.timestamp).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit"
                      });

                      return (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-[#111111]/20 hover:bg-[#111111]/60 group transition-all"
                        >
                          <button
                            onClick={() => onSearchQuery && onSearchQuery(item.query)}
                            className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                          >
                            <span className="text-[10px] font-mono text-zinc-600 bg-white/5 border border-white/5 px-2 py-0.5 rounded flex flex-col items-center">
                              <span>{dateString}</span>
                              <span className="font-bold text-zinc-400">{timeString}</span>
                            </span>
                            <div>
                              <p className="text-xs font-mono font-semibold text-white group-hover:text-primary transition-colors flex items-center gap-1.5">
                                <Search className="w-3 h-3 text-zinc-500 group-hover:text-primary transition-colors" />
                                {item.query}
                              </p>
                            </div>
                          </button>

                          {/* Individual item delete */}
                          {onRemoveHistoryItem && (
                            <button
                              onClick={() => onRemoveHistoryItem(item.query)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all cursor-pointer"
                              title="Remover busca"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl bg-[#111111]/5">
                    <Search className="w-10 h-10 text-zinc-700 animate-pulse" />
                    <p className="text-xs text-zinc-500 mt-2 font-mono">Histórico de buscas limpo ou inexistente.</p>
                  </div>
                )}
              </div>

              {/* Danger Zone Controls (Durable deletion triggers) */}
              <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-2xl space-y-4">
                <div>
                  <h4 className="text-xs font-mono font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-500" /> DANGER ZONE (ZONA DE PERIGO)
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Operações críticas e irreversíveis sobre a sua conta.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => setShowClearFavoritesConfirm(true)}
                    className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold font-mono text-xs rounded-xl p-3.5 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>Apagar Todos os Favoritos</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "giftcards" && (
            <motion.div
              key="giftcards"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-xl mx-auto space-y-6"
            >
              <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                <div>
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary" /> Resgatar Gift Card
                  </h3>
                  <p className="text-xs text-zinc-500 mt-2 font-sans">
                    Insira o código do seu Gift Card abaixo para resgatar benefícios exclusivos, como ATTO Coins ou planos premium de assinatura.
                  </p>
                </div>

                <form onSubmit={handleRedeemGiftCard} className="space-y-5 relative z-10">
                  {giftCardMessage && (
                    <div className={`p-4 rounded-xl text-xs font-mono flex items-center gap-3 ${
                      giftCardMessage.type === "success" 
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                    }`}>
                      {giftCardMessage.type === "success" ? <Award className="w-5 h-5 shrink-0" /> : <Shield className="w-5 h-5 shrink-0" />}
                      <span className="leading-relaxed">{giftCardMessage.text}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                      Código do Cartão
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={giftCardCode}
                        onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                        placeholder="EX: ATTO-XXXX-YYYY-ZZZZ"
                        className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-4 pl-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono tracking-widest"
                      />
                      <Key className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRedeemingCard || !giftCardCode.trim()}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold font-mono rounded-xl px-6 py-4 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRedeemingCard ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Resgatando...</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-5 h-5" />
                        <span>Ativar Benefício</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Status card to show current coins/plan */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                    <span className="text-zinc-500 text-[10px] font-mono uppercase font-bold tracking-wider mb-1">Meu Plano</span>
                    <span className="text-lg font-black text-white capitalize">{user.plan || 'Free'}</span>
                 </div>
                 <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                    <span className="text-zinc-500 text-[10px] font-mono uppercase font-bold tracking-wider mb-1">ATTO Coins</span>
                    <span className="text-lg font-black text-amber-500">{user.coins || 0}</span>
                 </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modals */}
      {/* Clear History Confirmation */}
      {showClearHistoryConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono">
          <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" /> Confirmar Limpeza
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Você tem certeza de que deseja apagar todo o seu histórico de buscas recentes do banco de dados? Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowClearHistoryConfirm(false)}
                className="flex-1 bg-white/5 border border-white/5 hover:bg-[#181818] text-zinc-400 text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={async () => {
                  await onClearHistory();
                  setShowClearHistoryConfirm(false);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Favorites Confirmation */}
      {showClearFavoritesConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono">
          <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" /> Confirmar Exclusão
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Você tem certeza de que deseja excluir TODAS as suas mídias salvas na seção de Favoritos? Essa ação é imediata e irreversível.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowClearFavoritesConfirm(false)}
                className="flex-1 bg-white/5 border border-white/5 hover:bg-[#181818] text-zinc-400 text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await onClearFavorites();
                  setShowClearFavoritesConfirm(false);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Excluir Favoritos
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
