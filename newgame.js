window.startNewGame = async function() {
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
    const fadeSteps = 60;
    let step = 0;
    const interval = 2000 / fadeSteps;
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

  // --- 画面クリア ---
  document.body.querySelectorAll("div, img, video").forEach(el => {
    if (!el.id || el.id === "fade-overlay") return;
    el.remove();
  });

  // --- 背景 ---
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

  // --- 新規BGM ---
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
    { name: "うんこ", img: "images/hero2.png" }
  ];

  let selectedIndex = null;
  let nameBox = null;
  let confirmBtn = null;
  let rotationIntervals = [];

  function resetOtherChar(i) {
    characterUI.children.forEach((sibling, j) => {
      const siblingAura = sibling.querySelector("div");
      const siblingImg = sibling.querySelector("img");
      if (j !== i) {
        sibling.style.transform = `scale(1)`;
        sibling.style.opacity = "1";
        siblingAura.style.opacity = 0;
        siblingAura.style.transform = "translate(-50%, -50%) scale(1)";
        siblingImg.style.transform = "rotateY(0deg) scale(1)";
        siblingImg.style.backfaceVisibility = "visible";
      }
    });
  }

  function startRotation(img) {
    clearInterval(rotationIntervals[img.src]);
    let angle = 0;
    rotationIntervals[img.src] = setInterval(() => {
      angle += 2;
      img.style.transform = `rotateY(${angle}deg) scale(1.2)`;
      img.style.backfaceVisibility = "visible";
    }, 16);
  }

  function stopRotation(img) {
    clearInterval(rotationIntervals[img.src]);
    img.style.transform = "rotateY(0deg) scale(1)";
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
        opacity: 0,
        transition: "opacity 0.6s ease"
      });
      bgDiv.appendChild(nameBox);
      requestAnimationFrame(() => nameBox.style.opacity = 1);
    }
    if (!confirmBtn) {
      confirmBtn = document.createElement("button");
      confirmBtn.textContent = "決定";
      Object.assign(confirmBtn.style, {
        position: "fixed",
        top: "65%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 2100,
        padding: "10px 20px",
        fontSize: "20px",
        borderRadius: "8px",
        cursor: "pointer",
        opacity: 0,
        transition: "opacity 0.6s ease"
      });
      bgDiv.appendChild(confirmBtn);
      requestAnimationFrame(() => confirmBtn.style.opacity = 1);
    }
    telop.textContent = "主人公の名前を決めてください";
    confirmBtn.onclick = () => {
      const heroName = nameBox.value.trim() || c.name;
      createConfirmDialog(
        `主人公「${heroName}」でよろしいですか？`,
        () => {
          console.log(`確定: ${c.name}, 名前: ${heroName}`);
          if (nameBox) { nameBox.remove(); nameBox=null; }
          if (confirmBtn) { confirmBtn.remove(); confirmBtn=null; }
          if (telop) telop.remove();
          if (characterUI) characterUI.remove();
        },
        () => {
          selectedIndex = null;
          characterUI.children.forEach((sibling) => {
            sibling.style.transform = "scale(1)";
            sibling.style.opacity = "1";
          });
          telop.textContent = "主人公を選択してください";
        }
      );
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
      transition: "transform 0.6s ease, opacity 0.6s ease"
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
      background: "radial-gradient(circle, rgba(255,255,0,0.4), rgba(255,255,0,0))",
      filter: "blur(20px)",
      opacity: 0,
      transition: "opacity 0.3s ease, transform 0.3s ease",
      zIndex: 0
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
      transition: "transform 0.6s ease, border-color 0.3s, opacity 0.6s ease",
      zIndex: 1,
      backfaceVisibility: "hidden" // 裏面も表示
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
      transition: "opacity 0.6s ease"
    });
    charWrapper.appendChild(nameLabel);

    characterUI.appendChild(charWrapper);

    charWrapper.addEventListener("mouseenter", () => {
      if (selectedIndex !== i) {
        aura.style.opacity = 1;
        aura.style.transform = "translate(-50%, -50%) scale(1.2)";
        charImg.style.transform = "rotateY(15deg)";
      }
    });
    charWrapper.addEventListener("mouseleave", () => {
      if (selectedIndex !== i) {
        aura.style.opacity = 0;
        aura.style.transform = "translate(-50%, -50%) scale(1)";
        charImg.style.transform = "rotateY(0deg)";
      }
    });

    charWrapper.addEventListener("click", () => {
      if (selectedIndex === i) {
        showNameInput(c);
      } else {
        // 前回の選択をリセット
        if (selectedIndex !== null) {
          const prevChar = characterUI.children[selectedIndex];
          stopRotation(prevChar.querySelector("img"));
          prevChar.querySelector("div").style.opacity = 0; // オーラ消す
        }
        selectedIndex = i;
        aura.style.background = "radial-gradient(circle, rgba(0,255,255,0.6), rgba(0,255,255,0))";
        aura.style.opacity = 1;
        aura.style.transform = "translate(-50%, -50%) scale(1.5)";
        charWrapper.style.zIndex = 2000;
        startRotation(charImg);
        resetOtherChar(i);
        if (nameBox) { nameBox.style.opacity=0; setTimeout(()=>{nameBox.remove();nameBox=null;},600); }
        if (confirmBtn) { confirmBtn.style.opacity=0; setTimeout(()=>{confirmBtn.remove();confirmBtn=null;},600); }
        telop.textContent = "主人公を選択してください";
      }
    });
  });

  // --- ポップアップGIF/MP4 ---
  const popupMedia = [
    { type: "img", src: "images/popup1.gif" },
    { type: "img", src: "images/popup2.gif" },
    { type: "video", src: "videos/popup1.mp4" },
    { type: "video", src: "videos/popup2.mp4" },
    { type: "video", src: "videos/popup3.mp4" }
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
      transition: "opacity 0.6s ease"
    });

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
      mediaEl.muted = false;
      Object.assign(mediaEl.style, { width: "100%", height: "100%", objectFit: "contain" });
      mediaEl.play().catch(()=>{});
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
      zIndex: 5001
    });
    closeBtn.addEventListener("click", () => {
      popup.remove();
      popupCloseSound.currentTime = 0;
      popupCloseSound.play().catch(()=>{});
    });
    popup.appendChild(closeBtn);

    const maxLeft = window.innerWidth - parseInt(popup.style.width);
    const maxTop = window.innerHeight - parseInt(popup.style.height);
    popup.style.left = Math.floor(Math.random() * maxLeft) + "px";
    popup.style.top = Math.floor(Math.random() * maxTop) + "px";

    document.body.appendChild(popup);
    requestAnimationFrame(() => popup.style.opacity = 1);

    popupSound.currentTime = 0;
    popupSound.play().catch(()=>{});
  }

  createPopup();
  setInterval(() => createPopup(), 4000 + Math.random() * 4000);
};
