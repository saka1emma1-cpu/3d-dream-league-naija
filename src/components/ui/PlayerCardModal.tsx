import { useState } from 'react';
import { X, Zap, Target, Footprints, Shield } from 'lucide-react';
import type { Player } from '@/types/game';
import { getOverall, getPosColor, getRatingColor } from './playerUtils';

interface Props {
  player: Player;
  onClose: () => void;
  onUpgrade?: (stat: 'speed' | 'shoot' | 'pass' | 'def') => boolean;
  coins: number;
  upgradeCost: number;
}

const STATS = [
  { key: 'speed' as const, label: 'SPD', icon: Footprints },
  { key: 'shoot' as const, label: 'SHT', icon: Zap },
  { key: 'pass' as const, label: 'PAS', icon: Target },
  { key: 'def' as const, label: 'DEF', icon: Shield },
];

export function PlayerCardModal({ player, onClose, onUpgrade, coins, upgradeCost }: Props) {
  const [selectedStat, setSelectedStat] = useState<('speed' | 'shoot' | 'pass' | 'def') | null>(null);
  const ovr = getOverall(player);
  const posColor = getPosColor(player.position);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-xs bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border-2 border-slate-600 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card top */}
        <div className="relative p-5 pb-3" style={{ background: `linear-gradient(135deg, ${posColor}22, transparent)` }}>
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition">
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black"
                style={{ background: getRatingColor(ovr), color: '#0a0e1a' }}
              >
                {ovr}
              </div>
              <span className="mt-1 text-xs font-bold px-2 py-0.5 rounded" style={{ background: posColor, color: '#fff' }}>
                {player.position}
              </span>
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-bold text-white leading-tight">{player.name}</h3>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-4 h-3 rounded-sm overflow-hidden flex">
                  <div className="flex-1" style={{ background: player.flagColors[0] }} />
                  <div className="flex-1" style={{ background: player.flagColors[1] }} />
                </div>
                <span className="text-xs text-slate-400">Nigeria</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-5 pt-2 space-y-2.5">
          {STATS.map(({ key, label, icon: Icon }) => {
            const val = player[key];
            const canUpgrade = onUpgrade && val < 99 && coins >= upgradeCost;
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 w-14">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400">{label}</span>
                </div>
                <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${val}%`, background: getRatingColor(val) }}
                  />
                </div>
                <span className="text-sm font-bold text-white w-7 text-right tabular-nums">{val}</span>
                {onUpgrade && (
                  <button
                    disabled={!canUpgrade}
                    onClick={() => { onUpgrade(key); setSelectedStat(key); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-lg font-bold transition disabled:opacity-30 disabled:cursor-not-allowed enabled:bg-emerald-600 enabled:hover:bg-emerald-500 enabled:active:scale-90 bg-slate-700 text-white"
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
          {onUpgrade && (
            <p className="text-xs text-slate-500 text-center pt-1">+1 stat costs {upgradeCost} coins</p>
          )}
        </div>
      </div>
    </div>
  );
}
