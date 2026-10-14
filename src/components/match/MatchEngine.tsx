import { useRef, useMemo, Suspense, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronLeft, Pause, Play } from 'lucide-react';
import type { Player } from '@/types/game';
import { getOverall, getFaceUrl, getJerseyNumber } from '@/components/ui/playerUtils';

interface Props { players: Player[]; onExit: () => void; }

// ===== FL26 FORMATIONS - WIDE PITCH LIKE BROADCAST =====
const FORMATION_433: Record<number, [number, number, number]> = {
  0: [0, 0, -18], 1: [-6, 0, -12], 2: [-2, 0, -13], 3: [2, 0, -13], 4: [6, 0, -12],
  5: [-4, 0, -5], 6: [0, 0, -3], 7: [4, 0, -5], 8: [-5, 0, 2], 9: [0, 0, 4], 10: [5, 0, 2],
};
const OPP_FORMATION: [number, number, number][] = [
  [0, 0, 18], [-6, 0, 12], [-2, 0, 13], [2, 0, 13], [6, 0, 12],
  [-4, 0, 5], [0, 0, 3], [4, 0, 5], [-5, 0, -2], [0, 0, -4], [5, 0, -2],
];

const TEAM_JERSEY='#D00000'; const OPP_JERSEY='#FFFFFF';
const GOAL_Z=21; const OPP_GOAL_Z=-21; const PITCH_W=16; const PITCH_L=22;

function hashId(id:string){ let h=0; for(let i=0;i<id.length;i++) h=((h<<5)-h+id.charCodeAt(i))|0; return Math.abs(h); }

// ===== REALISTIC FL26 PITCH - GRASS STRIPES + STADIUM + LED BOARDS =====
function RealisticPitch() {
  const grassTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    for(let i=0;i<32;i++){
      ctx.fillStyle = i%2===0 ? '#1a8a2e' : '#1e9a34';
      ctx.fillRect(0, i*16, 512, 16);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }, []);

  const adTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0a1a8a'; ctx.fillRect(0,0,1024,128);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 32px Arial';
    for(let i=0;i<4;i++){
      ctx.fillText('Football League 26', i*260+20, 70);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(2,1);
    return tex;
  }, []);

  return (
    <group>
      {/* Main HD Grass */}
      <mesh rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[PITCH_W*2.2, PITCH_L*2.6]} />
        <meshStandardMaterial map={grassTexture} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* White Lines - Broadcast Style */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.02,0]}>
        <planeGeometry args={[PITCH_W*2, PITCH_L*2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} />
      </mesh>
      
      {/* Center line */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.03,0]}>
        <planeGeometry args={[PITCH_W*2, 0.08]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Center circle */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.03,0]}>
        <ringGeometry args={[3.5, 3.58, 64]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.03,0]}>
        <circleGeometry args={[0.2, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Penalty areas - FL26 size */}
      <group position={[0,0.03,GOAL_Z-5.5]}>
        <mesh position={[0,0,0]}><boxGeometry args={[12,0.05,5.5]} /><meshStandardMaterial color="#ffffff" wireframe={false} /></mesh>
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,2.75]}><planeGeometry args={[12,0.08]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh rotation={[-Math.PI/2,0,0]} position={[-6,0,0]}><planeGeometry args={[0.08,5.5]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh rotation={[-Math.PI/2,0,0]} position={[6,0,0]}><planeGeometry args={[0.08,5.5]} /><meshStandardMaterial color="#ffffff" /></mesh>
      </group>
      <group position={[0,0.03,OPP_GOAL_Z+5.5]}>
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,-2.75]}><planeGeometry args={[12,0.08]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh rotation={[-Math.PI/2,0,0]} position={[-6,0,0]}><planeGeometry args={[0.08,5.5]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh rotation={[-Math.PI/2,0,0]} position={[6,0,0]}><planeGeometry args={[0.08,5.5]} /><meshStandardMaterial color="#ffffff" /></mesh>
      </group>

      {/* Goals - Real net */}
      <group position={[0,0.5,GOAL_Z]}>
        <mesh position={[0,1,0]}><boxGeometry args={[3.6,2,0.1]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[-1.8,1,0.5]}><boxGeometry args={[0.08,2,1]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[1.8,1,0.5]}><boxGeometry args={[0.08,2,1]} /><meshStandardMaterial color="#ffffff" /></mesh>
      </group>
      <group position={[0,0.5,OPP_GOAL_Z]}>
        <mesh position={[0,1,0]}><boxGeometry args={[3.6,2,0.1]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[-1.8,1,-0.5]}><boxGeometry args={[0.08,2,1]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[1.8,1,-0.5]}><boxGeometry args={[0.08,2,1]} /><meshStandardMaterial color="#ffffff" /></mesh>
      </group>

      {/* LED Ad Boards - Like FL26 screenshot */}
      <mesh position={[0,0.8,GOAL_Z+3]}><planeGeometry args={[32,1.5]} /><meshStandardMaterial map={adTexture} emissive="#ffffff" emissiveIntensity={0.2} /></mesh>
      <mesh position={[0,0.8,OPP_GOAL_Z-3]} rotation={[0,Math.PI,0]}><planeGeometry args={[32,1.5]} /><meshStandardMaterial map={adTexture} emissive="#ffffff" emissiveIntensity={0.2} /></mesh>
      <mesh position={[-PITCH_W-1,0.8,0]} rotation={[0,Math.PI/2,0]}><planeGeometry args={[44,1.5]} /><meshStandardMaterial map={adTexture} emissive="#ffffff" emissiveIntensity={0.2} /></mesh>
      <mesh position={[PITCH_W+1,0.8,0]} rotation={[0,-Math.PI/2,0]}><planeGeometry args={[44,1.5]} /><meshStandardMaterial map={adTexture} emissive="#ffffff" emissiveIntensity={0.2} /></mesh>

      {/* Stadium shadow */}
      <mesh position={[0,12,-28]}><planeGeometry args={[60,20]} /><meshStandardMaterial color="#050a14" /></mesh>
    </group>
  );
}
// ===== REALISTIC FL26 PLAYER - NOT BLOCKY, SLIM LIKE SCREENSHOT =====
function RealPlayer({ pos, isTeam, rating, name, isControlled, isBallOwner, ballPos, seed }: {
  pos: THREE.Vector3; isTeam: boolean; rating: number; name: string; isControlled: boolean; isBallOwner: boolean; ballPos: THREE.Vector3; seed: number
}) {
  const groupRef = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);

  useFrame((state) => {
    if(!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const moving = pos.distanceTo(new THREE.Vector3(pos.x,0,pos.z)) > 0.1 || isControlled || isBallOwner;

    if(moving){
      const runSpeed = isControlled? 8 : 6;
      if(legL.current) legL.current.rotation.x = Math.sin(t*runSpeed)*0.8;
      if(legR.current) legR.current.rotation.x = -Math.sin(t*runSpeed)*0.8;
      if(armL.current) armL.current.rotation.x = -Math.sin(t*runSpeed)*0.6;
      if(armR.current) armR.current.rotation.x = Math.sin(t*runSpeed)*0.6;
    }
    // Face ball
    if(isBallOwner || isControlled){
      groupRef.current.lookAt(ballPos.x, 0.5, ballPos.z);
    }
  });

  const jerseyColor = isTeam? '#cc0000' : '#ffffff';
  const shortsColor = isTeam? '#cc0000' : '#1a1a3a';
  const skinColor = useMemo(() => {
    const colors = ['#8d5524','#c68642','#e0ac69','#d5a06e','#a86a32'];
    return colors[seed % colors.length];
  }, [seed]);

  return (
    <group position={[pos.x, 0, pos.z]} ref={groupRef}>
      {/* Shadow */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.02,0]}>
        <circleGeometry args={[0.35, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      {/* Controlled indicator - like FL26 green circle */}
      {isControlled && (
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.04,0]}>
          <ringGeometry args={[0.5,0.6,32]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
      {isBallOwner && (
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.04,0]}>
          <ringGeometry args={[0.35,0.45,24]} />
          <meshBasicMaterial color={isTeam? "#00ff88" : "#ff4444"} transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Body - slim realistic */}
      <group position={[0,0.9,0]}>
        {/* Legs */}
        <group ref={legL} position={[-0.12,0,0]}>
          <mesh position={[0,-0.35,0]} castShadow><capsuleGeometry args={[0.08,0.35,4,8]} /><meshStandardMaterial color={shortsColor} /></mesh>
          <mesh position={[0,-0.75,0]} castShadow><capsuleGeometry args={[0.07,0.35,4,8]} /><meshStandardMaterial color={skinColor} /></mesh>
        </group>
        <group ref={legR} position={[0.12,0,0]}>
          <mesh position={[0,-0.35,0]} castShadow><capsuleGeometry args={[0.08,0.35,4,8]} /><meshStandardMaterial color={shortsColor} /></mesh>
          <mesh position={[0,-0.75,0]} castShadow><capsuleGeometry args={[0.07,0.35,4,8]} /><meshStandardMaterial color={skinColor} /></mesh>
        </group>

        {/* Torso - jersey */}
        <mesh position={[0,0.2,0]} castShadow><capsuleGeometry args={[0.22,0.35,4,8]} /><meshStandardMaterial color={jerseyColor} /></mesh>

        {/* Arms */}
        <group ref={armL} position={[-0.28,0.3,0]}>
          <mesh position={[0,-0.15,0]} castShadow><capsuleGeometry args={[0.06,0.25,4,8]} /><meshStandardMaterial color={jerseyColor} /></mesh>
          <mesh position={[0,-0.4,0]} castShadow><capsuleGeometry args={[0.05,0.2,4,8]} /><meshStandardMaterial color={skinColor} /></mesh>
        </group>
        <group ref={armR} position={[0.28,0.3,0]}>
          <mesh position={[0,-0.15,0]} castShadow><capsuleGeometry args={[0.06,0.25,4,8]} /><meshStandardMaterial color={jerseyColor} /></mesh>
          <mesh position={[0,-0.4,0]} castShadow><capsuleGeometry args={[0.05,0.2,4,8]} /><meshStandardMaterial color={skinColor} /></mesh>
        </group>

        {/* Head - realistic */}
        <mesh position={[0,0.65,0]} castShadow><sphereGeometry args={[0.18,16,16]} /><meshStandardMaterial color={skinColor} /></mesh>
        {/* Hair */}
        <mesh position={[0,0.78,0]}><sphereGeometry args={[0.19,12,8,0,Math.PI*2,0,Math.PI/2]} /><meshStandardMaterial color="#111111" /></mesh>
      </group>

      {/* Name label - only for controlled like FL26 */}
      {isControlled && (
        <Html position={[0,2,0]} center distanceFactor={8} zIndexRange={[10,0]} pointerEvents="none">
          <div className="bg-black/70 px-2 py-0.5 rounded text-white text-[10px] font-bold whitespace-nowrap">{name} • {rating}</div>
        </Html>
      )}
    </group>
  );
}

interface Entity {
  id:string; name:string; pos:THREE.Vector3; basePos:THREE.Vector3; isTeam:boolean;
  slot:number; rating:number; seed:number;
}
interface BallState {
  pos:THREE.Vector3; vel:THREE.Vector3; owner:string|null; isShot:boolean;
  shotProgress:number; shotStart:THREE.Vector3; shotEnd:THREE.Vector3;
}

function GoalCelebration({ scorer, isTeam }: { scorer:string; isTeam:boolean }) {
  const [scale,setScale]=useState(0.5);
  useFrame((s)=>{ setScale(1+Math.sin(s.clock.elapsedTime*5)*0.2); });
  return (
    <Html position={[0,5,0]} center distanceFactor={8} zIndexRange={[30,0]} pointerEvents="none">
      <div className="flex flex-col items-center" style={{ transform:`scale(${scale})` }}>
        <div className="text-6xl font-black text-yellow-400 animate-pulse" style={{ textShadow:'4px 4px 0 #000' }}>GOAL!</div>
        <div className="bg-black/80 px-4 py-1 rounded-full border border-yellow-400 mt-2">
          <span className="text-white font-bold text-sm">{scorer}</span>
          <span className="text-yellow-400 ml-2 text-xs">{isTeam? 'EMMA FC' : 'ARG'}</span>
        </div>
      </div>
    </Html>
  );
}
function MatchScene({ players, joystickRef, actionRef, scoreRef, pausedRef, onGoal, controlledInfoRef }: {
  players:Player[]; joystickRef:React.MutableRefObject<{x:number;y:number}>;
  actionRef:React.MutableRefObject<{pass:number;shoot:number;through:number;sprint:number}>;
  scoreRef:React.MutableRefObject<{home:number;away:number}>;
  pausedRef:React.MutableRefObject<boolean>;
  onGoal:(scorer:string, rating:number, isTeam:boolean)=>void;
  controlledInfoRef:React.MutableRefObject<{name:string;faceUrl:string;rating:number}>;
}) {
  const { camera }=useThree();
  const sprintTimer=useRef(0);
  const shake=useRef(0);

  const entities=useMemo(()=>{
    const team=players.filter(p=>p.slot>=0).sort((a,b)=>a.slot-b.slot);
    const list:Entity[]=[];
    team.forEach(p=>{
      const pos=FORMATION_433[p.slot]?? [0,0,0] as [number,number,number];
      list.push({ id:p.id, name:p.name.split(' ').pop()||p.name, pos:new THREE.Vector3(pos[0],pos[1],pos[2]), basePos:new THREE.Vector3(pos[0],pos[1],pos[2]), isTeam:true, slot:p.slot, rating:getOverall(p), seed:hashId(p.id) });
    });
    const oppNames=['Martinez','Lopez','Garcia','Silva','Costa','Fernandes','Vega','Pinto','Ramos','Diaz','Santos'];
    OPP_FORMATION.forEach((pos,i)=>{ list.push({ id:'opp'+i, name:oppNames[i], pos:new THREE.Vector3(pos[0],pos[1],pos[2]), basePos:new THREE.Vector3(pos[0],pos[1],pos[2]), isTeam:false, slot:i, rating:65+(hashId('opp'+i)%15), seed:hashId('opp'+i) }); });
    return list;
  },[players]);

  const ballState=useRef<BallState>({ pos:new THREE.Vector3(0,0.15,0), vel:new THREE.Vector3(0,0,0), owner:null, isShot:false, shotProgress:0, shotStart:new THREE.Vector3(), shotEnd:new THREE.Vector3() });
  const [goalData,setGoalData]=useState<{scorer:string;isTeam:boolean}|null>(null);
  const controlledId=useMemo(()=> players.filter(p=>p.slot>=0).sort((a,b)=>a.slot-b.slot).find(p=>p.position==='FWD')?.id?? entities.find(e=>e.isTeam)?.id?? '', [players, entities]);
  const controlledRef=useRef(controlledId);
  useEffect(()=>{ controlledRef.current=controlledId; },[controlledId]);

  useFrame((state,delta)=>{
    if(pausedRef.current) return;
    const t=state.clock.elapsedTime; const ball=ballState.current; const ctrlId=controlledRef.current;
    const ctrl=entities.find(e=>e.id===ctrlId); const joy=joystickRef.current;
    if(ctrl){ controlledInfoRef.current={ name:ctrl.name, faceUrl:getFaceUrl(ctrl.name), rating:ctrl.rating }; }
    if(shake.current>0){ camera.position.x+=(Math.random()-0.5)*shake.current; camera.position.y+=(Math.random()-0.5)*shake.current; shake.current*=0.92; if(shake.current<0.01) shake.current=0; }
    if(sprintTimer.current>0) sprintTimer.current-=delta;

    // Movement
    if(ctrl){ const speed=sprintTimer.current>0?0.25:0.13; ctrl.pos.x+=joy.x*speed; ctrl.pos.z+=joy.y*speed; ctrl.pos.x=THREE.MathUtils.clamp(ctrl.pos.x,-PITCH_W,PITCH_W); ctrl.pos.z=THREE.MathUtils.clamp(ctrl.pos.z,-GOAL_Z,GOAL_Z); }

    // Ball physics
    if(ball.isShot){
      ball.shotProgress+=delta*1.8; const p=Math.min(ball.shotProgress,1);
      ball.pos.x=THREE.MathUtils.lerp(ball.shotStart.x,ball.shotEnd.x,p);
      ball.pos.z=THREE.MathUtils.lerp(ball.shotStart.z,ball.shotEnd.z,p);
      ball.pos.y=0.15+Math.sin(p*Math.PI)*3;
      if(p>=1){ ball.isShot=false; ball.owner=null; ball.vel.set(0,0,0); }
    } else if(ball.owner){
      const owner=entities.find(e=>e.id===ball.owner);
      if(owner){ ball.pos.x=owner.pos.x; ball.pos.z=owner.pos.z+(owner.isTeam?0.4:-0.4); ball.pos.y=0.15;
        if(!owner.isTeam){ owner.pos.z-=0.08; if(owner.pos.z<-15&&Math.random()<0.015){ ball.isShot=true; ball.shotProgress=0; ball.shotStart.copy(ball.pos); ball.shotEnd.set((Math.random()-0.5)*3,0.5,-GOAL_Z); ball.owner=null; } }
      } else ball.owner=null;
    } else {
      ball.pos.add(ball.vel); ball.vel.multiplyScalar(0.94); ball.pos.y=0.15;
      entities.forEach(e=>{ if(ball.owner) return; if(e.pos.distanceTo(ball.pos)<1){ ball.owner=e.id; ball.vel.set(0,0,0); } });
    }

    // Goals - Like FL26 92:34 screenshot
    if(ball.pos.z>=GOAL_Z-1&&Math.abs(ball.pos.x)<1.8&&!ball.isShot){
      scoreRef.current.home++; shake.current=0.5; const scorer=ctrl?.name??'Okoro'; setGoalData({ scorer, isTeam:true }); onGoal(scorer,ctrl?.rating??70,true);
      ball.pos.set(0,0.15,0); ball.vel.set(0,0,0); ball.owner=null; ball.isShot=false; entities.forEach(e=>e.pos.copy(e.basePos)); setTimeout(()=>setGoalData(null),3000);
    }
    if(ball.pos.z<=OPP_GOAL_Z+1&&Math.abs(ball.pos.x)<1.8&&!ball.isShot){
      scoreRef.current.away++; shake.current=0.5; setGoalData({ scorer:'Diaz', isTeam:false }); onGoal('Diaz',68,false);
      ball.pos.set(0,0.15,0); ball.vel.set(0,0,0); ball.owner=null; ball.isShot=false; entities.forEach(e=>e.pos.copy(e.basePos)); setTimeout(()=>setGoalData(null),3000);
    }

    // AI
    entities.forEach(e=>{
      if(e.id===ctrlId) return;
      if(e.isTeam){ if(ball.owner!==e.id){ const tx=e.basePos.x+(ball.pos.x-e.basePos.x)*0.2; const tz=e.basePos.z+(ball.pos.z-e.basePos.z)*0.15; e.pos.x+=(tx-e.pos.x)*0.03; e.pos.z+=(tz-e.pos.z)*0.03; } }
      else { if(!ball.owner&&e.pos.distanceTo(ball.pos)<5){ const dir=ball.pos.clone().sub(e.pos).normalize(); e.pos.x+=dir.x*0.06; e.pos.z+=dir.z*0.06; } else { e.pos.x+=(e.basePos.x-e.pos.x)*0.02; e.pos.z+=(e.basePos.z-e.pos.z)*0.02; } }
      e.pos.x=THREE.MathUtils.clamp(e.pos.x,-PITCH_W,PITCH_W); e.pos.z=THREE.MathUtils.clamp(e.pos.z,-GOAL_Z,GOAL_Z);
    });

    const act=actionRef.current;
    if(act.pass>0){ act.pass=0; if(ball.owner===ctrlId){ let near:Entity|null=null; let md=Infinity; entities.forEach(e=>{ if(!e.isTeam||e.id===ctrlId) return; const d=e.pos.distanceTo(ctrl!.pos); if(d<md){ md=d; near=e; } }); if(near&&ctrl){ ball.owner=null; const dir=near.pos.clone().sub(ball.pos).normalize(); ball.vel.copy(dir.multiplyScalar(0.35)); } } }
    if(act.shoot>0){ act.shoot=0; if(ball.owner===ctrlId&&ctrl){ ball.isShot=true; ball.shotProgress=0; ball.shotStart.copy(ball.pos); ball.shotEnd.set((Math.random()-0.5)*2,0.5,GOAL_Z); ball.owner=null; } }
    if(act.through>0){ act.through=0; if(ball.owner===ctrlId&&ctrl){ ball.owner=null; ball.vel.set(ctrl.pos.x*0.08,0,0.5); } }
    if(act.sprint>0){ act.sprint=0; sprintTimer.current=2.5; }

    // ===== FL26 BROADCAST CAMERA - Like your 2nd screenshot (POR vs ARG 92:34) =====
    const targetX = ball.pos.x*0.6;
    const targetZ = ball.pos.z*0.3;
    const idealX = targetX;
    const idealY = 8 + Math.abs(ball.pos.z)*0.15;
    const idealZ = targetZ - 16;
    camera.position.x += (idealX - camera.position.x)*0.04;
    camera.position.y += (idealY - camera.position.y)*0.04;
    camera.position.z += (idealZ - camera.position.z)*0.04;
    camera.lookAt(targetX, 0, targetZ+2);
  });

  const ball=ballState.current;
  return (
    <>
      <color attach="background" args={['#0b1a3a']} />
      <fog attach="fog" args={['#0b1a3a', 20, 45]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[15,20,-10]} intensity={2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
      <directionalLight position={[-10,10,10]} intensity={0.5} color="#aaccff" />

      <Suspense fallback={null}>
        <RealisticPitch />
        {/* Ball - HD */}
        <mesh position={[ball.pos.x, ball.pos.y, ball.pos.z]} castShadow>
          <sphereGeometry args={[0.16,24,24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
          <mesh position={[0,0,0]}><sphereGeometry args={[0.165,12,12]} /><meshBasicMaterial color="#000000" wireframe transparent opacity={0.08} /></mesh>
        </mesh>

        {entities.map(e=>(
          <RealPlayer key={e.id} pos={e.pos} isTeam={e.isTeam} rating={e.rating} name={e.name} isControlled={e.id===controlledId} isBallOwner={ball.owner===e.id} ballPos={ball.pos} seed={e.seed} />
        ))}

        {goalData && <GoalCelebration scorer={goalData.scorer} isTeam={goalData.isTeam} />}
      </Suspense>
    </>
  );
}
function MatchEngine({ players, onExit }: Props) {
  const [score,setScore]=useState({ home:0, away:0 });
  const [time,setTime]=useState(0);
  const [paused,setPaused]=useState(false);
  const [goalDisplay,setGoalDisplay]=useState<{scorer:string;rating:number}|null>(null);
  const [ctrlDisplay,setCtrlDisplay]=useState<{name:string;faceUrl:string;rating:number}>({ name:'Okoro', faceUrl:getFaceUrl('Okoro'), rating:70 });

  const joystickRef=useRef({ x:0, y:0 });
  const actionRef=useRef({ pass:0, shoot:0, through:0, sprint:0 });
  const scoreRef=useRef(score); const pausedRef=useRef(paused); const controlledInfoRef=useRef(ctrlDisplay);
  const joyActive=useRef(false); const [joyKnob,setJoyKnob]=useState({ x:0, y:0 });

  useEffect(()=>{ scoreRef.current=score; },[score]);
  useEffect(()=>{ pausedRef.current=paused; },[paused]);
  useEffect(()=>{ controlledInfoRef.current=ctrlDisplay; },[ctrlDisplay]);

  const handleGoal=useCallback((scorer:string,rating:number)=>{ setGoalDisplay({ scorer, rating }); setTimeout(()=>setGoalDisplay(null),3000); },[]);

  useEffect(()=>{
    const iv=setInterval(()=>{
      if(!pausedRef.current){
        setTime(t=>{
          if(t>=540){ pausedRef.current=true; setPaused(true); return t; }
          const nt=t+1; if(nt%15===0){ const cur=controlledInfoRef.current; setCtrlDisplay(cur); } return nt;
        });
      }
    },1000);
    return ()=>clearInterval(iv);
  },[]);

  useEffect(()=>{
    const cur=controlledInfoRef.current; if(cur.name) setCtrlDisplay(cur);
    const id=setInterval(()=>{ setScore({...scoreRef.current}); setCtrlDisplay({...controlledInfoRef.current}); },200);
    return ()=>clearInterval(id);
  },[]);

  const fmt=(s:number)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const handleJoyStart=(cx:number,cy:number)=>{ joyActive.current=true; };
  const handleJoyMove=(cx:number,cy:number)=>{
    if(!joyActive.current) return;
    const base=document.querySelector('.joy-base')?.getBoundingClientRect();
    if(!base) return;
    const dx=cx-(base.left+base.width/2); const dy=cy-(base.top+base.height/2);
    const dist=Math.min(Math.sqrt(dx*dx+dy*dy), 55); const ang=Math.atan2(dy,dx);
    const x=Math.cos(ang)*dist; const y=Math.sin(ang)*dist;
    setJoyKnob({ x, y }); joystickRef.current={ x: x/55, y: y/55 };
  };
  const handleJoyEnd=()=>{ joyActive.current=false; setJoyKnob({ x:0, y:0 }); joystickRef.current={ x:0, y:0 }; };
  const doAction=(type:'pass'|'shoot'|'through'|'sprint')=>{ if(type==='pass') actionRef.current.pass++; if(type==='shoot') actionRef.current.shoot++; if(type==='through') actionRef.current.through++; if(type==='sprint') actionRef.current.sprint++; };

  return (
    <div className="w-full h-screen relative overflow-hidden bg-[#0b1a3a] select-none">
      {/* FL26 TOP BAR - EXACTLY LIKE YOUR SCREENSHOT POR 1-1 ARG 92:34 */}
      <div className="absolute top-0 left-0 right-0 z-30 h-11 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <button onClick={onExit} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"><ChevronLeft size={18} /></button>
          <div className="flex items-center gap-2">
            <img src={ctrlDisplay.faceUrl} alt={ctrlDisplay.name} className="w-7 h-7 rounded-full object-cover border border-white/30" />
            <span className="text-white font-bold text-sm tracking-wide">{ctrlDisplay.name}</span>
            <span className="text-emerald-400 text-[10px] font-black ml-1">{ctrlDisplay.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#111] rounded px-3 py-1 gap-3 border border-white/10">
            <span className="text-white font-black text-sm">EMMA FC</span>
            <div className="flex items-center gap-1 bg-white text-black font-black px-2 py-0.5 rounded text-sm">
              <span>{score.home}</span><span className="opacity-50">-</span><span>{score.away}</span>
            </div>
            <span className="text-white font-black text-sm">ARG</span>
          </div>
          <div className="flex items-center gap-1 bg-[#00ff88] text-black font-black px-2 py-1 rounded text-xs">
            <span>{fmt(time)}</span><span className="text-[9px]">+{Math.floor(Math.random()*3)+2}</span>
          </div>
          <button onClick={()=>{ setPaused(!paused); pausedRef.current=!paused; }} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
            {paused? <Play size={14} /> : <Pause size={14} />}
          </button>
        </div>
      </div>

      <div className="flex-1 relative pt-11" style={{ height:'100vh' }}>
        <Canvas shadows camera={{ position:[0,12,-18], fov:42 }} dpr={[1,2]} gl={{ antialias:true, powerPreference:'high-performance' }}>
          <MatchScene players={players} joystickRef={joystickRef} actionRef={actionRef} scoreRef={scoreRef} pausedRef={pausedRef} onGoal={handleGoal} controlledInfoRef={controlledInfoRef} />
        </Canvas>
      </div>

      {goalDisplay&&(
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center">
          <div className="text-7xl font-black text-yellow-400 animate-pulse" style={{ textShadow:'4px 4px 0 #000, -2px -2px 0 #000' }}>GOAL!</div>
          <div className="mt-3 flex items-center gap-3 bg-black/90 backdrop-blur-md rounded-2xl px-5 py-3 border-2 border-yellow-400/60">
            <img src={getFaceUrl(goalDisplay.scorer)} alt={goalDisplay.scorer} className="w-14 h-14 rounded-full object-cover border-2 border-yellow-400" />
            <div><div className="text-white font-black text-lg leading-none">{goalDisplay.scorer}</div><div className="text-yellow-400 font-black text-xs mt-1">OVR {goalDisplay.rating}</div></div>
          </div>
        </div>
      )}

      {/* FL26 JOYSTICK - Large */}
      <div className="absolute bottom-8 left-6 z-30 joy-base" onTouchStart={(e)=>{ e.preventDefault(); handleJoyStart(e.changedTouches[0].clientX,e.changedTouches[0].clientY); }} onTouchMove={(e)=>{ e.preventDefault(); handleJoyMove(e.touches[0].clientX,e.touches[0].clientY); }} onTouchEnd={handleJoyEnd} onMouseDown={(e)=>handleJoyStart(e.clientX,e.clientY)} onMouseMove={(e)=>{ if(joyActive.current) handleJoyMove(e.clientX,e.clientY); }} onMouseUp={handleJoyEnd} onMouseLeave={handleJoyEnd}>
        <div className="relative w-[150px] h-[150px] rounded-full bg-black/30 border-2 border-white/10 backdrop-blur-sm touch-none flex items-center justify-center">
          <div className="absolute inset-3 rounded-full border border-white/5" />
          <div className="w-[64px] h-[64px] rounded-full bg-white/90 shadow-xl border border-white" style={{ transform:`translate(${joyKnob.x}px, ${joyKnob.y}px) scale(${joyActive.current?1.15:1})`, transition:joyActive.current?'none':'transform 0.15s' }} />
        </div>
      </div>

      {/* FL26 BUTTONS - Like screenshot */}
      <div className="absolute bottom-8 right-6 z-30 flex flex-col items-center gap-3">
        <button onTouchStart={(e)=>{ e.preventDefault(); doAction('shoot'); }} onMouseDown={()=>doAction('shoot')} className="w-[96px] h-[96px] rounded-full bg-gradient-to-b from-yellow-400 to-orange-500 border-4 border-white/20 text-black font-black text-sm flex flex-col items-center justify-center active:scale-90 shadow-xl">SHOOT</button>
        <div className="flex gap-3">
          <button onTouchStart={(e)=>{ e.preventDefault(); doAction('through'); }} onMouseDown={()=>doAction('through')} className="w-[82px] h-[82px] rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-bold text-[11px] flex flex-col items-center justify-center active:scale-90">THROUGH</button>
          <button onTouchStart={(e)=>{ e.preventDefault(); doAction('sprint'); }} onMouseDown={()=>doAction('sprint')} className="w-[82px] h-[82px] rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-bold text-[10px] flex flex-col items-center justify-center active:scale-90 leading-tight">SPRINT<br/><span className="text-[8px] opacity-60">SKILLS</span></button>
        </div>
        <button onTouchStart={(e)=>{ e.preventDefault(); doAction('pass'); }} onMouseDown={()=>doAction('pass')} className="w-[82px] h-[82px] rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-bold text-[11px] flex items-center justify-center active:scale-90">PASS</button>
      </div>

      {paused&&(
        <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-white text-3xl font-black">PAUSED</div>
            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full"><span className="text-white font-bold">EMMA FC {score.home} - {score.away} ARG</span><span className="text-emerald-400 font-bold text-sm">{fmt(time)}</span></div>
            <button onClick={()=>{ setPaused(false); pausedRef.current=false; }} className="px-8 py-3 bg-[#00ff88] text-black rounded-xl font-black hover:bg-emerald-400 transition">RESUME</button>
            <button onClick={onExit} className="px-6 py-2 bg-white/10 text-white/80 rounded-xl font-semibold hover:bg-white/20 transition text-sm">QUIT MATCH</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchEngine;
