import React, { useState, useEffect } from "react";
import { Users, Database, Star, Search, Shield, Settings, Trash2, Edit3, Key, Clock, Sparkles, RefreshCw, BarChart2, ListTodo, Check, X, AlertTriangle, ShieldCheck, Heart, Megaphone, CreditCard } from "lucide-react";
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

interface AdminGiftCard {
  id: number;
  code: string;
  type: string;
  value: number;
  max_uses: number;
  uses: number;
  is_active: boolean;
  created_at: string;
  created_by_username: string;
}

interface AdminPanelProps {
  token: string;
  currentUser: any;
  customPlatforms?: any[];
  onRefreshPlatforms: () => void;
}

export function AdminPanel({ token, currentUser, customPlatforms = [], onRefreshPlatforms }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "logs" | "platforms" | "giftcards" | "banners" | "diagnostics" | "setup">("stats");
  const [users, setUsers] = useState<UserAdminRow[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<ActivityLogs | null>(null);
  const [giftCards, setGiftCards] = useState<AdminGiftCard[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
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

  // Gift Card Admin states
  const [isAddingGiftCard, setIsAddingGiftCard] = useState(false);
  const [gcCode, setGcCode] = useState("");
  const [gcType, setGcType] = useState("coins");
  const [gcValue, setGcValue] = useState(100);
  const [gcMaxUses, setGcMaxUses] = useState(1);
  const [isSavingGiftCard, setIsSavingGiftCard] = useState(false);

  // Diagnostics states
  const [diagnosticResult, setDiagnosticResult] = useState<any | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  
  // MercadoPago Status Polling
  const [mpStatus, setMpStatus] = useState<{ status: 'active' | 'invalid' | 'loading', details?: any }>({ status: 'loading' });

  const pollMpStatus = async () => {
    try {
      const res = await fetch("/api/payments/debug", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setMpStatus({ status: 'active', details: data.data });
      } else {
        setMpStatus({ status: 'invalid' });
      }
    } catch (err) {
      setMpStatus({ status: 'invalid' });
    }
  };

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setDiagnosticResult(null);
    try {
      const res = await fetch("/api/payments/debug", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setDiagnosticResult(data);
    } catch (err: any) {
      setDiagnosticResult({ status: "error", message: err.message });
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  // Setup checklist state
  const [setupChecklist, setSetupChecklist] = useState({ step1: false, step2: false, step3: false, step4: false });
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [isLoadingWebhookLogs, setIsLoadingWebhookLogs] = useState(false);

  const fetchWebhookLogs = async () => {
    setIsLoadingWebhookLogs(true);
    try {
      const res = await fetch("/api/admin/webhooks/mercadopago", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWebhookLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch webhook logs", err);
    } finally {
      setIsLoadingWebhookLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "diagnostics") {
      fetchWebhookLogs();
    }
  }, [activeTab]);

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

      // Fetch gift cards
      const giftCardsRes = await fetch("/api/admin/gift-cards", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const giftCardsData = await giftCardsRes.json();
      if (giftCardsRes.ok && giftCardsData.status) {
        setGiftCards(giftCardsData.giftCards);
      }

      // Fetch banners
      const bannersRes = await fetch("/api/admin/banners", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const bannersData = await bannersRes.json();
      if (bannersRes.ok && bannersData.status) {
        setBanners(bannersData.banners);
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
      pollMpStatus(); // Initial check
      const mpInterval = setInterval(pollMpStatus, 30000); // Poll every 30s
      return () => clearInterval(mpInterval);
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

  // Gift Card Handlers
  const handleSaveGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSavingGiftCard(true);

    try {
      const res = await fetch("/api/admin/gift-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          code: gcCode.trim().toUpperCase(),
          type: gcType,
          value: gcValue,
          max_uses: gcMaxUses
        })
      });
      const data = await res.json();
      
      if (res.ok && data.status) {
        setSuccess("Gift Card criado com sucesso!");
        setTimeout(() => setSuccess(null), 3000);
        setIsAddingGiftCard(false);
        setGcCode("");
        setGcValue(100);
        setGcMaxUses(1);
        fetchData();
      } else {
        throw new Error(data.error || "Erro ao criar Gift Card.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSavingGiftCard(false);
    }
  };

  const handleDeleteGiftCard = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este Gift Card?")) return;

    try {
      const res = await fetch(`/api/admin/gift-cards/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.status) {
        setSuccess("Gift Card removido com sucesso!");
        setTimeout(() => setSuccess(null), 3000);
        fetchData();
      } else {
        throw new Error(data.error || "Erro ao remover Gift Card.");
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
        <button
          id="btn-admin-tab-giftcards"
          onClick={() => setActiveTab("giftcards")}
          className={`px-5 py-3.5 text-xs font-mono font-bold uppercase tracking-widest border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "giftcards"
              ? "border-primary text-rose-400 bg-primary/5"
              : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#111111]/30"
          }`}
        >
          <Key className="w-4 h-4 text-amber-500" />
          <span>Gift Cards</span>
        </button>
        <button
          id="btn-admin-tab-banners"
          onClick={() => setActiveTab("banners")}
          className={`px-5 py-3.5 text-xs font-mono font-bold uppercase tracking-widest border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "banners"
              ? "border-primary text-rose-400 bg-primary/5"
              : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#111111]/30"
          }`}
        >
          <Megaphone className="w-4 h-4 text-cyan-500" />
          <span>Banners</span>
        </button>
        <button
          id="btn-admin-tab-diagnostics"
          onClick={() => setActiveTab("diagnostics")}
          className={`px-5 py-3.5 text-xs font-mono font-bold uppercase tracking-widest border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "diagnostics"
              ? "border-primary text-emerald-400 bg-primary/5"
              : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#111111]/30"
          }`}
        >
          <Lucide.Terminal className="w-4 h-4 text-emerald-500" />
          <span>Diagnósticos</span>
        </button>
        <button
          id="btn-admin-tab-setup"
          onClick={() => setActiveTab("setup")}
          className={`px-5 py-3.5 text-xs font-mono font-bold uppercase tracking-widest border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "setup"
              ? "border-primary text-blue-400 bg-primary/5"
              : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#111111]/30"
          }`}
        >
          <Lucide.BookOpen className="w-4 h-4 text-blue-500" />
          <span>Setup Guide</span>
        </button>
      </div>

      {/* Tab content 1: STATS */}
      {activeTab === "stats" && stats && (
        <div className="space-y-8">
          {/* Quick numbers Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* MercadoPago Status Card */}
            <div className={`p-6 border rounded-2xl shadow-sm space-y-2 flex flex-col justify-between ${
              mpStatus.status === 'active' ? 'bg-emerald-500/5 border-emerald-500/20' : 
              mpStatus.status === 'invalid' ? 'bg-rose-500/5 border-rose-500/20' : 
              'bg-[#0c0c0c] border-white/5'
            }`}>
              <div>
                <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                  <CreditCard className="w-3.5 h-3.5 text-blue-500" /> API MercadoPago
                </span>
                <div className="mt-2 flex items-center gap-2">
                  {mpStatus.status === 'loading' ? (
                    <><RefreshCw className="w-5 h-5 text-zinc-500 animate-spin" /><p className="text-xl font-display font-black text-zinc-400">Verificando...</p></>
                  ) : mpStatus.status === 'active' ? (
                    <><Check className="w-5 h-5 text-emerald-400" /><p className="text-xl font-display font-black text-emerald-400">Ativo</p></>
                  ) : (
                    <><AlertTriangle className="w-5 h-5 text-rose-500" /><p className="text-xl font-display font-black text-rose-500">Inválido/Expirado</p></>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">
                {mpStatus.status === 'active' && mpStatus.details ? `Conectado: ${mpStatus.details.first_name}` : 
                 mpStatus.status === 'invalid' ? 'Token recusado ou não configurado.' : 
                 'Aguardando resposta da API...'}
              </p>
            </div>

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

      {/* Tab content 5: GIFT CARDS */}
      {activeTab === "giftcards" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">Gerenciamento de Gift Cards</h3>
              <p className="text-xs text-zinc-500">Crie, monitore e remova Gift Cards promocionais.</p>
            </div>
            <button
              onClick={() => setIsAddingGiftCard(true)}
              className="px-4 py-2 bg-primary hover:bg-rose-500 text-white font-bold font-mono text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-500/20 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" /> Adicionar Novo Código
            </button>
          </div>

          <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5 bg-black/40">
                  <th className="px-5 py-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Código (Chave)</th>
                  <th className="px-5 py-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Tipo &amp; Valor</th>
                  <th className="px-5 py-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Utilização (Atual / Max)</th>
                  <th className="px-5 py-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Status / Criador</th>
                  <th className="px-5 py-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs text-zinc-300">
                {giftCards.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-zinc-500">Nenhum gift card encontrado. Crie o primeiro acima.</td>
                  </tr>
                ) : (
                  giftCards.map(gc => (
                    <tr key={gc.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap font-bold text-white">
                         <div className="flex items-center gap-2">
                           <Key className="w-3 h-3 text-amber-500" />
                           {gc.code}
                         </div>
                      </td>
                      <td className="px-5 py-4">
                         <span className={`px-2 py-1 rounded-md text-[9px] uppercase tracking-wider font-bold ${
                            gc.type === 'coins' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
                         }`}>
                           {gc.type}
                         </span>
                         <span className="ml-2 font-bold">{gc.value}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                           <div className="w-full bg-white/5 rounded-full h-1.5 flex-1 max-w-[80px]">
                              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(gc.uses / gc.max_uses) * 100}%` }} />
                           </div>
                           <span className="text-[10px]">{gc.uses} / {gc.max_uses}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[10px]">
                        <div className="flex flex-col gap-1">
                          {gc.is_active ? (
                            <span className="text-emerald-400 font-bold">ATIVO</span>
                          ) : (
                            <span className="text-rose-400 font-bold">ESGOTADO/INATIVO</span>
                          )}
                          <span className="text-zinc-500">Por: @{gc.created_by_username || "Sistema"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDeleteGiftCard(gc.id)}
                          className="p-1.5 rounded-lg text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer inline-block"
                          title="Excluir Gift Card"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adding Gift Card Dialog / Modal */}
      {isAddingGiftCard && (
        <div id="admin-add-gc-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto pt-20 pb-10">
          <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative my-auto">
            <button
              onClick={() => setIsAddingGiftCard(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto mb-3">
                <Key className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-display font-extrabold text-white">Criar Gift Card</h2>
              <p className="text-xs text-zinc-500 mt-1">Gere um novo código para presentear usuários.</p>
            </div>

            <form onSubmit={handleSaveGiftCard} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Código do Cartão</label>
                <div className="flex gap-2">
                   <input
                     type="text"
                     required
                     value={gcCode}
                     onChange={(e) => setGcCode(e.target.value.toUpperCase())}
                     placeholder="EX: VIP-1000"
                     className="flex-1 bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 uppercase"
                   />
                   <button type="button" onClick={() => setGcCode("ATTO-" + Math.random().toString(36).substring(2, 10).toUpperCase())} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-zinc-300">
                     Gerar Aleatório
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Tipo</label>
                  <select
                    value={gcType}
                    onChange={(e) => setGcType(e.target.value)}
                    className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 appearance-none"
                  >
                    <option value="coins">ATTO Coins</option>
                    <option value="pro">Plano PRO</option>
                    <option value="premium">Plano PREMIUM</option>
                    <option value="ultra">Plano ULTRA</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                     {gcType === 'coins' ? 'Quantidade (Moedas)' : 'Duração (Dias)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={gcValue}
                    onChange={(e) => setGcValue(parseInt(e.target.value))}
                    className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Limite de Usos (Pessoas)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={gcMaxUses}
                  onChange={(e) => setGcMaxUses(parseInt(e.target.value))}
                  className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingGiftCard}
                className="w-full bg-primary hover:bg-rose-500 text-white font-bold font-mono uppercase tracking-widest py-3 text-[10px] rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all disabled:opacity-55 mt-4"
              >
                {isSavingGiftCard ? "Criando..." : "Confirmar e Criar"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab content 6: BANNERS */}
      {activeTab === "banners" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="space-y-1">
              <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Gerenciador de Avisos Globais (Banners)
              </h4>
              <p className="text-xs text-zinc-500">
                Crie alertas promocionais, comunicados de manutenção ou avisos gerais que aparecem para todos os usuários.
              </p>
            </div>
          </div>

          {/* Create Banner Form */}
          <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 shadow-sm">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const title = (form.elements.namedItem("title") as HTMLInputElement).value;
              const message = (form.elements.namedItem("message") as HTMLInputElement).value;
              const link_url = (form.elements.namedItem("link_url") as HTMLInputElement).value;
              const type = (form.elements.namedItem("type") as HTMLSelectElement).value;

              try {
                const res = await fetch("/api/admin/banners", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                  },
                  body: JSON.stringify({ title, message, link_url, type })
                });
                if (res.ok) {
                  setSuccess("Banner criado com sucesso!");
                  setTimeout(() => setSuccess(null), 3000);
                  form.reset();
                  // Re-fetch banners
                  const bannersRes = await fetch("/api/admin/banners", {
                    headers: { "Authorization": `Bearer ${token}` }
                  });
                  const bannersData = await bannersRes.json();
                  if (bannersRes.ok && bannersData.status) {
                    setBanners(bannersData.banners);
                  }
                }
              } catch (err) {
                setError("Erro ao criar banner");
              }
            }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Título</label>
                  <input name="title" type="text" required className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white" placeholder="Ex: Manutenção Programada" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Tipo</label>
                  <select name="type" className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white">
                    <option value="info">Informativo</option>
                    <option value="warning">Aviso / Manutenção</option>
                    <option value="success">Sucesso / Promoção</option>
                    <option value="promo">Especial (Destaque)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Mensagem</label>
                <input name="message" type="text" required className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white" placeholder="O sistema passará por instabilidades hoje à noite..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">URL de Redirecionamento (Opcional)</label>
                <input name="link_url" type="url" className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white" placeholder="https://..." />
              </div>
              <button type="submit" className="bg-primary hover:bg-rose-500 text-white font-bold font-mono uppercase tracking-widest px-6 py-2.5 text-[10px] rounded-xl cursor-pointer transition-all">
                Criar Banner
              </button>
            </form>
          </div>

          {/* List Banners */}
          <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#111111]/50 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                  <th className="p-4 pl-6">ID / Tipo</th>
                  <th className="p-4">Conteúdo</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {banners.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-zinc-500">Nenhum banner encontrado.</td>
                  </tr>
                ) : (
                  banners.map(b => (
                    <tr key={b.id}>
                      <td className="p-4 pl-6 font-mono text-zinc-400">
                        #{b.id} <br/> <span className="text-[10px] uppercase">{b.type}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{b.title}</div>
                        <div className="text-zinc-500 mt-1">{b.message}</div>
                        {b.link_url && <a href={b.link_url} className="text-blue-400 hover:underline text-[10px] mt-1 block" target="_blank" rel="noreferrer">Link</a>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${b.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {b.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={async () => {
                            if (window.confirm("Deletar banner?")) {
                              const res = await fetch(`/api/admin/banners/${b.id}`, {
                                method: "DELETE",
                                headers: { "Authorization": `Bearer ${token}` }
                              });
                              if (res.ok) {
                                setBanners(prev => prev.filter(item => item.id !== b.id));
                              }
                            }
                          }}
                          className="p-1.5 rounded-lg border border-white/5 bg-red-950/10 hover:bg-red-950/30 text-rose-400 hover:border-red-500/30 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab content 7: DIAGNOSTICS */}
      {activeTab === "diagnostics" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="space-y-1">
              <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Diagnósticos de Integração
              </h4>
              <p className="text-xs text-zinc-500">
                Verifique o status das APIs e permissões de acesso, como MercadoPago.
              </p>
            </div>
            <button
              onClick={runDiagnostics}
              disabled={isRunningDiagnostics}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-5 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isRunningDiagnostics ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Testando...</span>
                </>
              ) : (
                <>
                  <Lucide.Activity className="w-3.5 h-3.5" />
                  <span>Executar Testes</span>
                </>
              )}
            </button>
          </div>

          {diagnosticResult && (
            <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                {diagnosticResult.status === "success" ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                )}
                <h5 className="font-mono font-bold text-sm text-white">
                  Resultado: {diagnosticResult.status.toUpperCase()}
                </h5>
              </div>

              {diagnosticResult.status === "success" && diagnosticResult.data ? (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-xs text-emerald-400 font-mono">
                      Token MercadoPago Válido. Conectado como: <strong>{diagnosticResult.data.first_name} {diagnosticResult.data.last_name}</strong>
                    </p>
                  </div>
                  <div>
                    <h6 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-2">Permissões da Conta e Detalhes</h6>
                    <pre className="bg-[#111111] p-4 rounded-xl text-xs font-mono text-zinc-300 overflow-x-auto border border-white/5 whitespace-pre-wrap">
                      {JSON.stringify(diagnosticResult.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                    <p className="text-xs text-rose-400 font-mono">
                      Falha ao validar Token do MercadoPago. Verifique as credenciais no arquivo .env.
                    </p>
                    {diagnosticResult.message && (
                      <p className="text-xs text-rose-500/80 mt-1">{diagnosticResult.message}</p>
                    )}
                  </div>
                  {diagnosticResult.error && (
                    <pre className="bg-[#111111] p-4 rounded-xl text-xs font-mono text-rose-400 overflow-x-auto border border-rose-500/10 whitespace-pre-wrap">
                      {JSON.stringify(diagnosticResult.error, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Webhook Logs Section */}
          <div className="bg-[#111111]/50 border border-white/5 rounded-2xl p-6 shadow-sm mt-6">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-mono font-bold text-sm text-white flex items-center gap-2">
                <Lucide.ListTodo className="w-4 h-4 text-emerald-500" />
                Últimos Logs de Webhook (Mercado Pago)
              </h5>
              <button 
                onClick={fetchWebhookLogs}
                disabled={isLoadingWebhookLogs}
                className="text-[10px] text-zinc-400 hover:text-white uppercase font-mono tracking-widest flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingWebhookLogs ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
            
            {webhookLogs.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs border border-white/5 rounded-xl border-dashed">
                Nenhum webhook recebido recentemente.
              </div>
            ) : (
              <div className="space-y-3">
                {webhookLogs.map((log, idx) => (
                  <div key={idx} className="bg-[#0c0c0c] border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        log.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.status === 'error' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-zinc-300 font-mono">
                        {log.details}
                      </p>
                    )}
                    <details className="mt-2 text-xs text-zinc-500 group">
                      <summary className="cursor-pointer hover:text-zinc-300 transition-colors">
                        Ver payload completo
                      </summary>
                      <pre className="mt-2 bg-[#111111] p-3 rounded-lg overflow-x-auto text-[10px] font-mono text-zinc-400 border border-white/5">
                        {JSON.stringify(log.body, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab content 8: SETUP GUIDE */}
      {activeTab === "setup" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="space-y-1">
              <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Guia de Instalação e Configuração
              </h4>
              <p className="text-xs text-zinc-500">
                Siga os passos abaixo para configurar os pagamentos e outras integrações no seu ambiente.
              </p>
            </div>
          </div>

          <div className="bg-[#111111]/50 border border-white/5 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <Lucide.CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h5 className="font-mono font-bold text-sm text-white">Configuração do MercadoPago</h5>
                <p className="text-xs text-zinc-400">Ative pagamentos automáticos no sistema.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-4 p-4 rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500/20"
                  checked={setupChecklist.step1}
                  onChange={(e) => setSetupChecklist(p => ({ ...p, step1: e.target.checked }))}
                />
                <div className="space-y-2 flex-1">
                  <span className={`text-sm font-bold block ${setupChecklist.step1 ? 'text-zinc-500 line-through' : 'text-zinc-300 group-hover:text-white'}`}>
                    1. Acessar o Painel de Desenvolvedor
                  </span>
                  <p className="text-xs text-zinc-500">
                    Acesse o portal do MercadoPago para gerar suas credenciais.
                  </p>
                  <a href="https://www.mercadopago.com.br/developers/panel" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-blue-400 hover:text-blue-300">
                    Abrir Painel do MercadoPago <Lucide.ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500/20"
                  checked={setupChecklist.step2}
                  onChange={(e) => setSetupChecklist(p => ({ ...p, step2: e.target.checked }))}
                />
                <div className="space-y-2 flex-1">
                  <span className={`text-sm font-bold block ${setupChecklist.step2 ? 'text-zinc-500 line-through' : 'text-zinc-300 group-hover:text-white'}`}>
                    2. Criar Aplicação e Copiar Token
                  </span>
                  <p className="text-xs text-zinc-500">
                    Crie uma nova aplicação no painel. Vá até a seção "Credenciais de Produção" e copie o <code className="text-zinc-400 font-bold">Access Token</code> (geralmente começa com <code className="text-zinc-400">APP_USR-</code>).
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500/20"
                  checked={setupChecklist.step3}
                  onChange={(e) => setSetupChecklist(p => ({ ...p, step3: e.target.checked }))}
                />
                <div className="space-y-2 flex-1">
                  <span className={`text-sm font-bold block ${setupChecklist.step3 ? 'text-zinc-500 line-through' : 'text-zinc-300 group-hover:text-white'}`}>
                    3. Configurar Variável de Ambiente
                  </span>
                  <p className="text-xs text-zinc-500">
                    Abra o arquivo <code className="text-zinc-400">.env</code> na raiz do projeto e defina a variável <code className="text-blue-400">MERCADOPAGO_ACCESS_TOKEN</code>.
                  </p>
                  <pre className="mt-2 text-xs font-mono bg-black/50 border border-white/10 p-3 rounded-lg text-emerald-400 overflow-x-auto">
                    MERCADOPAGO_ACCESS_TOKEN="APP_USR-xxxxxxxxxxx-..."
                  </pre>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500/20"
                  checked={setupChecklist.step4}
                  onChange={(e) => setSetupChecklist(p => ({ ...p, step4: e.target.checked }))}
                />
                <div className="space-y-2 flex-1">
                  <span className={`text-sm font-bold block ${setupChecklist.step4 ? 'text-zinc-500 line-through' : 'text-zinc-300 group-hover:text-white'}`}>
                    4. Validar Integração
                  </span>
                  <p className="text-xs text-zinc-500">
                    Reinicie a aplicação e verifique se o token é válido utilizando a aba de <strong>Diagnósticos</strong>.
                  </p>
                  <button 
                    type="button"
                    onClick={() => setActiveTab("diagnostics")}
                    className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20"
                  >
                    Abrir Aba de Diagnósticos <Lucide.ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </label>
            </div>
            
            <div className="mt-8 flex justify-center">
               <a 
                href="https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/integration-configuration" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-xs font-bold transition-colors"
              >
                Ler Documentação Oficial MercadoPago <Lucide.ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
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
