import { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Pitch3D } from './Pitch3D';
import { Player3DModel, type AnimMode } from './Player3DModel';
import type { Player } from '@/types/game';
import { getOverall, getRatingColor, getAvatarUrl } from '@/components/ui/playerUtils';

interface Props {
  players: Player[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPlayMatch?: () => void;
}

export type GamePhase = 'idle' | 'playing' | 'goal';

const FORMATION_433_3D: Record<number, [number, number, number]> = {
  0: [0, 0, -11],
  1: [-5.5, 0, -7],
  2: [-2, 0, -7],
  3: [2, 0, -7],
  4: [5.5, 0, -7],
  5: [-3.5, 0, -1],
  6: [0, 0, -0.5],
  7: [3.5, 0, -1],
  8: [-3, 0, 4.5],
  9: [0, 0, 5],
  10: [3, 0, 4.5],
};

const GOAL_Z = 11;
const BALL_START: [number, number, number] = [0, 0.15, 0];

// Emma FC team colors (red kit)
const TEAM_JERSEY = '#D00000';
const TEAM_SHORTS = '#D00000';
const TEAM_SOCKS = '#D00000';

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function CameraRig({ phase }: { phase: GamePhase }) {
  const targetPos = useMemo(() => {
    if (phase === 'playing' || phase === 'goal') return new THREE.Vector3(0, 10, -13);
    return new THREE.Vector3(0, 11, -14);
  }, [phase]);
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 3), []);
  const lookAtVec = useRef(new THREE.Vector3(0, 0, 3));

  useFrame((state) => {
    state.camera.position.lerp(targetPos, 0.04);
    lookAtVec.current.lerp(targetLook, 0.04);
    state.camera.lookAt(lookAtVec.current);
  });

  return null;
}

function Ball({ phase, onGoal, ballPosRef }: { phase: GamePhase; onGoal: () => void; ballPosRef: React.MutableRefObject<THREE.Vector3> }) {
  const ballRef = useRef<THREE.Mesh>(null);
  const goalTriggered = useRef(false);

  useEffect(() => {
    ballPosRef.current.set(BALL_START[0], BALL_START[1], BALL_START[2]);
    goalTriggered.current = false;
  }, [phase]);

  useFrame((state) => {
    if (!ballRef.current) return;
    const t = state.clock.elapsedTime;

    if (phase === 'playing') {
      ballPosRef.current.z += 0.08;
      ballPosRef.current.x = Math.sin(t * 1.5) * 1.5;
      ballPosRef.current.y = 0.15 + Math.abs(Math.sin(t * 6)) * 0.12;

      if (ballPosRef.current.z >= GOAL_Z && !goalTriggered.current) {
        goalTriggered.current = true;
        onGoal();
      }
    } else if (phase === 'goal') {
      ballPosRef.current.y = 0.15 + Math.abs(Math.sin(t * 8)) * 0.4;
      ballPosRef.current.x *= 0.95;
    } else {
      ballPosRef.current.lerp(new THREE.Vector3(BALL_START[0], BALL_START[1], BALL_START[2]), 0.05);
    }

    ballRef.current.position.copy(ballPosRef.current);
    ballRef.current.rotation.x += 0.1;
    ballRef.current.rotation.y += 0.05;
  });

  return (
    <mesh ref={ballRef} position={BALL_START} castShadow>
      <sphereGeometry args={[0.18, 16, 16]} />
      <meshStandardMaterial color="#ffffff" roughness={0.4} />
    </mesh>
  );
}

function GoalText({ scorerName, rating }: { scorerName: string; rating: number }) {
  const [scale, setScale] = useState(0.5);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    setScale(1 + Math.sin(t * 4) * 0.15);
  });

  return (
    <Html position={[0, 4, 0]} center distanceFactor={6} zIndexRange={[20, 0]} pointerEvents="none">
      <div
        className="flex flex-col items-center select-none"
        style={{ transform: `scale(${scale})`, transition: 'transform 0.1s' }}
      >
        <div className="text-4xl font-black text-yellow-400 tracking-wider" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000' }}>
          GOOOAL!
        </div>
        <div className="text-lg font-bold text-white mt-1" style={{ textShadow: '1px 1px 0 #000' }}>
          {scorerName} {rating}
        </div>
      </div>
    </Html>
  );
}

function ClickablePlayer({
  player,
  selectedId,
  onSelect,
  phase,
  ballPosRef,
  scorerId,
}: {
  player: Player;
  selectedId: string | null;
  onSelect: (id: string) => void;
  phase: GamePhase;
  ballPosRef: React.MutableRefObject<THREE.Vector3>;
  scorerId: string | null;
}) {
  const pos = FORMATION_433_3D[player.slot];
  const ovr = getOverall(player);
  const isSelected = selectedId === player.id;
  const seed = hashId(player.id);
  const lastName = player.name.split(' ').pop() || player.name;
  const isScorer = scorerId === player.id;

  // GK gets a different jersey color (yellow/green)
  const jerseyColor = player.position === 'GK' ? '#22c55e' : TEAM_JERSEY;
  const shortsColor = player.position === 'GK' ? '#1a1a1a' : TEAM_SHORTS;
  const socksColor = player.position === 'GK' ? '#1a1a1a' : TEAM_SOCKS;

  let animMode: AnimMode = 'idle';
  let runTarget: [number, number, number] | null = null;

  if (phase === 'playing') {
    if (player.position === 'FWD') {
      animMode = 'running';
      runTarget = [ballPosRef.current.x, 0, Math.min(ballPosRef.current.z + 1, GOAL_Z - 0.5)];
    } else if (player.position === 'MID') {
      animMode = 'running';
      runTarget = [ballPosRef.current.x * 0.5, 0, Math.min(ballPosRef.current.z - 2, GOAL_Z - 5)];
    } else {
      animMode = 'idle';
    }
  } else if (phase === 'goal') {
    animMode = 'celebrating';
    if (!isScorer) {
      runTarget = [0, 0, 0];
    }
  }

  return (
    <group
      position={pos}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(player.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <Player3DModel
        position={[0, 0, 0]}
        rating={ovr}
        jerseyColor={jerseyColor}
        shortsColor={shortsColor}
        socksColor={socksColor}
        playerName={lastName}
        isSelected={isSelected}
        seed={seed}
        animMode={animMode}
        runTarget={runTarget}
        isScorer={isScorer}
        avatarUrl={getAvatarUrl(player.name)}
        ratingColor={getRatingColor(ovr)}
        faceImageUrl={`https://i.pravatar.cc/100?u=${encodeURIComponent(lastName)}`}
        onSelect={() => onSelect(player.id)}
      />
    </group>
  );
}

function PitchSceneInner({ players, selectedId, onSelect, onPlayMatch }: Props) {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [scorerId, setScorerId] = useState<string | null>(null);
  const ballPosRef = useRef(new THREE.Vector3(BALL_START[0], BALL_START[1], BALL_START[2]));
  const goalTimer = useRef<number | null>(null);
  const phaseRef = useRef<GamePhase>('idle');

  const startingXI = players.filter((p) => p.slot >= 0).sort((a, b) => a.slot - b.slot);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    return () => {
      if (goalTimer.current) window.clearTimeout(goalTimer.current);
    };
  }, []);

  const handleGoal = () => {
    if (phaseRef.current === 'goal') return;
    const scorers = startingXI.filter((p) => p.position === 'FWD');
    const scorer = scorers[Math.floor(Math.random() * scorers.length)] ?? startingXI[0];
    setScorerId(scorer.id);
    setPhase('goal');
    if (goalTimer.current) window.clearTimeout(goalTimer.current);
    goalTimer.current = window.setTimeout(() => {
      setPhase('idle');
      setScorerId(null);
    }, 4000);
  };

  const startMatch = () => {
    if (phase === 'idle') {
      if (onPlayMatch) { onPlayMatch(); return; }
      setPhase('playing');
    } else if (phase === 'playing') {
      setPhase('idle');
    } else if (phase === 'goal') {
      setPhase('idle');
      setScorerId(null);
    }
  };

  const scorerPlayer = scorerId ? startingXI.find((p) => p.id === scorerId) : null;

  return (
    <>
      <color attach="background" args={['#0a3a15']} />
      <fog attach="fog" args={['#0a3a15', 30, 60]} />

      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 20, -5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-8, 10, 5]} intensity={0.3} color="#88aaff" />

      {/* Dark crowd background */}
      <mesh position={[0, 2.5, -16]}>
        <boxGeometry args={[30, 5, 0.5]} />
        <meshStandardMaterial color="#0a0e1a" />
      </mesh>
      <mesh position={[0, 2.5, 16]}>
        <boxGeometry args={[30, 5, 0.5]} />
        <meshStandardMaterial color="#0a0e1a" />
      </mesh>
      <mesh position={[-16, 2.5, 0]}>
        <boxGeometry args={[0.5, 5, 32]} />
        <meshStandardMaterial color="#0a0e1a" />
      </mesh>
      <mesh position={[16, 2.5, 0]}>
        <boxGeometry args={[0.5, 5, 32]} />
        <meshStandardMaterial color="#0a0e1a" />
      </mesh>

      <Suspense fallback={null}>
        <Pitch3D />
        <Ball phase={phase} onGoal={handleGoal} ballPosRef={ballPosRef} />
        {startingXI.map((p) => (
          <ClickablePlayer
            key={p.id}
            player={p}
            selectedId={selectedId}
            onSelect={onSelect}
            phase={phase}
            ballPosRef={ballPosRef}
            scorerId={scorerId}
          />
        ))}
        {phase === 'goal' && scorerPlayer && (
          <GoalText
            scorerName={scorerPlayer.name.split(' ').pop() || scorerPlayer.name}
            rating={getOverall(scorerPlayer)}
          />
        )}
      </Suspense>

      <CameraRig phase={phase} />

      {/* Play Match button overlay inside canvas */}
      <Html position={[0, 0, -5]} center distanceFactor={12} zIndexRange={[15, 0]} pointerEvents="none">
        <div style={{ pointerEvents: 'auto' }} className="select-none">
          <button
            onClick={startMatch}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition active:scale-95 ${
              phase === 'playing'
                ? 'bg-red-600 border-red-400 text-white hover:bg-red-500'
                : phase === 'goal'
                ? 'bg-amber-600 border-amber-400 text-white hover:bg-amber-500'
                : 'bg-emerald-600 border-emerald-400 text-white hover:bg-emerald-500 animate-pulse'
            }`
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
          >
            {phase === 'playing' ? 'STOP MATCH' : phase === 'goal' ? 'RESET' : 'PLAY MATCH'}
          </button>
        </div>
      </Html>
    </>
  );
}

export function PitchScene(props: Props) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 11, -14], fov: 55 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <PitchSceneInner {...props} />
    </Canvas>
  );
}

export default PitchScene;
