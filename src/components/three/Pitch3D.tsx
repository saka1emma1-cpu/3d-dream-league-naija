import * as THREE from 'three';

const PITCH_WIDTH = 20;
const PITCH_LENGTH = 30;
const LINE_COLOR = new THREE.Color('#ffffff');
const LINE_WIDTH = 0.08;

function makeLineBox(x: number, z: number, w: number, h: number): JSX.Element {
  return (
    <mesh position={[x, 0.011, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={LINE_COLOR} transparent opacity={0.85} />
    </mesh>
  );
}

function GoalNet({ position }: { position: [number, number, number] }) {
  const netMat = (
    <meshBasicMaterial color="#ffffff" transparent opacity={0.15} side={THREE.DoubleSide} wireframe />
  );

  return (
    <group position={position}>
      {/* Posts */}
      <mesh position={[-2.25, 0.6, 0]} castShadow>
        <boxGeometry args={[0.1, 1.2, 0.1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[2.25, 0.6, 0]} castShadow>
        <boxGeometry args={[0.1, 1.2, 0.1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      {/* Crossbar */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[4.6, 0.1, 0.1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      {/* Back net */}
      <mesh position={[0, 0.6, -0.6]}>
        <planeGeometry args={[4.5, 1.2]} />
        {netMat}
      </mesh>
      {/* Side nets */}
      <mesh position={[-2.25, 0.6, -0.3]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.6, 1.2]} />
        {netMat}
      </mesh>
      <mesh position={[2.25, 0.6, -0.3]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.6, 1.2]} />
        {netMat}
      </mesh>
      {/* Top net */}
      <mesh position={[0, 1.2, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.5, 0.6]} />
        {netMat}
      </mesh>
    </group>
  );
}

export function Pitch3D() {
  const halfW = PITCH_WIDTH / 2;
  const halfL = PITCH_LENGTH / 2;

  return (
    <group>
      {/* Grass pitch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[PITCH_WIDTH, PITCH_LENGTH]} />
        <meshStandardMaterial color="#2a9d4a" roughness={0.9} />
      </mesh>

      {/* Mowed stripes */}
      {Array.from({ length: 10 }, (_, i) => {
        const z = -halfL + (PITCH_LENGTH / 10) * i + PITCH_LENGTH / 20;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, z]}>
            <planeGeometry args={[PITCH_WIDTH, PITCH_LENGTH / 10]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#2a9d4a' : '#248a42'}
              roughness={0.9}
            />
          </mesh>
        );
      })}

      {/* Outer boundary */}
      {makeLineBox(0, halfL, PITCH_WIDTH, LINE_WIDTH)}
      {makeLineBox(0, -halfL, PITCH_WIDTH, LINE_WIDTH)}
      {makeLineBox(-halfW, 0, LINE_WIDTH, PITCH_LENGTH)}
      {makeLineBox(halfW, 0, LINE_WIDTH, PITCH_LENGTH)}

      {/* Halfway line */}
      {makeLineBox(0, 0, PITCH_WIDTH, LINE_WIDTH)}

      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]}>
        <ringGeometry args={[1.8, 1.8 + LINE_WIDTH, 48]} />
        <meshBasicMaterial color={LINE_COLOR} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Center spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.12, 16]} />
        <meshBasicMaterial color={LINE_COLOR} transparent opacity={0.7} />
      </mesh>

      {/* Top penalty box (GK side) */}
      {makeLineBox(0, -halfL + 4, PITCH_WIDTH - 6, LINE_WIDTH)}
      {makeLineBox(-3, -halfL + 2, LINE_WIDTH, 4)}
      {makeLineBox(3, -halfL + 2, LINE_WIDTH, 4)}

      {/* Top goal box */}
      {makeLineBox(0, -halfL + 1.5, 6, LINE_WIDTH)}
      {makeLineBox(-3, -halfL + 0.75, LINE_WIDTH, 1.5)}
      {makeLineBox(3, -halfL + 0.75, LINE_WIDTH, 1.5)}

      {/* Bottom penalty box (FWD side) */}
      {makeLineBox(0, halfL - 4, PITCH_WIDTH - 6, LINE_WIDTH)}
      {makeLineBox(-3, halfL - 2, LINE_WIDTH, 4)}
      {makeLineBox(3, halfL - 2, LINE_WIDTH, 4)}

      {/* Bottom goal box */}
      {makeLineBox(0, halfL - 1.5, 6, LINE_WIDTH)}
      {makeLineBox(-3, halfL - 0.75, LINE_WIDTH, 1.5)}
      {makeLineBox(3, halfL - 0.75, LINE_WIDTH, 1.5)}

      {/* Goals with nets */}
      <GoalNet position={[0, 0, -halfL]} />
      <GoalNet position={[0, 0, halfL]} />
    </group>
  );
}
