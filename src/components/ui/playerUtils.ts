import type { Player } from '@/types/game';

const POS_COLORS: Record<string, string> = {
  GK: '#f59e0b',
  DEF: '#3b82f6',
  MID: '#10b981',
  FWD: '#ef4444',
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

export function getRatingColor(rating: number): string {
  if (rating >= 85) return '#ffd700';
  if (rating >= 78) return '#a78bfa';
  if (rating >= 70) return '#60a5fa';
  if (rating >= 60) return '#34d399';
  return '#94a3b8';
}
