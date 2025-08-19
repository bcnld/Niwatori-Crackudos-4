// ======= 基本設定 =======
const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

// ======= ライト =======
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10,20,10);
scene.add(dirLight);

const ambLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambLight);

// ======= 床 =======
const floorMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const floorGeo = new THREE.PlaneGeometry(50,50);
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// ======= 壁 =======
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
walls.forEach(w => scene.add(w));

// ======= プレイヤー =======
const playerGeo = new THREE.CylinderGeometry(0.5,0.5,2,16);
const playerMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0,1,0);
scene.add(player);

// ======= カメラ追従 =======
camera.position.set(0,3,10);
camera.lookAt(player.position);

// ======= キーボード移動 =======
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function animate(){
  requestAnimationFrame(animate);
  const speed = 0.1;

  if(keys["w"]) player.position.z -= speed;
  if(keys["s"]) player.position.z += speed;
  if(keys["a"]) player.position.x -= speed;
  if(keys["d"]) player.position.x += speed;

  // TPSカメラ追従
  camera.position.set(player.position.x, player.position.y+3, player.position.z+10);
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
