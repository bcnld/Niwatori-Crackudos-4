// ==========================
// 基本設定
// ==========================
const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111); // 暗めにしてホラー感

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
light.position.set(5, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// ==========================
// 床と壁（簡単なテストマップ）
// ==========================
const floorGeo = new THREE.PlaneGeometry(50, 50);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const wallGeo = new THREE.BoxGeometry(50, 5, 1);
const wallMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
const backWall = new THREE.Mesh(wallGeo, wallMat);
backWall.position.set(0, 2.5, -25);
scene.add(backWall);

// ==========================
// プレイヤー（円柱）
// ==========================
const playerGeo = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
const playerMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, 1, 0);
scene.add(player);

// ==========================
// キーボード入力
// ==========================
const keys = {};
document.addEventListener("keydown", (e) => { keys[e.key.toLowerCase()] = true; });
document.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

// ==========================
// スマホ用ジョイスティック
// ==========================
const joystickBase = document.getElementById("joystickBase");
const joystickKnob = document.getElementById("joystickKnob");
let joystick = { active: false, startX: 0, startY: 0, deltaX: 0, deltaY: 0 };

joystickBase.addEventListener("touchstart", (e) => {
    joystick.active = true;
    const touch = e.touches[0];
    joystick.startX = touch.clientX;
    joystick.startY = touch.clientY;
});

joystickBase.addEventListener("touchmove", (e) => {
    if (!joystick.active) return;
    const touch = e.touches[0];
    joystick.deltaX = touch.clientX - joystick.startX;
    joystick.deltaY = touch.clientY - joystick.startY;
    joystickKnob.style.left = joystick.startX + joystick.deltaX + "px";
    joystickKnob.style.bottom = window.innerHeight - (joystick.startY + joystick.deltaY) + "px";
});

joystickBase.addEventListener("touchend", () => {
    joystick.active = false;
    joystick.deltaX = 0;
    joystick.deltaY = 0;
    joystickKnob.style.left = joystick.startX + "px";
    joystickKnob.style.bottom = joystick.startY + "px";
});

// ==========================
// アニメーションループ
// ==========================
function animate() {
  requestAnimationFrame(animate);

  const speed = 0.1;

  // キーボード移動
  if (keys["w"]) player.position.z -= speed;
  if (keys["s"]) player.position.z += speed;
  if (keys["a"]) player.position.x -= speed;
  if (keys["d"]) player.position.x += speed;

  // スマホジョイスティック移動
  if (joystick.active) {
    const maxDist = 40;
    let moveX = joystick.deltaX / maxDist;
    let moveZ = joystick.deltaY / maxDist;
    moveX = Math.max(-1, Math.min(1, moveX));
    moveZ = Math.max(-1, Math.min(1, moveZ));
    player.position.x += moveX * speed;
    player.position.z -= moveZ * speed;
  }

  // カメラ追従 (TPS視点)
  camera.position.set(player.position.x, player.position.y + 2, player.position.z + 5);
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}
animate();

// ==========================
// リサイズ対応
// ==========================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
