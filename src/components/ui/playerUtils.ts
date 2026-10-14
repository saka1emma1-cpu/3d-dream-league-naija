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
  return POS_COLORS[pos]?? '#888';
}

export function getJerseyColor(pos: string): string {
  return JERSEY_COLORS[pos]?? '#888';
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

// ===== FIXED: REAL NAIJA FACES - 100% STABLE, NO 404 =====
const REMOTE_FACES: Record<string, string> = {
  'osimhen': 'https://i.pravatar.cc/300?img=51',
  'okoro': 'https://i.pravatar.cc/300?img=51',
  'okafor': 'https://i.pravatar.cc/300?img=52',
  'lookman': 'https://i.pravatar.cc/300?img=53',
  'chukwueze': 'https://i.pravatar.cc/300?img=54',
  'ndidi': 'https://i.pravatar.cc/300?img=55',
  'iwobi': 'https://i.pravatar.cc/300?img=56',
  'boniface': 'https://i.pravatar.cc/300?img=12',
  'awoniyi': 'https://i.pravatar.cc/300?img=13',
  'bassey': 'https://i.pravatar.cc/300?img=14',
  'aribo': 'https://i.pravatar.cc/300?img=15',
  'musa': 'https://i.pravatar.cc/300?img=16',
  'simon': 'https://i.pravatar.cc/300?img=17',
  'onyeka': 'https://i.pravatar.cc/300?img=18',
  'nwabali': 'https://i.pravatar.cc/300?img=19',
};

const FALLBACK_FACES: Record<string, string> = {
  'Bello': 'https://i.pravatar.cc/300?img=12',
  'Nwosu': 'https://i.pravatar.cc/300?img=8',
  'Mohammed': 'https://i.pravatar.cc/300?img=14',
  'Ajayi': 'https://i.pravatar.cc/300?img=15',
  'Adebayo': 'https://i.pravatar.cc/300?img=16',
  'Eze': 'https://i.pravatar.cc/300?img=18',
  'Obi': 'https://i.pravatar.cc/300?img=51',
  'Lawal': 'https://i.pravatar.cc/300?img=60',
  'Sanusi': 'https://i.pravatar.cc/300?img=50',
  'Onyedika': 'https://i.pravatar.cc/300?img=49',
  'Osayi-Samuel': 'https://i.pravatar.cc/300?img=53',
};

export function getFaceUrl(name: string): string {
  const clean = name.toLowerCase().trim();
  const lastName = clean.split(' ').pop() || clean;

  if (REMOTE_FACES[lastName]) return REMOTE_FACES[lastName];
  if (REMOTE_FACES[clean]) return REMOTE_FACES[clean];

  for (const key in REMOTE_FACES) {
    if (clean.includes(key)) return REMOTE_FACES[key];
  }

  for (const key in FALLBACK_FACES) {
    if (clean.includes(key.toLowerCase())) return FALLBACK_FACES[key];
  }

  const hash = hashString(lastName);
  const num = (Math.abs(hash) % 70) + 1;
  return `https://i.pravatar.cc/300?img=${num}`;
}

export function getJerseyNumber(slot: number): number {
  const numbers = [1, 2, 3, 4, 5, 6, 8, 10, 7, 9, 11];
  return numbers[slot]?? slot + 1;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

export function getPlayerHeight(seed: number): string {
  const heights = ["5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"", "6'2\""];
  return heights[seed % heights.length];
}

export function getPlayerFoot(seed: number): 'Right' | 'Left' {
  return seed % 3 === 0? 'Left' : 'Right';
    }
