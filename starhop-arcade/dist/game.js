"use strict";

const byId = id => document.getElementById(id);
const canvas=byId("game");
const ctx=canvas.getContext("2d");
const ui=Object.fromEntries([
  "cabinet","screen","zone","worldName","status","pause","hud","stars","hearts","bossHud","bossPhase","bossFill","toast",
  "overlay","eyebrow","overlayTitle","overlayText","primary","primaryText","secondary","touch","stageTag",
  "progressText","progressFill","levelList","sound","fullscreen"
].map(id=>[id,byId(id)]));

const storage = {
  get(key) {
    try { return localStorage.getItem("starhop."+key); } catch { return null; }
  },
  set(key,value) {
    try { localStorage.setItem("starhop."+key,value); } catch {}
  }
};
let record = { unlocked:0, cleared:[] };
try {
  const saved=JSON.parse(storage.get("progress"));
  if (saved && Array.isArray(saved.cleared)) {
    record = {
      unlocked:clamp(parseInt(saved.unlocked,10)||0,0,7),
      cleared:[...new Set(saved.cleared.filter(i=>Number.isInteger(i)&&i>=0&&i<8))]
    };
  }
} catch {}
let muted = storage.get("muted")==="true";
let audioContext;
function sound(name) {
  if (muted || !window.AudioContext) return;
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state==="suspended") audioContext.resume().catch(()=>{});
    const notes={ jump:[345,560], land:[168,105], collect:[660,910], shot:[390,266], beat:[510], hurt:[198,94], hit:[274,460], save:[440,660,825], clear:[392,523,659,784] };
    const melody=notes[name];
    const quick=name==="shot" || name==="beat";
    const length=quick?.036:.082;
    for (const [i,note] of melody.entries()) {
      const osc=audioContext.createOscillator(), volume=audioContext.createGain();
      const start=audioContext.currentTime+i*length*.83;
      osc.type=name==="hurt"?"triangle":"square";
      osc.frequency.value=note;
      volume.gain.setValueAtTime(quick?.018:.045,start);
      volume.gain.exponentialRampToValueAtTime(.001,start+length);
      osc.connect(volume).connect(audioContext.destination);
      osc.start(start);
      osc.stop(start+length);
    }
  } catch {}
}
function refreshSound() {
  const label=muted?"开启声音":"静音";
  ui.sound.innerHTML=icon(muted?"muted":"volume");
  ui.sound.setAttribute("aria-label",label);
  ui.sound.setAttribute("aria-pressed",String(muted));
  ui.sound.title=label;
}
ui.sound.onclick=()=>{
  muted=!muted;
  storage.set("muted",String(muted));
  refreshSound();
  if (!muted) sound("collect");
};
ui.fullscreen.onclick=async ()=>{
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (ui.cabinet.requestFullscreen) await ui.cabinet.requestFullscreen();
    else showToast("此浏览器暂不支持全屏");
  } catch { showToast("此浏览器暂不支持全屏"); }
};
ui.pause.onclick=togglePause;

const bossImage=new Image();
let enragedBossImage;
bossImage.addEventListener("load",()=>{
  enragedBossImage=document.createElement("canvas");
  enragedBossImage.width=bossImage.naturalWidth;
  enragedBossImage.height=bossImage.naturalHeight;
  const texture=enragedBossImage.getContext("2d");
  texture.drawImage(bossImage,0,0);
  texture.globalCompositeOperation="source-atop";
  texture.fillStyle="#f2254ab3";
  texture.fillRect(0,0,enragedBossImage.width,enragedBossImage.height);
});
bossImage.src="./boss.webp";
const keys=new Set();
let pointer=null, firing=false;
let selected=0, mode="title", scene, player, tick=0, age=0, camera=0;
let particles=[], shots=[], orbs=[], collected=0, checkpoint=null, stageCollected=new Set();
let jumpQueue=0, toastUntil=0, primaryAction, secondaryAction, resumeAfterPause="play";

const colors=[
  ["#3b2f4f","#665079","#e4bdff"],["#233e3f","#44645d","#a9dab1"],["#352957","#624d82","#c7aaff"],
  ["#3f3557","#6a5d85","#d4c7ff"],["#482d44","#79475e","#ffc2a1"],["#2e3a57","#53668a","#c7e5fb"],
  ["#372a54","#644c82","#d9baf5"],["#4b294a","#8d507b","#ffabd7"]
];
function renderMap() {
  ui.progressText.textContent=record.cleared.length+" / 8";
  ui.progressFill.style.width=record.cleared.length/8*100+"%";
  ui.levelList.replaceChildren();
  stages.forEach((stage,index)=>{
    const active=selected===index;
    const complete=record.cleared.includes(index);
    const available=index<=record.unlocked;
    const li=document.createElement("li");
    const button=document.createElement("button");
    button.type="button";
    button.className=["level",active?"active":"",complete?"done":"",index===7?"final":""].filter(Boolean).join(" ");
    button.disabled=!available;
    if (active) button.setAttribute("aria-current","step");
    button.setAttribute("aria-label","第"+(index+1)+"关 "+stage.name+(complete?"，已完成":available?"":"，未解锁"));
    const [shade,outline,ink]=colors[index];
    button.style.setProperty("--swatch",shade);
    button.style.setProperty("--swatch-border",outline);
    button.style.setProperty("--swatch-ink",ink);
    button.innerHTML='<span class="level-icon">'+pixelIcon(stage)+'</span><span class="level-text"><strong>'+stage.name+'</strong><small>'+String(index+1).padStart(2,"0")+" · "+stage.en+'</small></span><span class="level-status">'+icon(complete?"check":active||available?"play":"lock")+'</span>';
    button.onclick=()=>{
      if (mode==="title" && selected===index) startStage(index);
      else if (selected!==index || !["play","rhythm"].includes(mode)) setupTitle(index);
      else canvas.focus();
    };
    li.append(button);
    ui.levelList.append(li);
  });
  ui.zone.textContent=String(selected+1).padStart(2,"0");
  ui.worldName.textContent=stages[selected].name;
}

function buildScene(index) {
  const stage=stages[index];
  const ground=stage.terrain.map(([x,y,w])=>({x,y,w,h:H+65-y,ground:true,oldX:x,oldY:y}));
  const ledges=stage.ledges.map(([x,y,w,axis,range],i)=>({x,y,w,h:24,baseX:x,baseY:y,oldX:x,oldY:y,axis,range,phase:i*.85}));
  const hazards=stage.spikes.map(([x,y,w])=>({x,y:y-15,w,h:15}));
  const enemies=stage.enemies.map((x,i)=>{
    const home=ground.find(g=>x>=g.x && x+26<=g.x+g.w);
    return { x,y:home.y-22,w:26,h:22,min:Math.max(home.x+8,x-54),max:Math.min(home.x+home.w-34,x+67),dir:i%2?-1:1,alive:true };
  });
  const gems=[];
  for (const g of ground) {
    for (let x=g.x+125;x<g.x+g.w-32;x+=54) {
      if (!hazards.some(s=>x>s.x-13 && x<s.x+s.w+13)) gems.push({x,y:g.y-30});
    }
  }
  for (const ledge of ledges) {
    [18,43,68].filter(x=>x<ledge.w-8).forEach(dx=>gems.push({ledge,dx}));
  }
  const end=ground.at(-1);
  const boss=index===7?{x:626,y:295,hp:27,max:27,phase:1,cycle:0,frame:0,flash:0,rageAt:null,rageCycle:0}:null;
  const bridge=stage.bridge?{...stage.bridge,open:false,lowering:null,rhythm:null}:null;
  const floodgate=stage.floodgate?{...stage.floodgate,key:false,countdown:null}:null;
  const traps=createTraps(stage);
  moveTraps(traps,0);
  return {
    stage,ground,ledges,solids:[...ground,...ledges],hazards,traps,enemies,gems,width:end.x+end.w,
    gate:boss||floodgate?null:{x:end.x+end.w-115,y:end.y},boss,bridge,floodgate,dive:null
  };
}

function newPlayer(x,y,max) {
  return { x,y:y-32,w:20,h:32,vx:0,vy:0,dir:1,hp:max,max,inv:0,coyote:0,on:null,cooldown:0 };
}
function clearInput() {
  keys.clear();
  firing=false;
  pointer=null;
  jumpQueue=0;
}
function showToast(text,frames=150) {
  ui.toast.textContent=text;
  ui.toast.hidden=false;
  toastUntil=tick+frames;
}
function configureOverlay(opts) {
  ui.overlay.hidden=false;
  ui.overlay.classList.toggle("title-overlay",mode==="title");
  ui.eyebrow.innerHTML=icon("star")+"<span>"+opts.tag+"</span>";
  if (opts.title==="星跃冒险") ui.overlayTitle.innerHTML="星跃<span>冒险</span>";
  else ui.overlayTitle.textContent=opts.title;
  ui.overlayText.textContent=opts.text;
  ui.primaryText.textContent=opts.button;
  ui.secondary.hidden=!opts.alt;
  ui.secondary.textContent=opts.alt||"";
  primaryAction=opts.action;
  secondaryAction=opts.altAction;
}
ui.primary.onclick=()=>primaryAction?.();
ui.secondary.onclick=()=>secondaryAction?.();
function syncState(label) {
  ui.status.textContent=label;
  ui.screen.classList.toggle("playing",mode==="play");
  ui.pause.hidden=mode!=="play" && mode!=="pause";
  ui.pause.setAttribute("aria-label",mode==="pause"?"继续":"暂停");
  ui.pause.innerHTML=icon(mode==="pause"?"play":"pause");
  ui.touch.hidden=mode!=="play";
  ui.hud.hidden=mode==="title";
  ui.bossHud.hidden=mode==="title" || !scene.boss;
  ui.stageTag.innerHTML=selected===7?"终幕 <i></i> 弹幕对决":"横版冒险 <i></i> 08 关卡";
  updateChallengeHud();
}
function setupTitle(index=0) {
  selected=index;
  mode="title";
  scene=buildScene(index);
  player=newPlayer(index===0?295:67,scene.ground[0].y,3);
  age=camera=collected=0;
  particles=[]; shots=[]; orbs=[];
  stageCollected=new Set();
  ui.toast.hidden=true;
  clearInput();
  renderMap();
  syncState("待机");
  configureOverlay({
    tag:index===0?"STARHOP ARCADE":stages[index].en,
    title:index===0?"星跃冒险":index===7?"星铃守卫":stages[index].name,
    text:index===0?"穿越七片星野，迎战最后的弹幕守卫。":stages[index].hint,
    button:index===0?"开始冒险":index===7?"挑战守卫":"进入关卡",
    action:()=>startStage(index)
  });
}
function startStage(index,respawn=null,bridgeOpen=false) {
  selected=index;
  mode="play";
  scene=buildScene(index);
  if (!respawn) {
    stageCollected=new Set();
    collected=0;
  }
  checkpoint=respawn;
  if (bridgeOpen) openBridge(scene);
  player=newPlayer(respawn?.[0]??70,respawn?.[1]??scene.ground[0].y,scene.boss?5:3);
  if (respawn) player.inv=52;
  age=0;
  camera=clamp(player.x-240,0,scene.width-W);
  shots=[]; orbs=[]; particles=[];
  clearInput();
  renderMap();
  syncState("进行中");
  refreshHud();
  ui.overlay.hidden=true;
  canvas.focus({preventScroll:true});
  showToast(respawn?"从检查点继续":scene.stage.hint,170);
  sound("save");
}
function togglePause() {
  if (mode==="play") {
    resumeAfterPause=mode;
    mode="pause";
    clearInput();
    syncState("已暂停");
    configureOverlay({tag:"PAUSED",title:"暂停",text:"准备好后继续冒险。",button:"继续游戏",action:togglePause,alt:"返回标题",altAction:()=>setupTitle(selected)});
    ui.primary.focus({preventScroll:true});
  } else if (mode==="pause") {
    mode=resumeAfterPause;
    syncState("进行中");
    ui.overlay.hidden=true;
    canvas.focus({preventScroll:true});
  }
}
function finishLevel(advance=false) {
  const last=selected===7;
  mode=last?"victory":"clear";
  ui.toast.hidden=true;
  clearInput();
  if (!record.cleared.includes(selected)) record.cleared.push(selected);
  record.unlocked=Math.max(record.unlocked,Math.min(7,selected+1));
  storage.set("progress",JSON.stringify(record));
  if (advance) { startStage(selected+1); return; }
  renderMap();
  syncState(last?"冒险完成":"关卡完成");
  sound("clear");
  configureOverlay({
    tag:last?"ADVENTURE COMPLETE":"STAGE CLEAR",
    title:last?"你真棒":"关卡通过",
    text:last?"七片星野与最终守卫，全数通过！":"本关收集了 "+collected+" 枚星砂。",
    button:last?"再玩一次":"下一关",
    action:()=>startStage(last?0:selected+1),
    alt:"返回标题",altAction:()=>setupTitle(0)
  });
  ui.primary.focus({preventScroll:true});
}
function fail(reason) {
  mode="fail";
  ui.toast.hidden=true;
  clearInput();
  refreshHud();
  syncState("挑战中断");
  configureOverlay({
    tag:"TRY AGAIN",title:"再试一次",
    text:reason??(checkpoint?"检查点已点亮，可以从那里继续。":"准备好，再出发！"),
    button:checkpoint?"从检查点重试":"重试本关",action:()=>startStage(selected,checkpoint,scene.bridge?.open),
    alt:"返回标题",altAction:()=>setupTitle(selected)
  });
  ui.primary.focus({preventScroll:true});
}
function refreshHud() {
  ui.hearts.innerHTML=Array.from({length:player.max},(_,i)=>'<svg'+(i>=player.hp?' class="lost"':'')+' aria-hidden="true"><use href="#i-heart"/></svg>').join("");
  ui.hearts.setAttribute("aria-label","生命 "+player.hp+" / "+player.max);
  ui.stars.textContent=String(collected).padStart(2,"0");
  const b=scene.boss;
  ui.bossHud.classList.toggle("rage",b?.phase===3);
  if (b) {
    ui.bossFill.style.width=b.hp/b.max*100+"%";
    ui.bossPhase.textContent=["Ⅰ","Ⅱ","Ⅲ 红温"][b.phase-1]+" · "+(b.frame>=213?"可攻击":"护盾开启");
  }
}
function burst(x,y,color,count=9) {
  for (let i=0;i<count;i++) {
    const a=i/count*Math.PI*2+Math.random()*.35;
    const speed=1.1+Math.random()*2.7;
    particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-.5,life:16+Math.random()*16,color});
  }
}
function hit(away,damage=1) {
  if (player.inv || mode!=="play") return;
  player.hp=Math.max(0,player.hp-damage);
  player.inv=83;
  player.vx=away*5.4;
  player.vy=-6.8;
  player.on=null;
  sound("hurt");
  burst(player.x+10,player.y+12,"#ff97c3");
  refreshHud();
  if (player.hp<=0) fail();
}
function fire() {
  if (player.cooldown>0) return;
  const x=player.x+10, y=player.y+14;
  const target=pointer
    ? {x:pointer.x+camera,y:pointer.y}
    : scene.boss && keys.has("Attack")
      ? {x:scene.boss.x,y:scene.boss.y-30}
      : {x:x+player.dir*100,y};
  const dx=target.x-x, dy=target.y-y;
  const mag=Math.hypot(dx,dy)||1;
  shots.push({x,y,vx:dx/mag*10.8,vy:dy/mag*10.8,life:80});
  player.cooldown=9;
  if (Math.abs(dx)>3) player.dir=Math.sign(dx);
  sound("shot");
}
function aimEvent(event) {
  const box=canvas.getBoundingClientRect();
  pointer={x:(event.clientX-box.left)*W/box.width,y:(event.clientY-box.top)*H/box.height};
}
canvas.addEventListener("pointermove",event=>{ if (event.pointerType!=="touch") aimEvent(event); });
canvas.addEventListener("pointerdown",event=>{
  if (event.button!==0 || event.pointerType==="touch" || mode!=="play" || scene.dive || scene.floodgate?.key) return;
  event.preventDefault();
  aimEvent(event);
  firing=true;
  fire();
});
window.addEventListener("pointerup",()=>{firing=false;});
window.addEventListener("pointercancel",()=>{firing=false;});
window.addEventListener("blur",()=>{
  if (mode==="rhythm") endRhythm(false);
  else if (mode==="play") togglePause();
  else clearInput();
});
const movementKeys=new Set(["KeyA","KeyD","ArrowLeft","ArrowRight","Space","KeyJ"]);
window.addEventListener("keydown",event=>{
  if (mode==="rhythm") {
    if (event.code==="Escape" || event.code==="KeyE") {
      event.preventDefault();
      if (!event.repeat) endRhythm(false);
    } else if (event.code.startsWith("Arrow")) {
      event.preventDefault();
      if (!event.repeat) judgeRhythm(event.code);
    }
    return;
  }
  if (event.code==="Escape" && (mode==="play" || mode==="pause")) {
    event.preventDefault();
    if (!event.repeat) togglePause();
    return;
  }
  if (mode!=="play") return;
  if (event.code==="KeyE") {
    event.preventDefault();
    if (!event.repeat) useInteraction();
    return;
  }
  if (!movementKeys.has(event.code) && !(scene.dive && swimKeys.has(event.code))) return;
  if (document.activeElement?.tagName==="BUTTON" && event.code==="Space") return;
  event.preventDefault();
  keys.add(event.code);
  if (event.code==="Space" && !event.repeat) jumpQueue=9;
});
window.addEventListener("keyup",event=>keys.delete(event.code));
for (const button of ui.touch.querySelectorAll("button")) {
  const key=button.dataset.key;
  button.addEventListener("pointerdown",event=>{
    if (mode!=="play") return;
    event.preventDefault();
    if (key==="KeyE") { useInteraction(); return; }
    button.setPointerCapture(event.pointerId);
    keys.add(key);
    if (key==="Space") jumpQueue=9;
    if (key==="Attack") { pointer=null; fire(); }
  });
  for (const type of ["pointerup","pointercancel","lostpointercapture"]) button.addEventListener(type,()=>keys.delete(key));
}

function updatePlayer() {
  const p=player;
  if (p.inv>0) p.inv--;
  if (p.cooldown>0) p.cooldown--;
  const left=keys.has("KeyA") || keys.has("ArrowLeft");
  const right=keys.has("KeyD") || keys.has("ArrowRight");
  const input=Number(right)-Number(left);
  const icy=selected===5 && p.on?.ground;
  if (input) p.dir=input;
  p.vx=input ? clamp(p.vx+input*(icy?.44:.85),-4.65,4.65) : p.vx*(icy?.963:.78);
  if (p.on) {
    p.x+=p.on.x-p.on.oldX;
    p.y+=p.on.y-p.on.oldY;
    p.coyote=7;
  } else {
    p.coyote=Math.max(0,p.coyote-1);
  }
  if (jumpQueue>0 && p.coyote>0) {
    p.vy=-12.55;
    p.coyote=0;
    p.on=null;
    jumpQueue=0;
    sound("jump");
    burst(p.x+10,p.y+32,"#e4bad3",5);
  } else if (jumpQueue>0) jumpQueue--;

  p.x=clamp(p.x+p.vx,0,scene.width-p.w);
  const lock=scene.floodgate;
  if (lock && !lock.key && p.x+p.w>lock.x-24) {
    p.x=lock.x-24-p.w;
    p.vx=0;
  }
  for (const s of scene.solids) {
    if (!s.ground || !overlap(p,s)) continue;
    if (p.vx>0) p.x=s.x-p.w;
    else if (p.vx<0) p.x=s.x+s.w;
    p.vx=0;
  }
  p.vy=Math.min(15,p.vy+.58);
  const prevBottom=p.y+p.h, prevY=p.y;
  p.y+=p.vy;
  p.on=null;
  if (p.vy>=0) {
    let landing=null;
    for (const s of scene.solids) {
      if (p.x+p.w<=s.x+1 || p.x>=s.x+s.w-1 || prevBottom>Math.max(s.y,s.oldY)+1 || p.y+p.h<s.y) continue;
      if (!landing || s.y<landing.y) landing=s;
    }
    if (landing) {
      if (p.vy>8.5) burst(p.x+10,landing.y,"#ead1d3",5);
      p.y=landing.y-p.h;
      p.vy=0;
      p.on=landing;
    }
  } else {
    for (const s of scene.ground) {
      if (p.x<s.x+s.w && p.x+p.w>s.x && prevY>=s.y+s.h && p.y<s.y+s.h) {
        p.y=s.y+s.h;
        p.vy=0;
      }
    }
  }
  if (p.y>H+60) {
    p.hp=0;
    fail();
    return;
  }
  if (firing || keys.has("Attack") || keys.has("KeyJ")) fire();
}

function gemPosition(g) {
  return g.ledge?{x:g.ledge.x+g.dx,y:g.ledge.y-24}:g;
}
function updateLevel() {
  const p=player;
  for (const h of [...scene.hazards,...scene.traps]) {
    if (h.h>0 && overlap(p,h)) hit(Math.sign(p.x+10-h.x-h.w/2)||-1);
  }
  for (const e of scene.enemies) {
    if (!e.alive) continue;
    e.x+=e.dir*(1+selected*.06);
    if (e.x<e.min || e.x>e.max) { e.x=clamp(e.x,e.min,e.max); e.dir*=-1; }
    if (!overlap(p,e)) continue;
    if (p.vy>1 && p.y+p.h-e.y<15) {
      e.alive=false;
      p.vy=-7.3;
      burst(e.x+13,e.y+8,"#ffb6cf");
      sound("hit");
    } else hit(Math.sign(p.x-e.x)||-1);
  }
  if (mode!=="play") return;
  const save=scene.bridge?.open && p.x>scene.bridge.x+scene.bridge.w?scene.bridge.after:scene.stage.checkpoint;
  if (save && (!checkpoint || save[0]>checkpoint[0]) && Math.abs(p.x+10-save[0])<32 && p.y+p.h>save[1]-110) {
    checkpoint=save;
    p.hp=p.max;
    refreshHud();
    showToast("检查点 · 生命恢复");
    sound("save");
    burst(save[0],save[1]-32,"#dffb8f",18);
  }
  scene.gems.forEach((gem,i)=>{
    if (stageCollected.has(i)) return;
    const {x,y}=gemPosition(gem);
    if (x>p.x-10 && x<p.x+p.w+10 && y>p.y-10 && y<p.y+p.h+7) {
      stageCollected.add(i);
      collected++;
      burst(x,y,"#ffe1a0",5);
      sound("collect");
      refreshHud();
    }
  });
  if (scene.gate && Math.abs(p.x+10-scene.gate.x)<24 && p.y+p.h>scene.gate.y-67) finishLevel();
}

function spawnOrb(x,y,vx,vy,r,color,kind="",life=280) {
  const damage=scene.boss.phase===3?2:1;
  orbs.push({x,y,vx,vy,r,color:damage===2?"#ff5272":color,kind,life,damage});
}
function ball(x,y,angle,speed,r,color,kind="") {
  spawnOrb(x,y,Math.cos(angle)*speed,Math.sin(angle)*speed,r,color,kind);
}
function beginBossRage(b) {
  b.phase=3;
  b.frame=0;
  b.rageAt=age+1;
  b.rageCycle=b.cycle+1;
  orbs=[];
  burst(b.x,b.y-38,"#ff4368",32);
  sound("hurt");
  showToast("第三阶段 · 红温！弹幕伤害翻倍",150);
}
function updateBoss() {
  const b=scene.boss, p=player;
  b.x=626+Math.sin(age*.022)*18;
  b.y=292+Math.sin(age*.045)*12;
  const elapsed=b.rageAt===null?age-1:Math.max(0,age-b.rageAt);
  b.frame=elapsed%367;
  b.cycle=b.rageCycle+Math.floor(elapsed/367);
  if (b.flash>0) b.flash--;
  const f=b.frame, pattern=(b.cycle+b.phase-1)%3;
  const enteringRage=b.rageAt!==null && b.cycle===b.rageCycle;
  if (f===(enteringRage?26:1)) {
    const telegraph=["扇形弹幕 · 留意弹道间隙","星雨 · 避开地面标记","贴地星浪 · 跳起来"][pattern];
    showToast(enteringRage?"红温 · "+telegraph:telegraph,77);
  }
  if (f===213) { showToast("护盾消失 · 反击！",120); sound("save"); }
  if (f===1 || f===213 || f===0) refreshHud();

  if (pattern===0 && f>=52 && f<=174 && (f-52)%(b.phase===1?38:30)===0) {
    const theta=Math.atan2(p.y+12-(b.y-30),p.x+10-(b.x-35));
    for (let i=-2;i<=2;i++) ball(b.x-36,b.y-30,theta+i*.24,3.1+b.phase*.45,7,"#ff99c9");
  }
  if (pattern===1 && f>=48 && f<=180 && (f-48)%22===0) {
    const lane=(Math.floor((f-48)/22)*3+b.cycle)%8;
    [46+lane*87,46+(lane+4)%8*87].forEach(x=>{
      spawnOrb(x,-12,0,5.4+b.phase*.43,7,"#ffb68d","rain",135);
    });
  }
  if (pattern===2 && f>=57 && f<=178 && (f-57)%25===0) {
    ball(b.x-34,392,Math.PI,5.15+b.phase*.3,10,"#ff8bcb","wave");
    if (b.phase>1) ball(b.x-34,354,Math.PI,3.35,7,"#c6afff");
  }
  const body={x:b.x-46,y:b.y-80,w:92,h:98};
  if (overlap(p,body)) hit(Math.sign(p.x-b.x)||-1);

  for (const o of orbs) {
    o.x+=o.vx; o.y+=o.vy; o.life--;
    const nx=clamp(o.x,p.x,p.x+p.w), ny=clamp(o.y,p.y,p.y+p.h);
    if (Math.hypot(nx-o.x,ny-o.y)<o.r) {
      o.life=0;
      hit(Math.sign(p.x+10-o.x)||-1,o.damage);
    }
  }
  orbs=orbs.filter(o=>o.life>0 && o.x>-40 && o.x<W+40 && o.y<H+22);
}

function updateShots() {
  const b=scene.boss;
  for (const s of shots) {
    s.x+=s.vx; s.y+=s.vy; s.life--;
    const box={x:s.x-5,y:s.y-3,w:10,h:6};
    for (const e of scene.enemies) {
      if (!e.alive || !overlap(box,e)) continue;
      e.alive=false;
      s.life=0;
      burst(e.x+13,e.y+8,"#fdb9cf");
      sound("hit");
      break;
    }
    if (b && s.life>0 && overlap(box,{x:b.x-65,y:b.y-101,w:130,h:139})) {
      s.life=0;
      if (b.frame>=213) {
        b.hp--;
        b.flash=5;
        if (b.hp===18) b.phase=2;
        if (b.hp===9 && b.rageAt===null) beginBossRage(b);
        burst(s.x,s.y,"#ffc0db",5);
        refreshHud();
        sound("hit");
        if (b.hp<=0) { finishLevel(); return; }
      } else burst(s.x,s.y,"#bbabff",3);
    }
    if (scene.ground.some(g=>overlap(box,g))) s.life=0;
  }
  shots=shots.filter(s=>s.life>0 && s.x>-32 && s.x<scene.width+32 && s.y>-32 && s.y<H+32);
}

function step() {
  tick++;
  if (toastUntil<=tick) ui.toast.hidden=true;
  if (mode==="rhythm") { updateRhythm(); return; }
  if (mode!=="play") return;
  if (scene.dive) { updateDive(); return; }
  if (updateGateTransition()) return;
  age++;
  moveTraps(scene.traps,age);
  for (const s of scene.ledges) {
    s.oldX=s.x; s.oldY=s.y;
    const travel=Math.sin(age*.021+s.phase)*s.range;
    if (s.axis==="x") s.x=s.baseX+travel;
    if (s.axis==="y") s.y=s.baseY+travel;
  }
  updatePlayer();
  if (mode!=="play" || updateSurfaceChallenges()) return;
  if (scene.boss) updateBoss();
  else updateLevel();
  if (mode!=="play") return;
  updateShots();
  updateInteractionPrompt();
  const target=clamp(player.x-237,0,scene.width-W);
  camera+=clamp((target-camera)*.12,-12,12);
  for (const pt of particles) {
    pt.x+=pt.vx; pt.y+=pt.vy; pt.vy+=.11; pt.life--;
  }
  particles=particles.filter(pt=>pt.life>0);
}

function draw() {
  const cam=Math.floor(camera);
  const p=scene.stage.palette;
  const t=mode==="play"||mode==="title"?tick:age;
  if (scene.dive) { drawDive(ctx,scene.dive,t); return; }
  scenery(ctx,selected,cam,t);
  if (scene.floodgate) drawFloodgate(ctx,scene.floodgate,cam,t);
  for (const g of scene.ground) {
    tile(ctx,g,p,cam);
    const start=Math.max(0,Math.floor((cam-g.x)/69));
    for (let i=start;selected!==2 && g.x+i*69+27<Math.min(g.x+g.w-5,cam+W+20);i++) {
      const x=g.x+i*69+27;
      if (!scene.hazards.some(h=>x>=h.x-6 && x<=h.x+h.w+7)) tuft(ctx,x-cam,g.y,p,i);
    }
  }
  for (const s of scene.ledges) {
    tile(ctx,s,p,cam);
    if (s.axis) {
      rect(ctx,s.x-cam+5,s.y+19,s.w-10,3,p[6]);
      rect(ctx,s.x-cam+s.w/2-8,s.y+21,16,3,"#ffdf9b");
    }
  }
  for (const h of scene.hazards) drawSpikes(ctx,h.x-cam,h.y,h.w,h.h);
  if (scene.traps.length) drawMineTraps(ctx,scene.traps,cam,t);
  if (scene.bridge) drawBridge(ctx,scene.bridge,cam);
  scene.gems.forEach((g,i)=>{
    if (stageCollected.has(i)) return;
    const {x,y}=gemPosition(g);
    if (x>cam-12 && x<cam+W+12) gem(ctx,x-cam,y,t);
  });
  if (scene.gate) {
    const x=scene.gate.x-cam,y=scene.gate.y;
    if (x>-40 && x<W+40) {
      const blue=selected===5?"#c1f5fc":"#efb7ed";
      rect(ctx,x-24,y-48,48,48,p[10]);
      rect(ctx,x-19,y-56,38,56,p[10]);
      rect(ctx,x-14,y-49,28,49,p[7]);
      rect(ctx,x-10,y-44,20,44,"#b78be8");
      sparkle(ctx,x,y-27,8,"#fff2c2");
      rect(ctx,x-23,y-5,46,5,blue);
      rect(ctx,x-21,y-48,4,43,blue);
      rect(ctx,x+17,y-48,4,43,blue);
      rect(ctx,x-18,y-54,36,4,blue);
    }
  }
  for (const save of [scene.stage.checkpoint,scene.bridge?.after]) {
    if (!save) continue;
    const [x,y]=save;
    const active=checkpoint && checkpoint[0]>=x;
    rect(ctx,x-cam-2,y-47,4,47,"#e1c7f4");
    polygon(ctx,[[x-cam,y-45],[x-cam+24,y-41],[x-cam+20,y-28],[x-cam,y-29]],active?"#def982":"#b697d5");
    if (active) sparkle(ctx,x-cam+4,y-55+Math.sin(t*.1)*3,5,"#f9ffc2");
  }
  if (selected===0 && cam<315) {
    rect(ctx,203-cam,367,4,27,"#815778");
    rect(ctx,193-cam,365,26,14,"#f4c397");
    rect(ctx,198-cam,370,14,3,"#79567d");
    rect(ctx,208-cam,367,3,3,"#79567d");
    rect(ctx,208-cam,373,3,3,"#79567d");
  }
  for (const e of scene.enemies) if (e.alive && e.x>cam-30 && e.x<cam+W+30) enemySprite(ctx,e,cam,t);
  if (scene.boss) drawBoss(t);
  for (const s of shots) {
    rect(ctx,s.x-cam-s.vx*.8,s.y-s.vy*.8,6,4,"#99b7df");
    sparkle(ctx,s.x-cam,s.y,6,"#dbfff6");
  }
  playerSprite(ctx,player.x+10-cam,player.y+32,player.dir,t,Math.abs(player.vx)>.6,!player.on&&mode==="play",player.inv>0);
  for (const pt of particles) {
    ctx.globalAlpha=Math.min(1,pt.life/10);
    rect(ctx,pt.x-cam,pt.y,3,3,pt.color);
  }
  ctx.globalAlpha=1;
}
function drawBoss(t) {
  const b=scene.boss;
  if (b.hp<=0) return;
  const y=b.y-101+(mode==="title"?Math.sin(t*.035)*7:0);
  const x=b.x;
  ctx.globalAlpha=.3;
  rect(ctx,x-65,389,130,7,"#211638");
  rect(ctx,x-45,384,90,6,"#211638");
  ctx.globalAlpha=1;
  for (let i=0;i<6;i++) {
    const a=i*Math.PI/3+t*.016;
    sparkle(ctx,x+Math.cos(a)*93,b.y-33+Math.sin(a)*83,i%2===0?7:4,b.phase===3?"#ff5e80":i%2===0?"#ffb8e9":"#d4bbff");
  }
  if (bossImage.complete && bossImage.naturalWidth>0) {
    ctx.imageSmoothingEnabled=true;
    ctx.globalAlpha=b.flash?.62:1;
    if (b.phase===3) { ctx.shadowColor="#ff325a"; ctx.shadowBlur=16; }
    ctx.drawImage(b.phase===3 && enragedBossImage?enragedBossImage:bossImage,x-71,y,142,145);
    ctx.shadowBlur=0;
    ctx.globalAlpha=1;
    ctx.imageSmoothingEnabled=false;
  }
  if (b.frame<213 && mode!=="title") {
    ctx.beginPath();
    ctx.ellipse(x,b.y-32,82,87,0,0,Math.PI*2);
    ctx.strokeStyle=b.phase===3?"#ff8096d0":"#e1b4f0a0";
    ctx.lineWidth=2;
    ctx.stroke();
  }
  const pattern=(b.cycle+b.phase-1)%3;
  const nextRain=Math.floor((b.frame-48)/22)+1;
  if (mode==="play" && pattern===1 && b.frame>=28 && nextRain>=0 && nextRain<=6) {
    const lane=(nextRain*3+b.cycle)%8;
    for (const x of [46+lane*87,46+(lane+4)%8*87]) {
      ctx.globalAlpha=.26+Math.sin(t*.4)*.11;
      rect(ctx,x-11,0,22,403,"#ff9cbb");
      ctx.globalAlpha=1;
      rect(ctx,x-12,399,24,4,"#ff9cbb");
    }
  }
  for (const o of orbs) {
    rect(ctx,o.x-o.r*.66,o.y-o.r,o.r*1.32,o.r*2,o.color);
    rect(ctx,o.x-o.r,o.y-o.r*.66,o.r*2,o.r*1.32,o.color);
    sparkle(ctx,o.x,o.y,Math.max(3,o.r-3),"#fff3d5");
  }
}

refreshSound();
initChallengeControls();
setupTitle();
let previous=0, accumulator=0;
function frame(time) {
  accumulator+=Math.min(60,time-(previous||time));
  previous=time;
  while (accumulator>=1000/60) {
    step();
    accumulator-=1000/60;
  }
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
