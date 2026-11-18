"use strict";

const bossAssaultFrames=354;
const bossCounterFrames=143;
const bossPhaseHealth=29;
const bossHitInterval=11;
const bossFloor=403;
const bossPlans=[
  ["fan","rain","slam"],
  ["wave","crystal","spiral"],
  ["pinwheel","wall","doubleSlam"]
];
const bossTelegraphs={
  fan:"扇形星弹 · 穿过弹道间隙",
  rain:"星雨 · 离开亮起的落点",
  slam:"高空砸击 · 跑出橙色落点",
  wave:"贴地星浪 · 看清来向，跳起来",
  crystal:"弹跳晶弹 · 留意反弹轨迹",
  spiral:"扩散星环 · 从环间空隙穿过",
  pinwheel:"旋转星轮 · 找准扇区空隙",
  wall:"交错星墙 · 找到亮绿的缺口",
  doubleSlam:"连续砸击 · 离开落点，再跳过震波"
};

function buildBoss() {
  return {
    x:613,y:253,hp:bossPhaseHealth*3,max:bossPhaseHealth*3,phase:1,
    round:0,frame:-66,flash:0,cooldown:0,spin:0,counterX:0,
    counter:false,warnings:[],slam:null,orbs:[]
  };
}
function bossPattern(b) {
  const plan=bossPlans[b.phase-1];
  return plan[b.round%plan.length];
}
function updateBossHud(b) {
  ui.bossHud.classList.toggle("rage",b?.phase===3);
  ui.bossHud.classList.toggle("counter",!!b?.counter);
  if (!b) return;
  const elapsed=Math.floor(age/60);
  ui.bossTimer.textContent=Math.floor(elapsed/60)+":"+String(elapsed%60).padStart(2,"0");
  ui.bossFill.style.width=b.hp/b.max*100+"%";
  ui.bossPhase.textContent=["Ⅰ","Ⅱ","Ⅲ 红温"][b.phase-1]+" · "+(b.counter?"可攻击":"护盾开启");
}
function bossOrb(b,x,y,angle,speed,r,color,kind,options={}) {
  b.orbs.push({
    x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
    r,color:b.phase===3?"#ff6582":color,kind,life:options.life??235,
    damage:b.phase===3?2:1,gravity:options.gravity??0,turn:options.turn??0,bounces:options.bounces??0
  });
}
function updateBossOrbs(b,p) {
  b.orbs=b.orbs.filter(o=>{
    if (o.turn) {
      const angle=Math.atan2(o.vy,o.vx)+o.turn;
      const speed=Math.hypot(o.vx,o.vy);
      o.vx=Math.cos(angle)*speed;
      o.vy=Math.sin(angle)*speed;
    }
    o.vy+=o.gravity;
    o.x+=o.vx;
    o.y+=o.vy;
    o.life--;
    if (o.kind==="crystal" && o.y+o.r>=bossFloor && o.vy>0 && o.bounces>0) {
      o.bounces--;
      o.y=bossFloor-o.r;
      o.vy=-o.vy*.81;
      burst(o.x,bossFloor-2,"#c5abf5",4);
    }
    const nearestX=clamp(o.x,p.x,p.x+p.w), nearestY=clamp(o.y,p.y,p.y+p.h);
    if (Math.hypot(nearestX-o.x,nearestY-o.y)<o.r) {
      hit(Math.sign(p.x+p.w/2-o.x)||-1,o.damage);
      return false;
    }
    return o.life>0 && o.x>-36 && o.x<W+36 && o.y>-48 && o.y<bossFloor+o.r;
  });
}
function queueBossWarning(b,warning) {
  b.warnings.push(warning);
  sound("beat");
}
function updateBossWarnings(b) {
  b.warnings=b.warnings.filter(w=>{
    if (--w.time>0) return true;
    if (w.type==="rain") {
      for (const x of w.lanes) bossOrb(b,x,-12,Math.PI/2,6.25,7,"#ffb588","rain",{life:85});
    } else if (w.type==="wave") {
      bossOrb(b,w.dir>0?16:W-16,bossFloor-11,w.dir>0?0:Math.PI,5.9,12,"#ffbf8d","wave",{life:145});
    } else {
      for (const y of w.rows) {
        bossOrb(b,w.dir>0?9:W-9,y,w.dir>0?0:Math.PI,5.15,9,"#ff6582","wall",{life:155});
      }
    }
    return false;
  });
}
function beginBossSlam(b,p,red) {
  b.slam={
    x:clamp(p.x+p.w/2,67,W-67),fromX:b.x,fromY:b.y,
    frame:0,windup:red?53:66,dive:red?22:25,impact:24,radius:red?92:77
  };
  showToast(red?"砸击落点已锁定 · 跳过震波":"砸击落点已锁定 · 跑出橙色区",93);
  sound("beat");
}
function updateBossSlam(b,p) {
  const s=b.slam;
  const f=++s.frame, land=s.windup+s.dive;
  if (f<s.windup) {
    const rise=clamp(f/39,0,1);
    const eased=1-(1-rise)**3;
    b.x=s.fromX+(s.x-s.fromX)*eased;
    b.y=s.fromY+(145-s.fromY)*eased;
  } else if (f<=land) {
    const dive=(f-s.windup)/s.dive;
    b.x=s.x;
    b.y=145+(bossFloor-65-145)*dive**2;
    if (f===land) {
      burst(s.x,bossFloor-6,b.phase===3?"#ff9b88":"#ffcd9c",25);
      sound("land");
      if (Math.abs(p.x+p.w/2-s.x)<s.radius && p.y+p.h>bossFloor-39) {
        hit(Math.sign(p.x+p.w/2-s.x)||-1);
      }
      if (b.phase===3) {
        for (const dir of [-1,1]) {
          bossOrb(b,s.x+dir*(s.radius+8),bossFloor-10,dir<0?Math.PI:0,5.2,10,"#ff7d8c","shock",{life:145});
        }
      }
    }
  } else if (f>land+s.impact) {
    b.slam=null;
  }
}

function updateBossAttack(b,p,pattern,f) {
  switch (pattern) {
    case "fan":
      if (f>=46 && f<=286 && (f-46)%60===0) {
        const aim=Math.atan2(p.y+15-b.y,p.x+10-b.x);
        for (let i=-2;i<=2;i++) bossOrb(b,b.x,b.y,aim+i*.29,3.7,8,"#ff99c9","fan");
      }
      break;
    case "rain":
      if (f>=40 && f<=280 && (f-40)%60===0) {
        const band=((f-40)/60*2+b.round)%8;
        const lanes=[band,(band+3)%8,(band+5)%8].map(i=>48+i*96);
        queueBossWarning(b,{type:"rain",time:32,total:32,lanes});
      }
      break;
    case "slam":
    case "doubleSlam":
      if (f===44 || f===205) beginBossSlam(b,p,pattern==="doubleSlam");
      break;
    case "wave":
      if (f>=35 && f<=275 && (f-35)%60===0) {
        const dir=(f-35)/60%2===0?1:-1;
        queueBossWarning(b,{type:"wave",time:30,total:30,dir});
      }
      break;
    case "crystal":
      if (f>=57 && f<=289 && (f-57)%58===0) {
        const side=Math.sign(p.x+10-b.x)||1;
        for (const i of [0,1]) {
          bossOrb(b,b.x,b.y,side>0?.28+i*.42:Math.PI-.28-i*.42,3.45+i*.34,8,"#c8acff","crystal",{gravity:.155,bounces:3});
        }
      }
      break;
    case "spiral":
      if (f>=65 && f<=289 && (f-65)%56===0) {
        for (let i=0;i<10;i++) {
          bossOrb(b,b.x,b.y,i*Math.PI/5+f*.026,i%2?2.94:3.65,7,"#a6ceff","spiral",{turn:i%2?.004:-.004});
        }
      }
      break;
    case "pinwheel":
      if (f>=52 && f<=286 && (f-52)%26===0) {
        for (let i=0;i<4;i++) {
          if (i===(f-52)/26%4) continue;
          bossOrb(b,b.x,b.y,i*Math.PI/2+b.spin,4.03,8,"#ff6582","pinwheel",{turn:.006});
        }
      }
      break;
    case "wall":
      if (f===37 || f===146 || f===255) {
        const elevated=f===146;
        const rows=elevated?[210,244,277,399]:[216,250,284,318,350];
        queueBossWarning(b,{type:"wall",time:35,total:35,dir:elevated?-1:1,rows,elevated});
      }
      break;
  }
}

function updateBossMotion(b) {
  const range=[171,210,236][b.phase-1];
  const x=b.counter?b.counterX:W/2+Math.cos(age*(.010+b.phase*.0013))*range;
  const y=b.counter?318:244+Math.sin(age*.039)*23;
  b.x+=(x-b.x)*(b.counter?.13:.092);
  b.y+=(y-b.y)*.115;
}
function updateBoss() {
  const b=scene.boss, p=player;
  const f=++b.frame;
  if (b.flash>0) b.flash--;
  if (b.cooldown>0) b.cooldown--;
  if (b.phase===3) b.spin=(b.spin+.123)%(Math.PI*2);
  if (f===0) {
    showToast(bossTelegraphs[bossPattern(b)],137);
    sound("beat");
  }
  if (f===bossAssaultFrames) {
    b.counter=true;
    b.counterX=clamp(b.x,125,W-125);
    b.warnings=[];
    b.orbs=[];
    b.slam=null;
    showToast("护盾解除 · 瞄准反击！",bossCounterFrames);
    sound("save");
    updateBossHud(b);
  } else if (f>=bossAssaultFrames+bossCounterFrames) {
    b.frame=-1;
    b.counter=false;
    b.round++;
    updateBossHud(b);
  }
  if (!b.slam) updateBossMotion(b);
  if (f>=0 && f<bossAssaultFrames) {
    updateBossAttack(b,p,bossPattern(b),f);
    if (b.slam) updateBossSlam(b,p);
    updateBossWarnings(b);
    updateBossOrbs(b,p);
  }
  if (age%60===0) updateBossHud(b);
}

function hitBoss(shot,box) {
  const b=scene.boss;
  if (!overlap(box,{x:b.x-46,y:b.y-43,w:92,h:91})) return false;
  if (!b.counter || b.cooldown>0) {
    burst(shot.x,shot.y,b.counter?"#e1acdc":"#bca3f6",3);
    return true;
  }
  b.hp--;
  b.flash=6;
  b.cooldown=bossHitInterval;
  burst(shot.x,shot.y,"#ffd1e4",5);
  sound("hit");
  if (b.hp===0) {
    updateBossHud(b);
    finishLevel();
  } else {
    if (b.phase<3 && b.hp===bossPhaseHealth*(3-b.phase)) {
      b.phase++;
      b.round=0;
      b.frame=-76;
      b.counter=false;
      b.orbs=[];
      b.warnings=[];
      player.hp=Math.min(player.max,player.hp+1);
      showToast(b.phase===3?"红温旋转 · 每发弹幕扣两颗心！":"第二阶段 · 星铃守卫加快移动",150);
      sound("save");
      refreshHud();
    } else updateBossHud(b);
  }
  return true;
}

function drawBossWarnings(c,b,t) {
  for (const w of b.warnings) {
    const progress=1-w.time/w.total;
    if (w.type==="rain") {
      for (const x of w.lanes) {
        c.globalAlpha=.12+progress*.19;
        rect(c,x-13,0,26,bossFloor,"#ff9c9d");
        c.globalAlpha=1;
        rect(c,x-13,bossFloor-5,26,5,"#ffc0a6");
        polygon(c,[[x-6,24],[x+6,24],[x,34]],"#ffcab0");
      }
    } else if (w.type==="wave") {
      const x=w.dir>0?26:W-26;
      c.globalAlpha=.6+progress*.3;
      rect(c,x-22,bossFloor-6,44,6,"#ffc896");
      polygon(c,[[x-w.dir*10,bossFloor-26],[x+w.dir*11,bossFloor-16],[x-w.dir*10,bossFloor-7]],"#ffe1a9");
      c.globalAlpha=1;
    } else {
      const edge=w.dir>0?16:W-16;
      const safeY=w.elevated?291:367;
      rect(c,edge-8,safeY,16,w.elevated?82:35,"#c8f6a8");
      for (const y of w.rows) {
        c.globalAlpha=.29+progress*.5;
        rect(c,edge-8,y-4,16,8,"#ff849d");
        rect(c,0,y-1,W,2,"#e1648b38");
      }
      c.globalAlpha=1;
    }
  }
  const slam=b.slam;
  if (!slam) return;
  const {x,radius,windup,dive,frame}=slam;
  const remaining=clamp(1-frame/(windup+dive),0,1);
  c.globalAlpha=.22+(1-remaining)*.46;
  rect(c,x-radius,bossFloor-12,radius*2,12,"#ff935f");
  c.globalAlpha=1;
  rect(c,x-radius,bossFloor-7,radius*2,3,"#ffb580");
  rect(c,x-radius,bossFloor-20,4,20,"#ffca8b");
  rect(c,x+radius-4,bossFloor-20,4,20,"#ffca8b");
  const arrowY=bossFloor-46+Math.round(Math.sin(t*.2)*4);
  polygon(c,[[x-9,arrowY],[x+9,arrowY],[x,arrowY+12]],"#ffe4a5");
}

function drawBoss(t) {
  const b=scene.boss;
  if (b.hp<=0) return;
  const {x,y}=b, red=b.phase===3;
  const floatingY=mode==="title"?y+Math.sin(t*.042)*7:y;
  drawBossWarnings(ctx,b,t);
  ctx.globalAlpha=.26;
  rect(ctx,x-62,bossFloor-9,124,8,"#211632");
  ctx.globalAlpha=1;
  for (let i=0;i<6;i++) {
    const a=i*Math.PI/3+t*.016+(red?b.spin*.75:0);
    sparkle(ctx,x+Math.cos(a)*86,floatingY+Math.sin(a)*82,i%2===0?6:4,
      red?"#ff6a85":b.counter?"#ffe0a5":i%2===0?"#fab6e6":"#d4bbff");
  }
  if (bossImage.complete && bossImage.naturalWidth>0) {
    ctx.save();
    ctx.translate(x,floatingY);
    if (red) ctx.rotate(b.spin);
    ctx.imageSmoothingEnabled=true;
    ctx.globalAlpha=b.flash?.64:1;
    if (red) { ctx.shadowColor="#fb325b"; ctx.shadowBlur=15; }
    ctx.drawImage(red && enragedBossImage?enragedBossImage:bossImage,-65,-67,130,134);
    ctx.restore();
  }
  if (!b.counter && mode!=="title") {
    ctx.beginPath();
    ctx.ellipse(x,floatingY,75,78,0,0,Math.PI*2);
    ctx.strokeStyle=red?"#ff8198b5":"#dbb3eb8a";
    ctx.lineWidth=2;
    ctx.stroke();
  }
  for (const o of b.orbs) {
    if (o.kind==="rain" || o.kind==="wave" || o.kind==="shock") {
      rect(ctx,o.x-o.vx*.8-o.r*.56,o.y-o.vy*.85-o.r*.47,o.r*1.12,o.r*.94,o.color+"86");
    }
    if (o.kind==="crystal") {
      polygon(ctx,[[o.x,o.y-o.r],[o.x+o.r,o.y],[o.x,o.y+o.r],[o.x-o.r,o.y]],o.color);
    } else {
      rect(ctx,o.x-o.r*.66,o.y-o.r,o.r*1.32,o.r*2,o.color);
      rect(ctx,o.x-o.r,o.y-o.r*.66,o.r*2,o.r*1.32,o.color);
    }
    sparkle(ctx,o.x,o.y,Math.max(3,o.r-3),"#fff3d5");
  }
}
