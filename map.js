import * as THREE from "three";

let scene, camera, renderer;
const maps = [
  { name: "map1", src: "maps/map1.png" }
];

export function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0,5,10);

  renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff,1);
  light.position.set(10,10,10);
  scene.add(light);

  window.addEventListener("resize", ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

export async function loadMap(mapName) {
  const mapInfo = maps.find(m => m.name===mapName);
  if(!mapInfo) throw new Error("Map not found: "+mapName);

  const img = new Image();
  img.src = mapInfo.src;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img,0,0);
  const data = ctx.getImageData(0,0,img.width,img.height);

  const wallMat = new THREE.MeshStandardMaterial({color:0x000000});
  const floorMat = new THREE.MeshStandardMaterial({color:0x808080, side:THREE.DoubleSide});
  const wallGeo = new THREE.BoxGeometry(1,1,1);
  const floorGeo = new THREE.PlaneGeometry(1,1);

  for(let y=0;y<img.height;y++){
    for(let x=0;x<img.width;x++){
      const idx=(y*img.width+x)*4;
      const r=data.data[idx], g=data.data[idx+1], b=data.data[idx+2];
      const wx=x-img.width/2, wz=y-img.height/2;

      if(r===0 && g===0 && b===0){
        const wall=new THREE.Mesh(wallGeo,wallMat);
        wall.position.set(wx,0.5,wz);
        scene.add(wall);
      } else if(r===128 && g===128 && b===128){
        const floor=new THREE.Mesh(floorGeo,floorMat);
        floor.rotation.x=-Math.PI/2;
        floor.position.set(wx,0,wz);
        scene.add(floor);
      }
    }
  }

  animate();
}

function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene,camera);
}

// --- フェードイン + マップ生成 ---
export function showMapAfterFadeIn(mapName) {
  const fadeOverlay = document.getElementById("fade-overlay");
  if (!fadeOverlay) return;

  fadeOverlay.style.display = "block";
  fadeOverlay.style.opacity = 0;
  fadeOverlay.style.transition = "opacity 1.5s ease";

  requestAnimationFrame(() => {
    fadeOverlay.style.opacity = 1;

    setTimeout(async () => {
      fadeOverlay.style.transition = "opacity 1.5s ease";
      fadeOverlay.style.opacity = 0;
      setTimeout(() => { fadeOverlay.style.display = "none"; }, 1500);

      // マップ生成
      await loadMap(mapName);

    }, 1500); // フェードイン後 1.5秒でマップ表示
  });
}
