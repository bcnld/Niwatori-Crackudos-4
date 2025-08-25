window.startNewGame = async function() {
  // --- DOM要素 ---
  const fadeOverlay = document.getElementById("fade-overlay");
  const bgm = document.getElementById("bgm");

  if (!fadeOverlay) return;

  // --- メニュー非表示 ---
  const menuWrapper = document.querySelector("div[data-menu-wrapper]");
  if (menuWrapper) menuWrapper.style.display = "none";

  // --- フェードオーバーレイ表示 ---
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
    const startVolume = bgm.volume;

    await new Promise(resolve => {
      const fadeOut = setInterval(() => {
        step++;
        bgm.volume = Math.max(0, startVolume * (1 - step / fadeSteps));
        if (step >= fadeSteps) {
          clearInterval(fadeOut);
          bgm.pause();
          bgm.currentTime = 0;
          resolve();
        }
      }, interval);
    });
  }

  // --- 画面クリア ---
  document.body.querySelectorAll("div, img").forEach(el => {
    if (!el.id || el.id === "fade-overlay") el.remove();
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

  // --- 広告ポップアップ ---
  const popupImages = [
    "images/popup_ad1.png",
    "images/popup_ad2.png",
    "images/popup_ad3.png",
    "images/popup_ad4.png",
    "images/popup_ad5.png",
  ];

  function createPopup() {
    const selectedImage = popupImages[Math.floor(Math.random() * popupImages.length)];
    const popup = document.createElement("div");
    Object.assign(popup.style, {
      position: "fixed",
      width: "200px",
      height: "150px",
      backgroundImage: `url(${selectedImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      zIndex: 4000,
      overflow: "hidden",
      opacity: 0,
    });

    const fromTop = Math.random() < 0.5;
    const fromLeft = Math.random() < 0.5;
    popup.style.top = fromTop ? "-200px" : "auto";
    popup.style.bottom = fromTop ? "auto" : "-200px";
    popup.style.left = fromLeft ? "-220px" : "auto";
    popup.style.right = fromLeft ? "auto" : "-220px";

    const closeBtn = document.createElement("div");
    closeBtn.textContent = "×";
    Object.assign(closeBtn.style, {
      position: "absolute",
      top: "5px",
      right: "5px",
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
      fontSize: "18px",
      textShadow: "0 0 3px black",
    });
    closeBtn.addEventListener("click", () => popup.remove());
    popup.appendChild(closeBtn);

    document.body.appendChild(popup);

    requestAnimationFrame(() => {
      popup.style.transition = "all 1s ease";
      popup.style.opacity = 1;
      if (fromTop) popup.style.top = "20px";
      else popup.style.bottom = "20px";
      if (fromLeft) popup.style.left = "20px";
      else popup.style.right = "20px";
    });

    setTimeout(() => popup.remove(), 10000);
  }

  createPopup();
  setInterval(() => createPopup(), 5000 + Math.random() * 5000);
};
