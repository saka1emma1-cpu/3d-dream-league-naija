import { useState, lazy, Suspense } from 'react';
import { ArrowLeftRight, TrendingUp, Home, Users, Edit3, Check } from 'lucide-react';
import type { GameState, Player, Screen } from '@/types/game';
import { CurrencyBar } from '@/components/ui/CurrencyBar';
import { PlayerCardModal } from '@/components/ui/PlayerCardModal';
import { UPGRADE_COST_PER_POINT } from '@/data/players';

const PitchScene = lazy(() => import('@/components/three/PitchScene'));
const MatchEngine = lazy(() => import('@/components/match/MatchEngine'));

interface Props {
  state: GameState;
  onUpgradeStat: (id: string, stat: 'speed' | 'shoot' | 'pass' | 'def') => void;
  onNavigate: (screen: Screen) => void;
  onSetTeamName: (name: string) => void;
  onSetTeamColors: (colors: [string, string]) => void;
}

const LOGO_COLOR_OPTIONS: [string, string][] = [
  ['#0a7d28', '#ffffff'],
  ['#0066cc', '#ffffff'],
  ['#cc0000', '#ffffff'],
  ['#ff6600', '#000000'],
  ['#ffcc00', '#006600'],
  ['#000000', '#ffd700'],
];

export function TeamHub({
  state,
  onUpgradeStat,
  onNavigate,
  onSetTeamName,
  onSetTeamColors,
}: Props) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [editingLogo, setEditingLogo] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(state.teamName);
  const [showMatch, setShowMatch] = useState(false);

  const selectedPlayer = selectedPlayerId
    ? state.players.find((p) => p.id === selectedPlayerId) ?? null
    : null;

  const menuItems: { screen: Screen; label: string; icon: typeof Home; color: string }[] = [
    { screen: 'transfers', label: 'TRANSFERS', icon: ArrowLeftRight, color: 'from-blue-600 to-blue-700' },
    { screen: 'upgrade', label: 'UPGRADE', icon: TrendingUp, color: 'from-amber-600 to-amber-700' },
    { screen: 'stadium', label: 'STADIUM', icon: Home, color: 'from-purple-600 to-purple-700' },
    { screen: 'p2p', label: 'P2P MATCH', icon: Users, color: 'from-cyan-600 to-cyan-700' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-3 z-20 relative">
        <button
          onClick={() => setEditingLogo(true)}
          className="flex items-center gap-2.5 group"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border-2 border-white/20 group-hover:border-white/40 transition"
            style={{ background: `linear-gradient(135deg, ${state.teamLogoColors[0]}, ${state.teamLogoColors[1]})` }}
          >
            <Users className="w-6 h-6 text-white drop-shadow" />
          </div>
          <div className="text-left">
            <h1 className="text-base font-black text-white tracking-tight leading-none">{state.teamName}</h1>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">4-3-3 FORMATION</p>
          </div>
        </button>
        <CurrencyBar coins={state.coins} diamonds={state.diamonds} />
      </div>

      {/* 3D Pitch - full scene with players and match */}
      <div className="flex-1 px-4 py-2 flex flex-col relative">
        <div className="relative flex-1 rounded-2xl overflow-hidden border-2 border-emerald-800/50 shadow-2xl bg-[#0a3a15]">
          <div className="absolute inset-0">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-emerald-400 font-semibold">Loading 3D Pitch...</p>
                </div>
              </div>
            }>
              <PitchScene
                players={state.players}
                selectedId={selectedPlayerId}
                onSelect={(id) => setSelectedPlayerId(id)}
                onPlayMatch={() => setShowMatch(true)}
              />
            </Suspense>
          </div>

          {/* Formation label */}
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1 border border-white/10">
              <p className="text-[10px] font-bold text-emerald-400">4-3-3</p>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-500 mt-1.5 mb-2">
          Tap any player for stats — tap PLAY MATCH to simulate
        </p>

        {/* Bottom menu */}
        <div className="grid grid-cols-4 gap-2 pb-4">
          {menuItems.map(({ screen, label, icon: Icon, color }) => (
            <button
              key={screen}
              onClick={() => onNavigate(screen)}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-b ${color} border border-white/10 shadow-lg active:scale-95 hover:brightness-110 transition`}
            >
              <Icon className="w-5 h-5 text-white" />
              <span className="text-[9px] font-bold text-white tracking-wide">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Player card modal */}
      {selectedPlayer && (
        <PlayerCardModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayerId(null)}
          onUpgrade={onUpgradeStat ? (stat) => { onUpgradeStat(selectedPlayer.id, stat); return true; } : undefined}
          coins={state.coins}
          upgradeCost={UPGRADE_COST_PER_POINT}
        />
      )}

      {/* Fullscreen Match Engine */}
      {showMatch && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a3a15]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-emerald-400 font-semibold">Loading Match...</p>
            </div>
          </div>
        }>
          <MatchEngine players={state.players} onExit={() => setShowMatch(false)} />
        </Suspense>
      )}

      {/* Logo editor modal */}
      {editingLogo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setEditingLogo(false)}>
          <div className="bg-slate-800 rounded-2xl border-2 border-slate-600 p-5 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><Edit3 className="w-5 h-5" /> Team Identity</h2>
              <button onClick={() => setEditingLogo(false)} className="text-slate-400 hover:text-white">
                <Check className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block">TEAM NAME</label>
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value.slice(0, 16))}
                    className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none border border-slate-600 focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    onClick={() => { if (nameInput.trim()) { onSetTeamName(nameInput.trim()); setEditingName(false); } }}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-500"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setNameInput(state.teamName); setEditingName(true); }}
                  className="w-full flex items-center justify-between bg-slate-700 rounded-lg px-3 py-2 text-sm text-white hover:bg-slate-600 transition"
                >
                  {state.teamName}
                  <Edit3 className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block">LOGO COLORS</label>
              <div className="grid grid-cols-3 gap-2">
                {LOGO_COLOR_OPTIONS.map((colors, i) => (
                  <button
                    key={i}
                    onClick={() => onSetTeamColors(colors)}
                    className={`h-12 rounded-xl border-2 transition ${state.teamLogoColors[0] === colors[0] ? 'border-white scale-105' : 'border-transparent hover:border-white/40'}`}
                    style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
                  >
                    {state.teamLogoColors[0] === colors[0] && <Check className="w-4 h-4 text-white mx-auto drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
