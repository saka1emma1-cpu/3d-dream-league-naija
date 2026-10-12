import { Coins, Gem } from 'lucide-react';

interface Props {
  coins: number;
  diamonds: number;
}

export function CurrencyBar({ coins, diamonds }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600/30 to-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1">
        <Coins className="w-4 h-4 text-amber-400" />
        <span className="text-amber-300 font-bold text-sm tabular-nums">{coins.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600/30 to-cyan-500/20 border border-cyan-400/40 rounded-full px-3 py-1">
        <Gem className="w-4 h-4 text-cyan-300" />
        <span className="text-cyan-200 font-bold text-sm tabular-nums">{diamonds}</span>
      </div>
    </div>
  );
}
