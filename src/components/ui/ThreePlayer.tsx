import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Player } from '@/types/game';
import { getFaceUrl, getJerseyColor, getJerseyNumber } from '@/components/ui/playerUtils';

type Props = {
  player: Player;
  position: [number, number, number];
  isSelected?: boolean;
  isBallHolder?: boolean;
};

export default function ThreePlayer({ player, position, isSelected, isBallHolder }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const faceUrl = useMemo(() => getFaceUrl(player.name), [player.name]);

  // Load face texture with CORS fix
  const faceTexture = useTexture(faceUrl) as THREE.Texture;

  useMemo(() => {
    if (faceTexture) {
      faceTexture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [faceTexture]);

  const jerseyColor = getJerseyColor(player.position);
  const jerseyNum = getJerseyNumber(player.slot?? 0);

  // Real skin tones - Naija
  const skinColor = useMemo(() => new THREE.Color('#8d5524'), []);

  useFrame((state) => {
    if (groupRef.current && isBallHolder) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Selection Ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.4, 0.55, 32]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.35, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.25} />
      </mesh>

      {/* LEFT LEG */}
      <mesh position={[-0.12, 0.25, 0]}>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        <meshStandardMaterial color={player.position === 'GK'? '#fbbf24' : '#1e293b'} />
      </mesh>
      {/* RIGHT LEG */}
      <mesh position={[0.12, 0.25, 0]}>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        <meshStandardMaterial color={player.position === 'GK'? '#fbbf24' : '#1e293b'} />
      </mesh>

      {/* BOOTS */}
      <mesh position={[-0.12, 0.05, 0.05]}>
        <boxGeometry args={[0.12, 0.08, 0.22]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.12, 0.05, 0.05]}>
        <boxGeometry args={[0.12, 0.08, 0.22]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* BODY / JERSEY - Real human shape */}
      <mesh position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.22, 0.35, 4, 12]} />
        <meshStandardMaterial color={jerseyColor} roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Jersey Number Back */}
      <Text
        position={[0, 0.78, -0.23]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.22}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
      >
        {jerseyNum.toString()}
      </Text>

      {/* Arms */}
      <mesh position={[-0.28, 0.7, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.06, 0.35, 4, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[0.28, 0.7, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.06, 0.35, 4, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* NECK */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.12, 12]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* HEAD - REAL HUMAN FACE */}
      <group position={[0, 1.28, 0]}>
        {/* Head base */}
        <mesh>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
        {/* Face Texture Plane - Front of head */}
        <mesh position={[0, 0, 0.17]} rotation={[0, 0, 0]}>
          <circleGeometry args={[0.16, 32]} />
          <meshStandardMaterial
            map={faceTexture}
            transparent
            roughness={0.8}
          />
        </mesh>
        {/* Hair */}
        <mesh position={[0, 0.12, 0]} rotation={[0, 0, 0]}>
          <sphereGeometry args={[0.21, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      </group>

      {/* Name Tag */}
      {isSelected && (
        <Text
          position={[0, 1.8, 0]}
          fontSize={0.18}
          color="white"
          anchorX="center"
          outlineWidth={0.03}
          outlineColor="black"
        >
          {player.name.split(' ').pop()}
        </Text>
      )}
    </group>
  );
        }
