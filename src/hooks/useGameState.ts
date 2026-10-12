import { useState, useCallback, useEffect } from 'react';
import type { GameState, Player, MatchStats } from '@/types/game';
import { INITIAL_SQUAD, STADIUM_LEVELS, UPGRADE_COST_PER_POINT } from '@/data/players';

const STORAGE_KEY = 'dream_league_naija_save';

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      if (parsed.players && parsed.players.length >= 11) return parsed;
    }
  } catch {
    // ignore
  }
  return {
    coins: 5000,
    diamonds: 50,
    teamName: 'Emma FC',
    teamLogoColors: ['#0a7d28', '#ffffff'],
    stadiumLevel: 0,
    players: [...INITIAL_SQUAD],
  };
}

export function useGameState() {
  const [state, setState] = useState<GameState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const addCoins = useCallback((amount: number) => {
    setState((s) => ({ ...s, coins: Math.max(0, s.coins + amount) }));
  }, []);

  const addDiamonds = useCallback((amount: number) => {
    setState((s) => ({ ...s, diamonds: Math.max(0, s.diamonds + amount) }));
  }, []);

  const buyPlayer = useCallback((player: Player) => {
    let success = false;
    setState((s) => {
      if (s.coins < player.price) return s;
      success = true;
      const newPlayer: Player = { ...player, isOwned: true, slot: -1 };
      return { ...s, coins: s.coins - player.price, players: [...s.players, newPlayer] };
    });
    return success;
  }, []);

  const sellPlayer = useCallback((playerId: string) => {
    let refund = 0;
    setState((s) => {
      const player = s.players.find((p) => p.id === playerId);
      if (!player || player.slot >= 0) return s; // can't sell starting XI
      refund = Math.floor(player.price * 0.6);
      return {
        ...s,
        coins: s.coins + refund,
        players: s.players.filter((p) => p.id !== playerId),
      };
    });
    return refund;
  }, []);

  const swapPlayer = useCallback((benchId: string, slotId: string) => {
    setState((s) => {
      const bench = s.players.find((p) => p.id === benchId);
      const slot = s.players.find((p) => p.id === slotId);
      if (!bench || !slot) return s;
      const benchSlot = bench.slot;
      const slotSlot = slot.slot;
      return {
        ...s,
        players: s.players.map((p) => {
          if (p.id === benchId) return { ...p, slot: slotSlot };
          if (p.id === slotId) return { ...p, slot: benchSlot };
          return p;
        }),
      };
    });
  }, []);

  const upgradeStat = useCallback((playerId: string, stat: 'speed' | 'shoot' | 'pass' | 'def') => {
    let success = false;
    setState((s) => {
      const player = s.players.find((p) => p.id === playerId);
      if (!player) return s;
      const currentVal = player[stat];
      if (currentVal >= 99) return s;
      const cost = UPGRADE_COST_PER_POINT;
      if (s.coins < cost) return s;
      success = true;
      return {
        ...s,
        coins: s.coins - cost,
        players: s.players.map((p) =>
          p.id === playerId ? { ...p, [stat]: currentVal + 1 } : p
        ),
      };
    });
    return success;
  }, []);

  const upgradeStadium = useCallback(() => {
    let success = false;
    setState((s) => {
      const next = STADIUM_LEVELS.find((l) => l.id === s.stadiumLevel + 1);
      if (!next || s.coins < next.upgradeCost) return s;
      success = true;
      return { ...s, coins: s.coins - next.upgradeCost, stadiumLevel: s.stadiumLevel + 1 };
    });
    return success;
  }, []);

  const applyMatchResult = useCallback((stats: MatchStats) => {
    setState((s) => ({
      ...s,
      coins: s.coins + stats.coinsEarned,
      diamonds: s.diamonds + (stats.result === 'win' ? 2 : stats.result === 'draw' ? 1 : 0),
    }));
  }, []);

  const setTeamName = useCallback((name: string) => {
    setState((s) => ({ ...s, teamName: name }));
  }, []);

  const setTeamColors = useCallback((colors: [string, string]) => {
    setState((s) => ({ ...s, teamLogoColors: colors }));
  }, []);

  return {
    state,
    addCoins,
    addDiamonds,
    buyPlayer,
    sellPlayer,
    swapPlayer,
    upgradeStat,
    upgradeStadium,
    applyMatchResult,
    setTeamName,
    setTeamColors,
  };
}
