import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export type AnimMode = 'idle' | 'running' | 'celebrating';
interface Props {
  position: [number, number, number]; rating: number; jerseyColor: string;
  shortsColor: string; socksColor: string; playerName: string; isSelected: boolean;
  seed: number; animMode: AnimMode; runTarget: [number, number, number] | null;
  isScorer: boolean; avatarUrl: string; ratingColor: string; faceImageUrl?: string;
  jerseyNumber?: number; showLabel?: boolean; onSelect: () => void;
}

export function Player3DModel({ position, rating, jerseyColor, shortsColor, socksColor, playerName, isSelected, seed, animMode, runTarget, avatarUrl, ratingColor, faceImageUrl, showLabel=true, onSelect }: Props) {
  const groupRef=useRef<THREE.Group>(null); const innerRef=useRef<THREE.Group>(null);
  const currentPos=useRef(new THREE.Vector3(position[0],position[1],position[2]));
  const basePos=useMemo(()=>new THREE.Vector3(position[0],position[1],position[2]),[position]);

  useFrame((s)=>{
    if(!groupRef.current||!innerRef.current) return;
    currentPos.current.lerp(basePos,0.05);
    groupRef.current.position.copy(currentPos.current);
    innerRef.current.position.y=Math.sin(s.clock.elapsedTime*1.2+seed)*0.02;
  });

  // THIS GUARANTEES A FACE - NO MORE BROWN PLATE
  const safeFace = useMemo(()=>{
    if(faceImageUrl && faceImageUrl.startsWith('http')) return faceImageUrl;
    if(avatarUrl && avatarUrl.startsWith('http')) return avatarUrl;
    // Fallback wey ALWAYS work - no CORS wahala
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=random&color=fff&size=128&bold=true`;
  },[faceImageUrl, avatarUrl, playerName]);

  return (
    <group ref={groupRef} position={position}>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.01,0]}><circleGeometry args={[0.6,16]} /><meshBasicMaterial color="#000" transparent opacity={0.25} /></mesh>
      <group ref={innerRef} scale={[1.3,1.3,1.3]} position={[0,0.1,0]}>
        <mesh position={[0,0.6,0]} castShadow><capsuleGeometry args={[0.28,0.5,4,12]} /><meshStandardMaterial color={jerseyColor} roughness={0.5} /></mesh>
        <mesh position={[0,0.15,0]}><capsuleGeometry args={[0.26,0.1,4,8]} /><meshStandardMaterial color={shortsColor} /></mesh>
        <mesh position={[-0.12,-0.2,0]} castShadow><capsuleGeometry args={[0.08,0.35,4,8]} /><meshStandardMaterial color={socksColor} /></mesh>
        <mesh position={[0.12,-0.2,0]} castShadow><capsuleGeometry args={[0.08,0.35,4,8]} /><meshStandardMaterial color={socksColor} /></mesh>
        <mesh position={[0,1.25,0]} castShadow><sphereGeometry args={[0.26,20,20]} /><meshStandardMaterial color="#8D5524" /></mesh>

        {/* REAL FACE - TOP VIEW - NO MORE HIDE ON ERROR */}
        <Html position={[0,1.7,0]} center distanceFactor={5} zIndexRange={[100,0]} transform>
          <div style={{width:'46px',height:'46px',borderRadius:'50%',overflow:'hidden',border:'2px solid white',boxShadow:'0 4px 12px rgba(0,0,0,0.5)',background:'white'}}>
            <img
              src={safeFace}
              alt={playerName}
              style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
              onError={(e)=>{
                const img=e.target as HTMLImageElement;
                if(!img.src.includes('ui-avatars')){
                  img.src=`https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=random&color=fff&size=128`;
                }
              }}
            />
          </div>
        </Html>
      </group>

      {showLabel && <Html position={[0,2.7,0]} center distanceFactor={6}><div className="flex items-center gap-1 bg-black/80 rounded-full pl-0.5 pr-2 py-0.5 border border-white/20" onClick={(e)=>{e.stopPropagation();onSelect();}} style={{cursor:'pointer'}}><span className="text-white text-[7px] font-bold">{playerName}</span><div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[6px] font-black" style={{background:ratingColor,color:'#000'}}>{rating}</div></div></Html>}
      {isSelected && <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.02,0]}><ringGeometry args={[0.7,0.9,32]} /><meshBasicMaterial color="#22c55e" transparent opacity={0.9} side={THREE.DoubleSide} /></mesh>}
    </group>
  );
}
export default Player3DModel;
