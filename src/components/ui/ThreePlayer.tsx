import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function ThreePlayer({ pos, isTeam, isControlled, isBallOwner, faceUrl, name, rating }: {
  pos: THREE.Vector3;
  isTeam: boolean;
  isControlled: boolean;
  isBallOwner: boolean;
  faceUrl: string;
  name: string;
  rating: number;
  seed?: number;
  ballPos?: THREE.Vector3;
  slot?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // REAL FACE TEXTURE - NO UPLOAD NEEDED
  const faceTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const tex = loader.load(faceUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [faceUrl]);

  useFrame((state) => {
    if (groupRef.current && isControlled) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[pos.x, 0, pos.z]}>
      {/* SHADOW */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[0.35, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.3} />
      </mesh>

      {/* LEGS */}
      <mesh position={[-0.12, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        <meshStandardMaterial color={isTeam? "#ffffff" : "#1e293b"} />
      </mesh>
      <mesh position={[0.12, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        <meshStandardMaterial color={isTeam? "#ffffff" : "#1e293b"} />
      </mesh>

      {/* BODY - JERSEY */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.5, 4, 12]} />
        <meshStandardMaterial color={isTeam? "#dc2626" : "#ffffff"} roughness={0.6} />
      </mesh>

      {/* ARMS */}
      <mesh position={[-0.32, 0.9, 0]} rotation={[0, 0, -0.2]} castShadow>
        <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
        <meshStandardMaterial color="#d4a574" />
      </mesh>
      <mesh position={[0.32, 0.9, 0]} rotation={[0, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
        <meshStandardMaterial color="#d4a574" />
      </mesh>

      {/* HEAD WITH REAL FACE TEXTURE */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial map={faceTexture} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* BALL OWNER RING */}
      {isBallOwner && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[0.4, 0.5, 16]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.8} />
        </mesh>
      )}

      {/* CONTROLLED ARROW */}
      {isControlled && (
        <mesh position={[0, 2.1, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.15, 0.3, 8]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
      )}
    </group>
  );
}
