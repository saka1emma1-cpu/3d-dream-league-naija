import { Trophy, Home, RotateCcw, Target, Percent, Footprints } from 'lucide-react';
import type { MatchResult } from '@/game/FootballGame';

interface Props {
  result: MatchResult;
  teamName: string;
  opponentName: string;
  onContinue: () => void;
}

export function PostMatchScreen({ result, teamName, opponentName, onContinue }: Props) {
  const resultType = result.scoreHome > result.scoreAway ? 'win' : result.scoreHome < result.scoreAway ? 'loss' : 'draw';
  const coinsEarned = resultType === 'win' ? 500 + result.scoreHome * 100 : resultType === 'draw' ? 200 : 50 + result.scoreHome * 50;

  const config = {
    win: { bg: 'from-emerald-900 via-emerald-800 to-slate-950', icon: Trophy, iconColor: 'text-amber-400', title: 'VICTORY!', subtitle: 'You took the 3 points!' },
    loss: { bg: 'from-red-900 via-red-950 to-slate-950', icon: Trophy, iconColor: 'text-slate-500', title: 'DEFEAT', subtitle: 'Better luck next time' },
    draw: { bg: 'from-slate-800 via-slate-900 to-slate-950', icon: Trophy, iconColor: 'text-amber-400', title: 'DRAW', subtitle: 'A point earned' },
  };
  const c = config[resultType];
  const Icon = c.icon;

  const stats = [
    { label: 'GOALS', home: result.scoreHome, away: result.scoreAway, icon: Target },
    { label: 'SHOTS', home: result.shotsHome, away: result.shotsAway, icon: Footprints },
    { label: 'POSSESSION', home: result.possessionHome, away: 100 - result.possessionHome, icon: Percent, isPercent: true },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b ${c.bg} flex flex-col items-center justify-center p-6`}>
      <div className="flex flex-col items-center mb-6 animate-[fadeIn_0.5s_ease]">
        <Icon className={`w-16 h-16 ${c.iconColor} mb-2`} />
        <h1 className="text-3xl font-black text-white tracking-wide">{c.title}</h1>
        <p className="text-sm text-slate-300 mt-1">{c.subtitle}</p>
      </div>

      <div className="w-full max-w-sm bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-5 mb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col items-center flex-1">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center mb-1">
              <span className="text-white font-bold text-sm">EFC</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[80px]">{teamName}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-black text-white tabular-nums">{result.scoreHome}</span>
            <span className="text-slate-500 text-2xl">-</span>
            <span className="text-4xl font-black text-white tabular-nums">{result.scoreAway}</span>
          </div>
          <div className="flex flex-col items-center flex-1">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center mb-1">
              <span className="text-white font-bold text-sm">OPP</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[80px]">{opponentName}</span>
          </div>
        </div>

        <div className="space-y-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const homeWin = stat.home > stat.away;
            return (
              <div key={stat.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-bold tabular-nums ${homeWin ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {stat.home}{stat.isPercent ? '%' : ''}
                  </span>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Icon className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">{stat.label}</span>
                  </div>
                  <span className={`font-bold tabular-nums ${!homeWin ? 'text-red-400' : 'text-slate-400'}`}>
                    {stat.away}{stat.isPercent ? '%' : ''}
                  </span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-700">
                  <div className="bg-emerald-500 transition-all" style={{ width: `${stat.isPercent ? stat.home : (stat.home / (stat.home + stat.away || 1)) * 100}%` }} />
                  <div className="bg-red-500 transition-all flex-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-sm bg-gradient-to-r from-amber-600/20 to-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">MATCH REWARDS</p>
              <p className="text-lg font-black text-amber-300">+{coinsEarned} coins</p>
            </div>
          </div>
          {resultType === 'win' && (
            <div className="flex items-center gap-1 bg-cyan-500/20 rounded-full px-2 py-1">
              <span className="text-xs font-bold text-cyan-300">+2</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 w-full max-w-sm">
        <button onClick={onContinue} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm border border-white/10 hover:bg-slate-700 transition">
          <Home className="w-4 h-4" /> HUB
        </button>
        <button onClick={onContinue} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-b from-emerald-600 to-emerald-700 text-white font-bold text-sm border border-white/10 hover:brightness-110 transition active:scale-95">
          <RotateCcw className="w-4 h-4" /> CONTINUE
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
