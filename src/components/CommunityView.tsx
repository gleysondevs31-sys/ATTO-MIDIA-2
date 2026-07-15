import React, { useEffect, useState } from "react";
import { Users, Search, Trophy, Medal, Star, CheckCircle2 } from "lucide-react";
import { User } from "../types";

export function CommunityView() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch users ranking
    fetch("/api/community/ranking")
      .then(r => r.json())
      .then(d => {
        if (d.success) setUsers(d.users);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-6 overflow-y-auto">
      <div className="max-w-5xl w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-black text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" /> Ranking da Comunidade
            </h1>
            <p className="text-zinc-400 mt-2">Conheça os usuários mais ativos da nossa plataforma e suba de nível!</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-zinc-500 py-10">Carregando ranking...</div>
        ) : (
          <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="divide-y divide-white/5">
              {users.map((u, i) => (
                <div key={u.id} className="p-4 sm:p-6 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                  <div className="w-8 flex justify-center">
                    {i === 0 ? <Trophy className="w-6 h-6 text-yellow-500" /> : 
                     i === 1 ? <Medal className="w-6 h-6 text-gray-400" /> : 
                     i === 2 ? <Medal className="w-6 h-6 text-amber-600" /> : 
                     <span className="text-zinc-500 font-bold text-lg">#{i + 1}</span>}
                  </div>
                  <div className="relative">
                    <img src={u.avatar} alt={u.username} className="w-12 h-12 rounded-full border border-white/10" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-white font-bold text-lg">{u.username}</h3>
                      {u.is_verified && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                    </div>
                    <p className="text-zinc-500 text-xs">{u.bio || "Sem biografia"}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-500 font-bold">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{u.coins || 0}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Nível {Math.floor((u.coins || 0) / 100) + 1}</span>
                  </div>
                </div>
              ))}
              {users.length === 0 && <div className="p-10 text-center text-zinc-500">Nenhum usuário encontrado.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
