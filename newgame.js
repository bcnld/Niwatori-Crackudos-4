window.startNewGame = async function() {
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

  // --- 画面クリア ---
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

  // --- テロップ（主人公選択） ---
  const selectTelop = document.createElement("div");
  selectTelop.textContent = "主人公を選択してください";
  Object.assign(selectTelop.style, {
    position: "fixed",
    top: "10%",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "36px",
    fontWeight: "bold",
    color: "#fff",
    textShadow: "2px 2px 6px black",
    zIndex: 1200,
  });
  document.body.appendChild(selectTelop);

  characters.forEach((c, i) => {
    const charWrapper = document.createElement("div");
    Object.assign(charWrapper.style, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      cursor: "pointer",
      perspective: "600px",
      transition: "transform 0.6s ease",
    });

    const charDiv = document.createElement("div");
    Object.assign(charDiv.style, {
      width: "200px",
      height: "300px",
      backgroundImage: `url(${c.img})`,
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center bottom",
      border: "4px solid transparent",
      borderRadius: "12px",
      transition: "transform 0.6s ease, border-color 0.3s",
    });

    const nameLabel = document.createElement("div");
    nameLabel.textContent = c.name;
    Object.assign(nameLabel.style, {
      marginTop: "10px",
      fontSize: "24px",
      fontWeight: "bold",
      color: "#fff",
      textShadow: "2px 2px 4px black",
    });

    charWrapper.appendChild(charDiv);
    charWrapper.appendChild(nameLabel);
    characterUI.appendChild(charWrapper);

    let rotateAngle = 0;
    let rotateAnimId;

    function startRotate() {
      cancelAnimationFrame(rotateAnimId);
      function animate() {
        rotateAngle += 2;
        charDiv.style.transform = `rotateZ(${rotateAngle}deg)`;
        rotateAnimId = requestAnimationFrame(animate);
      }
      animate();
    }

    function stopRotate() {
      cancelAnimationFrame(rotateAnimId);
      charDiv.style.transform = `rotateZ(0deg)`;
    }

    // --- マウスイベント ---
    charWrapper.addEventListener("mouseenter", () => {
      charDiv.style.borderColor = "yellow";
      startRotate();
      selectedIndex = i;
      [...characterUI.children].forEach((sibling, j) => {
        if (j !== i) sibling.firstChild.style.borderColor = "transparent";
      });
    });

    charWrapper.addEventListener("mouseleave", () => {
      charDiv.style.borderColor = "transparent";
    });

    charWrapper.addEventListener("click", () => {
      if (selectedIndex === null) return;
      // --- 選択されなかったキャラを画面外にアニメーション ---
      [...characterUI.children].forEach((sibling, j) => {
        if (j !== selectedIndex) {
          sibling.style.transition = "transform 1s ease";
          sibling.style.transform = j < selectedIndex ? "translateX(-150vw)" : "translateX(150vw)";
        }
      });

      // --- 名前入力UIを表示 ---
      setTimeout(() => {
        selectTelop.textContent = "主人公の名前を決めてください";

        const nameUI = document.createElement("div");
        Object.assign(nameUI.style, {
          position: "fixed",
          top: "60%",
          left: selectedIndex === 0 ? "60%" : "40%",
          transform: "translate(-50%, -50%)",
          zIndex: 1100,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        });

        const nameInput = document.createElement("input");
        Object.assign(nameInput.style, {
          fontSize: "24px",
          padding: "8px 12px",
          borderRadius: "8px",
        });
        nameInput.placeholder = "名前を入力してください";
        nameUI.appendChild(nameInput);

        const confirmBtn = document.createElement("button");
        confirmBtn.textContent = "決定";
        Object.assign(confirmBtn.style, {
          marginTop: "10px",
          padding: "8px 16px",
          fontSize: "20px",
          borderRadius: "8px",
          cursor: "pointer",
        });

        confirmBtn.addEventListener("click", () => {
          const heroName = nameInput.value.trim();
          if (!heroName) {
            alert("名前を入力してください");
            return;
          }
          console.log(`主人公: ${characters[selectedIndex].name}, 名前: ${heroName} でゲーム開始`);
          // TODO: ゲーム開始処理をここに追加
          nameUI.remove();
          selectTelop.remove();
        });

        nameUI.appendChild(confirmBtn);
        bgDiv.appendChild(nameUI);

        nameInput.focus();
      }, 700); // 選択キャラが画面外にアニメーションした後に表示
    });
  });
};
