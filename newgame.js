window.startNewGame = async function () {
  const fadeOverlay = document.getElementById("fade-overlay");
  const bgm = document.getElementById("bgm");
  if (!fadeOverlay) return;

  // --- メニュー非表示 ---
  const menuWrapper = document.querySelector("div[data-menu-wrapper]");
  if (menuWrapper) menuWrapper.style.display = "none";

  // --- フェードイン ---
  fadeOverlay.style.display = "block";
  fadeOverlay.style.opacity = 0;
  fadeOverlay.style.zIndex = 5000;
  fadeOverlay.style.transition = "opacity 2s ease";
  requestAnimationFrame(() => (fadeOverlay.style.opacity = 1));

  // --- BGMフェードアウト ---
  if (bgm && !bgm.paused) {
    await new Promise((resolve) => {
      const fadeSteps = 60;
      let step = 0;
      const interval = 2000 / fadeSteps;
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

  // --- 画面クリア ---
  document.body.querySelectorAll("div, img, video").forEach((el) => {
    if (!el.id || el.id === "fade-overlay") return;
    el.remove();
  });

  // --- オーバーレイ ---
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#001022",
    overflow: "hidden",
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  });
  document.body.appendChild(overlay);

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
      width: "60px",
      height: "60px",
      pointerEvents: "none",
      transform: `rotate(${Math.random() * 360}deg)`,
      zIndex: 1,
    });
    overlay.appendChild(snow);
    snowflakes.push({
      el: snow,
      speed: Math.random() * 2 + 1,
      drift: (Math.random() - 0.5) * 1,
      rotationSpeed: (Math.random() - 0.5) * 2,
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
  setTimeout(() => (fadeOverlay.style.display = "none"), 1000);

  // --- BGM新規 ---
  if (bgm) {
    bgm.src = "Sounds/newgame_bgm.mp3";
    bgm.loop = true;
    bgm.volume = 0;
    bgm.play().catch(() => {});
    let step = 0;
    const steps = 60;
    const interval = 50;
    const fadeInAudio = setInterval(() => {
      step++;
      bgm.volume = Math.min(1, step / steps);
      if (step >= steps) clearInterval(fadeInAudio);
    }, interval);
  }

  // --- テロップ ---
  const telop = document.createElement("div");
  Object.assign(telop.style, {
    position: "fixed",
    top: "10%",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: "20px 40px",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "28px",
    fontWeight: "bold",
    textAlign: "center",
    zIndex: 2000,
  });
  telop.textContent = "主人公を選択してください";
  overlay.appendChild(telop);

  // --- キャラクターUI ---
  const characterUI = document.createElement("div");
  Object.assign(characterUI.style, {
    display: "flex",
    gap: "60px",
    zIndex: 2000,
  });
  overlay.appendChild(characterUI);

  const characters = [
    { name: "犬", img: "images/hero1.png" },
    { name: "うんこ", img: "images/hero2.png" },
  ];

  const wrappers = [];
  const imgs = [];
  const auras = [];
  let selectedIndex = null;
  let rotatingImg = null;
  let rotationRAF = null;
  let nameBox = null;
  let confirmBtn = null;
  let cancelBtn = null;

  function startRotation(img) {
    stopRotation();
    rotatingImg = img;
    let angle = 0;
    function step() {
      angle += 2;
      if (angle >= 360) angle -= 360;
      rotatingImg.style.transform = `rotateY(${angle}deg) scale(1.2)`;
      rotationRAF = requestAnimationFrame(step);
    }
    rotationRAF = requestAnimationFrame(step);
  }

  function stopRotation() {
    if (rotationRAF) cancelAnimationFrame(rotationRAF);
    rotationRAF = null;
    if (rotatingImg) rotatingImg.style.transform = "rotateY(0deg) scale(1)";
    rotatingImg = null;
  }

  function showNameInput(c) {
    if (!nameBox) {
      nameBox = document.createElement("input");
      nameBox.type = "text";
      nameBox.placeholder = "名前を入力してください";
      Object.assign(nameBox.style, {
        fontSize: "20px",
        padding: "10px 15px",
        borderRadius: "8px",
        marginTop: "20px",
      });
      overlay.appendChild(nameBox);
    }

    if (!confirmBtn) {
      confirmBtn = document.createElement("button");
      confirmBtn.textContent = "決定";
      Object.assign(confirmBtn.style, { fontSize: "20px", margin: "10px", padding: "10px 20px" });
      overlay.appendChild(confirmBtn);
    }

    if (!cancelBtn) {
      cancelBtn = document.createElement("button");
      cancelBtn.textContent = "キャンセル";
      Object.assign(cancelBtn.style, { fontSize: "20px", margin: "10px", padding: "10px 20px" });
      overlay.appendChild(cancelBtn);
    }

    telop.textContent = "主人公の名前を決めてください";

    confirmBtn.onclick = () => {
      const heroName = nameBox.value.trim() || c.name;
      if (confirm(`主人公「${heroName}」でよろしいですか？`)) {
        console.log(`確定: ${c.name}, 名前: ${heroName}`);
        [nameBox, confirmBtn, cancelBtn, characterUI, telop].forEach((el) => el?.remove());
      }
    };

    cancelBtn.onclick = () => {
      stopRotation();
      auras[selectedIndex].style.opacity = 0;
      selectedIndex = null;
      [nameBox, confirmBtn, cancelBtn].forEach((el) => el?.remove());
      telop.textContent = "主人公を選択してください";
    };
  }

  characters.forEach((c, i) => {
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, { textAlign: "center", cursor: "pointer", position: "relative" });

    const aura = document.createElement("div");
    Object.assign(aura.style, {
      position: "absolute", top: "50%", left: "50%",
      width: "220px", height: "320px", transform: "translate(-50%, -50%)",
      borderRadius: "50%", background: "radial-gradient(circle, rgba(0,255,255,0.6), rgba(0,255,255,0))",
      filter: "blur(20px)", opacity: 0, transition: "opacity 0.3s",
      zIndex: 0,
    });
    wrapper.appendChild(aura);

    const img = document.createElement("img");
    img.src = c.img;
    Object.assign(img.style, { width: "200px", height: "300px", borderRadius: "12px", zIndex: 1 });
    wrapper.appendChild(img);

    const label = document.createElement("div");
    label.textContent = c.name;
    Object.assign(label.style, { color: "#fff", fontWeight: "bold", marginTop: "10px" });
    wrapper.appendChild(label);

    characterUI.appendChild(wrapper);
    wrappers[i] = wrapper;
    imgs[i] = img;
    auras[i] = aura;

    wrapper.addEventListener("click", () => {
      if (selectedIndex === i) {
        showNameInput(c);
        return;
      }
      if (selectedIndex !== null) {
        stopRotation();
        auras[selectedIndex].style.opacity = 0;
      }
      selectedIndex = i;
      auras[i].style.opacity = 1;
      startRotation(imgs[i]);
      telop.textContent = "もう一度クリックで決定";
    });
  });

  // --- ポップアップ ---
  const popupMedia = [
    { type: "img", src: "images/popup1.gif" },
    { type: "img", src: "images/popup2.gif" },
    { type: "video", src: "videos/popup1.mp4" },
  ];

  function createPopup() {
    const selected = popupMedia[Math.floor(Math.random() * popupMedia.length)];
    const popup = document.createElement("div");
    Object.assign(popup.style, {
      position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
      width: "400px", height: "300px", zIndex: 4000, background: "#000", borderRadius: "10px", overflow: "hidden", opacity: 0,
    });

    let mediaEl;
    if (selected.type === "img") {
      mediaEl = document.createElement("img");
      mediaEl.src = selected.src;
    } else {
      mediaEl = document.createElement("video");
      mediaEl.src = selected.src;
      mediaEl.autoplay = true;
      mediaEl.loop = true;
      mediaEl.muted = false;
      mediaEl.play().catch(() => {});
    }
    Object.assign(mediaEl.style, { width: "100%", height: "100%", objectFit: "contain" });
    popup.appendChild(mediaEl);

    const closeBtn = document.createElement("div");
    closeBtn.textContent = "×";
    Object.assign(closeBtn.style, { position: "absolute", top: "5px", right: "8px", color: "#fff", fontSize: "28px", cursor: "pointer" });
    closeBtn.onclick = () => popup.remove();
    popup.appendChild(closeBtn);

    overlay.appendChild(popup);
    requestAnimationFrame(() => (popup.style.opacity = 1));
  }

  createPopup();
  setInterval(() => createPopup(), 6000 + Math.random() * 4000);
};
