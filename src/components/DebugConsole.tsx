import React, { useState, useEffect, useRef } from "react";
import { Terminal, RefreshCw, Trash2, Search, SlidersHorizontal, Eye, EyeOff, AlertTriangle, AlertCircle, Info, Bug, Check } from "lucide-react";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

const MAX_YT_PLAY_LOGS = 1000;

interface DebugConsoleProps {
  token: string;
  autoRefreshInterval?: number; // in milliseconds
}

export function DebugConsole({ token, autoRefreshInterval = 5000 }: DebugConsoleProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Controls
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<{ [key: string]: boolean }>({
    info: true,
    warn: true,
    error: true,
    debug: true,
  });

  const consoleEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/yt-play/logs", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`Erro ao buscar logs: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.status && Array.isArray(data.logs)) {
        setLogs(data.logs);
      } else {
        throw new Error("Formato de resposta de logs inválido.");
      }
    } catch (err: any) {
      console.error("[DebugConsole Fetch Error]", err);
      setError(err.message || "Erro desconhecido ao carregar logs.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!window.confirm("Deseja realmente limpar todos os logs do yt-play?")) return;
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await fetch("/api/admin/yt-play/logs", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`Erro ao limpar logs: ${response.statusText}`);
      }
      setLogs([]);
      setSuccessMsg("Logs do yt-play foram limpos com sucesso!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Não foi possível limpar os logs.");
    } finally {
      setIsLoading(false);
    }
  };

  // Poll logs
  useEffect(() => {
    fetchLogs();
  }, [token]);

  useEffect(() => {
    if (!isLivePolling) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [isLivePolling, token, autoRefreshInterval]);

  // Filter logs whenever logs, query or levels change
  useEffect(() => {
    let result = logs;

    // Filter by levels
    result = result.filter(log => selectedLevels[log.level]);

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(log => 
        log.message.toLowerCase().includes(query) || 
        log.level.toLowerCase().includes(query) ||
        log.timestamp.toLowerCase().includes(query)
      );
    }

    setFilteredLogs(result);
  }, [logs, searchQuery, selectedLevels]);

  // Scroll to bottom on load/live refresh
  useEffect(() => {
    if (isLivePolling && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredLogs, isLivePolling]);

  const toggleLevel = (level: string) => {
    setSelectedLevels(prev => ({ ...prev, [level]: !prev[level] }));
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("pt-BR", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
    } catch (e) {
      return isoString;
    }
  };

  const getLevelStyles = (level: string) => {
    switch (level) {
      case "error":
        return {
          bg: "bg-red-500/15 border-red-500/30 text-red-400",
          badge: "bg-red-500/20 text-red-400 border-red-500/40",
          icon: <AlertCircle className="w-3 h-3 text-red-400" />
        };
      case "warn":
        return {
          bg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
          badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",
          icon: <AlertTriangle className="w-3 h-3 text-amber-400" />
        };
      case "debug":
        return {
          bg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
          badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          icon: <Bug className="w-3 h-3 text-blue-400" />
        };
      case "info":
      default:
        return {
          bg: "bg-zinc-500/10 border-zinc-500/25 text-zinc-300",
          badge: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
          icon: <Info className="w-3 h-3 text-zinc-400" />
        };
    }
  };

  return (
    <div id="debug-console-wrapper" className="flex flex-col h-full w-full bg-[#080808] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      {/* Console Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#0e0e0e] border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Terminal className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Console yt-play
              {isLivePolling && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </h4>
            <p className="text-[10px] text-zinc-500 font-mono">
              Monitoramento em tempo real dos downloads/streams do YouTube
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
              isLivePolling
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15"
                : "bg-zinc-800/50 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            {isLivePolling ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isLivePolling ? "Live Polling" : "Pausado"}</span>
          </button>

          <button
            onClick={() => fetchLogs()}
            disabled={isLoading}
            className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/30 text-zinc-300 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={clearLogs}
            disabled={isLoading || logs.length === 0}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Logs</span>
          </button>
        </div>
      </div>

      {/* Filtering Options */}
      <div className="p-4 bg-[#0c0c0c] border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Pesquisar nos registros de depuração..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-white/5 focus:border-emerald-500/30 focus:outline-none rounded-xl text-xs font-mono text-white placeholder-zinc-500 transition-all"
          />
        </div>

        {/* Level Badges toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 mr-2 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" /> Níveis:
          </span>
          {(["info", "warn", "error", "debug"] as const).map((lvl) => {
            const styles = getLevelStyles(lvl);
            const isActive = selectedLevels[lvl];
            return (
              <button
                key={lvl}
                onClick={() => toggleLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                  isActive
                    ? styles.badge
                    : "bg-transparent border-white/5 text-zinc-600 hover:text-zinc-400"
                }`}
              >
                {styles.icon}
                <span>{lvl}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Terminal Output logs list */}
      <div className="flex-1 min-h-[350px] max-h-[500px] overflow-y-auto p-5 font-mono text-xs bg-[#050505] space-y-2 select-text scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 py-16">
            <Terminal className="w-12 h-12 mb-3 text-zinc-800" />
            <p className="text-sm font-bold">Nenhum log correspondente encontrado</p>
            <p className="text-[10px] mt-1 text-center max-w-xs">
              Selecione todos os níveis ou reproduza alguma música/vídeo para gerar atividade do PlayEngine.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredLogs.map((log, index) => {
              const styles = getLevelStyles(log.level);
              return (
                <div
                  key={index}
                  className={`p-2.5 rounded-lg border flex items-start gap-3 transition-colors ${styles.bg}`}
                >
                  <span className="text-[10px] text-zinc-500 shrink-0 select-none pt-0.5">
                    [{formatTime(log.timestamp)}]
                  </span>
                  
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border shrink-0 select-none ${styles.badge}`}>
                    {log.level}
                  </span>

                  <span className="break-all whitespace-pre-wrap leading-relaxed">
                    {log.message}
                  </span>
                </div>
              );
            })}
            <div ref={consoleEndRef} />
          </div>
        )}
      </div>

      {/* Console Footer */}
      <div className="px-5 py-3 bg-[#0c0c0c] border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <div>
          Exibindo <span className="text-zinc-300 font-bold">{filteredLogs.length}</span> de{" "}
          <span className="text-zinc-300 font-bold">{logs.length}</span> registros de logs
        </div>
        <div>
          Limite buffer: {MAX_YT_PLAY_LOGS} itens
        </div>
      </div>
    </div>
  );
}
