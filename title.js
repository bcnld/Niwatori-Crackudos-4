document.addEventListener("DOMContentLoaded", () => {
  const centerText = document.getElementById("center-text");
  const logos = document.querySelectorAll(".company-logo");
  const backgroundOverlay = document.getElementById("background-overlay");
  const pressKeyText = document.getElementById("press-any-key");
  const fullscreenEffect = document.getElementById("fullscreen-effect");
  const bgm = document.getElementById("bgm");
  const effectSfx = document.getElementById("effect-sfx");
  const selectSfx = document.getElementById("select-sfx");
  const gameScreen = document.getElementById("game-screen");

  let fadeOverlay = document.getElementById("fade-overlay");
  if(!fadeOverlay){
    fadeOverlay = document.createElement("div");
    fadeOverlay.id="fade-overlay";
    Object.assign(fadeOverlay.style,{
      position:"fixed", top:0, left:0, width:"100%", height:"100%",
      backgroundColor:"black", opacity:0, zIndex:9999, pointerEvents:"none"
    });
    document.body.appendChild(fadeOverlay);
  }

  let currentLogoIndex = 0;
  let started = false;

  // 初期非表示
  logos.forEach(l=>l.style.display="none");
  [pressKeyText, fullscreenEffect, backgroundOverlay, fadeOverlay, gameScreen].forEach(el=>el.style.display="none");

  // --- フェード関数 ---
  function fadeIn(el,d=1000){
    el.style.display="block"; el.style.opacity=0;
    return new Promise(r=>{
      let start=null;
      function step(ts){
        if(!start) start=ts;
        let p=Math.min((ts-start)/d,1);
        el.style.opacity=p;
        if(p<1) requestAnimationFrame(step); else r();
      }
      requestAnimationFrame(step);
    });
  }
  function fadeOut(el,d=1000){
    el.style.opacity=1;
    return new Promise(r=>{
      let start=null;
      function step(ts){
        if(!start) start=ts;
        let p=Math.min((ts-start)/d,1);
        el.style.opacity=1-p;
        if(p<1) requestAnimationFrame(step);
        else { el.style.display="none"; r(); }
      }
      requestAnimationFrame(step);
    });
  }

  // --- センターテキストクリック修正 ---
  // ★ pointerEvents を有効にして、クリックが必ず通るようにする
  centerText.style.pointerEvents = "auto";
  centerText.style.cursor = "pointer";
  centerText.addEventListener("click", ()=>{
    if(started) return;
    started=true;
    fadeOut(centerText,500).then(showNextLogo);
  });

  // --- ロゴ表示 ---
  async function showNextLogo(){
    if(currentLogoIndex >= logos.length){ await showFullscreenEffect(); return; }
    const logo = logos[currentLogoIndex];
    await fadeIn(logo,1000);
    await new Promise(r=>setTimeout(r,2000));
    await fadeOut(logo,1000);
    currentLogoIndex++;
    showNextLogo();
  }

  // --- フルスクリーン演出 ---
  async function showFullscreenEffect(){
    fullscreenEffect.style.display="block"; fullscreenEffect.style.opacity=0;
    await new Promise(r=>requestAnimationFrame(r));
    fullscreenEffect.style.transition="opacity 1s";
    fullscreenEffect.style.opacity=1;
    if(effectSfx){ effectSfx.currentTime=0; effectSfx.play(); }
    await new Promise(r=>setTimeout(r,2000));
    fullscreenEffect.style.opacity=0;
    await new Promise(r=>setTimeout(r,1000));
    fullscreenEffect.style.display="none";

    backgroundOverlay.style.display="block"; backgroundOverlay.style.opacity=0;
    backgroundOverlay.style.backgroundImage="url('images/press_bg.png')";
    backgroundOverlay.style.backgroundSize="cover"; backgroundOverlay.style.backgroundPosition="center";
    backgroundOverlay.style.transition="opacity 1s";
    await new Promise(r=>requestAnimationFrame(r));
    backgroundOverlay.style.opacity=1;
    await new Promise(r=>setTimeout(r,2000));

    showTitle();
  }

  // --- タイトル表示 ---
  // --- タイトル表示 ---
async function showTitleSequence(){
  // 背景オーバーレイを表示
  if(backgroundOverlay){
    backgroundOverlay.style.display="block";
    backgroundOverlay.style.opacity=0;
    backgroundOverlay.style.backgroundColor="rgba(0,0,0,0.5)";
    await new Promise(r=>requestAnimationFrame(r));
    backgroundOverlay.style.transition="opacity 1s ease";
    backgroundOverlay.style.opacity=1;
  }

  // BGM開始
  if(bgm){ 
    bgm.loop = true; 
    bgm.volume = 1; 
    bgm.play(); 
  }

  // --- Title1 表示 ---
  if(titleImg1){
    await fadeIn(titleImg1,1000);

    // 🔹全画面エフェクト（transition.png + effect.mp3）
    if(fullscreenEffect){
      fullscreenEffect.src = "images/transition.png";
      fullscreenEffect.style.display = "block";
      fullscreenEffect.style.opacity = 0;
      fullscreenEffect.style.position = "fixed";
      fullscreenEffect.style.top = 0;
      fullscreenEffect.style.left = 0;
      fullscreenEffect.style.width = "100%";
      fullscreenEffect.style.height = "100%";
      fullscreenEffect.style.zIndex = 9998;

      await fadeIn(fullscreenEffect,500);
      if(effectSfx){ 
        effectSfx.currentTime = 0; 
        effectSfx.play(); 
      }

      // 2秒後にフェードアウト
      await new Promise(r=>setTimeout(r,2000));
      await fadeOut(fullscreenEffect,1000);
    }

    await new Promise(r=>setTimeout(r,2000));
    await fadeOut(titleImg1,1000);
  }

  // --- Title2 表示 ---
  if(titleImg2){ 
    await fadeIn(titleImg2,1000); 
  }

  // 🔹Press_BG 表示（ズームアップ演出）
  const pressBg = document.createElement("img");
  pressBg.src = "images/press_bg.png";
  Object.assign(pressBg.style, {
    position: "fixed",
    bottom: "10%",
    left: "50%",
    transform: "translateX(-50%) scale(0.8)",
    opacity: 0,
    transition: "transform 1s ease, opacity 1s ease",
    zIndex: 10001,
    pointerEvents: "none"
  });
  document.body.appendChild(pressBg);

  requestAnimationFrame(()=>{
    pressBg.style.opacity = 1;
    pressBg.style.transform = "translateX(-50%) scale(1)";
  });

  // 🔹「Press Any Key」表示
  if(pressKeyText){ 
    pressKeyText.style.display = "block"; 
    pressKeyText.style.opacity = 0;
    requestAnimationFrame(()=>pressKeyText.style.opacity = 1); 
  }

  waitForPressKey();
}

  // --- 背景スクロール ---
  const scrollSpeed = 1;
  const containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;
  const bgImageWidth = 3600;
  const bgImageHeight = containerHeight;
  const scrollWrapper = document.createElement("div");
  Object.assign(scrollWrapper.style,{position:"fixed",top:0,left:0,width:`${containerWidth}px`,height:`${containerHeight}px`,overflow:"hidden",zIndex:1,pointerEvents:"none"});
  let bgElements = [];
  function createBgDiv(x){
    const div = document.createElement("div");
    Object.assign(div.style,{
      position:"absolute", top:0, left:`${x}px`,
      width:`${bgImageWidth}px`, height:`${bgImageHeight}px`,
      backgroundImage:"url('images/menu.png')",
      backgroundSize:"cover", backgroundRepeat:"no-repeat", backgroundPosition:"center"
    });
    return div;
  }
  function animateScrollingBackground(){
    for(let i=0;i<bgElements.length;i++){
      let left=parseFloat(bgElements[i].style.left);
      left-=scrollSpeed;
      bgElements[i].style.left=left+"px";
    }
    if(parseFloat(bgElements[0].style.left)+bgImageWidth<=0){
      const removed=bgElements.shift(); removed.remove();
    }
    const lastDiv=bgElements[bgElements.length-1];
    if(parseFloat(lastDiv.style.left)+bgImageWidth<=containerWidth){
      const newDiv=createBgDiv(parseFloat(lastDiv.style.left)+bgImageWidth);
      scrollWrapper.appendChild(newDiv); bgElements.push(newDiv);
    }
    requestAnimationFrame(animateScrollingBackground);
  }
  function startBackgroundScroll(){
    document.body.appendChild(scrollWrapper);
    bgElements=[createBgDiv(0),createBgDiv(bgImageWidth)];
    bgElements.forEach(d=>scrollWrapper.appendChild(d));
    animateScrollingBackground();
  }

  // --- メニュー ---
  const menuItems=["New Game","Load","Settings"];
  let menuWrapper, selectedIndex=0, isInputMode=false;
  function createMenu(){
    menuWrapper=document.createElement("div");
    Object.assign(menuWrapper.style,{position:"fixed",top:"20%",left:"50%",transform:"translateX(-50%)",zIndex:10000,display:"flex",flexDirection:"column",gap:"12px",fontSize:"24px",fontWeight:"bold",color:"#fff",textShadow:"0 0 5px black"});
    menuItems.forEach((text,i)=>{
      const item=document.createElement("div");
      item.textContent=text; item.dataset.index=i;
      Object.assign(item.style,{cursor:"pointer",padding:"10px 20px",borderRadius:"8px",userSelect:"none",transition:"background-color 0.3s,color 0.3s"});
      item.addEventListener("click",()=>{ selectedIndex=i; isInputMode=true; updateMenuSelection(); if(menuItems[i]==="New Game") startCharacterSelection(); });
      menuWrapper.appendChild(item);
    });
    document.body.appendChild(menuWrapper);
    updateMenuSelection();
  }
  function updateMenuSelection(){
    const items=menuWrapper.querySelectorAll("div");
    items.forEach((it,idx)=>{ if(idx===selectedIndex){ it.style.backgroundColor="rgba(255,255,255,0.2)"; it.style.color="#ff0"; } else { it.style.backgroundColor="transparent"; it.style.color="#fff"; } });
  }
  function attachMenuKeyboardListeners(){
    window.addEventListener("keydown",(e)=>{
      if(!isInputMode) return;
      if(e.key==="ArrowUp"){ selectedIndex=(selectedIndex-1+menuItems.length)%menuItems.length; updateMenuSelection(); if(selectSfx){ selectSfx.currentTime=0; selectSfx.play(); } }
      if(e.key==="ArrowDown"){ selectedIndex=(selectedIndex+1)%menuItems.length; updateMenuSelection(); if(selectSfx){ selectSfx.currentTime=0; selectSfx.play(); } }
      if(e.key==="Enter" || e.key===" "){ if(menuItems[selectedIndex]==="New Game") startCharacterSelection(); }
    });
  }

  // --- キャラクター選択 ---
  function startCharacterSelection(){
    if(menuWrapper) menuWrapper.remove();
    const charWrapper = document.createElement("div");
    Object.assign(charWrapper.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:10000,display:"flex",gap:"20px"});
    const characters=["Character1","Character2"];
    let selectedCharIndex=0;
    characters.forEach((name,i)=>{
      const div=document.createElement("div");
      div.textContent = name;
      Object.assign(div.style, { padding: "20px", border: "2px solid white", cursor: "pointer" });
      div.addEventListener("click", () => { 
        selectedCharIndex = i; 
        updateCharSelection(); 
      });
      charWrapper.appendChild(div);
    });

    document.body.appendChild(charWrapper);

    function updateCharSelection() { 
      charWrapper.childNodes.forEach((n, idx) => { 
        n.style.borderColor = idx === selectedCharIndex ? "yellow" : "white"; 
      }); 
    }
    updateCharSelection();

    // 確定ボタン
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "決定";
    Object.assign(confirmBtn.style, {
      position: "fixed",
      top: "80%",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 10001,
      padding: "10px 20px",
      cursor: "pointer"
    });
    confirmBtn.addEventListener("click", () => {
      const playerName = prompt("名前を入力してください", "");
      if (!playerName) return;
      if (confirm(`キャラ: ${characters[selectedCharIndex]}\n名前: ${playerName}\nでよろしいですか？`)) {
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

    // タイトル系削除
    [centerText, pressKeyText, fullscreenEffect, backgroundOverlay, menuWrapper, scrollWrapper].forEach(el => { if(el) el.remove(); });

    fadeOverlay.style.transition = "opacity 1.5s ease"; 
    fadeOverlay.style.opacity = 0;
    await new Promise(r => setTimeout(r, 1600));
    fadeOverlay.style.display = "none";

    if(gameScreen) gameScreen.style.display = "flex";
  }
});
