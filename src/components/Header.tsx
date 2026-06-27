import React from "react";
import { Film, Radio, ShieldCheck } from "lucide-react";

export function Header() {
  return (
    <header id="app-header" className="sticky top-0 z-40 bg-[#080808]/85 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f43f5e] to-[#9f1239] flex items-center justify-center text-white shadow-lg shadow-rose-900/20">
          <Film className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight text-white">
            ZERO<span className="text-[#f43f5e]">TWO</span> <span className="font-light opacity-50">MEDIA HUB</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden sm:block">
            Universal Social Streaming Engine
          </p>
        </div>
      </div>

      {/* Connection / API Status */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#111111] border border-white/5 rounded-full text-xs text-zinc-400">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>API: <b className="text-white font-mono">Conectado (onnx-ia)</b></span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/5 rounded-full text-xs text-primary font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Proxy Ativo</span>
        </div>
      </div>
    </header>
  );
}
