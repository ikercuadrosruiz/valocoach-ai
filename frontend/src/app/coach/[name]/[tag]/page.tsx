"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BrainCircuit, Activity, Swords, Medal, ShieldAlert, Target, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Match {
  map: string;
  agent: string;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  result: "Ganada" | "Perdida";
}

interface CoachData {
  player: {
    name: string;
    tag: string;
    region: string;
    account_level: number;
    card_image: string | null;
  };
  rank: {
    current_rank: string;
    elo: number;
    mmr_change_last_game: number;
  };
  matches: Match[];
  coach_advice: string;
}

export default function CoachResult({ params }: { params: Promise<{ name: string; tag: string }> }) {
  const router = useRouter();
  const [data, setData] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // React 19: unwrap params promise
  const resolvedParams = use(params);
  const decodedName = decodeURIComponent(resolvedParams.name);
  const decodedTag = decodeURIComponent(resolvedParams.tag);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${baseUrl}/api/v1/coach/${resolvedParams.name}/${resolvedParams.tag}`);
        if (!res.ok) {
          throw new Error("No se pudo obtener el análisis. Verifica el Riot ID.");
        }
        const json = await res.json();
        setData(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [resolvedParams.name, resolvedParams.tag]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="glass-panel p-12 rounded-3xl flex flex-col items-center gap-6 animate-pulse border-primary/20">
          <BrainCircuit className="w-16 h-16 text-primary animate-bounce" />
          <h2 className="text-2xl font-bold text-foreground">La IA está analizando las partidas...</h2>
          <p className="text-muted-foreground">Generando el plan táctico para {decodedName}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center gap-4 text-center max-w-md border-red-500/30">
          <ShieldAlert className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-bold">Error en el análisis</h2>
          <p className="text-muted-foreground">{error}</p>
          <button onClick={() => router.push('/')} className="mt-4 bg-muted hover:bg-muted/80 px-6 py-2 rounded-lg transition-colors">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Tier 1 Metrics Processing
  const winCount = data.matches.filter(m => m.result === "Ganada").length;
  const lossCount = data.matches.length - winCount;
  
  const winrateData = [
    { name: "Victorias", value: winCount, color: "#4ade80" },
    { name: "Derrotas", value: lossCount, color: "#ff4655" }
  ];

  const performanceData = [...data.matches].reverse().map((m, i) => ({
    name: m.map,
    kda: m.deaths === 0 ? m.kills + m.assists : parseFloat(((m.kills + m.assists) / m.deaths).toFixed(2)),
    kills: m.kills,
    agent: m.agent
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#121214]/90 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md">
          <p className="font-bold text-white mb-1">{label} ({payload[0].payload.agent})</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="fixed top-0 left-0 w-full h-full bg-[url('https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png')] bg-cover bg-center opacity-[0.02] pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        {/* Navbar */}
        <button onClick={() => router.push('/')} className="flex items-center text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Volver al buscador
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Perfil e Historial */}
          <div className="space-y-8 lg:col-span-1">
            {/* Tarjeta de Jugador */}
            <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border-t border-t-white/10">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-orange-500" />
              <div className="flex items-center gap-4">
                {data.player.card_image ? (
                  <img src={data.player.card_image} alt="Player Card" className="w-20 h-20 rounded-xl shadow-lg border border-white/5" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center">
                    <Activity className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{data.player.name}</h1>
                  <p className="text-muted-foreground font-medium">#{data.player.tag} <span className="mx-2">•</span> Nvl {data.player.account_level}</p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-background/50 p-4 rounded-2xl border border-white/5">
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><Medal className="w-4 h-4" /> Rango</p>
                  <p className="text-lg font-bold text-white">{data.rank.current_rank}</p>
                </div>
                <div className="bg-background/50 p-4 rounded-2xl border border-white/5">
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><Swords className="w-4 h-4" /> Elo</p>
                  <p className="text-lg font-bold text-white">{data.rank.elo}</p>
                </div>
              </div>
            </div>

            {/* Historial Resumido */}
            <div className="glass-panel rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Últimas Partidas
              </h3>
              <div className="space-y-4">
                {data.matches.map((match, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-background/30 border border-white/5">
                    <div>
                      <p className="font-semibold text-white">{match.agent}</p>
                      <p className="text-xs text-muted-foreground">{match.map}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${match.result === 'Ganada' ? 'text-green-400' : 'text-primary'}`}>
                        {match.result}
                      </p>
                      <p className="text-sm text-muted-foreground">{match.kills}/{match.deaths}/{match.assists}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Tier 1 Metrics - Winrate */}
            <div className="glass-panel rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Winrate (Reciente)
              </h3>
              <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={winrateData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {winrateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '12px', color: '#fafafa' }}
                      itemStyle={{ color: '#fafafa' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-green-400"></span> Victorias</div>
                <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-primary"></span> Derrotas</div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: The AI Coach & Tier 1 Analytics */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Gráfico KDA Ratio (Tier 1 Metric) */}
            <div className="glass-panel rounded-3xl p-8 border-primary/10">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5 text-primary" />
                Rendimiento de Impacto (KDA Ratio)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} axisLine={false} tickLine={false} />
                    <YAxis stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="kda" stroke="#ff4655" strokeWidth={3} dot={{ fill: '#ff4655', r: 6, strokeWidth: 0 }} activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }} name="Ratio KDA" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-8 h-full border-primary/20 shadow-[0_0_50px_rgba(255,70,85,0.05)] relative">
              {/* Badge superior */}
              <div className="absolute -top-4 right-8 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" />
                Análisis Completado
              </div>

              <h2 className="text-3xl font-bold mb-8 text-white tracking-tight">Tu Plan de Mejora</h2>
              
              {/* Contenido Markdown Renderizado Básico */}
              <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
                {data.coach_advice.split('\n').map((line, idx) => {
                  if (line.startsWith('###')) return <h4 key={idx} className="text-lg font-bold text-white mt-6 mb-2">{line.replace('###', '')}</h4>;
                  if (line.startsWith('##')) return <h3 key={idx} className="text-xl font-bold text-white mt-8 mb-3">{line.replace('##', '')}</h3>;
                  if (line.startsWith('#')) return <h2 key={idx} className="text-2xl font-bold text-white mt-10 mb-4">{line.replace('#', '')}</h2>;
                  if (line.startsWith('-')) return <li key={idx} className="ml-4 mb-2">{line.replace('-', '')}</li>;
                  if (line.trim() === '') return <br key={idx} />;
                  
                  // Render bold text
                  const parts = line.split(/(\*\*.*?\*\*)/g);
                  return (
                    <p key={idx} className="mb-3">
                      {parts.map((part, i) => 
                        part.startsWith('**') && part.endsWith('**') 
                          ? <strong key={i} className="text-white">{part.slice(2, -2)}</strong>
                          : part
                      )}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
