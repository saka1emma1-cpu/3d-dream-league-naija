import type { Player, StadiumLevel } from '@/types/game';

// Emma FC starting squad — 4-3-3 formation (11 players)
export const INITIAL_SQUAD: Player[] = [
  // GK
  { id: 'p1', name: 'Chidi Okafor', position: 'GK', speed: 55, shoot: 30, pass: 45, def: 68, price: 0, isOwned: true, slot: 0, flagColors: ['#0a7d28', '#ffffff'] },
  // DEF (4)
  { id: 'p2', name: 'Tunde Bello', position: 'DEF', speed: 62, shoot: 35, pass: 50, def: 72, price: 0, isOwned: true, slot: 1, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'p3', name: 'Emeka Nwosu', position: 'DEF', speed: 65, shoot: 38, pass: 52, def: 70, price: 0, isOwned: true, slot: 2, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'p4', name: 'Sani Mohammed', position: 'DEF', speed: 60, shoot: 40, pass: 48, def: 74, price: 0, isOwned: true, slot: 3, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'p5', name: 'Kunle Ajayi', position: 'DEF', speed: 68, shoot: 33, pass: 55, def: 69, price: 0, isOwned: true, slot: 4, flagColors: ['#0a7d28', '#ffffff'] },
  // MID (3)
  { id: 'p6', name: 'Femi Adebayo', position: 'MID', speed: 70, shoot: 55, pass: 75, def: 60, price: 0, isOwned: true, slot: 5, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'p7', name: 'Ibrahim Musa', position: 'MID', speed: 72, shoot: 60, pass: 78, def: 58, price: 0, isOwned: true, slot: 6, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'p8', name: 'Victor Eze', position: 'MID', speed: 74, shoot: 65, pass: 72, def: 55, price: 0, isOwned: true, slot: 7, flagColors: ['#0a7d28', '#ffffff'] },
  // FWD (3)
  { id: 'p9', name: 'Danny Okoro', position: 'FWD', speed: 78, shoot: 76, pass: 60, def: 40, price: 0, isOwned: true, slot: 8, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'p10', name: 'Samuel Obi', position: 'FWD', speed: 80, shoot: 80, pass: 58, def: 38, price: 0, isOwned: true, slot: 9, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'p11', name: 'Ahmed Lawal', position: 'FWD', speed: 82, shoot: 74, pass: 62, def: 42, price: 0, isOwned: true, slot: 10, flagColors: ['#0a7d28', '#ffffff'] },
];

// Transfer market — Naija stars + rising talent
export const TRANSFER_MARKET: Player[] = [
  { id: 'm1', name: 'V. Osimhen', position: 'FWD', speed: 88, shoot: 85, pass: 65, def: 42, price: 3500, isOwned: false, slot: -1, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'm2', name: 'A. Lookman', position: 'FWD', speed: 86, shoot: 82, pass: 78, def: 45, price: 3000, isOwned: false, slot: -1, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'm3', name: 'W. Simon', position: 'MID', speed: 84, shoot: 70, pass: 82, def: 55, price: 2200, isOwned: false, slot: -1, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'm4', name: 'F. Onyeka', position: 'MID', speed: 80, shoot: 65, pass: 78, def: 72, price: 1800, isOwned: false, slot: -1, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'm5', name: 'C. Nwabali', position: 'GK', speed: 60, shoot: 35, pass: 55, def: 85, price: 1500, isOwned: false, slot: -1, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'm6', name: 'Z. Sanusi', position: 'DEF', speed: 82, shoot: 40, pass: 65, def: 80, price: 1600, isOwned: false, slot: -1, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'm7', name: 'S. Chukwueze', position: 'FWD', speed: 90, shoot: 78, pass: 70, def: 38, price: 2800, isOwned: false, slot: -1, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'm8', name: 'T. Awoniyi', position: 'FWD', speed: 82, shoot: 80, pass: 62, def: 45, price: 2400, isOwned: false, slot: -1, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'm9', name: 'F. Bassey', position: 'DEF', speed: 78, shoot: 45, pass: 60, def: 84, price: 2000, isOwned: false, slot: -1, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'm10', name: 'J. Aribo', position: 'MID', speed: 78, shoot: 68, pass: 80, def: 62, price: 1900, isOwned: false, slot: -1, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'm11', name: 'M. Onyedika', position: 'MID', speed: 76, shoot: 60, pass: 76, def: 75, price: 1700, isOwned: false, slot: -1, flagColors: ['#0a7d28', '#ffffff'] },
  { id: 'm12', name: 'B. Osayi-Samuel', position: 'DEF', speed: 85, shoot: 50, pass: 68, def: 78, price: 1800, isOwned: false, slot: -1, flagColors: ['#0a7d28', '#ffffff'] },
];

export const STADIUM_LEVELS: StadiumLevel[] = [
  { id: 0, name: 'Ajegunle Pitch', description: 'Sandy street field with wooden goalposts', capacity: 200, upgradeCost: 0, accentColor: '#c4956a' },
  { id: 1, name: 'Local Council Ground', description: 'Basic fenced pitch with small stands', capacity: 1000, upgradeCost: 800, accentColor: '#8b9dc3' },
  { id: 2, name: 'State Stadium', description: 'Provincial stadium with roof cover', capacity: 5000, upgradeCost: 2000, accentColor: '#6ba368' },
  { id: 3, name: 'National Stadium', description: 'World-class arena with floodlights', capacity: 60000, upgradeCost: 5000, accentColor: '#d4af37' },
];

// AI opponent teams
export const OPPONENTS = [
  { name: 'Kano Pillars', colors: ['#cc0000', '#ffffff'] as [string, string], difficulty: 0.6 },
  { name: 'Enyimba FC', colors: ['#0066cc', '#ffffff'] as [string, string], difficulty: 0.7 },
  { name: 'Rangers Int\'l', colors: ['#cc6600', '#ffffff'] as [string, string], difficulty: 0.75 },
  { name: 'Shooting Stars', colors: ['#663300', '#ffcc00'] as [string, string], difficulty: 0.8 },
  { name: 'Sunshine FC', colors: ['#ff9900', '#000000'] as [string, string], difficulty: 0.85 },
];

export const UPGRADE_COST_PER_POINT = 150;
