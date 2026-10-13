import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  position: [number, number, number];
  rating: number;
  jerseyColor: string;
  playerName: string;
  isSelected: boolean;
  seed: number;
}

const HAIR_COLORS = ['#1a0e04', '#2d1810', '#3d2818', '#0d0703'];

export function Player3DModel({ position, rating, jerseyColor, playerName, isSelected, seed }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const targetY = useRef(0);

  const heightScale = rating >= 70 ? 1.05 : 1.0;
  const isElite = rating >= 70;

  const hairColor = useMemo(() => HAIR_COLORS[seed % HAIR_COLORS.length], [seed]);
  const shortsColor = useMemo(() => {
    const c = new THREE.Color(jerseyColor);
    c.multiplyScalar(0.35);
    return '#' + c.getHexString();
  }, [jerseyColor]);

  const jerseyEmissive = useMemo(() => {
    return isElite ? new THREE.Color('#ffd700') : new THREE.Color('#000000');
  }, [isElite]);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      const idle = Math.sin(_state.clock.elapsedTime * 1.5 + seed * 0.7) * 0.015;
      targetY.current += (idle - targetY.current) * 0.1;
      groupRef.current.position.y = position[1] + targetY.current;

      if (isSelected) {
        groupRef.current.rotation.y += delta * 0.8;
      } else {
        const target = 0;
        groupRef.current.rotation.y += (target - groupRef.current.rotation.y) * 0.05;
      }
    }
  });

  const skinColor: THREE.ColorRepresentation = '#8D5524';
  const bootColor: THREE.ColorRepresentation = seed % 2 === 0 ? '#1a1a1a' : '#ffffff';

  return (
    <group position={position} ref={groupRef}>
      {/* Shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.45, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>

      <group scale={heightScale}>
        {/* Head */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 1.22, -0.02]} scale={[1, 0.5, 1]} castShadow>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.95} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.88, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.12, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>

        {/* Torso (jersey) */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <capsuleGeometry args={[0.25, 0.6, 4, 8]} />
          <meshStandardMaterial
            color={jerseyColor}
            roughness={0.55}
            emissive={jerseyEmissive}
            emissiveIntensity={isElite ? 0.15 : 0}
          />
        </mesh>

        {/* Number on back of jersey */}
        <Text
          position={[0, 0.65, 0.26]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {String(rating)}
        </Text>

        {/* Left arm */}
        <group position={[-0.35, 0.75, 0]} rotation={[0, 0, 0.2]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
            <meshStandardMaterial color={jerseyColor} roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.5, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.3, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.5} />
          </mesh>
        </group>

        {/* Right arm */}
        <group position={[0.35, 0.75, 0]} rotation={[0, 0, -0.2]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
            <meshStandardMaterial color={jerseyColor} roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.5, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.3, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.5} />
          </mesh>
        </group>

        {/* Hips */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <capsuleGeometry args={[0.2, 0.12, 4, 8]} />
          <meshStandardMaterial color={shortsColor} roughness={0.6} />
        </mesh>

        {/* Left leg */}
        <group position={[-0.12, 0.1, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.35, 4, 8]} />
            <meshStandardMaterial color={shortsColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.5, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.3, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.5} />
          </mesh>
          {/* Boot */}
          <mesh position={[0, -0.68, 0.04]} castShadow>
            <boxGeometry args={[0.15, 0.08, 0.25]} />
            <meshStandardMaterial color={bootColor} roughness={0.3} />
          </mesh>
        </group>

        {/* Right leg */}
        <group position={[0.12, 0.1, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.35, 4, 8]} />
            <meshStandardMaterial color={shortsColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.5, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.3, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.5} />
          </mesh>
          {/* Boot */}
          <mesh position={[0, -0.68, 0.04]} castShadow>
            <boxGeometry args={[0.15, 0.08, 0.25]} />
            <meshStandardMaterial color={bootColor} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Floating name tag */}
      <Billboard position={[0, 1.55, 0]}>
        <Text
          fontSize={0.28}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {playerName}
        </Text>
      </Billboard>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.5, 0.65, 32]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export default Player3DModel;
