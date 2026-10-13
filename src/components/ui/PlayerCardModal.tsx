import { useState, Suspense, lazy } from 'react';
import { X, Zap, Target, Footprints, Shield, Ruler, Heart } from 'lucide-react';
import type { Player } from '@/types/game';
import { getOverall, getPosColor, getJerseyColor, getRatingColor, getRatingGlow, getAvatarUrl, getPlayerHeight, getPlayerFoot } from './playerUtils';

const Canvas = lazy(() => import('@react-three/fiber').then(m => ({ default: m.Canvas })));
const ThreePlayer = lazy(() => import('./ThreePlayer'));

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

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function PlayerCardModal({ player, onClose, onUpgrade, coins, upgradeCost }: Props) {
  const [selectedStat, setSelectedStat] = useState<('speed' | 'shoot' | 'pass' | 'def') | null>(null);
  const ovr = getOverall(player);
  const posColor = getPosColor(player.position);
  const jerseyColor = getJerseyColor(player.position);
  const seedNum = hashId(player.id);
  const height = getPlayerHeight(seedNum);
  const foot = getPlayerFoot(seedNum);
  const lastName = player.name.split(' ').pop() || player.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-xs bg-gradient-to-b from-slate-800 to-slate-950 rounded-2xl border-2 border-slate-600 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition">
          <X className="w-4 h-4 text-white" />
        </button>

        {/* 3D Preview Canvas */}
        <div className="relative h-[240px] bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-700">
          <Suspense fallback={<div className="flex items-center justify-center h-full text-slate-500 text-sm">Loading 3D...</div>}>
            <Canvas camera={{ position: [0, 0.5, 4], fov: 45 }} dpr={[1, 2]}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[3, 5, 3]} intensity={1.2} />
              <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#88aaff" />
              <Suspense fallback={null}>
                <ThreePlayer jerseyColor={jerseyColor} number={ovr} />
              </Suspense>
            </Canvas>
          </Suspense>
          {/* Rating badge overlay */}
          <div
            className="absolute top-3 left-3 w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black border-2"
            style={{
              background: getRatingColor(ovr),
              color: '#0a0e1a',
              borderColor: 'rgba(255,255,255,0.4)',
              boxShadow: getRatingGlow(ovr),
            }}
          >
            {ovr}
          </div>
        </div>

        {/* Player info */}
        <div className="p-4 pt-3" style={{ background: `linear-gradient(135deg, ${posColor}15, transparent)` }}>
          <div className="flex items-center gap-3 mb-3">
            <img
              src={getAvatarUrl(player.name)}
              alt={player.name}
              className="w-12 h-12 rounded-full border-2 object-cover bg-slate-700"
              style={{ borderColor: posColor }}
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white leading-tight truncate">{player.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: posColor, color: '#fff' }}>
                  {player.position}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                  <Ruler className="w-3 h-3" /> {height}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                  <Heart className="w-3 h-3" /> {foot}
                </span>
              </div>
            </div>
            <div className="w-4 h-3 rounded-sm overflow-hidden flex">
              <div className="flex-1" style={{ background: player.flagColors[0] }} />
              <div className="flex-1" style={{ background: player.flagColors[1] }} />
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2">
            {STATS.map(({ key, label, icon: Icon }) => {
              const val = player[key];
              const canUpgrade = onUpgrade && val < 99 && coins >= upgradeCost;
              return (
                <div key={key} className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 w-12">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-400">{label}</span>
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
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-base font-bold transition disabled:opacity-30 disabled:cursor-not-allowed enabled:bg-emerald-600 enabled:hover:bg-emerald-500 enabled:active:scale-90 bg-slate-700 text-white"
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {onUpgrade && (
            <p className="text-[10px] text-slate-500 text-center pt-2">+1 stat costs {upgradeCost} coins</p>
          )}
        </div>
      </div>
    </div>
  );
}
