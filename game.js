// ==========================
// 基本設定
// ==========================
const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

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
// 主人公ニワトリ
// ==========================
const player = new THREE.Object3D();
player.position.set(0,1,0);
scene.add(player);

// 体
const bodyGeo = new THREE.CylinderGeometry(0.5,0.5,1,16);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
bodyMesh.position.y = 0.5;
player.add(bodyMesh);

// 頭
const headGeo = new THREE.SphereGeometry(0.3,16,16);
const headMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
const headMesh = new THREE.Mesh(headGeo, headMat);
headMesh.position.y = 1.1;
player.add(headMesh);

// ==========================
// キーボード入力
// ==========================
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ==========================
// マップ読み込み
// ==========================
let floor, walls = [];
fetch('map.json')
  .then(res => res.json())
  .then(maps => {
    const startMap = maps.find(m => m.name === "VillageStart");
    if (!startMap) throw new Error("開始マップが見つかりません");

    // 床
    const floorMat = new THREE.MeshStandardMaterial({ color: startMap.floor.color });
    floor = new THREE.Mesh(
      new THREE.PlaneGeometry(startMap.floor.width, startMap.floor.height || startMap.floor.depth),
      floorMat
    );
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);

    // 壁
    startMap.walls.forEach(w => {
      const wallMat = new THREE.MeshStandardMaterial({ color: w.color });
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w.width, w.height, w.depth), wallMat);
      wall.position.set(w.x, w.y, w.z);
      scene.add(wall);
      walls.push(wall);
    });

    // プロップ（車など）
    if (startMap.props) {
      startMap.props.forEach(p => {
        const propMat = new THREE.MeshStandardMaterial({ color: p.color });
        const prop = new THREE.Mesh(new THREE.BoxGeometry(p.width, p.height, p.depth), propMat);
        prop.position.set(p.x, p.y, p.z);
        scene.add(prop);
      });
    }
  });

// ==========================
// カメラTPS追従
// ==========================
function updateCamera() {
  camera.position.set(player.position.x, player.position.y + 2, player.position.z + 5);
  camera.lookAt(player.position);
}

// ==========================
// アニメーションループ
// ==========================
function animate() {
  requestAnimationFrame(animate);
  const speed = 0.1;

  // キーボード移動
  if(keys["w"]) player.position.z -= speed;
  if(keys["s"]) player.position.z += speed;
  if(keys["a"]) player.position.x -= speed;
  if(keys["d"]) player.position.x += speed;

  updateCamera();
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
