export type Screen = 'hub' | 'transfers' | 'upgrade' | 'stadium' | 'match' | 'p2p';

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: string;
  name: string;
  position: Position;
  speed: number;
  shoot: number;
  pass: number;
  def: number;
  price: number;
  isOwned: boolean;
  // Formation slot index (0 = GK, 1-4 = DEF, 5-7 = MID, 8-10 = FWD)
  slot: number;
  flagColors: [string, string];
}

export interface StadiumLevel {
  id: number;
  name: string;
  description: string;
  capacity: number;
  upgradeCost: number;
  accentColor: string;
}

export interface MatchStats {
  goalsHome: number;
  goalsAway: number;
  possessionHome: number;
  shotsHome: number;
  shotsAway: number;
  coinsEarned: number;
  result: 'win' | 'loss' | 'draw';
}

export interface GameState {
  coins: number;
  diamonds: number;
  teamName: string;
  teamLogoColors: [string, string];
  stadiumLevel: number;
  players: Player[];
}
