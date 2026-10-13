import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Pitch3D } from './Pitch3D';
import { Player3DModel } from './Player3DModel';
import type { Player } from '@/types/game';
import { getOverall, getJerseyColor } from '@/components/ui/playerUtils';

interface Props {
  players: Player[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const FORMATION_433_3D: Record<number, [number, number, number]> = {
  0: [0, 0, -12],
  1: [-5, 0, -8],
  2: [-1.5, 0, -8],
  3: [1.5, 0, -8],
  4: [5, 0, -8],
  5: [-3, 0, -2],
  6: [0, 0, -1],
  7: [3, 0, -2],
  8: [-4.5, 0, 5],
  9: [0, 0, 7],
  10: [4.5, 0, 5],
};

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function CameraRig() {
  const targetPos = useMemo(() => new THREE.Vector3(0, 14, 14), []);
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const lookAtVec = useRef(new THREE.Vector3(0, 14, 14));

  useFrame((state) => {
    state.camera.position.lerp(targetPos, 0.1);
    lookAtVec.current.lerp(targetLook, 0.1);
    state.camera.lookAt(lookAtVec.current);
  });

  return null;
}

function ClickablePlayer({ player, selectedId, onSelect }: {
  player: Player;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const pos = FORMATION_433_3D[player.slot];
  if (!pos) return null;

  const ovr = getOverall(player);
  const jerseyColor = getJerseyColor(player.position);
  const isSelected = selectedId === player.id;
  const seed = hashId(player.id);
  const lastName = player.name.split(' ').pop() || player.name;

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
        playerName={lastName}
        isSelected={isSelected}
        seed={seed}
      />
    </group>
  );
}

export function PitchScene({ players, selectedId, onSelect }: Props) {
  const startingXI = players.filter((p) => p.slot >= 0).sort((a, b) => a.slot - b.slot);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 14, 14], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0d5c1f']} />
      <fog attach="fog" args={['#0d5c1f', 30, 55]} />

      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-8, 10, -5]} intensity={0.3} color="#88aaff" />

      <Suspense fallback={null}>
        <Pitch3D />
        {startingXI.map((p) => (
          <ClickablePlayer
            key={p.id}
            player={p}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </Suspense>

      <CameraRig />
    </Canvas>
  );
}

export default PitchScene;
