document.addEventListener("DOMContentLoaded", () => {
  const centerText = document.getElementById("center-text");
  const logos = document.querySelectorAll(".company-logo");
  const backgroundOverlay = document.getElementById("background-overlay");
  const bgm = document.getElementById("bgm");
  const bgmGame = document.getElementById("bgm-game");
  const titleImg1 = document.getElementById("title-img1");
  const titleImg2 = document.getElementById("title-img2");
  const pressKeyText = document.getElementById("press-any-key");
  const fullscreenEffect = document.getElementById("fullscreen-effect");
  const effectSfx = document.getElementById("effect-sfx");
  const selectSfx = document.getElementById("select-sfx");
  const fadeOverlay = document.getElementById("fade-overlay");
  const gameScreen = document.getElementById("game-screen");

  let currentIndex = 0;
  let started = false;
  let menuWrapper, selectedIndex = 0, isInputMode = false;

  // --- 初期状態 ---
  logos.forEach(logo => Object.assign(logo.style, {
    position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
    zIndex:"9998", display:"none", opacity:0
  }));
  [titleImg1, titleImg2, pressKeyText, fullscreenEffect, backgroundOverlay, fadeOverlay].forEach(el=>{
    if(el){ el.style.display="none"; el.style.opacity=0; }
  });

  // --- フェード関数 ---
  function fadeIn(el, duration=1000){
    el.style.display="block"; el.style.opacity=0;
    return new Promise(resolve=>{
      let start=null;
      function step(ts){
        if(!start) start=ts;
        let p=Math.min((ts-start)/duration,1);
        el.style.opacity=p;
        if(p<1) requestAnimationFrame(step); else resolve();
      }
      requestAnimationFrame(step);
    });
  }
  function fadeOut(el, duration=1000){
    el.style.opacity=1;
    return new Promise(resolve=>{
      let start=null;
      function step(ts){
        if(!start) start=ts;
        let p=Math.min((ts-start)/duration,1);
        el.style.opacity=1-p;
        if(p<1) requestAnimationFrame(step);
        else { el.style.display="none"; resolve(); }
      }
      requestAnimationFrame(step);
    });
  }

  // --- ロゴ表示 ---
  async function showNextLogo(){
    if(currentIndex>=logos.length){
      await showTitleSequence();
      return;
    }
    if(currentIndex > 0 && backgroundOverlay){
      backgroundOverlay.style.transition="none";
      backgroundOverlay.style.backgroundImage="";
      backgroundOverlay.style.backgroundColor="rgba(255,255,255,0.8)";
      backgroundOverlay.style.opacity=1;
      setTimeout(()=>backgroundOverlay.style.transition="opacity 1s ease",10);
    } else if(backgroundOverlay){
      backgroundOverlay.style.backgroundColor="transparent";
      backgroundOverlay.style.opacity=1;
    }
    const logo=logos[currentIndex];
    await fadeIn(logo,1000);
    await new Promise(r=>setTimeout(r,2000));
    await fadeOut(logo,1000);
    currentIndex++;
    showNextLogo();
  }

  // --- タイトル表示 ---
  async function showTitleSequence(){
    const effectPromise = showFullscreenEffect();
    if(backgroundOverlay){
      backgroundOverlay.style.display="block";
      backgroundOverlay.style.opacity=0;
      backgroundOverlay.style.backgroundImage="url('images/press_bg.png')";
      backgroundOverlay.style.backgroundSize="cover";
      backgroundOverlay.style.backgroundPosition="center";
      backgroundOverlay.style.filter="blur(5px)";
      await new Promise(resolve => requestAnimationFrame(resolve));
      backgroundOverlay.style.transition="opacity 2s ease, filter 2s ease";
      backgroundOverlay.style.opacity=1;
      backgroundOverlay.style.filter="blur(0)";
    }
    if(bgm){ bgm.loop=true; bgm.volume=1; bgm.play(); }
    if(titleImg1){ titleImg1.style.display="block"; await fadeIn(titleImg1,1000); await new Promise(r=>setTimeout(r,3000)); await fadeOut(titleImg1,1000); }
    if(titleImg2){ titleImg2.style.display="block"; await fadeIn(titleImg2,1000); }
    if(pressKeyText){ pressKeyText.style.display="block"; requestAnimationFrame(()=>pressKeyText.style.opacity=1); }
    effectPromise.catch(()=>{});
    waitForPressKey();
  }

  async function showFullscreenEffect(){
    if(!fullscreenEffect) return;
    if(effectSfx){ try{ effectSfx.currentTime=0; await effectSfx.play(); } catch{} }
    fullscreenEffect.style.display="block"; fullscreenEffect.style.opacity=0;
    fullscreenEffect.style.transform="translate(-50%,-50%) scale(2)";
    fullscreenEffect.style.transition="none";
    await new Promise(resolve => requestAnimationFrame(resolve));
    fullscreenEffect.style.transition="opacity 3s ease, transform 3s ease";
    fullscreenEffect.style.opacity=1;
    fullscreenEffect.style.transform="translate(-50%,-50%) scale(1)";
    await new Promise(r=>setTimeout(r,2000));
    fullscreenEffect.style.transition="opacity 3s ease";
    fullscreenEffect.style.opacity=0;
    await new Promise(r=>setTimeout(r,3000));
    fullscreenEffect.style.display="none";
  }

  function waitForPressKey(){
    async function onInput(){
      window.removeEventListener("keydown",onInput,true);
      window.removeEventListener("touchstart",onInput,true);
      if(pressKeyText) await fadeOut(pressKeyText,800);
      if(backgroundOverlay) await fadeOut(backgroundOverlay,1500);
      startBackgroundScroll();
      createMenu();
      attachMenuKeyboardListeners();
    }
    window.addEventListener("keydown",onInput,{capture:true});
    window.addEventListener("touchstart",onInput,{capture:true});
  }

  centerText.addEventListener("click",()=>{
    if(started) return;
    started = true;
    fadeOut(centerText,500).then(showNextLogo);
  });

  // --- 背景スクロール ---
  const scrollSpeed=1;
  const containerHeight=window.innerHeight;
  const containerWidth=window.innerWidth;
  const bgImageWidth=3600;
  const bgImageHeight=containerHeight;
  const scrollWrapper=document.createElement("div");
  Object.assign(scrollWrapper.style,{position:"fixed",top:"0",left:"0",width:`${containerWidth}px`,height:`${containerHeight}px`,overflow:"hidden",zIndex:"1",pointerEvents:"none"});
  let bgElements=[];
  function createBgDiv(x){
    const div=document.createElement("div");
    Object.assign(div.style,{position:"absolute",top:"0",left:`${x}px`,width:`${bgImageWidth}px`,height:`${bgImageHeight}px`,backgroundImage:"url('images/menu.png')",backgroundSize:"cover",backgroundRepeat:"no-repeat",backgroundPosition:"center center"});
    return div;
  }
  function animateScrollingBackground(){
    for(let i=0;i<bgElements.length;i++){
      const div=bgElements[i];
      div.style.left=`${parseFloat(div.style.left)-scrollSpeed}px`;
    }
    if(parseFloat(bgElements[0].style.left)+bgImageWidth<=0){
      const removed=bgElements.shift();
      removed.remove();
    }
    const lastDiv=bgElements[bgElements.length-1];
    if(parseFloat(lastDiv.style.left)+bgImageWidth<=containerWidth){
      const newDiv=createBgDiv(parseFloat(lastDiv.style.left)+bgImageWidth);
      scrollWrapper.appendChild(newDiv);
      bgElements.push(newDiv);
    }
    requestAnimationFrame(animateScrollingBackground);
  }
  function startBackgroundScroll(){
    document.body.appendChild(scrollWrapper);
    bgElements=[createBgDiv(0),createBgDiv(bgImageWidth)];
    bgElements.forEach(div=>scrollWrapper.appendChild(div));
    animateScrollingBackground();
  }

  // --- メニュー ---
  const menuItems=["New Game","Load","Settings"];
  function createMenu(){
    menuWrapper=document.createElement("div");
    const rect=titleImg2.getBoundingClientRect();
    Object.assign(menuWrapper.style,{
      position:"fixed",top:`${rect.bottom+20}px`,left:"50%",transform:"translateX(-50%)",
      zIndex:"10000",display:"flex",flexDirection:"column",gap:"12px",
      fontSize:"24px",fontWeight:"bold",color:"#fff",textShadow:"0 0 5px black"
    });
    menuItems.forEach((text,i)=>{
      const item=document.createElement("div");
      item.textContent=text;
      Object.assign(item.style,{
        cursor:"pointer",padding:"10px 20px",borderRadius:"8px",userSelect:"none",
        transition:"background-color 0.3s ease, color 0.3s ease"
      });
      item.dataset.index=i;
      item.addEventListener("click",()=>{ 
        if(selectedIndex===i && isInputMode){
          if(menuItems[i]==="New Game") startCharacterSelection();
          else alert(`"${menuItems[i]}" が選択されました！`);
        } else {
          selectedIndex=i; isInputMode=true; updateMenuHighlight();
        }
      });
      item.addEventListener("mouseenter",()=>{
        if(selectedIndex!==i){
          selectedIndex=i; isInputMode=false; updateMenuHighlight();
        }
      });
      menuWrapper.appendChild(item);
    });
    document.body.appendChild(menuWrapper);
    updateMenuHighlight();
  }
  function updateMenuHighlight(){
    if(!menuWrapper) return;
    const children=menuWrapper.children;
    let playedSfx=false;
    for(let i=0;i<children.length;i++){
      const item=children[i];
      if(i===selectedIndex){ 
        if(isInputMode){ item.style.backgroundColor="#f90"; item.style.color="#000"; }
        else { item.style.backgroundColor="#555"; item.style.color="#fff"; }
        if(!playedSfx && selectSfx){
          try{ selectSfx.currentTime=0; selectSfx.play(); playedSfx=true; } catch{}
        }
      } else {
        item.style.backgroundColor="transparent"; item.style.color="#fff";
      }
    }
  }
  function attachMenuKeyboardListeners(){
    window.addEventListener("keydown", e => {
      if(!menuWrapper) return;
      if(e.key === "ArrowDown"){ 
        selectedIndex = (selectedIndex + 1) % menuItems.length; 
        isInputMode = false; 
        updateMenuHighlight(); 
        e.preventDefault();
      } else if(e.key === "ArrowUp"){ 
        selectedIndex = (selectedIndex - 1 + menuItems.length) % menuItems.length; 
        isInputMode = false; 
        updateMenuHighlight(); 
        e.preventDefault();
      } else if(e.key === "Enter"){
        if(selectedIndex >= 0 && selectedIndex < menuItems.length){
          if(isInputMode){
            if(menuItems[selectedIndex] === "New Game") startCharacterSelection();
            else alert(`"${menuItems[selectedIndex]}" が選択されました！`);
          } else {
            isInputMode = true; 
            updateMenuHighlight();
          }
        }
        e.preventDefault();
      } else if(e.key === "Escape"){
        if(isInputMode){ isInputMode = false; updateMenuHighlight(); }
      }
    });
  }

  // --- キャラ選択画面 ---
  let selectedCharacter = null;
  let playerName = "";
  let step = 0; // 0:キャラ,1:名前,2:確認
  const characters = [
    { name:"Hero1", image:"images/hero1.png" },
    { name:"Hero2", image:"images/hero2.png" }
  ];

  function startCharacterSelection(){
    step=0;
    if(menuWrapper) menuWrapper.style.display="none";
    if(scrollWrapper) scrollWrapper.style.display="none";
    if(bgm && !bgm.paused) { bgm.pause(); bgm.currentTime=0; }
    if(bgmGame){ bgmGame.loop=true; bgmGame.volume=1; bgmGame.play(); }

    showCharacterSelection();
  }

  function showCharacterSelection(){
    fadeOverlay.style.display="block";
    fadeOverlay.style.opacity="0";
    fadeOverlay.style.transition="opacity 0.5s ease";
    requestAnimationFrame(()=>fadeOverlay.style.opacity="1");

    const container = document.createElement("div");
    container.id="char-select";
    Object.assign(container.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:"10000",display:"flex",gap:"40px"});
    characters.forEach((c,i)=>{
      const img = document.createElement("img");
      img.src=c.image; img.style.width="200px"; img.style.cursor="pointer"; img.dataset.index=i;
      img.addEventListener("click",()=>{
        selectedCharacter=c;
        container.remove();
        showNameInput();
      });
      container.appendChild(img);
    });
    document.body.appendChild(container);
  }

  function showNameInput(){
    step=1;
    const container = document.createElement("div");
    container.id="name-input";
    Object.assign(container.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:"10000",textAlign:"center",color:"#fff"});
    const label = document.createElement("div"); label.textContent="ニックネームを入力してください"; container.appendChild(label);
    const input = document.createElement("input"); input.type="text"; input.style.fontSize="24px"; container.appendChild(input);
    const btn = document.createElement("button"); btn.textContent="決定"; btn.style.fontSize="24px"; container.appendChild(btn);
    btn.addEventListener("click",()=>{
      if(input.value.trim()===""){ alert("名前を入力してください"); return; }
      playerName=input.value.trim();
      container.remove();
      showNameConfirm();
    });
    document.body.appendChild(container);
  }

  function showNameConfirm(){
    step=2;
    const container = document.createElement("div");
    container.id="name-confirm";
    Object.assign(container.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:"10000",textAlign:"center",color:"#fff"});
    const text = document.createElement("div"); text.textContent=`この名前でよろしいですか？\n${playerName}`; container.appendChild(text);
    const yesBtn = document.createElement("button"); yesBtn.textContent="はい"; yesBtn.style.fontSize="24px"; container.appendChild(yesBtn);
    const noBtn = document.createElement("button"); noBtn.textContent="いいえ"; noBtn.style.fontSize="24px"; container.appendChild(noBtn);
    yesBtn.addEventListener("click",()=>{
      container.remove();
      fadeOut(fadeOverlay,500).then(()=>startGameWithFadeIn());
    });
    noBtn.addEventListener("click",()=>{
      container.remove();
      showNameInput();
    });
    document.body.appendChild(container);
  }

  // --- ゲーム開始 ---
  function startGameWithFadeIn() {
    if (gameScreen) {
        gameScreen.style.display = "block";
        gameScreen.style.opacity = 0;
        gameScreen.style.transition = "opacity 1s ease";
        requestAnimationFrame(() => { gameScreen.style.opacity = 1; });
    }
    if(fadeOverlay) fadeOverlay.style.display="none";
    if(bgmGame && !bgmGame.paused) bgmGame.volume=1;
    if(typeof initGame==="function") initGame(selectedCharacter,playerName);
  }
});
