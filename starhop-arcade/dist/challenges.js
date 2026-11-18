"use strict";

function createTraps(stage) {
  return (stage.traps ?? []).map(trap=>({
    ...trap, baseX:trap.x, baseY:trap.y, drawY:trap.y, h:0, warning:false
  }));
}

function moveTraps(traps,frame) {
  for (const h of traps) {
    const cycle=((frame+h.offset)%h.period)/h.period;
    if (h.kind==="rail") {
      h.x=h.baseX+Math.sin(cycle*Math.PI*2)*h.travel;
      h.y=h.baseY-19;
      h.h=19;
      continue;
    }
    const extension=clamp(Math.min((cycle-.29)/.12,(.81-cycle)/.12),0,1);
    h.warning=cycle>=.16 && cycle<.41;
    if (h.kind==="pop") {
      h.h=Math.round(extension*27);
      h.y=h.baseY-h.h;
    } else {
      h.drawY=h.baseY+extension*h.travel;
      h.h=19;
      h.y=h.drawY+13;
    }
  }
}

function mineScenery(c,cam,t) {
  const fog=c.createLinearGradient(0,0,0,H);
  fog.addColorStop(0,"#19172e");
  fog.addColorStop(.48,"#38335a");
  fog.addColorStop(1,"#151b32");
  c.fillStyle=fog;
  c.fillRect(0,0,W,H);
  for (let layer=0;layer<3;layer++) {
    const offset=cam*(.16+layer*.145);
    const stride=112-layer*19;
    for (let i=Math.floor(offset/stride)-1;i<(offset+W)/stride+1;i++) {
      const x=i*stride-offset;
      const y=94+layer*12+Math.abs((i*53+layer*19)%75);
      polygon(c,[[x,0],[x+stride+2,0],[x+stride+2,y-21],[x+64,y-14],[x+51,y+9],[x+30,y+9],[x+17,y-6],[x,y-6]],["#393453","#2d2947","#222039"][layer]);
      if ((i+layer)%3===0) {
        const floor=305+Math.abs(i*37%97);
        polygon(c,[[x-6,floor],[x+10,floor-29],[x+17,floor-80],[x+27,floor-91],[x+43,floor-58],[x+47,floor],[x+58,floor+13]],"#4a4675");
        polygon(c,[[x+16,floor-75],[x+27,floor-91],[x+31,floor-22],[x+22,floor-31]],"#6a65a0");
      }
    }
  }
  const supportSpacing=287;
  for (let i=Math.max(0,Math.floor((cam-80)/supportSpacing));i<(cam+W+80)/supportSpacing;i++) {
    const x=85+i*supportSpacing-cam, y=125+i%3*15;
    rect(c,x+2,y,20,360,"#30263e");
    rect(c,x+5,y,5,360,"#61475d");
    rect(c,x+80,y,17,360,"#392a43");
    rect(c,x+83,y,4,360,"#63465f");
    rect(c,x-11,y,121,13,"#6c4d63");
    rect(c,x-11,y,121,3,"#a0717a");
    polygon(c,[[x+15,y+10],[x+26,y+10],[x+57,y+41],[x+57,y+53]],"#694958");
    rect(c,x+48,y+9,3,35,"#967e87");
    const glow=c.createRadialGradient(x+50,y+51,3,x+50,y+51,45+Math.sin(t*.08+i)*4);
    glow.addColorStop(0,"#ffbf726f");
    glow.addColorStop(1,"#ffbf7200");
    c.fillStyle=glow;
    c.fillRect(x,y+8,100,93);
    rect(c,x+44,y+41,13,16,"#412938");
    rect(c,x+46,y+44,9,10,"#f5a65f");
    rect(c,x+48,y+46,5,7,"#ffdf9b");
  }
  for (let i=0;i<45;i++) {
    const x=((i*137-cam*.52)%W+W)%W, y=112+(i*37)%316;
    const opacity=.15+(Math.sin(i*3+t*.036)+1)*.15;
    c.globalAlpha=opacity;
    rect(c,x,y,2+i%2,2,"#cdd1ff");
  }
  c.globalAlpha=1;
}

function drawSpikes(c,x,y,w,h,down=false,color="#fbd0d6",shadow="#b46b98") {
  for (let offset=0;offset<w;offset+=9) {
    const left=x+offset, width=Math.min(9,w-offset);
    const base=down?y:y+h, tip=down?y+h:y;
    polygon(c,[[left,base],[left+width/2,tip],[left+width,base]],color);
    polygon(c,[[left+width/2,tip],[left+width,base],[left+width/2,base]],shadow);
  }
}
function drawMineTraps(c,traps,cam,t) {
  for (const h of traps) {
    const x=h.x-cam;
    if (x+h.w+(h.travel??0)<0 || x-(h.travel??0)>W) continue;
    if (h.kind==="press") {
      const axle=x+h.w/2;
      rect(c,x-7,h.baseY-14,h.w+14,15,"#5e506b");
      rect(c,axle-7,h.baseY,14,h.drawY-h.baseY+7,"#766684");
      rect(c,axle-5,h.baseY,4,h.drawY-h.baseY+7,"#b29ab8");
      rect(c,x,h.drawY,h.w,14,"#6e5076");
      rect(c,x,h.drawY+2,h.w,3,"#bb83a4");
      if (h.warning) {
        rect(c,x+6,h.drawY+7,h.w-12,4,Math.floor(t/5)%2?"#ffaf79":"#c28b81");
        c.globalAlpha=.17;
        rect(c,x,h.drawY+13,h.w,h.baseY+h.travel-h.drawY+14,"#ff9d94");
        c.globalAlpha=1;
      }
      drawSpikes(c,x,h.y,h.w,h.h,true,"#ffd4d0","#ba7d9d");
      continue;
    }
    if (h.kind==="rail") {
      const start=h.baseX-h.travel-cam;
      rect(c,start,h.baseY-3,h.w+h.travel*2,4,"#ba8a79");
      rect(c,x-2,h.baseY-5,h.w+4,5,"#7f4d69");
    } else {
      rect(c,x-2,h.baseY-4,h.w+4,5,h.warning&&Math.floor(t/5)%2?"#ffb580":"#9d6288");
      for (let i=2;i<h.w;i+=11) rect(c,x+i,h.baseY-3,5,2,"#4d355c");
    }
    if (h.h>0) drawSpikes(c,x,h.y,h.w,h.h,false,"#ffd4d0","#bc6f9c");
  }
}

const rhythmDirections=[["ArrowLeft","←"],["ArrowDown","↓"],["ArrowUp","↑"],["ArrowRight","→"]];
const rhythmSequence=[0,2,1,3,1,0,3,2];
const rhythmWindow=10;
let rhythmButtons,rhythmLanes,rhythmFeedback,rhythmNotes=[];

function initChallengeControls() {
  const lanes=byId("rhythmLanes");
  rhythmLanes=Array.from(lanes.querySelectorAll(".rhythm-lane"));
  rhythmButtons=Array.from(lanes.querySelectorAll("button"));
  rhythmFeedback=byId("rhythmFeedback");
  rhythmButtons.forEach(button=>button.addEventListener("click",()=>judgeRhythm(button.dataset.arrow)));
  byId("rhythmExit").onclick=()=>endRhythm(false);
  byId("rhythmRetry").onclick=startRhythm;
}

function startRhythm() {
  const bridge=scene.bridge;
  if (!bridge || bridge.open || bridge.lowering!==null) return;
  clearInput();
  mode="rhythm";
  bridge.rhythm={frame:0,next:0,failed:false,lit:null,lightUntil:0};
  ui.toast.hidden=true;
  syncState("石板机关");
  byId("rhythm").hidden=false;
  byId("rhythmRetry").hidden=true;
  rhythmFeedback.textContent="准备";
  rhythmButtons.forEach(button=>delete button.dataset.result);
  rhythmNotes.forEach(note=>note.remove());
  rhythmNotes=rhythmSequence.map((lane,i)=>{
    const note=document.createElement("span");
    note.className="rhythm-note";
    note.textContent=rhythmDirections[lane][1];
    note.hidden=true;
    note.setAttribute("aria-hidden","true");
    rhythmLanes[lane].append(note);
    return note;
  });
  renderRhythmProgress(0);
  canvas.focus({preventScroll:true});
}
function renderRhythmProgress(hits) {
  byId("rhythmProgress").innerHTML=rhythmSequence.map((_,i)=>i<hits?'<i class="hit"></i>':"<i></i>").join("");
  byId("rhythmProgress").setAttribute("aria-label",`命中 ${hits} / ${rhythmSequence.length}`);
}
function noteTarget(index) {
  return 85+index*40;
}
function updateRhythm() {
  const state=scene.bridge.rhythm;
  if (state.failed) return;
  state.frame++;
  if ((state.frame-5)%40===0) sound("beat");
  if (state.lit!==null && state.frame>=state.lightUntil) {
    delete rhythmButtons[state.lit].dataset.result;
    state.lit=null;
  }
  if (state.frame>noteTarget(state.next)+rhythmWindow) {
    missRhythm("错过判定线，再试一次。");
    return;
  }
  rhythmNotes.forEach((note,index)=>{
    const ahead=noteTarget(index)-state.frame;
    note.hidden=index<state.next || ahead>72;
    if (!note.hidden) note.style.top=(81-ahead*1.13)+"%";
  });
}
function missRhythm(message,lane=rhythmSequence[scene.bridge.rhythm.next]) {
  scene.bridge.rhythm.failed=true;
  rhythmButtons[lane].dataset.result="miss";
  rhythmFeedback.textContent=message;
  byId("rhythmRetry").hidden=false;
  sound("hurt");
}
function judgeRhythm(key) {
  if (mode!=="rhythm") return;
  const state=scene.bridge.rhythm;
  if (state.failed) return;
  const next=state.next;
  const lane=rhythmDirections.findIndex(([code])=>key===code);
  if (lane<0) return;
  if (lane!==rhythmSequence[next]) { missRhythm("方向错了，再试一次。",lane); return; }
  if (Math.abs(state.frame-noteTarget(next))>rhythmWindow) { missRhythm("节拍没对上，再试一次。",lane); return; }
  state.next++;
  state.lit=lane;
  state.lightUntil=state.frame+12;
  rhythmButtons[lane].dataset.result="hit";
  rhythmNotes[next].hidden=true;
  rhythmFeedback.textContent="命中！";
  renderRhythmProgress(state.next);
  sound("collect");
  if (state.next===rhythmSequence.length) endRhythm(true);
}
function endRhythm(solved) {
  if (mode!=="rhythm") return;
  scene.bridge.rhythm=null;
  byId("rhythm").hidden=true;
  mode="play";
  clearInput();
  syncState("进行中");
  canvas.focus({preventScroll:true});
  if (solved) {
    scene.bridge.lowering=0;
    showToast("节奏机关解开 · 吊桥正在下降",145);
    sound("clear");
  }
}
function openBridge(world) {
  const b=world.bridge;
  if (!b || b.open) return;
  b.open=true;
  b.lowering=null;
  world.solids.push({x:b.x,y:b.y,w:b.w,h:18,oldX:b.x,oldY:b.y});
}
function drawBridge(c,b,cam) {
  const hinge=b.x-cam, y=b.y;
  const progress=b.open?1:b.lowering===null?0:b.lowering/46;
  const angle=-(1-progress)*1.43;
  rect(c,hinge-12,y-22,19,29,"#584057");
  rect(c,hinge-15,y-23,25,4,"#ccb093");
  rect(c,hinge+b.w-7,y-10,15,44,"#634659");
  rect(c,hinge+b.w-11,y-13,23,5,"#dbb596");
  if (!b.open) {
    c.strokeStyle="#d8a27e";
    c.lineWidth=2;
    c.setLineDash([3,5]);
    c.beginPath();
    c.moveTo(hinge-9,y-43);
    c.lineTo(hinge+Math.cos(angle)*b.w,y+Math.sin(angle)*b.w);
    c.stroke();
    c.setLineDash([]);
  }
  c.save();
  c.translate(hinge,y);
  c.rotate(angle);
  rect(c,0,0,b.w,13,"#743e51");
  rect(c,0,0,b.w,3,"#f6c69b");
  for (let x=0;x<b.w;x+=16) {
    rect(c,x+1,4,Math.min(13,b.w-x),7,"#bd866f");
    rect(c,x+2,6,2,3,"#724f63");
  }
  c.restore();
  const x=b.slate-cam;
  rect(c,x-16,y-39,32,39,"#745470");
  rect(c,x-13,y-44,26,6,"#dfb6a9");
  rect(c,x-13,y-36,24,27,"#ac829a");
  rect(c,x-8,y-32,16,18,"#5b426d");
  sparkle(c,x,y-23,7,b.open?"#ddf691":"#f9d5bc");
}

const diveTile=32;
const diveColumns=52;
const diveRows=24;
const diveWidth=diveColumns*diveTile, diveHeight=diveRows*diveTile;
const oxygenMax=312;
const divePassages=[
  [2,2,9,7],[5,6,8,16],[7,4,23,7],[7,10,16,13],[13,6,16,16],
  [5,14,25,17],[21,6,25,17],[18,2,22,5],[20,8,24,11],
  [23,5,40,8],[28,3,32,6],[23,15,39,18],[30,9,34,19],[29,8,35,12],
  [37,6,41,17],[38,3,43,7],[40,13,50,17],[32,18,37,22],[36,19,49,22],
  [45,15,49,20],[44,11,49,15]
];
const diveBubbles=[[18,2,22,4],[20,8,24,10],[28,3,32,5],[29,8,35,10],[38,3,43,5],[40,17,44,20],[44,11,49,13]];
const diveTiles=Array.from({length:diveRows},(_,y)=>Array.from({length:diveColumns},(_,x)=>{
  const inside=([x0,y0,x1,y1])=>x>=x0 && x<x1 && y>=y0 && y<y1;
  return diveBubbles.some(inside)?2:divePassages.some(inside)?1:0;
}));
const diveHats=[
  {x:10.5*diveTile,y:15.7*diveTile,white:false},
  {x:34.6*diveTile,y:6.7*diveTile,white:false},
  {x:41.4*diveTile,y:20.5*diveTile,white:false},
  {x:47.4*diveTile,y:14.9*diveTile,white:true}
];
const swimKeys=new Set(["KeyW","KeyS","ArrowUp","ArrowDown"]);

function updateChallengeHud() {
  const underwater=!!scene.dive && (mode==="play" || mode==="pause");
  byId("oxygen").hidden=!underwater;
  byId("rhythm").hidden=mode!=="rhythm";
  for (const button of ui.touch.querySelectorAll("[data-swim]")) button.hidden=!underwater;
  byId("touchJump").hidden=underwater;
  byId("touchAttack").hidden=underwater;
  updateInteractionPrompt();
}
function currentInteraction() {
  if (mode!=="play") return null;
  const center=player.x+player.w/2, feet=player.y+player.h;
  if (scene.dive) {
    const hat=diveHats.find(h=>Math.hypot(h.x-center,h.y-(player.y+17))<39);
    return hat?{label:hat.white?"调查白色帽子":"调查红色帽子",action:()=>inspectHat(hat)}:null;
  }
  const b=scene.bridge;
  if (b && !b.open && b.lowering===null && Math.abs(center-b.slate)<52 && Math.abs(feet-b.y)<54) {
    return {label:"启动石板机关",action:startRhythm};
  }
  const gate=scene.floodgate;
  if (gate && !gate.key && Math.abs(center-gate.x)<81 && Math.abs(feet-gate.y)<82) {
    return {label:"查看星轨闸门",action:()=>showToast("闸门上了锁 · 在水下找钥匙")};
  }
  return null;
}
function updateInteractionPrompt() {
  const interaction=currentInteraction();
  const panel=byId("interaction");
  panel.hidden=!interaction;
  if (interaction) byId("interactionText").textContent=interaction.label;
}
function useInteraction() {
  currentInteraction()?.action();
}

function diveAt(x,y) {
  return diveTiles[Math.floor(y/diveTile)]?.[Math.floor(x/diveTile)]??0;
}
function isDiveWall(p) {
  const left=Math.floor(p.x/diveTile), right=Math.floor((p.x+p.w-.01)/diveTile);
  const top=Math.floor(p.y/diveTile), bottom=Math.floor((p.y+p.h-.01)/diveTile);
  for (let y=top;y<=bottom;y++) for (let x=left;x<=right;x++) if (!diveTiles[y]?.[x]) return true;
  return false;
}
function diveMove(p,axis,distance) {
  p[axis]+=distance;
  if (!isDiveWall(p)) return;
  if (axis==="x") {
    const edge=distance>0?p.x+p.w:p.x;
    p.x=(distance>0?Math.floor((edge-.01)/diveTile)*diveTile-p.w:Math.ceil(edge/diveTile)*diveTile);
    p.vx=0;
  } else {
    const edge=distance>0?p.y+p.h:p.y;
    p.y=(distance>0?Math.floor((edge-.01)/diveTile)*diveTile-p.h:Math.ceil(edge/diveTile)*diveTile);
    p.vy=0;
  }
}
function enterDive() {
  clearInput();
  shots=[]; particles=[];
  Object.assign(player,{x:4.5*diveTile,y:4*diveTile,vx:0,vy:0,on:null});
  scene.dive={oxygen:oxygenMax,x:0,y:0,breathing:false,lastPercent:-1};
  updateOxygen();
  updateChallengeHud();
  sound("save");
  showToast("A/D 游动 · ↑ 上浮 · ↓ 下潜 · 到气穴呼吸",240);
}
function updateOxygen() {
  const d=scene.dive;
  const percent=Math.ceil(d.oxygen/oxygenMax*100);
  if (percent===d.lastPercent) return;
  d.lastPercent=percent;
  byId("oxygenFill").style.width=percent+"%";
  byId("oxygenValue").textContent=percent+"%";
  byId("oxygenTrack").setAttribute("aria-valuenow",String(percent));
  byId("oxygen").classList.toggle("low",percent<=25);
}
function updateDive() {
  const p=player,d=scene.dive;
  const dx=Number(keys.has("KeyD")||keys.has("ArrowRight"))-Number(keys.has("KeyA")||keys.has("ArrowLeft"));
  const dy=Number(keys.has("KeyS")||keys.has("ArrowDown"))-Number(keys.has("KeyW")||keys.has("ArrowUp")||keys.has("Space"));
  const speed=3.35/(Math.hypot(dx,dy)||1);
  p.vx+=(dx*speed-p.vx)*.55;
  p.vy+=(dy*speed-p.vy)*.55;
  if (dx) p.dir=dx;
  if (Math.abs(p.vx)>.015) diveMove(p,"x",p.vx);
  if (Math.abs(p.vy)>.015) diveMove(p,"y",p.vy);
  const inAir=diveAt(p.x+p.w/2,p.y+6)===2;
  if (inAir && !d.breathing) { showToast("气穴 · 氧气恢复",78); sound("save"); }
  d.breathing=inAir;
  d.oxygen=clamp(d.oxygen+(inAir?14:-1),0,oxygenMax);
  updateOxygen();
  d.x+=.16*(clamp(p.x-315,0,diveWidth-W)-d.x);
  d.y+=.16*(clamp(p.y-200,0,diveHeight-H)-d.y);
  updateInteractionPrompt();
  if (d.oxygen===0) {
    p.hp=0;
    fail("氧气耗尽了。下次记得在气穴补充氧气。");
  }
}
function inspectHat(hat) {
  const gate=scene.floodgate;
  scene.dive=null;
  clearInput();
  Object.assign(player,{x:gate.returnX,y:gate.y-player.h,vx:0,vy:0,on:null,dir:1});
  camera=clamp(player.x-237,0,scene.width-W);
  if (hat.white) {
    gate.key=true;
    gate.countdown=112;
    sound("clear");
    showToast("找到钥匙 · 闸门开启，即将进入终幕",120);
  } else {
    sound("hit");
    showToast("红帽把你送回了水面 · 继续寻找白帽",171);
  }
  updateChallengeHud();
}
function updateSurfaceChallenges() {
  const b=scene.bridge;
  if (b?.lowering!=null && ++b.lowering>=46) {
    openBridge(scene);
    showToast("吊桥已放下 · 可以通过",145);
  }
  const gate=scene.floodgate;
  if (!gate) return false;
  const x=player.x+player.w/2, feet=player.y+player.h;
  if (feet<445) return false;
  if (x>gate.inlet[0] && x<gate.inlet[1]) {
    enterDive();
    return true;
  }
  if (x>gate.trap[0] && x<gate.trap[1]) {
    player.hp=0;
    fail("掉进了死洞。去找有水波的入口。");
    return true;
  }
  return false;
}
function updateGateTransition() {
  const g=scene.floodgate;
  if (!g?.key) return false;
  g.countdown--;
  player.vx=g.countdown<76?1.24:0;
  player.x+=player.vx;
  if (g.countdown<=0) finishLevel(true);
  return true;
}

function drawFloodgate(c,g,cam,t) {
  const x=g.x-cam,y=g.y;
  const [from,to]=g.inlet;
  const wet=c.createLinearGradient(0,y,0,H);
  wet.addColorStop(0,"#4989ad");
  wet.addColorStop(1,"#223a65");
  c.fillStyle=wet;
  c.fillRect(from-cam,y,to-from,H-y);
  for (let k=0;k<6;k++) {
    const px=(t*.45+19*k)%(to-from);
    rect(c,from-cam+px,y+Math.sin(t*.095+k)*3,Math.min(16,to-from-px),2,"#a5e9ef");
  }
  rect(c,g.trap[0]-cam,y+12,g.trap[1]-g.trap[0],H-y-12,"#2a1d40");
  for (let i=0;i<5;i++) rect(c,g.trap[0]-cam+i*13+5,y+34+(i%3)*13,5,2,"#684265");
  if (x<-65 || x>W+90) return;
  rect(c,x-34,y-8,85,8,"#b28cab");
  rect(c,x-27,y-101,69,94,"#38263f");
  rect(c,x-29,y-101,9,95,"#c195ba");
  rect(c,x+33,y-101,9,95,"#c195ba");
  rect(c,x-19,y-114,53,14,"#dfb8c9");
  rect(c,x-14,y-109,42,4,"#956ca0");
  const lifting=g.key?Math.round(clamp((112-g.countdown)/42,0,1)*89):0;
  for (let i=-14;i<33;i+=11) rect(c,x+i,y-105,4,Math.max(0,98-lifting),"#9d80ad");
  if (g.key) {
    sparkle(c,x+9,y-57+Math.sin(t*.13)*5,12,"#fbf0ac");
  } else {
    rect(c,x-1,y-55,22,18,"#4f3458");
    rect(c,x+1,y-54,18,15,"#e5b48f");
    rect(c,x+6,y-61,8,8,"#dfb18f");
    rect(c,x+9,y-51,3,6,"#644269");
  }
}
function drawDive(c,d,t) {
  const camX=Math.round(d.x), camY=Math.round(d.y);
  const fog=c.createLinearGradient(0,0,W,H);
  fog.addColorStop(0,"#19384f");
  fog.addColorStop(.6,"#123653");
  fog.addColorStop(1,"#162547");
  c.fillStyle=fog;
  c.fillRect(0,0,W,H);
  const firstX=Math.max(0,Math.floor(camX/diveTile)), firstY=Math.max(0,Math.floor(camY/diveTile));
  for (let row=firstY;row<diveRows && row*diveTile<camY+H;row++) {
    for (let col=firstX;col<diveColumns && col*diveTile<camX+W;col++) {
      const x=col*diveTile-camX,y=row*diveTile-camY,id=diveTiles[row][col];
      if (id===0) {
        rect(c,x,y,diveTile,diveTile,(col+row)%3===0?"#192a43":"#17253c");
        rect(c,x+3,y+6,8+col%6,2,"#263e59");
        rect(c,x+13,y+18,7+row%9,3,"#21344b");
        if (diveTiles[row-1]?.[col]) rect(c,x,y,diveTile,4,"#466581");
        if (diveTiles[row+1]?.[col]) rect(c,x,y+diveTile-3,diveTile,3,"#344e6e");
        if (diveTiles[row][col-1]) rect(c,x,y,3,diveTile,"#344d69");
        if (diveTiles[row][col+1]) rect(c,x+diveTile-3,y,3,diveTile,"#344d69");
      } else if (id===2) {
        rect(c,x,y,diveTile,diveTile,"#315b69");
        rect(c,x+7,y+9+((row+col)%3)*4,3,3,"#a6e8d1");
        if (diveTiles[row+1]?.[col]!==2) rect(c,x,y+diveTile-2,diveTile,2,"#8ac9d1");
      } else if ((col+row*3)%5===0) {
        const bubbleY=y+((t*.36+row*13)%diveTile);
        rect(c,x+13,bubbleY,3,3,"#5796ad");
        rect(c,x+10,bubbleY+6,2,2,"#3b708c");
      }
    }
  }
  drawDiveDetails(c,camX,camY,t);
  for (const h of diveHats) {
    const x=h.x-camX,y=h.y-camY;
    if (x<-25 || x>W+25 || y<-30 || y>H+30) continue;
    const bob=Math.sin(t*.09+h.x)*3;
    drawPixelHat(c,x,y+bob,h.white);
  }
  const p=player;
  if (t%32<18) rect(c,p.x+15-camX,p.y+4-camY-(t%32)*.45,3,3,"#97d5db");
  playerSprite(c,p.x+10-camX,p.y+32-camY,p.dir,t,Math.abs(p.vx)+Math.abs(p.vy)>.5,true,false);
}
function drawPixelHat(c,x,y,white) {
  const dark=white?"#2b284d":"#4a2346";
  const brim=white?"#f6eaf8":"#ef8295";
  const light=white?"#fff5f3":"#ffc2ba";
  rect(c,x-16,y+1,32,8,dark);
  rect(c,x-12,y-9,24,15,dark);
  rect(c,x-8,y-13,16,13,dark);
  rect(c,x-14,y+2,28,4,brim);
  rect(c,x-10,y-7,20,8,brim);
  rect(c,x-6,y-11,12,4,light);
  rect(c,x-9,y-3,18,3,white?"#6265a9":"#9d4b72");
  rect(c,x-6,y-4,6,2,white?"#aaa8e5":"#fdabbe");
  rect(c,x-9,y+5,19,2,light);
}
