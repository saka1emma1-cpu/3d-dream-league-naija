import { useState } from 'react';
import { ArrowLeft, Home, Check, Lock, Users } from 'lucide-react';
import type { GameState, Screen } from '@/types/game';
import { CurrencyBar } from '@/components/ui/CurrencyBar';
import { STADIUM_LEVELS } from '@/data/players';

interface Props {
  state: GameState;
  onUpgradeStadium: () => boolean;
  onNavigate: (screen: Screen) => void;
}

export function Stadium({ state, onUpgradeStadium, onNavigate }: Props) {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('hub')} className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-black text-white">Stadium</h1>
        </div>
        <CurrencyBar coins={state.coins} diamonds={state.diamonds} />
      </div>

      {/* Current stadium showcase */}
      <div className="px-4 pt-2 pb-3">
        <div
          className="relative rounded-2xl overflow-hidden p-5 border-2"
          style={{
            background: `linear-gradient(135deg, ${STADIUM_LEVELS[state.stadiumLevel].accentColor}33, ${STADIUM_LEVELS[state.stadiumLevel].accentColor}11)`,
            borderColor: `${STADIUM_LEVELS[state.stadiumLevel].accentColor}55`,
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Stadium</p>
              <h2 className="text-xl font-black text-white mt-0.5">{STADIUM_LEVELS[state.stadiumLevel].name}</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">{STADIUM_LEVELS[state.stadiumLevel].description}</p>
            </div>
            <div className="flex flex-col items-center">
              <Users className="w-6 h-6 mb-1" style={{ color: STADIUM_LEVELS[state.stadiumLevel].accentColor }} />
              <span className="text-sm font-black text-white tabular-nums">{STADIUM_LEVELS[state.stadiumLevel].capacity.toLocaleString()}</span>
              <span className="text-[9px] text-slate-500">capacity</span>
            </div>
          </div>
          {/* Mini stadium visual */}
          <div className="h-20 rounded-lg overflow-hidden relative" style={{ background: 'linear-gradient(180deg, #1a3a5c 0%, #0d4a1d 100%)' }}>
            <div className="absolute bottom-0 left-0 right-0 h-12" style={{ background: `repeating-linear-gradient(90deg, #0d5c1f, #0d5c1f 12px, #0a4d1a 12px, #0a4d1a 24px)` }} />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-white/30" />
            <div className="absolute top-2 left-1/4 right-1/4 h-3 rounded-t-full border-t border-white/20 border-x" />
          </div>
        </div>
      </div>

      {/* Upgrade path */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Upgrade Path</h2>
        {STADIUM_LEVELS.map((level) => {
          const isCurrent = level.id === state.stadiumLevel;
          const isPast = level.id < state.stadiumLevel;
          const isNext = level.id === state.stadiumLevel + 1;
          const canAfford = state.coins >= level.upgradeCost;

          return (
            <div
              key={level.id}
              className={`rounded-xl p-3.5 border-2 transition ${
                isCurrent ? 'border-emerald-500 bg-emerald-600/10' :
                isPast ? 'border-slate-700 bg-slate-800/30 opacity-50' :
                'border-slate-700 bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Level indicator */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: isPast ? '#334155' : `${level.accentColor}33` }}
                  >
                    {isPast ? (
                      <Check className="w-5 h-5 text-slate-500" />
                    ) : (
                      <Home className="w-5 h-5" style={{ color: level.accentColor }} />
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white">{level.name}</h3>
                  <p className="text-[10px] text-slate-400 truncate">{level.description}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{level.capacity.toLocaleString()} capacity</p>
                </div>

                {/* Action */}
                {isCurrent ? (
                  <span className="text-[10px] font-bold text-emerald-400 px-2 py-1 bg-emerald-600/20 rounded-full">ACTIVE</span>
                ) : isPast ? (
                  <span className="text-[10px] font-bold text-slate-500">DONE</span>
                ) : isNext ? (
                  <button
                    disabled={!canAfford}
                    onClick={() => {
                      if (onUpgradeStadium()) showToast(`Upgraded to ${level.name}!`);
                      else showToast('Not enough coins!');
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-500 active:scale-95 text-white"
                  >
                    {canAfford ? 'UPGRADE' : <><Lock className="w-3 h-3" /> {level.upgradeCost.toLocaleString()}</>}
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 px-2 py-1">
                    <Lock className="w-3 h-3" /> {level.upgradeCost.toLocaleString()}
                  </span>
                )}
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
