document.addEventListener("DOMContentLoaded", ()=>{
  const centerText = document.getElementById("center-text");
  const logos = document.querySelectorAll(".company-logo");
  const backgroundOverlay = document.getElementById("background-overlay");
  const fadeOverlay = document.getElementById("fade-overlay");
  const titleImg1 = document.getElementById("title-img1");
  const titleImg2 = document.getElementById("title-img2");
  const pressKeyText = document.getElementById("press-any-key");
  const fullscreenEffect = document.getElementById("fullscreen-effect");
  const effectSfx = document.getElementById("effect-sfx");
  const selectSfx = document.getElementById("select-sfx");
  const gameScreen = document.getElementById("game-screen");
  const bgm = document.getElementById("bgm");

  let currentIndex=0, started=false;

  // fade関数
  function fadeIn(el,d=1000){ el.style.display="block"; el.style.opacity=0; return new Promise(res=>{ let start=null; function step(ts){ if(!start) start=ts; let p=Math.min((ts-start)/d,1); el.style.opacity=p; if(p<1) requestAnimationFrame(step); else res(); } requestAnimationFrame(step); }); }
  function fadeOut(el,d=1000){ el.style.opacity=1; return new Promise(res=>{ let start=null; function step(ts){ if(!start) start=ts; let p=Math.min((ts-start)/d,1); el.style.opacity=1-p; if(p<1) requestAnimationFrame(step); else { el.style.display="none"; res(); } } requestAnimationFrame(step); }); }

  async function showNextLogo(){
    if(currentIndex>=logos.length){ await showTitleSequence(); return; }
    const logo=logos[currentIndex];
    await fadeIn(logo,1000);
    await new Promise(r=>setTimeout(r,2000));
    await fadeOut(logo,1000);
    currentIndex++;
    showNextLogo();
  }

  async function showTitleSequence(){
    if(backgroundOverlay){ backgroundOverlay.style.display="block"; backgroundOverlay.style.opacity=0; backgroundOverlay.style.backgroundImage="url('images/press_bg.png')"; backgroundOverlay.style.backgroundSize="cover"; requestAnimationFrame(()=>backgroundOverlay.style.opacity=1); }
    if(bgm){ bgm.loop=true; bgm.play(); }
    if(titleImg1){ await fadeIn(titleImg1,1000); await new Promise(r=>setTimeout(r,3000)); await fadeOut(titleImg1,1000); }
    if(titleImg2){ await fadeIn(titleImg2,1000); }
    if(pressKeyText){ pressKeyText.style.display="block"; requestAnimationFrame(()=>pressKeyText.style.opacity=1); }
    waitForPressKey();
  }

  function waitForPressKey(){
    function onInput(){ window.removeEventListener("keydown",onInput); window.removeEventListener("touchstart",onInput); fadeOut(pressKeyText,800); fadeOut(backgroundOverlay,1500); startBackgroundScroll(); createMenu(); }
    window.addEventListener("keydown",onInput); window.addEventListener("touchstart",onInput);
  }

  centerText.addEventListener("click",()=>{ if(started) return; started=true; fadeOut(centerText,500).then(showNextLogo); });

  // 背景スクロール
  const scrollSpeed=1, bgWidth=3600;
  const containerW=window.innerWidth, containerH=window.innerHeight;
  const scrollWrapper=document.createElement("div"); Object.assign(scrollWrapper.style,{position:"fixed",top:"0",left:"0",width:`${containerW}px`,height:`${containerH}px`,overflow:"hidden",zIndex:1,pointerEvents:"none"});
  let bgElements=[];
  function createBgDiv(x){ const div=document.createElement("div"); Object.assign(div.style,{position:"absolute",top:"0",left:`${x}px`,width:`${bgWidth}px`,height:`${containerH}px`,backgroundImage:"url('images/menu.png')",backgroundSize:"cover",backgroundRepeat:"no-repeat"}); return div; }
  function animateScrollingBackground(){ for(let div of bgElements){ div.style.left=`${parseFloat(div.style.left)-scrollSpeed}px`; } if(parseFloat(bgElements[0].style.left)+bgWidth<=0){ bgElements.shift().remove(); } const lastDiv=bgElements[bgElements.length-1]; if(parseFloat(lastDiv.style.left)+bgWidth<=containerW){ bgElements.push(createBgDiv(parseFloat(lastDiv.style.left)+bgWidth)); scrollWrapper.appendChild(bgElements[bgElements.length-1]); } requestAnimationFrame(animateScrollingBackground); }
  function startBackgroundScroll(){ document.body.appendChild(scrollWrapper); bgElements=[createBgDiv(0),createBgDiv(bgWidth)]; bgElements.forEach(d=>scrollWrapper.appendChild(d)); animateScrollingBackground(); }

  // メニュー
  const menuItems=["New Game","Load","Settings"];
  let menuWrapper, selectedIndex=0;
  function createMenu(){
    menuWrapper=document.createElement("div");
    Object.assign(menuWrapper.style,{position:"fixed",top:"60%",left:"50%",transform:"translateX(-50%)",zIndex:10000,display:"flex",flexDirection:"column",gap:"12px",fontSize:"24px",fontWeight:"bold",color:"#fff"});
    menuItems.forEach((text,i)=>{
      const item=document.createElement("div"); item.textContent=text; item.dataset.index=i;
      Object.assign(item.style,{cursor:"pointer",padding:"10px 20px",borderRadius:"8px"});
      item.addEventListener("click",()=>{ if(selectedIndex===i){ if(menuItems[i]==="New Game"){ startGame(); } else alert(`${menuItems[i]} は未実装`); } else{ selectedIndex=i; updateMenuSelection(); } });
      menuWrapper.appendChild(item);
    });
    document.body.appendChild(menuWrapper);
    updateMenuSelection();
    window.addEventListener("keydown",e=>{
      if(e.key==="ArrowUp"){ selectedIndex=(selectedIndex-1+menuItems.length)%menuItems.length; updateMenuSelection(); }
      if(e.key==="ArrowDown"){ selectedIndex=(selectedIndex+1)%menuItems.length; updateMenuSelection(); }
      if(e.key==="Enter"||e.key===" "){ if(menuItems[selectedIndex]==="New Game") startGame(); else alert(`${menuItems[selectedIndex]} は未実装`); }
    });
  }
  function updateMenuSelection(){ menuWrapper.querySelectorAll("div").forEach((item,idx)=>{ if(idx===selectedIndex){ item.style.backgroundColor="rgba(255,255,255,0.2)"; item.style.color="#ff0"; } else{ item.style.backgroundColor="transparent"; item.style.color="#fff"; } }); }

  async function startGame(){
    if(fadeOverlay){ fadeOverlay.style.display="block"; fadeOverlay.style.opacity=0; await new Promise(r=>requestAnimationFrame(r)); fadeOverlay.style.transition="opacity 1.5s ease"; fadeOverlay.style.opacity=1; await new Promise(r=>setTimeout(r,1600)); }
    if(menuWrapper) menuWrapper.remove();
    if(titleImg1) titleImg1.remove(); if(titleImg2) titleImg2.remove();
    if(pressKeyText) pressKeyText.remove();
    if(backgroundOverlay) backgroundOverlay.remove();
    if(scrollWrapper) scrollWrapper.remove();
    if(fadeOverlay){ fadeOverlay.style.transition="none"; fadeOverlay.style.opacity=1; }
    if(gameScreen) gameScreen.style.display="block";
    if(fadeOverlay){ await new Promise(r=>requestAnimationFrame(r)); fadeOverlay.style.transition="opacity 1.5s ease"; fadeOverlay.style.opacity=0; await new Promise(r=>setTimeout(r,1600)); fadeOverlay.style.display="none"; }
  }
});
      await fadeIn(titleImg1,1000); 
      await new Promise(r=>setTimeout(r,3000)); 
      await fadeOut(titleImg1,1000); 
    }
    if(titleImg2){ 
      titleImg2.style.display="block"; 
      await fadeIn(titleImg2,1000); 
    }

    if(pressKeyText){ 
      pressKeyText.style.display="block"; 
      requestAnimationFrame(()=>pressKeyText.style.opacity=1); 
    }

    effectPromise.catch(()=>{});
    waitForPressKey();
  }

  // フルスクリーン演出
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

  // Press Any Key 背景表示
  function showPressBackground() {
    if(!backgroundOverlay) return;
    backgroundOverlay.style.display = "block";
    backgroundOverlay.style.opacity = 0;
    backgroundOverlay.style.backgroundImage = "url('images/press_bg.png')";
    backgroundOverlay.style.backgroundSize = "cover";
    backgroundOverlay.style.backgroundPosition = "center";
    backgroundOverlay.style.transition = "opacity 1.5s ease";
    requestAnimationFrame(() => {
      backgroundOverlay.style.opacity = 1;
    });
  }

  function waitForPressKey(){
    showPressBackground();

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

  // センターテキストクリックで開始
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

  // メニュー作成・操作
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
          if(menuItems[i]==="New Game") {
            startGameWithFadeIn();
          } else {
            alert(`"${menuItems[i]}" はまだ未実装です`);
          }
        } else {
          selectedIndex = i;
          updateMenuSelection();
          if(selectSfx){ try{ selectSfx.currentTime=0; selectSfx.play(); }catch{} }
        }
      });
      menuWrapper.appendChild(item);
    });
    document.body.appendChild(menuWrapper);
    isInputMode = true;
    selectedIndex = 0;
    updateMenuSelection();
  }

  function updateMenuSelection(){
    const items = menuWrapper.querySelectorAll("div");
    items.forEach((item,idx)=>{
      if(idx===selectedIndex){
        item.style.backgroundColor="rgba(255,255,255,0.2)";
        item.style.color="#ff0";
      } else {
        item.style.backgroundColor="transparent";
        item.style.color="#fff";
      }
    });
  }

  function attachMenuKeyboardListeners(){
    window.addEventListener("keydown",(e)=>{
      if(!isInputMode) return;
      if(e.key==="ArrowUp"){
        selectedIndex = (selectedIndex-1+menuItems.length)%menuItems.length;
        updateMenuSelection();
        if(selectSfx){ try{ selectSfx.currentTime=0; selectSfx.play(); }catch{} }
      } else if(e.key==="ArrowDown"){
        selectedIndex = (selectedIndex+1)%menuItems.length;
        updateMenuSelection();
        if(selectSfx){ try{ selectSfx.currentTime=0; selectSfx.play(); }catch{} }
      } else if(e.key==="Enter" || e.key===" "){
        if(menuItems[selectedIndex]==="New Game"){
          startGameWithFadeIn();
        } else {
          alert(`"${menuItems[selectedIndex]}" はまだ未実装です`);
        }
      }
    });
  }

  async function startGameWithFadeIn(){
    if(fadeOverlay){
      fadeOverlay.style.display="block";
      fadeOverlay.style.opacity=0;
      await new Promise(r=>requestAnimationFrame(r));
      fadeOverlay.style.transition="opacity 1.5s ease";
      fadeOverlay.style.opacity=1;
      await new Promise(r=>setTimeout(r,1600));
    }
    if(menuWrapper) menuWrapper.remove();
    if(titleImg1) titleImg1.remove();
    if(titleImg2) titleImg2.remove();
    if(pressKeyText) pressKeyText.remove();
    if(backgroundOverlay) backgroundOverlay.remove();
    if(scrollWrapper) scrollWrapper.remove();

    if(fadeOverlay){
      fadeOverlay.style.transition="none";
      fadeOverlay.style.opacity=1;
    }

    if(gameScreen){
      gameScreen.style.display="block";
    }

    if(fadeOverlay){
      await new Promise(r=>requestAnimationFrame(r));
      fadeOverlay.style.transition="opacity 1.5s ease";
      fadeOverlay.style.opacity=0;
      await new Promise(r=>setTimeout(r,1600));
      fadeOverlay.style.display="none";
    }
  }
});
