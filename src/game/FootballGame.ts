import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

type AnimState = 'idle' | 'run' | 'kick' | 'tackle' | 'header' | 'celebrate';

export interface GamePlayer {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  team: 'home' | 'away';
  role: 'GK' | 'DEF' | 'MID' | 'FWD';
  stats: { speed: number; shoot: number; pass: number; def: number };
  index: number;
  number: number;
  targetPos: THREE.Vector3;
  hasBall: boolean;
  animState: AnimState;
  animTime: number;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  torso: THREE.Mesh;
  head: THREE.Mesh;
  leftShin: THREE.Group;
  rightShin: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
}

export interface Ball {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  spin: THREE.Vector3;
}

export interface MatchConfig {
  homeColors: [string, string];
  awayColors: [string, string];
  stadiumLevel: number;
  homeStats: { speed: number; shoot: number; pass: number; def: number }[];
  awayDifficulty: number;
  isP2P: boolean;
  onDataSync?: (data: GameSyncData) => void;
  onRemoteInput?: (input: RemoteInput) => void;
  onStaminaUpdate?: (stamina: number) => void;
  onRadarUpdate?: (data: RadarData) => void;
  onKickoffStart?: () => void;
}

export interface RadarData {
  ballX: number;
  ballZ: number;
  homePlayers: [number, number][];
  awayPlayers: [number, number][];
}

export interface GameSyncData {
  ballPos: [number, number, number];
  ballVel: [number, number, number];
  homePositions: [number, number, number][];
  awayPositions: [number, number, number][];
  scoreHome: number;
  scoreAway: number;
  timeLeft: number;
  possessingTeam: 'home' | 'away' | null;
}

export interface RemoteInput {
  joystickX: number;
  joystickY: number;
  pass: boolean;
  shoot: boolean;
  sprint: boolean;
}

export interface MatchResult {
  scoreHome: number;
  scoreAway: number;
  possessionHome: number;
  shotsHome: number;
  shotsAway: number;
}

type GoalCallback = (team: 'home' | 'away') => void;

const PITCH_W = 60;
const PITCH_H = 90;
const GOAL_W = 14;
const BALL_RADIUS = 0.4;

const PLAYER_NUMBERS = [1, 2, 5, 6, 3, 8, 4, 10, 7, 9, 11];

const SHARED_GEO = {
  head: new THREE.SphereGeometry(0.38, 24, 24),
  torsoUpper: new THREE.CapsuleGeometry(0.42, 0.5, 8, 16),
  hip: new THREE.CapsuleGeometry(0.38, 0.25, 8, 16),
  upperArm: new THREE.CapsuleGeometry(0.14, 0.35, 6, 12),
  foreArm: new THREE.CapsuleGeometry(0.12, 0.30, 6, 12),
  thigh: new THREE.CapsuleGeometry(0.18, 0.35, 6, 12),
  shin: new THREE.CapsuleGeometry(0.15, 0.35, 6, 12),
  boot: new THREE.BoxGeometry(0.28, 0.16, 0.48),
  hair: new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
  eye: new THREE.SphereGeometry(0.05, 12, 12),
  mouth: new THREE.TorusGeometry(0.07, 0.02, 8, 12, Math.PI),
  neck: new THREE.CylinderGeometry(0.14, 0.16, 0.2, 12),
  sock: new THREE.CapsuleGeometry(0.16, 0.2, 6, 12),
};

export class FootballGame {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private players: GamePlayer[] = [];
  private ball!: Ball;
  private animationId: number = 0;
  private clock = new THREE.Clock();
  private config: MatchConfig;
  private composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;

  private timeLeft = 90;
  private scoreHome = 0;
  private scoreAway = 0;
  private shotsHome = 0;
  private shotsAway = 0;
  private possessionFrames = 0;
  private possessionHomeFrames = 0;

  private controlledIndex = 0;
  private joystickX = 0;
  private joystickY = 0;
  private passPressed = false;
  private shootPressed = false;
  private shootHeld = false;
  private shootHoldTime = 0;
  private sprintPressed = false;

  private netShake = 0;
  private goalSide: 'home' | 'away' | null = null;
  private celebratingPlayer: GamePlayer | null = null;
  private celebrateTime = 0;

  private stamina = 100;
  private trailParticles: THREE.Mesh[] = [];
  private trailTimer = 0;
  private kickoffIntro = 0;
  private matchStarted = false;

  private onGoal: GoalCallback;
  private onMatchEnd: (result: MatchResult) => void;
  private onTimeUpdate: (time: number) => void;
  private onScoreUpdate: (home: number, away: number) => void;

  private running = false;
  private paused = false;
  private kickoffSide: 'home' | 'away' = 'home';
  private remoteInput: RemoteInput = { joystickX: 0, joystickY: 0, pass: false, shoot: false, sprint: false };

  private camTargetPos = new THREE.Vector3(0, 5, 9);
  private camLookAt = new THREE.Vector3(0, 1.2, 0);

  constructor(
    container: HTMLElement,
    config: MatchConfig,
    callbacks: {
      onGoal: GoalCallback;
      onMatchEnd: (result: MatchResult) => void;
      onTimeUpdate: (time: number) => void;
      onScoreUpdate: (home: number, away: number) => void;
    }
  ) {
    this.container = container;
    this.config = config;
    this.onGoal = callbacks.onGoal;
    this.onMatchEnd = callbacks.onMatchEnd;
    this.onTimeUpdate = callbacks.onTimeUpdate;
    this.onScoreUpdate = callbacks.onScoreUpdate;

    this.scene = new THREE.Scene();

    const skyGeo = new THREE.SphereGeometry(200, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x1a3550) },
        bottomColor: { value: new THREE.Color(0x4a7090) },
        offset: { value: 33 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }`,
      side: THREE.BackSide,
    });
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));
    this.scene.fog = new THREE.Fog(0x2a4a6a, 60, 180);

    this.camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 300);
    this.camera.position.set(0, 5, 9);
    this.camera.lookAt(0, 1.2, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.35, 0.6, 0.85
    );
    this.composer.addPass(this.bloomPass);

    this.buildStadium();
    this.buildCornerFlags();
    this.buildBall();
    this.buildPlayers();
    this.setupLights();

    this.kickoffIntro = 3.0;
    this.matchStarted = false;
    if (this.config.onKickoffStart) this.config.onKickoffStart();

    window.addEventListener('resize', this.onResize);
  }

  private setupLights() {
    const hemi = new THREE.HemisphereLight(0xb0c8e8, 0x3a5a28, 0.5);
    this.scene.add(hemi);

    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xfff5e0, 1.2);
    dir.position.set(25, 45, 20);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.left = -55;
    dir.shadow.camera.right = 55;
    dir.shadow.camera.top = 55;
    dir.shadow.camera.bottom = -55;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 120;
    dir.shadow.bias = -0.0002;
    dir.shadow.normalBias = 0.02;
    this.scene.add(dir);

    const fill = new THREE.DirectionalLight(0xc0d8ff, 0.3);
    fill.position.set(-20, 30, -15);
    this.scene.add(fill);

    if (this.config.stadiumLevel >= 2) {
      const floodColors = [0xfff4e0, 0xe0f0ff, 0xfff4e0, 0xe0f0ff];
      const positions: [number, number, number][] = [[-35, 25, -35], [35, 25, -35], [-35, 25, 35], [35, 25, 35]];
      positions.forEach((pos, i) => {
        const light = new THREE.PointLight(floodColors[i], 0.5, 120);
        light.position.set(...pos);
        this.scene.add(light);
      });
    }
  }

  private buildStadium() {
    const level = this.config.stadiumLevel;

    const grassTex = this.createGrassTexture();
    const pitchGeo = new THREE.PlaneGeometry(PITCH_W + 4, PITCH_H + 4);
    const pitchMat = new THREE.MeshStandardMaterial({ map: grassTex, color: 0xffffff, roughness: 0.85 });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.receiveShadow = true;
    this.scene.add(pitch);

    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    const makeLine = (points: [number, number, number][]) => {
      const geo = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
      return new THREE.Line(geo, lineMat);
    };

    this.scene.add(makeLine([[-PITCH_W/2, 0.02, -PITCH_H/2], [PITCH_W/2, 0.02, -PITCH_H/2], [PITCH_W/2, 0.02, PITCH_H/2], [-PITCH_W/2, 0.02, PITCH_H/2], [-PITCH_W/2, 0.02, -PITCH_H/2]]));
    this.scene.add(makeLine([[-PITCH_W/2, 0.02, 0], [PITCH_W/2, 0.02, 0]]));
    const circleGeo = new THREE.RingGeometry(7.5, 7.7, 32);
    const circleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    const circle = new THREE.Mesh(circleGeo, circleMat);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.02;
    this.scene.add(circle);

    const boxTop = makeLine([[-GOAL_W/2 - 4, 0.02, -PITCH_H/2], [-GOAL_W/2 - 4, 0.02, -PITCH_H/2 + 14], [GOAL_W/2 + 4, 0.02, -PITCH_H/2 + 14], [GOAL_W/2 + 4, 0.02, -PITCH_H/2]]);
    const boxBottom = makeLine([[-GOAL_W/2 - 4, 0.02, PITCH_H/2], [-GOAL_W/2 - 4, 0.02, PITCH_H/2 - 14], [GOAL_W/2 + 4, 0.02, PITCH_H/2 - 14], [GOAL_W/2 + 4, 0.02, PITCH_H/2]]);
    this.scene.add(boxTop);
    this.scene.add(boxBottom);

    this.buildGoal(-PITCH_H / 2, 0xff0000);
    this.buildGoal(PITCH_H / 2, 0x0066ff);
    this.buildStands(level);
  }

  private buildCornerFlags() {
    const flagMat = new THREE.MeshStandardMaterial({ color: 0xff2222, roughness: 0.6, side: THREE.DoubleSide });
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const corners: [number, number][] = [
      [-PITCH_W/2, -PITCH_H/2], [PITCH_W/2, -PITCH_H/2],
      [-PITCH_W/2, PITCH_H/2], [PITCH_W/2, PITCH_H/2],
    ];
    corners.forEach(([x, z]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6), poleMat);
      pole.position.set(x, 0.75, z);
      pole.castShadow = true;
      this.scene.add(pole);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), flagMat);
      flag.position.set(x + 0.2, 1.3, z);
      this.scene.add(flag);
    });
  }

  private buildGoal(zPos: number, postColor: number) {
    const postMat = new THREE.MeshStandardMaterial({ color: postColor, roughness: 0.3, metalness: 0.2 });
    const postRadius = 0.25;
    const postHeight = 4;

    const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 8), postMat);
    leftPost.position.set(-GOAL_W / 2, postHeight / 2, zPos);
    leftPost.castShadow = true;
    this.scene.add(leftPost);

    const rightPost = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 8), postMat);
    rightPost.position.set(GOAL_W / 2, postHeight / 2, zPos);
    rightPost.castShadow = true;
    this.scene.add(rightPost);

    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, GOAL_W, 8), postMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, postHeight, zPos);
    crossbar.castShadow = true;
    this.scene.add(crossbar);

    const netDepth = 3;
    const direction = zPos < 0 ? -1 : 1;
    const netMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide, wireframe: true });
    const netGeo = new THREE.BoxGeometry(GOAL_W, postHeight, netDepth);
    const net = new THREE.Mesh(netGeo, netMat);
    net.position.set(0, postHeight / 2, zPos - direction * netDepth / 2);
    net.name = zPos < 0 ? 'net_home' : 'net_away';
    this.scene.add(net);
  }

  private buildStands(level: number) {
    const standHeight = level === 0 ? 3 : level === 1 ? 6 : level === 2 ? 12 : 20;
    const standColor = level === 0 ? 0x3a3a2a : level === 1 ? 0x4a4a5a : level === 2 ? 0x5a6a7a : 0x6a7a8a;

    const sides: [number, number, number, number, number][] = [
      [0, -PITCH_H/2 - standHeight/2 - 2, 0, PITCH_W + 20, standHeight],
      [0, PITCH_H/2 + standHeight/2 + 2, 0, PITCH_W + 20, standHeight],
      [-PITCH_W/2 - standHeight/2 - 2, 0, Math.PI/2, PITCH_H + 20, standHeight],
      [PITCH_W/2 + standHeight/2 + 2, 0, Math.PI/2, PITCH_H + 20, standHeight],
    ];

    sides.forEach(([x, z, rotY, w, d]) => {
      const geo = new THREE.BoxGeometry(w, d, 4);
      const mat = new THREE.MeshStandardMaterial({ color: standColor, roughness: 0.8 });
      const stand = new THREE.Mesh(geo, mat);
      stand.position.set(x, d / 2, z);
      stand.rotation.y = rotY;
      stand.castShadow = true;
      stand.receiveShadow = true;
      this.scene.add(stand);

      if (level >= 1) {
        const crowdCount = level === 1 ? 20 : level === 2 ? 40 : 60;
        for (let i = 0; i < crowdCount; i++) {
          const dot = new THREE.Mesh(new THREE.SphereGeometry(0.3, 4, 4), new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff }));
          dot.position.set(x + (Math.random() - 0.5) * w * 0.8, d + 0.3, z + (Math.random() - 0.5) * 4);
          this.scene.add(dot);
        }
      }
    });

    if (level >= 2) {
      const towerPositions: [number, number][] = [[-PITCH_W/2 - 5, -PITCH_H/2 - 5], [PITCH_W/2 + 5, -PITCH_H/2 - 5], [-PITCH_W/2 - 5, PITCH_H/2 + 5], [PITCH_W/2 + 5, PITCH_H/2 + 5]];
      towerPositions.forEach(([x, z]) => {
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, standHeight + 10, 6), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 }));
        tower.position.set(x, (standHeight + 10) / 2, z);
        tower.castShadow = true;
        this.scene.add(tower);
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 1), new THREE.MeshBasicMaterial({ color: 0xffffee }));
        lamp.position.set(x, standHeight + 10, z);
        this.scene.add(lamp);
      });
    }
  }

  private buildBall() {
    const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const ballTex = this.createBallTexture();
    const ballMat = new THREE.MeshStandardMaterial({ map: ballTex, color: 0xffffff, roughness: 0.3, metalness: 0.05 });
    const mesh = new THREE.Mesh(ballGeo, ballMat);
    mesh.castShadow = true;
    mesh.position.set(0, BALL_RADIUS, 0);
    this.scene.add(mesh);

    this.ball = { mesh, pos: new THREE.Vector3(0, BALL_RADIUS, 0), vel: new THREE.Vector3(0, 0, 0), spin: new THREE.Vector3(0, 0, 0) };
  }

  private createJerseyTexture(colors: [string, string], number: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = colors[1];
    ctx.fillRect(0, 0, 256, 18);
    ctx.fillRect(0, 238, 256, 18);

    const stripeColor = colors[0] === '#ffffff' || colors[0] === '#fff' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)';
    ctx.strokeStyle = stripeColor;
    ctx.lineWidth = 1.5;
    for (let x = 0; x < 256; x += 10) {
      ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x, 238); ctx.stroke();
    }

    ctx.fillStyle = colors[0] === '#ffffff' || colors[0] === '#fff' ? '#000000' : '#ffffff';
    ctx.font = 'bold 56px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(number), 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private createBallTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#1a1a1a';
    const drawPent = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill();
    };

    const spots: [number, number][] = [[60, 60], [196, 60], [128, 128], [60, 196], [196, 196], [128, 24], [24, 128], [232, 128], [128, 232]];
    spots.forEach(([x, y]) => drawPent(x, y, 20));

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private createGrassTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0a4d1a';
    ctx.fillRect(0, 0, 512, 512);

    const stripeH = 512 / 8;
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#0d5c1f' : '#0a4d1a';
      ctx.fillRect(0, i * stripeH, 512, stripeH);
    }

    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(20,80,30,0.25)' : 'rgba(5,40,15,0.25)';
      ctx.fillRect(x, y, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1.5);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private createPlayerMesh(team: 'home' | 'away', colors: [string, string], number: number): { group: THREE.Group; parts: Pick<GamePlayer, 'leftLeg' | 'rightLeg' | 'leftArm' | 'rightArm' | 'torso' | 'head' | 'leftShin' | 'rightShin' | 'leftForearm' | 'rightForearm'> } {
    const group = new THREE.Group();
    const jerseyColor = new THREE.Color(colors[0]);
    const shortsColor = new THREE.Color(colors[1]);
    const skinColor = new THREE.Color(0x8d5524);
    const bootColor = 0x1a1a1a;
    const hairColor = 0x1a0e04;

    const jerseyTex = this.createJerseyTexture(colors, number);
    const jerseyMat = new THREE.MeshStandardMaterial({
      map: jerseyTex, color: 0xffffff, roughness: 0.55, metalness: 0.1, envMapIntensity: 0.6,
    });
    const shortsMat = new THREE.MeshStandardMaterial({
      color: shortsColor, roughness: 0.6, metalness: 0.08, envMapIntensity: 0.5,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: skinColor, roughness: 0.45, metalness: 0.0, envMapIntensity: 0.4,
      emissive: new THREE.Color(0x2a1500), emissiveIntensity: 0.08,
    });
    const bootMat = new THREE.MeshStandardMaterial({
      color: bootColor, roughness: 0.3, metalness: 0.15, envMapIntensity: 0.5,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: hairColor, roughness: 0.85, metalness: 0.0,
    });

    const neck = new THREE.Mesh(SHARED_GEO.neck, skinMat);
    neck.position.y = 2.35; neck.castShadow = true; group.add(neck);

    const torso = new THREE.Mesh(SHARED_GEO.torsoUpper, jerseyMat);
    torso.position.y = 1.92; torso.castShadow = true; torso.receiveShadow = true; group.add(torso);

    const hip = new THREE.Mesh(SHARED_GEO.hip, shortsMat);
    hip.position.y = 1.35; hip.castShadow = true; group.add(hip);

    const numCanvas = document.createElement('canvas');
    numCanvas.width = 128; numCanvas.height = 128;
    const nctx = numCanvas.getContext('2d')!;
    nctx.fillStyle = colors[1]; nctx.fillRect(0, 0, 128, 128);
    nctx.fillStyle = colors[0] === '#ffffff' || colors[0] === '#fff' ? '#000000' : '#ffffff';
    nctx.font = 'bold 80px Arial'; nctx.textAlign = 'center'; nctx.textBaseline = 'middle';
    nctx.fillText(String(number), 64, 68);
    const numTex = new THREE.CanvasTexture(numCanvas);
    const numPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), new THREE.MeshBasicMaterial({ map: numTex, transparent: true }));
    numPlane.position.set(0, 2.0, -0.42); numPlane.rotation.y = Math.PI; group.add(numPlane);

    const head = new THREE.Mesh(SHARED_GEO.head, skinMat);
    head.position.y = 2.65; head.castShadow = true; group.add(head);

    const hair = new THREE.Mesh(SHARED_GEO.hair, hairMat);
    hair.position.y = 2.68; hair.castShadow = true; group.add(hair);

    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.3 });
    const leftEye = new THREE.Mesh(SHARED_GEO.eye, eyeMat);
    leftEye.position.set(-0.13, 2.68, 0.33); group.add(leftEye);
    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), pupilMat);
    leftPupil.position.set(-0.13, 2.68, 0.36); group.add(leftPupil);

    const rightEye = new THREE.Mesh(SHARED_GEO.eye, eyeMat);
    rightEye.position.set(0.13, 2.68, 0.33); group.add(rightEye);
    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), pupilMat);
    rightPupil.position.set(0.13, 2.68, 0.36); group.add(rightPupil);

    const mouth = new THREE.Mesh(SHARED_GEO.mouth, new THREE.MeshStandardMaterial({ color: 0x5a2a10, roughness: 0.6 }));
    mouth.position.set(0, 2.52, 0.35); mouth.rotation.z = Math.PI; group.add(mouth);

    const armMat = jerseyMat;

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.5, 2.15, 0);
    const leftUpperArm = new THREE.Mesh(SHARED_GEO.upperArm, armMat);
    leftUpperArm.position.y = -0.22; leftUpperArm.castShadow = true; leftArm.add(leftUpperArm);

    const leftForearm = new THREE.Group();
    leftForearm.position.y = -0.5;
    const leftForearmMesh = new THREE.Mesh(SHARED_GEO.foreArm, skinMat);
    leftForearmMesh.position.y = -0.2; leftForearmMesh.castShadow = true; leftForearm.add(leftForearmMesh);
    leftArm.add(leftForearm); group.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.5, 2.15, 0);
    const rightUpperArm = new THREE.Mesh(SHARED_GEO.upperArm, armMat);
    rightUpperArm.position.y = -0.22; rightUpperArm.castShadow = true; rightArm.add(rightUpperArm);

    const rightForearm = new THREE.Group();
    rightForearm.position.y = -0.5;
    const rightForearmMesh = new THREE.Mesh(SHARED_GEO.foreArm, skinMat);
    rightForearmMesh.position.y = -0.2; rightForearmMesh.castShadow = true; rightForearm.add(rightForearmMesh);
    rightArm.add(rightForearm); group.add(rightArm);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.22, 1.2, 0);
    const leftThigh = new THREE.Mesh(SHARED_GEO.thigh, shortsMat);
    leftThigh.position.y = -0.22; leftThigh.castShadow = true; leftLeg.add(leftThigh);

    const leftShin = new THREE.Group();
    leftShin.position.y = -0.48;
    const leftShinMesh = new THREE.Mesh(SHARED_GEO.shin, skinMat);
    leftShinMesh.position.y = -0.22; leftShinMesh.castShadow = true; leftShin.add(leftShinMesh);
    const leftSock = new THREE.Mesh(SHARED_GEO.sock, shortsMat);
    leftSock.position.y = -0.18; leftSock.castShadow = true; leftShin.add(leftSock);
    const leftBoot = new THREE.Mesh(SHARED_GEO.boot, bootMat);
    leftBoot.position.set(0, -0.42, 0.08); leftBoot.castShadow = true; leftShin.add(leftBoot);
    leftLeg.add(leftShin); group.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.22, 1.2, 0);
    const rightThigh = new THREE.Mesh(SHARED_GEO.thigh, shortsMat);
    rightThigh.position.y = -0.22; rightThigh.castShadow = true; rightLeg.add(rightThigh);

    const rightShin = new THREE.Group();
    rightShin.position.y = -0.48;
    const rightShinMesh = new THREE.Mesh(SHARED_GEO.shin, skinMat);
    rightShinMesh.position.y = -0.22; rightShinMesh.castShadow = true; rightShin.add(rightShinMesh);
    const rightSock = new THREE.Mesh(SHARED_GEO.sock, shortsMat);
    rightSock.position.y = -0.18; rightSock.castShadow = true; rightShin.add(rightSock);
    const rightBoot = new THREE.Mesh(SHARED_GEO.boot, bootMat);
    rightBoot.position.set(0, -0.42, 0.08); rightBoot.castShadow = true; rightShin.add(rightBoot);
    rightLeg.add(rightShin); group.add(rightLeg);

    const ringGeo = new THREE.RingGeometry(0.9, 1.1, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: team === 'home' ? 0x00ff44 : 0xff4444, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; ring.name = 'directionIndicator'; group.add(ring);

    return { group, parts: { leftLeg, rightLeg, leftArm, rightArm, torso, head, leftShin, rightShin, leftForearm, rightForearm } };
  }

  private buildPlayers() {
    const formation: { x: number; z: number; role: 'GK' | 'DEF' | 'MID' | 'FWD' }[] = [
      { x: 0, z: -PITCH_H/2 + 5, role: 'GK' },
      { x: -20, z: -PITCH_H/2 + 18, role: 'DEF' },
      { x: -7, z: -PITCH_H/2 + 15, role: 'DEF' },
      { x: 7, z: -PITCH_H/2 + 15, role: 'DEF' },
      { x: 20, z: -PITCH_H/2 + 18, role: 'DEF' },
      { x: -12, z: -8, role: 'MID' },
      { x: 0, z: -5, role: 'MID' },
      { x: 12, z: -8, role: 'MID' },
      { x: -15, z: 10, role: 'FWD' },
      { x: 0, z: 15, role: 'FWD' },
      { x: 15, z: 10, role: 'FWD' },
    ];

    const homeStats = this.config.homeStats;
    const aiBaseStat = 50 + this.config.awayDifficulty * 30;
    const gkColors: [string, string] = ['#ffcc00', '#000000'];

    formation.forEach((f, i) => {
      const num = PLAYER_NUMBERS[i] ?? i + 1;
      const homeColors = f.role === 'GK' ? gkColors : this.config.homeColors;
      const homeBuilt = this.createPlayerMesh('home', homeColors, num);
      homeBuilt.group.position.set(f.x, 0, f.z);
      this.scene.add(homeBuilt.group);

      this.players.push({
        mesh: homeBuilt.group, pos: new THREE.Vector3(f.x, 0, f.z), vel: new THREE.Vector3(0, 0, 0),
        team: 'home', role: f.role, stats: homeStats[i] || { speed: 70, shoot: 70, pass: 70, def: 70 },
        index: i, number: num, targetPos: new THREE.Vector3(f.x, 0, f.z), hasBall: false,
        animState: 'idle', animTime: 0, ...homeBuilt.parts,
      });

      const awayColors: [string, string] = f.role === 'GK' ? ['#0066ff', '#ffffff'] : this.config.awayColors;
      const awayBuilt = this.createPlayerMesh('away', awayColors, num);
      awayBuilt.group.position.set(-f.x, 0, -f.z);
      this.scene.add(awayBuilt.group);

      this.players.push({
        mesh: awayBuilt.group, pos: new THREE.Vector3(-f.x, 0, -f.z), vel: new THREE.Vector3(0, 0, 0),
        team: 'away', role: f.role, stats: { speed: aiBaseStat, shoot: aiBaseStat, pass: aiBaseStat, def: aiBaseStat },
        index: i, number: num, targetPos: new THREE.Vector3(-f.x, 0, -f.z), hasBall: false,
        animState: 'idle', animTime: 0, ...awayBuilt.parts,
      });
    });

    this.controlledIndex = this.findNearestToBall('home');
  }

  private findNearestToBall(team: 'home' | 'away'): number {
    let nearest = -1;
    let minDist = Infinity;
    this.players.forEach((p, i) => {
      if (p.team !== team || p.role === 'GK') return;
      const d = p.pos.distanceTo(this.ball.pos);
      if (d < minDist) { minDist = d; nearest = i; }
    });
    return nearest;
  }

  private animatePlayer(p: GamePlayer, dt: number) {
    p.animTime += dt;
    const t = p.animTime;
    const lerp = THREE.MathUtils.lerp;

    switch (p.animState) {
      case 'idle': {
        const breath = Math.sin(t * 2) * 0.02;
        p.torso.position.y = 1.92 + breath;
        p.head.position.y = 2.65 + breath;
        p.leftArm.rotation.x = lerp(p.leftArm.rotation.x, 0.05, 0.1);
        p.rightArm.rotation.x = lerp(p.rightArm.rotation.x, 0.05, 0.1);
        p.leftArm.rotation.z = lerp(p.leftArm.rotation.z, 0.08, 0.1);
        p.rightArm.rotation.z = lerp(p.rightArm.rotation.z, -0.08, 0.1);
        p.leftLeg.rotation.x = lerp(p.leftLeg.rotation.x, 0, 0.1);
        p.rightLeg.rotation.x = lerp(p.rightLeg.rotation.x, 0, 0.1);
        p.leftShin.rotation.x = lerp(p.leftShin.rotation.x, 0, 0.1);
        p.rightShin.rotation.x = lerp(p.rightShin.rotation.x, 0, 0.1);
        p.leftForearm.rotation.x = lerp(p.leftForearm.rotation.x, 0.1, 0.1);
        p.rightForearm.rotation.x = lerp(p.rightForearm.rotation.x, 0.1, 0.1);
        p.mesh.position.y = 0;
        break;
      }
      case 'run': {
        const speed = 10;
        const swing = Math.sin(t * speed);
        p.leftLeg.rotation.x = swing * 0.65;
        p.rightLeg.rotation.x = -swing * 0.65;
        p.leftShin.rotation.x = Math.max(0, -swing) * 0.9;
        p.rightShin.rotation.x = Math.max(0, swing) * 0.9;
        p.leftArm.rotation.x = -swing * 0.55;
        p.rightArm.rotation.x = swing * 0.55;
        p.leftForearm.rotation.x = 0.3 + Math.max(0, swing) * 0.4;
        p.rightForearm.rotation.x = 0.3 + Math.max(0, -swing) * 0.4;
        const bob = Math.abs(Math.sin(t * speed)) * 0.06;
        p.mesh.position.y = bob;
        p.torso.position.y = 1.92;
        p.head.position.y = 2.65;
        p.torso.rotation.x = lerp(p.torso.rotation.x, 0.08, 0.1);
        break;
      }
      case 'kick': {
        const kickT = Math.min(t / 0.35, 1);
        let kickCurve: number;
        if (kickT < 0.3) { kickCurve = (kickT / 0.3) * -0.5; }
        else if (kickT < 0.55) { kickCurve = -0.5 + ((kickT - 0.3) / 0.25) * 2.0; }
        else { kickCurve = 1.5 - ((kickT - 0.55) / 0.45) * 1.5; }
        p.rightLeg.rotation.x = -kickCurve;
        p.rightShin.rotation.x = Math.max(0, kickCurve * 0.5);
        p.leftLeg.rotation.x = kickCurve * 0.15;
        p.leftShin.rotation.x = 0;
        p.leftArm.rotation.x = kickCurve * 0.4;
        p.rightArm.rotation.x = -kickCurve * 0.25;
        p.leftForearm.rotation.x = 0.3 + kickCurve * 0.2;
        p.rightForearm.rotation.x = 0.3;
        p.mesh.position.y = 0;
        p.torso.rotation.x = lerp(p.torso.rotation.x, kickCurve * 0.1, 0.3);
        if (kickT >= 1) { p.animState = 'idle'; p.animTime = 0; p.torso.rotation.x = 0; }
        break;
      }
      case 'tackle': {
        const slideT = Math.min(t / 0.6, 1);
        p.mesh.position.y = -0.3 * slideT;
        p.leftLeg.rotation.x = slideT * 1.1;
        p.rightLeg.rotation.x = slideT * 0.9;
        p.leftShin.rotation.x = slideT * 0.3;
        p.rightShin.rotation.x = slideT * 0.3;
        p.leftArm.rotation.x = -slideT * 0.7;
        p.rightArm.rotation.x = -slideT * 0.7;
        p.leftForearm.rotation.x = 0.5 + slideT * 0.3;
        p.rightForearm.rotation.x = 0.5 + slideT * 0.3;
        p.torso.rotation.x = lerp(p.torso.rotation.x, slideT * 0.3, 0.2);
        if (slideT >= 1) { p.animState = 'idle'; p.animTime = 0; p.mesh.position.y = 0; p.torso.rotation.x = 0; }
        break;
      }
      case 'header': {
        const jumpT = Math.min(t / 0.5, 1);
        const jumpHeight = jumpT < 0.5 ? jumpT * 2 : (1 - jumpT) * 2;
        p.mesh.position.y = jumpHeight * 0.7;
        p.leftArm.rotation.x = -jumpHeight * 1.0;
        p.rightArm.rotation.x = -jumpHeight * 1.0;
        p.leftForearm.rotation.x = 0.3;
        p.rightForearm.rotation.x = 0.3;
        p.leftLeg.rotation.x = jumpHeight * 0.35;
        p.rightLeg.rotation.x = jumpHeight * 0.35;
        p.leftShin.rotation.x = jumpHeight * 0.6;
        p.rightShin.rotation.x = jumpHeight * 0.6;
        p.head.rotation.x = jumpHeight * 0.2;
        if (jumpT >= 1) { p.animState = 'idle'; p.animTime = 0; p.mesh.position.y = 0; p.head.rotation.x = 0; }
        break;
      }
      case 'celebrate': {
        const celebT = t;
        p.leftArm.rotation.x = -2.2 + Math.sin(celebT * 8) * 0.15;
        p.rightArm.rotation.x = -2.2 - Math.sin(celebT * 8) * 0.15;
        p.leftArm.rotation.z = 0.25 + Math.sin(celebT * 6) * 0.1;
        p.rightArm.rotation.z = -0.25 - Math.sin(celebT * 6) * 0.1;
        p.leftForearm.rotation.x = 0.5 + Math.sin(celebT * 10) * 0.2;
        p.rightForearm.rotation.x = 0.5 + Math.sin(celebT * 10 + 1) * 0.2;
        p.mesh.position.y = Math.abs(Math.sin(celebT * 6)) * 0.2;
        p.leftLeg.rotation.x = 0; p.rightLeg.rotation.x = 0;
        p.leftShin.rotation.x = 0; p.rightShin.rotation.x = 0;
        p.head.rotation.z = Math.sin(celebT * 4) * 0.1;
        p.torso.rotation.x = 0;
        break;
      }
    }
  }

  private setAnimState(p: GamePlayer, state: AnimState) {
    if (p.animState === 'celebrate') return;
    if (state === 'kick' || state === 'tackle' || state === 'header') {
      p.animState = state; p.animTime = 0;
    } else if (p.animState !== 'kick' && p.animState !== 'tackle' && p.animState !== 'header') {
      p.animState = state;
      if (state === 'idle') p.animTime = 0;
    }
  }

  private updateBall(dt: number) {
    this.ball.vel.y -= 20 * dt;
    this.ball.vel.x *= Math.pow(0.96, dt * 60);
    this.ball.vel.z *= Math.pow(0.96, dt * 60);
    this.ball.pos.add(this.ball.vel.clone().multiplyScalar(dt));

    if (this.ball.pos.y < BALL_RADIUS) {
      this.ball.pos.y = BALL_RADIUS;
      if (this.ball.vel.y < 0) { this.ball.vel.y = -this.ball.vel.y * 0.5; if (Math.abs(this.ball.vel.y) < 1) this.ball.vel.y = 0; }
    }
    if (Math.abs(this.ball.pos.x) > PITCH_W / 2) { this.ball.pos.x = Math.sign(this.ball.pos.x) * PITCH_W / 2; this.ball.vel.x = -this.ball.vel.x * 0.4; }

    const inGoalArea = Math.abs(this.ball.pos.x) < GOAL_W / 2;
    if (this.ball.pos.z < -PITCH_H / 2 - 1 && inGoalArea && this.ball.pos.y < 4) { this.scoreGoal('away'); }
    else if (this.ball.pos.z > PITCH_H / 2 + 1 && inGoalArea && this.ball.pos.y < 4) { this.scoreGoal('home'); }
    else if (this.ball.pos.z < -PITCH_H / 2) { this.ball.pos.z = -PITCH_H / 2; this.ball.vel.z = -this.ball.vel.z * 0.3; }
    else if (this.ball.pos.z > PITCH_H / 2) { this.ball.pos.z = PITCH_H / 2; this.ball.vel.z = -this.ball.vel.z * 0.3; }

    if (this.netShake > 0) this.netShake -= dt * 3;
    if (this.netShake < 0) this.netShake = 0;

    this.ball.mesh.position.copy(this.ball.pos);
    this.ball.mesh.rotation.x += this.ball.vel.z * dt * 2;
    this.ball.mesh.rotation.z -= this.ball.vel.x * dt * 2;

    if (this.netShake > 0 && this.goalSide) {
      const netName = this.goalSide === 'home' ? 'net_home' : 'net_away';
      const net = this.scene.getObjectByName(netName);
      if (net) { net.position.x = (Math.random() - 0.5) * this.netShake * 0.5; net.position.y = 2 + (Math.random() - 0.5) * this.netShake * 0.3; }
    }
  }

  private scoreGoal(team: 'home' | 'away') {
    if (team === 'home') {
      this.scoreHome++; this.goalSide = 'away';
      const net = this.scene.getObjectByName('net_away');
      if (net) net.position.set(0, 2, PITCH_H / 2 + 1.5);
    } else {
      this.scoreAway++; this.goalSide = 'home';
      const net = this.scene.getObjectByName('net_home');
      if (net) net.position.set(0, 2, -PITCH_H / 2 - 1.5);
    }
    this.netShake = 1.5;
    this.onScoreUpdate(this.scoreHome, this.scoreAway);
    this.onGoal(team);

    const scorer = this.findNearestToBall(team);
    if (scorer >= 0) {
      this.celebratingPlayer = this.players[scorer];
      this.celebratingPlayer.animState = 'celebrate';
      this.celebratingPlayer.animTime = 0;
      this.celebrateTime = 3;
    }

    this.resetKickoff(team === 'home' ? 'away' : 'home');
  }

  private resetKickoff(scoringTeam: 'home' | 'away') {
    this.kickoffSide = scoringTeam;
    const formation = [
      { x: 0, z: -PITCH_H/2 + 5 }, { x: -20, z: -PITCH_H/2 + 18 }, { x: -7, z: -PITCH_H/2 + 15 },
      { x: 7, z: -PITCH_H/2 + 15 }, { x: 20, z: -PITCH_H/2 + 18 }, { x: -12, z: -8 },
      { x: 0, z: -5 }, { x: 12, z: -8 }, { x: -15, z: 10 }, { x: 0, z: 15 }, { x: 15, z: 10 },
    ];
    this.players.forEach((p) => {
      const f = formation[p.index];
      if (p.team === 'home') { p.pos.set(f.x, 0, f.z); p.mesh.position.copy(p.pos); }
      else { p.pos.set(-f.x, 0, -f.z); p.mesh.position.copy(p.pos); }
      p.vel.set(0, 0, 0);
      if (p.animState !== 'celebrate') { p.animState = 'idle'; p.animTime = 0; }
    });
    this.ball.pos.set(0, BALL_RADIUS, 0);
    this.ball.vel.set(0, 0, 0);
    this.ball.mesh.position.copy(this.ball.pos);
  }

  private getControllingPlayer(): GamePlayer { return this.players[this.controlledIndex]; }

  private updatePlayerMovement(dt: number) {
    const input = this.config.isP2P ? this.remoteInput : { joystickX: this.joystickX, joystickY: this.joystickY, pass: this.passPressed, shoot: this.shootPressed, sprint: this.sprintPressed };

    if (this.ball.vel.length() > 3 || !this.players[this.controlledIndex]) {
      const newIdx = this.findNearestToBall('home');
      if (newIdx >= 0 && newIdx !== this.controlledIndex) this.controlledIndex = newIdx;
    }

    const controlled = this.getControllingPlayer();
    if (controlled && controlled.team === 'home') {
      const speedMul = (input.sprint ? 1.4 : 1.0) * (0.5 + controlled.stats.speed / 100);
      const moveSpeed = 12 * speedMul;
      const dir = new THREE.Vector3(input.joystickX, 0, -input.joystickY);

      if (dir.length() > 0.1) {
        dir.normalize();
        controlled.vel.x = dir.x * moveSpeed;
        controlled.vel.z = dir.z * moveSpeed;
        controlled.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        if (controlled.animState !== 'kick' && controlled.animState !== 'tackle' && controlled.animState !== 'header' && controlled.animState !== 'celebrate') {
          this.setAnimState(controlled, 'run');
        }
      } else {
        controlled.vel.x *= 0.7; controlled.vel.z *= 0.7;
        if (controlled.animState !== 'kick' && controlled.animState !== 'tackle' && controlled.animState !== 'header' && controlled.animState !== 'celebrate') {
          this.setAnimState(controlled, 'idle');
        }
      }

      if (input.pass) { this.doPass(controlled); this.passPressed = false; }
      if (input.shoot) { this.shootHeld = true; this.shootHoldTime += dt; }
      else if (this.shootHeld) { this.doShoot(controlled, this.shootHoldTime); this.shootHeld = false; this.shootHoldTime = 0; this.shootPressed = false; }
    }

    this.players.forEach((p, i) => { if (p.team !== 'home' || i === this.controlledIndex) return; this.updateAI(p, dt, 'home'); });
    this.players.forEach((p) => { if (p.team !== 'away') return; this.updateAI(p, dt, 'away'); });

    this.players.forEach((p) => {
      p.pos.add(p.vel.clone().multiplyScalar(dt));
      p.pos.x = THREE.MathUtils.clamp(p.pos.x, -PITCH_W/2, PITCH_W/2);
      p.pos.z = THREE.MathUtils.clamp(p.pos.z, -PITCH_H/2, PITCH_H/2);
      p.mesh.position.x = p.pos.x; p.mesh.position.z = p.pos.z;
    });

    this.updatePossession();
  }

  private updateAI(player: GamePlayer, dt: number, team: 'home' | 'away') {
    const difficulty = team === 'away' ? this.config.awayDifficulty : 0.5;
    const ballPos = this.ball.pos;
    const ownGoalZ = team === 'home' ? -PITCH_H / 2 : PITCH_H / 2;
    const oppGoalZ = team === 'home' ? PITCH_H / 2 : -PITCH_H / 2;
    const isNearest = this.findNearestToBall(team) === this.players.indexOf(player);

    if (player.role === 'GK') {
      const targetX = THREE.MathUtils.clamp(ballPos.x * 0.5, -GOAL_W/2, GOAL_W/2);
      const targetZ = ownGoalZ + (team === 'home' ? 4 : -4);
      const distToOwnGoal = Math.abs(ballPos.z - ownGoalZ);
      const rushOut = distToOwnGoal < 12 ? 1.5 : 1.0;
      this.moveTowards(player, new THREE.Vector3(targetX, 0, targetZ), dt, 0.6 * rushOut);
      if (player.pos.distanceTo(ballPos) < 2.5 && this.ball.vel.length() < 15) {
        const clearDir = new THREE.Vector3((Math.random() - 0.5) * 0.6, 0, team === 'home' ? 1 : -1).normalize();
        this.ball.vel.copy(clearDir.multiplyScalar(22)); this.ball.vel.y = 4;
        this.setAnimState(player, 'kick');
      }
      if (player.vel.length() > 1) this.setAnimState(player, 'run'); else this.setAnimState(player, 'idle');
      return;
    }

    if (isNearest) {
      const distToBall = player.pos.distanceTo(ballPos);
      if (distToBall < 2) {
        const goalDir = new THREE.Vector3(0, 0, oppGoalZ).sub(player.pos).normalize();
        this.moveTowards(player, player.pos.clone().add(goalDir.multiplyScalar(5)), dt, 1.0);
        const distToGoal = Math.abs(player.pos.z - oppGoalZ);
        if (distToGoal < 22 && Math.random() < 0.025 * difficulty) { this.doAIShoot(player, team); }
        if (Math.random() < 0.015 * difficulty) { this.doAIPass(player, team); }
      } else { this.moveTowards(player, ballPos, dt, 0.9); }
      this.setAnimState(player, 'run');
    } else {
      const opponents = this.players.filter(p => p.team !== team && p.role !== 'GK');
      let nearestOpp: GamePlayer | null = null; let oppDist = Infinity;
      for (const opp of opponents) { const d = player.pos.distanceTo(opp.pos); if (d < oppDist) { oppDist = d; nearestOpp = opp; } }
      const formationPos = this.getFormationPos(player, team);
      let target = formationPos;
      if (nearestOpp && oppDist < 8) { target = formationPos.clone().lerp(nearestOpp.pos, 0.3); }
      else { target = formationPos.clone().lerp(ballPos, 0.09); }
      this.moveTowards(player, target, dt, 0.5);
      if (player.vel.length() > 1) this.setAnimState(player, 'run'); else this.setAnimState(player, 'idle');
    }
  }

  private getFormationPos(player: GamePlayer, team: 'home' | 'away'): THREE.Vector3 {
    const formation = [
      { x: 0, z: -PITCH_H/2 + 5 }, { x: -20, z: -PITCH_H/2 + 18 }, { x: -7, z: -PITCH_H/2 + 15 },
      { x: 7, z: -PITCH_H/2 + 15 }, { x: 20, z: -PITCH_H/2 + 18 }, { x: -12, z: -8 },
      { x: 0, z: -5 }, { x: 12, z: -8 }, { x: -15, z: 10 }, { x: 0, z: 15 }, { x: 15, z: 10 },
    ];
    const f = formation[player.index];
    if (team === 'home') return new THREE.Vector3(f.x, 0, f.z);
    return new THREE.Vector3(-f.x, 0, -f.z);
  }

  private moveTowards(player: GamePlayer, target: THREE.Vector3, dt: number, speedMul: number) {
    const dir = target.clone().sub(player.pos); dir.y = 0; const dist = dir.length();
    if (dist > 0.5) {
      dir.normalize();
      const speed = 10 * speedMul * (0.5 + player.stats.speed / 100);
      player.vel.x = dir.x * speed; player.vel.z = dir.z * speed;
      player.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    } else { player.vel.x *= 0.5; player.vel.z *= 0.5; }
  }

  private updatePossession() {
    this.possessionFrames++;
    const homeDist = this.players.filter(p => p.team === 'home').reduce((min, p) => Math.min(min, p.pos.distanceTo(this.ball.pos)), Infinity);
    const awayDist = this.players.filter(p => p.team === 'away').reduce((min, p) => Math.min(min, p.pos.distanceTo(this.ball.pos)), Infinity);
    const possessionThreshold = 2;
    if (homeDist < possessionThreshold && homeDist < awayDist) {
      this.possessionHomeFrames++;
      const nearest = this.players.filter(p => p.team === 'home').reduce((closest, p) => {
        const d = p.pos.distanceTo(this.ball.pos);
        return d < closest.dist ? { player: p, dist: d } : closest;
      }, { player: null as GamePlayer | null, dist: Infinity });
      if (nearest.player && nearest.dist < 1.5) {
        const forward = new THREE.Vector3(Math.sin(nearest.player.mesh.rotation.y), 0, Math.cos(nearest.player.mesh.rotation.y));
        this.ball.pos.copy(nearest.player.pos).add(forward.multiplyScalar(1.2));
        this.ball.pos.y = BALL_RADIUS;
        this.ball.vel.copy(nearest.player.vel).multiplyScalar(0.5);
      }
    } else if (awayDist < possessionThreshold) {
      const nearest = this.players.filter(p => p.team === 'away').reduce((closest, p) => {
        const d = p.pos.distanceTo(this.ball.pos);
        return d < closest.dist ? { player: p, dist: d } : closest;
      }, { player: null as GamePlayer | null, dist: Infinity });
      if (nearest.player && nearest.dist < 1.5) {
        const forward = new THREE.Vector3(Math.sin(nearest.player.mesh.rotation.y), 0, Math.cos(nearest.player.mesh.rotation.y));
        this.ball.pos.copy(nearest.player.pos).add(forward.multiplyScalar(1.2));
        this.ball.pos.y = BALL_RADIUS;
        this.ball.vel.copy(nearest.player.vel).multiplyScalar(0.5);
      }
    }
  }

  private doPass(player: GamePlayer) {
    const distToBall = player.pos.distanceTo(this.ball.pos);
    if (distToBall > 2.5) return;
    this.setAnimState(player, 'kick');
    const teammates = this.players.filter(p => p.team === player.team && p !== player);
    const forward = new THREE.Vector3(Math.sin(player.mesh.rotation.y), 0, Math.cos(player.mesh.rotation.y));
    let bestTarget: GamePlayer | null = null; let bestScore = -Infinity;
    for (const t of teammates) {
      const toTeammate = t.pos.clone().sub(player.pos);
      const dot = toTeammate.normalize().dot(forward);
      if (dot > 0.2) { const score = dot * 10 - toTeammate.length() * 0.1; if (score > bestScore) { bestScore = score; bestTarget = t; } }
    }
    let passDir: THREE.Vector3;
    if (bestTarget !== null) { passDir = bestTarget.pos.clone().sub(this.ball.pos); }
    else { passDir = forward.clone(); }
    passDir.y = 0; passDir.normalize();
    const passPower = 15 + player.stats.pass * 0.15;
    this.ball.vel.copy(passDir.multiplyScalar(passPower));
    this.ball.vel.y = 2;
    if (player.team === 'home') this.shotsHome++;
  }

  private doShoot(player: GamePlayer, holdTime: number) {
    const distToBall = player.pos.distanceTo(this.ball.pos);
    if (distToBall > 2.5) return;
    this.setAnimState(player, 'kick');
    const oppGoalZ = player.team === 'home' ? PITCH_H / 2 : -PITCH_H / 2;
    const goalPos = new THREE.Vector3(THREE.MathUtils.clamp(this.ball.pos.x * 0.3, -GOAL_W/2 + 1, GOAL_W/2 - 1), 0, oppGoalZ);
    const shootDir = goalPos.sub(this.ball.pos); shootDir.y = 0; shootDir.normalize();
    const power = 18 + Math.min(holdTime, 1.5) * 20 + player.stats.shoot * 0.15;
    this.ball.vel.copy(shootDir.multiplyScalar(power));
    this.ball.vel.y = 3 + Math.min(holdTime, 1.5) * 3;
    if (player.team === 'home') this.shotsHome++; else this.shotsAway++;
  }

  private doAIShoot(player: GamePlayer, team: 'home' | 'away') {
    const oppGoalZ = team === 'home' ? PITCH_H / 2 : -PITCH_H / 2;
    const goalPos = new THREE.Vector3((Math.random() - 0.5) * GOAL_W, 0, oppGoalZ);
    const shootDir = goalPos.sub(this.ball.pos); shootDir.y = 0; shootDir.normalize();
    const power = 20 + player.stats.shoot * 0.15;
    this.ball.vel.copy(shootDir.multiplyScalar(power)); this.ball.vel.y = 3;
    this.setAnimState(player, 'kick');
    if (team === 'away') this.shotsAway++;
  }

  private doAIPass(player: GamePlayer, team: 'home' | 'away') {
    const teammates = this.players.filter(p => p.team === team && p !== player && p.role !== 'GK');
    if (teammates.length === 0) return;
    const forward = new THREE.Vector3(Math.sin(player.mesh.rotation.y), 0, Math.cos(player.mesh.rotation.y));
    let best: GamePlayer | null = null; let bestScore = -Infinity;
    for (const t of teammates) {
      const toT = t.pos.clone().sub(player.pos);
      const dist = toT.length();
      const dot = toT.clone().normalize().dot(forward);
      const markedDist = this.players.filter(p => p.team !== team).reduce((min, opp) => Math.min(min, opp.pos.distanceTo(t.pos)), Infinity);
      const score = dot * 8 - dist * 0.08 + (markedDist < 3 ? -10 : 0);
      if (score > bestScore) { bestScore = score; best = t; }
    }
    const target = best || teammates[Math.floor(Math.random() * teammates.length)];
    const passDir = target.pos.clone().sub(this.ball.pos); passDir.y = 0; passDir.normalize();
    const power = 15 + player.stats.pass * 0.12;
    this.ball.vel.copy(passDir.multiplyScalar(power)); this.ball.vel.y = 2;
    this.setAnimState(player, 'kick');
  }

  private updateCamera(dt: number) {
    if (this.kickoffIntro > 0) {
      this.kickoffIntro -= dt;
      const introT = 1 - this.kickoffIntro / 3.0;
      const angle = introT * Math.PI * 1.5;
      const radius = 25 - introT * 18;
      this.camTargetPos.x = Math.cos(angle) * radius;
      this.camTargetPos.y = 12 - introT * 7;
      this.camTargetPos.z = Math.sin(angle) * radius;
      this.camera.position.copy(this.camTargetPos);
      this.camLookAt.set(0, 1.2, 0);
      this.camera.lookAt(this.camLookAt);
      if (this.kickoffIntro <= 0) this.matchStarted = true;
      return;
    }

    const controlled = this.getControllingPlayer();
    const player = controlled && controlled.team === 'home' ? controlled : null;

    let camX: number; let camZ: number;
    if (player) {
      const rot = player.mesh.rotation.y;
      camX = player.pos.x - Math.sin(rot) * 7;
      camZ = player.pos.z - Math.cos(rot) * 7;
    } else { camX = this.ball.pos.x; camZ = this.ball.pos.z + 7; }

    const lerp = Math.min(6 * dt, 1);
    this.camTargetPos.x += (camX - this.camTargetPos.x) * lerp;
    this.camTargetPos.y += (5 - this.camTargetPos.y) * lerp;
    this.camTargetPos.z += (camZ - this.camTargetPos.z) * lerp;
    this.camera.position.copy(this.camTargetPos);

    this.camLookAt.x += (this.ball.pos.x - this.camLookAt.x) * lerp;
    this.camLookAt.y += (1.2 - this.camLookAt.y) * lerp;
    this.camLookAt.z += (this.ball.pos.z - this.camLookAt.z) * lerp;
    this.camera.lookAt(this.camLookAt);
  }

  private animate = () => {
    if (!this.running) return;
    this.animationId = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (!this.paused) {
      if (this.kickoffIntro > 0) {
        this.updateCamera(dt);
        this.players.forEach((p) => this.animatePlayer(p, dt));
        this.composer.render();
        return;
      }

      this.timeLeft -= dt;
      if (this.timeLeft <= 0) { this.timeLeft = 0; this.endMatch(); return; }
      this.onTimeUpdate(Math.ceil(this.timeLeft));

      const controlled = this.getControllingPlayer();
      if (controlled && controlled.team === 'home') {
        const isSprinting = this.sprintPressed && this.stamina > 0;
        const isMoving = controlled.vel.length() > 2;
        if (isSprinting && isMoving) { this.stamina = Math.max(0, this.stamina - 18 * dt); }
        else { this.stamina = Math.min(100, this.stamina + 10 * dt); }
        if (this.config.onStaminaUpdate) this.config.onStaminaUpdate(Math.round(this.stamina));
      }

      this.updateBall(dt);
      this.updatePlayerMovement(dt);
      this.updateCamera(dt);

      this.trailTimer -= dt;
      if (this.ball.vel.length() > 18 && this.trailTimer <= 0) {
        this.trailTimer = 0.04;
        const trailGeo = new THREE.SphereGeometry(BALL_RADIUS * 0.7, 8, 8);
        const trailMat = new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.5 });
        const trail = new THREE.Mesh(trailGeo, trailMat);
        trail.position.copy(this.ball.mesh.position);
        this.scene.add(trail);
        this.trailParticles.push(trail);
      }
      this.trailParticles = this.trailParticles.filter(tp => {
        const mat = tp.material as THREE.MeshBasicMaterial;
        mat.opacity -= dt * 2.5;
        if (mat.opacity <= 0) { this.scene.remove(tp); tp.geometry.dispose(); mat.dispose(); return false; }
        return true;
      });

      this.players.forEach((p) => { this.animatePlayer(p, dt); });

      if (this.celebrateTime > 0) {
        this.celebrateTime -= dt;
        this.bloomPass.strength = 0.35 + Math.sin(this.celebrateTime * 6) * 0.15 + 0.3;
        if (this.celebrateTime <= 0 && this.celebratingPlayer) {
          this.celebratingPlayer.animState = 'idle'; this.celebratingPlayer.animTime = 0;
          this.celebratingPlayer = null; this.bloomPass.strength = 0.35;
        }
      }

      this.players.forEach((p, i) => {
        const ring = p.mesh.getObjectByName('directionIndicator') as THREE.Mesh | null;
        if (ring && ring.material) { (ring.material as THREE.MeshBasicMaterial).opacity = i === this.controlledIndex ? 0.8 : 0.2; }
      });

      if (this.config.onRadarUpdate) {
        this.config.onRadarUpdate({
          ballX: this.ball.pos.x / (PITCH_W / 2),
          ballZ: this.ball.pos.z / (PITCH_H / 2),
          homePlayers: this.players.filter(p => p.team === 'home').map(p => [p.pos.x / (PITCH_W / 2), p.pos.z / (PITCH_H / 2)] as [number, number]),
          awayPlayers: this.players.filter(p => p.team === 'away').map(p => [p.pos.x / (PITCH_W / 2), p.pos.z / (PITCH_H / 2)] as [number, number]),
        });
      }

      if (this.config.onDataSync && this.config.isP2P) {
        this.config.onDataSync({
          ballPos: [this.ball.pos.x, this.ball.pos.y, this.ball.pos.z],
          ballVel: [this.ball.vel.x, this.ball.vel.y, this.ball.vel.z],
          homePositions: this.players.filter(p => p.team === 'home').map(p => [p.pos.x, p.pos.y, p.pos.z] as [number, number, number]),
          awayPositions: this.players.filter(p => p.team === 'away').map(p => [p.pos.x, p.pos.y, p.pos.z] as [number, number, number]),
          scoreHome: this.scoreHome, scoreAway: this.scoreAway,
          timeLeft: Math.ceil(this.timeLeft),
          possessingTeam: this.possessionHomeFrames > this.possessionFrames - this.possessionHomeFrames ? 'home' : 'away',
        });
      }
    }

    this.composer.render();
  };

  private endMatch() {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    const totalFrames = this.possessionFrames || 1;
    const possessionHome = Math.round((this.possessionHomeFrames / totalFrames) * 100);
    this.onMatchEnd({
      scoreHome: this.scoreHome, scoreAway: this.scoreAway,
      possessionHome: isNaN(possessionHome) ? 50 : possessionHome,
      shotsHome: this.shotsHome, shotsAway: this.shotsAway,
    });
  }

  start() { this.running = true; this.clock.start(); this.animate(); }
  pause() { this.paused = true; }
  resume() { this.paused = false; }
  setInput(jx: number, jy: number) { this.joystickX = jx; this.joystickY = jy; }
  triggerPass() { this.passPressed = true; }
  triggerShoot() { this.shootPressed = true; }
  setSprint(active: boolean) { this.sprintPressed = active; }
  setRemoteInput(input: RemoteInput) { this.remoteInput = input; }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    this.composer.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material?.dispose();
      }
    });
    Object.values(SHARED_GEO).forEach(g => g.dispose());
  }

  private onResize = () => {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.composer.setSize(this.container.clientWidth, this.container.clientHeight);
  };
}
