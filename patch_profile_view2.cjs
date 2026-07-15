const fs = require("fs");
let content = fs.readFileSync("src/components/ProfileView.tsx", "utf-8");

// Add state for frames and badges
content = content.replace(
    'const [selectedTheme, setSelectedTheme] = useState(user.theme === "dark" || !user.theme ? "rose" : user.theme);',
    'const [selectedTheme, setSelectedTheme] = useState(user.theme === "dark" || !user.theme ? "rose" : user.theme);\n  const [selectedFrame, setSelectedFrame] = useState(user.avatar_frame || "none");\n  const [isUploading, setIsUploading] = useState(false);'
);

content = content.replace(
    'theme: selectedTheme,',
    'theme: selectedTheme,\n        avatar_frame: selectedFrame,'
);

// Add frames list
content = content.replace(
    'const avatarPresets = [',
    `const framePresets = [
    { id: "none", name: "Nenhuma", classes: "border-2 border-primary" },
    { id: "gold", name: "Ouro", classes: "border-4 border-yellow-500 ring-4 ring-yellow-500/30" },
    { id: "diamond", name: "Diamante", classes: "border-4 border-cyan-400 ring-4 ring-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.6)]" },
    { id: "fire", name: "Fogo", classes: "border-4 border-orange-500 ring-4 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.7)]" },
    { id: "neon", name: "Neon", classes: "border-4 border-purple-500 ring-4 ring-pink-500/50 shadow-[0_0_20px_rgba(217,70,239,0.7)]" },
  ];\n\n  const avatarPresets = [`
);

// Replace avatar display logic
content = content.replace(
    'className="w-28 h-28 rounded-2xl border-2 border-primary bg-[#121212] p-2 flex items-center justify-center shadow-2xl relative group overflow-hidden"',
    'className={`w-28 h-28 rounded-2xl bg-[#121212] p-2 flex items-center justify-center shadow-2xl relative group overflow-hidden ${framePresets.find(f => f.id === (user.avatar_frame || "none"))?.classes || "border-2 border-primary"}`}'
);

// Add isVerified logic
content = content.replace(
    '<h2 className="text-2xl font-display font-black text-white tracking-tight">\n              {user.username}\n            </h2>',
    '<h2 className="text-2xl font-display font-black text-white tracking-tight flex items-center gap-2">\n              {user.username}\n              {user.is_verified && <CheckCircle2 className="w-6 h-6 text-blue-500" title="Perfil Verificado" />}\n            </h2>'
);

// Add custom upload logic and frames to the profile form
const avatarForm = `
                  {/* Select Avatar Preset */}
                  <div className="space-y-4">
                    <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                      Escolha seu Estilo de Avatar ou Faça Upload
                    </label>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <img src={selectedAvatar} alt="Current" className="w-16 h-16 rounded-xl object-cover bg-black/50 border border-white/10" />
                      </div>
                      <div className="flex-1">
                        <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs px-4 py-2 rounded-xl transition-colors inline-block">
                          {isUploading ? "Enviando..." : "Fazer Upload de Imagem"}
                          <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                            if (!e.target.files?.[0]) return;
                            setIsUploading(true);
                            try {
                              const formData = new FormData();
                              formData.append("image", e.target.files[0]);
                              const res = await fetch("/api/upload/image", { method: "POST", body: formData });
                              const data = await res.json();
                              if (data.success) setSelectedAvatar(data.url);
                              else throw new Error("Erro");
                            } catch (err) {
                              setProfileError("Falha ao fazer upload da imagem");
                            } finally {
                              setIsUploading(false);
                            }
                          }} />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {avatarPresets.map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedAvatar(preset.url)}
                          className={\`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer \${
                            selectedAvatar === preset.url
                              ? "border-primary bg-primary/10 shadow-lg scale-105"
                              : "border-white/5 bg-[#111111]/30 hover:border-white/10 hover:bg-[#111111]"
                          }\`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-10 h-10 object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Select Frame */}
                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                      Moldura do Perfil
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {framePresets.map((frame, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedFrame(frame.id)}
                          className={\`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer \${
                            selectedFrame === frame.id
                              ? "border-primary bg-primary/10 shadow-lg scale-105"
                              : "border-white/5 bg-[#111111]/30 hover:border-white/10 hover:bg-[#111111]"
                          }\`}
                        >
                          <div className={\`w-8 h-8 rounded-full mb-2 \${frame.classes}\`}></div>
                          <span className="text-[10px] font-bold text-white uppercase">{frame.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
`;

content = content.replace(
    /\{\/\* Select Avatar Preset \*\/\}[\s\S]*?\{\/\* Select Accent Color Theme \*\/\}/m,
    avatarForm + '\n\n                  {/* Select Accent Color Theme */}'
);

fs.writeFileSync("src/components/ProfileView.tsx", content);
console.log("Patched ProfileView.tsx UI");
