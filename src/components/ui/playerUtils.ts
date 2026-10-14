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

// ===== FIXED: REAL NAIJA FACES - NO UPLOAD, GITHUB AUTO DOWNLOADS =====
const REMOTE_FACES: Record<string, string> = {
  'osimhen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Victor_Osimhen_2023.jpg/440px-Victor_Osimhen_2023.jpg',
  'okoro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Victor_Osimhen_2023.jpg/440px-Victor_Osimhen_2023.jpg',
  'okafor': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Victor_Osimhen_2023.jpg/440px-Victor_Osimhen_2023.jpg',
  'lookman': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Ademola_Lookman_2024.jpg/440px-Ademola_Lookman_2024.jpg',
  'chukwueze': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Samuel_Chukwueze.jpg/440px-Samuel_Chukwueze.jpg',
  'ndidi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Wilfred_Ndidi.jpg/440px-Wilfred_Ndidi.jpg',
  'iwobi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Alex_Iwobi_2019.jpg/440px-Alex_Iwobi_2019.jpg',
  'boniface': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Victor_Boniface.jpg/440px-Victor_Boniface.jpg',
  'awoniyi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Taiwo_Awoniyi_2022.jpg/440px-Taiwo_Awoniyi_2022.jpg',
  'bassey': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Calvin_Bassey_2022.jpg/440px-Calvin_Bassey_2022.jpg',
  'ari bo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Joe_Aribo.jpg/440px-Joe_Aribo.jpg',
  'musa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Ahmed_Musa_2018.jpg/440px-Ahmed_Musa_2018.jpg',
  'simon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Moses_Simon.jpg/440px-Moses_Simon.jpg',
  'onyeka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Frank_Onyeka.jpg/440px-Frank_Onyeka.jpg',
  'nwabali': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Stanley_Nwabali.jpg/440px-Stanley_Nwabali.jpg',
};

// Fallback realistic black faces - no upload needed
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

  // 1. Check exact match in real faces
  if (REMOTE_FACES[lastName]) return REMOTE_FACES[lastName];
  if (REMOTE_FACES[clean]) return REMOTE_FACES[clean];

  // 2. Check if any key is inside the name
  for (const key in REMOTE_FACES) {
    if (clean.includes(key)) return REMOTE_FACES[key];
  }

  // 3. Check fallback
  for (const key in FALLBACK_FACES) {
    if (clean.includes(key.toLowerCase())) return FALLBACK_FACES[key];
  }

  // 4. Final: generate consistent real face from pravatar (no upload)
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
