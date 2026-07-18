"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, Activity } from "lucide-react";

export default function Home() {
  const [riotId, setRiotId] = useState("");
  const [tagline, setTagline] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (riotId && tagline) {
      router.push(`/coach/${encodeURIComponent(riotId)}/${encodeURIComponent(tagline)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos corporativos */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <main className="z-10 w-full max-w-2xl flex flex-col items-center text-center gap-8">
        
        {/* Logo / Título */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-card border border-card-border rounded-2xl mb-4 shadow-2xl">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
            ValoCoach <span className="text-primary">AI</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Inteligencia Artificial de nivel empresarial diseñada para analizar tu rendimiento táctico y elevar tu juego al siguiente nivel.
          </p>
        </div>

        {/* Buscador Glassmorphism */}
        <form onSubmit={handleSearch} className="w-full mt-8">
          <div className="glass-panel rounded-2xl p-2 flex flex-col md:flex-row gap-2 transition-all hover:border-white/20">
            <div className="flex-1 flex items-center bg-background/50 rounded-xl px-4 py-3 border border-transparent focus-within:border-primary/50 transition-colors">
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <input
                type="text"
                placeholder="Riot ID (ej. ZeroTwo)"
                value={riotId}
                onChange={(e) => setRiotId(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg"
                required
              />
            </div>
            
            <div className="md:w-32 flex items-center bg-background/50 rounded-xl px-4 py-3 border border-transparent focus-within:border-primary/50 transition-colors">
              <span className="text-muted-foreground font-medium mr-2">#</span>
              <input
                type="text"
                placeholder="TAG"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg uppercase"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl px-8 py-3 transition-colors flex items-center justify-center gap-2 group"
            >
              Analizar
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        {/* Footer corporativo */}
        <div className="mt-16 text-sm text-muted-foreground font-medium flex items-center gap-2 opacity-60">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Sistemas Operativos (Coach API Online)
        </div>
      </main>
    </div>
  );
}
