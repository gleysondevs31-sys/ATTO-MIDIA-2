import React, { useState } from "react";
import { User, Shield, Key, Database, LayoutGrid, Heart, Sparkles, Loader2, Save, LogOut } from "lucide-react";
import { NormalizedMedia } from "../types";

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
  };
  onUpdateProfile: (updatedData: { username?: string; avatar?: string; bio?: string }) => Promise<boolean>;
  onLogout: () => void;
  favoritesCount: number;
  historyCount: number;
}

export function ProfileView({
  user,
  onUpdateProfile,
  onLogout,
  favoritesCount,
  historyCount,
}: ProfileViewProps) {
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || "");
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // High-contrast, beautifully styled pre-set avatars from dicebear
  const avatarPresets = [
    { name: "Robô Futurista", url: "https://api.dicebear.com/7.x/bottts/svg?seed=zerotwo" },
    { name: "Pixel Art Hero", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=attonet" },
    { name: "Gatinho Retrô", url: "https://api.dicebear.com/7.x/identicon/svg?seed=luna" },
    { name: "Monstrinho Fofo", url: "https://api.dicebear.com/7.x/miniavs/svg?seed=cyber" },
    { name: "Aventureiro Espacial", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=star" },
    { name: "Gamer Cyberpunk", url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=game" },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!username.trim()) {
      setError("O nome de usuário não pode estar vazio.");
      setIsLoading(false);
      return;
    }

    try {
      const ok = await onUpdateProfile({
        username: username.trim(),
        bio: bio.trim(),
        avatar: selectedAvatar,
      });

      if (ok) {
        setSuccess("Perfil atualizado e salvo com sucesso no PostgreSQL!");
        setTimeout(() => setSuccess(null), 4000);
      } else {
        throw new Error("Falha na atualização de perfil no banco.");
      }
    } catch (err: any) {
      console.error("[Profile Update Error]:", err.message);
      setError(err.message || "Erro de validação ou de rede ao atualizar perfil.");
    } finally {
      setIsLoading(false);
    }
  };

  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Data desconhecida";

  return (
    <div id="profile-view-container" className="space-y-8 max-w-4xl mx-auto">
      {/* Welcome & Overview Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d0d0d] to-[#050505] border border-white/5 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        {/* User Large Avatar */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-2xl border-2 border-primary bg-[#111111] p-2 flex items-center justify-center shadow-xl">
            <img
              src={selectedAvatar}
              alt="Avatar principal"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-rose-500 border border-black text-[9px] font-mono font-bold text-white uppercase tracking-wider shadow-md">
            {user.role}
          </span>
        </div>

        {/* User quick info */}
        <div className="space-y-1.5 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">
              {user.username}
            </h2>
            <span className="px-2.5 py-0.5 rounded-md bg-[#111111] border border-white/5 text-[10px] font-mono text-zinc-400">
              ID: #{user.id}
            </span>
          </div>
          <p className="text-xs font-mono text-zinc-500">{user.email}</p>
          <p className="text-xs text-zinc-400 max-w-md">
            Membro desde: <b className="text-white font-mono">{formattedDate}</b>
          </p>
        </div>

        {/* Logout Button */}
        <button
          id="btn-profile-logout"
          onClick={onLogout}
          className="md:ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/10 hover:border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>

      {/* Stats Bento Grid Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Favorites Stat */}
        <div className="flex items-center gap-4 bg-[#111111]/40 border border-white/5 p-5 rounded-2xl shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Heart className="w-6 h-6 fill-rose-500/10" />
          </div>
          <div>
            <h3 className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
              Favoritos Salvos
            </h3>
            <p className="text-2xl font-display font-black text-white">{favoritesCount}</p>
          </div>
        </div>

        {/* History Stat */}
        <div className="flex items-center gap-4 bg-[#111111]/40 border border-white/5 p-5 rounded-2xl shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
              Buscas Recentes
            </h3>
            <p className="text-2xl font-display font-black text-white">{historyCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="md:col-span-2 bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-3">
            Editar Perfil de Usuário
          </h3>

          <form onSubmit={handleSave} className="space-y-6">
            {error && (
              <div id="profile-error-banner" className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
                {error}
              </div>
            )}
            {success && (
              <div id="profile-success-banner" className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
                {success}
              </div>
            )}

            {/* Input Username */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                Nome de Usuário
              </label>
              <input
                id="profile-input-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Input Bio */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                Biografia / Status
              </label>
              <textarea
                id="profile-input-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Escreva algo sobre você..."
                className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors resize-none"
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
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      selectedAvatar === preset.url
                        ? "border-primary bg-primary/10 shadow-md scale-105"
                        : "border-white/5 bg-[#111111]/30 hover:border-white/10 hover:bg-[#111111]"
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-10 h-10 object-contain" />
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              id="btn-profile-save"
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-rose-500 text-white font-semibold rounded-xl px-6 py-3 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-900/10 active:scale-95 disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando no Postgres...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Technical connection details (Sidebar-style inside profile view) */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-3 mb-4">
              Status da Conexão
            </h3>

            <div className="space-y-4">
              {/* Database Host */}
              <div className="space-y-1">
                <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-500 uppercase">
                  <Database className="w-3 h-3 text-emerald-400" /> Banco de Dados ATIVO
                </span>
                <p className="text-xs text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-lg break-all leading-normal">
                  Railway PostgreSQL
                </p>
              </div>

              {/* Security Level */}
              <div className="space-y-1">
                <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-500 uppercase">
                  <Shield className="w-3 h-3 text-sky-400" /> Criptografia de Sessão
                </span>
                <p className="text-xs text-zinc-400 font-mono bg-[#111111] border border-white/5 p-2.5 rounded-lg leading-relaxed">
                  JSON Web Tokens (JWT) + Hash Bcrypt
                </p>
              </div>

              {/* API Security */}
              <div className="space-y-1">
                <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-500 uppercase">
                  <Key className="w-3 h-3 text-amber-500" /> Chaves Privadas
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed bg-[#111111] border border-white/5 p-2.5 rounded-lg font-sans">
                  Suas requisições utilizam proxies isolados no servidor. Chaves de API nunca são expostas ao browser devtools.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-center text-[10px] text-zinc-600 font-mono">
            <span>Powered by ATTO Universal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
