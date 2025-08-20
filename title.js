document.addEventListener("DOMContentLoaded", () => {
  const centerText = document.getElementById("center-text");
  const logos = Array.from(document.querySelectorAll(".company-logo"));
  const backgroundOverlay = document.getElementById("background-overlay");
  const titleImg1 = document.getElementById("title-img1");
  const titleImg2 = document.getElementById("title-img2");
  const pressKeyText = document.getElementById("press-any-key");
  const fadeOverlay = document.getElementById("fade-overlay");
  const gameScreen = document.getElementById("game-screen");
  const bgm = document.getElementById("bgm");

  let started = false;

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

  async function showLogos() {
    for (let logo of logos) {
      await fadeIn(logo, 1000);
      await new Promise(r => setTimeout(r, 1500));
      await fadeOut(logo, 1000);
    }
  }

  async function showTitle() {
    if (titleImg1) {
      await fadeIn(titleImg1, 1000);
      await new Promise(r => setTimeout(r, 2000));
      await fadeOut(titleImg1, 1000);
    }
    if (titleImg2) {
      await fadeIn(titleImg2, 1000);
    }
  }

  function showPressKey() {
    if (pressKeyText) {
      pressKeyText.style.display = "block";
      requestAnimationFrame(() => pressKeyText.style.opacity = 1);
    }
    if (backgroundOverlay) {
      backgroundOverlay.style.display = "block";
      backgroundOverlay.style.opacity = 0;
      backgroundOverlay.style.backgroundImage = "url('images/press_bg.png')";
      backgroundOverlay.style.backgroundSize = "cover";
      requestAnimationFrame(() => backgroundOverlay.style.opacity = 1);
    }
  }

  function waitForPressKey() {
    return new Promise(resolve => {
      function onInput() {
        window.removeEventListener("keydown", onInput);
        window.removeEventListener("touchstart", onInput);
        if (pressKeyText) fadeOut(pressKeyText, 500);
        if (backgroundOverlay) fadeOut(backgroundOverlay, 1000);
        resolve();
      }
      window.addEventListener("keydown", onInput);
      window.addEventListener("touchstart", onInput);
    });
  }

  async function startSequence() {
    if (bgm) { bgm.loop = true; bgm.play().catch(() => {}); }
    await showLogos();
    await showTitle();
    showPressKey();
    await waitForPressKey();
    startBackgroundScroll();
    createMenu();
  }

  centerText.addEventListener("click", () => {
    if (started) return;
    started = true;
    fadeOut(centerText, 500).then(startSequence);
  });

  // ----- 背景スクロール -----
  const scrollSpeed = 1;
  const bgWidth = 3600;
  const containerW = window.innerWidth;
  const containerH = window.innerHeight;
  const scrollWrapper = document.createElement("div");
  Object.assign(scrollWrapper.style, {
    position: "fixed", top: 0, left: 0,
    width: `${containerW}px`, height: `${containerH}px`,
    overflow: "hidden", zIndex: 1, pointerEvents: "none"
  });
  let bgElements = [];
  function createBgDiv(x) {
    const div = document.createElement("div");
    Object.assign(div.style, {
      position: "absolute", top: 0, left: `${x}px`,
      width: `${bgWidth}px`, height: `${containerH}px`,
      backgroundImage: "url('images/menu.png')",
      backgroundSize: "cover", backgroundRepeat: "no-repeat"
    });
    return div;
  }
  function animateScroll() {
    for (let div of bgElements) {
      div.style.left = `${parseFloat(div.style.left) - scrollSpeed}px`;
    }
    if (parseFloat(bgElements[0].style.left) + bgWidth <= 0) {
      bgElements.shift().remove();
    }
    const lastDiv = bgElements[bgElements.length - 1];
    if (parseFloat(lastDiv.style.left) + bgWidth <= containerW) {
      const newDiv = createBgDiv(parseFloat(lastDiv.style.left) + bgWidth);
      scrollWrapper.appendChild(newDiv);
      bgElements.push(newDiv);
    }
    requestAnimationFrame(animateScroll);
  }
  function startBackgroundScroll() {
    document.body.appendChild(scrollWrapper);
    bgElements = [createBgDiv(0), createBgDiv(bgWidth)];
    bgElements.forEach(d => scrollWrapper.appendChild(d));
    animateScroll();
  }

  // ----- メニュー -----
  const menuItems = ["New Game", "Load", "Settings"];
  let menuWrapper, selectedIndex = 0;
  function createMenu() {
    menuWrapper = document.createElement("div");
    Object.assign(menuWrapper.style, {
      position: "fixed", top: "60%", left: "50%", transform: "translateX(-50%)",
      zIndex: 10000, display: "flex", flexDirection: "column", gap: "12px",
      fontSize: "24px", fontWeight: "bold", color: "#fff"
    });
    menuItems.forEach((text, i) => {
      const item = document.createElement("div");
      item.textContent = text;
      item.dataset.index = i;
      Object.assign(item.style, { cursor: "pointer", padding: "10px 20px", borderRadius: "8px" });
      item.addEventListener("click", () => {
        selectedIndex = i;
        updateMenuSelection();
        if (menuItems[i] === "New Game") startGame();
        else alert(`${menuItems[i]} は未実装`);
      });
      menuWrapper.appendChild(item);
    });
    document.body.appendChild(menuWrapper);
    updateMenuSelection();
    window.addEventListener("keydown", e => {
      if (e.key === "ArrowUp") { selectedIndex = (selectedIndex - 1 + menuItems.length) % menuItems.length; updateMenuSelection(); }
      if (e.key === "ArrowDown") { selectedIndex = (selectedIndex + 1) % menuItems.length; updateMenuSelection(); }
      if (e.key === "Enter" || e.key === " ") {
        if (menuItems[selectedIndex] === "New Game") startGame();
        else alert(`${menuItems[selectedIndex]} は未実装`);
      }
    });
  }
  function updateMenuSelection() {
    menuWrapper.querySelectorAll("div").forEach((item, idx) => {
      if (idx === selectedIndex) { item.style.backgroundColor = "rgba(255,255,255,0.2)"; item.style.color = "#ff0"; }
      else { item.style.backgroundColor = "transparent"; item.style.color = "#fff"; }
    });
  }

  async function startGame() {
    if (fadeOverlay) { fadeOverlay.style.display = "block"; fadeOverlay.style.opacity = 0; await new Promise(r => requestAnimationFrame(r)); fadeOverlay.style.transition = "opacity 1.5s ease"; fadeOverlay.style.opacity = 1; await new Promise(r => setTimeout(r, 1600)); }
    if (menuWrapper) menuWrapper.remove();
    if (titleImg1) titleImg1.remove();
    if (titleImg2) titleImg2.remove();
    if (pressKeyText) pressKeyText.remove();
    if (backgroundOverlay) backgroundOverlay.remove();
    if (scrollWrapper) scrollWrapper.remove();
    if (fadeOverlay) { fadeOverlay.style.transition = "none"; fadeOverlay.style.opacity = 1; }
    if (gameScreen) gameScreen.style.display = "block";
    if (fadeOverlay) { await new Promise(r => requestAnimationFrame(r)); fadeOverlay.style.transition = "opacity 1.5s ease"; fadeOverlay.style.opacity = 0; await new Promise(r => setTimeout(r, 1600)); fadeOverlay.style.display = "none"; }
  }

});
