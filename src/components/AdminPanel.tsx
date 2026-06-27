import React, { useState, useEffect } from "react";
import { Users, Database, Star, Search, Shield, Settings, Trash2, Edit3, Key, Clock, Sparkles, RefreshCw, BarChart2, ListTodo, Check, X, AlertTriangle, ShieldCheck, Heart } from "lucide-react";
import * as Lucide from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

interface UserAdminRow {
  id: number;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  role: string;
  created_at: string;
  favorites_count: number;
  search_count: number;
}

interface AdminStats {
  totalUsers: number;
  totalFavorites: number;
  totalQueries: number;
  platformBreakdown: { platform: string; count: string }[];
  topActiveUsers: { username: string; search_count: string }[];
}

interface ActivityLogs {
  searches: { id: number; query: string; timestamp: string; username: string; email: string; avatar: string }[];
  favorites: { id: number; title: string; platform: string; created_at: string; username: string; email: string; avatar: string }[];
}

interface AdminPanelProps {
  token: string;
  currentUser: any;
  customPlatforms?: any[];
  onRefreshPlatforms: () => void;
}

export function AdminPanel({ token, currentUser, customPlatforms = [], onRefreshPlatforms }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "logs" | "platforms">("stats");
  const [users, setUsers] = useState<UserAdminRow[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<ActivityLogs | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit User modal state
  const [editingUser, setEditingUser] = useState<UserAdminRow | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Search filter for user table
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Dynamic Platform Config tab states
  const [editingPlatform, setEditingPlatform] = useState<any | null>(null);
  const [isAddingPlatform, setIsAddingPlatform] = useState(false);
  const [platformKey, setPlatformKey] = useState("");
  const [platformName, setPlatformName] = useState("");
  const [platformIcon, setPlatformIcon] = useState("Music");
  const [platformPrimaryUrl, setPlatformPrimaryUrl] = useState("");
  const [platformFallbackUrl, setPlatformFallbackUrl] = useState("");
  const [platformApiKeyOverride, setPlatformApiKeyOverride] = useState("");
  const [platformIsEnabled, setPlatformIsEnabled] = useState(true);
  const [isSavingPlatform, setIsSavingPlatform] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch statistics
      const statsRes = await fetch("/api/admin/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsRes.ok && statsData.status) {
        setStats(statsData.stats);
      }

      // Fetch users
      const usersRes = await fetch("/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersRes.ok && usersData.status) {
        setUsers(usersData.users);
      }

      // Fetch activity logs
      const logsRes = await fetch("/api/admin/logs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const logsData = await logsRes.json();
      if (logsRes.ok && logsData.status) {
        setLogs(logsData.logs);
      }
    } catch (err: any) {
      console.error("[Admin Fetch Error]:", err.message);
      setError("Não foi possível carregar as informações do Postgres. Verifique a conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Handle toggle admin role
  const handleToggleRole = async (user: UserAdminRow) => {
    if (user.id === currentUser?.id) {
      setError("Você não pode alterar seu próprio privilégio administrativo!");
      return;
    }

    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Cargo do usuário '${user.username}' atualizado para ${newRole.toUpperCase()}.`);
        setTimeout(() => setSuccess(null), 3000);
        fetchData();
      } else {
        throw new Error(data.error || "Falha ao alterar cargo.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (user: UserAdminRow) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditBio(user.bio || "");
    setEditAvatar(user.avatar);
  };

  // Save edited user profile
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSavingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          username: editUsername.trim(),
          email: editEmail.trim(),
          bio: editBio.trim(),
          avatar: editAvatar.trim(),
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Perfil do usuário '${editUsername}' atualizado com sucesso no Postgres.`);
        setTimeout(() => setSuccess(null), 3000);
        setEditingUser(null);
        fetchData();
      } else {
        throw new Error(data.error || "Falha ao atualizar.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSavingUser(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (user: UserAdminRow) => {
    if (user.id === currentUser?.id) {
      setError("Você não pode remover sua própria conta administradora!");
      return;
    }

    if (!window.confirm(`AVISO CRÍTICO: Tem certeza que deseja deletar permanentemente a conta de '${user.username}'? Todos os favoritos e logs de busca serão removidos em cascata.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Usuário removido da base de dados com sucesso.`);
        setTimeout(() => setSuccess(null), 3000);
        fetchData();
      } else {
        throw new Error(data.error || "Falha ao excluir.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle saving or updating dynamic platforms config
  const handleSavePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformKey || !platformName || !platformPrimaryUrl) {
      setError("Chave, Nome e Rota/URL Primária são obrigatórios.");
      return;
    }

    setIsSavingPlatform(true);
    setError(null);
    setSuccess(null);

    try {
      const isEdit = !!editingPlatform;
      const url = isEdit 
        ? `/api/admin/platforms/${editingPlatform.id}`
        : "/api/admin/platforms";
      const method = isEdit ? "PUT" : "POST";

      const body: any = {
        name: platformName.trim(),
        icon_name: platformIcon.trim(),
        primary_api_url: platformPrimaryUrl.trim(),
        fallback_api_url: platformFallbackUrl.trim() || null,
        api_key_override: platformApiKeyOverride.trim() || null,
        is_enabled: platformIsEnabled
      };

      if (!isEdit) {
        body.platform_key = platformKey.trim().toLowerCase();
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok && data.status) {
        setSuccess(`Configuração da plataforma '${platformName}' salva com sucesso no Postgres!`);
        setTimeout(() => setSuccess(null), 3000);
        setIsAddingPlatform(false);
        setEditingPlatform(null);
        // Clean form
        setPlatformKey("");
        setPlatformName("");
        setPlatformIcon("Music");
        setPlatformPrimaryUrl("");
        setPlatformFallbackUrl("");
        setPlatformApiKeyOverride("");
        setPlatformIsEnabled(true);
        // Trigger parent refresh
        onRefreshPlatforms();
      } else {
        throw new Error(data.error || "Erro ao salvar plataforma.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSavingPlatform(false);
    }
  };

  // Handle deleting dynamic platform config
  const handleDeletePlatform = async (platformId: number, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover permanentemente a plataforma '${name}' do sistema?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/platforms/${platformId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Plataforma '${name}' excluída com sucesso.`);
        setTimeout(() => setSuccess(null), 3000);
        onRefreshPlatforms();
      } else {
        throw new Error(data.error || "Falha ao excluir plataforma.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Open Edit Platform Dialog
  const handleOpenEditPlatform = (platform: any) => {
    setEditingPlatform(platform);
    setIsAddingPlatform(true);
    setPlatformKey(platform.platform_key);
    setPlatformName(platform.name);
    setPlatformIcon(platform.icon_name || "Music");
    setPlatformPrimaryUrl(platform.primary_api_url);
    setPlatformFallbackUrl(platform.fallback_api_url || "");
    setPlatformApiKeyOverride(platform.api_key_override || "");
    setPlatformIsEnabled(platform.is_enabled);
  };

  // Quick platform enabled toggle status
  const handleTogglePlatformStatus = async (platform: any) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/platforms/${platform.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ is_enabled: !platform.is_enabled })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Status de '${platform.name}' alterado para ${!platform.is_enabled ? "ATIVADO" : "DESATIVADO"}.`);
        setTimeout(() => setSuccess(null), 3000);
        onRefreshPlatforms();
      } else {
        throw new Error(data.error || "Falha ao alterar status.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filters for user table search
  const filteredUsers = users.filter(u => {
    return (
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearchQuery.toLowerCase())
    );
  });

  // Colors for chart visualization
  const COLORS = ["#f43f5e", "#ff8a00", "#10b981", "#06b6d4", "#a855f7"];

  return (
    <div id="admin-panel-container" className="space-y-8">
      {/* Admin Title Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/10 via-[#0d0d0d] to-[#050505] border border-red-950/20 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 text-center md:text-left z-10">
          <span className="flex items-center justify-center md:justify-start gap-1.5 text-xs font-mono font-bold text-rose-500 uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5 fill-rose-500/20" /> Painel de Controle de Alto Nível
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-white">
            Administração da Plataforma
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl">
            Painel exclusivo do administrador para controlar usuários cadastrados, monitorar estatísticas do Postgres e auditar histórico de busca global.
          </p>
        </div>

        <button
          id="btn-admin-refresh"
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/5 bg-[#111111] hover:bg-white/5 text-zinc-300 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-rose-500" : ""}`} />
          <span>{isLoading ? "CARREGANDO..." : "ATUALIZAR"}</span>
        </button>
      </div>

      {/* Error & Success Toast Status Elements */}
      {error && (
        <div id="admin-error-banner" className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <div className="flex-1">
            <span className="font-bold">Aviso Técnico: </span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 text-rose-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div id="admin-success-banner" className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs flex items-center gap-3">
          <Check className="w-5 h-5 shrink-0 text-emerald-500 animate-bounce" />
          <div className="flex-1">
            <span className="font-bold">Sucesso: </span>
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="p-1 text-emerald-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-white/5 gap-1 overflow-x-auto pb-px">
        <button
          id="btn-admin-tab-stats"
          onClick={() => setActiveTab("stats")}
          className={`px-5 py-3.5 text-xs font-mono font-bold uppercase tracking-widest border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "stats"
              ? "border-primary text-white bg-primary/5"
              : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#111111]/30"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Estatísticas Globais</span>
        </button>
        <button
          id="btn-admin-tab-users"
          onClick={() => setActiveTab("users")}
          className={`px-5 py-3.5 text-xs font-mono font-bold uppercase tracking-widest border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "users"
              ? "border-primary text-white bg-primary/5"
              : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#111111]/30"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gerenciar Usuários</span>
        </button>
        <button
          id="btn-admin-tab-logs"
          onClick={() => setActiveTab("logs")}
          className={`px-5 py-3.5 text-xs font-mono font-bold uppercase tracking-widest border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "logs"
              ? "border-primary text-white bg-primary/5"
              : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#111111]/30"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Logs de Auditoria</span>
        </button>
        <button
          id="btn-admin-tab-platforms"
          onClick={() => setActiveTab("platforms")}
          className={`px-5 py-3.5 text-xs font-mono font-bold uppercase tracking-widest border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "platforms"
              ? "border-primary text-rose-400 bg-primary/5"
              : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#111111]/30"
          }`}
        >
          <Settings className="w-4 h-4 text-rose-500" />
          <span>Redes &amp; Rotas</span>
        </button>
      </div>

      {/* Tab content 1: STATS */}
      {activeTab === "stats" && stats && (
        <div className="space-y-8">
          {/* Quick numbers Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-[#0c0c0c] border border-white/5 rounded-2xl shadow-sm space-y-2">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                <Users className="w-3.5 h-3.5 text-rose-500" /> Cadastros Totais
              </span>
              <p className="text-3xl font-display font-black text-white">{stats.totalUsers}</p>
              <p className="text-[10px] text-zinc-500">Perfis de usuários registrados no banco Postgres.</p>
            </div>
            <div className="p-6 bg-[#0c0c0c] border border-white/5 rounded-2xl shadow-sm space-y-2">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/20" /> Mídias Favoritadas
              </span>
              <p className="text-3xl font-display font-black text-emerald-400">{stats.totalFavorites}</p>
              <p className="text-[10px] text-zinc-500">Total de faixas e vídeos salvos nas playlists.</p>
            </div>
            <div className="p-6 bg-[#0c0c0c] border border-white/5 rounded-2xl shadow-sm space-y-2">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                <Search className="w-3.5 h-3.5 text-cyan-400" /> Consultas Realizadas
              </span>
              <p className="text-3xl font-display font-black text-white">{stats.totalQueries}</p>
              <p className="text-[10px] text-zinc-500">Consultas de busca salvas na tabela de histórico.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Platform breakdown chart */}
            <div className="bg-[#0c0c0c] border border-white/5 p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2.5">
                Distribuição de Favoritos por Plataforma
              </h4>
              {stats.platformBreakdown && stats.platformBreakdown.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.platformBreakdown}>
                      <XAxis dataKey="platform" stroke="#52525b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#111111", border: "1px solid #1e1e1e", borderRadius: "8px" }}
                        labelStyle={{ color: "#fff", fontWeight: "bold" }}
                      />
                      <Bar dataKey="count" name="Favoritos" radius={[4, 4, 0, 0]}>
                        {stats.platformBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 text-center py-16">Nenhum favorito registrado na plataforma ainda.</p>
              )}
            </div>

            {/* Top Active Users list */}
            <div className="bg-[#0c0c0c] border border-white/5 p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2.5">
                Ranking de Usuários Mais Ativos (Buscas)
              </h4>
              {stats.topActiveUsers && stats.topActiveUsers.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {stats.topActiveUsers.map((user, index) => (
                    <div key={user.username} className="flex items-center justify-between p-3.5 bg-[#111111]/30 border border-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-mono text-zinc-400 font-black">
                          #{index + 1}
                        </span>
                        <span className="text-xs font-semibold text-white">{user.username}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-rose-500 font-bold">{user.search_count}</span>
                        <span className="text-zinc-500">buscas</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 text-center py-16">Nenhuma busca de histórico salva.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab content 2: USERS LIST */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Search bar inside users */}
          <div className="relative max-w-md bg-[#0d0d0d] border border-white/5 p-3 rounded-xl flex items-center">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              id="admin-user-search-input"
              type="text"
              placeholder="Buscar por nome, email ou cargo..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full bg-transparent pl-10 pr-4 py-1.5 text-xs text-white focus:outline-none placeholder-zinc-600"
            />
          </div>

          {/* User database table list */}
          <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#111111]/50 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                    <th className="p-4 pl-6">Usuário / ID</th>
                    <th className="p-4">E-mail</th>
                    <th className="p-4">Cargo</th>
                    <th className="p-4 text-center">Atividades</th>
                    <th className="p-4 pr-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-zinc-500">
                        Nenhum usuário correspondente encontrado no banco PostgreSQL.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelf = user.id === currentUser?.id;
                      return (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 pl-6 flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#111111] border border-white/10 p-0.5 shrink-0 flex items-center justify-center">
                              <img src={user.avatar} alt={user.username} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{user.username}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[8px] font-mono text-rose-400">
                                    VOCÊ
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono">ID: #{user.id}</span>
                            </div>
                          </td>
                          <td className="p-4 text-zinc-300 font-mono text-[11px]">{user.email}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                              user.role === "admin"
                                ? "bg-rose-500/10 border-rose-500/25 text-rose-400"
                                : "bg-zinc-500/10 border-white/5 text-zinc-400"
                            }`}>
                              {user.role === "admin" ? (
                                <>
                                  <ShieldCheck className="w-3 h-3 text-rose-500" /> Admin
                                </>
                              ) : (
                                "User"
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-3 font-mono text-[10px]">
                              <span className="text-emerald-400 font-bold" title="Favoritos">
                                {user.favorites_count} ★
                              </span>
                              <span className="text-zinc-500">/</span>
                              <span className="text-zinc-400" title="Buscas no histórico">
                                {user.search_count} Q
                              </span>
                            </div>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Edit Profile */}
                              <button
                                id={`btn-admin-edit-${user.id}`}
                                onClick={() => handleOpenEdit(user)}
                                title="Editar Cadastro"
                                className="p-1.5 rounded-lg border border-white/5 bg-[#111111] text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Role */}
                              <button
                                id={`btn-admin-role-${user.id}`}
                                onClick={() => handleToggleRole(user)}
                                disabled={isSelf}
                                title={user.role === "admin" ? "Rebaixar para Usuário" : "Promover a Admin"}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-30 ${
                                  user.role === "admin"
                                    ? "bg-rose-500/5 border-rose-500/20 text-rose-400 hover:bg-rose-500/15"
                                    : "bg-[#111111] border-white/5 text-zinc-400 hover:text-white"
                                }`}
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Account */}
                              <button
                                id={`btn-admin-delete-${user.id}`}
                                onClick={() => handleDeleteUser(user)}
                                disabled={isSelf}
                                title="Excluir Conta Permanentemente"
                                className="p-1.5 rounded-lg border border-white/5 bg-red-950/10 hover:bg-red-950/30 text-rose-400 hover:border-red-500/30 transition-all cursor-pointer disabled:opacity-30"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab content 3: AUDIT LOGS */}
      {activeTab === "logs" && logs && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left panel: Recent Searches list */}
          <div className="bg-[#0c0c0c] border border-white/5 p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-cyan-400" /> Últimas Buscas Efetuadas
            </h4>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
              {logs.searches && logs.searches.length > 0 ? (
                logs.searches.map((search) => (
                  <div key={search.id} className="p-3 bg-[#111111]/30 border border-white/5 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={search.avatar} alt={search.username} className="w-4 h-4 rounded-full" />
                        <span className="font-bold text-white text-[11px]">{search.username}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500">
                        {new Date(Number(search.timestamp)).toLocaleTimeString("pt-BR")}
                      </span>
                    </div>
                    <p className="font-mono text-zinc-300 bg-black/40 border border-white/5 p-2 rounded-lg text-[11px] truncate">
                      "{search.query}"
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 text-center py-12">Nenhum log de busca.</p>
              )}
            </div>
          </div>

          {/* Right panel: Recent Bookmarks list */}
          <div className="bg-[#0c0c0c] border border-white/5 p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2.5 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" /> Favoritos Adicionados Recentemente
            </h4>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
              {logs.favorites && logs.favorites.length > 0 ? (
                logs.favorites.map((fav) => (
                  <div key={fav.id} className="p-3 bg-[#111111]/30 border border-white/5 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={fav.avatar} alt={fav.username} className="w-4 h-4 rounded-full" />
                        <span className="font-bold text-white text-[11px]">{fav.username}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500">
                        {new Date(fav.created_at).toLocaleTimeString("pt-BR")}
                      </span>
                    </div>
                    <div className="p-2 bg-black/40 border border-white/5 rounded-lg text-[11px] flex justify-between items-center gap-2">
                      <span className="truncate text-zinc-300 font-medium">{fav.title}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase shrink-0">
                        {fav.platform}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 text-center py-12">Nenhum favorito adicionado.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab content 4: PLATFORMS CONFIGURATION */}
      {activeTab === "platforms" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="space-y-1">
              <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Gerenciador de Redes e Rotas Dinâmicas
              </h4>
              <p className="text-xs text-zinc-500">
                Adicione novas integrações, defina as URLs de rotas primárias/fallback e ative/desative conexões com APIs do Postgres.
              </p>
            </div>
            <button
              id="btn-add-platform-trigger"
              onClick={() => {
                setEditingPlatform(null);
                setPlatformKey("");
                setPlatformName("");
                setPlatformIcon("Music");
                setPlatformPrimaryUrl("");
                setPlatformFallbackUrl("");
                setPlatformApiKeyOverride("");
                setPlatformIsEnabled(true);
                setIsAddingPlatform(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-rose-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 self-start sm:self-center shrink-0"
            >
              <Lucide.Plus className="w-4 h-4" />
              <span>Nova Rede Social</span>
            </button>
          </div>

          <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#111111]/40">
                    <th className="p-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Plataforma</th>
                    <th className="p-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Chave</th>
                    <th className="p-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Rota Primária</th>
                    <th className="p-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Rota Fallback</th>
                    <th className="p-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                    <th className="p-4 text-[10px] font-mono font-bold text-zinc-500 text-right uppercase tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {customPlatforms.length > 0 ? (
                    customPlatforms.map((platform: any) => {
                      const IconComponent = (Lucide as any)[platform.icon_name] || Lucide.Music;
                      return (
                        <tr key={platform.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-rose-500">
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-white">{platform.name}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-xs text-zinc-400">
                            {platform.platform_key}
                          </td>
                          <td className="p-4 font-mono text-xs text-zinc-300 max-w-[200px] truncate" title={platform.primary_api_url}>
                            {platform.primary_api_url}
                          </td>
                          <td className="p-4 font-mono text-xs text-zinc-500 max-w-[200px] truncate" title={platform.fallback_api_url || "Nenhuma"}>
                            {platform.fallback_api_url || <span className="italic text-zinc-600">Não configurada</span>}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleTogglePlatformStatus(platform)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                                platform.is_enabled
                                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25"
                                  : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-750"
                              }`}
                            >
                              {platform.is_enabled ? "Ativo" : "Inativo"}
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditPlatform(platform)}
                                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white transition-all"
                                title="Editar configurações"
                              >
                                <Lucide.Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePlatform(platform.id, platform.name)}
                                className="p-2 rounded-lg bg-zinc-900 hover:bg-rose-950/30 border border-white/5 text-zinc-500 hover:text-rose-400 transition-all"
                                title="Remover plataforma"
                              >
                                <Lucide.Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-xs text-zinc-500">
                        Nenhuma plataforma ou rede social configurada na base do Postgres.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Adding / Editing Platform Modal */}
      {isAddingPlatform && (
        <div id="admin-platform-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative my-8">
            <button
              id="btn-admin-platform-modal-close"
              onClick={() => {
                setIsAddingPlatform(false);
                setEditingPlatform(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-3 animate-pulse">
                <Settings className="w-5 h-5 text-rose-500" />
              </div>
              <h2 className="text-lg font-display font-extrabold text-white">
                {editingPlatform ? "Editar Rede Social" : "Cadastrar Nova Rede Social"}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Defina as rotas da API e as credenciais integradas no Postgres</p>
            </div>

            <form onSubmit={handleSavePlatform} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Platform Key (Disabled if editing) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Chave de Busca (ID único)</label>
                  <input
                    id="platform-form-key"
                    type="text"
                    required
                    disabled={!!editingPlatform}
                    placeholder="ex: instagram"
                    value={platformKey}
                    onChange={(e) => setPlatformKey(e.target.value)}
                    className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 disabled:opacity-50"
                  />
                </div>

                {/* Display Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Nome de Exibição</label>
                  <input
                    id="platform-form-name"
                    type="text"
                    required
                    placeholder="ex: Instagram"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Icon Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Ícone de Exibição</label>
                  <select
                    id="platform-form-icon"
                    value={platformIcon}
                    onChange={(e) => setPlatformIcon(e.target.value)}
                    className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50"
                  >
                    <option value="Music">Música (Music)</option>
                    <option value="Youtube">YouTube (Youtube)</option>
                    <option value="Play">Player (Play)</option>
                    <option value="Film">Filme (Film)</option>
                    <option value="Compass">Bússola (Compass)</option>
                    <option value="Heart">Coração (Heart)</option>
                    <option value="Settings">Engrenagem (Settings)</option>
                    <option value="Shield">Escudo (Shield)</option>
                    <option value="User">Usuário (User)</option>
                  </select>
                </div>

                {/* Status Switch */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block font-bold">Status Inicial</label>
                  <div className="flex items-center h-[38px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={platformIsEnabled}
                        onChange={(e) => setPlatformIsEnabled(e.target.checked)}
                        className="rounded bg-[#111111] border-white/5 text-rose-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-zinc-300">Habilitar Plataforma</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Primary API Url */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Rota / URL Primária</label>
                <input
                  id="platform-form-primary"
                  type="text"
                  required
                  placeholder="ex: https://api.zero-two.com/soundcloud/search"
                  value={platformPrimaryUrl}
                  onChange={(e) => setPlatformPrimaryUrl(e.target.value)}
                  className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
                <span className="text-[9px] text-zinc-500 block">Endpoint principal acionado nas buscas e resoluções desta rede.</span>
              </div>

              {/* Fallback API Url */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Rota / URL de Fallback (Opcional)</label>
                <input
                  id="platform-form-fallback"
                  type="text"
                  placeholder="ex: https://api-fallback.com/soundcloud/search"
                  value={platformFallbackUrl}
                  onChange={(e) => setPlatformFallbackUrl(e.target.value)}
                  className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
                <span className="text-[9px] text-zinc-500 block">Acionado automaticamente em caso de instabilidade ou erro na rota primária.</span>
              </div>

              {/* Custom API Key Override */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Chave de API / Token Exclusivo (Opcional)</label>
                <input
                  id="platform-form-apikey"
                  type="text"
                  placeholder="Token de autorização ou chave de acesso personalizado"
                  value={platformApiKeyOverride}
                  onChange={(e) => setPlatformApiKeyOverride(e.target.value)}
                  className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>

              {/* Save platform button */}
              <button
                id="btn-admin-platform-submit"
                type="submit"
                disabled={isSavingPlatform}
                className="w-full bg-primary hover:bg-rose-500 text-white font-bold font-mono uppercase tracking-widest py-3 text-[10px] rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all disabled:opacity-55 mt-4"
              >
                {isSavingPlatform ? "Salvando Configurações..." : "Confirmar e Salvar Configuração"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Editing User Dialog / Modal */}
      {editingUser && (
        <div id="admin-user-edit-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative">
            <button
              id="btn-admin-edit-modal-close"
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto mb-3">
                <Edit3 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-display font-extrabold text-white">Editar Perfil do Usuário</h2>
              <p className="text-xs text-zinc-500 mt-1">Alterar dados cadastrais armazenados no PostgreSQL</p>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-left">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Nome de Usuário</label>
                <input
                  id="admin-edit-username"
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">E-mail de Cadastro</label>
                <input
                  id="admin-edit-email"
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>

              {/* Bio Textarea */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Biografia / Status</label>
                <textarea
                  id="admin-edit-bio"
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 resize-none"
                />
              </div>

              {/* Save profile */}
              <button
                id="btn-admin-edit-submit"
                type="submit"
                disabled={isSavingUser}
                className="w-full bg-primary hover:bg-rose-500 text-white font-bold font-mono uppercase tracking-widest py-3 text-[10px] rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all disabled:opacity-55"
              >
                {isSavingUser ? "Salvando Alterações..." : "Confirmar Alterações"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
