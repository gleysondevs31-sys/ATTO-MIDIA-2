import React from "react";
import { Film, Radio, ShieldCheck, LogIn, LogOut, User, Settings, Shield, Menu, X } from "lucide-react";

interface HeaderProps {
  user: any;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSelectView: (view: "explore" | "video-player" | "favorites" | "profile" | "admin" | "landing") => void;
  currentView: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ user, onOpenAuth, onLogout, onSelectView, currentView, isSidebarOpen, onToggleSidebar }: HeaderProps) {
  return (
    <header id="app-header" className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur-md border-b border-white/5 px-6 py-3.5 flex items-center justify-between">
      {/* Brand Logo & Menu Toggle */}
      <div className="flex items-center gap-3">
        {/* Toggle Sidebar Button */}
        <button
          id="btn-header-menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
          title="Abrir Menu Lateral"
          className="p-2 rounded-xl border border-white/10 bg-[#111111]/80 text-gray-300 hover:text-white hover:border-white/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-md hover:bg-primary/10 hover:text-primary"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div 
          id="btn-header-logo-home"
          onClick={() => onSelectView("explore")} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-rose-700 flex items-center justify-center text-white shadow-lg shadow-rose-950/30 transition-transform group-hover:scale-105 active:scale-95">
            <Film className="w-5 h-5 animate-pulse" />
          </div>
          <div className="hidden xs:block">
            <h1 className="text-lg font-display font-black tracking-tight text-white group-hover:text-primary transition-colors">
              ATTO<span className="text-primary font-bold"> DOWNLOADS</span>
            </h1>
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest hidden sm:block">
              Universal Social Streaming Engine
            </p>
          </div>
        </div>
      </div>

      {/* Connection / API Status & User Profile */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#111111]/60 border border-white/5 rounded-full text-xs text-zinc-400">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>API: <b className="text-white font-mono">Conectado (onnx-ia)</b></span>
        </div>
        
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/5 rounded-full text-xs text-primary font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Proxy Ativo</span>
        </div>

        <div className="h-5 w-px bg-white/10 hidden md:block" />

        {/* User Account Dropdown/Widget in Header */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* Quick stats / profile click */}
            <button
              id="btn-header-profile"
              onClick={() => onSelectView("profile")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs cursor-pointer ${
                currentView === "profile"
                  ? "border-primary bg-primary/10 text-white"
                  : "border-white/5 bg-[#111111]/50 text-gray-300 hover:text-white hover:border-white/10"
              }`}
            >
              <div className="w-5 h-5 rounded-md bg-zinc-800 p-0.5 flex items-center justify-center border border-white/10 shrink-0">
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-contain" />
              </div>
              <span className="font-mono font-medium max-w-[100px] truncate">{user.username}</span>
            </button>

            {/* Quick Admin Access */}
            {user.role === "admin" && (
              <button
                id="btn-header-admin-quick"
                onClick={() => onSelectView("admin")}
                title="Área Administrativa"
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  currentView === "admin"
                    ? "border-rose-500 bg-rose-500/10 text-rose-400"
                    : "border-white/5 bg-[#111111]/30 text-rose-300 hover:text-white hover:border-white/10"
                }`}
              >
                <Shield className="w-4 h-4" />
              </button>
            )}

            {/* Logout Cta */}
            <button
              id="btn-header-logout"
              onClick={onLogout}
              title="Sair da Conta"
              className="p-2 rounded-xl border border-white/5 bg-red-950/10 hover:bg-red-950/30 text-red-400 hover:text-red-300 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            id="btn-header-login-cta"
            onClick={onOpenAuth}
            className="bg-primary hover:bg-primary-hover text-white font-bold font-mono uppercase tracking-wider rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-primary/10 hover:shadow-primary/25 hover:scale-[1.02] active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar</span>
          </button>
        )}
      </div>
    </header>
  );
}

