// Roblox風キャラクター描画（Third-Person用）
export function createCharacterMesh() {
  // 頭
  const headGeo = new THREE.BoxGeometry(0.6,0.6,0.6);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc66 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.8;

  // 胴体
  const bodyGeo = new THREE.BoxGeometry(0.5,0.8,0.3);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3399ff });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.2;

  // 左右腕
  const armGeo = new THREE.BoxGeometry(0.15,0.6,0.15);
  const armMat = new THREE.MeshStandardMaterial({ color: 0x33cc33 });
  const armL = new THREE.Mesh(armGeo, armMat);
  armL.position.set(-0.35,1.35,0);
  const armR = new THREE.Mesh(armGeo, armMat);
  armR.position.set(0.35,1.35,0);

  // 左右脚
  const legGeo = new THREE.BoxGeometry(0.2,0.7,0.2);
  const legMat = new THREE.MeshStandardMaterial({ color: 0xcc3333 });
  const legL = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.15,0.55,0);
  const legR = new THREE.Mesh(legGeo, legMat);
  legR.position.set(0.15,0.55,0);

  // まとめてグループ化
  const group = new THREE.Group();
  group.add(head);
  group.add(body);
  group.add(armL);
  group.add(armR);
  group.add(legL);
  group.add(legR);

  return group;
}

// 歩行アニメーション
export function animateCharacter(mesh, state, t) {
  const swing = state === "walk" ? 0.6 : state === "run" ? 1.0 : 0;
  mesh.children.forEach(part => {
    if(part.geometry.parameters.height === 0.7){ // 脚
      const dir = part.position.x>0?-1:1;
      part.rotation.x = Math.sin(t*8)*swing*dir;
    }
    if(part.geometry.parameters.height === 0.6){ // 腕
      const dir = part.position.x>0?-1:1;
      part.rotation.x = Math.sin(t*8+Math.PI)*swing*dir;
    }
  });
}
