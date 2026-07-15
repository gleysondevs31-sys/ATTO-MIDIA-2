import React, { useState, useEffect } from 'react';
import { Terminal, Code2, Play, AlertCircle, ChevronDown, ChevronRight, Loader2, Search } from 'lucide-react';

export function ScrapersDocsView({ onBack }: { onBack?: () => void }) {
  const [scrapers, setScrapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [selectedScraper, setSelectedScraper] = useState<any | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [argsInput, setArgsInput] = useState<string>('[]');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch('/api/scrapers')
      .then(r => r.json())
      .then(d => {
        if (d.success) setScrapers(d.scrapers);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleTest = async () => {
    if (!selectedScraper) return;
    setTesting(true);
    setTestResult(null);
    try {
      let parsedArgs = [];
      try {
        parsedArgs = JSON.parse(argsInput);
        if (!Array.isArray(parsedArgs)) parsedArgs = [parsedArgs];
      } catch (e) {
        // If it fails to parse as JSON, treat it as a single string argument
        parsedArgs = [argsInput];
      }

      const body = {
        method: selectedMethod,
        args: parsedArgs
      };

      const res = await fetch(`/api/scrapers/${selectedScraper.name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
    }
    setTesting(false);
  };

  const filtered = scrapers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) && s.methods?.length > 0 && s.type !== "unknown");

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-black tracking-tight flex items-center gap-2">
            <Code2 className="w-5 h-5 text-amber-500" /> Laboratório / Testes de Scrapers
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Explore, depure e teste todos os scrapers de forma visual e amigável.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar with list */}
        <div className="w-full md:w-1/3 border-r border-white/5 flex flex-col bg-[#080808]">
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar scraper..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#111111] border border-white/5 rounded-xl text-xs font-mono focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
            {loading ? (
              <div className="p-4 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-xs">
                Nenhum scraper encontrado.
              </div>
            ) : (
              filtered.map(s => (
                <button
                  key={s.name}
                  onClick={() => {
                    setSelectedScraper(s);
                    setSelectedMethod(s.methods[0] || '');
                    setTestResult(null);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-[11px] font-mono transition-all flex items-center justify-between ${
                    selectedScraper?.name === s.name 
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                      : "border-transparent text-zinc-400 hover:bg-[#111111] hover:text-white"
                  }`}
                >
                  <span>{s.name}</span>
                  <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-500">{s.type}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Details & Test view */}
        <div className="flex-1 bg-[#0a0a0a] overflow-y-auto p-6">
          {selectedScraper ? (
            <div className="max-w-3xl space-y-6">
              <div>
                <h3 className="text-2xl font-bold font-mono text-amber-400 mb-2">{selectedScraper.name}</h3>
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                  <span className="px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded border border-amber-500/20 font-bold">Tipo: {selectedScraper.type}</span>
                  <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 font-bold">Métodos: {selectedScraper.methods.length}</span>
                </div>
              </div>

              <div className="bg-[#111111]/80 border border-white/5 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Ambiente de Teste Rápido</h4>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Método do Scraper
                      <span className="block text-[10px] font-normal text-zinc-500 mt-0.5">
                        Selecione a funcionalidade que deseja testar (ex: buscar, baixar, listar).
                      </span>
                    </label>
                    <select
                      value={selectedMethod}
                      onChange={e => setSelectedMethod(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                    >
                      <option value="">(Padrão / Nenhum)</option>
                      {selectedScraper.methods.map((m: string) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Parâmetros do Scraper
                      <span className="block text-[10px] font-normal text-zinc-500 mt-0.5">
                        Exemplo: insira a URL do vídeo ou perfil que deseja baixar/extrair.
                      </span>
                    </label>
                    <textarea
                      value={argsInput}
                      onChange={e => setArgsInput(e.target.value)}
                      placeholder='Ex: ["https://tiktok.com/@user/video/123"] ou "texto de busca"'
                      rows={3}
                      className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50 resize-none transition-colors"
                    />
                  </div>

                  <button
                    onClick={handleTest}
                    disabled={testing}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold font-mono text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Executar Requisição
                  </button>
                </div>
              </div>

              {/* Como Usar Code Snippet */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5" /> Exemplo de Código (Front-end)
                </h4>
                <pre className="p-4 bg-[#050505] border border-white/5 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
{`const runScraper = async () => {
  const res = await fetch("/api/scrapers/${selectedScraper.name}", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: ${selectedMethod ? `"${selectedMethod}"` : "undefined"},
      args: ${argsInput || "[]"}
    })
  });
  const data = await res.json();
  console.log(data);
};`}
                </pre>
              </div>

              {testResult && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    {testResult.success ? (
                      <span className="text-emerald-400 flex items-center gap-1"><Code2 className="w-4 h-4" /> Resposta da API</span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Erro na Execução</span>
                    )}
                  </h4>
                  <pre className="p-4 bg-[#050505] border border-white/5 rounded-xl text-[10px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Code2 className="w-12 h-12 text-zinc-500 mb-3" />
              <p className="text-xs font-mono text-zinc-400">Selecione um scraper na lista ao lado para ver a documentação e testá-lo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
