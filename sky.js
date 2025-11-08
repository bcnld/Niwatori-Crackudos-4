// sky.js（修正済み）
import * as THREE from "three";

let skyMesh;
let time = 0;
let active = false;
let container;

export function initSky(scene, parentDiv) {
  const geo = new THREE.SphereGeometry(500, 32, 32);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x87ceeb) },
      bottomColor: { value: new THREE.Color(0xffe0b2) }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0,100.0,0.0)).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, pow(max(h, 0.0), 0.6)), 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false
  });

  skyMesh = new THREE.Mesh(geo, mat);
  skyMesh.visible = false;
  scene.add(skyMesh);

  // --- container 作成（body に追加）---
  if (!parentDiv) {
    container = document.createElement("div");
    Object.assign(container.style, {
      position: "fixed",
      top: 0, left: 0,
      width: "100%", height: "100%",
      background: "#000",           // 保険：透明でも黒背景
      zIndex: 0,                    // fade-overlay (9999) の下
      opacity: 1,                   // 最初から表示（フェードは newgame.js 任せ）
      pointerEvents: "none"         // マウス操作を game に通す
    });
    document.body.appendChild(container);
  } else {
    container = parentDiv;
  }

  // --- Three.js レンダラー ---
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); // alpha: false で黒背景
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // カメラ
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  // コンテナに保存
  container.renderer = renderer;
  container.scene = scene;
  container.camera = camera;

  // --- アニメーションループ ---
  function animate() {
    const delta = 0.016;
    updateSky(delta);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // ウィンドウリサイズ対応
  window.addEventListener("resize", () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
}

export function updateSky(delta) {
  if (!active) return;
  time += delta * (72 / 4320);
  if (time > 72) time = 0;

  const progress = time / 72;
  const mat = skyMesh.material;

  if (progress < 0.25) {
    mat.uniforms.topColor.value.set(0x87ceeb);
    mat.uniforms.bottomColor.value.set(0xffe0b2);
  } else if (progress < 0.5) {
    mat.uniforms.topColor.value.set(0x1e90ff);
    mat.uniforms.bottomColor.value.set(0x87ceeb);
  } else if (progress < 0.75) {
    mat.uniforms.topColor.value.set(0xff4500);
    mat.uniforms.bottomColor.value.set(0xffd700);
  } else {
    mat.uniforms.topColor.value.set(0x000033);
    mat.uniforms.bottomColor.value.set(0x191970);
  }
}

export function enterBuilding() {
  active = true;
  time = 0; // 朝から開始

  if (skyMesh) {
    skyMesh.visible = true;
    skyMesh.material.uniforms.topColor.value.set(0x87ceeb);
    skyMesh.material.uniforms.bottomColor.value.set(0xffe0b2);
  }

  // --- フェードインは newgame.js の fade-overlay に任せる ---
  // container.style.opacity = 1;  ← 削除！
  console.log("sky.js: enterBuilding() 実行 → 朝の空表示");
}

export function exitBuilding() {
  active = false;
  if (skyMesh) skyMesh.visible = false;
  console.log("sky.js: exitBuilding() 実行");
}
