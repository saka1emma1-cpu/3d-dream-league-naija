import { useState } from 'react';
import { ArrowLeft, Zap, Target, Footprints, Shield, Coins, Plus } from 'lucide-react';
import type { GameState, Screen } from '@/types/game';
import { CurrencyBar } from '@/components/ui/CurrencyBar';
import { getOverall, getPosColor, getRatingColor } from '@/components/ui/playerUtils';
import { UPGRADE_COST_PER_POINT } from '@/data/players';

interface Props {
  state: GameState;
  onUpgradeStat: (id: string, stat: 'speed' | 'shoot' | 'pass' | 'def') => void;
  onNavigate: (screen: Screen) => void;
}

const STAT_CONFIG = [
  { key: 'speed' as const, label: 'SPEED', icon: Footprints, color: '#60a5fa' },
  { key: 'shoot' as const, label: 'SHOOTING', icon: Zap, color: '#ef4444' },
  { key: 'pass' as const, label: 'PASSING', icon: Target, color: '#10b981' },
  { key: 'def' as const, label: 'DEFENDING', icon: Shield, color: '#f59e0b' },
];

export function Upgrade({ state, onUpgradeStat, onNavigate }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const squad = state.players.slice().sort((a, b) => getOverall(b) - getOverall(a));

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('hub')} className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-black text-white">Upgrade Players</h1>
        </div>
        <CurrencyBar coins={state.coins} diamonds={state.diamonds} />
      </div>

      {/* Info bar */}
      <div className="px-4 pb-2">
        <div className="bg-amber-600/15 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300 font-semibold">+1 stat = {UPGRADE_COST_PER_POINT} coins · Max 99</p>
        </div>
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
        {squad.map((player) => {
          const ovr = getOverall(player);
          const posColor = getPosColor(player.position);

          return (
            <div key={player.id} className="bg-slate-800/70 rounded-xl p-3 border border-slate-700">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{ background: getRatingColor(ovr) }}>
                  <span className="text-lg font-black text-slate-900 leading-none">{ovr}</span>
                  <span className="text-[8px] font-bold mt-0.5 px-1 rounded" style={{ background: posColor, color: '#fff' }}>
                    {player.position}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">{player.name}</h3>
                  <p className="text-[10px] text-slate-500">{player.slot >= 0 ? 'Starting XI' : 'Bench'}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {STAT_CONFIG.map(({ key, label, icon: Icon, color }) => {
                  const val = player[key];
                  const canUpgrade = val < 99 && state.coins >= UPGRADE_COST_PER_POINT;
                  return (
                    <div key={key} className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <Icon className="w-3 h-3" style={{ color }} />
                        <span className="text-[9px] font-bold text-slate-400">{label}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, background: color }} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white tabular-nums">{val}</span>
                        <button
                          disabled={!canUpgrade}
                          onClick={() => {
                            onUpgradeStat(player.id, key);
                            showToast(`${label} upgraded!`);
                          }}
                          className="w-5 h-5 rounded-md flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-500 active:scale-90 text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-xl z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
