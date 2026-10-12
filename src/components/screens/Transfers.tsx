import { useState } from 'react';
import { ArrowLeft, Coins, Check, X, TrendingUp } from 'lucide-react';
import type { GameState, Player, Screen } from '@/types/game';
import { CurrencyBar } from '@/components/ui/CurrencyBar';
import { getOverall, getPosColor, getRatingColor } from '@/components/ui/playerUtils';
import { TRANSFER_MARKET, UPGRADE_COST_PER_POINT } from '@/data/players';

interface Props {
  state: GameState;
  onBuyPlayer: (player: Player) => boolean;
  onSellPlayer: (playerId: string) => number;
  onUpgradeStat: (id: string, stat: 'speed' | 'shoot' | 'pass' | 'def') => void;
  onNavigate: (screen: Screen) => void;
}

export function Transfers({ state, onBuyPlayer, onSellPlayer, onUpgradeStat, onNavigate }: Props) {
  const [tab, setTab] = useState<'market' | 'squad'>('market');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const ownedIds = new Set(state.players.map((p) => p.id));
  const marketPlayers = TRANSFER_MARKET.sort((a, b) => getOverall(b) - getOverall(a));
  const benchPlayers = state.players.filter((p) => p.slot < 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('hub')} className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-black text-white">Transfer Market</h1>
        </div>
        <CurrencyBar coins={state.coins} diamonds={state.diamonds} />
      </div>

      {/* Tabs */}
      <div className="px-4 pb-2">
        <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1">
          <button
            onClick={() => setTab('market')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${tab === 'market' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            MARKET
          </button>
          <button
            onClick={() => setTab('squad')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${tab === 'squad' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            MY SQUAD ({benchPlayers.length})
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {tab === 'market' && marketPlayers.map((player) => {
          const ovr = getOverall(player);
          const owned = ownedIds.has(player.id);
          const canAfford = state.coins >= player.price;
          const posColor = getPosColor(player.position);

          return (
            <div key={player.id} className="flex items-center gap-3 bg-slate-800/70 rounded-xl p-3 border border-slate-700">
              {/* Rating badge */}
              <div
                className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                style={{ background: getRatingColor(ovr) }}
              >
                <span className="text-lg font-black text-slate-900 leading-none">{ovr}</span>
                <span className="text-[8px] font-bold mt-0.5 px-1 rounded" style={{ background: posColor, color: '#fff' }}>
                  {player.position}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate">{player.name}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-slate-400">SPD {player.speed}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[10px] text-slate-400">SHT {player.shoot}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[10px] text-slate-400">PAS {player.pass}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[10px] text-slate-400">DEF {player.def}</span>
                </div>
              </div>

              {/* Action */}
              {owned ? (
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold px-3 py-2">
                  <Check className="w-4 h-4" /> OWNED
                </span>
              ) : (
                <button
                  disabled={!canAfford}
                  onClick={() => {
                    if (onBuyPlayer(player)) showToast(`Signed ${player.name}!`);
                    else showToast('Not enough coins!');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-500 active:scale-95 text-white"
                >
                  <Coins className="w-4 h-4" />
                  {player.price.toLocaleString()}
                </button>
              )}
            </div>
          );
        })}

        {tab === 'squad' && (
          <>
            {benchPlayers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm">No bench players yet.</p>
                <p className="text-slate-600 text-xs mt-1">Buy players from the market to build your squad.</p>
              </div>
            )}
            {benchPlayers.map((player) => {
              const ovr = getOverall(player);
              const posColor = getPosColor(player.position);
              const sellValue = Math.floor(player.price * 0.6);

              return (
                <div key={player.id} className="flex items-center gap-3 bg-slate-800/70 rounded-xl p-3 border border-slate-700">
                  <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{ background: getRatingColor(ovr) }}>
                    <span className="text-lg font-black text-slate-900 leading-none">{ovr}</span>
                    <span className="text-[8px] font-bold mt-0.5 px-1 rounded" style={{ background: posColor, color: '#fff' }}>
                      {player.position}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{player.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => onNavigate('upgrade')}
                        className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold hover:text-emerald-300"
                      >
                        <TrendingUp className="w-3 h-3" /> UPGRADE
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const refund = onSellPlayer(player.id);
                      if (refund > 0) showToast(`Sold for ${refund} coins`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-red-600/80 hover:bg-red-500 active:scale-95 text-white transition"
                  >
                    <Coins className="w-4 h-4" />
                    {sellValue.toLocaleString()}
                  </button>
                </div>
              );
            })}

            {/* Starting XI section */}
            <div className="pt-3">
              <h2 className="text-xs font-bold text-slate-500 mb-2">STARTING XI</h2>
              {state.players.filter((p) => p.slot >= 0).sort((a, b) => a.slot - b.slot).map((player) => {
                const ovr = getOverall(player);
                const posColor = getPosColor(player.position);
                return (
                  <button
                    key={player.id}
                    onClick={() => onNavigate('upgrade')}
                    className="w-full flex items-center gap-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 mb-2 hover:bg-slate-800/80 transition"
                  >
                    <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0" style={{ background: getRatingColor(ovr) }}>
                      <span className="text-sm font-black text-slate-900 leading-none">{ovr}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-sm font-bold text-white">{player.name}</h3>
                      <span className="text-[10px] font-bold px-1.5 rounded" style={{ background: posColor, color: '#fff' }}>{player.position}</span>
                    </div>
                    <TrendingUp className="w-4 h-4 text-slate-500" />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-full border border-slate-600 shadow-xl z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
