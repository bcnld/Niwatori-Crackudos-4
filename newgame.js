// newgame.js（完全版）
window.startNewGame = async function () {
  // --- 古いUI削除 ---
  document.getElementById("newgame-bg-div")?.remove();
  document.getElementById("title-img2")?.remove();
  document.querySelectorAll(".popup")?.forEach(p => p.remove());

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
  requestAnimationFrame(() => fadeOverlay.style.opacity = 1);

  // --- 既存BGMフェードアウト ---
  if (bgm && !bgm.paused) {
    if (bgm._fadeOutInterval) clearInterval(bgm._fadeOutInterval);
    await new Promise(resolve => {
      let step = 0, steps = 60, interval = 2000 / steps;
      bgm._fadeOutInterval = setInterval(() => {
        step++;
        bgm.volume = Math.max(0, 1 - step / steps);
        if (step >= steps) {
          clearInterval(bgm._fadeOutInterval);
          bgm.pause();
          bgm.currentTime = 0;
          resolve();
        }
      }, interval);
    });
  }

  // --- 背景作成 ---
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

  // --- 雪アニメーション ---
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
      zIndex: 2
    });
    bgDiv.appendChild(snow);
    snowflakes.push({
      el: snow,
      speed: Math.random() * 2 + 1,
      drift: (Math.random() - 0.5),
      rotationSpeed: (Math.random() - 0.5) * 2
    });
  }
  (function animateSnow() {
    snowflakes.forEach(flake => {
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
    });
    requestAnimationFrame(animateSnow);
  })();

  // --- フェード解除 ---
  fadeOverlay.style.transition = "opacity 1s ease";
  fadeOverlay.style.opacity = 0;
  setTimeout(() => fadeOverlay.style.display = "none", 1000);

  // --- 新規BGM ---
  if (bgm) {
    bgm.src = "Sounds/newgame_bgm.mp3";
    bgm.loop = true;
    bgm.volume = 0;
    bgm.play().catch(() => {});
    if (bgm._fadeInInterval) clearInterval(bgm._fadeInInterval);
    let step = 0, steps = 60;
    bgm._fadeInInterval = setInterval(() => {
      step++;
      bgm.volume = Math.min(1, step / steps);
      if (step >= steps) clearInterval(bgm._fadeInInterval);
    }, 50);
  }

  // --- 効果音 ---
  const flyOutSound = new Audio("Sounds/fly_out.mp3");
  const flyInSound = new Audio("Sounds/fly_in.mp3");
  const selectSound = new Audio("Sounds/select.mp3");

  // --- キャラクターUI ---
  const telop = document.createElement("div");
  telop.id = "telop";
  Object.assign(telop.style, {
    position: "fixed",
    top: "50%", left: "50%",
    transform: "translate(-50%,-50%)",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: "20px 40px",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "28px",
    fontWeight: "bold",
    textAlign: "center",
    zIndex: 2200
  });
  telop.textContent = "キャラクターを選択してください";
  bgDiv.appendChild(telop);

  const modalDim = document.createElement("div");
  Object.assign(modalDim.style, {
    position: "fixed",
    top: 0, left: 0,
    width: "100%", height: "100%",
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 2100,
    cursor: "pointer"
  });
  bgDiv.appendChild(modalDim);

  const characterUI = document.createElement("div");
  Object.assign(characterUI.style, {
    position: "fixed",
    top: "50%", left: "50%",
    transform: "translate(-50%,-50%)",
    zIndex: 2000,
    display: "flex",
    gap: "60px",
    visibility: "hidden"
  });
  bgDiv.appendChild(characterUI);

  modalDim.addEventListener("click", () => {
    modalDim.remove();
    telop.remove();
    characterUI.style.visibility = "visible";
  });

  // --- キャラクター ---
  const characters = [
    { name: "犬", img: "images/hero1.png", selectSound: "Sounds/select_hero1.mp3" },
    { name: "うんこ", img: "images/hero2.png", selectSound: "Sounds/select_hero2.mp3" }
  ];
  const wrappers = [];
  let selectedIndex = null, rotationRAF = null, rotatingImg = null;
  let nameBox = null, confirmBtn = null, cancelBtn = null, btnContainer = null;

  function startRotation(img) {
    stopRotation();
    rotatingImg = img;
    let angle = 0;
    (function step() {
      angle += 2;
      if (angle >= 360) angle -= 360;
      img.style.transform = `rotateY(${angle}deg) scale(1.2)`;
      rotationRAF = requestAnimationFrame(step);
    })();
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
  function flyOutOther(idx) {
    wrappers.forEach((w, i) => {
      if (i !== idx) {
        const dir = i < idx ? -1 : 1;
        w.style.transition = "transform 0.7s ease, opacity 0.7s ease";
        w.style.transform = `translateX(${dir * (window.innerWidth + 400)}px)`;
        w.style.opacity = "0";
        flyOutSound.currentTime = 0;
        flyOutSound.play().catch(()=>{});
      }
    });
  }
  function flyInAll() {
    wrappers.forEach(w => {
      w.style.transition = "transform 0.6s ease, opacity 0.4s ease";
      w.style.transform = "translateX(0)";
      w.style.opacity = "1";
      flyInSound.currentTime = 0;
      flyInSound.play().catch(()=>{});
    });
  }

  // --- 名前入力 ---
  function showNameInput(c) {
    stopRotation();
    flyOutOther(selectedIndex);

    const rect = wrappers[selectedIndex].getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const bottomY = rect.bottom + 20;

    if (!nameBox) {
      nameBox = document.createElement("input");
      nameBox.type = "text";
      Object.assign(nameBox.style, {
        position: "fixed",
        zIndex: 2300,
        padding: "10px 15px",
        borderRadius: "8px",
        fontSize: "20px",
        transform: "translateX(-50%)"
      });
      document.body.appendChild(nameBox);
    }
    nameBox.style.display = "block";
    nameBox.style.left = `${centerX}px`;
    nameBox.style.top = `${bottomY}px`;
    nameBox.value = "";
    nameBox.placeholder = `${c.name} の名前を入力してください`;

    if (!btnContainer) {
      btnContainer = document.createElement("div");
      Object.assign(btnContainer.style, {
        position: "fixed",
        zIndex: 2300,
        display: "flex",
        gap: "40px",
        transform: "translateX(-50%)"
      });
      document.body.appendChild(btnContainer);
    }
    btnContainer.style.display = "flex";
    btnContainer.style.left = `${centerX}px`;
    btnContainer.style.top = `${bottomY + 50}px`;

    if (!cancelBtn) { cancelBtn = document.createElement("button"); btnContainer.appendChild(cancelBtn); }
    cancelBtn.textContent = "キャンセル";
    if (!confirmBtn) { confirmBtn = document.createElement("button"); btnContainer.appendChild(confirmBtn); }
    confirmBtn.textContent = "決定";

    cancelBtn.onclick = () => {
      nameBox.style.display = "none";
      btnContainer.style.display = "none";
      selectedIndex = null;
      flyInAll();
    };

    confirmBtn.onclick = () => {
      const heroName = nameBox.value.trim() || c.name;
      if (!confirm(`主人公「${heroName}」でよろしいですか？`)) return;

      // --- 古いUI非表示 ---
      nameBox.style.display = "none";
      btnContainer.style.display = "none";
      stopRotation();

      // --- フェードアウト ---
      fadeOverlay.style.display = "block";
      fadeOverlay.style.zIndex = 9999;
      fadeOverlay.style.backgroundColor = "#000";
      fadeOverlay.style.opacity = 0;
      fadeOverlay.style.transition = "opacity 2s ease";
      requestAnimationFrame(() => fadeOverlay.style.opacity = 1);

      // --- BGMフェードアウト ---
      if (bgm && !bgm.paused) {
        if (bgm._fadeOutInterval) clearInterval(bgm._fadeOutInterval);
        let step = 0, steps = 60, interval = 2000 / steps;
        bgm._fadeOutInterval = setInterval(() => {
          step++;
          bgm.volume = Math.max(0, 1 - step / steps);
          if (step >= steps) {
            clearInterval(bgm._fadeOutInterval);
            bgm.pause();
            bgm.currentTime = 0;
          }
        }, interval);
      }

      // --- ノンフィクション文字表示 ---
      setTimeout(() => {
        showTextSequence([
          "この物語はノンフィクションです。",
          "登場する人物、団体は存在しません。"
        ]);
      }, 1500);
    };
  }
  
  // --- テキストシーケンス表示 ---
function showTextSequence(messages) {
  let index = 0;
  let clickable = false;
  const container = document.createElement("div");
  document.body.appendChild(container);

  function showNext() {
    if (index >= messages.length) {
      container.remove();
      if (window._popupInterval) clearInterval(window._popupInterval);
      if (window.activePopups) window.activePopups.forEach(p => p.remove());
      window.activePopups = [];

      // --- ここで動画再生 ---
      playIntroVideo();
      return;
    }

    const textEl = document.createElement("div");
    textEl.textContent = messages[index];
    Object.assign(textEl.style, {
      position: "fixed",
      top: "50%", left: "50%",
      transform: "translate(-50%,-50%)",
      fontSize: "36px",
      color: "#fff",
      zIndex: 10000,
      opacity: 0,
      transition: "opacity 3s ease",
      cursor: "pointer"
    });
    container.appendChild(textEl);

    requestAnimationFrame(() => {
      textEl.style.opacity = 1;
      setTimeout(() => { clickable = true; }, 3000);
    });

    function proceed() {
      if (!clickable) return;
      clickable = false;

      selectSound.currentTime = 0;
      selectSound.play().catch(() => {});

      textEl.style.transition = "opacity 1.5s ease";
      textEl.style.opacity = 0;
      setTimeout(() => {
        textEl.remove();
        index++;
        showNext();
      }, 1500);

      document.removeEventListener("click", proceed);
    }

    document.addEventListener("click", proceed);
  }

  showNext();
}

function playIntroVideo() {
  const video = document.createElement("video");
  video.src = "videos/intro.mp4";
  video.autoplay = true;
  video.controls = false;
  video.style.position = "fixed";
  video.style.top = "50%";
  video.style.left = "50%";
  video.style.transform = "translate(-50%,-50%)";
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.zIndex = 9999;
  document.body.appendChild(video);

  video.addEventListener("ended", () => {
    video.remove();
    // --- ここでゲーム本編に自動移行 ---
    startGame(); // ゲーム本編開始用関数
  });
}

// --- ゲーム本編開始関数（ダミー） ---
function startGame() {
  console.log("ゲーム本編に移行しました！");
  // ここに本編開始処理を入れる
}

  // --- キャラクター生成 ---
  characters.forEach((c, i) => {
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, { display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer" });
    const img = document.createElement("img");
    img.src = c.img;
    img.style.width = "200px";
    wrapper.appendChild(img);
    const label = document.createElement("div");
    label.textContent = c.name;
    label.style.color = "#fff";
    wrapper.appendChild(label);

    characterUI.appendChild(wrapper);
    wrappers[i] = wrapper;

    wrapper.addEventListener("click", () => {
      if (selectedIndex === i) { showNameInput(c); return; }
      if (selectedIndex !== null) stopRotation();
      selectedIndex = i;
      startRotation(img);
      new Audio(c.selectSound).play().catch(()=>{});
      telop.textContent = "もう一度クリックで決定。";
    });
  });

  // --- ウィンドウリサイズ ---
  window.addEventListener("resize", () => {
    if (nameBox && selectedIndex !== null) {
      const rect = wrappers[selectedIndex].getBoundingClientRect();
      nameBox.style.left = `${rect.left + rect.width / 2}px`;
      nameBox.style.top = `${rect.bottom + 20}px`;
      btnContainer.style.left = `${rect.left + rect.width / 2}px`;
      btnContainer.style.top = `${rect.bottom + 70}px`;
    }
    document.querySelectorAll(".popup").forEach(popup => {
      const rect = popup.getBoundingClientRect();
      let left = rect.left;
      let top = rect.top;
      if (left + rect.width > window.innerWidth) left = window.innerWidth - rect.width - 10;
      if (top + rect.height > window.innerHeight) top = window.innerHeight - rect.height - 10;
      if (left < 0) left = 10;
      if (top < 0) top = 10;
      popup.style.left = left + "px";
      popup.style.top = top + "px";
    });
  });

  // --- ポップアップ ---
  const popupMedia = [
    { type: "img", src: "images/popup1.gif" },
    { type: "video", src: "videos/popup1.mp4" },
    { type: "img", src: "images/popup2.gif" },
    { type: "video", src: "videos/popup2.mp4" },
    { type: "video", src: "videos/popup3.mp4" }
  ];
  const popupSound = new Audio("Sounds/popup.mp3");
  const popupCloseSound = new Audio("Sounds/popup_x.mp3");
  window.activePopups = [];

  function createPopup() {
    if (window.activePopups.length >= 50) return;
    const sel = popupMedia[Math.floor(Math.random() * popupMedia.length)];
    const popup = document.createElement("div");
    popup.className = "popup";

    const popupWidth = 300, popupHeight = 250;
    const left = Math.floor(Math.random() * Math.max(0, window.innerWidth - popupWidth));
    const top = Math.floor(Math.random() * Math.max(0, window.innerHeight - popupHeight));

    Object.assign(popup.style, {
      position: "fixed",
      width: `${popupWidth}px`,
      height: `${popupHeight}px`,
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 1800,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: "10px",
      overflow: "hidden",
      boxShadow: "0 0 10px rgba(0,0,0,0.5)"
    });

    let mediaEl;
    if (sel.type === "img") {
      mediaEl = document.createElement("img");
      mediaEl.src = sel.src;
      Object.assign(mediaEl.style, {
        width: "100%",
        height: "100%",
        objectFit: "contain"
      });
    } else {
      mediaEl = document.createElement("video");
      mediaEl.src = sel.src;
      mediaEl.autoplay = true;
      mediaEl.loop = true;
      mediaEl.muted = false;
      Object.assign(mediaEl.style, {
        width: "100%",
        height: "100%",
        objectFit: "contain"
      });
    }
    popup.appendChild(mediaEl);

    // 閉じるボタン
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    Object.assign(closeBtn.style, {
      position: "absolute",
      top: "5px",
      right: "5px",
      zIndex: 10,
      background: "rgba(255,255,255,0.7)",
      border: "none",
      borderRadius: "50%",
      width: "25px",
      height: "25px",
      cursor: "pointer",
      fontWeight: "bold"
    });
    closeBtn.addEventListener("click", () => {
      popup.remove();
      const idx = window.activePopups.indexOf(popup);
      if (idx !== -1) window.activePopups.splice(idx, 1);
      popupCloseSound.currentTime = 0;
      popupCloseSound.play().catch(()=>{});
    });
    popup.appendChild(closeBtn);

    document.body.appendChild(popup);
    window.activePopups.push(popup);
    popupSound.currentTime = 0;
    popupSound.play().catch(()=>{});
  }

  // --- ポップアップ定期生成 ---
  window._popupInterval = setInterval(createPopup, 2500);

  // --- 終了処理 ---
  window.addEventListener("beforeunload", () => {
    clearInterval(window._popupInterval);
    if (bgm && !bgm.paused) bgm.pause();
  });
};
