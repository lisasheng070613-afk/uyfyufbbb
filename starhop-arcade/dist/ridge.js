"use strict";

const summitAttacks=["charge","slam","charge","slam","charge","slam"];
const summitSlamRadius=71;

function buildRidge(data,ledges) {
  const arena=ledges.at(-1);
  const elite={
    x:arena.x+arena.w-92,y:arena.y,stage:"waiting",frame:0,attack:0,
    from:0,target:0,dir:-1,shieldFlash:0,impact:0,key:null
  };
  const drakes=data.drakes.map(([x,y,range],i)=>({
    x,y,baseX:x,baseY:y,range,phase:i*1.94,w:36,h:23,
    dir:i%2?-1:1,hp:2,cooldown:48+i*19,warning:0,flash:0
  }));
  return {...data,arena,elite,drakes,rocks:[]};
}

function setRidgeCheckpoint(save) {
  if (checkpoint && checkpoint[1]<=save[1]) return;
  checkpoint=save;
  player.hp=player.max;
  refreshHud();
  showToast("攀登检查点 · 生命恢复",120);
  sound("save");
  burst(save[0],save[1]-32,"#e6ffa8",14);
}

function refreshRidgeHud() {
  if (!scene.ridge) {
    ui.ridgeHud.hidden=true;
    return;
  }
  const {elite}=scene.ridge;
  const eliteActive=elite.stage!=="waiting";
  const label=eliteActive?"山脊牛头人":"攀登高度";
  const value=elite.stage==="key"?"拾取钥匙":elite.stage==="exit"?"前往高塔":
    eliteActive?elite.attack+" / "+summitAttacks.length:
    Math.round(clamp((scene.ground[0].y-player.y-player.h)/10,0,147))+" m";
  ui.ridgeHud.hidden=mode==="title";
  ui.ridgeHud.classList.toggle("elite",eliteActive);
  if (ui.ridgeLabel.textContent!==label) ui.ridgeLabel.textContent=label;
  if (ui.ridgeValue.textContent!==value) ui.ridgeValue.textContent=value;
}

function updateRidge() {
  const ridge=scene.ridge;
  const p=player;
  if (p.on===ridge.arena && ridge.elite.stage==="waiting") {
    setRidgeCheckpoint(ridge.checkpoints.at(-1));
    ridge.elite.stage="intro";
    ridge.rocks=[];
    showToast("山脊牛头人 · 撑过六次攻击，拿到钥匙",142);
    sound("save");
  }
  if (ridge.elite.stage!=="waiting") {
    updateSummit(ridge);
  } else {
    for (const save of ridge.checkpoints) {
      if (p.on?.y===save[1] && Math.abs(p.x+p.w/2-save[0])<40) setRidgeCheckpoint(save);
    }
    updateDrakes(ridge);
    updateRidgeRocks(ridge);
  }
  refreshRidgeHud();
}

function updateDrakes(ridge) {
  const p=player;
  for (const drake of ridge.drakes) {
    if (drake.hp===0) continue;
    if (drake.flash>0) drake.flash--;
    const near=Math.abs(drake.y-p.y)<250 && Math.abs(drake.x-p.x)<275;
    if (drake.warning>0) {
      if (--drake.warning===0) {
        ridge.rocks.push({x:drake.x+drake.w/2,y:drake.y+drake.h,vy:1.45});
        drake.cooldown=120;
      }
    } else {
      const x=drake.baseX+Math.sin(age*.022+drake.phase)*drake.range;
      drake.dir=Math.sign(x-drake.x)||drake.dir;
      drake.x=x;
      drake.y=drake.baseY+Math.sin(age*.05+drake.phase)*13;
      if (near && --drake.cooldown<=0) drake.warning=28;
    }
    if (overlap(p,drake)) hit(Math.sign(p.x-drake.x)||-1);
  }
}

function updateRidgeRocks(ridge) {
  const p=player;
  ridge.rocks=ridge.rocks.filter(rock=>{
    const before=rock.y;
    rock.vy=Math.min(11,rock.vy+.34);
    rock.y+=rock.vy;
    if (overlap(p,{x:rock.x-8,y:rock.y-8,w:16,h:16})) {
      hit(Math.sign(p.x+p.w/2-rock.x)||-1);
      return false;
    }
    const land=scene.solids.some(s=>rock.x>=s.x && rock.x<s.x+s.w && before+7<=s.y && rock.y+7>=s.y);
    if (land) burst(rock.x,rock.y,"#a9b3c3",5);
    return !land && rock.y<scene.height+25;
  });
}

function summitBody(elite) {
  return {x:elite.x-28,y:elite.y-70,w:56,h:70};
}

function hitRidgeTarget(box) {
  const ridge=scene.ridge;
  const drake=ridge.drakes.find(enemy=>enemy.hp>0 && overlap(box,enemy));
  if (drake) {
    drake.hp--;
    drake.flash=8;
    if (drake.hp===0) drake.warning=0;
    burst(box.x+5,box.y+3,"#a9efa5",drake.hp?5:13);
    sound("hit");
    return true;
  }
  const b=ridge.elite;
  if (b.stage!=="waiting" && b.stage!=="key" && b.stage!=="exit" && overlap(box,summitBody(b))) {
    b.shieldFlash=8;
    burst(box.x+5,box.y+3,"#f4d896",5);
    sound("hit");
    return true;
  }
  return false;
}

function nextSummitAttack(ridge) {
  const b=ridge.elite, a=ridge.arena, p=player;
  b.frame=0;
  if (b.attack===summitAttacks.length) {
    b.stage="key";
    b.key={x:clamp(b.x-36,a.x+50,a.x+a.w-50),y:a.y-25};
    burst(b.x-20,a.y-35,"#ffd58e",23);
    showToast("盾牌碎裂 · 拾取山脊钥匙",225);
    sound("clear");
    return;
  }
  b.from=b.x;
  if (summitAttacks[b.attack]==="charge") {
    const center=a.x+a.w/2;
    b.dir=b.x>center?-1:1;
    b.target=b.dir<0?a.x+38:a.x+a.w-38;
    b.stage="chargeCue";
    showToast("冲撞预警 · 看准时机跳过去！",102);
  } else {
    b.target=clamp(p.x+p.w/2,a.x+56,a.x+a.w-56);
    b.dir=Math.sign(b.target-b.x)||b.dir;
    b.stage="slamCue";
    showToast("砸击预警 · 离开橙色落点！",105);
  }
  sound("beat");
}

function finishSummitAttack(b) {
  b.attack++;
  b.stage="recover";
  b.frame=0;
}

function updateSummit(ridge) {
  const a=ridge.arena, b=ridge.elite, p=player;
  b.frame++;
  if (b.shieldFlash>0) b.shieldFlash--;
  if (b.impact>0) b.impact--;
  switch (b.stage) {
    case "intro":
      if (b.frame>=74) nextSummitAttack(ridge);
      break;
    case "chargeCue":
      if (b.frame>=61) { b.stage="charge"; b.frame=0; }
      break;
    case "charge":
      b.x+=b.dir*Math.min(11.8,Math.abs(b.target-b.x));
      if (overlap(p,summitBody(b))) hit(b.dir);
      if (Math.abs(b.target-b.x)<.01) finishSummitAttack(b);
      break;
    case "slamCue":
      if (b.frame>=59) { b.stage="slam"; b.frame=0; }
      break;
    case "slam": {
      const portion=Math.min(1,b.frame/40);
      b.x=b.from+(b.target-b.from)*portion;
      b.y=a.y-480*portion*(1-portion);
      if (portion===1) {
        b.impact=22;
        burst(b.x,a.y-4,"#f3ba89",17);
        sound("land");
        if (Math.abs(p.x+p.w/2-b.x)<summitSlamRadius && p.y+p.h>a.y-29) {
          hit(Math.sign(p.x+p.w/2-b.x)||-1);
        }
        finishSummitAttack(b);
      }
      break;
    }
    case "recover":
      if (b.frame>=39) nextSummitAttack(ridge);
      break;
    case "key":
      if (Math.abs(p.x+p.w/2-b.key.x)<25 && Math.abs(p.y+16-b.key.y)<38) {
        burst(b.key.x,b.key.y,"#ffdf9d",24);
        b.stage="exit";
        b.frame=0;
        b.key=null;
        showToast("拿到山脊钥匙 · 即将进入星轨高塔",100);
        sound("save");
      }
      break;
    case "exit":
      if (b.frame>=70) finishLevel(true);
      break;
  }
}

function ridgeScenery(c,camX,camY,t) {
  const high=1-clamp(camY/1450,0,1);
  const sky=c.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,high>.5?"#17224a":"#263b68");
  sky.addColorStop(.53,"#47628d");
  sky.addColorStop(1,"#9dbbce");
  c.fillStyle=sky;
  c.fillRect(0,0,W,H);
  for (let i=0;i<43;i++) {
    const x=((i*137-Math.floor(camX*.13))%W+W)%W;
    const y=((i*67-camY*.065)%288+288)%288;
    c.globalAlpha=.18+.29*(Math.sin(t*.03+i)+1)/2;
    if (i%9===0) sparkle(c,x,y,5,"#e6f5ff");
    else rect(c,x,y,i%3===0?3:2,2,"#dee9fb");
  }
  c.globalAlpha=1;
  const mx=584-camX*.18, my=99+camY*.13;
  for (let dy=-52;dy<52;dy+=4) {
    const span=Math.floor(Math.sqrt(52*52-dy*dy)/4)*4;
    rect(c,mx-span,my+dy,2*span,4,dy>=28?"#b1c9e1":"#d7e5ef");
  }
  for (let layer=0;layer<2;layer++) {
    const width=175-layer*22, base=488-camY*(.095+layer*.048);
    for (let i=-1;i<6;i++) {
      const x=i*width-camX*(.12+layer*.22), top=base-143-Math.abs((i*71+layer*43)%110);
      polygon(c,[[x-87,base],[x+15,top+46],[x+50,top],[x+67,top],[x+103,top+62],[x+231,base+72],[x+231,H],[x-87,H]],
        layer?"#526c99":"#758bb4");
      polygon(c,[[x+14,top+48],[x+50,top],[x+67,top],[x+103,top+62],[x+61,top+32],[x+46,top+38]],
        layer?"#90adc7":"#aec1d7");
    }
  }
  for (let i=0;i<13;i++) {
    const x=((i*171+t*.17-camX*.28)%957+957)%957-130;
    const y=((195+i*52-camY*.36)%530+530)%530-25;
    c.globalAlpha=i%2?.21:.31;
    rect(c,x,y,155+(i%3)*31,5,"#bcd7ed");
    rect(c,x+24,y-6,111,6,"#cbdef1");
    rect(c,x+48,y+5,128,3,"#a5c8e7");
  }
  c.globalAlpha=1;
  const silhouette=[[116,388],[221,377],[319,387],[377,374],[500,379],[575,386],[804,388],[760,466],[809,533],[747,642],
    [765,784],[657,913],[700,1013],[799,1106],[819,1265],[763,1338],[834,1499],[772,1604],[885,1791],[918,1930],
    [8,1930],[26,1754],[134,1644],[109,1522],[158,1423],[69,1288],[63,1190],[177,1101],[143,985],[245,849],[166,716],
    [178,622],[100,542],[159,461]];
  const middle=[[221,389],[440,416],[475,501],[408,593],[507,748],[394,873],[445,1051],[350,1209],[467,1328],
    [384,1488],[446,1732],[530,1930],[8,1930],[26,1754],[134,1644],[109,1522],[158,1423],[69,1288],
    [63,1190],[177,1101],[143,985],[245,849],[166,716],[178,622],[100,542],[159,461]];
  const worldPolygon=(points,color)=>polygon(c,points.map(([x,y])=>[x-camX,y-camY]),color);
  worldPolygon(silhouette,"#3e537f");
  worldPolygon(middle,"#4d6791");
  worldPolygon([[319,387],[377,374],[500,379],[575,386],[804,388],[733,424],[647,422],[583,455],[556,414],[455,443],[420,412],[291,418]],"#91adc7");
  for (let i=Math.max(0,Math.floor((camY-40)/71));i<(camY+H)/71+1;i++) {
    const y=i*71+24-camY, x=200+(i*137)%440-camX;
    rect(c,x,y,61+(i%3)*22,4,"#6484aa");
    rect(c,x+19,y+4,44,3,"#536f99");
    rect(c,x+16,y+20,34,3,"#7393b5");
  }
}

function drawRidgeShelf(c,s,camX,camY,summit) {
  const x=s.x-camX,y=s.y-camY;
  if (y<-55 || y>H+40 || x+s.w<0 || x>W) return;
  const thick=s.ground?H: summit?49:31;
  const end=x+s.w;
  polygon(c,[[x,y],[end,y],[end,y+thick-11],[end-13,y+thick-11],[end-21,y+thick],[x+17,y+thick],[x,y+thick-13]],"#26395d");
  rect(c,x,y,s.w,6,summit?"#eff7ff":"#ccedf5");
  rect(c,x,y+6,s.w,6,"#8dbbd5");
  if (summit) rect(c,x,y+13,s.w,3,"#5b80aa");
  for (let offset=0;offset<s.w;offset+=26) {
    const left=x+offset, w=Math.min(26,s.w-offset);
    rect(c,left,y+12,Math.min(17,w),6,"#617da7");
    rect(c,left+4,y+18,Math.max(0,Math.min(w-4,7)),4,"#526b92");
    if (summit) {
      rect(c,left+3,y+27,Math.max(0,Math.min(w-3,18)),4,"#48658f");
      rect(c,left+8,y+33,4,6,"#56759a");
    }
    if (!summit && !s.ground && offset%52===26 && w>=17) {
      rect(c,left+7,y+6,5,9,"#bbdeef");
      rect(c,left+7,y+14,2,5,"#bbdeef");
    }
  }
}

function drawRidgeTerrain(c,ridge,camX,camY,t) {
  ridgeScenery(c,camX,camY,t);
  drawRidgeShelf(c,scene.ground[0],camX,camY,false);
  for (const s of scene.ledges) drawRidgeShelf(c,s,camX,camY,s===ridge.arena);
  const a=ridge.arena, y=a.y-camY;
  if (y>=0 && y<H+24) {
    for (const x of [a.x+10,a.x+a.w-15]) {
      rect(c,x-camX,y-37,5,36,"#282f58");
      rect(c,x-camX-4,y-39,13,4,"#afcbd7");
      rect(c,x-camX-2,y-43,10,5,"#ffe5a4");
      sparkle(c,x-camX+3,y-44+Math.sin(t*.12)*2,5,"#ffd591");
    }
  }
}

function drawDrake(c,e,camX,camY,t) {
  if (!e.hp) return;
  const x=e.x-camX+e.w/2, y=e.y-camY+e.h/2;
  if (x<-40 || x>W+40 || y<-45 || y>H+45) return;
  const wing=e.warning?0:(Math.floor(t/5)%2===0?-8:4);
  c.save();
  c.translate(Math.round(x),Math.round(y));
  c.scale(e.dir,1);
  const edge="#20354b", green=e.flash?"#dcffc6":"#62ad72", wingGreen="#3d835f";
  polygon(c,[[-8,2],[-16,wing-11],[-26,wing-9],[-27,wing-2],[-20,wing-3],[-16,wing+1],[-11,wing+3]],edge);
  polygon(c,[[-9,0],[-17,wing-8],[-24,wing-7],[-20,wing-5],[-16,wing-1]],wingGreen);
  polygon(c,[[-10,4],[-16,8],[-22,6],[-25,8],[-18,12],[-12,10],[-7,7]],edge);
  rect(c,-14,-3,27,14,edge);
  rect(c,-11,-1,22,9,green);
  rect(c,-6,5,15,4,"#afd697");
  rect(c,5,-9,15,15,edge);
  rect(c,8,-6,10,9,green);
  rect(c,11,-12,4,6,"#9fda88");
  rect(c,18,-3,5,7,edge);
  rect(c,16,-1,6,3,"#93c783");
  rect(c,13,-5,3,3,"#fff4a8");
  rect(c,14,-4,2,2,"#262d43");
  rect(c,-4,7,3,6,"#376d61");
  rect(c,5,7,3,6,"#376d61");
  c.restore();
  if (e.warning) {
    sparkle(c,x,y-19,5,"#ffe399");
    rect(c,x-2,y+16,4,4,"#f2c290");
    rect(c,x-1,y+23,2,6,"#e5b68b");
  }
}

function drawRidgeRock(c,rock,camX,camY) {
  const x=rock.x-camX,y=rock.y-camY;
  rect(c,x-2,y-16,4,8,"#a2b5cb");
  rect(c,x-7,y-4,14,9,"#3b405b");
  rect(c,x-4,y-7,8,15,"#3b405b");
  rect(c,x-5,y-4,8,7,"#77849d");
  rect(c,x-2,y-5,5,3,"#b7c0cf");
}

function drawSummitKey(c,x,y,size=1) {
  c.save();
  c.translate(Math.round(x),Math.round(y));
  c.scale(size,size);
  rect(c,-8,-6,10,12,"#663e54");
  rect(c,-6,-4,6,8,"#ffe196");
  rect(c,-4,-2,2,4,"#8e5263");
  rect(c,0,-2,10,4,"#f4bc63");
  rect(c,5,1,3,4,"#f4bc63");
  rect(c,9,0,2,3,"#ffdf95");
  c.restore();
}

function drawMinotaur(c,b,a,camX,camY,t) {
  if (b.stage==="waiting") return;
  const y=a.y-camY, x=b.x-camX;
  if (b.stage==="chargeCue" || b.stage==="charge") {
    const start=Math.min(b.x,b.target)-camX, end=Math.max(b.x,b.target)-camX;
    const lit=b.stage==="chargeCue"?b.frame:61;
    c.globalAlpha=.26+lit*.006;
    rect(c,start,y-6,end-start,6,"#ff6674");
    c.globalAlpha=1;
    for (let xx=start+17;xx<end-12;xx+=34) {
      polygon(c,[[xx-6*b.dir,y-14],[xx+4*b.dir,y-8],[xx-6*b.dir,y-2]],"#ffd098");
    }
  }
  if (b.stage==="slamCue" || b.stage==="slam" || b.impact) {
    const center=b.target-camX, bright=(b.impact?b.impact:12);
    c.globalAlpha=.23+bright*.018;
    rect(c,center-summitSlamRadius,y-8,summitSlamRadius*2,8,"#ffad69");
    c.globalAlpha=1;
    rect(c,center-summitSlamRadius,y-8,3,8,"#ffdb91");
    rect(c,center+summitSlamRadius-3,y-8,3,8,"#ffdb91");
    polygon(c,[[center-8,y-23],[center+8,y-23],[center,y-12]],"#ffe09d");
    if (b.impact) {
      rect(c,center-30-(22-b.impact)*3,y-16,13,3,"#ffe1b4");
      rect(c,center+17+(22-b.impact)*3,y-16,13,3,"#ffe1b4");
    }
  }

  const fallen=b.stage==="key" || b.stage==="exit";
  const step=b.stage==="charge"?(Math.floor(t/3)%2===0?-5:5):0;
  const pose=b.stage==="slam" || b.stage==="slamCue"?-11:0;
  const outline="#352536", rust="#8d4c4c", dark="#673942", red="#be6656", high="#db8b68";
  rect(c,x-32,y-4,64,4,"#36466f");
  c.save();
  c.translate(Math.round(x),Math.round(b.y-camY+(fallen?13:0)));
  if (fallen) c.globalAlpha=.74;
  rect(c,-22,-25,19,22+step,outline);
  rect(c,3,-25,19,22-step,outline);
  rect(c,-19,-25,14,17+step,rust);
  rect(c,6,-25,14,17-step,dark);
  rect(c,-26,-8+step,22,8,outline);
  rect(c,5,-8-step,22,8,outline);
  rect(c,-24,-5+step,15,3,"#6f4a49");
  rect(c,9,-5-step,16,3,"#6f4a49");
  polygon(c,[[-26,-57],[-17,-62],[20,-62],[30,-53],[24,-30],[18,-18],[-19,-18],[-27,-34]],outline);
  polygon(c,[[-22,-55],[-16,-59],[17,-59],[26,-51],[18,-30],[16,-23],[-14,-23],[-19,-31]],rust);
  rect(c,-15,-57,14,13,red);
  rect(c,2,-57,14,13,red);
  rect(c,-16,-42,32,4,dark);
  rect(c,-14,-32,28,6,"#553444");
  rect(c,-5,-33,10,8,"#ecb16c");
  rect(c,-2,-31,4,4,"#774456");

  // In the front-facing sprite the axe is in his left hand and the shield is in his right.
  polygon(c,[[17,-56],[28,-57],[37,-45+pose],[42,-41+pose],[39,-32+pose],[30,-34+pose],[22,-42]],outline);
  rect(c,27,-47+pose,10,9,red);
  rect(c,35,-42+pose,6,8,high);
  rect(c,37,-67+pose,5,51,outline);
  rect(c,38,-66+pose,3,46,"#b8785b");
  polygon(c,[[31,-72+pose],[45,-73+pose],[54,-79+pose],[59,-72+pose],[60,-57+pose],[54,-52+pose],[44,-60+pose],[31,-61+pose]],outline);
  polygon(c,[[42,-70+pose],[54,-76+pose],[57,-70+pose],[57,-58+pose],[53,-55+pose],[43,-62+pose]],"#bcadad");
  rect(c,52,-70+pose,4,10,"#e7d6c6");

  polygon(c,[[-20,-69],[-28,-71],[-34,-78],[-36,-91],[-31,-90],[-27,-81],[-18,-80]],outline);
  polygon(c,[[18,-80],[27,-81],[32,-90],[37,-91],[35,-78],[29,-71],[20,-69]],outline);
  polygon(c,[[-21,-73],[-27,-74],[-31,-80],[-33,-87],[-30,-86],[-26,-79],[-21,-78]],"#f2d9b1");
  polygon(c,[[21,-78],[27,-79],[31,-86],[34,-87],[32,-80],[28,-74],[21,-73]],"#efd0a3");
  rect(c,-22,-78,44,23,outline);
  rect(c,-17,-82,34,6,outline);
  rect(c,-18,-76,36,20,red);
  rect(c,-12,-78,24,5,rust);
  rect(c,-17,-69,16,5,dark);
  rect(c,1,-69,16,5,dark);
  rect(c,-10+2*b.dir,-67,4,3,"#ffde7b");
  rect(c,7+2*b.dir,-67,4,3,"#ffde7b");
  rect(c,-13,-61,26,13,outline);
  rect(c,-10,-61,20,10,high);
  rect(c,-6,-57,4,3,dark);
  rect(c,3,-57,4,3,dark);

  if (!fallen) {
    const rim=b.shieldFlash?"#fff1be":"#d9976a";
    polygon(c,[[-43,-51],[-24,-58],[-9,-49],[-10,-26],[-18,-18],[-29,-15],[-40,-25]],outline);
    polygon(c,[[-39,-49],[-24,-54],[-13,-47],[-14,-28],[-20,-22],[-29,-19],[-37,-27]],rim);
    polygon(c,[[-36,-46],[-25,-50],[-16,-45],[-17,-30],[-22,-25],[-29,-23],[-34,-29]],"#864a54");
    rect(c,-37,-44,3,4,"#f7c08b");
    rect(c,-20,-29,3,4,"#f7c08b");
    drawSummitKey(c,-26,-37,.7);
  } else {
    polygon(c,[[-41,-31],[-30,-36],[-24,-29],[-30,-21],[-37,-23]],"#b47768");
    polygon(c,[[-20,-26],[-14,-31],[-12,-20],[-20,-17]],"#995f61");
    c.globalAlpha=1;
  }
  c.restore();
  if (b.key) {
    const kx=b.key.x-camX,ky=b.key.y-camY+Math.sin(t*.11)*4;
    sparkle(c,kx-12,ky-10,5,"#ffeab2");
    drawSummitKey(c,kx,ky,1.65);
  }
}

function drawRidgeActors(c,ridge,camX,camY,t) {
  for (const e of ridge.drakes) drawDrake(c,e,camX,camY,t);
  for (const rock of ridge.rocks) drawRidgeRock(c,rock,camX,camY);
  drawMinotaur(c,ridge.elite,ridge.arena,camX,camY,t);
}
