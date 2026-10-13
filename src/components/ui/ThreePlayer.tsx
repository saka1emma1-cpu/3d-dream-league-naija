import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  jerseyColor: string;
  number: number;
}

export function ThreePlayer({ jerseyColor, number }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
    }
  });

  const skinColor: THREE.ColorRepresentation = '#8D5524';
  const hairColor: THREE.ColorRepresentation = '#1a0e04';
  const shortsColor: THREE.ColorRepresentation = '#1a1a2e';
  const bootColor: THREE.ColorRepresentation = '#1a1a1a';

  return (
    <group ref={groupRef} position={[0, -0.8, 0]}>
      {/* Head */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial color={skinColor} roughness={0.5} />
      </mesh>

      {/* Hair (low-cut) */}
      <mesh position={[0, 2.02, -0.02]} castShadow>
        <sphereGeometry args={[0.36, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.14, 0.16, 0.2, 12]} />
        <meshStandardMaterial color={skinColor} roughness={0.5} />
      </mesh>

      {/* Torso (jersey) */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.5, 8, 16]} />
        <meshStandardMaterial color={jerseyColor} roughness={0.55} />
      </mesh>

      {/* Number on jersey */}
      <Text
        position={[0, 1.05, 0.33]}
        fontSize={0.22}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {String(number)}
      </Text>

      {/* Hips/shorts */}
      <mesh position={[0, 0.58, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.2, 8, 16]} />
        <meshStandardMaterial color={shortsColor} roughness={0.6} />
      </mesh>

      {/* Left arm */}
      <group position={[-0.42, 1.25, 0]} rotation={[0, 0, 0.15]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.3, 6, 12]} />
          <meshStandardMaterial color={jerseyColor} roughness={0.55} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.55, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.25, 6, 12]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>
      </group>

      {/* Right arm */}
      <group position={[0.42, 1.25, 0]} rotation={[0, 0, -0.15]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.3, 6, 12]} />
          <meshStandardMaterial color={jerseyColor} roughness={0.55} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.55, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.25, 6, 12]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>
      </group>

      {/* Left leg */}
      <group position={[-0.16, 0.38, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <capsuleGeometry args={[0.13, 0.3, 6, 12]} />
          <meshStandardMaterial color={shortsColor} roughness={0.6} />
        </mesh>
        {/* Shin */}
        <mesh position={[0, -0.6, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.3, 6, 12]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.85, 0.06]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.35]} />
          <meshStandardMaterial color={bootColor} roughness={0.3} metalness={0.1} />
        </mesh>
      </group>

      {/* Right leg */}
      <group position={[0.16, 0.38, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <capsuleGeometry args={[0.13, 0.3, 6, 12]} />
          <meshStandardMaterial color={shortsColor} roughness={0.6} />
        </mesh>
        {/* Shin */}
        <mesh position={[0, -0.6, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.3, 6, 12]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.85, 0.06]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.35]} />
          <meshStandardMaterial color={bootColor} roughness={0.3} metalness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

export default ThreePlayer;
