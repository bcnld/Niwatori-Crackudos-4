body {// ==========================
// 基本設定
// ==========================
const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

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
light.position.set(10, 20, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// ==========================
// テストマップ（床・壁）
// ==========================
const floorMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const wallMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
const wall1 = new THREE.Mesh(new THREE.BoxGeometry(50, 5, 1), wallMat);
wall1.position.set(0, 2.5, -20);
scene.add(wall1);

const wall2 = new THREE.Mesh(new THREE.BoxGeometry(50, 5, 1), wallMat);
wall2.position.set(0, 2.5, 20);
scene.add(wall2);

const wall3 = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 50), wallMat);
wall3.position.set(-25, 2.5, 0);
scene.add(wall3);

const wall4 = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 50), wallMat);
wall4.position.set(25, 2.5, 0);
scene.add(wall4);

// ==========================
// プレイヤー
// ==========================
const playerGeo = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
const playerMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, 1, 0);
scene.add(player);

// ==========================
// 入力管理（キーボード）
// ==========================
const keys = {};
document.addEventListener("keydown", (e) => { keys[e.key.toLowerCase()] = true; });
document.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

// ==========================
// ジョイスティック（スマホ対応）
// ==========================
const joystickBase = document.getElementById("joystickBase");
const joystickKnob = document.getElementById("joystickKnob");

let joystick = {
  active: false,
  startX: 0,
  startY: 0,
  deltaX: 0,
  deltaY: 0
};

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
  joystickKnob.style.top = joystick.startY + joystick.deltaY + "px";
});

joystickBase.addEventListener("touchend", () => {
  joystick.active = false;
  joystick.deltaX = 0;
  joystick.deltaY = 0;
  joystickKnob.style.left = joystick.startX + "px";
  joystickKnob.style.top = joystick.startY + "px";
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

  // ジョイスティック移動
  if (joystick.active) {
    const maxDist = 40;
    let moveX = joystick.deltaX / maxDist;
    let moveZ = joystick.deltaY / maxDist;
    moveX = Math.max(-1, Math.min(1, moveX));
    moveZ = Math.max(-1, Math.min(1, moveZ));
    player.position.x += moveX * speed;
    player.position.z -= moveZ * speed; // Y軸向きは逆
  }

  // カメラ追従 (TPS)
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
  margin: 0;
  overflow: hidden;
  background: black;
}

canvas {
  display: block;
}

/* ジョイスティック */
#joystickBase, #joystickKnob {
  position: absolute;
  touch-action: none;
  border-radius: 50%;
}

#joystickBase {
  width: 80px;
  height: 80px;
  background: rgba(200,200,200,0.3);
  left: 20px;
  bottom: 20px;
}

#joystickKnob {
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,0.6);
  left: 60px; /* 中心に合わせる */
  bottom: 60px; /* 中心に合わせる */
  transform: translate(-50%, -50%);
}

/* タッチ端末でのみ表示 */
@media (pointer: coarse) {
  #joystickBase, #joystickKnob {
    display: block;
  }
}

/* PCでも確認用に一時的に表示 */
@media (pointer: fine) {
  #joystickBase, #joystickKnob {
    display: block;
  }
}
