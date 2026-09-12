import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const isTouchDevice = new URLSearchParams(window.location.search).has('touch')
  || window.matchMedia('(pointer: coarse)').matches;
document.body.classList.toggle('touch-device', isTouchDevice);

const root = document.querySelector('#canvas-root');
const ui = {
  start: document.querySelector('#start-screen'),
  play: document.querySelector('#play'),
  result: document.querySelector('#result'),
  restart: document.querySelector('#restart'),
  timer: document.querySelector('#timer'),
  bestTime: document.querySelector('#best-time'),
  speed: document.querySelector('#speed'),
  anchor: document.querySelector('#anchor-state'),
  objectiveLabel: document.querySelector('#objective-label'),
  objective: document.querySelector('#objective'),
  progress: document.querySelector('#objective-progress'),
  resultTime: document.querySelector('#result-time'),
  resultRecord: document.querySelector('#result-record'),
  resultTitle: document.querySelector('#result-title'),
  nextLevel: document.querySelector('#next-level'),
  levelMenu: document.querySelector('#level-menu'),
  levelKicker: document.querySelector('#level-kicker'),
  missionCopy: document.querySelector('#mission-copy'),
  levelCards: [...document.querySelectorAll('[data-level]')],
  leaderboardList: document.querySelector('#leaderboard-list'),
  playerRank: document.querySelector('#player-rank'),
  reticle: document.querySelector('#reticle'),
  webMeter: document.querySelector('#web-meter'),
  breakMeter: document.querySelector('#break-meter'),
  toast: document.querySelector('#toast'),
  damage: document.querySelector('#damage-flash'),
  hud: document.querySelector('.hud'),
  objectiveMarker: document.querySelector('#objective-marker'),
  objectiveDistance: document.querySelector('#objective-distance'),
  inputHint: document.querySelector('#input-hint'),
  movePad: document.querySelector('#move-pad'),
  moveKnob: document.querySelector('#move-knob'),
  mobileJump: document.querySelector('#mobile-jump'),
  mobileWeb: document.querySelector('#mobile-web'),
  mobilePull: document.querySelector('#mobile-pull'),
  mobileAnchor: document.querySelector('#mobile-anchor'),
  mobileRemove: document.querySelector('#mobile-remove'),
  mobileRestart: document.querySelector('#mobile-restart'),
  characterCards: [...document.querySelectorAll('[data-character]')],
  blockChoices: [...document.querySelectorAll('[data-block]')],
};
ui.inputHint.textContent = isTouchDevice
  ? 'Левый стик — движение, свайп по экрану — камера'
  : 'Нажмите Esc, чтобы освободить курсор';

const levelOrder = ['queens', 'manhattan', 'rift', 'industrial', 'skyline', 'core'];
const leaderboardRivals = {
  queens: [['NOVA', 38.42], ['BYTE', 46.18], ['LUMA', 57.63], ['ROOK', 72.1], ['PIXEL', 94.55]],
  manhattan: [['VOLT', 49.7], ['NOVA', 61.25], ['GLITCH', 74.8], ['BYTE', 91.4], ['ROOK', 118.2]],
  rift: [['LUMA', 43.95], ['VOLT', 55.4], ['PIXEL', 68.7], ['NOVA', 84.2], ['GLITCH', 109.6]],
  industrial: [['BYTE', 69.3], ['VOLT', 84.8], ['ROOK', 103.2], ['LUMA', 127.9], ['PIXEL', 158.4]],
  skyline: [['NOVA', 76.1], ['GLITCH', 93.6], ['VOLT', 116.5], ['BYTE', 143.8], ['ROOK', 179.2]],
  core: [['LUMA', 106.4], ['NOVA', 132.8], ['VOLT', 164.3], ['GLITCH', 207.5], ['PIXEL', 258.9]],
};
const levelConfigs = {
  queens: {
    number: '01',
    name: 'КВИНС',
    kind: 'rescue',
    description: 'Доберитесь до жителя на высокой башне и вернитесь к стартовому порталу.',
    start: [-30, 1, 8],
    portal: [-30, .8, 8],
    citizen: [30, 39.8, 5],
    route: [[-12, 17.2, -2], [8, 28.2, -8], [30, 40.2, 5]],
    sky: 0x8ecde5,
    fog: 0x90cfe4,
    rift: 0xff4b1f,
    sun: 0xfff0ca,
    checkpointRadius: 4.5,
    fallPenalty: 3,
  },
  manhattan: {
    number: '02',
    name: 'МАНХЭТТЕН',
    kind: 'relay',
    description: 'Активируйте четыре энергетических узла, двигаясь с крыш обратно к Квинсу.',
    start: [31, 39.4, 5],
    portal: [-30, .8, 8],
    citizen: [30, 39.8, 5],
    route: [[19, 17.6, 1], [8, 28.2, -8], [-12, 17.2, -2], [-30, 1, 8]],
    sky: 0x7585a6,
    fog: 0x697999,
    rift: 0xff4b1f,
    sun: 0xffd28a,
    checkpointRadius: 4.2,
    fallPenalty: 3,
  },
  rift: {
    number: '03',
    name: 'КУБИЧЕСКИЙ РАЗЛОМ',
    kind: 'race',
    description: 'Пройдите пять скоростных колец и доберитесь до вершины финальной башни.',
    start: [-30, 1, 8],
    portal: [30, 40.2, 5],
    citizen: [30, 39.8, 5],
    route: [[-12, 17.2, -2], [-1, 7.6, 5], [8, 28.2, -8], [19, 17.6, 1], [30, 40.2, 5]],
    sky: 0x765b7f,
    fog: 0x604966,
    rift: 0xff4b1f,
    sun: 0xffb86b,
    checkpointRadius: 3.8,
    fallPenalty: 4,
  },
  industrial: {
    number: '04', name: 'ПРОМЗОНА', kind: 'relay',
    description: 'Восстановите шесть узлов, меняя высоту и направление движения.',
    start: [-30, 1, 8], portal: [31, 39.4, 5], citizen: [30, 39.8, 5],
    route: [[-12, 16.7, -2], [-1, 7, 5], [8, 26.5, -8], [19, 17, 1], [31, 39.4, 5], [-30, 1, 8]],
    sky: 0x8a8175, fog: 0x756d62, rift: 0xff4b1f, sun: 0xffc76d, checkpointRadius: 3.5, fallPenalty: 5,
  },
  skyline: {
    number: '05', name: 'НЕБОСКРЁБЫ', kind: 'race',
    description: 'Пройдите семь колец без падений через весь вертикальный город.',
    start: [-30, 1, 8], portal: [31, 39.4, 5], citizen: [30, 39.8, 5],
    route: [[-12, 16.7, -2], [-1, 7, 5], [8, 26.5, -8], [19, 17, 1], [31, 39.4, 5], [8, 26.5, -8], [-30, 1, 8]],
    sky: 0x617d9e, fog: 0x546f8d, rift: 0xff4b1f, sun: 0xffe0a0, checkpointRadius: 3.2, fallPenalty: 6,
  },
  core: {
    number: '06', name: 'ЯДРО РАЗЛОМА', kind: 'race',
    description: 'Финальный маршрут из девяти колец с резкими разворотами и перепадами высоты.',
    start: [31, 39.4, 5], portal: [-30, .8, 8], citizen: [30, 39.8, 5],
    route: [[19, 17, 1], [8, 26.5, -8], [-1, 7, 5], [-12, 16.7, -2], [-30, 1, 8], [-1, 7, 5], [19, 17, 1], [8, 26.5, -8], [31, 39.4, 5]],
    sky: 0x4c3b58, fog: 0x3f324b, rift: 0xff4b1f, sun: 0xff9a66, checkpointRadius: 2.8, fallPenalty: 8,
  },
};

let campaignState = { unlocked: 1, completed: {}, best: {}, tutorialComplete: false };
try {
  const savedCampaign = JSON.parse(localStorage.getItem('cubic-rift-campaign') || '{}');
  campaignState = {
    unlocked: Math.max(1, Math.min(levelOrder.length, Number(savedCampaign.unlocked) || 1)),
    completed: savedCampaign.completed || {},
    best: savedCampaign.best || {},
    tutorialComplete: Boolean(savedCampaign.tutorialComplete || localStorage.getItem('cubic-rift-tutorial-complete')),
  };
} catch {
  // Invalid campaign data falls back to a fresh save.
}
let selectedLevelId = localStorage.getItem('cubic-rift-level') || levelOrder[0];
if (!levelConfigs[selectedLevelId] || levelOrder.indexOf(selectedLevelId) >= campaignState.unlocked) {
  selectedLevelId = levelOrder[0];
}
let activeLevel = levelConfigs[selectedLevelId];

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouchDevice ? 1.25 : 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = !isTouchDevice;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
root.append(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ecde5);
scene.fog = new THREE.FogExp2(0x90cfe4, 0.0055);

const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.1, 500);
const clock = new THREE.Clock();
const fixedStep = 1 / 120;
let simulationAccumulator = 0;
const raycaster = new THREE.Raycaster();
raycaster.far = 82;
const cameraCollisionRay = new THREE.Ray();
const cameraCollisionBox = new THREE.Box3();
const cameraCollisionPoint = new THREE.Vector3();

scene.add(new THREE.HemisphereLight(0xd7f5ff, 0x493d53, 2.2));
const sun = new THREE.DirectionalLight(0xfff0ca, 3.2);
sun.position.set(-45, 75, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(isTouchDevice ? 1024 : 2048, isTouchDevice ? 1024 : 2048);
sun.shadow.camera.left = -85;
sun.shadow.camera.right = 85;
sun.shadow.camera.top = 85;
sun.shadow.camera.bottom = -85;
scene.add(sun);

function createBlockTexture(baseColor, accentColor, pattern) {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const context = canvas.getContext('2d');
  context.fillStyle = baseColor;
  context.fillRect(0, 0, 16, 16);

  if (pattern === 'brick') {
    context.strokeStyle = accentColor;
    context.lineWidth = 1;
    for (let y = 0; y <= 16; y += 4) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(16, y);
      context.stroke();
      const offset = (y / 4) % 2 ? 4 : 0;
      for (let x = offset; x <= 16; x += 8) {
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x, y + 4);
        context.stroke();
      }
    }
  } else if (pattern === 'metal') {
    context.strokeStyle = accentColor;
    context.lineWidth = 1;
    context.strokeRect(.5, .5, 15, 15);
    context.fillStyle = accentColor;
    for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) context.fillRect(x, y, 1, 1);
    context.fillRect(1, 7, 14, 1);
  } else {
    context.fillStyle = accentColor;
    for (let index = 0; index < 28; index += 1) {
      const x = (index * 11 + index * index * 3) % 15;
      const y = (index * 7 + index * index * 5) % 15;
      const size = pattern === 'earth' || pattern === 'grass' ? 1 + index % 2 : 1;
      context.fillRect(x, y, size, size);
    }
    if (pattern === 'earth') {
      context.fillStyle = '#78a75d';
      context.fillRect(0, 0, 16, 3);
      context.fillStyle = '#6a974f';
      for (let x = 0; x < 16; x += 4) context.fillRect(x, 3, 2, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const blockTextures = {
  brick: createBlockTexture('#b95b48', '#71362f', 'brick'),
  concrete: createBlockTexture('#aab0b4', '#7f878c', 'concrete'),
  darkConcrete: createBlockTexture('#5d626c', '#3e434c', 'concrete'),
  metal: createBlockTexture('#6f8790', '#344a52', 'metal'),
  earth: createBlockTexture('#795438', '#503824', 'earth'),
  grass: createBlockTexture('#65934f', '#3f6937', 'grass'),
};

const earthSideMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, map: blockTextures.earth, roughness: 1 });
const earthTopMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, map: blockTextures.grass, roughness: 1 });

const materials = {
  concrete: new THREE.MeshStandardMaterial({ color: 0xffffff, map: blockTextures.concrete, roughness: .84 }),
  darkConcrete: new THREE.MeshStandardMaterial({ color: 0xffffff, map: blockTextures.darkConcrete, roughness: .9 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x337c91, roughness: .35, metalness: .2 }),
  brick: new THREE.MeshStandardMaterial({ color: 0xffffff, map: blockTextures.brick, roughness: .9 }),
  roof: new THREE.MeshStandardMaterial({ color: 0x272b31, roughness: .8 }),
  grass: new THREE.MeshStandardMaterial({ color: 0x52985a, roughness: 1 }),
  signal: new THREE.MeshStandardMaterial({ color: 0xf2b83f, emissive: 0x6f3900, emissiveIntensity: 1.3 }),
  metal: new THREE.MeshStandardMaterial({ color: 0xffffff, map: blockTextures.metal, roughness: .32, metalness: .62 }),
  earth: [earthSideMaterial, earthSideMaterial, earthTopMaterial, earthSideMaterial, earthSideMaterial, earthSideMaterial],
  windowBlock: new THREE.MeshStandardMaterial({ color: 0x60b8d2, roughness: .18, metalness: .25, emissive: 0x153f50, emissiveIntensity: .45 }),
  doorBlock: new THREE.MeshStandardMaterial({ color: 0x29343b, roughness: .48, metalness: .55 }),
};

const lavaCanvas = document.createElement('canvas');
lavaCanvas.width = 64;
lavaCanvas.height = 64;
const lavaContext = lavaCanvas.getContext('2d');
const lavaTexture = new THREE.CanvasTexture(lavaCanvas);
lavaTexture.wrapS = THREE.RepeatWrapping;
lavaTexture.wrapT = THREE.RepeatWrapping;
lavaTexture.magFilter = THREE.NearestFilter;
lavaTexture.minFilter = THREE.NearestFilter;
lavaTexture.repeat.set(18, 18);
lavaTexture.colorSpace = THREE.SRGBColorSpace;

function paintLavaTexture(colorHex) {
  const base = new THREE.Color(colorHex);
  const dark = base.clone().multiplyScalar(.48);
  dark.r = Math.max(dark.r, .28);
  dark.g = Math.max(dark.g, .035);
  dark.b = Math.max(dark.b, .018);
  const molten = base.clone().multiplyScalar(1.25);
  const hot = new THREE.Color(0xff9d24);
  const core = new THREE.Color(0xffe06a);
  const image = lavaContext.createImageData(64, 64);
  for (let y = 0; y < 64; y += 1) {
    for (let x = 0; x < 64; x += 1) {
      const broad = Math.sin(x * .34 + Math.sin(y * .15) * 2.4) * .5 + .5;
      const detail = Math.sin(y * .71 + x * .29) * .5 + .5;
      const value = broad * .68 + detail * .32;
      const color = value < .17 ? dark : value > .82 ? core : value > .62 ? hot : molten;
      const offset = (y * 64 + x) * 4;
      image.data[offset] = Math.round(color.r * 255);
      image.data[offset + 1] = Math.round(color.g * 255);
      image.data[offset + 2] = Math.round(color.b * 255);
      image.data[offset + 3] = 255;
    }
  }
  lavaContext.putImageData(image, 0, 0);
  lavaTexture.needsUpdate = true;
}

paintLavaTexture(activeLevel.rift);
const riftMaterial = new THREE.MeshBasicMaterial({ map: lavaTexture, side: THREE.DoubleSide });
const riftGlow = new THREE.PointLight(activeLevel.rift, isTouchDevice ? 0 : 14, 95, 2);
riftGlow.position.set(0, -10, 0);
scene.add(riftGlow);

const blockTypes = {
  anchor: { name: 'Якорь', placed: 'Якорь установлен', material: materials.signal, device: true },
  brick: { name: 'Кирпич', placed: 'Кирпичный блок установлен', mined: 'Кирпич добыт', material: materials.brick },
  concrete: { name: 'Бетон', placed: 'Бетонный блок установлен', mined: 'Бетон добыт', material: materials.concrete },
  metal: { name: 'Металл', placed: 'Металлический блок установлен', mined: 'Металл добыт', material: materials.metal },
  earth: { name: 'Земля', placed: 'Блок земли установлен', mined: 'Земля добыта', material: materials.earth },
};
const blockSize = 2.5;
const worldVoxelSize = blockSize;
let selectedBlockType = localStorage.getItem('cubic-rift-block') || 'anchor';
if (!blockTypes[selectedBlockType]) selectedBlockType = 'anchor';

const world = new THREE.Group();
scene.add(world);
const colliders = [];
const grappleMeshes = [];
const destructibleBlocks = [];
const environmentObjects = [];
const breakParticles = [];
const breakParticleGeometry = new THREE.BoxGeometry(.22, .22, .22);
const blockAssetTemplates = {};
let destroyedWorldBlocks;
let destroyedEnvironment;
let savedMaterials;
try {
  destroyedWorldBlocks = new Set(JSON.parse(localStorage.getItem('cubic-rift-world-diff') || '[]'));
} catch {
  destroyedWorldBlocks = new Set();
}
try {
  destroyedEnvironment = new Set(JSON.parse(localStorage.getItem('cubic-rift-environment-diff') || '[]'));
} catch {
  destroyedEnvironment = new Set();
}
try {
  savedMaterials = JSON.parse(localStorage.getItem('cubic-rift-materials') || '{}');
} catch {
  savedMaterials = {};
}

function addBox({ position, size, material, grapple = true, collider = true, castShadow = true }) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
  mesh.position.copy(position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  mesh.userData.grapple = grapple;
  world.add(mesh);
  if (grapple) grappleMeshes.push(mesh);
  if (collider) {
    const half = size.clone().multiplyScalar(.5);
    colliders.push({ mesh, min: position.clone().sub(half), max: position.clone().add(half) });
  }
  return mesh;
}

function addDestructibleBlock(id, position, material, resourceType, size = blockSize, assetType = resourceType) {
  if (destroyedWorldBlocks.has(id)) return null;
  const block = addBox({
    position,
    size: new THREE.Vector3(size, size, size),
    material,
    castShadow: !isTouchDevice,
  });
  block.userData.destructible = true;
  block.userData.worldBlockId = id;
  block.userData.resourceType = resourceType;
  block.userData.worldVoxelSize = size;
  block.userData.assetType = assetType;
  if (!isTouchDevice) {
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(block.geometry),
      new THREE.LineBasicMaterial({ color: 0x27313b, transparent: true, opacity: .45 }),
    );
    block.add(edges);
  }
  destructibleBlocks.push(block);
  if (assetType && !isTouchDevice) decorateBlock(block, assetType);
  return block;
}

function addVoxelCluster(prefix, origin, pattern, material, resourceType) {
  pattern.forEach(([x, y, z], index) => {
    addDestructibleBlock(
      `${prefix}-${index}`,
      origin.clone().add(new THREE.Vector3(x, y, z).multiplyScalar(blockSize)),
      material,
      resourceType,
    );
  });
}

function addIsland(x, z, width, depth, top = 0) {
  const foundationBottom = -13.6;
  const shelfTop = top - worldVoxelSize + .15;
  addBox({
    position: new THREE.Vector3(x, (foundationBottom + shelfTop - 3.2) * .5, z),
    size: new THREE.Vector3(width * .54, shelfTop - 3.2 - foundationBottom, depth * .54),
    material: materials.darkConcrete,
    grapple: false,
  });
  addBox({
    position: new THREE.Vector3(x, shelfTop - 1.6, z),
    size: new THREE.Vector3(width * .76, 3.2, depth * .76),
    material: materials.darkConcrete,
    grapple: false,
  });
  const columns = Math.max(1, Math.round(width / worldVoxelSize));
  const rows = Math.max(1, Math.round(depth / worldVoxelSize));
  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      addDestructibleBlock(
        `island-${x}-${z}-${column}-${row}`,
        new THREE.Vector3(
          x + (column - (columns - 1) * .5) * worldVoxelSize,
          top - worldVoxelSize * .5,
          z + (row - (rows - 1) * .5) * worldVoxelSize,
        ),
        materials.earth,
        'earth',
        worldVoxelSize,
      );
    }
  }
}

function addTower(prefix, x, z, width, depth, topHeight, baseY, material, resourceType) {
  const columns = Math.max(2, Math.round(width / worldVoxelSize));
  const rows = Math.max(2, Math.round(depth / worldVoxelSize));
  const floors = Math.max(2, Math.round((topHeight - baseY) / worldVoxelSize));
  for (let floor = 0; floor < floors; floor += 1) {
    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        const shell = column === 0 || column === columns - 1 || row === 0 || row === rows - 1 || floor === floors - 1;
        if (!shell) continue;
        const front = row === rows - 1;
        const isDoor = floor === 0 && front && column === Math.floor(columns * .5);
        const isWindow = !isDoor && floor > 0 && floor < floors - 1 && (front || row === 0) && column % 2 === floor % 2;
        addDestructibleBlock(
          `${prefix}-${column}-${floor}-${row}`,
          new THREE.Vector3(
            x + (column - (columns - 1) * .5) * worldVoxelSize,
            baseY + worldVoxelSize * .5 + floor * worldVoxelSize,
            z + (row - (rows - 1) * .5) * worldVoxelSize,
          ),
          isDoor ? materials.doorBlock : (isWindow ? materials.windowBlock : material),
          resourceType,
          worldVoxelSize,
          isDoor || isWindow ? null : resourceType,
        );
      }
    }
  }
}

addIsland(-30, 7, 19, 18);
addIsland(-11, -2, 14, 14, -1);
addIsland(9, -8, 17, 16, 1);
addIsland(31, 5, 20, 19, 3);
addTower('tower-queens', -12, -2, 8, 8, 16, -1, materials.brick, 'brick');
addTower('tower-midtown', 8, -8, 11, 10, 27, 1, materials.concrete, 'concrete');
addTower('tower-rift', 30, 5, 12, 12, 39, 3, materials.brick, 'brick');
addVoxelCluster('bridge-low', new THREE.Vector3(-1, 7, 1.6), [[0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4]], materials.metal, 'metal');
addVoxelCluster('bridge-high', new THREE.Vector3(17.3, 17, -.7), [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 0, 1], [1, 0, 1], [2, 0, 1]], materials.metal, 'metal');

const rubblePattern = [
  [0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0], [1, 1, 0],
  [0, 0, 1], [1, 0, 1], [0, 1, 1], [2, 0, 1],
];
addVoxelCluster('start-rubble', new THREE.Vector3(-25, 1.45, 2.4), rubblePattern, materials.brick, 'brick');
addVoxelCluster('middle-rubble', new THREE.Vector3(-7, .45, 2), rubblePattern, materials.concrete, 'concrete');
addVoxelCluster('high-rubble', new THREE.Vector3(13, 2.45, -3), rubblePattern, materials.metal, 'metal');

for (let index = 0; index < 34; index += 1) {
  const angle = index * 1.91;
  const radius = 75 + (index % 5) * 10;
  const height = 18 + (index * 17) % 54;
  addBox({
    position: new THREE.Vector3(Math.cos(angle) * radius, height * .5 - 8, Math.sin(angle) * radius),
    size: new THREE.Vector3(8 + index % 7, height, 8 + (index * 3) % 8),
    material: index % 3 === 0 ? materials.brick : materials.concrete,
    collider: false,
    castShadow: false,
  });
  addBox({
    position: new THREE.Vector3(Math.cos(angle) * radius, -11.1, Math.sin(angle) * radius),
    size: new THREE.Vector3((8 + index % 7) * .72, 6.2, (8 + (index * 3) % 8) * .72),
    material: materials.darkConcrete,
    grapple: false,
    collider: false,
    castShadow: false,
  });
}

const rift = new THREE.Mesh(new THREE.PlaneGeometry(310, 310), riftMaterial);
rift.rotation.x = -Math.PI * .5;
rift.position.y = -14.2;
scene.add(rift);

function makeHero() {
  const group = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xd92f32, roughness: .66 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x175ba3, roughness: .72 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf7f5ea, emissive: 0xffffff, emissiveIntensity: .22 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(.92, 1.05, .52), red);
  torso.position.y = 1.24;
  const hips = new THREE.Mesh(new THREE.BoxGeometry(.8, .48, .48), blue);
  hips.position.y = .55;
  const head = new THREE.Mesh(new THREE.BoxGeometry(.65, .7, .61), red);
  head.position.y = 2.07;
  const eyeGeometry = new THREE.BoxGeometry(.14, .24, .025);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeometry, white);
    eye.position.set(side * .17, 2.12, -.318);
    eye.rotation.z = side * -.25;
    group.add(eye);
  }
  const limbGeometry = new THREE.BoxGeometry(.23, .85, .25);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(limbGeometry, red);
    arm.position.set(side * .58, 1.18, 0);
    arm.name = `arm-${side}`;
    group.add(arm);
    const leg = new THREE.Mesh(limbGeometry, blue);
    leg.position.set(side * .25, .02, 0);
    leg.name = `leg-${side}`;
    group.add(leg);
  }
  group.add(torso, hips, head);
  group.traverse((part) => { if (part.isMesh) part.castShadow = true; });
  scene.add(group);
  return group;
}

const hero = makeHero();
const fallbackHeroParts = [...hero.children];
const gltfLoader = new GLTFLoader();
const characterConfigs = {
  scout: {
    model: './assets/models/characters/character-a.glb',
    speed: 1.12,
    pull: 1,
    blocks: 8,
  },
  bastion: {
    model: './assets/models/characters/character-h.glb',
    speed: .92,
    pull: 1,
    blocks: 12,
  },
  vector: {
    model: './assets/models/characters/character-q.glb',
    speed: 1,
    pull: 1.25,
    blocks: 8,
  },
};
let selectedCharacter = localStorage.getItem('cubic-rift-character') || 'scout';
if (!characterConfigs[selectedCharacter]) selectedCharacter = 'scout';
let characterConfig = characterConfigs[selectedCharacter];
let loadedHero = null;
let heroMixer = null;
let heroActions = {};
let currentHeroAction = null;
let characterLoadToken = 0;

const cityAssetSpecs = [
  { file: 'building-a.glb', position: [-46, -8, -23], height: 15, rotation: .35 },
  { file: 'building-f.glb', position: [48, -8, -20], height: 18, rotation: -.4 },
  { file: 'building-j.glb', position: [-43, -8, 34], height: 24, rotation: 2.5 },
  { file: 'building-skyscraper-a.glb', position: [55, -8, 26], height: 44, rotation: -2.2 },
  { file: 'building-skyscraper-c.glb', position: [5, -8, 57], height: 52, rotation: Math.PI },
];
const cityColliderMaterial = new THREE.MeshBasicMaterial({ visible: false });

const blockAssetSpecs = {
};

function createWebAnchorVisual(size) {
  const group = new THREE.Group();
  group.name = 'asset-shell';
  const material = new THREE.LineBasicMaterial({ color: 0xf7fbff, transparent: true, opacity: .95 });
  const createPlane = (rotation) => {
    const points = [];
    const radius = size * .47;
    for (let spoke = 0; spoke < 8; spoke += 1) {
      const angle = spoke / 8 * Math.PI * 2;
      points.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    }
    for (const ringScale of [.34, .66, 1]) {
      for (let segment = 0; segment < 8; segment += 1) {
        const a = segment / 8 * Math.PI * 2;
        const b = (segment + 1) / 8 * Math.PI * 2;
        points.push(
          new THREE.Vector3(Math.cos(a) * radius * ringScale, Math.sin(a) * radius * ringScale, 0),
          new THREE.Vector3(Math.cos(b) * radius * ringScale, Math.sin(b) * radius * ringScale, 0),
        );
      }
    }
    const web = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), material);
    web.rotation.copy(rotation);
    group.add(web);
  };
  createPlane(new THREE.Euler(0, 0, 0));
  createPlane(new THREE.Euler(0, Math.PI * .5, 0));
  createPlane(new THREE.Euler(Math.PI * .5, 0, 0));
  group.add(new THREE.Mesh(new THREE.SphereGeometry(size * .08, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })));
  return group;
}

function decorateBlock(block, blockType) {
  if (blockType === 'anchor') {
    if (!block.getObjectByName('asset-shell')) block.add(createWebAnchorVisual(blockSize));
    return;
  }
  const template = blockAssetTemplates[blockType];
  if (!template || block.getObjectByName('asset-shell')) return;
  const shell = template.clone(true);
  shell.name = 'asset-shell';
  shell.updateMatrixWorld(true);
  let bounds = new THREE.Box3().setFromObject(shell);
  const size = bounds.getSize(new THREE.Vector3());
  const targetSize = block.userData.worldVoxelSize || blockSize;
  shell.scale.setScalar(targetSize * 1.025 / Math.max(size.x, size.y, size.z, .01));
  shell.updateMatrixWorld(true);
  bounds = new THREE.Box3().setFromObject(shell);
  const center = bounds.getCenter(new THREE.Vector3());
  shell.position.sub(center);
  shell.traverse((part) => {
    if (!part.isMesh) return;
    part.castShadow = !isTouchDevice;
    part.receiveShadow = true;
  });
  block.add(shell);
}

function loadBlockAssets() {
  Object.entries(blockAssetSpecs).forEach(([blockType, file]) => {
    gltfLoader.load(`./assets/models/blocks/${file}`, (gltf) => {
      blockAssetTemplates[blockType] = gltf.scene;
      destructibleBlocks.forEach((block) => {
        if (isTouchDevice) return;
        if (block.userData.assetType) decorateBlock(block, block.userData.assetType);
      });
      placedBlocks.forEach((block) => decorateBlock(block, block.userData.blockType));
    });
  });
}

const streetAssetSpecs = [
  { folder: 'roads', file: 'road-straight.glb', position: [-30, .02, 7], size: 13, rotation: 0 },
  { folder: 'roads', file: 'road-crossroad.glb', position: [-11, -.98, -2], size: 10, rotation: 0 },
  { folder: 'roads', file: 'road-curve.glb', position: [9, 1.02, -8], size: 12, rotation: Math.PI * .5 },
  { folder: 'roads', file: 'road-straight.glb', position: [31, 3.02, 5], size: 14, rotation: Math.PI * .5 },
  { id: 'lamp-west', folder: 'roads', file: 'light-curved.glb', position: [-35, .02, 2], height: 5.2, rotation: Math.PI, destructible: true },
  { id: 'lamp-east', folder: 'roads', file: 'light-curved.glb', position: [-25, .02, 12], height: 5.2, rotation: 0, destructible: true },
  { id: 'traffic-light', folder: 'roads', file: 'traffic-light.glb', position: [-15, -.98, 2], height: 4.5, rotation: Math.PI, destructible: true },
  { id: 'stop-sign', folder: 'roads', file: 'road-sign-stop.glb', position: [-7, -.98, -6], height: 2.6, rotation: -.5, destructible: true },
  { id: 'warning-sign', folder: 'roads', file: 'road-sign-warning.glb', position: [3, 1.02, -3], height: 2.8, rotation: .7, destructible: true },
  { id: 'barrier', folder: 'roads', file: 'construction-barrier.glb', position: [25, 3.02, 0], size: 2.8, rotation: .3, destructible: true },
  { id: 'taxi', folder: 'cars', file: 'taxi.glb', position: [-31, .2, 7], size: 5.2, rotation: Math.PI * .5, destructible: true },
  { id: 'sedan', folder: 'cars', file: 'sedan.glb', position: [-9, -.8, -1], size: 5, rotation: -.3, destructible: true },
  { id: 'police', folder: 'cars', file: 'police.glb', position: [10, 1.2, -7], size: 5.1, rotation: Math.PI, destructible: true },
  { id: 'delivery', folder: 'cars', file: 'delivery.glb', position: [31, 3.2, 5], size: 5.8, rotation: Math.PI * .5, destructible: true },
  { id: 'van', folder: 'cars', file: 'van.glb', position: [26, 3.2, 10], size: 5.2, rotation: -.4, destructible: true },
];

function registerEnvironmentObject(root, id, resourceType = 'metal') {
  root.userData.environmentObject = true;
  root.userData.environmentId = id;
  root.userData.resourceType = resourceType;
  root.traverse((part) => {
    if (!part.isMesh) return;
    part.userData.environmentRoot = root;
    part.userData.grapple = true;
    grappleMeshes.push(part);
  });
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const colliderMesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), cityColliderMaterial);
  colliderMesh.position.copy(center);
  colliderMesh.visible = false;
  world.add(colliderMesh);
  const collider = { mesh: colliderMesh, min: bounds.min.clone(), max: bounds.max.clone() };
  colliders.push(collider);
  root.userData.collider = collider;
  environmentObjects.push(root);
}

function loadCityAssets() {
  cityAssetSpecs.forEach((spec) => {
    gltfLoader.load(`./assets/models/city/${spec.file}`, (gltf) => {
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      let bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      model.scale.setScalar(spec.height / Math.max(size.y, .01));
      model.updateMatrixWorld(true);
      bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.set(spec.position[0] - center.x, spec.position[1] - bounds.min.y, spec.position[2] - center.z);
      model.rotation.y = spec.rotation;
      model.traverse((part) => {
        if (part.isMesh) {
          part.castShadow = !isTouchDevice;
          part.receiveShadow = true;
          part.userData.grapple = true;
          grappleMeshes.push(part);
        }
      });
      scene.add(model);
      model.updateMatrixWorld(true);
      const worldBounds = new THREE.Box3().setFromObject(model);
      if (worldBounds.min.y > -14.1) {
        const foundationHeight = worldBounds.min.y + 14.1;
        const foundationSize = worldBounds.getSize(new THREE.Vector3()).multiply(new THREE.Vector3(.72, 1, .72));
        addBox({
          position: new THREE.Vector3(worldBounds.getCenter(new THREE.Vector3()).x, -14.1 + foundationHeight * .5, worldBounds.getCenter(new THREE.Vector3()).z),
          size: new THREE.Vector3(foundationSize.x, foundationHeight, foundationSize.z),
          material: materials.darkConcrete,
          grapple: false,
          collider: false,
          castShadow: false,
        });
      }
      const colliderSize = worldBounds.getSize(new THREE.Vector3());
      const colliderCenter = worldBounds.getCenter(new THREE.Vector3());
      const colliderMesh = new THREE.Mesh(
        new THREE.BoxGeometry(colliderSize.x, colliderSize.y, colliderSize.z),
        cityColliderMaterial,
      );
      colliderMesh.position.copy(colliderCenter);
      colliderMesh.visible = false;
      world.add(colliderMesh);
      colliders.push({ mesh: colliderMesh, min: worldBounds.min.clone(), max: worldBounds.max.clone() });
    });
  });
}

function loadStreetAssets() {
  streetAssetSpecs.forEach((spec) => {
    if (spec.destructible && destroyedEnvironment.has(spec.id)) return;
    gltfLoader.load(`./assets/models/${spec.folder}/${spec.file}`, (gltf) => {
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      let bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const sourceMeasure = spec.height ? size.y : Math.max(size.x, size.z);
      model.scale.setScalar((spec.height || spec.size) / Math.max(sourceMeasure, .01));
      model.rotation.y = spec.rotation;
      model.updateMatrixWorld(true);
      bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.set(spec.position[0] - center.x, spec.position[1] - bounds.min.y, spec.position[2] - center.z);
      model.traverse((part) => {
        if (!part.isMesh) return;
        part.castShadow = !isTouchDevice && spec.folder === 'cars';
        part.receiveShadow = true;
        if (spec.folder === 'cars' && !spec.destructible) {
          part.userData.grapple = true;
          grappleMeshes.push(part);
        }
      });
      scene.add(model);
      if (spec.destructible) {
        registerEnvironmentObject(model, spec.id, 'metal');
      } else if (spec.folder === 'cars') {
        model.updateMatrixWorld(true);
        const worldBounds = new THREE.Box3().setFromObject(model);
        const colliderSize = worldBounds.getSize(new THREE.Vector3());
        const colliderCenter = worldBounds.getCenter(new THREE.Vector3());
        const colliderMesh = new THREE.Mesh(
          new THREE.BoxGeometry(colliderSize.x, colliderSize.y, colliderSize.z),
          cityColliderMaterial,
        );
        colliderMesh.position.copy(colliderCenter);
        colliderMesh.visible = false;
        world.add(colliderMesh);
        colliders.push({ mesh: colliderMesh, min: worldBounds.min.clone(), max: worldBounds.max.clone() });
      }
    });
  });
}

function addUrbanGreenery() {
  const treePositions = [
    [-37, .1, 12], [-35, .1, 1], [-24, .1, 1], [-23, .1, 13],
    [-16, -.9, -6], [-6, -.9, -6], [3, 1.1, -13], [14, 1.1, -13],
    [24, 3.1, -1], [37, 3.1, -1], [24, 3.1, 11], [37, 3.1, 11],
  ];
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x76543b, roughness: 1 });
  const crownMaterial = new THREE.MeshStandardMaterial({ color: 0x3f8655, roughness: .95 });
  const trunkGeometry = new THREE.CylinderGeometry(.28, .38, 2.7, 6);
  const crownGeometry = new THREE.DodecahedronGeometry(1.65, 0);
  treePositions.forEach(([x, y, z], index) => {
    const id = `tree-${index}`;
    if (destroyedEnvironment.has(id)) return;
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1.35;
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.y = 3.25;
    crown.rotation.y = index * .73;
    crown.scale.y = .9 + index % 3 * .08;
    tree.add(trunk, crown);
    tree.position.set(x, y, z);
    tree.traverse((part) => {
      if (!part.isMesh) return;
      part.castShadow = !isTouchDevice;
      part.receiveShadow = true;
    });
    scene.add(tree);
    registerEnvironmentObject(tree, id, 'earth');
  });
}

function selectCharacter(characterId) {
  if (!characterConfigs[characterId]) return;
  selectedCharacter = characterId;
  characterConfig = characterConfigs[characterId];
  localStorage.setItem('cubic-rift-character', characterId);
  ui.characterCards.forEach((card) => card.classList.toggle('selected', card.dataset.character === characterId));
  resetBlockInventory();

  const loadToken = ++characterLoadToken;
  gltfLoader.load(characterConfig.model, (gltf) => {
    if (loadToken !== characterLoadToken) return;
    if (loadedHero) hero.remove(loadedHero);
    loadedHero = gltf.scene;
    loadedHero.updateMatrixWorld(true);
    let bounds = new THREE.Box3().setFromObject(loadedHero);
    const size = bounds.getSize(new THREE.Vector3());
    loadedHero.scale.setScalar(2.3 / Math.max(size.y, .01));
    loadedHero.updateMatrixWorld(true);
    bounds = new THREE.Box3().setFromObject(loadedHero);
    const center = bounds.getCenter(new THREE.Vector3());
    loadedHero.position.set(-center.x, -bounds.min.y, -center.z);
    loadedHero.rotation.y = 0;
    loadedHero.traverse((part) => {
      if (part.isMesh) {
        part.castShadow = true;
        part.receiveShadow = true;
      }
    });
    fallbackHeroParts.forEach((part) => { part.visible = false; });
    hero.add(loadedHero);
    heroMixer = gltf.animations.length ? new THREE.AnimationMixer(loadedHero) : null;
    heroActions = {};
    currentHeroAction = null;
    if (heroMixer) {
      for (const clip of gltf.animations) heroActions[clip.name] = heroMixer.clipAction(clip);
      setHeroAnimation('idle', true);
    }
  }, undefined, () => {
    fallbackHeroParts.forEach((part) => { part.visible = true; });
  });
}

function setHeroAnimation(name, immediate = false) {
  if (!heroMixer) return;
  const nextAction = heroActions[name] || heroActions.idle || Object.values(heroActions)[0];
  if (!nextAction || currentHeroAction === nextAction) return;
  hero.userData.animationState = name;
  renderer.domElement.dataset.animationState = name;
  nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
  if (currentHeroAction) {
    if (immediate) currentHeroAction.stop();
    else currentHeroAction.crossFadeTo(nextAction, .18, false);
  }
  currentHeroAction = nextAction;
}

function updateHeroAnimation(horizontalSpeed) {
  if (webPoint) setHeroAnimation('holding-both');
  else if (!player.grounded) setHeroAnimation('sprint');
  else if (horizontalSpeed > 7) setHeroAnimation('sprint');
  else if (horizontalSpeed > .8) setHeroAnimation('walk');
  else setHeroAnimation('idle');
}

const player = {
  position: new THREE.Vector3(...activeLevel.start),
  previous: new THREE.Vector3(...activeLevel.start),
  velocity: new THREE.Vector3(),
  grounded: false,
  wallNormal: new THREE.Vector3(),
  wallRunTime: 0,
};

function makeCitizen() {
  const group = new THREE.Group();
  const coat = new THREE.MeshStandardMaterial({ color: 0xf2b83f, roughness: .8 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd89b78, roughness: .9 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.34, .45, 1.15, 6), coat);
  body.position.y = .8;
  const head = new THREE.Mesh(new THREE.BoxGeometry(.52, .52, .52), skin);
  head.position.y = 1.62;
  group.add(body, head);
  group.position.set(30, 39.8, 5);
  group.traverse((part) => { if (part.isMesh) part.castShadow = true; });
  scene.add(group);
  return group;
}

const citizen = makeCitizen();
let routeTargets = activeLevel.route.map((point) => new THREE.Vector3(...point));
const citizenBeacon = new THREE.Mesh(
  new THREE.TorusGeometry(1.35, .08, 8, 32),
  new THREE.MeshBasicMaterial({ color: 0xf2b83f }),
);
citizenBeacon.rotation.x = Math.PI * .5;
citizenBeacon.position.copy(citizen.position).add(new THREE.Vector3(0, .1, 0));
scene.add(citizenBeacon);

const portal = new THREE.Mesh(
  new THREE.TorusGeometry(2.25, .16, 10, 48),
  new THREE.MeshStandardMaterial({ color: 0x46d5f2, emissive: 0x46d5f2, emissiveIntensity: 2 }),
);
portal.rotation.x = Math.PI * .5;
portal.position.set(...activeLevel.portal);
scene.add(portal);

const checkpointGroup = new THREE.Group();
scene.add(checkpointGroup);

function rebuildCheckpointRings() {
  while (checkpointGroup.children.length) {
    const ring = checkpointGroup.children[0];
    checkpointGroup.remove(ring);
    ring.geometry.dispose();
    ring.material.dispose();
  }
  if (activeLevel.kind === 'rescue') return;
  routeTargets.forEach((target, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, .12, 8, 36),
      new THREE.MeshStandardMaterial({
        color: index === 0 ? 0xf2b83f : 0x46d5f2,
        emissive: index === 0 ? 0xf2b83f : 0x1b7286,
        emissiveIntensity: 1.8,
      }),
    );
    ring.rotation.x = Math.PI * .5;
    ring.position.copy(target).add(new THREE.Vector3(0, .25, 0));
    ring.userData.routeIndex = index;
    checkpointGroup.add(ring);
  });
}

function updateCheckpointRings() {
  checkpointGroup.children.forEach((ring) => {
    const index = ring.userData.routeIndex;
    ring.visible = index >= routeIndex;
    const active = index === routeIndex;
    ring.scale.setScalar(active ? 1 + Math.sin(elapsed * 5) * .08 : .82);
    ring.material.color.setHex(active ? 0xf2b83f : 0x46d5f2);
    ring.material.emissive.setHex(active ? 0xf2b83f : 0x1b7286);
    ring.rotation.z += active ? .018 : .006;
  });
}

const rope = new THREE.Group();
const ropeCore = new THREE.Mesh(
  new THREE.CylinderGeometry(.035, .035, 1, 8),
  new THREE.MeshBasicMaterial({ color: 0xffffff }),
);
const ropeOutline = new THREE.Mesh(
  new THREE.CylinderGeometry(.055, .055, 1, 8),
  new THREE.MeshBasicMaterial({ color: 0x183348, side: THREE.BackSide }),
);
rope.add(ropeOutline, ropeCore);
rope.visible = false;
scene.add(rope);

const keys = new Set();
const touchMove = new THREE.Vector2();
const placedBlocks = [];
let blockInventory = {};
let yaw = -.7;
let pitch = -.12;
let started = false;
let completed = false;
let rescued = false;
let webPoint = null;
let ropeLength = 0;
let elapsed = 0;
let runPath = [];
let pathSampleClock = 0;
let toastTimer = 0;
let currentAim = null;
let currentAimHit = null;
let fallCount = 0;
let jumpQueued = false;
let routeIndex = 0;
const respawnPoint = new THREE.Vector3(...activeLevel.start);
let miningTarget = null;
let miningProgress = 0;
let miningActive = false;
let miningAssisted = false;
const tutorialTasks = [
  { action: 'mine', label: 'ОБУЧЕНИЕ 1 / 3', objective: 'Добудьте ресурсный куб' },
  { action: 'build', label: 'ОБУЧЕНИЕ 2 / 3', objective: 'Поставьте добытый блок' },
  { action: 'web', label: 'ОБУЧЕНИЕ 3 / 3', objective: 'Зацепитесь за свой блок' },
];
let tutorialStep = campaignState.tutorialComplete ? tutorialTasks.length : 0;

const legacyBest = JSON.parse(localStorage.getItem('cubic-rift-best') || 'null');
if (legacyBest && !campaignState.best.queens) campaignState.best.queens = legacyBest;
let best = campaignState.best[selectedLevelId] || null;
ui.bestTime.textContent = best ? formatTime(best.time) : '--:--.---';

const ghostMaterial = new THREE.MeshBasicMaterial({ color: 0x46d5f2, transparent: true, opacity: .34 });
const ghost = new THREE.Mesh(new THREE.BoxGeometry(.85, 1.8, .52), ghostMaterial);
ghost.visible = Boolean(best?.path?.length);
scene.add(ghost);

function formatTime(value) {
  const minutes = Math.floor(value / 60).toString().padStart(2, '0');
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  const millis = Math.floor((value % 1) * 1000).toString().padStart(3, '0');
  return `${minutes}:${seconds}.${millis}`;
}

function saveCampaign() {
  localStorage.setItem('cubic-rift-campaign', JSON.stringify(campaignState));
}

function updateLevelMenu() {
  ui.levelCards.forEach((card) => {
    const levelId = card.dataset.level;
    const levelIndex = levelOrder.indexOf(levelId);
    const locked = levelIndex >= campaignState.unlocked;
    card.disabled = locked;
    card.classList.toggle('locked', locked);
    card.classList.toggle('selected', levelId === selectedLevelId);
    const bestLabel = card.querySelector(`[data-level-best="${levelId}"]`);
    if (bestLabel) {
      const levelBest = campaignState.best[levelId];
      bestLabel.textContent = locked ? 'ЗАКРЫТО' : (levelBest ? formatTime(levelBest.time) : 'НЕ ПРОЙДЕН');
    }
  });
  updateLeaderboard();
}

function getLeaderboard(levelId) {
  const entries = (leaderboardRivals[levelId] || []).map(([name, time]) => ({ name, time, player: false }));
  const playerBest = campaignState.best[levelId]?.time;
  if (Number.isFinite(playerBest)) entries.push({ name: 'ВЫ', time: playerBest, player: true });
  entries.sort((left, right) => left.time - right.time);
  return {
    entries,
    playerRank: Number.isFinite(playerBest) ? entries.findIndex((entry) => entry.player) + 1 : null,
  };
}

function updateLeaderboard() {
  const { entries, playerRank } = getLeaderboard(selectedLevelId);
  const visible = entries.slice(0, 3);
  if (playerRank && playerRank > 3) visible.push(entries[playerRank - 1]);
  else if (playerRank) visible.push(entries.find((entry, index) => index >= 3 && !entry.player) || entries[playerRank - 1]);
  else visible.push({ name: 'ВЫ', time: null, player: true });

  ui.leaderboardList.replaceChildren();
  visible.forEach((entry) => {
    const rank = entry.time === null ? null : entries.indexOf(entry) + 1;
    const item = document.createElement('li');
    item.classList.toggle('player', entry.player);
    const rankLabel = document.createElement('b');
    rankLabel.textContent = rank ? `#${rank}` : '#—';
    const name = document.createElement('span');
    name.textContent = entry.name;
    const time = document.createElement('time');
    time.textContent = entry.time === null ? 'НЕТ РЕЗУЛЬТАТА' : formatTime(entry.time);
    item.append(rankLabel, name, time);
    ui.leaderboardList.append(item);
  });
  ui.playerRank.textContent = playerRank ? `ВАШЕ МЕСТО #${playerRank}` : 'ВАШЕ МЕСТО —';
}

function selectLevel(levelId) {
  const levelIndex = levelOrder.indexOf(levelId);
  if (!levelConfigs[levelId] || levelIndex < 0 || levelIndex >= campaignState.unlocked) return;
  selectedLevelId = levelId;
  activeLevel = levelConfigs[levelId];
  localStorage.setItem('cubic-rift-level', levelId);
  routeTargets = activeLevel.route.map((point) => new THREE.Vector3(...point));
  citizen.position.set(...activeLevel.citizen);
  citizenBeacon.position.copy(citizen.position).add(new THREE.Vector3(0, .1, 0));
  portal.position.set(...activeLevel.portal);
  scene.background.setHex(activeLevel.sky);
  scene.fog.color.setHex(activeLevel.fog);
  paintLavaTexture(activeLevel.rift);
  riftGlow.color.setHex(activeLevel.rift);
  sun.color.setHex(activeLevel.sun);
  best = campaignState.best[levelId] || null;
  ui.bestTime.textContent = best ? formatTime(best.time) : '--:--.---';
  ui.levelKicker.textContent = `РАЙОН ${activeLevel.number} // ${activeLevel.name}`;
  ui.missionCopy.textContent = activeLevel.description;
  player.position.set(...activeLevel.start);
  player.previous.copy(player.position);
  hero.position.copy(player.position);
  rebuildCheckpointRings();
  updateLevelMenu();
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add('show');
  toastTimer = 2.2;
}

function updateObjectivePanel() {
  if (tutorialStep < tutorialTasks.length) {
    const task = tutorialTasks[tutorialStep];
    ui.objectiveLabel.textContent = task.label;
    ui.objective.textContent = task.objective;
    ui.progress.style.width = `${18 + tutorialStep * 25}%`;
    return;
  }
  if (activeLevel.kind === 'rescue') {
    ui.objectiveLabel.textContent = rescued ? 'ВОЗВРАЩЕНИЕ' : 'СИГНАЛ БЕДСТВИЯ';
    ui.objective.textContent = rescued ? 'Вернитесь к порталу' : 'Доберитесь до жителя';
    ui.progress.style.width = rescued ? '65%' : `${14 + routeIndex * 12}%`;
    return;
  }
  const completedTargets = Math.min(routeIndex, routeTargets.length);
  ui.objectiveLabel.textContent = activeLevel.kind === 'relay' ? 'ЭНЕРГОСЕТЬ' : 'СКОРОСТНОЙ МАРШРУТ';
  ui.objective.textContent = activeLevel.kind === 'relay'
    ? `Активируйте узлы: ${completedTargets} / ${routeTargets.length}`
    : `Пройдите кольца: ${completedTargets} / ${routeTargets.length}`;
  ui.progress.style.width = `${Math.max(8, completedTargets / routeTargets.length * 100)}%`;
}

function advanceTutorial(action) {
  if (tutorialStep >= tutorialTasks.length || tutorialTasks[tutorialStep].action !== action) return;
  tutorialStep += 1;
  if (tutorialStep >= tutorialTasks.length) {
    localStorage.setItem('cubic-rift-tutorial-complete', '1');
    campaignState.tutorialComplete = true;
    saveCampaign();
    const boost = camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize();
    player.velocity.addScaledVector(boost, 8);
    player.velocity.y = Math.max(player.velocity.y, 5);
    pulseHaptics([20, 35, 40]);
    showToast('Связка завершена · импульс!');
  }
  updateObjectivePanel();
}

function pulseHaptics(pattern = 18) {
  if (isTouchDevice) navigator.vibrate?.(pattern);
}

function selectBlockType(blockType) {
  if (!blockTypes[blockType]) return;
  selectedBlockType = blockType;
  localStorage.setItem('cubic-rift-block', blockType);
  ui.blockChoices.forEach((choice) => choice.classList.toggle('selected', choice.dataset.block === blockType));
  updateBlockCount();
}

function saveMaterialInventory() {
  const materialsToSave = {
    brick: blockInventory.brick || 0,
    concrete: blockInventory.concrete || 0,
    metal: blockInventory.metal || 0,
    earth: blockInventory.earth || 0,
  };
  localStorage.setItem('cubic-rift-materials', JSON.stringify(materialsToSave));
  savedMaterials = materialsToSave;
}

function resetBlockInventory() {
  blockInventory = {
    anchor: characterConfig.blocks,
    brick: Math.max(0, Number(savedMaterials.brick) || 0),
    concrete: Math.max(0, Number(savedMaterials.concrete) || 0),
    metal: Math.max(0, Number(savedMaterials.metal) || 0),
    earth: Math.max(0, Number(savedMaterials.earth) || 0),
  };
  updateBlockCount();
}

function changeBlockCount(blockType, amount) {
  blockInventory[blockType] = Math.max(0, (blockInventory[blockType] || 0) + amount);
  if (!blockTypes[blockType].device) saveMaterialInventory();
  updateBlockCount();
}

function requestGamePointerLock() {
  if (isTouchDevice || document.pointerLockElement === renderer.domElement) return;
  try {
    const request = renderer.domElement.requestPointerLock();
    request?.catch(() => {});
  } catch {
    // The game remains paused until the player clicks the canvas again.
  }
}

function resetRun(lockPointer = !isTouchDevice) {
  player.position.set(...activeLevel.start);
  player.previous.copy(player.position);
  player.velocity.set(0, 0, 0);
  player.wallRunTime = 0;
  yaw = -.7;
  pitch = -.12;
  rescued = false;
  completed = false;
  elapsed = 0;
  runPath = [];
  pathSampleClock = 0;
  fallCount = 0;
  routeIndex = 0;
  respawnPoint.set(...activeLevel.start);
  stopMining();
  citizen.position.set(...activeLevel.citizen);
  citizenBeacon.position.copy(citizen.position).add(new THREE.Vector3(0, .1, 0));
  citizen.visible = activeLevel.kind === 'rescue';
  citizenBeacon.visible = activeLevel.kind === 'rescue';
  portal.position.set(...activeLevel.portal);
  portal.visible = true;
  ui.result.hidden = true;
  ui.hud.classList.remove('muted');
  tutorialStep = selectedLevelId === 'queens' && !campaignState.tutorialComplete
    ? 0
    : tutorialTasks.length;
  updateObjectivePanel();
  releaseWeb();
  while (placedBlocks.length) removePlacedBlock(placedBlocks[0], true);
  resetBlockInventory();
  rebuildCheckpointRings();
  if (lockPointer) requestGamePointerLock();
}

function startGame() {
  if (isTouchDevice) screen.orientation?.lock?.('landscape')?.catch?.(() => {});
  started = true;
  ui.start.hidden = true;
  ui.hud.classList.remove('muted');
  resetRun(!isTouchDevice);
}

function finishRun() {
  if (completed) return;
  completed = true;
  ui.hud.classList.add('muted');
  releaseWeb();
  if (document.pointerLockElement) document.exitPointerLock();
  const isRecord = !best || elapsed < best.time;
  if (isRecord) {
    best = { time: elapsed, path: runPath };
    campaignState.best[selectedLevelId] = best;
    ui.bestTime.textContent = formatTime(elapsed);
  }
  const levelIndex = levelOrder.indexOf(selectedLevelId);
  campaignState.completed[selectedLevelId] = true;
  campaignState.unlocked = Math.max(campaignState.unlocked, Math.min(levelOrder.length, levelIndex + 2));
  saveCampaign();
  updateLevelMenu();
  ui.resultTitle.textContent = `${activeLevel.name} ЗАВЕРШЁН`;
  ui.resultTime.textContent = formatTime(elapsed);
  const placement = getLeaderboard(selectedLevelId).playerRank;
  ui.resultRecord.textContent = isRecord
    ? `Новый рекорд · место #${placement}`
    : `Рекорд ${formatTime(best.time)} · место #${placement}`;
  ui.nextLevel.hidden = levelIndex >= levelOrder.length - 1;
  ui.result.hidden = false;
}

function showLevelMenu() {
  started = false;
  completed = false;
  releaseWeb();
  if (document.pointerLockElement) document.exitPointerLock();
  ui.result.hidden = true;
  ui.start.hidden = false;
  ui.hud.classList.add('muted');
  selectLevel(selectedLevelId);
}

function startNextLevel() {
  const nextLevelId = levelOrder[levelOrder.indexOf(selectedLevelId) + 1];
  if (!nextLevelId) return;
  selectLevel(nextLevelId);
  startGame();
}

function attachWeb() {
  if (!started || completed || !currentAim) return;
  webPoint = currentAim.clone();
  ropeLength = Math.max(2.5, player.position.distanceTo(webPoint) * .82);
  player.velocity.add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(5));
  rope.visible = true;
  ui.reticle.classList.add('active');
  ui.webMeter.classList.add('active');
  if (currentAimHit?.object.userData.playerBlock) advanceTutorial('web');
}

function releaseWeb() {
  webPoint = null;
  rope.visible = false;
  ui.reticle.classList.remove('active');
  ui.webMeter.classList.remove('active');
  ui.webMeter.style.setProperty('--tension-angle', '0deg');
}

function updateBlockCount() {
  ui.anchor.textContent = `${blockTypes[selectedBlockType].name}: ${blockInventory[selectedBlockType] || 0}`;
  ui.blockChoices.forEach((choice) => {
    const count = blockInventory[choice.dataset.block] || 0;
    const name = blockTypes[choice.dataset.block].name;
    choice.dataset.count = count;
    choice.setAttribute('aria-label', `${name}, количество ${count}`);
  });
}

function getBlockPosition() {
  const direction = camera.getWorldDirection(new THREE.Vector3());
  if (!currentAimHit?.face) {
    const position = camera.position.clone().add(direction.multiplyScalar(12));
    position.set(Math.round(position.x), Math.round(Math.max(position.y, 2)), Math.round(position.z));
    return position;
  }
  const normal = currentAimHit.face.normal.clone().transformDirection(currentAimHit.object.matrixWorld);
  if (currentAimHit.object.userData.playerBlock) {
    return currentAimHit.object.position.clone().addScaledVector(normal, blockSize);
  }
  return currentAimHit.point.clone().addScaledVector(normal, blockSize * .5 + .06);
}

function blockOverlapsWorld(position) {
  const half = blockSize * .48;
  return colliders.some((box) => (
    position.x + half > box.min.x && position.x - half < box.max.x
    && position.y + half > box.min.y && position.y - half < box.max.y
    && position.z + half > box.min.z && position.z - half < box.max.z
  ));
}

function placeAnchor() {
  if (!started || completed) return;
  if ((blockInventory[selectedBlockType] || 0) <= 0) {
    showToast(`${blockTypes[selectedBlockType].name}: запас пуст`);
    return;
  }
  const position = getBlockPosition();
  const tooClose = Math.abs(position.x - player.position.x) < 1.25
    && Math.abs(position.z - player.position.z) < 1.25
    && position.y > player.position.y - blockSize
    && position.y < player.position.y + 2.4;
  if (tooClose || blockOverlapsWorld(position)) {
    showToast('Здесь нельзя поставить блок');
    return;
  }
  const baseMaterial = blockTypes[selectedBlockType].device
    ? blockTypes[selectedBlockType].material.clone()
    : blockTypes[selectedBlockType].material;
  if (blockTypes[selectedBlockType].device) {
    baseMaterial.transparent = true;
    baseMaterial.opacity = .06;
    baseMaterial.depthWrite = false;
  }
  const anchorMesh = addBox({ position, size: new THREE.Vector3(blockSize, blockSize, blockSize), material: baseMaterial });
  anchorMesh.userData.playerBlock = true;
  anchorMesh.userData.blockType = selectedBlockType;
  const outlineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: Boolean(blockTypes[selectedBlockType].device),
    opacity: blockTypes[selectedBlockType].device ? .22 : 1,
  });
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(anchorMesh.geometry),
    outlineMaterial,
  );
  anchorMesh.add(edges);
  decorateBlock(anchorMesh, selectedBlockType);
  placedBlocks.push(anchorMesh);
  changeBlockCount(selectedBlockType, -1);
  pulseHaptics(14);
  showToast(`${blockTypes[selectedBlockType].placed} · осталось ${blockInventory[selectedBlockType]}`);
  if (!blockTypes[selectedBlockType].device) advanceTutorial('build');
}

function removePlacedBlock(block, refund = true) {
  const grappleIndex = grappleMeshes.indexOf(block);
  if (grappleIndex >= 0) grappleMeshes.splice(grappleIndex, 1);
  const colliderIndex = colliders.findIndex((entry) => entry.mesh === block);
  if (colliderIndex >= 0) colliders.splice(colliderIndex, 1);
  const placedIndex = placedBlocks.indexOf(block);
  if (placedIndex >= 0) placedBlocks.splice(placedIndex, 1);
  world.remove(block);
  block.geometry.dispose();
  block.children.forEach((child) => {
    child.geometry?.dispose();
    child.material?.dispose();
  });
  if (refund) {
    changeBlockCount(block.userData.blockType, 1);
  }
}

function removeAimedBlock() {
  if (!started || completed) return;
  const block = currentAimHit?.object;
  if (!block?.userData.playerBlock) {
    showToast('Наведитесь на свой блок');
    return;
  }
  releaseWeb();
  removePlacedBlock(block);
  currentAim = null;
  currentAimHit = null;
  ui.reticle.classList.remove('removable');
  showToast(`${blockTypes[block.userData.blockType]?.name || 'Блок'} возвращён`);
}

function startRemoving() {
  if (!started || completed) return;
  let block = getDestructionTarget(currentAimHit?.object);
  miningAssisted = false;
  if (
    tutorialTasks[tutorialStep]?.action === 'mine'
    && !block?.userData.destructible
    && !block?.userData.environmentObject
  ) {
    const nearest = destructibleBlocks.reduce((candidate, destructible) => (
      !candidate || player.position.distanceToSquared(destructible.position) < player.position.distanceToSquared(candidate.position)
        ? destructible
        : candidate
    ), null);
    if (nearest && player.position.distanceTo(nearest.position) <= 18) {
      block = nearest;
      miningAssisted = true;
    }
  }
  if (!block) {
    showToast('Наведитесь на блок');
    return;
  }
  if (block?.userData.playerBlock) {
    removeAimedBlock();
    return;
  }
  if (!block?.userData.destructible && !block?.userData.environmentObject) {
    showToast('Этот блок защищён');
    return;
  }
  if (!miningAssisted && currentAimHit.distance > 18) {
    showToast('Подойдите ближе для добычи');
    return;
  }
  miningTarget = block;
  miningProgress = 0;
  miningActive = true;
  ui.breakMeter.classList.add('active');
  ui.breakMeter.style.setProperty('--break-progress', '0deg');
}

function stopMining() {
  miningTarget = null;
  miningProgress = 0;
  miningActive = false;
  miningAssisted = false;
  ui.breakMeter?.classList.remove('active');
  ui.breakMeter?.style.setProperty('--break-progress', '0deg');
}

function spawnBreakParticles(block) {
  const bounds = new THREE.Box3().setFromObject(block);
  const center = bounds.isEmpty() ? block.position.clone() : bounds.getCenter(new THREE.Vector3());
  let particleMaterial = block.material;
  if (!particleMaterial) block.traverse((part) => { if (!particleMaterial && part.isMesh) particleMaterial = part.material; });
  particleMaterial ||= materials.concrete;
  for (let index = 0; index < 9; index += 1) {
    const particle = new THREE.Mesh(breakParticleGeometry, particleMaterial);
    particle.position.copy(center).add(new THREE.Vector3(
      (Math.random() - .5) * blockSize,
      (Math.random() - .5) * blockSize,
      (Math.random() - .5) * blockSize,
    ));
    scene.add(particle);
    breakParticles.push({
      mesh: particle,
      velocity: new THREE.Vector3((Math.random() - .5) * 5, 3 + Math.random() * 4, (Math.random() - .5) * 5),
      life: .65,
    });
  }
}

function destroyWorldBlock(block) {
  if (block.userData.environmentObject) {
    destroyEnvironmentObject(block);
    return;
  }
  if (webPoint && getDestructionTarget(currentAimHit?.object) === block) releaseWeb();
  spawnBreakParticles(block);
  const grappleIndex = grappleMeshes.indexOf(block);
  if (grappleIndex >= 0) grappleMeshes.splice(grappleIndex, 1);
  const colliderIndex = colliders.findIndex((entry) => entry.mesh === block);
  if (colliderIndex >= 0) colliders.splice(colliderIndex, 1);
  const blockIndex = destructibleBlocks.indexOf(block);
  if (blockIndex >= 0) destructibleBlocks.splice(blockIndex, 1);
  destroyedWorldBlocks.add(block.userData.worldBlockId);
  localStorage.setItem('cubic-rift-world-diff', JSON.stringify([...destroyedWorldBlocks]));
  world.remove(block);
  block.geometry.dispose();
  block.children.forEach((child) => {
    child.geometry?.dispose();
    child.material?.dispose();
  });
  const resourceType = block.userData.resourceType || 'concrete';
  const wasEmpty = (blockInventory[resourceType] || 0) === 0;
  changeBlockCount(resourceType, 1);
  if (wasEmpty) selectBlockType(resourceType);
  advanceTutorial('mine');
  pulseHaptics([18, 30, 28]);
  showToast(`${blockTypes[resourceType].mined} · доступно ${blockInventory[resourceType]}`);
  currentAim = null;
  currentAimHit = null;
  stopMining();
}

function getDestructionTarget(object) {
  return object?.userData.environmentRoot || object || null;
}

function destroyEnvironmentObject(root) {
  if (webPoint) releaseWeb();
  spawnBreakParticles(root);
  root.traverse((part) => {
    const index = grappleMeshes.indexOf(part);
    if (index >= 0) grappleMeshes.splice(index, 1);
  });
  const collider = root.userData.collider;
  if (collider) {
    const colliderIndex = colliders.indexOf(collider);
    if (colliderIndex >= 0) colliders.splice(colliderIndex, 1);
    world.remove(collider.mesh);
    collider.mesh.geometry.dispose();
  }
  const objectIndex = environmentObjects.indexOf(root);
  if (objectIndex >= 0) environmentObjects.splice(objectIndex, 1);
  destroyedEnvironment.add(root.userData.environmentId);
  localStorage.setItem('cubic-rift-environment-diff', JSON.stringify([...destroyedEnvironment]));
  const resourceType = root.userData.resourceType || 'metal';
  changeBlockCount(resourceType, 1);
  scene.remove(root);
  pulseHaptics([22, 35, 30]);
  showToast(`${resourceType === 'earth' ? 'Дерево' : 'Объект'} разобран · ${blockTypes[resourceType].name} +1`);
  currentAim = null;
  currentAimHit = null;
  stopMining();
}

function updateMining(dt) {
  if (!miningActive || !miningTarget) return;
  const requiresExactAim = !miningAssisted && !miningTarget.userData.environmentObject;
  if ((requiresExactAim && getDestructionTarget(currentAimHit?.object) !== miningTarget) || !miningTarget.parent) {
    stopMining();
    return;
  }
  miningProgress = Math.min(1, miningProgress + dt / .55);
  ui.breakMeter.style.setProperty('--break-progress', `${Math.round(miningProgress * 360)}deg`);
  if (miningProgress >= 1) destroyWorldBlock(miningTarget);
}

function updateBreakParticles(dt) {
  for (let index = breakParticles.length - 1; index >= 0; index -= 1) {
    const particle = breakParticles[index];
    particle.life -= dt;
    particle.velocity.y -= 14 * dt;
    particle.mesh.position.addScaledVector(particle.velocity, dt);
    particle.mesh.rotation.x += dt * 6;
    particle.mesh.rotation.z += dt * 4;
    particle.mesh.scale.setScalar(Math.max(0, particle.life / .65));
    if (particle.life <= 0) {
      scene.remove(particle.mesh);
      breakParticles.splice(index, 1);
    }
  }
}

function rescueFromFall() {
  fallCount += 1;
  elapsed += activeLevel.fallPenalty || 3;
  player.position.copy(respawnPoint);
  if (activeLevel.kind === 'rescue' && rescued) player.position.set(...activeLevel.citizen);
  player.velocity.set(0, 2, 0);
  releaseWeb();
  ui.damage.classList.add('show');
  window.setTimeout(() => ui.damage.classList.remove('show'), 70);
  showToast(`Страховочная паутина: +${activeLevel.fallPenalty || 3} секунд`);
}

function updateAim() {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hit = raycaster.intersectObjects(grappleMeshes, false)[0];
  currentAimHit = hit || null;
  currentAim = hit?.point || null;
  const destructionTarget = getDestructionTarget(hit?.object);
  renderer.domElement.dataset.targetType = destructionTarget?.userData.environmentObject
    ? destructionTarget.userData.environmentId
    : (destructionTarget?.userData.resourceType || '');
  renderer.domElement.dataset.targetDistance = hit ? hit.distance.toFixed(2) : '';
  ui.reticle.classList.toggle('valid', Boolean(currentAim));
  ui.reticle.classList.toggle('removable', Boolean(hit?.object.userData.playerBlock));
  ui.reticle.classList.toggle('breakable', Boolean(destructionTarget?.userData.destructible || destructionTarget?.userData.environmentObject));
}

function resolveWorld(previous) {
  player.grounded = false;
  player.wallNormal.set(0, 0, 0);
  const radius = .5;
  const playerTop = player.position.y + 2.25;

  for (const box of colliders) {
    const insideX = player.position.x > box.min.x - radius && player.position.x < box.max.x + radius;
    const insideZ = player.position.z > box.min.z - radius && player.position.z < box.max.z + radius;
    if (!insideX || !insideZ) continue;

    if (previous.y >= box.max.y - .15 && player.position.y <= box.max.y + .15 && player.velocity.y <= 0) {
      player.position.y = box.max.y;
      player.velocity.y = 0;
      player.grounded = true;
      continue;
    }

    if (playerTop < box.min.y + .1 || player.position.y > box.max.y - .1) continue;
    const distances = [
      { value: Math.abs(player.position.x - (box.min.x - radius)), axis: 'x', target: box.min.x - radius, normal: -1 },
      { value: Math.abs(player.position.x - (box.max.x + radius)), axis: 'x', target: box.max.x + radius, normal: 1 },
      { value: Math.abs(player.position.z - (box.min.z - radius)), axis: 'z', target: box.min.z - radius, normal: -1 },
      { value: Math.abs(player.position.z - (box.max.z + radius)), axis: 'z', target: box.max.z + radius, normal: 1 },
    ];
    distances.sort((a, b) => a.value - b.value);
    const side = distances[0];
    player.position[side.axis] = side.target;
    player.velocity[side.axis] = 0;
    player.wallNormal.set(side.axis === 'x' ? side.normal : 0, 0, side.axis === 'z' ? side.normal : 0);
  }
}

function updatePlayer(dt) {
  player.previous.copy(player.position);
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(-forward.z, 0, forward.x);
  const input = new THREE.Vector3();
  if (keys.has('KeyW')) input.add(forward);
  if (keys.has('KeyS')) input.sub(forward);
  if (keys.has('KeyD')) input.add(right);
  if (keys.has('KeyA')) input.sub(right);
  input.addScaledVector(forward, -touchMove.y);
  input.addScaledVector(right, touchMove.x);
  if (input.lengthSq() > 1) input.normalize();

  const horizontalVelocity = new THREE.Vector3(player.velocity.x, 0, player.velocity.z);
  const airAcceleration = webPoint ? 15 : 7.5;
  const acceleration = (player.grounded ? 21 : airAcceleration) * characterConfig.speed;
  horizontalVelocity.addScaledVector(input, acceleration * dt);
  const airSpeedLimit = webPoint ? 27 : Math.max(12, horizontalVelocity.length());
  const maxSpeed = (player.grounded ? 6 : airSpeedLimit) * characterConfig.speed;
  if (horizontalVelocity.length() > maxSpeed) horizontalVelocity.setLength(maxSpeed);
  if (player.grounded && !input.lengthSq()) horizontalVelocity.multiplyScalar(Math.pow(.0008, dt));
  player.velocity.x = horizontalVelocity.x;
  player.velocity.z = horizontalVelocity.z;

  if (player.grounded) player.wallRunTime = 0;
  let wallRunning = false;
  if (jumpQueued && player.grounded) {
    player.velocity.y = 12;
    player.grounded = false;
  } else if (
    keys.has('Space')
    && player.wallNormal.lengthSq()
    && horizontalVelocity.length() > 7
    && player.wallRunTime < .9
  ) {
    player.wallRunTime += dt;
    player.velocity.y = Math.max(player.velocity.y, 1.7);
    player.velocity.addScaledVector(player.wallNormal, 7 * dt);
    wallRunning = true;
  }
  jumpQueued = false;
  ui.reticle.classList.toggle('wall-run', wallRunning);

  const gravity = player.velocity.y > 0 ? 27 : 28;
  player.velocity.y = Math.max(player.velocity.y - gravity * dt, -24);

  if (webPoint) {
    const towardAnchor = webPoint.clone().sub(player.position);
    const distance = towardAnchor.length();
    const direction = towardAnchor.normalize();
    const pulling = keys.has('ShiftLeft') || keys.has('ShiftRight');
    if (pulling) {
      ropeLength = Math.max(1.5, ropeLength - 16 * dt);
      player.velocity.addScaledVector(direction, 42 * characterConfig.pull * dt);
      if (webPoint.y > player.position.y + .75) {
        player.velocity.y = Math.max(player.velocity.y, 7.5);
      }
    }
    if (distance > ropeLength) {
      const outwardSpeed = player.velocity.dot(direction);
      if (outwardSpeed < 0) player.velocity.addScaledVector(direction, -outwardSpeed);
      player.velocity.addScaledVector(direction, (distance - ropeLength) * 44 * dt);
      player.position.addScaledVector(direction, (distance - ropeLength) * .12);
    }
  }

  player.position.addScaledVector(player.velocity, dt);
  resolveWorld(player.previous);

  if (player.position.y < -13.5) rescueFromFall();

  hero.position.copy(player.position);
  if (horizontalVelocity.lengthSq() > .2) {
    hero.rotation.y = Math.atan2(horizontalVelocity.x, horizontalVelocity.z);
  }
  updateHeroAnimation(horizontalVelocity.length());
  const limbSwing = player.grounded ? Math.sin(elapsed * 15) * Math.min(horizontalVelocity.length() / 12, 1) : .25;
  hero.getObjectByName('arm--1').rotation.x = limbSwing;
  hero.getObjectByName('arm-1').rotation.x = -limbSwing;
  hero.getObjectByName('leg--1').rotation.x = -limbSwing;
  hero.getObjectByName('leg-1').rotation.x = limbSwing;
  if (!player.grounded) hero.rotation.z = THREE.MathUtils.clamp(-player.velocity.x * .018, -.35, .35);
  else hero.rotation.z *= .8;
}

function constrainCamera(focus, targetPosition) {
  const offset = targetPosition.clone().sub(focus);
  const distance = offset.length();
  if (distance < .01) return targetPosition;
  cameraCollisionRay.set(focus, offset.normalize());
  let nearestDistance = distance;
  for (const collider of colliders) {
    cameraCollisionBox.min.copy(collider.min);
    cameraCollisionBox.max.copy(collider.max);
    const hit = cameraCollisionRay.intersectBox(cameraCollisionBox, cameraCollisionPoint);
    if (!hit) continue;
    const hitDistance = focus.distanceTo(hit);
    if (hitDistance < nearestDistance) nearestDistance = hitDistance;
  }
  if (nearestDistance >= distance) return targetPosition;
  return focus.clone().addScaledVector(offset, Math.max(1.25, nearestDistance - .4));
}

function updateCamera(dt) {
  const focus = player.position.clone().add(new THREE.Vector3(0, 1.25, 0));
  const cameraOffset = new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch),
  );
  const viewDirection = cameraOffset.clone().negate();
  const horizontalForward = viewDirection.clone().setY(0).normalize();
  const cameraRight = new THREE.Vector3(-horizontalForward.z, 0, horizontalForward.x);
  const shoulderOffset = isTouchDevice ? (window.innerWidth < window.innerHeight ? .75 : 1.35) : 1.85;
  let desired = focus.clone()
    .add(cameraOffset.multiplyScalar(8.5))
    .add(cameraRight.multiplyScalar(shoulderOffset))
    .add(new THREE.Vector3(0, 2.4, 0));
  desired = constrainCamera(focus, desired);
  camera.position.lerp(desired, 1 - Math.pow(.00001, dt));
  camera.position.copy(constrainCamera(focus, camera.position));
  hero.visible = camera.position.distanceTo(focus) > 2.35;
  camera.lookAt(camera.position.clone().add(viewDirection));
  const targetFov = 66 + Math.min(player.velocity.length() * .42, 12);
  camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 1 - Math.pow(.01, dt));
  camera.updateProjectionMatrix();
}

function updateRope() {
  if (!webPoint) return;
  const start = player.position.clone().add(new THREE.Vector3(0, 1.45, 0));
  const direction = webPoint.clone().sub(start);
  const length = direction.length();
  const pulling = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const tension = THREE.MathUtils.clamp(Math.max((length - ropeLength) / 5, pulling ? .35 : 0), 0, 1);
  ui.webMeter.style.setProperty('--tension-angle', `${Math.round(tension * 360)}deg`);
  rope.position.copy(start).addScaledVector(direction, .5);
  rope.scale.set(1, length, 1);
  rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
}

function updateMission() {
  citizen.rotation.y += .02;
  citizen.position.y = 39.8 + Math.sin(elapsed * 3) * .08;
  citizenBeacon.rotation.z += .015;
  portal.rotation.z -= .012;
  updateCheckpointRings();
  if (activeLevel.kind !== 'rescue') {
    const target = routeTargets[routeIndex];
    if (target && player.position.distanceTo(target) < (activeLevel.checkpointRadius || 4.5)) {
      routeIndex += 1;
      updateObjectivePanel();
      if (routeIndex >= routeTargets.length) {
        ui.progress.style.width = '100%';
        showToast(activeLevel.kind === 'relay' ? 'Энергосеть восстановлена!' : 'Маршрут завершён!');
        finishRun();
      } else {
        showToast(activeLevel.kind === 'relay'
          ? `Узел ${routeIndex} / ${routeTargets.length} активирован`
          : `Кольцо ${routeIndex} / ${routeTargets.length}`);
      }
    }
    return;
  }
  if (!rescued && routeIndex < routeTargets.length - 1 && player.position.distanceTo(routeTargets[routeIndex]) < 7) {
    routeIndex += 1;
    updateObjectivePanel();
    showToast(`Маршрут ${routeIndex + 1} / ${routeTargets.length}`);
  }
  const distanceToCitizen = player.position.distanceTo(citizen.position);
  if (!rescued && distanceToCitizen < 2.5) {
    rescued = true;
    citizen.visible = false;
    citizenBeacon.visible = false;
    updateObjectivePanel();
    showToast('Житель спасён. Назад к порталу!');
  }
  if (rescued && player.position.distanceTo(portal.position) < 3.2) {
    ui.progress.style.width = '100%';
    finishRun();
  }
}

function getTutorialTarget() {
  const task = tutorialTasks[tutorialStep];
  if (!task) return null;
  if (task.action === 'mine') {
    return destructibleBlocks.reduce((nearest, block) => (
      !nearest || player.position.distanceToSquared(block.position) < player.position.distanceToSquared(nearest.position)
        ? block
        : nearest
    ), null)?.position || null;
  }
  if (task.action === 'web') {
    return placedBlocks[placedBlocks.length - 1]?.position || null;
  }
  return null;
}

function updateObjectiveMarker() {
  const tutorialTarget = getTutorialTarget();
  const target = tutorialStep < tutorialTasks.length
    ? tutorialTarget
    : (activeLevel.kind === 'rescue' && rescued ? portal.position : routeTargets[routeIndex]);
  if (!target) {
    ui.objectiveMarker.hidden = true;
    return;
  }
  const projected = target.clone().add(new THREE.Vector3(0, 1.8, 0)).project(camera);
  const cameraForward = camera.getWorldDirection(new THREE.Vector3());
  const inFront = target.clone().sub(camera.position).dot(cameraForward) > 0;
  if (!inFront) projected.x *= -1;
  const padding = 54;
  const topPadding = isTouchDevice ? 180 : 145;
  const bottomPadding = isTouchDevice ? 190 : 105;
  const x = THREE.MathUtils.clamp((projected.x * .5 + .5) * window.innerWidth, padding, window.innerWidth - padding);
  const y = THREE.MathUtils.clamp((-projected.y * .5 + .5) * window.innerHeight, topPadding, window.innerHeight - bottomPadding);
  const onEdge = !inFront || Math.abs(projected.x) > .92 || Math.abs(projected.y) > .78;
  ui.objectiveMarker.style.left = `${x}px`;
  ui.objectiveMarker.style.top = `${y}px`;
  ui.objectiveMarker.classList.toggle('edge', onEdge);
  ui.objectiveMarker.hidden = completed;
  ui.objectiveDistance.textContent = `${Math.round(player.position.distanceTo(target))} м`;
}

function updateGhost() {
  if (!best?.path?.length || completed) {
    ghost.visible = false;
    return;
  }
  const index = Math.min(Math.floor(elapsed * 10), best.path.length - 1);
  const point = best.path[index];
  ghost.visible = Boolean(point);
  if (point) ghost.position.set(point[0], point[1] + .9, point[2]);
}

function updateUi() {
  ui.timer.textContent = formatTime(elapsed);
  ui.speed.textContent = Math.round(new THREE.Vector3(player.velocity.x, 0, player.velocity.z).length() * 3.6);
  if (toastTimer > 0) {
    toastTimer -= clock.getDelta;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .033);
  lavaTexture.offset.x = (lavaTexture.offset.x + dt * .018) % 1;
  lavaTexture.offset.y = (lavaTexture.offset.y - dt * .011 + 1) % 1;
  heroMixer?.update(dt);
  updateBreakParticles(dt);
  if (started && !completed && (isTouchDevice || document.pointerLockElement === renderer.domElement)) {
    elapsed += dt;
    simulationAccumulator = Math.min(simulationAccumulator + dt, fixedStep * 5);
    pathSampleClock += dt;
    if (pathSampleClock >= .1) {
      runPath.push([player.position.x, player.position.y, player.position.z]);
      pathSampleClock = 0;
    }
    while (simulationAccumulator >= fixedStep) {
      updatePlayer(fixedStep);
      simulationAccumulator -= fixedStep;
    }
    updateMission();
    updateGhost();
  } else {
    simulationAccumulator = 0;
  }
  if (toastTimer > 0) {
    toastTimer -= dt;
    if (toastTimer <= 0) ui.toast.classList.remove('show');
  }
  updateCamera(dt);
  updateObjectiveMarker();
  updateAim();
  if (started && !completed && (isTouchDevice || document.pointerLockElement === renderer.domElement)) updateMining(dt);
  updateRope();
  ui.timer.textContent = formatTime(elapsed);
  ui.speed.textContent = Math.round(new THREE.Vector3(player.velocity.x, 0, player.velocity.z).length() * 3.6);
  renderer.domElement.dataset.playerY = player.position.y.toFixed(3);
  renderer.domElement.dataset.playerVy = player.velocity.y.toFixed(3);
  renderer.domElement.dataset.playerX = player.position.x.toFixed(3);
  renderer.domElement.dataset.playerZ = player.position.z.toFixed(3);
  renderer.render(scene, camera);
}

ui.play.addEventListener('click', startGame);
ui.levelCards.forEach((card) => card.addEventListener('click', () => selectLevel(card.dataset.level)));
ui.characterCards.forEach((card) => card.addEventListener('click', () => selectCharacter(card.dataset.character)));
ui.restart.addEventListener('click', () => resetRun(!isTouchDevice));
ui.nextLevel.addEventListener('click', startNextLevel);
ui.levelMenu.addEventListener('click', showLevelMenu);
renderer.domElement.addEventListener('click', () => {
  if (started && !completed) requestGamePointerLock();
});
renderer.domElement.addEventListener('mousedown', (event) => { if (event.button === 0) attachWeb(); });
window.addEventListener('mouseup', (event) => { if (event.button === 0) releaseWeb(); });
window.addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (event.code === 'Space' && !event.repeat) jumpQueued = true;
  if (event.code === 'KeyE' && !event.repeat) placeAnchor();
  if (event.code === 'KeyQ' && !event.repeat) startRemoving();
  if (event.code === 'Digit1') selectBlockType('anchor');
  if (event.code === 'Digit2') selectBlockType('brick');
  if (event.code === 'Digit3') selectBlockType('concrete');
  if (event.code === 'Digit4') selectBlockType('metal');
  if (event.code === 'Digit5') selectBlockType('earth');
  if (event.code === 'KeyR' && !event.repeat && started) resetRun(true);
});
window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
  if (event.code === 'KeyQ') stopMining();
});
window.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement !== renderer.domElement) return;
  yaw -= event.movementX * .0023;
  pitch = THREE.MathUtils.clamp(pitch + event.movementY * .0018, -1.45, .58);
});

let movePointerId = null;
function tryCapturePointer(element, pointerId) {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Pointer capture is optional; movement still works while the pointer stays over the control.
  }
}

function updateTouchMove(event) {
  const bounds = ui.movePad.getBoundingClientRect();
  const radius = bounds.width * .34;
  const offsetX = event.clientX - (bounds.left + bounds.width * .5);
  const offsetY = event.clientY - (bounds.top + bounds.height * .5);
  const length = Math.hypot(offsetX, offsetY);
  const scale = length > radius ? radius / length : 1;
  const x = offsetX * scale;
  const y = offsetY * scale;
  const normalizedLength = Math.min(1, length / radius);
  const curvedLength = normalizedLength < .12 ? 0 : ((normalizedLength - .12) / .88) ** 1.25;
  const directionScale = length > 0 ? curvedLength / length : 0;
  touchMove.set(offsetX * directionScale, offsetY * directionScale);
  ui.moveKnob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
}

function releaseTouchMove(event) {
  if (event.pointerId !== movePointerId) return;
  movePointerId = null;
  touchMove.set(0, 0);
  ui.moveKnob.style.transform = 'translate(-50%, -50%)';
}

ui.movePad.addEventListener('pointerdown', (event) => {
  if (!isTouchDevice) return;
  event.preventDefault();
  movePointerId = event.pointerId;
  tryCapturePointer(ui.movePad, event.pointerId);
  updateTouchMove(event);
});
ui.movePad.addEventListener('pointermove', (event) => {
  if (event.pointerId === movePointerId) updateTouchMove(event);
});
ui.movePad.addEventListener('pointerup', releaseTouchMove);
ui.movePad.addEventListener('pointercancel', releaseTouchMove);

let lookPointerId = null;
let lookX = 0;
let lookY = 0;
renderer.domElement.addEventListener('pointerdown', (event) => {
  if (!isTouchDevice || event.pointerType === 'mouse' || event.clientX < window.innerWidth * .32) return;
  lookPointerId = event.pointerId;
  lookX = event.clientX;
  lookY = event.clientY;
  tryCapturePointer(renderer.domElement, event.pointerId);
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (event.pointerId !== lookPointerId) return;
  const movementX = event.clientX - lookX;
  const movementY = event.clientY - lookY;
  yaw -= movementX * .0045;
  pitch = THREE.MathUtils.clamp(pitch + movementY * .0036, -1.45, .58);
  lookX = event.clientX;
  lookY = event.clientY;
});
function releaseTouchLook(event) {
  if (event.pointerId === lookPointerId) lookPointerId = null;
}
renderer.domElement.addEventListener('pointerup', releaseTouchLook);
renderer.domElement.addEventListener('pointercancel', releaseTouchLook);

function bindHeldButton(element, onPress, onRelease) {
  element.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    tryCapturePointer(element, event.pointerId);
    element.classList.add('pressed');
    onPress();
  });
  const release = () => {
    element.classList.remove('pressed');
    onRelease();
  };
  element.addEventListener('pointerup', release);
  element.addEventListener('pointercancel', release);
}

bindHeldButton(ui.mobileJump, () => {
  jumpQueued = true;
  keys.add('Space');
}, () => keys.delete('Space'));
bindHeldButton(ui.mobileWeb, attachWeb, releaseWeb);
bindHeldButton(ui.mobilePull, () => keys.add('ShiftLeft'), () => keys.delete('ShiftLeft'));
ui.mobileAnchor.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  placeAnchor();
});
bindHeldButton(ui.mobileRemove, startRemoving, stopMining);
ui.blockChoices.forEach((choice) => choice.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  selectBlockType(choice.dataset.block);
}));
ui.mobileRestart.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  if (started) resetRun(false);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouchDevice ? 1.25 : 1.75));
});

hero.position.copy(player.position);
selectLevel(selectedLevelId);
selectCharacter(selectedCharacter);
selectBlockType(selectedBlockType);
loadCityAssets();
loadStreetAssets();
loadBlockAssets();
addUrbanGreenery();
updateCamera(.016);
animate();