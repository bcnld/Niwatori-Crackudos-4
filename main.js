import { createCharacterMesh, animateCharacter } from './character.js';

const THREE_NS = window.THREE;

// Canvas
const canvas = document.getElementById("app");

// ===== Renderer / Scene / Camera =====
const renderer = new THREE_NS.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE_NS.Scene();
scene.background = new THREE_NS.Color(0x87ceeb);

const camera = new THREE_NS.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 6, 10);

// Lights
const sun = new THREE_NS.DirectionalLight(0xffffff, 1.0);
sun.position.set(40, 80, 20);
scene.add(sun);
scene.add(new THREE_NS.AmbientLight(0xffffff, 0.7));

// Grid helper
const grid = new THREE_NS.GridHelper(200, 20, 0x444444, 0x666666);
grid.position.y = 0.01;
grid.visible = false;
scene.add(grid);

// ===== Controls toggle (debug) =====
let orbitControls = null;
let useOrbit = false;
function enableOrbitControls() {
  const { OrbitControls } = window;
  if (!orbitControls && OrbitControls) {
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
  }
}

// ===== Input =====
const keys = new Set();
let pointerLocked = false;
let yaw = 0, pitch = 0;

canvas.addEventListener("click", () => {
  if (!useOrbit && !pointerLocked) canvas.requestPointerLock();
});
document.addEventListener("pointerlockchange", () => {
  pointerLocked = document.pointerLockElement === canvas;
});
document.addEventListener("mousemove", (e) => {
  if (!pointerLocked || useOrbit) return;
  const sens = 0.0025;
  yaw -= e.movementX * sens;
  pitch -= e.movementY * sens;
  pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, pitch));
});
window.addEventListener("keydown", e => {
  keys.add(e.key.toLowerCase());
  if(e.key.toLowerCase() === "c") {
    useOrbit = !useOrbit;
    if(useOrbit) enableOrbitControls();
    if(orbitControls) orbitControls.enabled = useOrbit;
  }
  if(e.key.toLowerCase() === "r") resetSpawn();
});
window.addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));

// ===== Player =====
const player = {
  pos: new THREE_NS.Vector3(0,3,0),
  velY: 0,
  speed: 10,
  sprintMul: 1.6,
  jump: 6.5,
  eye: 1.7,
  onGround: false
};

// ===== Player Mesh =====
const playerMesh = createCharacterMesh();
scene.add(playerMesh);

// ===== Terrain / Map =====
let map = null;
let terrainMesh = null;
let cols = 0, rows = 0;
let width = 0, depth = 0;
let cellX = 0, cellZ = 0;
let heights = null;

// ===== Fetch Map =====
fetch("./map.json").then(r => r.json()).then(data => {
  // JSON 配列の先頭を使用
  map = data[0];
  buildTerrain(map.terrain);
  buildObjects(map.objects ?? []);
  initSpawn(map.spawn);
}).catch(err => console.error(err));

// ===== Terrain =====
function buildTerrain(terrain) {
  heights = terrain.heights;
  rows = heights.length;
  cols = heights[0].length;
  width = terrain.width;
  depth = terrain.depth;
  cellX = width / (cols-1);
  cellZ = depth / (rows-1);

  const geo = new THREE_NS.PlaneGeometry(width, depth, cols-1, rows-1);
  geo.rotateX(-Math.PI/2);
  const pos = geo.attributes.position;
  let i = 0;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++, i++){
      pos.setY(i, heights[r][c]);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const mat = new THREE_NS.MeshStandardMaterial({
    color: 0x4caf50,
    roughness: 0.95,
    metalness: 0.0
  });
  terrainMesh = new THREE_NS.Mesh(geo, mat);
  scene.add(terrainMesh);
}

// ===== Objects =====
function buildObjects(objects){
  for(const o of objects){
    let mesh = null;
    const color = new THREE_NS.Color(o.color ?? "#aaaaaa");
    if(o.type === "box"){
      mesh = new THREE_NS.Mesh(
        new THREE_NS.BoxGeometry(1,1,1),
        new THREE_NS.MeshStandardMaterial({ color })
      );
    } else if(o.type === "cylinder"){
      mesh = new THREE_NS.Mesh(
        new THREE_NS.CylinderGeometry(0.0, 0.8,1,10),
        new THREE_NS.MeshStandardMaterial({ color })
      );
    } else continue;

    if(o.scale) mesh.scale.set(o.scale.x ?? 1, o.scale.y ?? 1, o.scale.z ?? 1);
    const baseY = getHeightAt(o.position.x, o.position.z);
    mesh.position.set(o.position.x, baseY, o.position.z);

    if(o.rotation){
      mesh.rotation.set(
        (o.rotation.x ?? 0) * Math.PI/180,
        (o.rotation.y ?? 0) * Math.PI/180,
        (o.rotation.z ?? 0) * Math.PI/180
      );
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
}

// ===== Spawn =====
function initSpawn(spawn){
  const sx = spawn?.x ?? 0;
  const sz = spawn?.z ?? 0;
  player.pos.set(sx,5,sz);
  const y = getHeightAt(sx, sz);
  player.pos.y = y + player.eye;
  // カメラ初期位置を少し後ろにオフセット
  const offset = new THREE_NS.Vector3(0, 2, 6);
  camera.position.copy(player.pos.clone().add(offset));
  camera.lookAt(player.pos);
  yaw = 0; pitch = 0;
}

function resetSpawn(){ initSpawn(map?.spawn); }

// ===== Height Sampling =====
function getHeightAt(x,z){
  if(!heights) return 0;
  const gx = (x + width/2)/cellX;
  const gz = (z + depth/2)/cellZ;

  const x0 = Math.floor(gx), z0 = Math.floor(gz);
  const x1 = x0+1, z1 = z0+1;

  const clamp = (v,min,max)=> Math.max(min,Math.min(max,v));
  const cx0 = clamp(x0,0,cols-1), cz0 = clamp(z0,0,rows-1);
  const cx1 = clamp(x1,0,cols-1), cz1 = clamp(z1,0,rows-1);

  const sx = clamp(gx-x0,0,1), sz = clamp(gz-z0,0,1);

  const h00 = heights[cz0][cx0], h10 = heights[cz0][cx1];
  const h01 = heights[cz1][cx0], h11 = heights[cz1][cx1];

  const h0 = h00*(1-sx) + h10*sx;
  const h1 = h01*(1-sx) + h11*sx;
  return h0*(1-sz) + h1*sz;
}

// ===== Yaw/Pitch → Direction =====
function dirFromYawPitch(yaw,pitch){
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  return new THREE_NS.Vector3(-sy*cp, sp, -cy*cp).normalize();
}

// ===== Game Loop =====
let last = performance.now();
function tick(now = performance.now()){
  requestAnimationFrame(tick);
  const dt = Math.min(0.033, (now-last)/1000);
  last = now;

  if(useOrbit && orbitControls) orbitControls.update();
  else updatePlayer(dt);

  renderer.render(scene, camera);
}
requestAnimationFrame(tick);

// ===== Player Update =====
function updatePlayer(dt){
  const forward = dirFromYawPitch(yaw,0);
  const right = new THREE_NS.Vector3().crossVectors(forward,new THREE_NS.Vector3(0,1,0)).negate();

  let move = new THREE_NS.Vector3();
  const sprint = keys.has("shift") ? player.sprintMul : 1.0;

  if(keys.has("w")) move.add(forward);
  if(keys.has("s")) move.sub(forward);
  if(keys.has("a")) move.sub(right);
  if(keys.has("d")) move.add(right);

  if(move.lengthSq() > 0) move.normalize().multiplyScalar(player.speed*sprint*dt);

  // gravity & jump
  player.velY -= 9.8*dt;
  if(keys.has(" ") && player.onGround){
    player.velY = player.jump;
    player.onGround = false;
  }

  // tentative move
  player.pos.add(move);
  player.pos.y += player.velY*dt;

  // ground snap
  const groundY = getHeightAt(player.pos.x, player.pos.z) + player.eye;
  if(player.pos.y <= groundY){
    player.pos.y = groundY;
    player.velY = 0;
    player.onGround = true;
  }

  // ===== Third-Person Camera =====
  const offset = new THREE_NS.Vector3(0,1.5,3);
  const camPos = player.pos.clone().add(offset.clone().applyAxisAngle(new THREE_NS.Vector3(0,1,0), yaw));
  camera.position.copy(camPos);
  camera.lookAt(player.pos);

  // ===== Player Mesh Position =====
  playerMesh.position.copy(player.pos);
  playerMesh.rotation.y = yaw;

  // ===== Animate Mesh =====
  const state = move.length() > 0 ? (keys.has("shift")?"run":"walk") : "idle";
  animateCharacter(playerMesh, state, performance.now()/1000);
}

// ===== Resize =====
window.addEventListener("resize",()=>{
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w,h);
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
});
