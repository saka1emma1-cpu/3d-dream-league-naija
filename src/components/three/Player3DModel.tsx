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

export function Player3DModel({ position, rating, jerseyColor, shortsColor, socksColor, playerName, isSelected, seed, animMode, runTarget, isScorer, avatarUrl, ratingColor, faceImageUrl, jerseyNumber, showLabel=true, onSelect }: Props) {
  const groupRef=useRef<THREE.Group>(null); const innerRef=useRef<THREE.Group>(null);
  const leftLegRef=useRef<THREE.Group>(null); const rightLegRef=useRef<THREE.Group>(null);
  const leftArmRef=useRef<THREE.Group>(null); const rightArmRef=useRef<THREE.Group>(null);
  const currentPos=useRef(new THREE.Vector3(position[0],position[1],position[2]));
  const basePos=useMemo(()=>new THREE.Vector3(position[0],position[1],position[2]),[position]);
  const skinTone=useMemo(()=>['#8D5524','#A86E3C','#C68642','#6e3b1f'][seed%4],[seed]);
  const bootColor=useMemo(()=>seed%2?'#0a0a0a':'#ffffff',[seed]);

  const faceTexture=useMemo(()=>{
    const loader=new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
    const url=faceImageUrl||avatarUrl; if(!url) return null;
    const tex=loader.load(url); tex.colorSpace=THREE.SRGBColorSpace; return tex;
  },[faceImageUrl,avatarUrl]);

  useFrame((s,d)=>{
    if(!groupRef.current||!innerRef.current) return; const t=s.clock.elapsedTime;
    if(animMode==='running'&&runTarget){
      const target=new THREE.Vector3(runTarget[0],position[1],runTarget[2]);
      currentPos.current.lerp(target,0.03); groupRef.current.position.copy(currentPos.current);
      const swing=Math.sin(t*10)*0.7;
      if(leftLegRef.current) leftLegRef.current.rotation.x=swing;
      if(rightLegRef.current) rightLegRef.current.rotation.x=-swing;
    } else {
      currentPos.current.lerp(basePos,0.05); groupRef.current.position.copy(currentPos.current);
      innerRef.current.position.y=Math.sin(t*1.5+seed)*0.015;
      if(isSelected) innerRef.current.rotation.y+=d*0.8;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.01,0]}><circleGeometry args={[0.65,16]} /><meshBasicMaterial color="#000" transparent opacity={0.3} /></mesh>
      <group ref={innerRef} scale={[1.25,1.25,1.25]} position={[0,0.15,0]}>
        {/* REAL HEAD */}
        <mesh position={[0,1.38,0]} castShadow><sphereGeometry args={[0.23,20,20]} /><meshStandardMaterial color={skinTone} roughness={0.5} /></mesh>
        {faceTexture && <mesh position={[0,1.38,0.195]}><circleGeometry args={[0.20,32]} /><meshStandardMaterial map={faceTexture} roughness={0.3} /></mesh>}
        <mesh position={[0,1.52,0]} castShadow><sphereGeometry args={[0.24,12,12,0,Math.PI*2,0,Math.PI*0.55]} /><meshStandardMaterial color="#0a0a0a" roughness={0.9} /></mesh>
        {/* TORSO - REAL JERSEY NOT BOX */}
        <mesh position={[0,0.78,0]} castShadow><capsuleGeometry args={[0.26,0.45,4,12]} /><meshStandardMaterial color={jerseyColor} roughness={0.45} /></mesh>
        <group ref={leftArmRef} position={[-0.30,1.0,0]}><mesh position={[0,-0.2,0]} castShadow><capsuleGeometry args={[0.06,0.35,4,8]} /><meshStandardMaterial color={skinTone} /></mesh></group>
        <group ref={rightArmRef} position={[0.30,1.0,0]}><mesh position={[0,-0.2,0]} castShadow><capsuleGeometry args={[0.06,0.35,4,8]} /><meshStandardMaterial color={skinTone} /></mesh></group>
        <mesh position={[0,0.28,0]} castShadow><capsuleGeometry args={[0.24,0.1,4,8]} /><meshStandardMaterial color={shortsColor} /></mesh>
        <group ref={leftLegRef} position={[-0.12,0.12,0]}><mesh position={[0,-0.4,0]} castShadow><capsuleGeometry args={[0.08,0.55,4,8]} /><meshStandardMaterial color={socksColor} /></mesh><mesh position={[0,-0.75,0.05]} castShadow><boxGeometry args={[0.13,0.09,0.24]} /><meshStandardMaterial color={bootColor} /></mesh></group>
        <group ref={rightLegRef} position={[0.12,0.12,0]}><mesh position={[0,-0.4,0]} castShadow><capsuleGeometry args={[0.08,0.55,4,8]} /><meshStandardMaterial color={socksColor} /></mesh><mesh position={[0,-0.75,0.05]} castShadow><boxGeometry args={[0.13,0.09,0.24]} /><meshStandardMaterial color={bootColor} /></mesh></group>
      </group>
      {showLabel && <Html position={[0,3.0,0]} center distanceFactor={7}><div className="flex items-center gap-1 bg-black/75 rounded-full pl-0.5 pr-2 py-0.5 border border-white/20" onClick={(e)=>{e.stopPropagation();onSelect();}} style={{cursor:'pointer'}}><img src={avatarUrl} className="w-5 h-5 rounded-full object-cover" /><span className="text-white text-[8px] font-bold">{playerName}</span><div className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-black" style={{background:ratingColor,color:'#000'}}>{rating}</div></div></Html>}
      {isSelected && <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.02,0]}><ringGeometry args={[0.75,0.95,32]} /><meshBasicMaterial color="#22c55e" transparent opacity={0.9} side={THREE.DoubleSide} /></mesh>}
    </group>
  );
}
export default Player3DModel;
