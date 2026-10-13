import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export type AnimMode = 'idle' | 'running' | 'celebrating';

interface Props {
  position: [number, number, number];
  rating: number;
  jerseyColor: string;
  playerName: string;
  fullName: string;
  isSelected: boolean;
  seed: number;
  animMode: AnimMode;
  runTarget: [number, number, number] | null;
  isScorer: boolean;
  avatarUrl: string;
  ratingColor: string;
  onSelect: () => void;
}

const HAIR_COLORS = ['#1a0e04', '#2d1810', '#3d2818', '#0d0703'];
const MODEL_SCALE = 1.8;

export function Player3DModel({
  position,
  rating,
  jerseyColor,
  playerName,
  isSelected,
  seed,
  animMode,
  runTarget,
  isScorer,
  avatarUrl,
  ratingColor,
  onSelect,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(position[0], position[1], position[2]));
  const basePos = useMemo(() => new THREE.Vector3(position[0], position[1], position[2]), [position]);

  const isElite = rating >= 70;
  const heightScale = isElite ? 1.05 : 1.0;

  const hairColor = useMemo(() => HAIR_COLORS[seed % HAIR_COLORS.length], [seed]);
  const shortsColor = useMemo(() => {
    const c = new THREE.Color(jerseyColor);
    c.multiplyScalar(0.35);
    return '#' + c.getHexString();
  }, [jerseyColor]);

  const jerseyEmissive = useMemo(() => {
    return isElite ? new THREE.Color('#ffd700') : new THREE.Color('#222222');
  }, [isElite]);

  useFrame((state, delta) => {
    if (!groupRef.current || !innerRef.current) return;
    const t = state.clock.elapsedTime;

    if (animMode === 'running' && runTarget) {
      const target = new THREE.Vector3(runTarget[0], position[1], runTarget[2]);
      currentPos.current.lerp(target, 0.025);
      groupRef.current.position.copy(currentPos.current);

      const dx = target.x - currentPos.current.x;
      const dz = target.z - currentPos.current.z;
      if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
        const angle = Math.atan2(dx, dz);
        innerRef.current.rotation.y += (angle - innerRef.current.rotation.y) * 0.1;
      }

      const swing = Math.sin(t * 10) * 0.5;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.7;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.7;
      innerRef.current.position.y = Math.abs(Math.sin(t * 10)) * 0.08;
    } else if (animMode === 'celebrating') {
      const jumpY = Math.abs(Math.sin(t * 5)) * 1.5;
      innerRef.current.position.y = jumpY;

      if (isScorer) {
        innerRef.current.rotation.y += delta * 6;
        if (leftArmRef.current) leftArmRef.current.rotation.z = 1.2;
        if (rightArmRef.current) rightArmRef.current.rotation.z = -1.2;
      } else {
        const wave = Math.sin(t * 6) * 0.3;
        if (leftArmRef.current) leftArmRef.current.rotation.z = wave;
        if (rightArmRef.current) rightArmRef.current.rotation.z = -wave;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    } else {
      currentPos.current.lerp(basePos, 0.05);
      groupRef.current.position.copy(currentPos.current);

      const idle = Math.sin(t * 1.5 + seed * 0.7) * 0.02;
      innerRef.current.position.y = idle;

      if (isSelected) {
        innerRef.current.rotation.y += delta * 0.8;
      } else {
        innerRef.current.rotation.y += (0 - innerRef.current.rotation.y) * 0.05;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0;
        leftArmRef.current.rotation.z = 0.2;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.z = -0.2;
      }
    }
  });

  const skinColor: THREE.ColorRepresentation = '#8D5524';
  const bootColor: THREE.ColorRepresentation = seed % 2 === 0 ? '#1a1a1a' : '#ffffff';

  return (
    <group ref={groupRef} position={position}>
      {/* Shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.8, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      <group ref={innerRef} scale={[MODEL_SCALE * heightScale, MODEL_SCALE * heightScale, MODEL_SCALE * heightScale]}>
        {/* Head */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 1.22, -0.02]} scale={[1, 0.5, 1]} castShadow>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.95} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.15, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>

        {/* Torso (jersey) */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
          <meshStandardMaterial
            color={jerseyColor}
            roughness={0.5}
            emissive={jerseyEmissive}
            emissiveIntensity={isElite ? 0.2 : 0.05}
          />
        </mesh>

        {/* Left arm */}
        <group ref={leftArmRef} position={[-0.42, 0.7, 0]} rotation={[0, 0, 0.2]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
            <meshStandardMaterial color={jerseyColor} roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.5, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.3, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.5} />
          </mesh>
        </group>

        {/* Right arm */}
        <group ref={rightArmRef} position={[0.42, 0.7, 0]} rotation={[0, 0, -0.2]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
            <meshStandardMaterial color={jerseyColor} roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.5, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.3, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.5} />
          </mesh>
        </group>

        {/* Hips */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <capsuleGeometry args={[0.24, 0.12, 4, 8]} />
          <meshStandardMaterial color={shortsColor} roughness={0.6} />
        </mesh>

        {/* Left leg */}
        <group ref={leftLegRef} position={[-0.15, 0, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.13, 0.4, 4, 8]} />
            <meshStandardMaterial color={shortsColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.55, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.35, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.78, 0.05]} castShadow>
            <boxGeometry args={[0.18, 0.1, 0.3]} />
            <meshStandardMaterial color={bootColor} roughness={0.3} />
          </mesh>
        </group>

        {/* Right leg */}
        <group ref={rightLegRef} position={[0.15, 0, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.13, 0.4, 4, 8]} />
            <meshStandardMaterial color={shortsColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.55, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.35, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.78, 0.05]} castShadow>
            <boxGeometry args={[0.18, 0.1, 0.3]} />
            <meshStandardMaterial color={bootColor} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Html floating label - avatar + name + rating */}
      <Html
        position={[0, 3.5, 0]}
        center
        distanceFactor={8}
        zIndexRange={[10, 0]}
        pointerEvents="none"
      >
        <div
          className="flex flex-col items-center gap-0.5 select-none"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full pl-0.5 pr-2 py-0.5 border border-white/20">
            <img
              src={avatarUrl}
              alt={playerName}
              className="w-6 h-6 rounded-full object-cover border border-white/30"
              draggable={false}
            />
            <span className="text-white text-[8px] font-bold leading-none">{playerName}</span>
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-black border border-white/60"
              style={{ background: ratingColor, color: '#0a0e1a' }}
            >
              {rating}
            </div>
          </div>
        </div>
      </Html>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.9, 1.1, 32]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export default Player3DModel;
