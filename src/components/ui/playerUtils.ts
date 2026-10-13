import type { Player } from '@/types/game';

const POS_COLORS: Record<string, string> = {
  GK: '#f59e0b',
  DEF: '#3b82f6',
  MID: '#10b981',
  FWD: '#ef4444',
};

const JERSEY_COLORS: Record<string, string> = {
  GK: '#fbbf24',
  DEF: '#60a5fa',
  MID: '#34d399',
  FWD: '#f87171',
};

export function getOverall(p: Player): number {
  const weights: Record<string, number[]> = {
    GK: [0.1, 0.1, 0.3, 0.5],
    DEF: [0.2, 0.1, 0.2, 0.5],
    MID: [0.2, 0.25, 0.35, 0.2],
    FWD: [0.25, 0.45, 0.2, 0.1],
  };
  const w = weights[p.position];
  return Math.round(p.speed * w[0] + p.shoot * w[1] + p.pass * w[2] + p.def * w[3]);
}

export function getPosColor(pos: string): string {
  return POS_COLORS[pos] ?? '#888';
}

export function getJerseyColor(pos: string): string {
  return JERSEY_COLORS[pos] ?? '#888';
}

export function getRatingColor(rating: number): string {
  if (rating >= 85) return '#ffd700';
  if (rating >= 78) return '#a78bfa';
  if (rating >= 70) return '#60a5fa';
  if (rating >= 60) return '#34d399';
  return '#94a3b8';
}

export function getRatingGlow(rating: number): string {
  if (rating >= 85) return '0 0 8px 2px rgba(255,215,0,0.6)';
  if (rating >= 78) return '0 0 8px 2px rgba(167,139,250,0.5)';
  if (rating >= 70) return '0 0 8px 2px rgba(96,165,250,0.5)';
  if (rating >= 60) return '0 0 6px 1px rgba(52,211,153,0.4)';
  return '0 0 4px 1px rgba(148,163,184,0.3)';
}

export function getAvatarUrl(name: string): string {
  const seed = encodeURIComponent(name.split(' ').pop() || name);
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9&skinColor=8d5524,a86e3c,c68642`;
}

export function getPlayerHeight(seed: number): string {
  const heights = ["5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"", "6'2\""];
  return heights[seed % heights.length];
}

export function getPlayerFoot(seed: number): 'Right' | 'Left' {
  return seed % 3 === 0 ? 'Left' : 'Right';
}
