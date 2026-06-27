import React, { useState } from "react";
import { X, Lock, Mail, User, Sparkles, Loader2, LogIn, UserPlus } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin
      ? { identifier: email || username, password }
      : { username, email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ocorreu um erro na autenticação.");
      }

      if (data.status && data.token && data.user) {
        onSuccess(data.token, data.user);
        onClose();
        // Reset fields
        setUsername("");
        setEmail("");
        setPassword("");
      }
    } catch (err: any) {
      console.error("[Auth Error]:", err.message);
      setError(err.message || "Não foi possível conectar ao servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        id="auth-modal-container"
        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden"
      >
        {/* Decorative ambient background blur */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="btn-auth-modal-close"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-rose-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-rose-900/10 mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">
            {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {isLogin
              ? "Entre para sincronizar favoritos, perfis e históricos no Postgres"
              : "Cadastre-se para liberar recursos exclusivos de personalização"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 mb-6">
          <button
            id="tab-auth-login"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
              isLogin
                ? "border-primary text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Entrar
          </button>
          <button
            id="tab-auth-register"
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
              !isLogin
                ? "border-primary text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div id="auth-error-banner" className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex gap-2">
              <span className="font-bold">Erro:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Username (Register only or login identifier option) */}
          {!isLogin ? (
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                Nome de Usuário
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="auth-input-username"
                  type="text"
                  required
                  placeholder="ex: zerotwo_fan"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#111111] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
          ) : null}

          {/* Email / Identifier Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
              {isLogin ? "Usuário ou E-mail" : "E-mail"}
            </label>
            <div className="relative">
              {isLogin ? (
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              ) : (
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              )}
              <input
                id="auth-input-email"
                type={isLogin ? "text" : "email"}
                required
                placeholder={isLogin ? "E-mail ou username" : "seu-email@dominio.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111111] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                id="auth-input-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111111] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="btn-auth-submit"
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-rose-700 hover:from-rose-500 hover:to-rose-800 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-900/10 active:scale-95 disabled:opacity-55 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Entrar na Plataforma</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Cadastrar Conta</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 text-center text-[11px] text-zinc-500 font-mono">
          <span>Banco Conectado: </span>
          <span className="text-emerald-400 font-bold">PostgreSQL Railway</span>
        </div>
      </div>
    </div>
  );
}
