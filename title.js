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

  let fadeOverlay = document.getElementById("fade-overlay");
  if (!fadeOverlay) {
    fadeOverlay = document.createElement("div");
    fadeOverlay.id = "fade-overlay";
    Object.assign(fadeOverlay.style, {
      position: "fixed", top: 0, left: 0,
      width: "100%", height: "100%",
      backgroundColor: "black",
      opacity: 0,
      zIndex: 9999,
      pointerEvents: "none",
      display: "none",
      transition: "opacity 1s ease"
    });
    document.body.appendChild(fadeOverlay);
  }

  let currentLogoIndex = 0;
  let started = false;
  let menuWrapper = null;
  let selectedIndex = 0;
  let isInputMode = false;
  const menuItems = ["New Game", "Load", "Settings"];
  let scrollWrapper = null;
  let bgElements = [];
  const bgImageWidth = 3600;

  let versionDiv, companyDiv;
  let keyboardAttached = false;

  logos.forEach(logo => {
    if (!logo) return;
    Object.assign(logo.style, {
      display: "none",
      position: "fixed",
      top: 0, left: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      zIndex: 9998
    });
  });

  [titleImg1, titleImg2, pressKeyText, fullscreenEffect, fadeOverlay].forEach(el => {
    if (el) el.style.display = "none";
  });

  if (centerText) centerText.style.display = "block";

  // --- フェード関数 ---
  function fadeIn(el, duration = 1000) {
    if (!el) return Promise.resolve();
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
    if (!el) return Promise.resolve();
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

  // --- ロゴ表示 ---
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

  async function showPressBgAndTitle() {
    const pressBg = document.createElement("img");
    pressBg.src = "images/press_bg.png";
    Object.assign(pressBg.style, {
      position: "fixed", top: 0, left: 0,
      width: "120%", height: "120%",
      objectFit: "cover",
      zIndex: 0,
      transform: "translate(-10%, -10%)",
      opacity: 0,
      transition: "all 3s ease"
    });
    document.body.appendChild(pressBg);
    requestAnimationFrame(() => pressBg.style.opacity = 1);

    if (bgm) {
      bgm.loop = true;
      bgm.volume = 1;
      bgm.currentTime = 0;
      bgm.play().catch(()=>{});
    }

    if (fullscreenEffect) {
      fullscreenEffect.src = "images/transition.png";
      Object.assign(fullscreenEffect.style, {
        display: "block",
        opacity: 1,
        position: "fixed",
        top: 0, left: 0,
        width: "100%", height: "100%",
        zIndex: 9999,
        objectFit: "cover",
        transition: "opacity 2s ease"
      });
      if (effectSfx) { effectSfx.currentTime = 0; effectSfx.play().catch(()=>{}); }
      setTimeout(() => fullscreenEffect.style.opacity = 0, 1500);
      setTimeout(() => fullscreenEffect.style.display = "none", 3500);
    }

    setTimeout(() => {
      pressBg.style.width = "100%";
      pressBg.style.height = "100%";
      pressBg.style.transform = "translate(0,0)";
    }, 50);

    if (titleImg1) await fadeIn(titleImg1, 2000);
    if (titleImg1) await fadeOut(titleImg1, 1000);
    if (titleImg2) await fadeIn(titleImg2, 1000);

    if (pressKeyText) {
      pressKeyText.style.display = "block";
      requestAnimationFrame(() => pressKeyText.style.opacity = 1);
    }

    waitForPressKey(pressBg);
  }

  function waitForPressKey(pressBg) {
    function onInput() {
      if (!pressKeyText || pressKeyText.style.display === "none") return;
      window.removeEventListener("keydown", onInput, true);
      window.removeEventListener("touchstart", onInput, true);
      fadeOut(pressKeyText, 500);
      fadeOut(pressBg, 500).then(() => {
        startBackgroundScroll();
        createMenu();
      });
    }
    window.addEventListener("keydown", onInput, { capture: true });
    window.addEventListener("touchstart", onInput, { capture: true });
  }

  if (centerText) {
    centerText.addEventListener("click", () => {
      if (started) return;
      started = true;
      fadeOut(centerText, 500).then(showNextLogo);
    });
  }

  const scrollSpeed = 1;
  const containerHeight = window.innerHeight;
  const containerWidth = window.innerWidth;

  function createBgDiv(x) {
    const div = document.createElement("div");
    Object.assign(div.style, {
      position: "absolute",
      top: 0, left: `${x}px`,
      width: `${bgImageWidth}px`,
      height: `${containerHeight}px`,
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
    if (bgElements.length && parseFloat(bgElements[0].style.left) + bgImageWidth <= 0) {
      const removed = bgElements.shift();
      removed.remove();
    }
    if (bgElements.length) {
      const lastDiv = bgElements[bgElements.length - 1];
      if (parseFloat(lastDiv.style.left) + bgImageWidth <= containerWidth) {
        const newDiv = createBgDiv(parseFloat(lastDiv.style.left) + bgImageWidth);
        scrollWrapper.appendChild(newDiv);
        bgElements.push(newDiv);
      }
    }
    requestAnimationFrame(animateScrollingBackground);
  }

  function startBackgroundScroll() {
    scrollWrapper = document.createElement("div");
    Object.assign(scrollWrapper.style, {
      position: "fixed", top: 0, left: 0,
      width: `${containerWidth}px`,
      height: `${containerHeight}px`,
      overflow: "hidden",
      zIndex: 1,
      pointerEvents: "none"
    });
    document.body.appendChild(scrollWrapper);
    bgElements = [createBgDiv(0), createBgDiv(bgImageWidth)];
    bgElements.forEach(div => scrollWrapper.appendChild(div));
    animateScrollingBackground();
  }

  // --- メニュー ---
  function createMenu() {
    if (menuWrapper) menuWrapper.remove();
    menuWrapper = document.createElement("div");
    menuWrapper.setAttribute("data-menu-wrapper", "true"); // ← 追加

    let topPosition = titleImg2 ? titleImg2.getBoundingClientRect().bottom + 20 : 100;
    Object.assign(menuWrapper.style, {
      position: "fixed",
      top: `${topPosition}px`,
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

    const isTouch = "ontouchstart" in window;

    menuItems.forEach((text, i) => {
      const item = document.createElement("div");
      item.textContent = text;
      Object.assign(item.style, {
        cursor: "pointer",
        padding: "10px 20px",
        borderRadius: "8px",
        userSelect: "none",
        transition: "background-color 0.3s ease,color 0.3s ease",
        color: "#fff"
      });
      item.dataset.index = i;

      if (!isTouch) {
        item.addEventListener("mouseover", () => {
          selectedIndex = i;
          updateMenuSelection();
          if (selectSfx) { selectSfx.currentTime = 0; selectSfx.play().catch(()=>{}); }
        });
      }

      item.addEventListener("click", () => {
        selectedIndex = i;
        updateMenuSelection();
        if (selectSfx) { selectSfx.currentTime = 0; selectSfx.play().catch(()=>{}); }
        executeMenuItem(selectedIndex);
      });

      menuWrapper.appendChild(item);
    });

    document.body.appendChild(menuWrapper);

    if (!versionDiv) {
      versionDiv = document.createElement("div");
      versionDiv.textContent = "Version 1.0.0";
      Object.assign(versionDiv.style, {
        position: "fixed",
        bottom: "10px",
        right: "10px",
        color: "#fff",
        fontSize: "14px",
        fontWeight: "bold",
        textShadow: "0 0 3px black",
        zIndex: 10000,
        pointerEvents: "none"
      });
      document.body.appendChild(versionDiv);
    }

    if (!companyDiv) {
      companyDiv = document.createElement("div");
      companyDiv.textContent = "@2025 Mdm5.inc";
      Object.assign(companyDiv.style, {
        position: "fixed",
        bottom: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        color: "#fff",
        fontSize: "14px",
        fontWeight: "bold",
        textShadow: "0 0 3px black",
        zIndex: 10000,
        pointerEvents: "none"
      });
      document.body.appendChild(companyDiv);
    }

    isInputMode = true;
    selectedIndex = 0;
    updateMenuSelection();
    attachMenuKeyboardListeners();
    adjustLayout();
  }

  function executeMenuItem(index) {
    const item = menuItems[index];
    if (!item) return;
    switch(item) {
      case "New Game":
        if (typeof window.startNewGame === "function") {
          window.startNewGame(); // newgame.js の関数を呼ぶ
        }
        break;
      case "Load":
        loadGame();
        break;
      case "Settings":
        openSettings();
        break;
    }
  }

  function updateMenuSelection() {
    if (!menuWrapper) return;
    const items = menuWrapper.querySelectorAll("div");
    items.forEach((item, idx) => {
      item.style.color = (idx === selectedIndex) ? "yellow" : "#fff";
    });
  }

  function attachMenuKeyboardListeners() {
    if (keyboardAttached) return;
    keyboardAttached = true;

    window.addEventListener("keydown", (e) => {
      if (!isInputMode) return;
      const items = menuWrapper.querySelectorAll("div");

      if (e.key === "ArrowUp") {
        selectedIndex = (selectedIndex - 1 + menuItems.length) % menuItems.length;
        updateMenuSelection();
        if (selectSfx) { selectSfx.currentTime = 0; selectSfx.play().catch(()=>{}); }
      } else if (e.key === "ArrowDown") {
        selectedIndex = (selectedIndex + 1) % menuItems.length;
        updateMenuSelection();
        if (selectSfx) { selectSfx.currentTime = 0; selectSfx.play().catch(()=>{}); }
      } else if (e.key === "Enter" || e.key === " ") {
        executeMenuItem(selectedIndex);
      }
    });
  }

  function adjustLayout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPortrait = h > w;

    if (scrollWrapper) {
      scrollWrapper.style.width = w + "px";
      scrollWrapper.style.height = h + "px";
    }
    if (bgElements) {
      bgElements.forEach((div, i) => {
        div.style.height = h + "px";
        div.style.width = bgImageWidth + "px";
        div.style.top = "0px";
        div.style.left = (i === 0 ? 0 : bgImageWidth) + "px";
      });
    }

    if (pressKeyText) {
      pressKeyText.style.left = "50%";
      pressKeyText.style.transform = "translateX(-50%)";
      pressKeyText.style.bottom = "20%";
      pressKeyText.style.fontSize = isPortrait ? "24px" : "18px";
    }

    if (centerText) {
      centerText.style.left = "50%";
      centerText.style.top = "50%";
      centerText.style.transform = "translate(-50%, -50%)";
      centerText.style.fontSize = isPortrait ? "28px" : "20px";
    }

    if (versionDiv) {
      versionDiv.style.fontSize = isPortrait ? "14px" : "12px";
      versionDiv.style.right = "10px";
      versionDiv.style.bottom = "10px";
      versionDiv.style.position = "fixed";
    }

    if (companyDiv) {
      companyDiv.style.fontSize = isPortrait ? "14px" : "12px";
      companyDiv.style.left = "50%";
      companyDiv.style.bottom = "10px";
      companyDiv.style.transform = "translateX(-50%)";
      companyDiv.style.position = "fixed";
    }
  }

  window.addEventListener("resize", adjustLayout);
  window.addEventListener("orientationchange", adjustLayout);
  window.addEventListener("load", adjustLayout);
});
