window.startNewGame = async function () {
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
  requestAnimationFrame(() => (fadeOverlay.style.opacity = 1));

  // --- 既存BGMフェードアウト ---
  if (bgm && !bgm.paused) {
    const fadeSteps = 60;
    let step = 0;
    const interval = 2000 / fadeSteps;
    await new Promise((resolve) => {
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

  // --- 背景 ---
  const bgDiv = document.createElement("div");
  Object.assign(bgDiv.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#001022",
    backgroundImage: "url('images/character_select_bg.png')",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    zIndex: 1,
    overflow: "hidden",
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

  // --- 新規BGM ---
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
    zIndex: 1200,
  });
  telop.textContent = "主人公を選択してください";
  document.body.appendChild(telop);

  // --- キャラクターUI ---
  const characterUI = document.createElement("div");
  Object.assign(characterUI.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 1000,
    display: "flex",
    gap: "60px",
  });
  bgDiv.appendChild(characterUI);

  const characters = [
    { name: "犬", img: "images/hero1.png" },
    { name: "うんこ", img: "images/hero2.png" },
  ];

  // --- 状態管理 ---
  const wrappers = [];
  const imgs = [];
  const auras = [];
  let selectedIndex = null;
  let rotatingImg = null;
  let rotationRAF = null;
  let nameBox = null;
  let confirmBtn = null;
  let cancelBtn = null;

  // --- 回転 ---
  function startRotation(img) {
    stopRotation();
    rotatingImg = img;
    let rotateAngle = 0;
    rotatingImg.style.willChange = "transform";
    rotatingImg.style.backfaceVisibility = "visible";
    rotatingImg.style.transformStyle = "preserve-3d";
    rotatingImg.style.transition = "none";
    const step = () => {
      rotateAngle += 2;
      if (rotateAngle >= 360) rotateAngle -= 360;
      rotatingImg.style.transform = `rotateY(${rotateAngle}deg) scale(1.2)`;
      rotationRAF = requestAnimationFrame(step);
    };
    rotationRAF = requestAnimationFrame(step);
  }

  function stopRotation() {
    if (rotationRAF) cancelAnimationFrame(rotationRAF);
    rotationRAF = null;
    if (rotatingImg) {
      rotatingImg.style.transition = "transform 0.3s ease";
      rotatingImg.style.transform = "rotateY(0deg) scale(1)";
      rotatingImg = null;
    }
  }

  // --- 飛ばす／戻す ---
  function flyOut(otherIndex, selectedIdx) {
    const w = wrappers[otherIndex];
    if (!w) return;
    const dir = selectedIdx === 0 ? 1 : -1;
    const dist = window.innerWidth + 400;
    w.style.transition = "transform 0.7s cubic-bezier(.2,.7,.2,1), opacity 0.7s ease";
    w.style.transform = `translateX(${dir * dist}px)`;
    w.style.opacity = "0";
    w.dataset.offscreen = "1";
  }

  function flyIn(index) {
    const w = wrappers[index];
    if (!w) return;
    w.style.transition = "transform 0.6s cubic-bezier(.2,.7,.2,1), opacity 0.4s ease";
    w.style.transform = "translateX(0)";
    w.style.opacity = "1";
    w.dataset.offscreen = "0";
  }

  function showNameInput(c) {
    if (!nameBox) {
      nameBox = document.createElement("input");
      nameBox.type = "text";
      nameBox.placeholder = "名前を入力してください";
      Object.assign(nameBox.style, {
        position: "fixed",
        top: "55%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 2100,
        padding: "10px 15px",
        fontSize: "20px",
        borderRadius: "8px",
      });
      bgDiv.appendChild(nameBox);
    }

    if (!confirmBtn) {
      confirmBtn = document.createElement("button");
      confirmBtn.textContent = "決定";
      Object.assign(confirmBtn.style, {
        position: "fixed",
        top: "65%",
        left: "45%",
        transform: "translate(-50%, -50%)",
        zIndex: 2100,
        padding: "10px 20px",
        fontSize: "20px",
        borderRadius: "8px",
        cursor: "pointer",
      });
      bgDiv.appendChild(confirmBtn);
    }

    if (!cancelBtn) {
      cancelBtn = document.createElement("button");
      cancelBtn.textContent = "キャンセル";
      Object.assign(cancelBtn.style, {
        position: "fixed",
        top: "65%",
        left: "55%",
        transform: "translate(-50%, -50%)",
        zIndex: 2100,
        padding: "10px 20px",
        fontSize: "20px",
        borderRadius: "8px",
        cursor: "pointer",
      });
      bgDiv.appendChild(cancelBtn);
    }

    telop.textContent = "主人公の名前を決めてください";

    flyOut(selectedIndex === 0 ? 1 : 0, selectedIndex); // 名前入力時に未選択キャラを飛ばす

    confirmBtn.onclick = () => {
      const heroName = nameBox.value.trim() || c.name;
      if (confirm(`主人公「${heroName}」でよろしいですか？`)) {
        console.log(`確定: ${c.name}, 名前: ${heroName}`);
        [nameBox, confirmBtn, cancelBtn].forEach((el) => el && el.remove());
        if (telop) telop.remove();
        if (characterUI) characterUI.remove();
        selectedIndex = null;
      }
    };

    cancelBtn.onclick = () => {
      if (selectedIndex !== null) {
        const sel = selectedIndex;
        const other = sel === 0 ? 1 : 0;
        stopRotation();
        auras[sel].style.opacity = 0;
        flyIn(other); // キャンセルで未選択キャラ戻す
      }
      selectedIndex = null;
      [nameBox, confirmBtn, cancelBtn].forEach((el) => el && el.remove());
      nameBox = confirmBtn = cancelBtn = null;
      telop.textContent = "主人公を選択してください";
    };
  }

  // --- キャラクター生成 ---
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
    aura.className = "aura";
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

    // --- クリック ---
    charWrapper.addEventListener("click", () => {
      const other = i === 0 ? 1 : 0;

      if (selectedIndex === i) {
        // 2回目クリック → 名前入力表示
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
      telop.textContent = "主人公を選択中。もう一度クリックで決定。";
    });
  });

  // --- ポップアップ ---
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
      mediaEl.volume = 1.0;
      Object.assign(mediaEl.style, { width: "100%", height: "100%", objectFit: "contain" });
      mediaEl.play().catch(() => {});
    }
    popup.appendChild(mediaEl);

    const closeBtn = document.createElement("div");
    closeBtn.textContent = "×";
    Object.assign(closeBtn.style, {
      position: "absolute",
      top: "5px",
      right: "8px",
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
      fontSize: "28px",
      textShadow: "0 0 5px black",
      zIndex: 5001,
    });
    closeBtn.addEventListener("click", () => {
      popup.remove();
      popupCloseSound.currentTime = 0;
      popupCloseSound.play().catch(() => {});
    });
    popup.appendChild(closeBtn);

    const maxLeft = window.innerWidth - parseInt(popup.style.width);
    const maxTop = window.innerHeight - parseInt(popup.style.height);
    popup.style.left = Math.floor(Math.random() * maxLeft) + "px";
    popup.style.top = Math.floor(Math.random() * maxTop) + "px";

    document.body.appendChild(popup);
    requestAnimationFrame(() => (popup.style.opacity = 1));

    popupSound.currentTime = 0;
    popupSound.volume = 1.0;
    popupSound.play().catch(() => {});
  }

  createPopup();
  setInterval(() => createPopup(), 4000 + Math.random() * 4000);
};
