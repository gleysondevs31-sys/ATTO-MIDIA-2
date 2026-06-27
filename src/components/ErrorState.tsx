import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div id="error-state-container" className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-lg mx-auto">
      <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-full text-red-400 mb-4">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h3 className="text-xl font-display font-medium text-red-200 mb-2">Ops! Ocorreu um erro</h3>
      <p className="text-zinc-400 text-sm mb-6">{message}</p>
      
      {onRetry && (
        <button
          id="btn-retry-error"
          onClick={onRetry}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
