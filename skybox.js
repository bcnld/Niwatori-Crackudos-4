import * as THREE from "three";

let skyMesh;
let time = 0; // 分単位で進行（1日=72分）
let active = false; // 建物内フラグ（true=建物内で表示）

export function initSky(scene) {
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
  skyMesh.visible = false; // 初期は非表示
  scene.add(skyMesh);
}

export function updateSky(delta) {
  // 時間は常に進める
  time += delta * (72 / 4320); // 72分=1日
  if (time > 72) time = 0;

  if (!active) return; // 建物外なら表示しない

  const progress = time / 72;
  const mat = skyMesh.material;

  if (progress < 0.25) {
    mat.uniforms.topColor.value.set(0x87ceeb); // 朝
    mat.uniforms.bottomColor.value.set(0xffe0b2);
  } else if (progress < 0.5) {
    mat.uniforms.topColor.value.set(0x1e90ff); // 昼
    mat.uniforms.bottomColor.value.set(0x87ceeb);
  } else if (progress < 0.75) {
    mat.uniforms.topColor.value.set(0xff4500); // 夕方
    mat.uniforms.bottomColor.value.set(0xffd700);
  } else {
    mat.uniforms.topColor.value.set(0x000033); // 夜
    mat.uniforms.bottomColor.value.set(0x191970);
  }
}

export function enterBuilding() {
  active = true;
  if (skyMesh) skyMesh.visible = true;
}

export function exitBuilding() {
  active = false;
  if (skyMesh) skyMesh.visible = false;
}
