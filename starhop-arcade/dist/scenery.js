"use strict";

function sceneRepeats(cam,spacing,parallax,draw,margin=130) {
  const offset=cam*parallax;
  for (let i=Math.floor((offset-margin)/spacing);i*spacing<offset+W+margin;i++) {
    draw(i*spacing-offset,i);
  }
}
function sceneLine(c,points,color,width=1) {
  c.strokeStyle=color;
  c.lineWidth=width;
  c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));
  c.stroke();
}
function skyDust(c,cam,t,color,count,speed,top=53,span=330) {
  for (let i=0;i<count;i++) {
    const x=((i*229+t*speed-cam*.19)%W+W)%W;
    const y=top+((i*113+t*.10)%span+span)%span;
    c.globalAlpha=.25+.24*(Math.sin(t*.056+i*5)+1)/2;
    rect(c,x,y,i%4?2:4,i%4?2:3,color);
  }
  c.globalAlpha=1;
}
function softBeam(c,x,y,w,h,color) {
  const rays=c.createLinearGradient(x,y,x+w*.7,y+h);
  rays.addColorStop(0,color+"19");
  rays.addColorStop(.52,color+"0d");
  rays.addColorStop(1,color+"00");
  c.fillStyle=rays;
  c.beginPath();
  c.moveTo(x,y);
  c.lineTo(x+w*.42,y);
  c.lineTo(x+w,y+h);
  c.lineTo(x+w*.59,y+h);
  c.closePath();
  c.fill();
}
function distantMeadow(c,cam,t) {
  c.globalAlpha=.72;
  sceneRepeats(cam,213,.37,(x,i)=>{
    const y=341+(Math.abs(i*31)%40);
    const pale=i%2===0;
    if (pale) {
      polygon(c,[[x-65,y+8],[x-32,y-8],[x+5,y-16],[x+52,y-16],[x+85,y],[x+76,y+11],[x+32,y+14]],"#745488");
      rect(c,x-18,y-44,11,45,"#5d477b");
      rect(c,x+19,y-44,11,45,"#5c4379");
      polygon(c,[[x-19,y-45],[x-15,y-55],[x+1,y-64],[x+15,y-64],[x+30,y-52],[x+30,y-42],[x+20,y-42],[x+13,y-52],[x+2,y-54],[x-6,y-48],[x-7,y-44]],"#7f5c89");
      rect(c,x-15,y-43,6,4,"#af83a0");
      rect(c,x+21,y-34,4,7,"#a47a9c");
    }
    for (let j=0;j<8;j++) {
      const px=x-45+j*13, py=y+22+Math.abs((j*11+i*3)%21);
      rect(c,px,py-7,2,9,pale?"#a08caa":"#8c7b9d");
      rect(c,px-2,py-8,5,2,j%3?"#c08eae":"#e4baac");
    }
  });
  c.globalAlpha=1;
  skyDust(c,cam,t,"#f8daa8",35,.46,138,255);
}
function forestTree(c,x,bottom,scale,n,colors) {
  c.save();
  c.translate(Math.round(x),Math.round(bottom));
  c.scale(scale,scale);
  const [shade,bark,edge,leaves]=colors;
  polygon(c,[[-25,6],[-14,-23],[-12,-138],[-6,-237],[5,-244],[12,-143],[17,-22],[29,6]],shade);
  polygon(c,[[-9,-223],[-3,-235],[3,-145],[7,-19],[13,4],[-3,3],[-4,-132]],bark);
  polygon(c,[[-6,-170],[-24,-193],[-45,-208],[-48,-219],[-25,-209],[-5,-192],[3,-179]],shade);
  polygon(c,[[6,-152],[29,-174],[53,-181],[60,-190],[58,-176],[29,-163],[10,-140]],shade);
  rect(c,-9,-131,3,48,edge);
  rect(c,2,-86,3,33,edge);
  rect(c,-6,-28,3,17,edge);
  for (let j=0;j<5;j++) {
    const xx=-49+j*24, yy=-223+Math.abs((j*23+n*11)%36)-26;
    polygon(c,[[xx-20,yy+12],[xx-15,yy-7],[xx-2,yy-16],[xx+17,yy-14],[xx+26,yy-2],[xx+22,yy+14],[xx+8,yy+20],[xx-13,yy+20]],leaves);
    rect(c,xx-7,yy-9,18,3,bark);
    if (j%2) rect(c,xx+8,yy+13,2,20+j*2,edge);
  }
  c.restore();
}
function forestScenery(c,cam,t) {
  const dusk=clamp((cam-1780)/800,0,1);
  c.globalAlpha=.48;
  sceneRepeats(cam,77,.27,(x,i)=>{
    forestTree(c,x,368+(Math.abs(i*13)%17),.66+(Math.abs(i*19)%5)*.08,i,["#235453","#377163","#56806d","#366c64"]);
  });
  c.globalAlpha=.83;
  sceneRepeats(cam,169,.63,(x,i)=>{
    const scale=.95+(Math.abs(i*19)%7)*.075;
    forestTree(c,x,391+(Math.abs(i*13)%31),scale,i,["#25444e","#39615b","#51786b","#2b5655"]);
  });
  c.globalAlpha=1;
  for (const x of [122,396,645]) softBeam(c,x-cam*.06%90,-10,153,403,"#e7f5bd");
  if (dusk) {
    c.globalAlpha=dusk*.65;
    const fog=c.createLinearGradient(0,0,0,H);
    fog.addColorStop(0,"#271f45b5");
    fog.addColorStop(.78,"#47375744");
    fog.addColorStop(1,"#3b2c4a78");
    c.fillStyle=fog;
    c.fillRect(0,0,W,H);
    sceneRepeats(cam,254,.67,(x,i)=>{
      if (i%3===0) return;
      const y=127+Math.abs(i*47)%97;
      const width=61+Math.abs(i*7)%39;
      const tip=[x+width*.51,y+39];
      const left=[x,y-7], top=[x+width*.45,y-20], right=[x+width,y-3];
      sceneLine(c,[left,tip,right,top,left],"#bc9ab6",1);
      for (const point of [left,top,right]) {
        sceneLine(c,[tip,point],"#b195ac",1);
      }
      for (const r of [.36,.68,.9]) {
        sceneLine(c,[left,top,right].map(([xx,yy])=>[tip[0]+(xx-tip[0])*r,tip[1]+(yy-tip[1])*r]),"#c2a4b2",1);
      }
      rect(c,tip[0],tip[1],1,17,"#d8b8c7");
      rect(c,tip[0]-2,tip[1]+16,5,4,"#c3a3b5");
    });
    c.globalAlpha=1;
  }
  skyDust(c,cam,t,dusk>.5?"#c9b3dc":"#e5ed9f",44,.31,115,267);
}
function crystalShape(c,x,y,size,colors) {
  const [shade,mid,light]=colors;
  polygon(c,[[x-size*.4,y],[x-size*.42,y-size*.5],[x-size*.16,y-size],[x+size*.21,y-size*.8],[x+size*.47,y-size*.35],[x+size*.29,y]],shade);
  polygon(c,[[x-size*.36,y],[x-size*.37,y-size*.5],[x-size*.15,y-size*.93],[x+size*.05,y-size*.46],[x-size*.02,y]],mid);
  polygon(c,[[x-size*.15,y-size*.93],[x+size*.17,y-size*.78],[x+size*.38,y-size*.36],[x+size*.05,y-size*.46]],light);
  rect(c,x-size*.25,y-size*.41,Math.max(2,size*.064),Math.max(3,size*.23),light);
}
function mineDetails(c,cam,t) {
  sceneRepeats(cam,183,.45,(x,i)=>{
    const y=409+Math.abs(i*31)%36, rise=42+Math.abs(i*23)%71;
    c.globalAlpha=.83;
    crystalShape(c,x,y,rise,["#564982","#786fa7","#a2a2ce"]);
    crystalShape(c,x+rise*.45,y+4,rise*.58,["#514678","#7466a1","#aba2d9"]);
    crystalShape(c,x-rise*.43,y+11,rise*.43,["#493f70","#6e64a4","#8f91ca"]);
    c.globalAlpha=1;
    if (i%3!==1) return;
    const glow=c.createRadialGradient(x,y-rise*.65,4,x,y-rise*.65,rise*.74);
    glow.addColorStop(0,"#9fa3f243");
    glow.addColorStop(1,"#9fa3f200");
    c.fillStyle=glow;
    c.fillRect(x-rise,y-rise*1.4,rise*2,rise*1.4);
    sparkle(c,x-7,y-rise*.62+Math.sin(t*.04+i)*7,4,"#d6d2ff");
  });
  skyDust(c,cam,t,"#d6c8f9",27,.18,207,192);
}
function ruinArch(c,x,y,scale,colors) {
  c.save();
  c.translate(Math.round(x),Math.round(y));
  c.scale(scale,scale);
  const [shadow,stone,edge]=colors;
  rect(c,-42,-66,16,66,shadow);
  rect(c,26,-66,16,66,shadow);
  rect(c,-41,-59,6,56,stone);
  rect(c,27,-59,6,56,stone);
  polygon(c,[[-42,-64],[-34,-84],[-14,-99],[14,-99],[34,-84],[42,-64],[26,-64],[17,-79],[5,-83],[-8,-83],[-21,-77],[-27,-64]],stone);
  sceneLine(c,[[-41,-65],[-33,-83],[-14,-97],[14,-97],[33,-83],[41,-65]],edge,3);
  for (let y2=-59;y2<0;y2+=12) {
    rect(c,-42,y2,16,2,edge);
    rect(c,26,y2,16,2,edge);
  }
  c.restore();
}
function cloudDetails(c,cam,t) {
  c.globalAlpha=.72;
  sceneRepeats(cam,274,.34,(x,i)=>{
    const y=279+Math.abs(i*67)%83;
    polygon(c,[[x-80,y],[x+87,y],[x+66,y+21],[x+27,y+28],[x+14,y+63],[x-10,y+45],[x-32,y+41],[x-51,y+19]],"#9778a1");
    rect(c,x-80,y-2,167,6,"#d7a9b5");
    ruinArch(c,x+9,y,.79,["#896e98","#a789a5","#ddafa9"]);
    if (i%2===0) {
      rect(c,x-68,y-48,14,47,"#a382a0");
      rect(c,x-71,y-49,21,4,"#cd9fa9");
      polygon(c,[[x-65,y-39],[x-55,y-39],[x-54,y-16],[x-60,y-10],[x-65,y-16]],"#b96f96");
    }
  });
  c.globalAlpha=1;
  sceneRepeats(cam,195,.31,(x,i)=>{
    const y=401+Math.abs(i*23)%39;
    c.globalAlpha=.29;
    rect(c,x-66+(t*.19)%69,y,133,5,"#f4d1cf");
    rect(c,x-44+(t*.19)%69,y-5,86,5,"#f9d1cc");
  });
  c.globalAlpha=1;
}
function canyonDetails(c,cam,t) {
  sceneRepeats(cam,196,.45,(x,i)=>{
    const base=436, top=252+Math.abs(i*41)%95, width=50+Math.abs(i*53)%61;
    polygon(c,[[x-width*.4,base],[x-5,top+18],[x+13,top],[x+width*.72,top],[x+width,top+21],[x+width*1.1,base]],"#754655");
    polygon(c,[[x-5,top+19],[x+13,top],[x+width*.72,top],[x+width,top+21],[x+width*.83,top+30],[x+4,top+29]],"#b5786d");
    for (let j=0;top+24+j*16<base;j++) {
      const y=top+24+j*16;
      rect(c,x+(j%3-1)*8,y,Math.max(18,width-(j%3)*14),j%3===0?4:2,j%3===0?"#b26b64":"#8d535b");
    }
    if (i%3===0) {
      rect(c,x+width*.23,402,26,3,"#dd8c66");
      rect(c,x+width*.23+12,384,2,15,"#efaa75");
    }
  });
  skyDust(c,cam,t,"#ffbd80",44,.44,165,225);
}
function ridgeDetails(c,camX,camY,t) {
  if (camY<700) {
    c.globalAlpha=.50*(1-camY/700);
    for (let i=0;i<4;i++) {
      const p=41+i*9+Math.sin(t*.013+i)*5;
      const points=Array.from({length:12},(_,j)=>[
        -30+j*79,
        p+Math.sin(j*.73+i*.13+camX*.002)*20+Math.cos(j*1.1)*8
      ]);
      sceneLine(c,points,i%2===0?"#9edbd7":"#a5bbef",2+i%3);
    }
    c.globalAlpha=1;
  }
  if (camY>650) {
    sceneRepeats(camX,71,1,(x,i)=>{
      const ground=1808+Math.abs(i*37)%91-camY;
      if (ground<0 || ground>H+58) return;
      const size=45+Math.abs(i*17)%34;
      polygon(c,[[x-size*.28,ground],[x-size*.2,ground-size*.27],[x,ground-size],[x+size*.18,ground-size*.46],[x+size*.32,ground]],"#3b5076");
      polygon(c,[[x-size*.15,ground-size*.47],[x,ground-size],[x+size*.13,ground-size*.56],[x+size*.05,ground-size*.51],[x,ground-size*.73]],"#8ca9c9");
      rect(c,x-2,ground-10,4,18,"#364b6f");
    });
  }
  skyDust(c,camX,t-camY,"#d9f0f8",43,1.06,79,303);
}
function towerDetails(c,cam,t) {
  sceneRepeats(cam,243,.40,(x,i)=>{
    const y=273+Math.abs(i*57)%112;
    rect(c,x-29,y,66,H-y,"#48406f");
    rect(c,x-19,y-5,46,5,"#75648f");
    polygon(c,[[x-40,y+2],[x-15,y-27],[x+23,y-27],[x+46,y+2]],"#685783");
    rect(c,x-1,y-33,9,10,"#ac85aa");
    sparkle(c,x+3,y-34,5,"#ecc6d3");
    for (let j=0;j<3;j++) {
      const xx=x-23+j*20;
      rect(c,xx,y+23,11,32,"#322b54");
      rect(c,xx+3,y+18,6,7,"#5e5078");
      if ((j+i)%3===0) rect(c,xx+4,y+27,3,10,"#d49ea5");
    }
    ruinArch(c,x+133,y+74,.84,["#403566","#5f4d80","#8877a2"]);
  });
  skyDust(c,cam,t,"#f4d4f7",32,.32,125,245);
}
function observatoryDetails(c,cam,t) {
  const centerX=422, centerY=208;
  const glow=c.createRadialGradient(centerX,centerY,32,centerX,centerY,237);
  glow.addColorStop(0,"#e9a7d945");
  glow.addColorStop(1,"#b074c100");
  c.fillStyle=glow;
  c.fillRect(0,0,W,H);
  c.globalAlpha=.76;
  for (const [x,s] of [[87,1.46],[270,1.60],[574,1.60],[757,1.46]]) {
    const y=346;
    ruinArch(c,x,y,s,["#5b4278","#795782","#b582ac"]);
    rect(c,x-47*s,y-6,94*s,6,"#9b6a9b");
  }
  c.globalAlpha=1;
  c.save();
  c.translate(centerX,centerY-33);
  for (const r of [49,65,76]) {
    const nodes=Array.from({length:17},(_,i)=>[Math.cos(i*Math.PI/8)*r,Math.sin(i*Math.PI/8)*r]);
    sceneLine(c,nodes,r===65?"#b786b0":"#80618c",r===49?2:1);
  }
  for (let j=0;j<8;j++) {
    const rad=j*Math.PI/4;
    const x=Math.cos(rad)*50,y=Math.sin(rad)*50;
    sparkle(c,x,y,4,"#e6aeca");
    sceneLine(c,[[x,y],[Math.cos(rad+.5)*71,Math.sin(rad+.5)*71]],"#ad78a5",1);
  }
  sparkle(c,0,0,10,"#f2c7d2");
  c.restore();
  softBeam(c,230,11,198,401,"#fbc5f3");
  softBeam(c,490,6,166,410,"#e1c3ff");
  skyDust(c,cam,t,"#f4c2eb",36,.33,89,282);
}
function drawLandscapeDetails(c,index,camX,camY,t) {
  switch (index) {
    case 0: distantMeadow(c,camX,t); break;
    case 1: forestScenery(c,camX,t); break;
    case 2: mineDetails(c,camX,t); break;
    case 3: cloudDetails(c,camX,t); break;
    case 4: canyonDetails(c,camX,t); break;
    case 5: ridgeDetails(c,camX,camY,t); break;
    case 6: towerDetails(c,camX,t); break;
    case 7: observatoryDetails(c,camX,t); break;
  }
}

function drawDiveDetails(c,camX,camY,t) {
  for (let i=0;i<58;i++) {
    const x=(i*311+43)%diveWidth, y=(i*193+87)%diveHeight;
    const xx=x-camX, yy=y-camY;
    if (xx<0 || xx>W || yy<0 || yy>H || diveAt(x,y)!==1) continue;
    const shimmer=Math.sin(t*.043+i)*.16+.26;
    c.globalAlpha=shimmer;
    rect(c,xx,yy,19+i%5*3,2,"#80bfc5");
    rect(c,xx+7,yy+3,7,2,"#69a6b2");
    if (i%5===0) sparkle(c,xx+8,yy-9+Math.sin(t*.065+i)*3,4,"#b2e6e2");
    c.globalAlpha=1;
  }
}

const surfaceGlints=["#c18cab","#abc17b","#9a86b8","#d2a0a2","#d59a71","#b7d8e8","#c18bba","#d191b6"];
function drawStageSurfaceDetail(c,index,ground,cam) {
  const x=ground.x-cam, y=ground.y;
  const color=surfaceGlints[index];
  for (let i=Math.max(0,Math.floor((cam-ground.x)/75));i*75<Math.min(ground.w-20,W-x+42);i++) {
    const xx=x+i*75+9;
    const yy=y+23+Math.abs((i*11+ground.x)%19);
    c.globalAlpha=.64;
    if (index===1) {
      rect(c,xx,yy,18,4,color);
      rect(c,xx+6,yy+3,4,9,color);
      rect(c,xx+15,yy+4,3,5,color);
    } else if (index===2) {
      polygon(c,[[xx,yy+4],[xx+7,yy-2],[xx+15,yy+2],[xx+8,yy+7]],color);
      rect(c,xx+15,yy+9,4,3,color);
    } else if (index===4) {
      rect(c,xx,yy,25,2,color);
      rect(c,xx+7,yy+6,17,2,color);
    } else {
      rect(c,xx,yy,10+i%3*4,3,color);
      rect(c,xx+13,yy+7,5,3,color);
      rect(c,xx+21,yy+9,4,2,color);
    }
  }
  c.globalAlpha=1;
}
