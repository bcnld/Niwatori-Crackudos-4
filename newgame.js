window.startNewGame = async function () {
  const fadeOverlay = document.getElementById("fade-overlay");
  const bgm = document.getElementById("bgm");
  if (!fadeOverlay) return;

  // --- メニュー非表示 ---
  const menuWrapper = document.querySelector("div[data-menu-wrapper]");
  if (menuWrapper) menuWrapper.style.display = "none";

  // --- フェードオーバーレイ（導入） ---
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

  // --- 画面クリア（重要）---
  // body の直下にある要素を一掃。ただし fade-overlay と bgm は残す
  const preserveIds = new Set(["fade-overlay", "bgm"]);
  Array.from(document.body.children).forEach((child) => {
    if (child.id && preserveIds.has(child.id)) return;
    child.remove();
  });

  // --- 背景コンテナ ---
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

  // --- 雪（デコレーション） ---
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

  // --- フェード解除（導入側のオーバーレイを戻す） ---
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

  // -----------------------
  // UI 要素（telop / characterUI など）
  // -----------------------
  // telop（中央表示）
  const telop = document.createElement("div");
  telop.id = "telop";
  telop.dataset.telop = "1";
  Object.assign(telop.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: "20px 40px",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "28px",
    fontWeight: "bold",
    textAlign: "center",
    zIndex: 2200,
    pointerEvents: "auto",
  });
  telop.textContent = "鶏の餌食を選択してください";
  bgDiv.appendChild(telop);

  // modal dim（画面全体を薄暗くして押したら解除）
  const modalDim = document.createElement("div");
  modalDim.id = "newgame-modal-dim";
  Object.assign(modalDim.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 2100,
    cursor: "pointer",
  });
  bgDiv.appendChild(modalDim);

  // --- キャラクターUI（最初は非表示。modal を押すと表示） ---
  const characterUI = document.createElement("div");
  characterUI.id = "character-ui-wrapper";
  Object.assign(characterUI.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 2000,
    display: "flex",
    gap: "60px",
    pointerEvents: "auto",
  });
  // 最初は見せない（モーダルが消えたら表示）
  characterUI.style.visibility = "hidden";
  bgDiv.appendChild(characterUI);

  // モーダルをクリックしたら非表示にして先に進める
  modalDim.addEventListener("click", () => {
    modalDim.remove();
    if (telop) telop.remove();
    characterUI.style.visibility = "visible";
  });

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
  let btnContainer = null; // ボタンコンテナ（キャンセル・決定）
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

  // --- 名前入力（ボタンは btnContainer に入れる）---
  function showNameInput(c) {
    // reset other UI (auras と回転をクリア)
    wrappers.forEach((w, idx) => {
      auras[idx].style.opacity = 0;
      w.style.transform = "translateX(0)";
      w.style.opacity = "1";
    });
    stopRotation();

    // 名前入力
    if (!nameBox) {
      nameBox = document.createElement("input");
      nameBox.type = "text";
      nameBox.placeholder = `${c.name} の名前を入力してください`;
      Object.assign(nameBox.style, {
        position: "fixed",
        zIndex: 2300,
        padding: "10px 15px",
        borderRadius: "8px",
        fontSize: "20px",
        outline: "none",
      });
      bgDiv.appendChild(nameBox);
    }

    // ボタンコンテナ
    if (!btnContainer) {
      btnContainer = document.createElement("div");
      btnContainer.className = "name-btn-container";
      Object.assign(btnContainer.style, {
        position: "fixed",
        zIndex: 2300,
        display: "flex",
        gap: "40px",
        justifyContent: "center",
        alignItems: "center",
      });
      bgDiv.appendChild(btnContainer);
    }

    // キャンセル（左）
    if (!cancelBtn) {
      cancelBtn = document.createElement("button");
      cancelBtn.textContent = "キャンセル";
      cancelBtn.className = "cancel-btn";
      Object.assign(cancelBtn.style, {
        padding: "10px 20px",
        fontSize: "20px",
        borderRadius: "8px",
        cursor: "pointer",
      });
      // append to container to keep layout consistent
      btnContainer.appendChild(cancelBtn);
    }

    // 決定（右）
    if (!confirmBtn) {
      confirmBtn = document.createElement("button");
      confirmBtn.textContent = "決定";
      confirmBtn.className = "confirm-btn";
      Object.assign(confirmBtn.style, {
        padding: "10px 20px",
        fontSize: "20px",
        borderRadius: "8px",
        cursor: "pointer",
      });
      btnContainer.appendChild(confirmBtn);
    }

    // テロップを説明文に
    telop.textContent = "鶏の餌食の名前を入力してください";

    // 未選択キャラを飛ばす（UX）
    if (selectedIndex !== null) {
      flyOut(selectedIndex === 0 ? 1 : 0, selectedIndex);
    }

    // イベント
    confirmBtn.onclick = () => {
      const heroName = nameBox.value.trim() || c.name;
      if (confirm(`主人公「${heroName}」でよろしいですか？`)) {
        [nameBox, btnContainer].forEach((el) => el && el.remove());
        nameBox = null;
        btnContainer = null;
        confirmBtn = cancelBtn = null;
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
        flyIn(other);
      }
      selectedIndex = null;
      [nameBox, btnContainer].forEach((el) => el && el.remove());
      nameBox = null;
      btnContainer = null;
      confirmBtn = cancelBtn = null;
      telop.textContent = "鶏の餌食を選択してください";
    };

    // 最初の配置を行う
    adjustNewGameLayout();
    // フォーカス
    nameBox.focus();
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

    charWrapper.addEventListener("click", () => {
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

  // --- ポップアップ（任意） ---
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

    const maxLeft = Math.max(0, window.innerWidth - w);
    const maxTop = Math.max(0, window.innerHeight - h);
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

  // ========================
  // レイアウト調整関数（完全版）
  // ========================
  function adjustNewGameLayout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPortrait = h > w;

    // --- キャラクターUI ---
    if (characterUI) {
      characterUI.style.top = "50%";
      characterUI.style.left = "50%";
      characterUI.style.transform = "translate(-50%, -50%)";
      // 縦でも横でも横並びにする（要望）
      characterUI.style.flexDirection = "row";
      characterUI.style.gap = isPortrait ? "30px" : "60px";
    }

    // --- キャラクター画像サイズ ---
    if (imgs) {
      imgs.forEach((img) => {
        img.style.width = isPortrait ? "160px" : "200px";
        img.style.height = isPortrait ? "240px" : "300px";
      });
    }

    // --- オーラサイズ ---
    if (auras) {
      auras.forEach((aura) => {
        aura.style.width = isPortrait ? "180px" : "220px";
        aura.style.height = isPortrait ? "270px" : "320px";
      });
    }

    // --- 名前入力ボックス配置（存在する場合） ---
    if (nameBox) {
      nameBox.style.top = isPortrait ? "55%" : "50%";
      nameBox.style.left = "50%";
      nameBox.style.transform = "translate(-50%, -50%)";
      nameBox.style.width = isPortrait ? "260px" : "220px";
    }

    // --- 決定 & キャンセル ボタンを横並びで中央下に配置（存在する場合）---
    if (btnContainer) {
      btnContainer.style.display = "flex";
      btnContainer.style.justifyContent = "center";
      btnContainer.style.gap = "40px"; // ボタン間の余白
      btnContainer.style.position = "fixed";
      btnContainer.style.top = isPortrait ? "68%" : "60%";
      btnContainer.style.left = "50%";
      btnContainer.style.transform = "translateX(-50%)";
    }

    // --- テロップ位置（中央） ---
    if (telop) {
      telop.style.top = "50%";
      telop.style.left = "50%";
      telop.style.transform = "translate(-50%, -50%)";
      telop.style.fontSize = isPortrait ? "28px" : "24px";
      telop.style.padding = isPortrait ? "20px 40px" : "15px 30px";
    }

    // --- ポップアップ再配置（ウィンドウサイズに合わせる）---
    const popups = document.querySelectorAll(".popup");
    popups.forEach((popup) => {
      const width = parseInt(popup.style.width || "300");
      const height = parseInt(popup.style.height || "200");
      const maxLeft = Math.max(0, window.innerWidth - width);
      const maxTop = Math.max(0, window.innerHeight - height);
      // 既に画面外の場合だけ再配置する（軽微なランダム）
      const curLeft = parseInt(popup.style.left || "0");
      const curTop = parseInt(popup.style.top || "0");
      if (curLeft > maxLeft || curTop > maxTop) {
        popup.style.left = Math.floor(Math.random() * maxLeft) + "px";
        popup.style.top = Math.floor(Math.random() * maxTop) + "px";
      }
    });
  }

  // --- ウィンドウリサイズ・向き変更で再調整 ---
  window.addEventListener("resize", adjustNewGameLayout);
  window.addEventListener("orientationchange", adjustNewGameLayout);

  // --- startNewGame 内で初回呼び出し ---
  adjustNewGameLayout();
}; // ← end startNewGame
