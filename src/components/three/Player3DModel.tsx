import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export type AnimMode = 'idle' | 'running' | 'celebrating';

interface Props {
  position: [number, number, number];
  rating: number;
  jerseyColor: string;
  shortsColor: string;
  socksColor: string;
  playerName: string;
  isSelected: boolean;
  seed: number;
  animMode: AnimMode;
  runTarget: [number, number, number] | null;
  isScorer: boolean;
  avatarUrl: string;
  ratingColor: string;
  faceImageUrl?: string;
  jerseyNumber?: number;
  showLabel?: boolean;
  onSelect: () => void;
}

const HAIR_COLORS = ['#1a1a1a', '#2d1810', '#4a2c0a', '#0d0703'];
const SKIN_TONES = ['#8D5524', '#A86E3C', '#C68642', '#7B4A23'];
const SCALE = 1.3;

export function Player3DModel({
  position,
  rating,
  jerseyColor,
  shortsColor,
  socksColor,
  playerName,
  isSelected,
  seed,
  animMode,
  runTarget,
  isScorer,
  avatarUrl,
  ratingColor,
  faceImageUrl,
  jerseyNumber,
  showLabel = true,
  onSelect,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(position[0], position[1], position[2]));
  const basePos = useMemo(() => new THREE.Vector3(position[0], position[1], position[2]), [position]);

  const isElite = rating >= 70;
  const hairColor = useMemo(() => HAIR_COLORS[seed % HAIR_COLORS.length], [seed]);
  const skinTone = useMemo(() => SKIN_TONES[seed % SKIN_TONES.length], [seed]);
  const bootColor = useMemo(() => (seed % 3 === 0 ? '#1a1a1a' : seed % 3 === 1 ? '#ffffff' : '#ff6600'), [seed]);

  const jerseyEmissive = useMemo(() => {
    return isElite ? new THREE.Color('#ffd700') : new THREE.Color('#000000');
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

      const swing = Math.sin(t * 10) * 0.6;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.7;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.7;
      if (torsoRef.current) torsoRef.current.rotation.x = 0.15;
      innerRef.current.position.y = Math.abs(Math.sin(t * 10)) * 0.06;
    } else if (animMode === 'celebrating') {
      const jumpY = Math.abs(Math.sin(t * 5)) * 1.2;
      innerRef.current.position.y = jumpY;

      if (isScorer) {
        innerRef.current.rotation.y += delta * 6;
        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = 1.4;
          leftArmRef.current.rotation.x = -0.3;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = -1.4;
          rightArmRef.current.rotation.x = -0.3;
        }
      } else {
        const wave = Math.sin(t * 6) * 0.4;
        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = 0.5 + wave;
          leftArmRef.current.rotation.x = -0.2;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = -0.5 - wave;
          rightArmRef.current.rotation.x = -0.2;
        }
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (torsoRef.current) torsoRef.current.rotation.x = 0;
    } else {
      currentPos.current.lerp(basePos, 0.05);
      groupRef.current.position.copy(currentPos.current);

      const sway = Math.sin(t * 0.8 + seed * 0.7) * 0.02;
      const breathe = Math.sin(t * 1.5 + seed * 0.5) * 0.01;
      innerRef.current.position.y = breathe;

      if (isSelected) {
        innerRef.current.rotation.y += delta * 0.8;
      } else {
        innerRef.current.rotation.y += (0 - innerRef.current.rotation.y) * 0.05;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0;
        leftArmRef.current.rotation.z = 0.15;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.z = -0.15;
      }
      if (torsoRef.current) torsoRef.current.rotation.x = sway * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.7, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>

      <group ref={innerRef} scale={[SCALE, SCALE, SCALE]} position={[0, 0.15, 0]}>
        {/* ===== HEAD ===== */}
        <mesh position={[0, 1.35, 0]} castShadow>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} metalness={0.05} />
        </mesh>

        {/* Eyes - whites */}
        <mesh position={[-0.08, 1.37, 0.18]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0.08, 1.37, 0.18]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Pupils */}
        <mesh position={[-0.08, 1.37, 0.21]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
        </mesh>
        <mesh position={[0.08, 1.37, 0.21]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, 1.33, 0.21]}>
          <boxGeometry args={[0.04, 0.08, 0.04]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>

        {/* Hair - flat top / afro */}
        <mesh position={[0, 1.46, -0.01]} scale={[1, 0.65, 1]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.95} />
        </mesh>

        {/* Face image billboard on front of head - larger, always faces camera */}
        {faceImageUrl && (
          <Html
            position={[0, 1.36, 0.22]}
            center
            distanceFactor={2.5}
            zIndexRange={[8, 0]}
            pointerEvents="none"
            transform
            occlude
          >
            <div
              className="rounded-full overflow-hidden border-2 border-white/70"
              style={{ width: '56px', height: '56px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
            >
              <img
                src={faceImageUrl}
                alt={playerName}
                className="w-full h-full object-cover"
                draggable={false}
                onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
              />
            </div>
          </Html>
        )}

        {/* Neck */}
        <mesh position={[0, 1.15, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 0.12, 12]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>

        {/* ===== TORSO ===== */}
        <group ref={torsoRef} position={[0, 0.75, 0]}>
          {/* Jersey / chest - box with slight taper */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.6, 0.75, 0.32]} />
            <meshStandardMaterial
              color={jerseyColor}
              roughness={0.55}
              metalness={0.05}
              emissive={jerseyEmissive}
              emissiveIntensity={isElite ? 0.15 : 0}
            />
          </mesh>

          {/* Collar */}
          <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.12, 0.025, 8, 20]} />
            <meshStandardMaterial color={jerseyColor} roughness={0.5} />
          </mesh>

          {/* Jersey number on back */}
          <mesh position={[0, 0.05, -0.17]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.2, 0.25]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>

          {/* OVR badge on chest front */}
          <Html
            position={[0, 0.05, 0.18]}
            center
            distanceFactor={4}
            zIndexRange={[6, 0]}
            pointerEvents="none"
            transform
            occlude
          >
            <div className="flex items-center gap-0.5 select-none" style={{ pointerEvents: 'none' }}>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black border border-white/80"
                style={{ background: ratingColor, color: '#0a0e1a' }}
              >
                {rating}
              </div>
              {jerseyNumber !== undefined && (
                <div className="text-white text-[8px] font-black leading-none" style={{ textShadow: '1px 1px 0 #000' }}>
                  #{jerseyNumber}
                </div>
              )}
            </div>
          </Html>
        </group>

        {/* ===== LEFT ARM ===== */}
        <group ref={leftArmRef} position={[-0.36, 1.05, 0]}>
          {/* Sleeve */}
          <mesh position={[0, -0.05, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.09, 0.18, 12]} />
            <meshStandardMaterial color={jerseyColor} roughness={0.55} />
          </mesh>
          {/* Upper arm - skin */}
          <mesh position={[0, -0.22, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.065, 0.22, 12]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
          {/* Forearm - skin */}
          <mesh position={[0, -0.45, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.055, 0.22, 12]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.6, 0]} castShadow>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
        </group>

        {/* ===== RIGHT ARM ===== */}
        <group ref={rightArmRef} position={[0.36, 1.05, 0]}>
          <mesh position={[0, -0.05, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.09, 0.18, 12]} />
            <meshStandardMaterial color={jerseyColor} roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.22, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.065, 0.22, 12]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.45, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.055, 0.22, 12]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.6, 0]} castShadow>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
        </group>

        {/* ===== SHORTS ===== */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.56, 0.32, 0.3]} />
          <meshStandardMaterial color={shortsColor} roughness={0.6} />
        </mesh>

        {/* ===== LEFT LEG ===== */}
        <group ref={leftLegRef} position={[-0.14, 0.14, 0]}>
          {/* Thigh */}
          <mesh position={[0, -0.15, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.09, 0.32, 12]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
          {/* Sock */}
          <mesh position={[0, -0.45, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.08, 0.38, 12]} />
            <meshStandardMaterial color={socksColor} roughness={0.5} />
          </mesh>
          {/* Sock stripe */}
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.088, 0.088, 0.06, 12]} />
            <meshStandardMaterial color={jerseyColor} roughness={0.5} />
          </mesh>
          {/* Boot */}
          <mesh position={[0, -0.66, 0.04]} castShadow>
            <boxGeometry args={[0.14, 0.1, 0.28]} />
            <meshStandardMaterial color={bootColor} roughness={0.3} metalness={0.1} />
          </mesh>
          {/* Studs */}
          <mesh position={[-0.04, -0.72, 0.1]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#888" metalness={0.5} />
          </mesh>
          <mesh position={[0.04, -0.72, 0.1]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#888" metalness={0.5} />
          </mesh>
          <mesh position={[-0.04, -0.72, -0.05]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#888" metalness={0.5} />
          </mesh>
          <mesh position={[0.04, -0.72, -0.05]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#888" metalness={0.5} />
          </mesh>
        </group>

        {/* ===== RIGHT LEG ===== */}
        <group ref={rightLegRef} position={[0.14, 0.14, 0]}>
          <mesh position={[0, -0.15, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.09, 0.32, 12]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.45, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.08, 0.38, 12]} />
            <meshStandardMaterial color={socksColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.088, 0.088, 0.06, 12]} />
            <meshStandardMaterial color={jerseyColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.66, 0.04]} castShadow>
            <boxGeometry args={[0.14, 0.1, 0.28]} />
            <meshStandardMaterial color={bootColor} roughness={0.3} metalness={0.1} />
          </mesh>
          <mesh position={[-0.04, -0.72, 0.1]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#888" metalness={0.5} />
          </mesh>
          <mesh position={[0.04, -0.72, 0.1]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#888" metalness={0.5} />
          </mesh>
          <mesh position={[-0.04, -0.72, -0.05]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#888" metalness={0.5} />
          </mesh>
          <mesh position={[0.04, -0.72, -0.05]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#888" metalness={0.5} />
          </mesh>
        </group>
      </group>

      {/* Html floating label */}
      {showLabel && (
      <Html
        position={[0, 3.2, 0]}
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
      )}

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.8, 1.0, 32]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export default Player3DModel;
