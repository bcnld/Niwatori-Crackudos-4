window.startNewGame = async function() {
  const fadeOverlay = document.getElementById("fade-overlay");
  const bgm = document.getElementById("bgm");
  const titleImg2 = document.getElementById("title-img2");
  if (!fadeOverlay) return;

  // --- メニュー非表示 ---
  const menuWrapper = document.querySelector("div[data-menu-wrapper]");
  if (menuWrapper) menuWrapper.style.display = "none";

  // --- タイトル2消去 ---
  if (titleImg2) {
    titleImg2.style.transition = "opacity 0.5s ease";
    titleImg2.style.opacity = 0;
    setTimeout(() => titleImg2.remove(), 500);
  }

  // --- フェードオーバーレイ ---
  fadeOverlay.style.display = "block";
  fadeOverlay.style.opacity = 0;
  fadeOverlay.style.zIndex = 5000;
  const fadeDuration = 2000;
  fadeOverlay.style.transition = `opacity ${fadeDuration}ms ease`;
  requestAnimationFrame(() => fadeOverlay.style.opacity = 1);

  // --- 既存BGMフェードアウト ---
  if (bgm && !bgm.paused) {
    const fadeSteps = 60;
    let step = 0;
    const interval = fadeDuration / fadeSteps;
    await new Promise(resolve => {
      const fadeOut = setInterval(() => {
        step++;
        bgm.volume = Math.max(0, bgm.volume * (1 - step / fadeSteps));
        if (step >= fadeSteps) {
          clearInterval(fadeOut);
          bgm.pause();
          bgm.currentTime = 0;
          resolve();
        }
      }, interval);
    });
  }

  // --- 画面クリア（フェードオーバーレイ以外） ---
  document.body.querySelectorAll("div, img, video").forEach(el => {
    if (!el.id || el.id === "fade-overlay") return;
    el.remove();
  });

  // --- 背景生成 ---
  const bgDiv = document.createElement("div");
  Object.assign(bgDiv.style, {
    position: "fixed",
    top: 0, left: 0,
    width: "100%", height: "100%",
    backgroundColor: "#001022",
    backgroundImage: "url('images/character_select_bg.png')",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    zIndex: 1,
    overflow: "hidden",
  });
  document.body.appendChild(bgDiv);

  // --- 雪生成 ---
  const snowCount = 20;
  const snowflakes = [];
  for (let i = 0; i < snowCount; i++) {
    const snow = document.createElement("img");
    snow.src = "images/snowflake.png";
    Object.assign(snow.style, {
      position: "absolute",
      top: `${Math.random() * window.innerHeight}px`,
      left: `${Math.random() * window.innerWidth}px`,
      width: "60px",
      height: "60px",
      pointerEvents: "none",
      transform: `rotate(${Math.random() * 360}deg)`,
      zIndex: 2,
    });
    bgDiv.appendChild(snow);
    snowflakes.push({
      el: snow,
      speed: Math.random() * 2 + 1,
      drift: (Math.random() - 0.5) * 1,
      rotationSpeed: (Math.random() - 0.5) * 2
    });
  }

  function animateSnow() {
    for (let flake of snowflakes) {
      let top = parseFloat(flake.el.style.top);
      let left = parseFloat(flake.el.style.left);
      let rot = parseFloat(flake.el.style.transform.replace(/[^\d.-]/g, "")) || 0;
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
    requestAnimationFrame(animateSnow);
  }
  animateSnow();

  // --- フェード解除 ---
  fadeOverlay.style.transition = "opacity 1s ease";
  fadeOverlay.style.opacity = 0;
  setTimeout(() => fadeOverlay.style.display = "none", 1000);

  // --- キャラクター選択UI ---
  const characterUI = document.createElement("div");
  characterUI.textContent = "ここにキャラクター選択UIを表示";
  Object.assign(characterUI.style, {
    position: "fixed",
    top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 1000,
    color: "#fff",
    fontSize: "24px",
    fontWeight: "bold",
    textAlign: "center",
  });
  bgDiv.appendChild(characterUI);

  // --- 新規BGM再生（フェードイン） ---
  if (bgm) {
    bgm.src = "Sounds/newgame_bgm.mp3";
    bgm.loop = true;
    bgm.volume = 0;
    bgm.play().catch(()=>{});

    let step = 0;
    const steps = 60;
    const interval = 50;
    const fadeInAudio = setInterval(() => {
      step++;
      bgm.volume = Math.min(1, step / steps);
      if (step >= steps) clearInterval(fadeInAudio);
    }, interval);
  }

  // --- ポップアップ設定（GIF2 + MP43、音付き） ---
  const popupMedia = [
    { type: "img", src: "images/popup1.gif" },
    { type: "img", src: "images/popup2.gif" },
    { type: "video", src: "videos/popup1.mp4" },
    { type: "video", src: "videos/popup2.mp4" },
    { type: "video", src: "videos/popup3.mp4" },
  ];

  const popupSound = new Audio("Sounds/popup.mp3");
  const popupCloseSound = new Audio("Sounds/popup_x.mp3");

  function createPopup() {
    const selected = popupMedia[Math.floor(Math.random() * popupMedia.length)];
    const popup = document.createElement("div");
    Object.assign(popup.style, {
      position: "fixed",
      width: window.innerWidth < 768 ? "300px" : "400px",
      height: window.innerWidth < 768 ? "250px" : "300px",
      zIndex: 4000,
      overflow: "hidden",
      pointerEvents: "auto",
    });

    // ランダム位置
    const maxLeft = window.innerWidth - parseInt(popup.style.width);
    const maxTop = window.innerHeight - parseInt(popup.style.height);
    popup.style.left = Math.floor(Math.random() * maxLeft) + "px";
    popup.style.top = Math.floor(Math.random() * maxTop) + "px";

    let mediaEl;
    if (selected.type === "img") {
      mediaEl = document.createElement("img");
      mediaEl.src = selected.src;
      Object.assign(mediaEl.style, { width: "100%", height: "100%", objectFit: "contain" });
    } else if (selected.type === "video") {
      mediaEl = document.createElement("video");
      mediaEl.src = selected.src;
      mediaEl.autoplay = true;
      mediaEl.loop = true;
      mediaEl.muted = false; // 音付き
      mediaEl.volume = 1;
      mediaEl.playsInline = true;
      mediaEl.controls = false;
      Object.assign(mediaEl.style, { width: "100%", height: "100%", objectFit: "contain" });
    }
    popup.appendChild(mediaEl);

    // ×ボタン
    const closeBtn = document.createElement("div");
    closeBtn.textContent = "×";
    Object.assign(closeBtn.style, {
      position: "absolute",
      top: "5px", right: "8px",
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
      fontSize: "28px",
      textShadow: "0 0 5px black",
      zIndex: 5001
    });
    closeBtn.addEventListener("click", () => {
      popupCloseSound.currentTime = 0;
      popupCloseSound.play().catch(()=>{});
      popup.remove();
    });
    popup.appendChild(closeBtn);

    document.body.appendChild(popup);

    // 出現音
    popupSound.currentTime = 0;
    popupSound.play().catch(()=>{});
  }

  createPopup();
  setInterval(() => createPopup(), 4000 + Math.random() * 4000);
};
