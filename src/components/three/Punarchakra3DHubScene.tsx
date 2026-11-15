import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ArrowRight, Maximize2, Minimize2, Pause, Play, RotateCcw } from 'lucide-react';
import { LanguageCode } from '../../i18n/translations';

type StationId = 'overview' | 'w2v-hub' | 'ev-van' | 'sorting-line';

interface StationMeta {
  id: StationId;
  labelEn: string;
  labelKn: string;
  summaryEn: string;
  summaryKn: string;
  camPos: [number, number, number];
  lookAt: [number, number, number];
}

const STATIONS: Record<StationId, StationMeta> = {
  overview: {
    id: 'overview',
    labelEn: 'Overview',
    labelKn: 'ಸಮಗ್ರ ನೋಟ',
    summaryEn: 'Solar-powered Bengaluru W2V Recovery Hub: EV fleet arrival, ±10g calibrated weighing & acoustic/polymer upcycling.',
    summaryKn: 'ಬೆಂಗಳೂರು ಸೌರಶಕ್ತಿ W2V ಕೇಂದ್ರ: EV ವಾಹನ ಆಗಮನ, ±10g ಡಿಜಿಟಲ್ ತೂಕ ಮತ್ತು W2V ಉತ್ಪನ್ನ ತಯಾರಿಕೆ.',
    camPos: [10.5, 6.2, 12.2],
    lookAt: [0, 1.0, 0],
  },
  'w2v-hub': {
    id: 'w2v-hub',
    labelEn: 'Solar W2V Hub',
    labelKn: 'ಸೌರ W2V ಘಟಕ',
    summaryEn: 'Roof-mounted PV arrays power Bengaluru optical sorting & thermal compression presses for architectural W2V boards.',
    summaryKn: 'ಮೇಲ್ಛಾವಣಿ ಸೌರ ಫಲಕಗಳು ಬೆಂಗಳೂರಿನ ವಿಂಗಡಣೆ ಮತ್ತು W2V ಬೋರ್ಡ್ ತಯಾರಿಕೆಗೆ ಶಕ್ತಿ ಒದಗಿಸುತ್ತವೆ.',
    camPos: [-2.8, 5.4, 9.6],
    lookAt: [-2.6, 1.5, -1.4],
  },
  'ev-van': {
    id: 'ev-van',
    labelEn: 'EV Fleet Bay',
    labelKn: 'EV ವಾಹನ ಬೇ',
    summaryEn: 'Zero-emission electric cargo vans collect household scrap across North Bengaluru and industrial lots from Peenya & Whitefield.',
    summaryKn: 'ಶೂನ್ಯ-ಹೊರಸೂಸುವಿಕೆ EV ವಾಹನಗಳು ಉತ್ತರ ಬೆಂಗಳೂರು ಮತ್ತು ಕೈಗಾರಿಕಾ ಪ್ರದೇಶಗಳಿಂದ ಸ್ಕ್ರ್ಯಾಪ್ ಸಂಗ್ರಹಿಸುತ್ತವೆ.',
    camPos: [7.6, 3.3, 7.6],
    lookAt: [3.2, 0.9, 1.8],
  },
  'sorting-line': {
    id: 'sorting-line',
    labelEn: 'Weigh & Sort Line',
    labelKn: 'ತೂಕ & ವಿಂಗಡಣೆ',
    summaryEn: 'Calibrated digital weighing pedestal + optical grading arch locks customer payout rates before UPI instant settlement.',
    summaryKn: 'ಕ್ಯಾಲಿಬ್ರೇಟಡ್ ಡಿಜಿಟಲ್ ತೂಕ ಯಂತ್ರ ಮತ್ತು ಆಪ್ಟಿಕಲ್ ಗ್ರೇಡಿಂಗ್ ತಕ್ಷಣದ UPI ಪಾವತಿಗೆ ದರವನ್ನು ದೃಢೀಕರಿಸುತ್ತದೆ.',
    camPos: [2.2, 3.6, 8.8],
    lookAt: [0.2, 1.0, 1.0],
  },
};

// Pre-allocated scratch vectors (zero per-frame allocations)
const _camGoal = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();
const _pointer = new THREE.Vector2();
const _raycaster = new THREE.Raycaster();

function detectSoftwareGl(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return false;
    const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
    return /SwiftShader|llvmpipe|Microsoft Basic Render Driver/i.test(renderer);
  } catch {
    return false;
  }
}

function createFasciaTexture(textTop: string, textBottom: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#174B37';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#A5D66D';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(textTop, 256, 56);
    ctx.fillStyle = '#A5D66D';
    ctx.font = '600 20px monospace';
    ctx.fillText(textBottom, 256, 94);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createScaleDisplayTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0D261C';
    ctx.fillRect(0, 0, 256, 160);
    ctx.strokeStyle = '#28A66A';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 244, 148);
    ctx.fillStyle = '#A5D66D';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('DIGITAL SCALE ±10g', 16, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 46px monospace';
    ctx.fillText('48.50 kg', 16, 100);
    ctx.fillStyle = '#28A66A';
    ctx.font = '600 18px sans-serif';
    ctx.fillText('UPI RATE LOCKED', 16, 136);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
    grad.addColorStop(0, 'rgba(16, 53, 39, 0.34)');
    grad.addColorStop(1, 'rgba(16, 53, 39, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function tagStation(root: THREE.Object3D, stationId: StationId) {
  root.userData.stationId = stationId;
  root.traverse((child) => {
    child.userData.stationId = stationId;
  });
}

interface Punarchakra3DHubSceneProps {
  language: LanguageCode;
  onCtaClick?: () => void;
}

export const Punarchakra3DHubScene: React.FC<Punarchakra3DHubSceneProps> = ({
  language,
  onCtaClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedStation, setSelectedStation] = useState<StationId>('overview');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dockExpanded, setDockExpanded] = useState(true);
  const [webglError, setWebglError] = useState<string | null>(null);

  const isPlayingRef = useRef(true);
  const targetStationRef = useRef<StationId>('overview');
  const needsCamTweenRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const focusStation = (id: StationId) => {
    setSelectedStation(id);
    targetStationRef.current = id;
    needsCamTweenRef.current = true;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError('WebGL is unavailable in this browser context.');
      return;
    }

    const glCtx = renderer.getContext();
    const isSoftwareGl = detectSoftwareGl(glCtx);
    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeef4ed);
    scene.fog = new THREE.FogExp2(0xeef4ed, 0.017);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();

    const camera = new THREE.PerspectiveCamera(
      42,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      80
    );
    camera.position.set(...STATIONS.overview.camPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(...STATIONS.overview.lookAt);
    controls.minDistance = 5.5;
    controls.maxDistance = 24;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.update();

    // Lighting: warm key Sun + cool sky Hemisphere
    const hemiLight = new THREE.HemisphereLight(0xf6fbf5, 0xc7d6c4, 0.75);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e4, 2.2);
    keyLight.position.set(11, 15, 9);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 36;
      keyLight.shadow.camera.left = -10;
      keyLight.shadow.camera.right = 10;
      keyLight.shadow.camera.top = 10;
      keyLight.shadow.camera.bottom = -10;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa5d66d, 0.55);
    rimLight.position.set(-9, 6, -8);
    scene.add(rimLight);

    // Track disposable resources cleanly
    const disposables: {
      geometries: THREE.BufferGeometry[];
      materials: THREE.Material[];
      textures: THREE.Texture[];
    } = { geometries: [], materials: [], textures: [] };

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      disposables.geometries.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      disposables.materials.push(m);
      return m;
    };
    const trackTex = <T extends THREE.Texture>(t: T): T => {
      t.anisotropy = maxAniso;
      disposables.textures.push(t);
      return t;
    };

    // Ground courtyard pad & soft contact shadow
    const groundMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xdfe8dd, roughness: 0.92, metalness: 0.02 })
    );
    const groundMesh = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(18, 48)), groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = !isSoftwareGl;
    scene.add(groundMesh);

    const padMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xf4f7f2, roughness: 0.85, metalness: 0.05 })
    );
    const padMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(12.5, 0.14, 8.8)), padMat);
    padMesh.position.set(0, 0.07, 0);
    padMesh.receiveShadow = !isSoftwareGl;
    scene.add(padMesh);

    const shadowTex = trackTex(createContactShadowTexture());
    const contactMat = trackMat(
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );

    // ------------------------------------------------------------------------
    // STATION 1: SOLAR W2V SORTING HUB (Composite Group, 8+ parts)
    // ------------------------------------------------------------------------
    const hubGroup = new THREE.Group();
    hubGroup.position.set(-2.6, 0.14, -1.3);

    const plinthMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xd0dad0, roughness: 0.88, metalness: 0.05 }));
    const steelMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x1e2e26, roughness: 0.35, metalness: 0.78 }));
    const brandEmeraldMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x174b37, roughness: 0.42, metalness: 0.12 }));
    const glassMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xcbe8dc,
        roughness: 0.08,
        metalness: 0.05,
        transmission: 0.45,
        transparent: true,
        opacity: 0.78,
      })
    );
    const solarPanelMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x142c47, roughness: 0.18, metalness: 0.52 })
    );

    const plinth = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.6, 0.28, 4.2)), plinthMat);
    plinth.position.y = 0.14;
    plinth.castShadow = !isSoftwareGl;
    plinth.receiveShadow = !isSoftwareGl;
    hubGroup.add(plinth);

    // 4 Corner Steel Pillars
    const colGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.12, 2.7, 12));
    [
      [-2.4, 1.55, -1.7],
      [2.4, 1.55, -1.7],
      [-2.4, 1.55, 1.7],
      [2.4, 1.55, 1.7],
    ].forEach(([cx, cy, cz]) => {
      const col = new THREE.Mesh(colGeo, steelMat);
      col.position.set(cx, cy, cz);
      col.castShadow = !isSoftwareGl;
      hubGroup.add(col);
    });

    // Glass inspection bay & back wall
    const backWall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.9, 2.3, 0.22)), brandEmeraldMat);
    backWall.position.set(0, 1.4, -1.65);
    backWall.castShadow = !isSoftwareGl;
    hubGroup.add(backWall);

    const glassWall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.6, 1.9, 0.08)), glassMat);
    glassWall.position.set(0, 1.25, 0.25);
    hubGroup.add(glassWall);

    // Sloped Canopy Roof & Solar PV Arrays
    const roofCanopy = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.9, 0.2, 4.5)), steelMat);
    roofCanopy.position.set(0, 2.95, 0);
    roofCanopy.rotation.x = 0.08;
    roofCanopy.castShadow = !isSoftwareGl;
    hubGroup.add(roofCanopy);

    const pvGeo = trackGeo(new THREE.BoxGeometry(1.5, 0.08, 3.2));
    [-1.75, 0, 1.75].forEach((px) => {
      const pv = new THREE.Mesh(pvGeo, solarPanelMat);
      pv.position.set(px, 3.16, -0.05);
      pv.rotation.x = 0.16;
      pv.castShadow = !isSoftwareGl;
      hubGroup.add(pv);
    });

    // Procedural CanvasTexture Fascia Signboard
    const fasciaTex = trackTex(createFasciaTexture('PUNARCHAKRA W2V', 'SOLAR HUB · BENGALURU'));
    const fasciaMat = trackMat(new THREE.MeshStandardMaterial({ map: fasciaTex, roughness: 0.4, metalness: 0.05 }));
    const fasciaBoard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.4, 0.65, 0.12)), fasciaMat);
    fasciaBoard.position.set(0, 2.85, 2.28);
    hubGroup.add(fasciaBoard);

    const hubShadow = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(7.2, 5.4)), contactMat);
    hubShadow.rotation.x = -Math.PI / 2;
    hubShadow.position.y = 0.01;
    hubGroup.add(hubShadow);

    tagStation(hubGroup, 'w2v-hub');
    scene.add(hubGroup);

    // ------------------------------------------------------------------------
    // STATION 2: ZERO-EMISSION EV CARGO VAN (Composite Group, 10 parts)
    // ------------------------------------------------------------------------
    const evGroup = new THREE.Group();
    evGroup.position.set(3.2, 0.14, 1.7);
    evGroup.rotation.y = -0.38;

    const tireMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x1c211f, roughness: 0.88, metalness: 0.05 }));
    const rimMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xd9e1dc, roughness: 0.25, metalness: 0.82 }));
    const evCabMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x28a66a, roughness: 0.32, metalness: 0.18 }));
    const evLiveryTex = trackTex(createFasciaTexture('PUNARCHAKRA EV', 'ZERO-EMISSION FLEET'));
    const evCargoMat = trackMat(new THREE.MeshStandardMaterial({ map: evLiveryTex, roughness: 0.42, metalness: 0.1 }));
    const lampMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfde68a, emissiveIntensity: 0.75, roughness: 0.2 })
    );
    const beaconMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xa5d66d, emissive: 0x28a66a, emissiveIntensity: 0.85, roughness: 0.2 })
    );

    const chassis = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.2, 0.22, 1.4)), steelMat);
    chassis.position.y = 0.36;
    evGroup.add(chassis);

    const cargoBox = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.1, 1.32, 1.46)), evCargoMat);
    cargoBox.position.set(-0.48, 1.12, 0);
    cargoBox.castShadow = !isSoftwareGl;
    evGroup.add(cargoBox);

    const cab = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.02, 1.05, 1.4)), evCabMat);
    cab.position.set(1.06, 0.98, 0);
    cab.castShadow = !isSoftwareGl;
    evGroup.add(cab);

    const windshield = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.1, 0.52, 1.24)), glassMat);
    windshield.position.set(1.54, 1.15, 0);
    windshield.rotation.z = 0.16;
    evGroup.add(windshield);

    const beacon = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.1, 0.12, 0.14, 14)), beaconMat);
    beacon.position.set(1.05, 1.56, 0);
    evGroup.add(beacon);

    // Dual front LED lamps
    const lampGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.14, 0.22));
    [-0.46, 0.46].forEach((lz) => {
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(1.56, 0.58, lz);
      evGroup.add(lamp);
    });

    // 4 Wheels + Rims
    const wheelGeo = trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 20));
    const rimGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.18, 0.24, 16));
    const wheelAnchors: [number, number, number][] = [
      [-0.95, 0.32, 0.72],
      [-0.95, 0.32, -0.72],
      [1.05, 0.32, 0.72],
      [1.05, 0.32, -0.72],
    ];
    wheelAnchors.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = !isSoftwareGl;
      evGroup.add(wheel);

      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(wx, wy, wz);
      evGroup.add(rim);
    });

    const evShadow = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(4.1, 2.3)), contactMat);
    evShadow.rotation.x = -Math.PI / 2;
    evShadow.position.y = 0.01;
    evGroup.add(evShadow);

    tagStation(evGroup, 'ev-van');
    scene.add(evGroup);

    // ------------------------------------------------------------------------
    // STATION 3: CALIBRATED DIGITAL WEIGHING & SORTING LINE
    // ------------------------------------------------------------------------
    const lineGroup = new THREE.Group();
    lineGroup.position.set(0.3, 0.14, 1.8);

    const conveyorBeltMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x26322d, roughness: 0.78, metalness: 0.1 }));
    const aluminumMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xc2cbc4, roughness: 0.28, metalness: 0.76 }));
    const copperMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xc86d3b, roughness: 0.28, metalness: 0.85 }));
    const cardboardMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xb5895a, roughness: 0.86, metalness: 0.02 }));
    const finishedW2vMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xa5d66d, roughness: 0.45, metalness: 0.12 }));

    const beltFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.4, 0.2, 1.05)), aluminumMat);
    beltFrame.position.y = 0.56;
    beltFrame.castShadow = !isSoftwareGl;
    lineGroup.add(beltFrame);

    const beltTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.3, 0.05, 0.86)), conveyorBeltMat);
    beltTop.position.y = 0.68;
    lineGroup.add(beltTop);

    // Conveyor legs
    const legGeo = trackGeo(new THREE.BoxGeometry(0.12, 0.52, 0.92));
    [-1.85, 0, 1.85].forEach((lx) => {
      const leg = new THREE.Mesh(legGeo, steelMat);
      leg.position.set(lx, 0.26, 0);
      lineGroup.add(leg);
    });

    // Optical Scan Arch
    const archLeft = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 1.3, 0.16)), steelMat);
    archLeft.position.set(-0.2, 1.15, 0.52);
    const archRight = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 1.3, 0.16)), steelMat);
    archRight.position.set(-0.2, 1.15, -0.52);
    const archTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.18, 1.25)), brandEmeraldMat);
    archTop.position.set(-0.2, 1.8, 0);
    const scanBeam = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.06, 0.06, 0.96)), beaconMat);
    scanBeam.position.set(-0.2, 1.66, 0);
    lineGroup.add(archLeft, archRight, archTop, scanBeam);

    // Digital Scale Pedestal + Procedural CanvasTexture Readout
    const scalePole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.06, 0.08, 1.45, 12)), aluminumMat);
    scalePole.position.set(1.25, 0.72, 0.85);
    const scaleScreenMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: trackTex(createScaleDisplayTexture()),
        roughness: 0.24,
        metalness: 0.1,
      })
    );
    const scaleHead = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.75, 0.48, 0.1)), scaleScreenMat);
    scaleHead.position.set(1.25, 1.48, 0.88);
    scaleHead.rotation.y = -0.3;
    lineGroup.add(scalePole, scaleHead);

    // Animated Scrap Bales on belt (copper coil, cardboard bale, finished W2V panel)
    const movingBales: { mesh: THREE.Mesh; offset: number }[] = [
      { mesh: new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 0.34, 0.46)), cardboardMat), offset: 0 },
      { mesh: new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.22, 0.22, 0.26, 16)), copperMat), offset: 0.33 },
      { mesh: new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.5, 0.28, 0.5)), finishedW2vMat), offset: 0.66 },
    ];
    movingBales.forEach((b) => {
      b.mesh.castShadow = !isSoftwareGl;
      b.mesh.position.y = 0.88;
      lineGroup.add(b.mesh);
    });

    // Output W2V Stacked Panels beside conveyor
    [0, 0.18, 0.36].forEach((py, idx) => {
      const panel = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.95, 0.14, 0.7)), finishedW2vMat);
      panel.position.set(-2.95, 0.12 + py, 0.2);
      panel.rotation.y = idx * 0.08;
      panel.castShadow = !isSoftwareGl;
      lineGroup.add(panel);
    });

    const lineShadow = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(5.4, 2.2)), contactMat);
    lineShadow.rotation.x = -Math.PI / 2;
    lineShadow.position.y = 0.01;
    lineGroup.add(lineShadow);

    tagStation(lineGroup, 'sorting-line');
    scene.add(lineGroup);

    // Raycast click to focus station
    const onPointerDown = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_pointer, camera);
      const hits = _raycaster.intersectObjects([hubGroup, evGroup, lineGroup], true);
      if (hits.length > 0) {
        const hitStation = hits[0].object.userData.stationId as StationId | undefined;
        if (hitStation && STATIONS[hitStation]) {
          focusStation(hitStation);
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Cancel auto-tween if user drags orbit manually
    const onControlStart = () => {
      needsCamTweenRef.current = false;
    };
    controls.addEventListener('start', onControlStart);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError('3D preview paused due to WebGL context interruption.');
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const onResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObs = new ResizeObserver(onResize);
    resizeObs.observe(container);

    let rafId = 0;
    let prevTime = performance.now();
    let beltPhase = 0;

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - prevTime) / 1000);
      prevTime = now;

      if (isPlayingRef.current) {
        beltPhase = (beltPhase + dt * 0.22) % 1;
        movingBales.forEach((b) => {
          const t = (beltPhase + b.offset) % 1;
          b.mesh.position.x = 1.9 - t * 3.8;
          // Transform look subtly once past optical scanner
          b.mesh.rotation.y = t * Math.PI * 0.5;
        });
        evGroup.position.y = 0.14 + Math.sin(now * 0.0025) * 0.015;
        beaconMat.emissiveIntensity = 0.55 + Math.sin(now * 0.005) * 0.35;
      }

      if (needsCamTweenRef.current) {
        const meta = STATIONS[targetStationRef.current];
        _camGoal.set(...meta.camPos);
        _lookGoal.set(...meta.lookAt);
        const alpha = 1 - Math.exp(-5.5 * dt);
        camera.position.lerp(_camGoal, alpha);
        controls.target.lerp(_lookGoal, alpha);
        if (
          camera.position.distanceTo(_camGoal) < 0.05 &&
          controls.target.distanceTo(_lookGoal) < 0.05
        ) {
          needsCamTweenRef.current = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObs.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.removeEventListener('start', onControlStart);
      controls.dispose();
      envRT.dispose();
      pmremGenerator.dispose();
      disposables.geometries.forEach((g) => g.dispose());
      disposables.materials.forEach((m) => m.dispose());
      disposables.textures.forEach((t) => t.dispose());
      renderer.dispose();
    };
  }, []);

  const currentMeta = STATIONS[selectedStation];

  return (
    <div
      className={`rounded-2xl border border-[#202820]/12 bg-[#EEF4ED] overflow-hidden relative ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'w-full'
      }`}
    >
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className={`w-full ${isFullscreen ? 'h-full min-h-[540px]' : 'h-[400px] sm:h-[460px]'}`}
        aria-label="Interactive 3D Punarchakra Bengaluru W2V Sorting Hub and EV Fleet"
      >
        {webglError && (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-sm text-[#174B37]">
            <p className="font-bold">3D Studio Fallback Active</p>
            <p className="text-xs text-[#202820]/70 mt-1">{webglError}</p>
          </div>
        )}
      </div>

      {/* Consolidated Single Collapsible HUD Dock (<= 15% footprint, ZERO backdrop-blur over WebGL) */}
      <div className="absolute bottom-3 left-3 right-3 pointer-events-none flex justify-center">
        <div className="pointer-events-auto w-full max-w-4xl rounded-xl bg-white border border-[#202820]/15 shadow-lg px-3.5 py-2.5 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['overview', 'w2v-hub', 'ev-van', 'sorting-line'] as StationId[]).map((sid) => {
                const s = STATIONS[sid];
                const active = selectedStation === sid;
                return (
                  <button
                    key={sid}
                    type="button"
                    onClick={() => focusStation(sid)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#174B37] text-white'
                        : 'bg-[#F7F9F6] text-[#174B37] hover:bg-[#174B37]/10'
                    }`}
                  >
                    {language === 'kn' ? s.labelKn : s.labelEn}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                title={isPlaying ? 'Pause conveyor & EV motion' : 'Play conveyor & EV motion'}
                className="p-1.5 rounded-lg bg-[#F7F9F6] text-[#174B37] hover:bg-[#174B37]/10 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => focusStation('overview')}
                title="Reset camera view"
                className="p-1.5 rounded-lg bg-[#F7F9F6] text-[#174B37] hover:bg-[#174B37]/10 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen((f) => !f)}
                title={isFullscreen ? 'Exit fullscreen' : 'Expand 3D Studio'}
                className="p-1.5 rounded-lg bg-[#F7F9F6] text-[#174B37] hover:bg-[#174B37]/10 cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setDockExpanded((d) => !d)}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[#202820]/65 hover:text-[#174B37] cursor-pointer"
              >
                {dockExpanded ? 'Hide Info' : 'Details'}
              </button>
            </div>
          </div>

          {dockExpanded && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1.5 border-t border-[#202820]/10 text-xs">
              <p className="text-[#202820]/75 leading-snug">
                <strong className="text-[#174B37] mr-1">
                  {language === 'kn' ? currentMeta.labelKn : currentMeta.labelEn}:
                </strong>
                {language === 'kn' ? currentMeta.summaryKn : currentMeta.summaryEn}
              </p>
              {onCtaClick && (
                <button
                  type="button"
                  onClick={onCtaClick}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#28A66A] text-white font-semibold whitespace-nowrap hover:bg-[#174B37] transition-colors shrink-0 cursor-pointer"
                >
                  <span>{language === 'kn' ? 'EV ಪಿಕಪ್ ಬುಕ್ ಮಾಡಿ' : 'Book EV Pickup'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
