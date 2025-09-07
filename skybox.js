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
      bottomColor: { value: new THREE.Color(0xffffff) }
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

  if (!parentDiv) {
    container = document.createElement("div");
    Object.assign(container.style, {
      position: "fixed",
      top:0, left:0,
      width:"100%", height:"100%",
      opacity:0,
      transition:"opacity 2s ease",
      zIndex:1
    });
    document.body.appendChild(container);
  } else {
    container = parentDiv;
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  container.renderer = renderer;
  container.scene = scene;
  container.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  container.camera.position.set(0, 2, 5);

  scene.add(skyMesh);

  function animate() {
    const delta = 0.016; // おおよそ60FPS
    updateSky(delta);
    renderer.render(scene, container.camera);
    requestAnimationFrame(animate);
  }
  animate();
}

export function updateSky(delta) {
  time += delta * (72 / 4320);
  if (time > 72) time = 0;
  if (!active) return;

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
  if (skyMesh) skyMesh.visible = true;
  if (container) container.style.opacity = 0;
  requestAnimationFrame(() => {
    container.style.opacity = 1; // フェードイン
  });
}

export function exitBuilding() {
  active = false;
  if (skyMesh) skyMesh.visible = false;
}
