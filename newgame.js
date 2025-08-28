window.startNewGame = async function () {
  // --- 古いUI削除 ---
  document.getElementById("newgame-bg-div")?.remove();
  document.querySelectorAll(".popup")?.forEach(p => p.remove());
  document.querySelector("#title-img2")?.remove();

  // --- メニュー非表示 ---
  const menuWrapper = document.querySelector("div[data-menu-wrapper]");
  if (menuWrapper) menuWrapper.style.display = "none";

  // --- BGM ---
  const bgm = document.getElementById("bgm");
  if (bgm && !bgm.paused) {
    if (bgm._fadeOutInterval) clearInterval(bgm._fadeOutInterval);
    bgm.pause();
    bgm.currentTime = 0;
    bgm.volume = 1;
  }

  // --- 背景 ---
  const bgDiv = document.createElement("div");
  bgDiv.id = "newgame-bg-div";
  Object.assign(bgDiv.style, {
    position: "fixed", top: 0, left: 0,
    width: "100%", height: "100%",
    backgroundColor: "#001022",
    backgroundImage: "url('images/character_select_bg.png')",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    zIndex: 1,
    overflow: "hidden"
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
      width: "60px", height: "60px",
      pointerEvents: "none",
      transform: `rotate(${Math.random()*360}deg)`,
      zIndex: 2
    });
    bgDiv.appendChild(snow);
    snowflakes.push({
      el: snow,
      speed: Math.random()*2 +1,
      drift: (Math.random()-0.5)*1,
      rotationSpeed: (Math.random()-0.5)*2
    });
  }

  let snowRAF = null;
  function animateSnow() {
    for (let flake of snowflakes) {
      let top = parseFloat(flake.el.style.top);
      let left = parseFloat(flake.el.style.left);
      let rot = parseFloat(flake.el.style.transform.replace(/[^-?\d.]/g,"")) || 0;
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
    snowRAF = requestAnimationFrame(animateSnow);
  }
  animateSnow();

  // --- 新規BGM ---
  if (bgm) {
    bgm.src = "Sounds/newgame_bgm.mp3";
    bgm.loop = true;
    bgm.volume = 1;
    bgm.play().catch(()=>{});
  }

  // --- 飛ぶ/戻る音 ---
  const flyOutSound = new Audio("Sounds/fly_out.mp3");
  const flyInSound = new Audio("Sounds/fly_in.mp3");

  // --- キャラクターUI ---
  const telop = document.createElement("div");
  telop.id = "telop";
  Object.assign(telop.style, {
    position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
    backgroundColor:"rgba(0,0,0,0.7)", padding:"20px 40px", borderRadius:"10px",
    color:"#fff", fontSize:"28px", fontWeight:"bold", textAlign:"center", zIndex:2200,
    pointerEvents:"auto"
  });
  telop.textContent = "鶏の餌食を選択してください";
  bgDiv.appendChild(telop);

  const modalDim = document.createElement("div");
  Object.assign(modalDim.style,{
    position:"fixed", top:"0", left:"0", width:"100%", height:"100%",
    backgroundColor:"rgba(0,0,0,0.45)", zIndex:2100, cursor:"pointer"
  });
  bgDiv.appendChild(modalDim);

  const characterUI = document.createElement("div");
  characterUI.id = "character-ui-wrapper";
  Object.assign(characterUI.style,{
    position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
    zIndex:2000, display:"flex", gap:"60px", pointerEvents:"auto", visibility:"hidden"
  });
  bgDiv.appendChild(characterUI);

  modalDim.addEventListener("click", ()=>{
    modalDim.remove();
    telop.remove();
    characterUI.style.visibility="visible";
  });

  // --- キャラクター選択 ---
  const characters = [
    {name:"犬", img:"images/hero1.png"},
    {name:"うんこ", img:"images/hero2.png"}
  ];

  const wrappers = [], imgs = [], auras = [];
  let selectedIndex = null, rotatingImg = null, rotationRAF = null;

  function startRotation(img){
    stopRotation();
    rotatingImg = img;
    let rotateAngle = 0;
    const step = () => {
      rotateAngle += 2;
      if(rotateAngle >= 360) rotateAngle -= 360;
      rotatingImg.style.transform = `rotateY(${rotateAngle}deg) scale(1.2)`;
      rotationRAF = requestAnimationFrame(step);
    };
    rotationRAF = requestAnimationFrame(step);
  }

  function stopRotation(){
    if(rotationRAF) cancelAnimationFrame(rotationRAF);
    rotationRAF = null;
    if(rotatingImg){
      rotatingImg.style.transition = "transform 0.3s ease";
      rotatingImg.style.transform = "rotateY(0deg) scale(1)";
      rotatingImg = null;
    }
  }

  function flyOut(otherIndex, selectedIdx){
    const w = wrappers[otherIndex];
    if(!w) return;
    const dir = selectedIdx === 0 ? 1 : -1;
    const dist = window.innerWidth + 400;
    w.style.transition = "transform 0.7s cubic-bezier(.2,.7,.2,1), opacity 0.7s ease";
    w.style.transform = `translateX(${dir*dist}px)`;
    w.style.opacity="0";
    w.dataset.offscreen="1";
    flyOutSound.currentTime=0;
    flyOutSound.play().catch(()=>{});
  }

  function flyIn(index){
    const w = wrappers[index];
    if(!w) return;
    w.style.transition = "transform 0.6s cubic-bezier(.2,.7,.2,1), opacity 0.4s ease";
    w.style.transform = "translateX(0)";
    w.style.opacity="1";
    w.dataset.offscreen="0";
    flyInSound.currentTime=0;
    flyInSound.play().catch(()=>{});
  }

  characters.forEach((c,i)=>{
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style,{
      display:"flex", flexDirection:"column", alignItems:"center",
      cursor:"pointer", perspective:"600px", position:"relative",
      transition:"transform 0.6s ease, opacity 0.6s ease"
    });

    const aura = document.createElement("div");
    Object.assign(aura.style,{
      position:"absolute", top:"50%", left:"50%",
      width:"220px", height:"320px",
      transform:"translate(-50%,-50%) scale(1)",
      borderRadius:"50%",
      background:"radial-gradient(circle, rgba(0,255,255,0.6), rgba(0,255,255,0))",
      filter:"blur(20px)", opacity:0,
      transition:"opacity 0.3s ease, transform 0.3s ease",
      zIndex:0
    });
    wrapper.appendChild(aura);

    const img = document.createElement("img");
    img.src = c.img;
    Object.assign(img.style,{
      width:"200px", height:"300px", objectFit:"contain",
      border:"4px solid transparent", borderRadius:"12px",
      transition:"opacity 0.3s ease, border-color 0.3s ease",
      zIndex:1, backfaceVisibility:"visible", transformStyle:"preserve-3d",
      willChange:"transform"
    });
    wrapper.appendChild(img);

    const nameLabel = document.createElement("div");
    nameLabel.textContent = c.name;
    Object.assign(nameLabel.style,{
      marginTop:"10px", fontSize:"24px", fontWeight:"bold",
      color:"#fff", textShadow:"2px 2px 4px black"
    });
    wrapper.appendChild(nameLabel);

    characterUI.appendChild(wrapper);
    wrappers[i]=wrapper;
    imgs[i]=img;
    auras[i]=aura;

    wrapper.addEventListener("click", ()=>{
      // 選択音
      if(i===0) new Audio("Sounds/select_hero1.mp3").play().catch(()=>{});
      if(i===1) new Audio("Sounds/select_hero2.mp3").play().catch(()=>{});

      if(selectedIndex===i){
        alert(`主人公「${c.name}」で決定`);
        return;
      }
      if(selectedIndex!==null){
        auras[selectedIndex].style.opacity=0;
        stopRotation();
        imgs[selectedIndex].style.transform="rotateY(0deg) scale(1)";
        flyIn(selectedIndex);
      }
      selectedIndex=i;
      auras[i].style.opacity=1;
      startRotation(imgs[i]);
      flyOut(selectedIndex===0?1:0, selectedIndex);
      telop.textContent="もう一度クリックで決定。";
    });
  });

  // --- ポップアップ ---
  const popupMedia=[
    {type:"img", src:"images/popup1.gif"},
    {type:"img", src:"images/popup2.gif"},
    {type:"video", src:"videos/popup1.mp4"},
    {type:"video", src:"videos/popup2.mp4"},
    {type:"video", src:"videos/popup3.mp4"}
  ];
  const popupSound=new Audio("Sounds/popup.mp3");
  const popupCloseSound=new Audio("Sounds/popup_x.mp3");
  const activePopups=[];

  function createPopup(){
    if(activePopups.length>=50) return;
    const selected=popupMedia[Math.floor(Math.random()*popupMedia.length)];
    const popup=document.createElement("div");
    popup.className="popup";
    const w=window.innerWidth<768?300:400;
    const h=window.innerWidth<768?250:300;
    Object.assign(popup.style,{
      position:"fixed", width:w+"px", height:h+"px",
      zIndex:1800,
      overflow:"hidden",
      pointerEvents:"auto",
      opacity:1
    });

    let mediaEl;
    if(selected.type === "img") {
      mediaEl = document.createElement("img");
      mediaEl.src = selected.src;
      Object.assign(mediaEl.style, { width:"100%", height:"100%", objectFit:"contain" });
    } else {
      mediaEl = document.createElement("video");
      mediaEl.src = selected.src;
      mediaEl.autoplay = true;
      mediaEl.loop = true;
      mediaEl.muted = false;
      Object.assign(mediaEl.style, { width:"100%", height:"100%", objectFit:"contain" });
      mediaEl.play().catch(()=>{});
    }
    popup.appendChild(mediaEl);

    const closeBtn = document.createElement("div");
    closeBtn.textContent = "×";
    Object.assign(closeBtn.style, {
      position: "absolute", top: "5px", right: "10px",
      fontSize: "24px", fontWeight: "bold", color: "#fff",
      cursor: "pointer", zIndex: 2000, userSelect: "none"
    });
    closeBtn.addEventListener("click", () => {
      popup.remove();
      const idx = activePopups.indexOf(popup);
      if(idx >= 0) activePopups.splice(idx, 1);
      popupCloseSound.play().catch(()=>{});
    });
    popup.appendChild(closeBtn);

    const margin = 20;
    popup.style.left = Math.random() * (window.innerWidth - w - margin*2) + margin + "px";
    popup.style.top  = Math.random() * (window.innerHeight - h - margin*2) + margin + "px";

    document.body.appendChild(popup);
    activePopups.push(popup);
    popupSound.currentTime = 0;
    popupSound.play().catch(()=>{});
  }

  // ポップアップを5秒ごとに生成
  setInterval(createPopup, 5000);

  // --- メニュー戻る用のダミーボタン ---
  const fakeBtn = document.createElement("button");
  fakeBtn.textContent = "メニューに戻る";
  Object.assign(fakeBtn.style, {
    position:"fixed", bottom:"30px", right:"30px", zIndex:2500,
    padding:"15px 25px", fontSize:"18px", cursor:"pointer"
  });
  fakeBtn.addEventListener("click", ()=>{
    alert("…戻れません！");
  });
  bgDiv.appendChild(fakeBtn);

  // --- リサイズ対応 ---
  window.addEventListener("resize", ()=>{
    snowflakes.forEach(f=>{
      f.el.style.top = Math.min(parseFloat(f.el.style.top), window.innerHeight) + "px";
      f.el.style.left = Math.min(parseFloat(f.el.style.left), window.innerWidth) + "px";
    });
  });

};
