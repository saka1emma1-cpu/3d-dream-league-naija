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
  const skinTone=useMemo(()=>['#8D5524','#A86E3C','#C68642'][seed%3],[seed]);

  useFrame((s,d)=>{
    if(!groupRef.current||!innerRef.current) return;
    const t=s.clock.elapsedTime;
    if(animMode==='running'&&runTarget){
      const tg=new THREE.Vector3(runTarget[0],position[1],runTarget[2]);
      currentPos.current.lerp(tg,0.03); groupRef.current.position.copy(currentPos.current);
    } else {
      currentPos.current.lerp(basePos,0.05); groupRef.current.position.copy(currentPos.current);
      innerRef.current.position.y=Math.sin(t*1.2+seed)*0.02;
    }
  });

  const faceUrl = faceImageUrl || avatarUrl;

  return (
    <group ref={groupRef} position={position}>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.01,0]}><circleGeometry args={[0.6,16]} /><meshBasicMaterial color="#000" transparent opacity={0.25} /></mesh>
      <group ref={innerRef} scale={[1.3,1.3,1.3]} position={[0,0.1,0]}>
        {/* BODY - CAPSULE NOT BOX */}
        <mesh position={[0,0.6,0]} castShadow><capsuleGeometry args={[0.28,0.5,4,12]} /><meshStandardMaterial color={jerseyColor} roughness={0.5} /></mesh>
        {/* SHORTS */}
        <mesh position={[0,0.15,0]}><capsuleGeometry args={[0.26,0.1,4,8]} /><meshStandardMaterial color={shortsColor} /></mesh>
        {/* LEGS */}
        <mesh position={[-0.12,-0.2,0]} castShadow><capsuleGeometry args={[0.08,0.35,4,8]} /><meshStandardMaterial color={socksColor} /></mesh>
        <mesh position={[0.12,-0.2,0]} castShadow><capsuleGeometry args={[0.08,0.35,4,8]} /><meshStandardMaterial color={socksColor} /></mesh>

        {/* HEAD - SKIN */}
        <mesh position={[0,1.25,0]} castShadow><sphereGeometry args={[0.26,20,20]} /><meshStandardMaterial color={skinTone} roughness={0.5} /></mesh>

        {/* FACE - TOP-DOWN VISIBLE BILLBOARD - THIS FIXES YOUR SCREENSHOT */}
        <Html position={[0,1.65,0]} center distanceFactor={6} zIndexRange={[20,0]} transform pointerEvents="none">
          <div className="rounded-full overflow-hidden border-2 border-white shadow-lg" style={{width:'42px',height:'42px',background:skinTone}}>
            <img src={faceUrl} alt={playerName} className="w-full h-full object-cover" crossOrigin="anonymous" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}} />
          </div>
        </Html>

        {/* SMALL HAIR RING - NOT FULL BLACK BALL */}
        <mesh position={[0,1.32,0]}><ringGeometry args={[0.22,0.27,20]} /><meshBasicMaterial color="#111" side={THREE.DoubleSide} /></mesh>
      </group>

      {showLabel && <Html position={[0,2.6,0]} center distanceFactor={6}><div className="flex items-center gap-1 bg-black/80 rounded-full pl-0.5 pr-2 py-0.5 border border-white/20" onClick={(e)=>{e.stopPropagation();onSelect();}} style={{cursor:'pointer'}}><img src={avatarUrl} className="w-4 h-4 rounded-full object-cover" /><span className="text-white text-[7px] font-bold">{playerName}</span><div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[6px] font-black" style={{background:ratingColor,color:'#000'}}>{rating}</div></div></Html>}
      {isSelected && <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.02,0]}><ringGeometry args={[0.7,0.9,32]} /><meshBasicMaterial color="#22c55e" transparent opacity={0.9} side={THREE.DoubleSide} /></mesh>}
    </group>
  );
}
export default Player3DModel;
