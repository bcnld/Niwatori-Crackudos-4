document.addEventListener("DOMContentLoaded", () => {
  const centerText = document.getElementById("center-text");
  const logos = document.querySelectorAll(".company-logo");
  const titleImg1 = document.getElementById("title-img1");
  const titleImg2 = document.getElementById("title-img2");
  const pressKeyText = document.getElementById("press-any-key");
  const fullscreenEffect = document.getElementById("fullscreen-effect");
  const bgm = document.getElementById("bgm");
  const selectSfx = document.getElementById("select-sfx");
  const effectSfx = document.getElementById("effect-sfx");
  const gameScreen = document.getElementById("game-screen");

  // fade-overlay 作成
  let fadeOverlay = document.getElementById("fade-overlay");
  if (!fadeOverlay) {
    fadeOverlay = document.createElement("div");
    fadeOverlay.id = "fade-overlay";
    Object.assign(fadeOverlay.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "black",
      opacity: 0,
      zIndex: 9999,
      pointerEvents: "none"
    });
    document.body.appendChild(fadeOverlay);
  }

  let currentLogoIndex = 0;
  let started = false;
  let menuWrapper, selectedIndex = 0, isInputMode = false;

  // 最初は全て非表示
  logos.forEach(logo => logo.style.display = "none");
  [titleImg1, titleImg2, pressKeyText, fullscreenEffect, fadeOverlay].forEach(el => {
    if (el) el.style.display = "none";
  });
  centerText.style.display = "block";

  function fadeIn(el, duration = 1000) {
    el.style.display = "block";
    el.style.opacity = 0;
    return new Promise(resolve => {
      let start = null;
      function step(ts) {
        if (!start) start = ts;
        let p = Math.min((ts - start) / duration, 1);
        el.style.opacity = p;
        if (p < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  function fadeOut(el, duration = 1000) {
    el.style.opacity = 1;
    return new Promise(resolve => {
      let start = null;
      function step(ts) {
        if (!start) start = ts;
        let p = Math.min((ts - start) / duration, 1);
        el.style.opacity = 1 - p;
        if (p < 1) requestAnimationFrame(step);
        else {
          el.style.display = "none";
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }

  // --- 企業ロゴ順番表示 ---
  async function showNextLogo() {
    if (currentLogoIndex >= logos.length) {
      await showPressBgAndTitle();
      return;
    }
    const logo = logos[currentLogoIndex];
    await fadeIn(logo, 1000);
    await new Promise(r => setTimeout(r, 2000));
    await fadeOut(logo, 1000);
    currentLogoIndex++;
    showNextLogo();
  }

  // --- press_bg とタイトル表示 ---
  async function showPressBgAndTitle() {
    // press_bg.png 全画面背景（最初ズーム）
    const pressBg = document.createElement("img");
    pressBg.src = "images/press_bg.png";
    Object.assign(pressBg.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "120%",
      height: "120%",
      objectFit: "cover",
      zIndex: 0,
      transform: "translate(-10%,-10%)",
      transition: "all 2s ease"
    });
    document.body.appendChild(pressBg);
    requestAnimationFrame(() => {
      pressBg.style.width = "100%";
      pressBg.style.height = "100%";
      pressBg.style.transform = "translate(0,0)";
    });

    // BGM再生
    if (bgm) {
      bgm.loop = true;
      bgm.volume = 1;
      bgm.play();
    }

    // effectSfx再生（企業ロゴ直後）
    if (effectSfx) {
      effectSfx.currentTime = 0;
      effectSfx.play();
    }

    // タイトル画像1表示
    if (titleImg1) {
      await fadeIn(titleImg1, 1000);

      // transition.png 表示（少し長め）
      if (fullscreenEffect) {
        fullscreenEffect.src = "images/transition.png";
        fullscreenEffect.style.display = "block";
        fullscreenEffect.style.opacity = 0;
        fullscreenEffect.style.position = "fixed";
        fullscreenEffect.style.top = 0;
        fullscreenEffect.style.left = 0;
        fullscreenEffect.style.width = "100%";
        fullscreenEffect.style.height = "100%";
        fullscreenEffect.style.zIndex = 9998;
        await fadeIn(fullscreenEffect, 200);
        await new Promise(r => setTimeout(r, 1500));
        await fadeOut(fullscreenEffect, 500);
      }

      await new Promise(r => setTimeout(r, 1500));
      await fadeOut(titleImg1, 1000);
    }

    // タイトル画像2表示
    if (titleImg2) await fadeIn(titleImg2, 1000);

    // Press Any Key 表示
    if (pressKeyText) {
      pressKeyText.style.display = "block";
      requestAnimationFrame(() => pressKeyText.style.opacity = 1);
    }

    waitForPressKey(pressBg);
  }

  function waitForPressKey(pressBg) {
    function onInput() {
      window.removeEventListener("keydown", onInput, true);
      window.removeEventListener("touchstart", onInput, true);

      // Press Any Key フェードアウト＆背景スクロール開始
      if (pressKeyText) fadeOut(pressKeyText, 500);
      fadeOut(titleImg2, 1000);
      startBackgroundScroll();
      createMenu();
      attachMenuKeyboardListeners();
    }
    window.addEventListener("keydown", onInput, { capture: true });
    window.addEventListener("touchstart", onInput, { capture: true });
  }

  // --- センターテキストクリックで開始 ---
  centerText.addEventListener("click", () => {
    if (started) return;
    started = true;
    fadeOut(centerText, 500).then(showNextLogo);
  });

  // --- 背景スクロール ---
  const scrollSpeed = 1;
  const containerHeight = window.innerHeight;
  const containerWidth = window.innerWidth;
  const bgImageWidth = 3600;
  const bgImageHeight = containerHeight;
  const scrollWrapper = document.createElement("div");
  Object.assign(scrollWrapper.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: `${containerWidth}px`,
    height: `${containerHeight}px`,
    overflow: "hidden",
    zIndex: 1,
    pointerEvents: "none"
  });
  let bgElements = [];
  function createBgDiv(x) {
    const div = document.createElement("div");
    Object.assign(div.style, {
      position: "absolute",
      top: 0,
      left: `${x}px`,
      width: `${bgImageWidth}px`,
      height: `${bgImageHeight}px`,
      backgroundImage: "url('images/menu.png')",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center center"
    });
    return div;
  }
  function animateScrollingBackground() {
    for (let i = 0; i < bgElements.length; i++) {
      let left = parseFloat(bgElements[i].style.left);
      left -= scrollSpeed;
      bgElements[i].style.left = left + "px";
    }
    if (parseFloat(bgElements[0].style.left) + bgImageWidth <= 0) {
      const removed = bgElements.shift();
      removed.remove();
    }
    const lastDiv = bgElements[bgElements.length - 1];
    if (parseFloat(lastDiv.style.left) + bgImageWidth <= containerWidth) {
      const newDiv = createBgDiv(parseFloat(lastDiv.style.left) + bgImageWidth);
      scrollWrapper.appendChild(newDiv);
      bgElements.push(newDiv);
    }
    requestAnimationFrame(animateScrollingBackground);
  }
  function startBackgroundScroll() {
    document.body.appendChild(scrollWrapper);
    bgElements = [createBgDiv(0), createBgDiv(bgImageWidth)];
    bgElements.forEach(div => scrollWrapper.appendChild(div));
    animateScrollingBackground();
  }

  // --- メニュー作成 ---
  const menuItems = ["New Game", "Load", "Settings"];
  function createMenu() {
    menuWrapper = document.createElement("div");
    const rect = titleImg2.getBoundingClientRect();
    Object.assign(menuWrapper.style, {
      position: "fixed",
      top: `${rect.bottom + 20}px`,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 10000,
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      fontSize: "24px",
      fontWeight: "bold",
      color: "#fff",
      textShadow: "0 0 5px black"
    });
    menuItems.forEach((text, i) => {
      const item = document.createElement("div");
      item.textContent = text;
      Object.assign(item.style, {
        cursor: "pointer",
        padding: "10px 20px",
        borderRadius: "8px",
        userSelect: "none",
        transition: "background-color 0.3s ease, color 0.3s ease"
      });
      item.dataset.index = i;
      item.addEventListener("click", () => {
        if (selectedIndex === i && isInputMode) {
          if (menuItems[i] === "New Game") startCharacterSelection();
          else alert(`"${menuItems[i]}" はまだ未実装です`);
        } else {
          selectedIndex = i;
          updateMenuSelection();
          if (selectSfx) {
            try { selectSfx.currentTime = 0; selectSfx.play(); } catch {}
          }
        }
      });
      menuWrapper.appendChild(item);
    });
    document.body.appendChild(menuWrapper);
    isInputMode = true;
    selectedIndex = 0;
    updateMenuSelection();
  }

  function updateMenuSelection() {
    const items = menuWrapper.querySelectorAll("div");
    items.forEach((item, idx) => {
      if (idx === selectedIndex) {
        item.style.backgroundColor = "rgba(255,255,255,0.2)";
        item.style.color = "#ff0";
      } else {
        item.style.backgroundColor = "transparent";
        item.style.color = "#fff";
      }
    });
  }

  function attachMenuKeyboardListeners() {
    window.addEventListener("keydown", (e) => {
      if (!isInputMode) return;
      if (e.key === "ArrowUp") {
        selectedIndex = (selectedIndex - 1 + menuItems.length) % menuItems.length;
        updateMenuSelection();
        if (selectSfx) {
          try { selectSfx.currentTime = 0; selectSfx.play(); } catch {}
        }
      } else if (e.key === "ArrowDown") {
        selectedIndex = (selectedIndex + 1) % menuItems.length;
        updateMenuSelection();
        if (selectSfx) {
          try { selectSfx.currentTime = 0; selectSfx.play(); } catch {}
        }
      } else if (e.key === "Enter" || e.key === " ") {
        if (menuItems[selectedIndex] === "New Game") startCharacterSelection();
        else alert(`"${menuItems[selectedIndex]}" はまだ未実装です`);
      }
    });
  }

  // --- キャラクター選択 ---
  function startCharacterSelection() {
    if (menuWrapper) menuWrapper.remove();
    const charWrapper = document.createElement("div");
    Object.assign(charWrapper.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
      zIndex: 10000,
      display: "flex",
      gap: "20px"
    });
    const characters = ["Character1", "Character2"];
    let selectedCharIndex = 0;
    characters.forEach((name, i) => {
      const div = document.createElement("div");
      div.textContent = name;
      Object.assign(div.style, {
        padding: "20px",
        border: "2px solid white",
        cursor: "pointer",
        userSelect: "none"
      });
      div.addEventListener("click", () => {
        selectedCharIndex = i;
        updateCharSelection();
      });
      charWrapper.appendChild(div);
    });
    document.body.appendChild(charWrapper);

    function updateCharSelection() {
      charWrapper.childNodes.forEach((node, idx) => {
        node.style.borderColor = idx === selectedCharIndex ? "yellow" : "white";
      });
    }
    updateCharSelection();

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "決定";
    Object.assign(confirmBtn.style, {
      position: "fixed",
      top: "80%",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 10001,
      padding: "10px 20px"
    });
    confirmBtn.addEventListener("click", () => {
      const playerName = prompt("名前を入力してください", "");
      if (!playerName) return;
      const confirmOK = confirm(`キャラ: ${characters[selectedCharIndex]}\n名前: ${playerName}\nでよろしいですか？`);
      if (confirmOK) {
        charWrapper.remove();
        confirmBtn.remove();
        startGameWithFadeIn();
      }
    });
    document.body.appendChild(confirmBtn);
  }

  // --- ゲーム開始 ---
  async function startGameWithFadeIn() {
    fadeOverlay.style.display = "block";
    fadeOverlay.style.opacity = 0;
    await new Promise(r => requestAnimationFrame(r));
    fadeOverlay.style.transition = "opacity 1.5s ease";
    fadeOverlay.style.opacity = 1;
    await new Promise(r => setTimeout(r, 1600));

    // タイトルなどを削除
    [titleImg1, titleImg2, pressKeyText, fadeOverlay].forEach(el => {
      if (el) el.remove();
    });
    if (scrollWrapper) scrollWrapper.remove();

    fadeOverlay.style.transition = "opacity 1.5s ease";
    fadeOverlay.style.opacity = 0;
    await new Promise(r => setTimeout(r, 1600));
    fadeOverlay.style.display = "none";

    if (gameScreen) gameScreen.style.display = "block";
  }
});
