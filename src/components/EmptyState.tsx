import React from "react";
import { Film } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({ 
  title = "Nenhuma mídia encontrada", 
  description = "Tente pesquisar outro termo ou cole uma URL direta das redes sociais suportadas." 
}: EmptyStateProps) {
  return (
    <div id="empty-state-container" className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-full text-zinc-500 mb-4 animate-bounce">
        <Film className="w-10 h-10" />
      </div>
      <h3 className="text-xl font-display font-medium text-zinc-200 mb-2">{title}</h3>
      <p className="text-zinc-500 max-w-sm text-sm">{description}</p>
    </div>
  );
}
