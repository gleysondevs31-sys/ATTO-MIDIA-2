import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (message: string, type: ToastType, description?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, description?: string, duration?: number) => void;
    error: (message: string, description?: string, duration?: number) => void;
    info: (message: string, description?: string, duration?: number) => void;
    warning: (message: string, description?: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((
    message: string,
    type: ToastType,
    description?: string,
    duration = 4000
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, description, type, duration }]);
  }, []);

  const toast = React.useMemo(() => ({
    success: (message: string, description?: string, duration?: number) =>
      addToast(message, "success", description, duration),
    error: (message: string, description?: string, duration?: number) =>
      addToast(message, "error", description, duration),
    info: (message: string, description?: string, duration?: number) =>
      addToast(message, "info", description, duration),
    warning: (message: string, description?: string, duration?: number) =>
      addToast(message, "warning", description, duration),
  }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div
      id="toast-notifications-container"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => removeToast(item.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastCardProps {
  key?: string;
  item: ToastItem;
  onDismiss: () => void;
}

function ToastCard({ item, onDismiss }: ToastCardProps) {
  const { id, message, description, type, duration = 4000 } = item;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = 20; // 20ms steps for super fluid smooth progress

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPercent = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPercent);

      if (elapsed >= duration) {
        clearInterval(timer);
        onDismiss();
      }
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [duration, onDismiss]);

  const config = {
    success: {
      bg: "bg-[#0b130e]/95 border-emerald-500/25",
      icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
      progressBar: "bg-emerald-500",
      accent: "text-emerald-400",
    },
    error: {
      bg: "bg-[#180a0a]/95 border-rose-500/25",
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      progressBar: "bg-rose-500",
      accent: "text-rose-400",
    },
    warning: {
      bg: "bg-[#15110a]/95 border-amber-500/25",
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      progressBar: "bg-amber-500",
      accent: "text-amber-400",
    },
    info: {
      bg: "bg-[#090f16]/95 border-blue-500/25",
      icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
      progressBar: "bg-blue-500",
      accent: "text-blue-400",
    },
  }[type];

  return (
    <motion.div
      id={`toast-card-${id}`}
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto w-full border ${config.bg} backdrop-blur-md rounded-2xl shadow-2xl p-4 flex gap-3.5 relative overflow-hidden group select-none`}
    >
      {config.icon}
      
      <div className="flex-1 space-y-1">
        <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
          {message}
        </h5>
        {description && (
          <p className="text-xs text-zinc-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <button
        id={`btn-toast-dismiss-${id}`}
        onClick={onDismiss}
        className="text-zinc-500 hover:text-white transition-colors self-start p-0.5 rounded hover:bg-white/5 cursor-pointer"
        title="Dispensar"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Dynamic Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5">
        <div
          className={`h-full ${config.progressBar} transition-all duration-75`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}
