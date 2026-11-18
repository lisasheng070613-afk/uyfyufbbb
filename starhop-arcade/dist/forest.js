"use strict";

const webDirections=["ArrowUp","ArrowRight","ArrowDown","ArrowLeft","ArrowRight","ArrowUp","ArrowLeft","ArrowDown"];
const webMarks={ArrowUp:"↑",ArrowDown:"↓",ArrowLeft:"←",ArrowRight:"→"};
const webMotion={ArrowUp:[0,-9],ArrowDown:[0,6],ArrowLeft:[-8,0],ArrowRight:[8,0]};
const webWindow=63;
const chaseTopSpeed=5.04;
const maxSpiderGap=228;

function buildForestChase(data,end) {
  return {
    ...data,end,phase:"waiting",time:0,gap:169,lastX:0,nextWeb:230,
    web:null,webIndex:0,trace:0,dodged:false,slow:0,lean:0,dodgeArrow:null,snagged:new Set()
  };
}
function forestChaseActive() {
  return !!scene.chase && scene.chase.phase!=="waiting";
}
function startForestChase() {
  const chase=scene.chase;
  if (!chase || chase.phase!=="waiting" || player.x<chase.start[0] || (!player.on?.ground && checkpoint!==chase.start)) return false;
  const retry=checkpoint===chase.start;
  chase.phase="intro";
  chase.time=retry?54:0;
  checkpoint=chase.start;
  player.hp=player.max;
  player.dir=-1;
  player.vx=0;
  jumpQueue=0;
  firing=false;
  shots=[];
  showToast("身后是蜘蛛群！按住 D 向前跑，空格跳跃。",158);
  sound("hurt");
  refreshHud();
  syncForestChase();
  refreshForestHud(chase);
  return true;
}
function updateForestIntro() {
  if (++scene.chase.time>=92) {
    const chase=scene.chase;
    chase.phase="run";
    chase.time=0;
    chase.lastX=player.x;
    player.dir=1;
    jumpQueue=0;
    syncForestChase();
  }
}
function inForestSwamp() {
  return player.on?.ground && scene.chase.swamps.some(([x,y,w])=>
    player.x+player.w/2>=x && player.x+player.w/2<x+w && player.on.y===y);
}
function forestRunSpeed() {
  if (scene.chase.slow>0) return inForestSwamp()?2.15:2.84;
  return inForestSwamp()?2.81:chaseTopSpeed;
}
function initForestControls() {
  byId("webButtons").querySelectorAll("button").forEach(button=>{
    button.addEventListener("click",()=>{
      dodgeForestWeb(button.dataset.arrow);
      canvas.focus({preventScroll:true});
    });
  });
}
function syncForestChase() {
  const active=mode==="play" && forestChaseActive();
  const visible=(mode==="play" || mode==="pause") && forestChaseActive();
  byId("chaseHud").hidden=!visible;
  byId("webPrompt").hidden=!active || !scene.chase.web;
  byId("touchLeft").hidden=active;
  byId("touchInteract").hidden=active;
  if (active) {
    byId("touchAttack").hidden=true;
    ui.stageGoal.textContent="按住 D 奔跑 · 空格跳过沼泽和断崖";
    ui.stageTag.innerHTML="苔影森林 <i></i> 蜘蛛追逐";
  }
}
function refreshForestHud(chase) {
  const percent=Math.round(clamp((player.x-chase.start[0])/(chase.end-chase.start[0]),0,1)*100);
  byId("chaseProgress").textContent=percent+"%";
  byId("chaseGap").style.width=clamp(chase.gap/maxSpiderGap*100,0,100)+"%";
  byId("chaseHud").classList.toggle("danger",chase.gap<79);
  if (chase.web) byId("webTime").style.width=chase.web.time/webWindow*100+"%";
}
function dodgeForestWeb(arrow) {
  const chase=scene.chase;
  if (mode!=="play" || !chase?.web) return;
  const dodged=arrow===chase.web.arrow;
  chase.web=null;
  chase.trace=21;
  chase.dodged=dodged;
  if (dodged) {
    chase.lean=9;
    chase.dodgeArrow=arrow;
    chase.gap=Math.min(maxSpiderGap,chase.gap+18);
    burst(player.x-7,player.y+17,"#dcc7ff",6);
    sound("collect");
  } else {
    chase.slow=Math.max(chase.slow,104);
    showToast("被蛛丝缠住 · 移动减速",102);
    sound("hurt");
  }
  syncForestChase();
}
function updateForestChase() {
  const chase=scene.chase;
  chase.time++;
  if (chase.trace>0) chase.trace--;
  if (chase.lean>0) chase.lean--;
  if (chase.slow>0) chase.slow--;
  if (chase.web && --chase.web.time<=0) dodgeForestWeb(null);
  if (!chase.web && chase.time>=chase.nextWeb && player.x<chase.end-125) {
    const arrow=webDirections[chase.webIndex%webDirections.length];
    chase.webIndex++;
    chase.web={arrow,time:webWindow};
    chase.nextWeb=chase.time+300+(chase.webIndex%3)*26;
    byId("webArrow").textContent=webMarks[arrow];
    if (chase.webIndex===1) showToast("按提示的方向键躲过蛛丝！",94);
    syncForestChase();
    sound("beat");
  }
  for (const root of chase.roots) {
    const [x,y,w,h]=root;
    if (!chase.snagged.has(root) && overlap(player,{x,y:y-h,w,h})) {
      chase.snagged.add(root);
      chase.slow=Math.max(chase.slow,61);
      showToast("被荆棘绊住 · 跳过去更快",90);
      sound("hurt");
      burst(x+w/2,y-13,"#b084a2",8);
    }
  }
  const runDistance=player.x-chase.start[0];
  const pace=3.62+clamp(runDistance/(chase.end-chase.start[0]),0,1)*.60;
  chase.gap=Math.min(maxSpiderGap,chase.gap+Math.max(0,player.x-chase.lastX)-pace);
  chase.lastX=player.x;
  if (chase.gap<=21) {
    player.hp=0;
    fail("蜘蛛追上来了。从追逐入口重试。");
    return;
  }
  refreshForestHud(chase);
}
function drawForestMud(c,chase,cam,t) {
  for (const [x,y,w] of chase.swamps) {
    const left=x-cam;
    if (left>W || left+w<0) continue;
    rect(c,left,y-1,w,5,"#503f5d");
    rect(c,left+3,y+3,w-6,7,"#473651");
    rect(c,left+9,y+10,w-19,12,"#302b49");
    rect(c,left+3,y-2,w-6,3,"#9a758c");
    for (let j=0;j<5;j++) {
      const xx=(j*41+t*.36)%w;
      rect(c,left+xx,y+2+j%3*3,Math.min(15,w-xx),2,"#70596f");
      if ((Math.floor(t/10)+j)%7<3) {
        rect(c,left+w*(.14+j*.16),y-4-(t%30)*.18,3,3,"#bcb18d");
      }
    }
  }
  for (const [x,y,w,h] of chase.roots) {
    const left=x-cam;
    if (left>W || left+w<0) continue;
    polygon(c,[[left,y],[left+4,y-12],[left+w*.4,y-h],[left+w*.55,y-h+3],[left+w*.72,y-13],[left+w,y]],"#43304f");
    polygon(c,[[left+3,y-3],[left+w*.4,y-h+3],[left+w*.62,y-10],[left+w-4,y-4],[left+w-11,y]],"#9d6288");
    for (let j=0;j<4;j++) {
      const xx=left+7+j*(w-13)/4, yy=y-10-((j+1)%3)*8;
      polygon(c,[[xx-4,yy+6],[xx+4,yy],[xx+9,yy+8]],"#e59cb0");
    }
    rect(c,left+3,y-3,w-6,3,"#2d2949");
  }
}

function drawSpider(c,x,y,size,t,i) {
  c.save();
  c.translate(Math.round(x),Math.round(y));
  c.scale(size,size);
  const legs=i%3===0?"#352b4c":"#27253e";
  for (const side of [-1,1]) {
    for (let j=0;j<4;j++) {
      const step=Math.sin(t*.34+j*1.7+i)*5, knee=15+j*4, tip=22+j*4;
      const y0=-17+j*3;
      polygon(c,[[side*5,y0-1],[side*knee,y0-6],[side*tip,-6+step+j],
        [side*(tip-1),step+j],[side*(knee-1),y0-2],[side*6,y0+3]],legs);
    }
  }
  rect(c,-12,-20,16,4,"#3f345b");
  rect(c,-16,-17,29,13,"#211c37");
  rect(c,-12,-17,19,9,"#342846");
  rect(c,6,-13,12,9,"#332341");
  rect(c,10,-12,3,3,"#f98ba6");
  rect(c,15,-11,3,2,"#f9c4ad");
  rect(c,16,-6,4,2,"#b78ca6");
  c.restore();
}

function drawForestChase(c,chase,cam,t) {
  if (chase.phase==="waiting") return;
  const front=player.x-chase.gap-cam;
  const base=player.y+player.h;
  const mist=c.createLinearGradient(0,0,Math.max(9,front+118),0);
  mist.addColorStop(0,"#2c1d43c4");
  mist.addColorStop(1,"#52274b00");
  c.fillStyle=mist;
  c.fillRect(0,0,Math.max(0,front+118),H);
  for (let i=10;i>=0;i--) {
    const x=front-i*13+(i%3)*11+Math.sin(t*.16+i)*3;
    const worldX=x+cam;
    const ledge=scene.ground.find(s=>worldX>=s.x && worldX<s.x+s.w);
    const ground=ledge?.y??base+17;
    if (x>W+34 || x<-48) continue;
    const lift=Math.abs(Math.sin(t*.13+i*2))*12+(i%3)*7;
    drawSpider(c,x,ground-lift,i===0?1.2:.61+(i%4)*.15,t,i);
  }
  if (chase.web || chase.trace) {
    const target=player.x-cam+9, middle=player.y+13;
    const tension=chase.web?1-chase.web.time/webWindow:1;
    const reach=front+(target-front)*Math.max(.15,tension);
    const y=middle+(chase.dodged && chase.trace?-18:0);
    c.globalAlpha=chase.trace?chase.trace/22:.65;
    c.strokeStyle="#f6ddff";
    c.lineWidth=2;
    c.beginPath();
    c.moveTo(front+3,base-18);
    c.quadraticCurveTo((reach+front)/2,Math.min(base-45,y-24),reach,y);
    c.stroke();
    for (let i=0;i<5;i++) {
      const theta=i*Math.PI*2/5+t*.05;
      rect(c,reach+Math.cos(theta)*8,y+Math.sin(theta)*7,3,3,"#eac2ff");
    }
    c.globalAlpha=1;
  }
}
