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
  const fadeOverlay = document.getElementById("fade-overlay") || (() => {
    const div = document.createElement("div");
    div.id="fade-overlay";
    div.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:#000;opacity:0;z-index:9999;display:none;";
    document.body.appendChild(div);
    return div;
  })();
  const gameScreen = document.getElementById("game-screen");

  let currentIndex = 0;
  let started = false;
  let menuWrapper, selectedIndex = 0, isInputMode = false;

  // キャラクター選択用
  const characters = [
    { name: "Hero1", image: "images/hero1.png" },
    { name: "Hero2", image: "images/hero2.png" }
  ];
  let selectedCharacter = null;
  let playerName = "";
  let step = 0; // 0:キャラ選択, 1:名前入力, 2:確認

  // --- 初期状態 ---
  logos.forEach(logo => Object.assign(logo.style,{
    position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
    zIndex:"9998", display:"none", opacity:0
  }));
  [titleImg1,titleImg2,pressKeyText,fullscreenEffect,backgroundOverlay,fadeOverlay].forEach(el=>{
    if(el){ el.style.display="none"; el.style.opacity=0; }
  });

  // --- フェード ---
  function fadeIn(el,duration=1000){
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
  function fadeOut(el,duration=1000){
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
      await showFullscreenEffect();
      await showTitleSequence();
      return;
    }
    const logo = logos[currentIndex];
    await fadeIn(logo,1000);
    await new Promise(r=>setTimeout(r,2000));
    await fadeOut(logo,1000);
    currentIndex++;
    showNextLogo();
  }

  // --- フルスクリーン演出 ---
  async function showFullscreenEffect(){
    if(!fullscreenEffect) return;
    if(effectSfx){ try{ effectSfx.currentTime=0; await effectSfx.play(); }catch{} }
    fullscreenEffect.style.display="block"; fullscreenEffect.style.opacity=0;
    fullscreenEffect.style.transform="translate(-50%,-50%) scale(2)";
    fullscreenEffect.style.transition="none";
    await new Promise(r=>requestAnimationFrame(r));
    fullscreenEffect.style.transition="opacity 2s ease, transform 2s ease";
    fullscreenEffect.style.opacity=1;
    fullscreenEffect.style.transform="translate(-50%,-50%) scale(1)";
    await new Promise(r=>setTimeout(r,2000));
    fullscreenEffect.style.opacity=0;
    await new Promise(r=>setTimeout(r,1000));
    fullscreenEffect.style.display="none";
  }

  // --- タイトル表示 ---
  async function showTitleSequence(){
    if(backgroundOverlay){
      backgroundOverlay.style.display="block";
      backgroundOverlay.style.opacity=0;
      backgroundOverlay.style.backgroundImage="url('images/press_bg.png')";
      backgroundOverlay.style.backgroundSize="cover";
      backgroundOverlay.style.backgroundPosition="center";
      await new Promise(r=>requestAnimationFrame(r));
      backgroundOverlay.style.transition="opacity 1.5s ease";
      backgroundOverlay.style.opacity=1;
    }
    if(bgm){ bgm.loop=true; bgm.volume=1; bgm.play(); }

    if(titleImg1){ await fadeIn(titleImg1,1000); await new Promise(r=>setTimeout(r,2000)); await fadeOut(titleImg1,1000); }
    if(titleImg2){ await fadeIn(titleImg2,1000); }
    if(pressKeyText){ pressKeyText.style.display="block"; requestAnimationFrame(()=>pressKeyText.style.opacity=1); }

    waitForPressKey();
  }

  // --- Press Any Key待機 ---
  function waitForPressKey(){
    async function onInput(){
      window.removeEventListener("keydown",onInput,true);
      window.removeEventListener("touchstart",onInput,true);
      if(pressKeyText) await fadeOut(pressKeyText,800);
      if(backgroundOverlay) await fadeOut(backgroundOverlay,1500);
      createMenu();
      attachMenuKeyboardListeners();
    }
    window.addEventListener("keydown",onInput,{capture:true});
    window.addEventListener("touchstart",onInput,{capture:true});
  }

  // --- センターテキストクリック開始 ---
  centerText.addEventListener("click",()=>{
    if(started) return;
    started=true;
    fadeOut(centerText,500).then(showNextLogo);
  });

  // --- メニュー ---
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
      item.addEventListener("click",()=>{ handleMenuSelect(i); });
      menuWrapper.appendChild(item);
    });
    document.body.appendChild(menuWrapper);
    isInputMode=true; selectedIndex=0; updateMenuSelection();
  }

  function handleMenuSelect(index){
    if(selectedIndex===index && isInputMode){
      if(menuItems[index]==="New Game"){ showHeroSelection(); }
      else { alert(`"${menuItems[index]}" はまだ未実装です`); }
    } else {
      selectedIndex=index; updateMenuSelection();
      if(selectSfx){ try{ selectSfx.currentTime=0; selectSfx.play(); }catch{} }
    }
  }

  function updateMenuSelection(){
    const items = menuWrapper.querySelectorAll("div");
    items.forEach((item,idx)=>{
      if(idx===selectedIndex){ item.style.backgroundColor="rgba(255,255,255,0.2)"; item.style.color="#ff0"; }
      else { item.style.backgroundColor="transparent"; item.style.color="#fff"; }
    });
  }

  function attachMenuKeyboardListeners(){
    window.addEventListener("keydown",(e)=>{
      if(!isInputMode) return;
      if(e.key==="ArrowUp"){ selectedIndex=(selectedIndex-1+menuItems.length)%menuItems.length; updateMenuSelection(); playSelect(); }
      else if(e.key==="ArrowDown"){ selectedIndex=(selectedIndex+1)%menuItems.length; updateMenuSelection(); playSelect(); }
      else if(e.key==="Enter" || e.key===" "){ handleMenuSelect(selectedIndex); }
    });
  }
  function playSelect(){ if(selectSfx){ try{ selectSfx.currentTime=0; selectSfx.play(); }catch{} } }

  // --- Hero選択 ---
  function showHeroSelection(){
    if(menuWrapper) menuWrapper.remove();
    step=0;
    renderHeroSelection();
  }

  function renderHeroSelection(){
    clearOverlay();
    const container=document.createElement("div");
    container.id="hero-select";
    Object.assign(container.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:10000,textAlign:"center",color:"#fff"});

    const title=document.createElement("div");
    title.textContent="Select Your Hero";
    title.style.marginBottom="20px";
    container.appendChild(title);

    characters.forEach((char,i)=>{
      const img=document.createElement("img");
      img.src=char.image;
      img.style.width="150px";
      img.style.margin="0 15px";
      img.style.cursor="pointer";
      img.addEventListener("click",()=>{ selectedCharacter=char; step=1; renderHeroSelection(); });
      container.appendChild(img);
    });

    if(step===1){
      const input=document.createElement("input");
      input.placeholder="Enter your name";
      input.style.marginTop="20px";
      container.appendChild(document.createElement("br"));
      container.appendChild(input);
      input.addEventListener("input",()=>{ playerName=input.value; });
      const btn=document.createElement("button");
      btn.textContent="Confirm";
      btn.style.marginTop="10px";
      btn.addEventListener("click",()=>{ step=2; renderHeroSelection(); });
      container.appendChild(document.createElement("br"));
      container.appendChild(btn);
    }

    if(step===2){
      const summary=document.createElement("div");
      summary.style.marginTop="20px";
      summary.textContent=`You selected ${selectedCharacter.name} as "${playerName}"`;
      container.appendChild(summary);
      const startBtn=document.createElement("button");
      startBtn.textContent="Start Game";
      startBtn.style.marginTop="10px";
      startBtn.addEventListener("click",startGame);
      container.appendChild(document.createElement("br"));
      container.appendChild(startBtn);
    }

    document.body.appendChild(container);
  }

  function clearOverlay(){
    const old=document.getElementById("hero-select");
    if(old) old.remove();
  }

  // --- ゲーム開始 ---
  async function startGame(){
    if(fadeOverlay){
      fadeOverlay.style.display="block";
      fadeOverlay.style.opacity=0;
      await new Promise(r=>requestAnimationFrame(r));
      fadeOverlay.style.transition="opacity 1.5s ease";
      fadeOverlay.style.opacity=1;
      await new Promise(r=>setTimeout(r,1600));
    }
    clearOverlay();
    if(titleImg1) titleImg1.remove();
    if(titleImg2) titleImg2.remove();
    if(pressKeyText) pressKeyText.remove();
    if(backgroundOverlay) backgroundOverlay.remove();
    if(menuWrapper) menuWrapper.remove();

    if(bgm){ bgm.pause(); bgm.currentTime=0; }
    if(bgmGame){ bgmGame.loop=true; bgmGame.volume=1; bgmGame.play(); }

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
