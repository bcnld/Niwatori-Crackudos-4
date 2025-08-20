document.addEventListener("DOMContentLoaded", () => {
  const centerText = document.getElementById("center-text");
  const logos = document.querySelectorAll(".company-logo");
  const backgroundOverlay = document.getElementById("background-overlay");
  const bgm = document.getElementById("bgm");
  const titleImg1 = document.getElementById("title-img1");
  const titleImg2 = document.getElementById("title-img2");
  const pressKeyText = document.getElementById("press-any-key");
  const fullscreenEffect = document.getElementById("fullscreen-effect");
  const effectSfx = document.getElementById("effect-sfx");
  const selectSfx = document.getElementById("select-sfx");
  const introVideo = document.getElementById("intro-video");
  const fadeOverlay = document.getElementById("fade-overlay");
  const gameScreen = document.getElementById("game-screen");

  let currentIndex = 0;
  let started = false;
  let menuWrapper, selectedIndex = 0, isInputMode = false;

  // 初期状態
  logos.forEach(logo => {
    Object.assign(logo.style, { position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:"9998", display:"none", opacity:0 });
  });
  [titleImg1, titleImg2, pressKeyText, fullscreenEffect, backgroundOverlay, introVideo, fadeOverlay].forEach(el=>{
    if(el){ el.style.display="none"; el.style.opacity=0; }
  });

  // フェード関数
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

  // ロゴ表示
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

  // タイトル表示
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

  // 背景スクロール
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

  // メニュー
  const menuItems=["New Game","Load","Settings"];
  function createMenu(){
    menuWrapper=document.createElement("div");
    const rect=titleImg2.getBoundingClientRect();
    Object.assign(menuWrapper.style,{position:"fixed",top:`${rect.bottom+20}px`,left:"50%",transform:"translateX(-50%)",zIndex:"10000",display:"flex",flexDirection:"column",gap:"12px",fontSize:"24px",fontWeight:"bold",color:"#fff",textShadow:"0 0 5px black"});
    menuItems.forEach((text,i)=>{
      const item=document.createElement("div");
      item.textContent=text;
      Object.assign(item.style,{cursor:"pointer",padding:"10px 20px",borderRadius:"8px",userSelect:"none",transition:"background-color 0.3s ease, color 0.3s ease"});
      item.dataset.index=i;
      item.addEventListener("click",()=>{ 
        if(selectedIndex===i && isInputMode){
          if(menuItems[i]==="New Game") startNewGameWithVideo();
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
            if(menuItems[selectedIndex] === "New Game") startNewGameWithVideo();
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

  // New Game → 暗転 → 動画 → ゲーム画面
  function startNewGameWithVideo() {
    if(menuWrapper) menuWrapper.style.display="none";

    // 最初にゲーム画面を絶対隠す！
    if (gameScreen) gameScreen.style.display = "none";

    const fadeAllUI = async () => {
        const promises = [];
        if(titleImg2) promises.push(fadeOut(titleImg2, 1000));
        if(backgroundOverlay) promises.push(fadeOut(backgroundOverlay, 1000));
        await Promise.all(promises);

        if(fadeOverlay){
            fadeOverlay.style.display = "block";
            fadeOverlay.style.opacity = "0";
            fadeOverlay.style.transition = "opacity 1s ease";
            await new Promise(res => {
                fadeOverlay.addEventListener("transitionend", res, { once:true });
                requestAnimationFrame(() => fadeOverlay.style.opacity = "1");
            });
        }
    };

    const playVideo = (video) => {
        return new Promise(resolve => {
            video.style.display = "block";
            video.style.zIndex = 10001;  // 一番上
            video.currentTime = 0;
            video.volume = 1;
            video.play().catch(err=>{
                console.warn("動画再生がブロックされました:",err);
            });
            video.onended = () => {
                video.style.display = "none";
                resolve();
            };
        });
    };

    const fadeOutOverlay = () => {
        return new Promise(res => {
            if(fadeOverlay){
                fadeOverlay.style.transition = "opacity 1s ease";
                fadeOverlay.addEventListener("transitionend", () => {
                    fadeOverlay.style.display = "none";
                    res();
                }, {once:true});
                requestAnimationFrame(() => fadeOverlay.style.opacity = "0");
            } else {
                res();
            }
        });
    };

    (async () => {
        await fadeAllUI();              // 黒フェードイン
        if(introVideo) await playVideo(introVideo); // 動画終了待機
        await fadeOutOverlay();         // 黒フェードアウト
        startGameWithFadeIn();          // ここでやっとゲーム画面を表示
    })();
}
  
  function startGameWithFadeIn() {
    if (gameScreen) {
        gameScreen.style.display = "block";
        gameScreen.style.opacity = 0;
        gameScreen.style.transition = "opacity 1s ease";
        requestAnimationFrame(() => { gameScreen.style.opacity = 1; });
    }

    if (scrollWrapper) scrollWrapper.style.display = "none";

    if (bgm && !bgm.paused) { bgm.pause(); bgm.currentTime = 0; }

    if (fadeOverlay) {
        fadeOverlay.style.opacity = "0";
        fadeOverlay.addEventListener("transitionend", () => { fadeOverlay.style.display = "none"; }, { once: true });
    }

    if (typeof initGame === "function") initGame();
  }
});
