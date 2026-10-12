import { useState, useCallback, useRef } from 'react';
import { ArrowLeft, Play, Users, Wifi, ChevronRight } from 'lucide-react';
import type { Screen, GameState, MatchStats } from '@/types/game';
import { useGameState } from '@/hooks/useGameState';
import { TeamHub } from '@/components/screens/TeamHub';
import { Transfers } from '@/components/screens/Transfers';
import { Upgrade } from '@/components/screens/Upgrade';
import { Stadium } from '@/components/screens/Stadium';
import { MatchScreen } from '@/components/screens/MatchScreen';
import { P2PScreen } from '@/components/screens/P2PScreen';
import { FootballGame, type MatchConfig, type MatchResult } from '@/game/FootballGame';
import { OPPONENTS } from '@/data/players';
import type { DataConnection } from 'peerjs';

type MatchSetup = {
  config: MatchConfig;
  opponentName: string;
  isP2P: boolean;
  p2pConn?: DataConnection;
};

function App() {
  const game = useGameState();
  const [screen, setScreen] = useState<Screen>('hub');
  const [matchSetup, setMatchSetup] = useState<MatchSetup | null>(null);
  const [showOpponentSelect, setShowOpponentSelect] = useState(false);
  const p2pConnRef = useRef<DataConnection | null>(null);

  const handleNavigate = useCallback((s: Screen) => {
    setScreen(s);
  }, []);

  const getHomeStats = () => {
    const starting = game.state.players
      .filter((p) => p.slot >= 0)
      .sort((a, b) => a.slot - b.slot);
    // Ensure 11 players
    while (starting.length < 11) {
      starting.push({ speed: 60, shoot: 60, pass: 60, def: 60 } as any);
    }
    return starting.slice(0, 11).map((p) => ({
      speed: p.speed,
      shoot: p.shoot,
      pass: p.pass,
      def: p.def,
    }));
  };

  const startMatch = useCallback((opponentIndex: number) => {
    const opp = OPPONENTS[opponentIndex];
    const config: MatchConfig = {
      homeColors: game.state.teamLogoColors,
      awayColors: opp.colors,
      stadiumLevel: game.state.stadiumLevel,
      homeStats: getHomeStats(),
      awayDifficulty: opp.difficulty,
      isP2P: false,
    };
    setMatchSetup({ config, opponentName: opp.name, isP2P: false });
    setScreen('match');
    setShowOpponentSelect(false);
  }, [game.state]);

  const handleMatchEnd = useCallback((result: MatchResult) => {
    const resultType = result.scoreHome > result.scoreAway ? 'win' : result.scoreHome < result.scoreAway ? 'loss' : 'draw';
    const coinsEarned = resultType === 'win' ? 500 + result.scoreHome * 100 : resultType === 'draw' ? 200 : 50 + result.scoreHome * 50;
    const matchStats: MatchStats = {
      goalsHome: result.scoreHome,
      goalsAway: result.scoreAway,
      possessionHome: result.possessionHome,
      shotsHome: result.shotsHome,
      shotsAway: result.shotsAway,
      coinsEarned,
      result: resultType,
    };
    game.applyMatchResult(matchStats);
    setMatchSetup(null);
    setScreen('hub');
  }, [game]);

  const handleExitMatch = useCallback(() => {
    setMatchSetup(null);
    setScreen('hub');
  }, []);

  const handleP2PStart = useCallback((code: string, isHost: boolean) => {
    const config: MatchConfig = {
      homeColors: game.state.teamLogoColors,
      awayColors: ['#cc0000', '#ffffff'],
      stadiumLevel: game.state.stadiumLevel,
      homeStats: getHomeStats(),
      awayDifficulty: 0.7,
      isP2P: true,
    };
    setMatchSetup({ config, opponentName: 'Friend', isP2P: true });
    setScreen('match');
  }, [game.state]);

  // Opponent selection overlay
  if (showOpponentSelect) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <button onClick={() => setShowOpponentSelect(false)} className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-black text-white">Select Opponent</h1>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {OPPONENTS.map((opp, i) => (
            <button
              key={i}
              onClick={() => startMatch(i)}
              className="w-full flex items-center gap-3 bg-slate-800/70 rounded-xl p-4 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition active:scale-95"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${opp.colors[0]}, ${opp.colors[1]})` }}
              >
                <span className="text-white font-black text-xs">{opp.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-sm font-bold text-white">{opp.name}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div
                      key={j}
                      className={`w-1.5 h-1.5 rounded-full ${j < Math.round(opp.difficulty * 5) ? 'bg-amber-400' : 'bg-slate-600'}`}
                    />
                  ))}
                  <span className="text-[10px] text-slate-500 ml-1">
                    {opp.difficulty < 0.7 ? 'Easy' : opp.difficulty < 0.8 ? 'Medium' : 'Hard'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (screen === 'match' && matchSetup) {
    return (
      <MatchScreen
        config={matchSetup.config}
        onExit={handleExitMatch}
        onMatchEnd={handleMatchEnd}
        opponentName={matchSetup.opponentName}
      />
    );
  }

  if (screen === 'p2p') {
    return <P2PScreen onNavigate={handleNavigate} onP2PStart={handleP2PStart} />;
  }

  if (screen === 'transfers') {
    return (
      <Transfers
        state={game.state}
        onBuyPlayer={game.buyPlayer}
        onSellPlayer={game.sellPlayer}
        onUpgradeStat={game.upgradeStat}
        onNavigate={handleNavigate}
      />
    );
  }

  if (screen === 'upgrade') {
    return (
      <Upgrade
        state={game.state}
        onUpgradeStat={game.upgradeStat}
        onNavigate={handleNavigate}
      />
    );
  }

  if (screen === 'stadium') {
    return (
      <Stadium
        state={game.state}
        onUpgradeStadium={game.upgradeStadium}
        onNavigate={handleNavigate}
      />
    );
  }

  // Hub screen with friendly match button
  return (
    <div className="relative">
      <TeamHubWithFriendly
        state={game.state}
        onUpgradeStat={game.upgradeStat}
        onNavigate={handleNavigate}
        onSetTeamName={game.setTeamName}
        onSetTeamColors={game.setTeamColors}
        onPlayMatch={() => setShowOpponentSelect(true)}
        onFriendlyMatch={() => setScreen('p2p')}
      />
    </div>
  );
}

// Extended Team Hub with Friendly Match button
function TeamHubWithFriendly(
  props: {
    state: GameState;
    onUpgradeStat: (id: string, stat: 'speed' | 'shoot' | 'pass' | 'def') => void;
    onNavigate: (screen: Screen) => void;
    onSetTeamName: (name: string) => void;
    onSetTeamColors: (colors: [string, string]) => void;
    onPlayMatch: () => void;
    onFriendlyMatch: () => void;
  }
) {
  return (
    <div className="relative">
      <TeamHub
        state={props.state}
        onUpgradeStat={props.onUpgradeStat}
        onNavigate={props.onNavigate}
        onSetTeamName={props.onSetTeamName}
        onSetTeamColors={props.onSetTeamColors}
      />
      {/* Floating Friendly Match button */}
      <button
        onClick={props.onFriendlyMatch}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold text-xs shadow-2xl border border-white/20 active:scale-95 hover:brightness-110 transition"
      >
        <Wifi className="w-4 h-4" />
        FRIENDLY
      </button>
    </div>
  );
}

export default App;
