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

const SKIN_TONES = ['#8D5524', '#A86E3C', '#C68642', '#7B4A23', '#6e3b1f'];
const SCALE = 1.3;

export function Player3DModel({
  position, rating, jerseyColor, shortsColor, socksColor, playerName,
  isSelected, seed, animMode, runTarget, isScorer, avatarUrl, ratingColor,
  faceImageUrl, jerseyNumber, showLabel = true, onSelect,
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

  const skinTone = useMemo(() => SKIN_TONES[seed % SKIN_TONES.length], [seed]);
  const bootColor = useMemo(() => (seed % 3 === 0? '#0a0a0a' : seed % 3 === 1? '#ffffff' : '#ff4500'), [seed]);

  // REAL FACE TEXTURE - NOT HTML BILLBOARD
  const faceTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const url = faceImageUrl || avatarUrl;
    if (!url) return null;
    const tex = loader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [faceImageUrl, avatarUrl]);

  useFrame((state, delta) => {
    if (!groupRef.current ||!innerRef.current) return;
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
      innerRef.current.position.y = Math.abs(Math.sin(t * 10)) * 0.06;
    } else if (animMode === 'celebrating') {
      const jumpY = Math.abs(Math.sin(t * 5)) * 1.2;
      innerRef.current.position.y = jumpY;
      if (isScorer) innerRef.current.rotation.y += delta * 6;
    } else {
      currentPos.current.lerp(basePos, 0.05);
      groupRef.current.position.copy(currentPos.current);
      const breathe = Math.sin(t * 1.5 + seed * 0.5) * 0.015;
      innerRef.current.position.y = breathe;
      if (isSelected) innerRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.7, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>

      <group ref={innerRef} scale={[SCALE, SCALE, SCALE]} position={[0, 0.15, 0]}>
        {/* ===== REAL HUMAN HEAD - NO MORE DOLL EYES ===== */}
        <mesh position={[0, 1.35, 0]} castShadow>
          <sphereGeometry args={[0.24, 24, 24]} />
          <meshStandardMaterial color={skinTone} roughness={0.55} metalness={0} />
        </mesh>

        {/* REAL FACE - BIG CIRCLE TEXTURE ON FRONT */}
        {faceTexture && (
          <mesh position={[0, 1.35, 0.21]}>
            <circleGeometry args={[0.205, 32]} />
            <meshStandardMaterial map={faceTexture} roughness={0.4} metalness={0} transparent />
          </mesh>
        )}

        {/* SHORT NAIJA HAIR - NOT BIG AFRO BALL */}
        <mesh position={[0, 1.50, 0]} castShadow>
          <sphereGeometry args={[0.25, 16, 16, 0, Math.PI*2, 0, Math.PI*0.6]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
        </mesh>

        <mesh position={[0, 1.15, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.1, 0.14, 12]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>

        <group ref={torsoRef} position={[0, 0.75, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.52, 0.68, 0.28]} />
            <meshStandardMaterial color={jerseyColor} roughness={0.5} metalness={0.05} />
          </mesh>
                    {/* OVR on chest */}
          <Html position={[0, 0.05, 0.16]} center distanceFactor={4} zIndexRange={[6,0]} pointerEvents="none" transform>
            <div className="flex items-center gap-0.5 select-none" style={{ pointerEvents:'none' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black border border-white/80" style={{ background: ratingColor, color:'#0a0e1a' }}>{rating}</div>
              {jerseyNumber!== undefined && <div className="text-white text-[8px] font-black" style={{ textShadow:'1px 1px 0 #000' }}>#{jerseyNumber}</div>}
            </div>
          </Html>
        </group>

        {/* ===== ARMS - SLIMMER ===== */}
        <group ref={leftArmRef} position={[-0.32, 1.02, 0]}>
          <mesh position={[0, -0.05, 0]} castShadow><cylinderGeometry args={[0.09, 0.08, 0.16, 12]} /><meshStandardMaterial color={jerseyColor} roughness={0.55} /></mesh>
          <mesh position={[0, -0.22, 0]} castShadow><cylinderGeometry args={[0.065, 0.06, 0.22, 12]} /><meshStandardMaterial color={skinTone} roughness={0.6} /></mesh>
          <mesh position={[0, -0.45, 0]} castShadow><cylinderGeometry args={[0.055, 0.05, 0.22, 12]} /><meshStandardMaterial color={skinTone} roughness={0.6} /></mesh>
          <mesh position={[0, -0.6, 0]} castShadow><sphereGeometry args={[0.065, 12, 12]} /><meshStandardMaterial color={skinTone} roughness={0.6} /></mesh>
        </group>

        <group ref={rightArmRef} position={[0.32, 1.02, 0]}>
          <mesh position={[0, -0.05, 0]} castShadow><cylinderGeometry args={[0.09, 0.08, 0.16, 12]} /><meshStandardMaterial color={jerseyColor} roughness={0.55} /></mesh>
          <mesh position={[0, -0.22, 0]} castShadow><cylinderGeometry args={[0.065, 0.06, 0.22, 12]} /><meshStandardMaterial color={skinTone} roughness={0.6} /></mesh>
          <mesh position={[0, -0.45, 0]} castShadow><cylinderGeometry args={[0.055, 0.05, 0.22, 12]} /><meshStandardMaterial color={skinTone} roughness={0.6} /></mesh>
          <mesh position={[0, -0.6, 0]} castShadow><sphereGeometry args={[0.065, 12, 12]} /><meshStandardMaterial color={skinTone} roughness={0.6} /></mesh>
        </group>

        {/* SHORTS - REAL */}
        <mesh position={[0, 0.28, 0]} castShadow><boxGeometry args={[0.5, 0.28, 0.28]} /><meshStandardMaterial color={shortsColor} roughness={0.6} /></mesh>

        {/* LEFT LEG */}
        <group ref={leftLegRef} position={[-0.13, 0.14, 0]}>
          <mesh position={[0, -0.15, 0]} castShadow><cylinderGeometry args={[0.095, 0.085, 0.3, 12]} /><meshStandardMaterial color={skinTone} roughness={0.7} /></mesh>
          <mesh position={[0, -0.45, 0]} castShadow><cylinderGeometry args={[0.08, 0.075, 0.36, 12]} /><meshStandardMaterial color={socksColor} roughness={0.5} /></mesh>
          <mesh position={[0, -0.66, 0.04]} castShadow><boxGeometry args={[0.14, 0.1, 0.26]} /><meshStandardMaterial color={bootColor} roughness={0.25} metalness={0.2} /></mesh>
        </group>

        {/* RIGHT LEG */}
        <group ref={rightLegRef} position={[0.13, 0.14, 0]}>
          <mesh position={[0, -0.15, 0]} castShadow><cylinderGeometry args={[0.095, 0.085, 0.3, 12]} /><meshStandardMaterial color={skinTone} roughness={0.7} /></mesh>
          <mesh position={[0, -0.45, 0]} castShadow><cylinderGeometry args={[0.08, 0.075, 0.36, 12]} /><meshStandardMaterial color={socksColor} roughness={0.5} /></mesh>
          <mesh position={[0, -0.66, 0.04]} castShadow><boxGeometry args={[0.14, 0.1, 0.26]} /><meshStandardMaterial color={bootColor} roughness={0.25} metalness={0.2} /></mesh>
        </group>
      </group>

      {showLabel && (
        <Html position={[0, 3.2, 0]} center distanceFactor={8} zIndexRange={[10,0]} pointerEvents="none">
          <div className="flex flex-col items-center gap-0.5 select-none" onClick={(e) => { e.stopPropagation(); onSelect(); }} style={{ pointerEvents:'auto', cursor:'pointer' }}>
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full pl-0.5 pr-2 py-0.5 border border-white/20">
              <img src={avatarUrl} alt={playerName} className="w-6 h-6 rounded-full object-cover border border-white/30" draggable={false} />
              <span className="text-white text-[8px] font-bold leading-none">{playerName}</span>
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-black border border-white/60" style={{ background: ratingColor, color:'#0a0e1a' }}>{rating}</div>
            </div>
          </div>
        </Html>
      )}

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
