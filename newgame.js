window.startNewGame = async function() {
  // --- DOM要素 ---
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

  // --- 新規BGM再生 ---
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

  // --- キャラクター選択UI ---
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

  characters.forEach((c, i) => {
    const charWrapper = document.createElement("div");
    Object.assign(charWrapper.style, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      cursor: "pointer",
      perspective: "600px",
    });

    const charImg = document.createElement("img");
    charImg.src = c.img;
    Object.assign(charImg.style, {
      width: "200px",
      height: "300px",
      objectFit: "contain",
      border: "4px solid transparent",
      borderRadius: "12px",
      transition: "transform 0.6s ease, border-color 0.3s",
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

    // --- 透明部分判定用キャンバス ---
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    charImg.onload = () => {
      canvas.width = charImg.naturalWidth;
      canvas.height = charImg.naturalHeight;
      ctx.drawImage(charImg, 0, 0);
    };

    let rotateAngle = 0;
    let rotateAnimId;
    function startRotate() {
      cancelAnimationFrame(rotateAnimId);
      function animate() {
        rotateAngle += 2;
        charImg.style.transform = `rotateZ(${rotateAngle}deg)`;
        rotateAnimId = requestAnimationFrame(animate);
      }
      animate();
    }
    function stopRotate() {
      cancelAnimationFrame(rotateAnimId);
      charImg.style.transform = `rotateZ(0deg)`;
    }

    charImg.addEventListener("mousemove", (e) => {
      const rect = charImg.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      if (pixel[3] > 0) {
        charImg.style.borderColor = "yellow";
        startRotate();
        selectedIndex = i;
      } else {
        charImg.style.borderColor = "transparent";
      }
    });

    charImg.addEventListener("mouseleave", () => {
      charImg.style.borderColor = "transparent";
      stopRotate();
    });

    charImg.addEventListener("click", () => {
      if (selectedIndex === i) {
        characterUI.children.forEach((sibling, j) => {
          if (j !== i) {
            sibling.style.transition = "all 0.5s ease";
            sibling.style.transform = `translateX(${j < i ? "-200%" : "200%"})`;
            sibling.style.opacity = "0";
          }
        });

        const nameBox = document.createElement("input");
        nameBox.type = "text";
        nameBox.placeholder = "名前を入力してください";
        Object.assign(nameBox.style, {
          position: "fixed",
          top: "50%",
          left: i === 0 ? "60%" : "40%",
          transform: "translateY(-50%)",
          zIndex: 1100,
          padding: "10px 15px",
          fontSize: "20px",
          borderRadius: "8px",
        });
        bgDiv.appendChild(nameBox);

        const confirmBtn = document.createElement("button");
        confirmBtn.textContent = "決定";
        Object.assign(confirmBtn.style, {
          position: "fixed",
          top: "60%",
          left: i === 0 ? "60%" : "40%",
          transform: "translateY(-50%)",
          zIndex: 1100,
          padding: "10px 20px",
          fontSize: "20px",
          borderRadius: "8px",
          cursor: "pointer",
        });
        bgDiv.appendChild(confirmBtn);

        telop.textContent = "主人公の名前を決めてください";

        confirmBtn.addEventListener("click", () => {
          const heroName = nameBox.value.trim() || c.name;
          console.log(`主人公: ${c.name}, 名前: ${heroName}`);
          // TODO: ゲーム本編開始処理
          nameBox.remove();
          confirmBtn.remove();
          telop.remove();
        });
      }
    });
  });

  // --- ポップアップGIF/MP4（音量最大、動画音声有効） ---
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
      pointerEvents: "auto"
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
      mediaEl.volume = 1.0;
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

    popupSound.currentTime = 0;
    popupSound.play().catch(()=>{});
  }

  createPopup();
  setInterval(() => createPopup(), 4000 + Math.random() * 4000);
};
