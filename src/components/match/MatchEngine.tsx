import { useRef, useMemo, Suspense, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronLeft, Pause, Play } from 'lucide-react';
import { Pitch3D } from '@/components/three/Pitch3D';
import { Player3DModel, type AnimMode } from '@/components/three/Player3DModel';
import type { Player } from '@/types/game';
import { getOverall, getRatingColor, getAvatarUrl } from '@/components/ui/playerUtils';

interface Props {
  players: Player[];
  onExit: () => void;
}

// Formation positions for Emma FC (attacking upward, +Z)
const FORMATION_433: Record<number, [number, number, number]> = {
  0: [0, 0, -10],
  1: [-5.5, 0, -6],
  2: [-2, 0, -6],
  3: [2, 0, -6],
  4: [5.5, 0, -6],
  5: [-3.5, 0, -1],
  6: [0, 0, -0.5],
  7: [3.5, 0, -1],
  8: [-3, 0, 4],
  9: [0, 0, 5],
  10: [3, 0, 4],
};

// Opponent formation (attacking downward, -Z)
const OPP_FORMATION: [number, number, number][] = [
  [0, 0, 10],
  [-5.5, 0, 6],
  [-2, 0, 6],
  [2, 0, 6],
  [5.5, 0, 6],
  [-3.5, 0, 1],
  [0, 0, 0.5],
  [3.5, 0, 1],
  [-3, 0, -4],
  [0, 0, -5],
  [3, 0, -4],
];

const TEAM_JERSEY = '#D00000';
const TEAM_SHORTS = '#D00000';
const TEAM_SOCKS = '#D00000';
const OPP_JERSEY = '#E8E8E8';
const OPP_SHORTS = '#1a1a2e';
const OPP_SOCKS = '#E8E8E8';
const GOAL_Z = 11;
const OPP_GOAL_Z = -11;
const PITCH_HALF_W = 10;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface Entity {
  id: string;
  name: string;
  pos: THREE.Vector3;
  basePos: THREE.Vector3;
  isTeam: boolean;
  slot: number;
  position: string;
  rating: number;
  seed: number;
  jerseyColor: string;
  shortsColor: string;
  socksColor: string;
}

interface BallState {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  owner: string | null;
  isShot: boolean;
  shotProgress: number;
  shotStart: THREE.Vector3;
  shotEnd: THREE.Vector3;
}

function GoalText({ scorer, rating }: { scorer: string; rating: number }) {
  const [scale, setScale] = useState(0.5);
  useFrame((state) => {
    setScale(1 + Math.sin(state.clock.elapsedTime * 4) * 0.15);
  });
  return (
    <Html position={[0, 4, 0]} center distanceFactor={6} zIndexRange={[20, 0]} pointerEvents="none">
      <div className="flex flex-col items-center select-none" style={{ transform: `scale(${scale})` }}>
        <div className="text-5xl font-black text-yellow-400 tracking-wider" style={{ textShadow: '3px 3px 0 #000, -1px -1px 0 #000' }}>
          GOOOAL!
        </div>
        <div className="text-xl font-bold text-white mt-1" style={{ textShadow: '2px 2px 0 #000' }}>
          {scorer} {rating}
        </div>
      </div>
    </Html>
  );
}

function MatchScene({
  players,
  joystickRef,
  actionRef,
  scoreRef,
  pausedRef,
  onGoal,
}: {
  players: Player[];
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
  actionRef: React.MutableRefObject<{ pass: number; shoot: number; through: number; sprint: number }>;
  scoreRef: React.MutableRefObject<{ home: number; away: number }>;
  pausedRef: React.MutableRefObject<boolean>;
  onGoal: (scorer: string, rating: number, isTeam: boolean) => void;
}) {
  const { camera } = useThree();
  const cameraShake = useRef(0);
  const sprintTimer = useRef(0);

  // Build entities once
  const entities = useMemo(() => {
    const team = players.filter((p) => p.slot >= 0).sort((a, b) => a.slot - b.slot);
    const list: Entity[] = [];

    team.forEach((p) => {
      const pos = FORMATION_433[p.slot];
      const seed = hashId(p.id);
      const ovr = getOverall(p);
      list.push({
        id: p.id,
        name: p.name.split(' ').pop() || p.name,
        pos: new THREE.Vector3(pos[0], pos[1], pos[2]),
        basePos: new THREE.Vector3(pos[0], pos[1], pos[2]),
        isTeam: true,
        slot: p.slot,
        position: p.position,
        rating: ovr,
        seed,
        jerseyColor: p.position === 'GK' ? '#22c55e' : TEAM_JERSEY,
        shortsColor: p.position === 'GK' ? '#1a1a1a' : TEAM_SHORTS,
        socksColor: p.position === 'GK' ? '#1a1a1a' : TEAM_SOCKS,
      });
    });

    // Opponents
    const oppNames = ['Martinez', 'Lopez', 'Garcia', 'Silva', 'Costa', 'Fernandes', 'Vega', 'Pinto', 'Ramos', 'Diaz', 'Santos'];
    OPP_FORMATION.forEach((pos, i) => {
      const seed = hashId('opp' + i);
      list.push({
        id: 'opp' + i,
        name: oppNames[i],
        pos: new THREE.Vector3(pos[0], pos[1], pos[2]),
        basePos: new THREE.Vector3(pos[0], pos[1], pos[2]),
        isTeam: false,
        slot: i,
        position: i === 0 ? 'GK' : i < 5 ? 'DEF' : i < 8 ? 'MID' : 'FWD',
        rating: 65 + (seed % 15),
        seed,
        jerseyColor: i === 0 ? '#fbbf24' : OPP_JERSEY,
        shortsColor: OPP_SHORTS,
        socksColor: OPP_SOCKS,
      });
    });

    return list;
  }, [players]);

  const ballState = useRef<BallState>({
    pos: new THREE.Vector3(0, 0.15, 0),
    vel: new THREE.Vector3(0, 0, 0),
    owner: null,
    isShot: false,
    shotProgress: 0,
    shotStart: new THREE.Vector3(),
    shotEnd: new THREE.Vector3(),
  });

  const [goalData, setGoalData] = useState<{ scorer: string; rating: number; isTeam: boolean } | null>(null);
  const [controlledId, setControlledId] = useState<string>(
    players.filter((p) => p.slot >= 0).sort((a, b) => a.slot - b.slot).find((p) => p.position === 'FWD')?.id ?? ''
  );
  const controlledRef = useRef(controlledId);
  useEffect(() => { controlledRef.current = controlledId; }, [controlledId]);

  useFrame((state, delta) => {
    if (pausedRef.current) return;
    const t = state.clock.elapsedTime;
    const ball = ballState.current;
    const ctrlId = controlledRef.current;
    const ctrlEntity = entities.find((e) => e.id === ctrlId);
    const joy = joystickRef.current;

    // Camera with shake
    if (cameraShake.current > 0) {
      camera.position.x += (Math.random() - 0.5) * cameraShake.current;
      camera.position.y += (Math.random() - 0.5) * cameraShake.current;
      cameraShake.current *= 0.9;
      if (cameraShake.current < 0.01) cameraShake.current = 0;
    }

    // Sprint timer
    if (sprintTimer.current > 0) sprintTimer.current -= delta;

    // Move controlled player by joystick
    if (ctrlEntity) {
      const speed = sprintTimer.current > 0 ? 0.22 : 0.11;
      ctrlEntity.pos.x += joy.x * speed;
      ctrlEntity.pos.z += joy.y * speed;
      // Clamp to pitch
      ctrlEntity.pos.x = THREE.MathUtils.clamp(ctrlEntity.pos.x, -PITCH_HALF_W, PITCH_HALF_W);
      ctrlEntity.pos.z = THREE.MathUtils.clamp(ctrlEntity.pos.z, -GOAL_Z, GOAL_Z);
    }

    // Ball physics
    if (ball.isShot) {
      ball.shotProgress += delta * 1.5;
      const p = Math.min(ball.shotProgress, 1);
      ball.pos.x = THREE.MathUtils.lerp(ball.shotStart.x, ball.shotEnd.x, p);
      ball.pos.z = THREE.MathUtils.lerp(ball.shotStart.z, ball.shotEnd.z, p);
      ball.pos.y = 0.15 + Math.sin(p * Math.PI) * 2.5;

      if (p >= 1) {
        ball.isShot = false;
        ball.owner = null;
        ball.vel.set(0, 0, 0);
      }

      // GK save attempt
      const targetGK = entities.find((e) => !e.isTeam && e.position === 'GK');
      if (targetGK && Math.random() < 0.4 && p > 0.3 && p < 0.7) {
        if (Math.abs(ball.pos.x - targetGK.pos.x) < 1.5 && Math.abs(ball.pos.z - targetGK.pos.z) < 1) {
          ball.isShot = false;
          ball.owner = targetGK.id;
          ball.pos.copy(targetGK.pos);
          ball.pos.y = 0.15;
        }
      }
    } else if (ball.owner) {
      const owner = entities.find((e) => e.id === ball.owner);
      if (owner) {
        // Ball follows owner
        ball.pos.x = owner.pos.x;
        ball.pos.z = owner.pos.z + (owner.isTeam ? 0.3 : -0.3);
        ball.pos.y = 0.15;

        // Opponent AI: dribble toward team goal
        if (!owner.isTeam) {
          owner.pos.z -= 0.06 + (owner.rating - 60) * 0.002;
          owner.pos.x += Math.sin(t * 2 + owner.seed) * 0.05;
          owner.pos.x = THREE.MathUtils.clamp(owner.pos.x, -PITCH_HALF_W, PITCH_HALF_W);

          // Shoot at team goal
          if (owner.pos.z < -7 && Math.random() < 0.01) {
            ball.isShot = true;
            ball.shotProgress = 0;
            ball.shotStart.copy(ball.pos);
            ball.shotEnd.set((Math.random() - 0.5) * 2, 0.5, -GOAL_Z);
            ball.owner = null;
          }
        }
      } else {
        ball.owner = null;
      }
    } else {
      // Loose ball - apply velocity
      ball.pos.add(ball.vel);
      ball.vel.multiplyScalar(0.95);
      ball.pos.y = 0.15;

      // Check possession
      entities.forEach((e) => {
        if (ball.owner) return;
        const d = e.pos.distanceTo(ball.pos);
        if (d < 0.9) {
          ball.owner = e.id;
          ball.vel.set(0, 0, 0);
        }
      });
    }

    // Goal detection
    if (ball.pos.z >= GOAL_Z - 0.7 && Math.abs(ball.pos.x) < 1.5 && ball.pos.y < 1.5 && !ball.isShot) {
      // Team scored
      scoreRef.current.home++;
      const scorer = ctrlEntity?.name ?? 'Obi';
      const rating = ctrlEntity?.rating ?? 71;
      cameraShake.current = 0.3;
      setGoalData({ scorer, rating, isTeam: true });
      onGoal(scorer, rating, true);
      // Reset
      ball.pos.set(0, 0.15, 0);
      ball.vel.set(0, 0, 0);
      ball.owner = null;
      ball.isShot = false;
      entities.forEach((e) => e.pos.copy(e.basePos));
      setTimeout(() => setGoalData(null), 3500);
    }
    if (ball.pos.z <= OPP_GOAL_Z + 0.7 && Math.abs(ball.pos.x) < 1.5 && ball.pos.y < 1.5 && !ball.isShot) {
      // Opponent scored
      scoreRef.current.away++;
      cameraShake.current = 0.3;
      setGoalData({ scorer: 'Diaz', rating: 68, isTeam: false });
      onGoal('Diaz', 68, false);
      ball.pos.set(0, 0.15, 0);
      ball.vel.set(0, 0, 0);
      ball.owner = null;
      ball.isShot = false;
      entities.forEach((e) => e.pos.copy(e.basePos));
      setTimeout(() => setGoalData(null), 3500);
    }

    // Non-controlled entity AI
    entities.forEach((e) => {
      if (e.id === ctrlId) return;

      if (e.isTeam) {
        // Team AI: return to formation, but support attack
        if (ball.owner === e.id) {
          // Has ball - move forward
          e.pos.z += 0.04;
        } else {
          // Move toward base but shift slightly toward ball
          const targetX = e.basePos.x + (ball.pos.x - e.basePos.x) * 0.15;
          const targetZ = e.basePos.z + (ball.pos.z - e.basePos.z) * 0.1;
          e.pos.x += (targetX - e.pos.x) * 0.03;
          e.pos.z += (targetZ - e.pos.z) * 0.03;
        }
      } else {
        // Opponent AI: chase ball or mark
        const distToBall = e.pos.distanceTo(ball.pos);
        if (distToBall < 4 && !ball.owner) {
          // Chase ball
          const dir = ball.pos.clone().sub(e.pos).normalize();
          e.pos.x += dir.x * 0.05;
          e.pos.z += dir.z * 0.05;
        } else if (ball.owner && !ball.isTeam && ball.owner.startsWith('opp')) {
          // Support attack
          e.pos.z -= 0.03;
        } else {
          // Return to formation
          e.pos.x += (e.basePos.x - e.pos.x) * 0.02;
          e.pos.z += (e.basePos.z - e.pos.z) * 0.02;
        }
      }
      e.pos.x = THREE.MathUtils.clamp(e.pos.x, -PITCH_HALF_W, PITCH_HALF_W);
      e.pos.z = THREE.MathUtils.clamp(e.pos.z, -GOAL_Z, GOAL_Z);
    });

    // Handle actions
    const act = actionRef.current;
    if (act.pass > 0) {
      act.pass = 0;
      if (ball.owner && ball.owner === ctrlId) {
        // Pass to nearest teammate
        let nearest = null as Entity | null;
        let minD = Infinity;
        entities.forEach((e) => {
          if (!e.isTeam || e.id === ctrlId) return;
          const d = e.pos.distanceTo(ctrlEntity!.pos);
          if (d < minD) { minD = d; nearest = e; }
        });
        if (nearest && ctrlEntity) {
          ball.owner = null;
          const dir = nearest.pos.clone().sub(ball.pos).normalize();
          ball.vel.copy(dir.multiplyScalar(0.3));
        }
      }
    }
    if (act.shoot > 0) {
      act.shoot = 0;
      if (ball.owner === ctrlId && ctrlEntity) {
        const distToGoal = Math.abs(GOAL_Z - ctrlEntity.pos.z);
        if (distToGoal < 16) {
          ball.isShot = true;
          ball.shotProgress = 0;
          ball.shotStart.copy(ball.pos);
          ball.shotEnd.set((Math.random() - 0.5) * 2, 0.5, GOAL_Z);
          ball.owner = null;
        }
      }
    }
    if (act.through > 0) {
      act.through = 0;
      if (ball.owner === ctrlId && ctrlEntity) {
        ball.owner = null;
        ball.vel.set(ctrlEntity.pos.x * 0.1, 0, 0.4);
      }
    }
    if (act.sprint > 0) {
      act.sprint = 0;
      sprintTimer.current = 2;
    }

    // Camera follows ball
    const camTargetX = ball.pos.x * 0.3;
    const camTargetY = 11;
    const camTargetZ = ball.pos.z * 0.2 - 14;
    camera.position.x += (camTargetX - camera.position.x) * 0.03;
    camera.position.y += (camTargetY - camera.position.y) * 0.03;
    camera.position.z += (camTargetZ - camera.position.z) * 0.03;
    camera.lookAt(ball.pos.x * 0.3, 0, ball.pos.z * 0.3);
  });

  // Render ball
  const ball = ballState.current;

  return (
    <>
      <color attach="background" args={['#0a3a15']} />
      <fog attach="fog" args={['#0a3a15', 30, 60]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, -5]} intensity={1.5} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-left={-15} shadow-camera-right={15}
        shadow-camera-top={15} shadow-camera-bottom={-15} />
      <directionalLight position={[-8, 10, 5]} intensity={0.3} color="#88aaff" />

      {/* Crowd */}
      <mesh position={[0, 2.5, -16]}><boxGeometry args={[30, 5, 0.5]} /><meshStandardMaterial color="#0a0e1a" /></mesh>
      <mesh position={[0, 2.5, 16]}><boxGeometry args={[30, 5, 0.5]} /><meshStandardMaterial color="#0a0e1a" /></mesh>
      <mesh position={[-16, 2.5, 0]}><boxGeometry args={[0.5, 5, 32]} /><meshStandardMaterial color="#0a0e1a" /></mesh>
      <mesh position={[16, 2.5, 0]}><boxGeometry args={[0.5, 5, 32]} /><meshStandardMaterial color="#0a0e1a" /></mesh>

      <Suspense fallback={null}>
        <Pitch3D />

        {/* Ball */}
        <mesh position={[ball.pos.x, ball.pos.y, ball.pos.z]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>

        {/* Ball control indicator */}
        {ball.owner && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ball.pos.x, 0.02, ball.pos.z]}>
            <ringGeometry args={[0.5, 0.65, 24]} />
            <meshBasicMaterial color={ball.owner.startsWith('opp') ? '#ff4444' : '#22ff22'} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        )}

        {entities.map((e) => {
          const isControlled = e.id === controlledId;
          const isScorer = goalData?.isTeam === e.isTeam && goalData?.scorer === e.name;
          let animMode: AnimMode = 'idle';
          let runTarget: [number, number, number] | null = null;

          const moving = e.pos.distanceTo(e.basePos) > 0.5 || (ball.owner === e.id);
          if (goalData) {
            animMode = 'celebrating';
          } else if (moving || isControlled) {
            animMode = 'running';
            runTarget = [e.pos.x, 0, e.pos.z];
          }

          return (
            <group key={e.id} position={[e.pos.x, e.pos.y, e.pos.z]}>
              <Player3DModel
                position={[0, 0, 0]}
                rating={e.rating}
                jerseyColor={e.jerseyColor}
                shortsColor={e.shortsColor}
                socksColor={e.socksColor}
                playerName={e.name}
                isSelected={false}
                seed={e.seed}
                animMode={animMode}
                runTarget={runTarget}
                isScorer={isScorer}
                avatarUrl={getAvatarUrl(e.name)}
                ratingColor={getRatingColor(e.rating)}
                onSelect={() => {}}
              />
              {/* Controlled player indicator */}
              {isControlled && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                  <ringGeometry args={[0.9, 1.05, 32]} />
                  <meshBasicMaterial color="#00ff00" transparent opacity={0.7} side={THREE.DoubleSide} />
                </mesh>
              )}
            </group>
          );
        })}

        {goalData && <GoalText scorer={goalData.scorer} rating={goalData.rating} />}
      </Suspense>
    </>
  );
}

export function MatchEngine({ players, onExit }: Props) {
  const joystickRef = useRef({ x: 0, y: 0 });
  const actionRef = useRef({ pass: 0, shoot: 0, through: 0, sprint: 0 });
  const scoreRef = useRef({ home: 0, away: 0 });
  const pausedRef = useRef(false);

  const [score, setScore] = useState({ home: 0, away: 0 });
  const [paused, setPaused] = useState(false);
  const [matchTime, setMatchTime] = useState(0);

  // Joystick state
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [joyActive, setJoyActive] = useState(false);
  const joyCenter = useRef({ x: 0, y: 0 });
  const maxRadius = 50;

  const handleJoyStart = useCallback((clientX: number, clientY: number) => {
    joyCenter.current = { x: clientX, y: clientY };
    setJoyActive(true);
  }, []);

  const handleJoyMove = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - joyCenter.current.x;
    const dy = clientY - joyCenter.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const x = Math.cos(angle) * clamped;
    const y = Math.sin(angle) * clamped;
    setKnobPos({ x, y });
    joystickRef.current.x = x / maxRadius;
    joystickRef.current.y = y / maxRadius;
  }, []);

  const handleJoyEnd = useCallback(() => {
    setKnobPos({ x: 0, y: 0 });
    setJoyActive(false);
    joystickRef.current.x = 0;
    joystickRef.current.y = 0;
  }, []);

  // Match timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (!pausedRef.current) {
        setMatchTime((t) => Math.min(t + 1, 5400));
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Sync score display
  useEffect(() => {
    const interval = setInterval(() => {
      setScore({ ...scoreRef.current });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleGoal = useCallback((scorer: string, rating: number, isTeam: boolean) => {
    // Score already updated in scene
  }, []);

  const formatTime = (seconds: number) => {
    const totalMin = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${String(totalMin).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const doAction = (action: 'pass' | 'shoot' | 'through' | 'sprint') => {
    actionRef.current[action] = 1;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a3a15] flex flex-col select-none">
      {/* ===== SCOREBOARD BAR ===== */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-black/70 backdrop-blur-sm">
        <div className="flex items-center justify-between px-3 py-2">
          {/* Left: back + score */}
          <div className="flex items-center gap-2">
            <button onClick={onExit} className="text-white/80 hover:text-white p-1">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-white font-bold text-sm">
              <span className="text-red-400">EMMA FC</span>
              <span className="text-lg">{score.home}</span>
              <span className="text-white/40 text-xs">|</span>
              <span className="text-lg">{score.away}</span>
              <span className="text-white/70">ARG</span>
            </div>
          </div>

          {/* Center: timer + banner */}
          <div className="flex flex-col items-center">
            <div className="text-red-500 font-black text-sm tabular-nums">
              {formatTime(matchTime)}
              {matchTime > 5400 && <span className="text-red-400 text-xs ml-1">+5</span>}
            </div>
            <div className="text-[7px] text-white/40 font-semibold tracking-wider">FOOTBALL LEAGUE 26</div>
          </div>

          {/* Right: pause */}
          <button
            onClick={() => { setPaused(!paused); pausedRef.current = !paused; }}
            className="text-white/80 hover:text-white p-1"
          >
            {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
        </div>
        {/* Scrolling banner */}
        <div className="overflow-hidden h-3 bg-black/50">
          <div className="whitespace-nowrap text-[8px] text-white/30 font-semibold animate-marquee">
            FOOTBALL LEAGUE 26 &bull; EMMA FC vs ARGENTINA &bull; LIVE FROM LAGOS &bull; FOOTBALL LEAGUE 26 &bull; EMMA FC vs ARGENTINA &bull; LIVE FROM LAGOS &bull;
          </div>
        </div>
      </div>

      {/* ===== 3D CANVAS ===== */}
      <div className="flex-1 relative">
        <Canvas
          shadows
          camera={{ position: [0, 11, -14], fov: 55 }}
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <MatchScene
            players={players}
            joystickRef={joystickRef}
            actionRef={actionRef}
            scoreRef={scoreRef}
            pausedRef={pausedRef}
            onGoal={handleGoal}
          />
        </Canvas>
      </div>

      {/* ===== JOYSTICK (bottom left) ===== */}
      <div
        className="absolute bottom-6 left-6 z-30"
        onTouchStart={(e) => { e.preventDefault(); const t = e.changedTouches[0]; handleJoyStart(t.clientX, t.clientY); }}
        onMouseDown={(e) => handleJoyStart(e.clientX, e.clientY)}
      >
        <div className="relative w-[130px] h-[130px] rounded-full bg-black/40 border-2 border-white/20 touch-none">
          <div className="absolute inset-2 rounded-full border border-white/5" />
          <div
            className="absolute top-1/2 left-1/2 w-[56px] h-[56px] -mt-7 -ml-7 rounded-full bg-white/80 border-2 border-white/50 shadow-lg"
            style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px) scale(${joyActive ? 1.1 : 1})`, transition: joyActive ? 'none' : 'transform 0.15s' }}
          />
        </div>
      </div>
      {/* Joystick global listeners */}
      <div
        className="fixed inset-0 z-20 pointer-events-none"
        onTouchMove={(e) => { if (joyActive) { const t = e.touches[0]; handleJoyMove(t.clientX, t.clientY); } }}
        onTouchEnd={() => joyActive && handleJoyEnd()}
        onMouseMove={(e) => { if (joyActive) handleJoyMove(e.clientX, e.clientY); }}
        onMouseUp={() => joyActive && handleJoyEnd()}
      />

      {/* ===== ACTION BUTTONS (bottom right) ===== */}
      <div className="absolute bottom-6 right-6 z-30 flex flex-col items-center gap-2">
        {/* SHOOT - biggest, top */}
        <button
          onClick={() => doAction('shoot')}
          className="w-[90px] h-[90px] rounded-full bg-black/45 border-4 border-yellow-400/60 text-white font-bold text-xs flex items-center justify-center active:scale-90 hover:bg-black/60 transition shadow-lg"
          style={{ boxShadow: '0 0 12px rgba(250,204,21,0.3)' }}
        >
          SHOOT
        </button>
        {/* THROUGH - middle */}
        <button
          onClick={() => doAction('through')}
          className="w-[78px] h-[78px] rounded-full bg-black/45 border-2 border-white/30 text-white font-bold text-[11px] flex items-center justify-center active:scale-90 hover:bg-black/60 transition"
        >
          THROUGH
        </button>
        {/* PASS + SPRINT - bottom row */}
        <div className="flex gap-2">
          <button
            onClick={() => doAction('pass')}
            className="w-[70px] h-[70px] rounded-full bg-black/45 border-2 border-white/30 text-white font-bold text-[11px] flex items-center justify-center active:scale-90 hover:bg-black/60 transition"
          >
            PASS
          </button>
          <button
            onClick={() => doAction('sprint')}
            className="w-[78px] h-[78px] rounded-full bg-black/45 border-2 border-white/30 text-white font-bold text-[10px] flex flex-col items-center justify-center active:scale-90 hover:bg-black/60 transition leading-tight"
          >
            SPRINT<br /><span className="text-[8px] text-white/50">SKILLS</span>
          </button>
        </div>
      </div>

      {/* Pause overlay */}
      {paused && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-white text-2xl font-black">PAUSED</div>
            <div className="text-white/60 text-sm">{score.home} - {score.away}</div>
            <button
              onClick={() => { setPaused(false); pausedRef.current = false; }}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition"
            >
              RESUME
            </button>
            <button
              onClick={onExit}
              className="px-6 py-2 bg-white/10 text-white/80 rounded-xl font-semibold hover:bg-white/20 transition text-sm"
            >
              QUIT MATCH
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchEngine;
