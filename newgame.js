window.startNewGame = async function () {
  // --- 古いゲームUI削除 ---
  const oldBgDiv = document.getElementById("newgame-bg-div");
  if (oldBgDiv) oldBgDiv.remove();
  document.querySelectorAll(".popup").forEach(p => p.remove());

  const fadeOverlay = document.getElementById("fade-overlay");
  const bgm = document.getElementById("bgm");
  if (!fadeOverlay) return;

  // --- メニュー非表示 ---
  const menuWrapper = document.querySelector("div[data-menu-wrapper]");
  if (menuWrapper) menuWrapper.style.display = "none";

  // --- フェードオーバーレイ ---
  fadeOverlay.style.display = "block";
  fadeOverlay.style.opacity = 0;
  fadeOverlay.style.zIndex = 5000;
  fadeOverlay.style.transition = `opacity 2s ease`;
  requestAnimationFrame(() => fadeOverlay.style.opacity = 1);

  // --- 既存BGMフェードアウト ---
  if (bgm && !bgm.paused) {
    if (bgm._fadeOutInterval) clearInterval(bgm._fadeOutInterval);
    const fadeSteps = 60;
    let step = 0;
    const interval = 2000 / fadeSteps;
    await new Promise(resolve => {
      bgm._fadeOutInterval = setInterval(() => {
        step++;
        bgm.volume = Math.max(0, 1 - step / fadeSteps);
        if (step >= fadeSteps) {
          clearInterval(bgm._fadeOutInterval);
          bgm.pause();
          bgm.currentTime = 0;
          resolve();
        }
      }, interval);
    });
  }

  // --- 背景 ---
  const bgDiv = document.createElement("div");
  bgDiv.id = "newgame-bg-div";
  Object.assign(bgDiv.style, {
    position: "fixed",
    top: 0, left: 0,
    width: "100%", height: "100%",
    backgroundColor: "#001022",
    backgroundImage: "url('images/character_select_bg.png')",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    zIndex: 1,
    overflow: "hidden"
  });
  document.body.appendChild(bgDiv);

  // --- 雪 ---
  const snowCount = 20;
  const snowflakes = [];
  for (let i = 0; i < snowCount; i++) {
    const snow = document.createElement("img");
    snow.src = "images/snowflake.png";
    Object.assign(snow.style, {
      position: "absolute",
      top: `${Math.random() * window.innerHeight}px`,
      left: `${Math.random() * window.innerWidth}px`,
      width: "60px", height: "60px",
      pointerEvents: "none",
      transform: `rotate(${Math.random()*360}deg)`,
      zIndex: 2
    });
    bgDiv.appendChild(snow);
    snowflakes.push({
      el: snow,
      speed: Math.random()*2 +1,
      drift: (Math.random()-0.5)*1,
      rotationSpeed: (Math.random()-0.5)*2
    });
  }

  let snowRAF = null;
  function animateSnow() {
    for (let flake of snowflakes) {
      let top = parseFloat(flake.el.style.top);
      let left = parseFloat(flake.el.style.left);
      let match = flake.el.style.transform.match(/rotate([-\d.]+)deg/);
      let rot = match ? parseFloat(match[1]) : 0;
      top += flake.speed;
      left += flake.drift;
      rot += flake.rotationSpeed;
      if (top > window.innerHeight) top = -60;
      if (left < -60) left = window.innerWidth;
      if (left > window.innerWidth) left = -60;
      flake.el.style.top = top + "px";
      flake.el.style.left = left + "px";
      flake.el.style.transform = `rotate(${rot}deg)`;
    }
    snowRAF = requestAnimationFrame(animateSnow);
  }
  animateSnow();

  // --- フェード解除 ---
  fadeOverlay.style.transition = "opacity 1s ease";
  fadeOverlay.style.opacity = 0;
  setTimeout(()=> fadeOverlay.style.display="none",1000);

  // --- 新規BGM ---
  if (bgm) {
    bgm.src = "Sounds/newgame_bgm.mp3";
    bgm.loop = true;
    bgm.volume = 0;
    bgm.play().catch(()=>{});
    if (bgm._fadeInInterval) clearInterval(bgm._fadeInInterval);
    let step=0;
    const steps=60, interval=50;
    bgm._fadeInInterval = setInterval(()=>{
      step++;
      bgm.volume = Math.min(1, step/steps);
      if(step>=steps) clearInterval(bgm._fadeInInterval);
    }, interval);
  }

  // --- キャラクター選択UI ---
  const telop = document.createElement("div");
  telop.id = "telop";
  Object.assign(telop.style, {
    position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
    backgroundColor:"rgba(0,0,0,0.7)", padding:"20px 40px", borderRadius:"10px",
    color:"#fff", fontSize:"28px", fontWeight:"bold", textAlign:"center", zIndex:2200,
    pointerEvents:"auto"
  });
  telop.textContent = "鶏の餌食を選択してください";
  bgDiv.appendChild(telop);

  const modalDim = document.createElement("div");
  modalDim.id = "newgame-modal-dim";
  Object.assign(modalDim.style,{
    position:"fixed", top:"0", left:"0", width:"100%", height:"100%",
    backgroundColor:"rgba(0,0,0,0.45)", zIndex:2100, cursor:"pointer"
  });
  bgDiv.appendChild(modalDim);

  const characterUI = document.createElement("div");
  characterUI.id = "character-ui-wrapper";
  Object.assign(characterUI.style,{
    position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
    zIndex:2000, display:"flex", gap:"60px", pointerEvents:"auto", visibility:"hidden"
  });
  bgDiv.appendChild(characterUI);

  modalDim.addEventListener("click", ()=>{
    modalDim.remove();
    if(telop) telop.remove();
    characterUI.style.visibility="visible";
  });

  const characters = [
    {name:"犬", img:"images/hero1.png"},
    {name:"うんこ", img:"images/hero2.png"}
  ];

  const wrappers=[], imgs=[], auras=[];
  let selectedIndex=null, rotatingImg=null, rotationRAF=null;
  let nameBox=null, btnContainer=null, confirmBtn=null, cancelBtn=null;

  function startRotation(img){
    stopRotation();
    rotatingImg=img;
    let rotateAngle=0;
    rotatingImg.style.willChange="transform";
    rotatingImg.style.backfaceVisibility="visible";
    rotatingImg.style.transformStyle="preserve-3d";
    rotatingImg.style.transition="none";
    const step=()=>{
      rotateAngle+=2;
      if(rotateAngle>=360) rotateAngle-=360;
      rotatingImg.style.transform=`rotateY(${rotateAngle}deg) scale(1.2)`;
      rotationRAF=requestAnimationFrame(step);
    };
    rotationRAF=requestAnimationFrame(step);
  }
  function stopRotation(){
    if(rotationRAF) cancelAnimationFrame(rotationRAF);
    rotationRAF=null;
    if(rotatingImg){
      rotatingImg.style.transition="transform 0.3s ease";
      rotatingImg.style.transform="rotateY(0deg) scale(1)";
      rotatingImg=null;
    }
  }

  // --- 名前入力UI ---
  function showNameInput(c){
    wrappers.forEach(w=>w.style.opacity="1");
    stopRotation();
    const rect = wrappers[selectedIndex].getBoundingClientRect();
    const centerX = rect.left + rect.width/2;
    const bottomY = rect.bottom + 20;

    if(!nameBox){
      nameBox = document.createElement("input");
      nameBox.type="text";
      nameBox.placeholder = `${c.name} の名前を入力してください`;
      Object.assign(nameBox.style,{
        position:"fixed", zIndex:2300, padding:"10px 15px", borderRadius:"8px",
        fontSize:"20px", outline:"none", left:`${centerX}px`, top:`${bottomY}px`,
        transform:"translateX(-50%)"
      });
      bgDiv.appendChild(nameBox);
    }

    if(!btnContainer){
      btnContainer=document.createElement("div");
      Object.assign(btnContainer.style,{
        position:"fixed", zIndex:2300, display:"flex", gap:"40px", justifyContent:"center",
        left:`${centerX}px`, top:`${bottomY+50}px`, transform:"translateX(-50%)"
      });
      bgDiv.appendChild(btnContainer);
    }

    if (!cancelBtn) {
  cancelBtn = document.createElement("button");
  cancelBtn.textContent = "キャンセル";
  Object.assign(cancelBtn.style, {
    padding: "10px 20px",
    fontSize: "20px",
    borderRadius: "8px",
    cursor: "pointer",
  });
  btnContainer.appendChild(cancelBtn);
}

if (!confirmBtn) {
  confirmBtn = document.createElement("button");
  confirmBtn.textContent = "決定";
  Object.assign(confirmBtn.style, {
    padding: "10px 20px",
    fontSize: "20px",
    borderRadius: "8px",
    cursor: "pointer",
  });
  btnContainer.appendChild(confirmBtn);
}

telop.textContent = "鶏の餌食の名前を入力してください";

confirmBtn.onclick = () => {
  const heroName = nameBox.value.trim() || c.name;
  if (confirm(`主人公「${heroName}」でよろしいですか？`)) {
    [nameBox, btnContainer, confirmBtn, cancelBtn].forEach((el) => el && el.remove());
    nameBox = btnContainer = confirmBtn = cancelBtn = null;
    if (telop) telop.remove();
    if (characterUI) characterUI.remove();
    selectedIndex = null;
  }
};

cancelBtn.onclick = () => {
  wrappers.forEach((w, idx) => {
    w.style.transition = "transform 0.6s cubic-bezier(.2,.7,.2,1), opacity 0.4s ease";
    w.style.transform = "translateX(0)";
    w.style.opacity = "1";
  });
  auras.forEach((a) => (a.style.opacity = 0));
  stopRotation();
  selectedIndex = null;
  [nameBox, btnContainer, confirmBtn, cancelBtn].forEach((el) => el && el.remove());
  nameBox = btnContainer = confirmBtn = cancelBtn = null;
  telop.textContent = "鶏の餌食を選択してください";
};

nameBox.focus();

// --- キャラクターUIクリック処理 ---
characters.forEach((c, i) => {
  const charWrapper = document.createElement("div");
  Object.assign(charWrapper.style, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    perspective: "600px",
    position: "relative",
    transition: "transform 0.6s ease, opacity 0.6s ease",
  });

  const aura = document.createElement("div");
  Object.assign(aura.style, {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "220px",
    height: "320px",
    transform: "translate(-50%, -50%) scale(1)",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,255,255,0.6), rgba(0,255,255,0))",
    filter: "blur(20px)",
    opacity: 0,
    transition: "opacity 0.3s ease, transform 0.3s ease",
    zIndex: 0,
  });
  charWrapper.appendChild(aura);

  const charImg = document.createElement("img");
  charImg.src = c.img;
  Object.assign(charImg.style, {
    width: "200px",
    height: "300px",
    objectFit: "contain",
    border: "4px solid transparent",
    borderRadius: "12px",
    transition: "opacity 0.3s ease, border-color 0.3s ease",
    zIndex: 1,
    backfaceVisibility: "visible",
    transformStyle: "preserve-3d",
    willChange: "transform",
  });
  charWrapper.appendChild(charImg);

  const nameLabel = document.createElement("div");
  nameLabel.textContent = c.name;
  Object.assign(nameLabel.style, {
    marginTop: "10px",
    fontSize: "24px",
    fontWeight: "bold",
    color: "#fff",
    textShadow: "2px 2px 4px black",
  });
  charWrapper.appendChild(nameLabel);

  characterUI.appendChild(charWrapper);
  wrappers[i] = charWrapper;
  imgs[i] = charImg;
  auras[i] = aura;

  charWrapper.addEventListener("click", () => {
    new Audio(i === 0 ? "Sounds/select_hero1.mp3" : "Sounds/select_hero2.mp3")
      .play()
      .catch(() => {});
    if (selectedIndex === i) {
      showNameInput(c);
      return;
    }
    if (selectedIndex !== null && selectedIndex !== i) {
      auras[selectedIndex].style.opacity = 0;
      stopRotation();
      imgs[selectedIndex].style.transform = "rotateY(0deg) scale(1)";
    }
    selectedIndex = i;
    auras[i].style.opacity = 1;
    startRotation(imgs[i]);
    telop.textContent = "もう一度クリックで決定。";
  });
});

// --- ポップアップ処理 ---
const popupMedia = [
  { type: "img", src: "images/popup1.gif" },
  { type: "img", src: "images/popup2.gif" },
  { type: "video", src: "videos/popup1.mp4" },
  { type: "video", src: "videos/popup2.mp4" },
  { type: "video", src: "videos/popup3.mp4" },
];
const popupSound = new Audio("Sounds/popup.mp3");
const popupCloseSound = new Audio("Sounds/popup_x.mp3");
const activePopups = [];

function createPopup() {
  if (activePopups.length >= 50) return;
  const selected = popupMedia[Math.floor(Math.random() * popupMedia.length)];
  const popup = document.createElement("div");
  popup.className = "popup";
  const w = window.innerWidth < 768 ? 300 : 400;
  const h = window.innerWidth < 768 ? 250 : 300;
  Object.assign(popup.style, {
    position: "fixed",
    width: w + "px",
    height: h + "px",
    zIndex: 1800,
    overflow: "hidden",
    pointerEvents: "auto",
    opacity: 0,
    transition: "opacity 0.6s ease",
  });

  let mediaEl;
  if (selected.type === "img") {
    mediaEl = document.createElement("img");
    mediaEl.src = selected.src;
    Object.assign(mediaEl.style, { width: "100%", height: "100%", objectFit: "contain" });
  } else {
    mediaEl = document.createElement("video");
    mediaEl.src = selected.src;
    mediaEl.autoplay = true;
    mediaEl.loop = true;
    mediaEl.muted = false;
    Object.assign(mediaEl.style, { width: "100%", height: "100%", objectFit: "contain" });
    mediaEl.play().catch(() => {});
  }
  popup.appendChild(mediaEl);

  const closeBtn = document.createElement("div");
  closeBtn.textContent = "×";
  Object.assign(closeBtn.style, {
    position: "absolute",
    top: "5px",
    right: "10px",
    fontSize: "24px",
    fontWeight: "bold",
    color: "#fff",
    cursor: "pointer",
    zIndex: 2000,
    userSelect: "none",
  });
  closeBtn.addEventListener("click", () => {
    popup.style.opacity = 0;
    setTimeout(() => {
      popup.remove();
      const idx = activePopups.indexOf(popup);
      if (idx >= 0) activePopups.splice(idx, 1);
    }, 500);
    popupCloseSound.currentTime = 0;
    popupCloseSound.play().catch(() => {});
  });
  popup.appendChild(closeBtn);

  const margin = 20;
  popup.style.left = Math.random() * (window.innerWidth - w - margin * 2) + margin + "px";
  popup.style.top = Math.random() * (window.innerHeight - h - margin * 2) + margin + "px";

  document.body.appendChild(popup);
  setTimeout(() => (popup.style.opacity = 1), 10);
  activePopups.push(popup);

  popupSound.currentTime = 0;
  popupSound.play().catch(() => {});
}

setInterval(createPopup, 5000);

// --- ウィンドウリサイズ対応（雪の位置補正） ---
window.addEventListener("resize", () => {
  snowflakes.forEach((flake) => {
    flake.el.style.top = Math.min(parseFloat(flake.el.style.top), window.innerHeight) + "px";
    flake.el.style.left = Math.min(parseFloat(flake.el.style.left), window.innerWidth) + "px";
  });
});
