// ==========================
// 基本設定
// ==========================
const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

// ==========================
// ライト
// ==========================
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10,20,10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// ==========================
// テストマップ（床・壁）
// ==========================
const floorMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(50,50), floorMat);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

const wallMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
const walls = [
  new THREE.Mesh(new THREE.BoxGeometry(50,5,1), wallMat),
  new THREE.Mesh(new THREE.BoxGeometry(50,5,1), wallMat),
  new THREE.Mesh(new THREE.BoxGeometry(1,5,50), wallMat),
  new THREE.Mesh(new THREE.BoxGeometry(1,5,50), wallMat)
];
walls[0].position.set(0,2.5,-25);
walls[1].position.set(0,2.5,25);
walls[2].position.set(-25,2.5,0);
walls[3].position.set(25,2.5,0);
walls.forEach(w=>scene.add(w));

// ==========================
// プレイヤー
// ==========================
const playerGeo = new THREE.CylinderGeometry(0.5,0.5,2,16);
const playerMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0,1,0);
scene.add(player);

// ==========================
// 入力管理（キーボード）
// ==========================
const keys = {};
document.addEventListener("keydown", (e) => { keys[e.key.toLowerCase()] = true; });
document.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

// ==========================
// ジョイスティック（左手）
// ==========================
const joystickBase = document.getElementById("joystickBase");
const joystickKnob = document.getElementById("joystickKnob");

let joystick = { active:false, deltaX:0, deltaY:0 };
const baseRect = joystickBase.getBoundingClientRect();
const baseCenterX = baseRect.left + baseRect.width/2;
const baseCenterY = baseRect.top + baseRect.height/2;
joystickKnob.style.left = baseCenterX + "px";
joystickKnob.style.top  = baseCenterY + "px";

joystickBase.addEventListener("touchstart", (e)=>{
  joystick.active = true;
});
joystickBase.addEventListener("touchmove", (e)=>{
  if(!joystick.active) return;
  const touch = e.touches[0];
  joystick.deltaX = touch.clientX - baseCenterX;
  joystick.deltaY = touch.clientY - baseCenterY;
  joystickKnob.style.transform = `translate(${joystick.deltaX}px, ${joystick.deltaY}px) translate(-50%, -50%)`;
});
joystickBase.addEventListener("touchend", ()=>{
  joystick.active = false;
  joystick.deltaX = 0;
  joystick.deltaY = 0;
  joystickKnob.style.transform = `translate(0px, 0px) translate(-50%, -50%)`;
});

// ==========================
// 右手視点操作（スマホ・PC右クリック）
// ==========================
let rightTouch = { active:false, startX:0, startY:0 };
document.addEventListener("touchstart", (e)=>{
  for(let t of e.touches){
    if(t.clientX > window.innerWidth/2){
      rightTouch.active = true;
      rightTouch.startX = t.clientX;
      rightTouch.startY = t.clientY;
    }
  }
});
document.addEventListener("touchmove", (e)=>{
  if(!rightTouch.active) return;
  for(let t of e.touches){
    if(t.clientX > window.innerWidth/2){
      let deltaX = t.clientX - rightTouch.startX;
      let deltaY = t.clientY - rightTouch.startY;
      camera.rotation.y -= deltaX * 0.002;
      camera.rotation.x -= deltaY * 0.002;
      camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
      rightTouch.startX = t.clientX;
      rightTouch.startY = t.clientY;
    }
  }
});
document.addEventListener("touchend", ()=>{ rightTouch.active = false; });

let mouseDown=false, lastX=0, lastY=0;
document.addEventListener("mousedown",(e)=>{
  if(e.button===2){ mouseDown=true; lastX=e.clientX; lastY=e.clientY; }
});
document.addEventListener("mouseup",(e)=>{ if(e.button===2) mouseDown=false; });
document.addEventListener("mousemove",(e)=>{
  if(!mouseDown) return;
  let deltaX = e.clientX - lastX;
  let deltaY = e.clientY - lastY;
  camera.rotation.y -= deltaX*0.002;
  camera.rotation.x -= deltaY*0.002;
  camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
  lastX = e.clientX; lastY = e.clientY;
});

// ==========================
// アニメーションループ
// ==========================
function animate(){
  requestAnimationFrame(animate);
  const speed = 0.1;

  // キーボード移動
  if(keys["w"]) player.position.z -= speed;
  if(keys["s"]) player.position.z += speed;
  if(keys["a"]) player.position.x -= speed;
  if(keys["d"]) player.position.x += speed;

  // 左手ジョイスティック移動
  if(joystick.active){
    const maxDist=40;
    let moveX = joystick.deltaX/maxDist;
    let moveZ = joystick.deltaY/maxDist;
    moveX = Math.max(-1, Math.min(1, moveX));
    moveZ = Math.max(-1, Math.min(1, moveZ));
    player.position.x += moveX*speed;
    player.position.z -= moveZ*speed;
  }

  // カメラ追従（TPS）
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
