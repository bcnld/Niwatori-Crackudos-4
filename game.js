// --- Three.js を使ったバイオ4風 村マップJS完全版（map.json読み込み版） ---
import * as THREE from "three";

// 基本セットアップ
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ライト
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// --- プレイヤー ---
const player = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.5, 1.0, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0x0000ff })
);
player.position.set(0, 1, 0);
scene.add(player);

// キー入力
const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// 移動パラメータ
const moveSpeed = 0.1;
const rotateSpeed = 0.03;
const cameraOffset = new THREE.Vector3(0, 5, 10);

let wallMeshes = [];

// --- map.json 読み込み ---
let mapData = null;
fetch("map.json")
  .then(res => res.json())
  .then(data => {
    mapData = data;
    createMap(mapData);
  })
  .catch(err => console.error("map.json読み込みエラー", err));

function createMap(data) {
  // 床
  const floorMat = new THREE.MeshPhongMaterial({ color: data.floor.color });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(data.floor.width, data.floor.depth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // 壁
  data.walls.forEach(w => {
    const wallMat = new THREE.MeshPhongMaterial({ color: w.color });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w.width, w.height, w.depth), wallMat);
    wall.position.set(w.x, w.y, w.z);
    scene.add(wall);
    wallMeshes.push(wall);
  });

  // props（小屋・木・柵など）
  if (data.props) {
    data.props.forEach(p => {
      const propMat = new THREE.MeshPhongMaterial({ color: p.color });
      const prop = new THREE.Mesh(new THREE.BoxGeometry(p.width, p.height, p.depth), propMat);
      prop.position.set(p.x, p.y, p.z);
      scene.add(prop);
    });
  }
}

// --- 衝突判定 ---
function checkCollision(pos) {
  const playerBB = new THREE.Box3().setFromCenterAndSize(pos, new THREE.Vector3(1, 2, 1));
  for (let wall of wallMeshes) {
    const wallBB = new THREE.Box3().setFromObject(wall);
    if (playerBB.intersectsBox(wallBB)) return true;
  }
  return false;
}

// --- アニメーションループ ---
function animate() {
  requestAnimationFrame(animate);

  let dir = new THREE.Vector3();
  if (keys["w"] || keys["ArrowUp"]) dir.z -= 1;
  if (keys["s"] || keys["ArrowDown"]) dir.z += 1;
  if (keys["a"] || keys["ArrowLeft"]) player.rotation.y += rotateSpeed;
  if (keys["d"] || keys["ArrowRight"]) player.rotation.y -= rotateSpeed;

  if (dir.length() > 0) {
    dir.normalize();
    const move = new THREE.Vector3(dir.x, 0, dir.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y).multiplyScalar(moveSpeed);
    const newPos = player.position.clone().add(move);
    if (!checkCollision(newPos)) player.position.copy(newPos);
  }

  // カメラ追従
  const camPos = player.position.clone().add(cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y));
  camera.position.lerp(camPos, 0.1);
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}
animate();

// --- リサイズ対応 ---
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
