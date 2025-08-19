// ==========================
// 基本設定
// ==========================
const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

// ==========================
// ライト
// ==========================
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// ==========================
// マップ読み込み
// ==========================
let mapData = null;
fetch("map.json")
  .then(res => res.json())
  .then(data => {
    mapData = data;
    createMap(mapData);
  });

function createMap(data) {
  // 床
  const floorMat = new THREE.MeshStandardMaterial({ color: data.floor.color });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(data.floor.width, data.floor.height), floorMat);
  floor.rotation.x = -Math.PI/2;
  scene.add(floor);

  // 壁
  data.walls.forEach(w => {
    const wallMat = new THREE.MeshStandardMaterial({ color: w.color });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w.width, w.height, w.depth), wallMat);
    wall.position.set(w.x, w.y, w.z);
    scene.add(wall);
  });

  // props（車とか）
  if(data.props){
    data.props.forEach(p => {
      const propMat = new THREE.MeshStandardMaterial({ color: p.color });
      const prop = new THREE.Mesh(new THREE.BoxGeometry(p.width, p.height, p.depth), propMat);
      prop.position.set(p.x, p.y, p.z);
      scene.add(prop);
    });
  }
}

// ==========================
// プレイヤー（ニワトリ）
// ==========================
const player = new THREE.Object3D();
player.position.set(0,1,0);
scene.add(player);

// 体
const bodyMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5,0.5,1,16),
  new THREE.MeshStandardMaterial({ color: 0xffff00 })
);
bodyMesh.position.y = 0.5;
player.add(bodyMesh);

// 頭
const headMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.3,16,16),
  new THREE.MeshStandardMaterial({ color: 0xffff00 })
);
headMesh.position.y = 1.1;
player.add(headMesh);

// ==========================
// 入力管理
// ==========================
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ==========================
// 左手ジョイスティック
// ==========================
const joystickBase = document.getElementById("joystickBase");
const joystickKnob = document.getElementById("joystickKnob");
let joystick = { active:false, deltaX:0, deltaY:0 };
let baseCenterX=0, baseCenterY=0;

function updateJoystickBaseCenter(){
  const rect = joystickBase.getBoundingClientRect();
  baseCenterX = rect.left + rect.width/2;
  baseCenterY = rect.top + rect.height/2;
}
updateJoystickBaseCenter();
window.addEventListener("resize", updateJoystickBaseCenter);

joystickBase.addEventListener("touchstart", e => { joystick.active=true; });
joystickBase.addEventListener("touchmove", e => {
  if(!joystick.active) return;
  const touch = e.touches[0];
  joystick.deltaX = touch.clientX - baseCenterX;
  joystick.deltaY = touch.clientY - baseCenterY;
  joystickKnob.style.transform = `translate(${joystick.deltaX}px, ${joystick.deltaY}px) translate(-50%, -50%)`;
});
joystickBase.addEventListener("touchend", ()=> {
  joystick.active=false; joystick.deltaX=0; joystick.deltaY=0;
  joystickKnob.style.transform = `translate(0px,0px) translate(-50%, -50%)`;
});

// ==========================
// 右手視点操作（PC+スマホ）
// ==========================
let rightTouch = { active:false, startX:0, startY:0 };
document.addEventListener("touchstart", e=>{
  for(let t of e.touches){
    rightTouch.active=true; rightTouch.startX=t.clientX; rightTouch.startY=t.clientY;
  }
});
document.addEventListener("touchmove", e=>{
  if(!rightTouch.active) return;
  for(let t of e.touches){
    let deltaX = t.clientX - rightTouch.startX;
    let deltaY = t.clientY - rightTouch.startY;
    camera.rotation.y -= deltaX*0.002;
    camera.rotation.x -= deltaY*0.002;
    camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
    rightTouch.startX=t.clientX; rightTouch.startY=t.clientY;
  }
});
document.addEventListener("touchend", ()=>{ rightTouch.active=false; });

let mouseDown=false, lastX=0, lastY=0;
document.addEventListener("mousedown", e=>{ if(e.button===2){ mouseDown=true; lastX=e.clientX; lastY=e.clientY; }});
document.addEventListener("mouseup", e=>{ if(e.button===2) mouseDown=false; });
document.addEventListener("mousemove", e=>{
  if(!mouseDown) return;
  let deltaX=e.clientX-lastX;
  let deltaY=e.clientY-lastY;
  camera.rotation.y -= deltaX*0.002;
  camera.rotation.x -= deltaY*0.002;
  camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
  lastX=e.clientX; lastY=e.clientY;
});

// ==========================
// アニメーションループ
// ==========================
function animate(){
  requestAnimationFrame(animate);
  const speed=0.1;

  // キーボード移動
  if(keys["w"]) player.position.z -= speed;
  if(keys["s"]) player.position.z += speed;
  if(keys["a"]) player.position.x -= speed;
  if(keys["d"]) player.position.x += speed;

  // 左手ジョイスティック
  if(joystick.active){
    const maxDist=40;
    let moveX = joystick.deltaX/maxDist;
    let moveZ = joystick.deltaY/maxDist;
    moveX = Math.max(-1, Math.min(1, moveX));
    moveZ = Math.max(-1, Math.min(1, moveZ));
    player.position.x += moveX*speed;
    player.position.z -= moveZ*speed;
  }

  // カメラTPS
  camera.position.set(player.position.x, player.position.y+2, player.position.z+5);
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}
animate();

// ==========================
// リサイズ対応
// ==========================
window.addEventListener("resize", ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
