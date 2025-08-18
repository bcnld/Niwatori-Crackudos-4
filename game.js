// ==========================
// 基本設定
// ==========================
const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // 空色

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// ==========================
// ライト
// ==========================
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);

const ambient = new THREE.AmbientLight(0x404040);
scene.add(ambient);

// ==========================
// 地面
// ==========================
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ==========================
// プレイヤー
// ==========================
const player = new THREE.Object3D();
player.position.set(0, 2, 5);
scene.add(player);

const controls = new THREE.PointerLockControls(camera, document.body);
player.add(camera);
camera.position.set(0, 1.6, 0);

// ==========================
// 入力管理
// ==========================
const keys = {};
document.addEventListener("keydown", (e) => (keys[e.code] = true));
document.addEventListener("keyup", (e) => (keys[e.code] = false));

// ==========================
// 常時PointerLock開始
// ==========================
document.body.addEventListener("click", () => {
  controls.lock();
});
controls.addEventListener("lock", () => {
  console.log("PointerLock開始");
});

// ==========================
// 移動処理
// ==========================
const speed = 0.1;
function updatePlayer() {
  let forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  let right = new THREE.Vector3();
  right.crossVectors(camera.up, forward).normalize();

  if (keys["KeyW"]) player.position.add(forward.clone().multiplyScalar(speed));
  if (keys["KeyS"]) player.position.add(forward.clone().multiplyScalar(-speed));
  if (keys["KeyA"]) player.position.add(right.clone().multiplyScalar(speed));
  if (keys["KeyD"]) player.position.add(right.clone().multiplyScalar(-speed));
}

// ==========================
// ループ
// ==========================
function animate() {
  requestAnimationFrame(animate);
  updatePlayer();
  renderer.render(scene, camera);
}
animate();

// ==========================
// ウィンドウリサイズ対応
// ==========================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
