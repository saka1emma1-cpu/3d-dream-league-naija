import { useRef, useState, useEffect, useCallback } from 'react';
import { X, Footprints, Zap, Hand } from 'lucide-react';
import { FootballGame, type MatchResult, type MatchConfig, type RadarData } from '@/game/FootballGame';
import { Joystick, type JoystickHandle } from '@/components/ui/Joystick';
import { PostMatchScreen } from './PostMatchScreen';

interface Props {
  config: MatchConfig;
  onExit: () => void;
  onMatchEnd: (result: MatchResult) => void;
  opponentName: string;
}

export function MatchScreen({ config, onExit, onMatchEnd, opponentName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<FootballGame | null>(null);
  const joystickRef = useRef<JoystickHandle>(null);
  const [time, setTime] = useState(90);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [showGoalFlash, setShowGoalFlash] = useState(false);
  const [shootPower, setShootPower] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [stamina, setStamina] = useState(100);
  const [radar, setRadar] = useState<RadarData | null>(null);
  const [showKickoff, setShowKickoff] = useState(false);
  const shootHoldRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const game = new FootballGame(
      containerRef.current,
      { ...config, onStaminaUpdate: setStamina, onRadarUpdate: setRadar, onKickoffStart: () => { setShowKickoff(true); setTimeout(() => setShowKickoff(false), 3000); } },
      {
        onGoal: () => {
          setShowGoalFlash(true);
          setShowCelebration(true);
          setTimeout(() => setShowGoalFlash(false), 2000);
          setTimeout(() => setShowCelebration(false), 3000);
        },
        onMatchEnd: (result) => {
          setMatchResult(result);
        },
        onTimeUpdate: (t) => setTime(t),
        onScoreUpdate: (h, a) => setScore({ home: h, away: a }),
      }
    );
    gameRef.current = game;
    game.start();

    return () => {
      game.dispose();
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoystick = useCallback((x: number, y: number) => {
    gameRef.current?.setInput(x, y);
  }, []);

  const handlePassStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    gameRef.current?.triggerPass();
  }, []);

  const handleShootStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (shootHoldRef.current) clearInterval(shootHoldRef.current);
    setShootPower(0);
    let power = 0;
    shootHoldRef.current = setInterval(() => {
      power = Math.min(power + 4, 100);
      setShootPower(power);
    }, 40);
  }, []);

  const handleShootEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (shootHoldRef.current) {
      clearInterval(shootHoldRef.current);
      shootHoldRef.current = null;
    }
    gameRef.current?.triggerShoot();
    setShootPower(0);
  }, []);

  const [sprinting, setSprinting] = useState(false);

  const handleSprint = useCallback((active: boolean) => {
    setSprinting(active);
    gameRef.current?.setSprint(active);
  }, []);

  const handleMatchResult = () => {
    if (matchResult) onMatchEnd(matchResult);
  };

  if (matchResult) {
    return (
      <PostMatchScreen
        result={matchResult}
        teamName="Emma FC"
        opponentName={opponentName}
        onContinue={handleMatchResult}
      />
    );
  }

  const renderRadar = () => {
    if (!radar) return null;
    return (
      <div className="absolute top-3 left-3 w-20 h-32 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 pointer-events-none overflow-hidden z-10">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0d5c1f, #0a4d1a)' }} />
        <div className="absolute inset-1 border border-white/20 rounded-sm" />
        <div className="absolute left-0 right-0 top-1/2 border-t border-white/15" />
        {radar.homePlayers.map(([x, z], i) => (
          <div key={`h${i}`} className="absolute w-1 h-1 rounded-full bg-emerald-400" style={{
            left: `${(x * 0.5 + 0.5) * 100}%`,
            top: `${(z * 0.5 + 0.5) * 100}%`,
            transform: 'translate(-50%, -50%)',
          }} />
        ))}
        {radar.awayPlayers.map(([x, z], i) => (
          <div key={`a${i}`} className="absolute w-1 h-1 rounded-full bg-red-400" style={{
            left: `${(x * 0.5 + 0.5) * 100}%`,
            top: `${(z * 0.5 + 0.5) * 100}%`,
            transform: 'translate(-50%, -50%)',
          }} />
        ))}
        <div className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]" style={{
          left: `${(radar.ballX * 0.5 + 0.5) * 100}%`,
          top: `${(radar.ballZ * 0.5 + 0.5) * 100}%`,
          transform: 'translate(-50%, -50%)',
        }} />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none">
      <div ref={containerRef} className="absolute inset-0" />
      {renderRadar()}

      {showKickoff && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 bg-black/40">
          <div className="text-center animate-[kickoffFade_3s_ease_forwards]">
            <h2 className="text-5xl font-black text-white tracking-widest drop-shadow-2xl mb-2">KICK OFF</h2>
            <p className="text-lg text-emerald-400 font-bold">EMMA FC vs {opponentName.toUpperCase()}</p>
          </div>
          <style>{`
            @keyframes kickoffFade {
              0% { opacity: 0; transform: scale(0.8); }
              15% { opacity: 1; transform: scale(1); }
              80% { opacity: 1; transform: scale(1); }
              100% { opacity: 0; transform: scale(1.1); }
            }
          `}</style>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 flex justify-center pt-3 pointer-events-none">
        <div className="flex items-center gap-3 bg-black/70 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 shadow-xl">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: config.homeColors[0] }} />
            <span className="text-white text-xs font-bold">EMMA FC</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-lg">
            <span className="text-white text-xl font-black tabular-nums">{score.home}</span>
            <span className="text-slate-500 text-sm">:</span>
            <span className="text-white text-xl font-black tabular-nums">{score.away}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white text-xs font-bold">{opponentName.toUpperCase()}</span>
            <div className="w-3 h-3 rounded-sm" style={{ background: config.awayColors[0] }} />
          </div>
        </div>
      </div>

      <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1 border border-white/10">
          <span className="text-emerald-400 text-sm font-bold tabular-nums">{time}s</span>
        </div>
      </div>

      <button onClick={onExit} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/10 pointer-events-auto hover:bg-black/80 transition">
        <X className="w-5 h-5 text-white" />
      </button>

      {shootPower > 0 && (
        <div className="absolute bottom-32 right-8 w-3 h-32 bg-black/50 rounded-full overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 rounded-full transition-all" style={{
            height: `${shootPower}%`,
            background: `linear-gradient(to top, ${shootPower < 50 ? '#10b981' : shootPower < 80 ? '#f59e0b' : '#ef4444'}, #ef4444)`,
          }} />
        </div>
      )}

      {showGoalFlash && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-emerald-500/20 backdrop-blur-sm absolute inset-0 animate-pulse" />
          <div className="relative z-10 text-center">
            <h2 className="text-6xl font-black text-white tracking-wider drop-shadow-2xl" style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>GOAL!</h2>
          </div>
        </div>
      )}

      {showCelebration && <CelebrationOverlay />}

      <div className="absolute bottom-40 left-4 w-28 pointer-events-none">
        <div className="flex items-center gap-1 mb-0.5">
          <Footprints className="w-3 h-3 text-cyan-400" />
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">Stamina</span>
        </div>
        <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
          <div className="h-full rounded-full transition-all" style={{
            width: `${stamina}%`,
            background: stamina > 50 ? 'linear-gradient(to right, #06b6d4, #22d3ee)' : stamina > 20 ? 'linear-gradient(to right, #f59e0b, #fbbf24)' : 'linear-gradient(to right, #dc2626, #ef4444)',
          }} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-4 pb-6 pointer-events-none">
        <div className="pointer-events-auto">
          <Joystick ref={joystickRef} onInput={handleJoystick} />
        </div>
        <div className="flex items-end gap-3 pointer-events-auto">
          <button
            onTouchStart={(e) => { e.preventDefault(); handleSprint(true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleSprint(false); }}
            onMouseDown={() => handleSprint(true)}
            onMouseUp={() => handleSprint(false)}
            onMouseLeave={() => sprinting && handleSprint(false)}
            disabled={stamina <= 0}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 shadow-lg transition active:scale-90 disabled:opacity-40 ${
              sprinting ? 'bg-cyan-500 border-white/40' : 'bg-black/50 border-white/20'
            }`}
          >
            <Footprints className="w-5 h-5 text-white" />
            <span className="text-[8px] font-bold text-white mt-0.5">SPRINT</span>
          </button>

          <button
            onTouchStart={handlePassStart}
            onMouseDown={handlePassStart}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border-2 border-white/30 shadow-lg flex flex-col items-center justify-center transition active:scale-90"
          >
            <Hand className="w-6 h-6 text-white" />
            <span className="text-[9px] font-bold text-white mt-0.5">PASS</span>
          </button>

          <button
            onTouchStart={handleShootStart}
            onTouchEnd={handleShootEnd}
            onMouseDown={handleShootStart}
            onMouseUp={handleShootEnd}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 border-2 border-white/30 shadow-lg flex flex-col items-center justify-center transition active:scale-90"
          >
            <Zap className="w-7 h-7 text-white" />
            <span className="text-[10px] font-bold text-white mt-0.5">SHOOT</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function CelebrationOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {Array.from({ length: 30 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 1.5 + Math.random();
        const colors = ['#10b981', '#ffd700', '#ffffff', '#f59e0b'];
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 8;
        return (
          <div key={i} className="absolute top-0" style={{
            left: `${left}%`,
            width: `${size}px`,
            height: `${size * 1.5}px`,
            background: color,
            borderRadius: '2px',
            animation: `fall ${duration}s ease-in ${delay}s forwards`,
            transform: 'rotate(0deg)',
          }} />
        );
      })}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
