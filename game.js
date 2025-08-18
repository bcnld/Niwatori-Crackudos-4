const canvas = document.getElementById('game-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize(window.innerWidth, window.innerHeight);

// ----- 光源 -----
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10,20,10);
scene.add(light);

// ----- 地面 -----
const groundGeo = new THREE.PlaneGeometry(100,100);
const groundMat = new THREE.MeshPhongMaterial({color:0x228B22});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// ----- キャラクター（円柱） -----
const playerGeo = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
const playerMat = new THREE.MeshPhongMaterial({color:0xff0000});
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.y = 1; // 地面に立つ高さ
scene.add(player);

// ----- カメラTPS追従 -----
camera.position.set(0,2,-5);
const controls = new THREE.PointerLockControls(camera, document.body);
document.body.addEventListener('click', ()=>{ controls.lock(); });

// ----- キーボード入力 -----
const keys = {};
document.addEventListener('keydown', e=>keys[e.key]=true);
document.addEventListener('keyup', e=>keys[e.key]=false);
const moveSpeed = 0.1;

// ----- アニメーション -----
function animate(){
    requestAnimationFrame(animate);

    // キーボード移動
    if(keys['w']){
        player.position.x -= Math.sin(camera.rotation.y)*moveSpeed;
        player.position.z -= Math.cos(camera.rotation.y)*moveSpeed;
    }
    if(keys['s']){
        player.position.x += Math.sin(camera.rotation.y)*moveSpeed;
        player.position.z += Math.cos(camera.rotation.y)*moveSpeed;
    }
    if(keys['a']){
        player.position.x -= Math.cos(camera.rotation.y)*moveSpeed;
        player.position.z += Math.sin(camera.rotation.y)*moveSpeed;
    }
    if(keys['d']){
        player.position.x += Math.cos(camera.rotation.y)*moveSpeed;
        player.position.z -= Math.sin(camera.rotation.y)*moveSpeed;
    }

    // キャラの向きはカメラに合わせる
    player.rotation.y = camera.rotation.y;

    // カメラ追従
    const offset = new THREE.Vector3(0,2,-5);
    offset.applyAxisAngle(new THREE.Vector3(0,1,0), camera.rotation.y);
    camera.position.copy(player.position).add(offset);
    camera.lookAt(player.position);

    renderer.render(scene, camera);
}
animate();

// ----- リサイズ対応 -----
window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
