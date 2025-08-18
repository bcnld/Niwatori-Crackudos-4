// ----- シーン・カメラ・レンダラー -----
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ----- 環境光とライト -----
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7).normalize();
scene.add(light);

// ----- 地面 -----
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshPhongMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ----- 壁（テスト用の箱） -----
const boxGeo = new THREE.BoxGeometry(5, 5, 5);
const boxMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
const box = new THREE.Mesh(boxGeo, boxMat);
box.position.set(0, 2.5, -10);
scene.add(box);

// ----- プレイヤー（カメラ位置） -----
const player = new THREE.Object3D();
player.position.set(0, 1.7, 5); // 地面から少し上
scene.add(player);

camera.position.set(0, 2, -5);
player.add(camera); // カメラをプレイヤーに追従させる

// ----- 移動制御 -----
const keys = {};
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

function animate() {
  requestAnimationFrame(animate);

  let speed = 0.1;
  if (keys['KeyW']) player.position.z -= speed; // 前進
  if (keys['KeyS']) player.position.z += speed; // 後退
  if (keys['KeyA']) player.position.x -= speed; // 左
  if (keys['KeyD']) player.position.x += speed; // 右

  renderer.render(scene, camera);
}
animate();

// ----- 画面リサイズ対応 -----
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
