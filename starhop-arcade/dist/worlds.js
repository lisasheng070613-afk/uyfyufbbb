"use strict";

const W = 768;
const H = 480;
const stages = [
  {
    name:"暮光草原", en:"TWILIGHT MEADOW", icon:"M1 17h3v-3h3v-4h3V7h4v3h3v4h3v3h3v3H1Z",
    palette:["#211a49","#65487d","#dc8baf","#f9b0af","#a077a9","#694f8f","#45356e","#58477c","#df9bbc","#9d648f","#61456e","#86b87d"],
    hint:"越过草坡，向右寻找星门。",
    terrain:[[0,394,532],[640,406,365],[1119,380,360],[1589,397,332],[2037,385,480]],
    ledges:[[322,321,94],[450,274,82],[750,327,105],[866,287,95],[1230,306,102],[1332,256,85],[1684,322,104],[1790,273,100],[2174,312,109]],
    enemies:[450,842,1278,1802,2255], spikes:[[917,406,35],[1393,380,34]], checkpoint:[1195,380]
  },
  {
    name:"苔影森林", en:"MOSSWOOD", icon:"M10 2h4v4h3v4h3v4h2v3h-8v5h-4v-5H2v-3h2v-4h3V6h3Z",
    palette:["#112f44","#336764","#a4c9a2","#e5daaa","#73a995","#478a7d","#246050","#26776a","#b3cd80","#71955c","#385b52","#c0db79"],
    hint:"用林间跳台跨过更长的断崖。",
    terrain:[[0,394,333],[469,386,302],[920,410,328],[1398,367,292],[1835,401,232],[2196,378,420]],
    ledges:[[216,321,106],[352,339,72],[565,309,93],[648,256,88],[793,327,77],[1025,325,110],[1281,345,73],[1482,289,130],[1720,332,75],[1935,327,113],[2091,342,70],[2325,300,122]],
    enemies:[515,733,1125,1540,1990,2407], spikes:[[1058,410,60],[1633,367,36],[2460,378,46]], checkpoint:[1450,367]
  },
  {
    name:"水晶矿洞", en:"CRYSTAL MINES", icon:"M9 2h6v3h3v3h2v6h-3v3h-3v5h-4v-5H7v-3H4V8h2V5h3Z",
    palette:["#19173b","#362c66","#6f5ea2","#b0afd5","#635288","#52477e","#32295d","#473769","#bda5ec","#8064aa","#44335f","#aa9aff"],
    hint:"观察矿井机关的节奏，从上下岔道穿过矿洞。",
    terrain:[[0,383,380],[493,420,360],[965,380,370],[1466,419,351],[1938,372,306],[2360,421,350],[2838,372,330],[3292,394,332]],
    ledges:[[142,309,116],[293,256,91],[408,340,66,"y",24],[541,335,99],[638,266,103],[762,298,91],[870,339,74,"x",22],
      [1021,311,109],[1138,239,106],[1249,298,91],[1371,346,68],[1527,330,97],[1618,258,100],[1738,311,84,"y",19],
      [1840,349,72],[2006,294,99],[2113,239,103],[2262,325,77,"y",22],[2455,338,83],[2554,267,104],[2670,316,88],
      [2740,350,64,"x",18],[2896,299,102],[3020,246,105],[3193,325,81],[3350,312,115],[3471,268,95]],
    enemies:[683,1201,1714,2123,2545,2990,3423], spikes:[], checkpoint:[1501,419],
    traps:[
      {kind:"pop",x:272,y:383,w:57,period:166,offset:20},
      {kind:"rail",x:689,y:420,w:42,travel:85,period:196,offset:31},
      {kind:"press",x:1154,y:152,w:59,travel:202,period:207,offset:78},
      {kind:"pop",x:1262,y:380,w:55,period:156,offset:77},
      {kind:"rail",x:1644,y:419,w:49,travel:98,period:174,offset:94},
      {kind:"press",x:2010,y:151,w:55,travel:201,period:191,offset:42},
      {kind:"pop",x:2146,y:372,w:73,period:165,offset:24},
      {kind:"rail",x:2538,y:421,w:45,travel:85,period:206,offset:98},
      {kind:"press",x:3086,y:129,w:59,travel:223,period:187,offset:15},
      {kind:"pop",x:3456,y:394,w:68,period:164,offset:59}
    ]
  },
  {
    name:"云端遗迹", en:"CLOUD RUINS", icon:"M7 6h10v3h4v10h-5v-6H8v6H3V9h4Z",
    palette:["#33274e","#8a6e9d","#edb7b7","#fff0bb","#d9a9c2","#aa80ad","#7b6293","#a16d9c","#ffcfad","#c08a9f","#775477","#ffe4a5"],
    hint:"找到断桥前的石板，按 E 开始节奏机关。",
    terrain:[[0,397,299],[531,362,236],[1009,349,223],[1558,386,161],[1951,353,205],[2372,378,387]],
    ledges:[[152,329,86],[331,342,88,"x",40],[639,282,100],[805,329,92,"x",54],[1043,275,104],[1567,311,92],[1750,331,86,"x",44],[1998,264,111],[2221,329,83,"x",44],[2465,301,148]],
    enemies:[614,1582,2060,2535], spikes:[[680,362,44],[1111,349,32],[1652,386,38],[2655,378,61]],
    checkpoint:[1063,349], bridge:{x:1231,y:349,w:332,slate:1184,after:[1608,386]}
  },
  {
    name:"赤砂峡谷", en:"EMBER CANYON", icon:"M10 2h3v4h3v3h3v5h2v6h-4v2H7v-2H3v-5h3V9h4Z",
    palette:["#39203b","#894957","#e49275","#ffcf92","#c47476","#9f4e62","#66384e","#874b59","#f6b478","#b96d62","#75424e","#f9c763"],
    hint:"熔岩上方有落脚点，避开地面的尖刺。",
    terrain:[[0,397,313],[449,379,252],[844,409,280],[1259,370,250],[1646,405,342],[2124,375,254],[2523,391,345]],
    ledges:[[182,327,112],[332,342,86],[512,301,116],[728,333,79],[953,322,106],[1140,346,85],[1343,289,112],[1531,326,91],[1749,320,112,"y",32],[2007,339,85],[2222,291,113],[2402,324,90],[2597,305,109]],
    enemies:[573,954,1336,1830,2230,2647], spikes:[[246,397,46],[625,379,53],[1001,409,68],[1404,370,61],[1690,405,49],[1889,405,69],[2280,375,62],[2737,391,54]], checkpoint:[1295,370]
  },
  {
    name:"霜月山脊", en:"FROSTMOON RIDGE", icon:"M11 1h2v5l3-3 2 2-5 5v1h2l5-5 2 2-3 3h4v2h-4l3 3-2 2-5-5h-2v1l5 5-2 2-3-3v5h-2v-5l-3 3-2-2 5-5v-1H9l-5 5-2-2 3-3H1v-2h4L2 8l2-2 5 5h2v-1L6 5l2-2 3 3Z",
    palette:["#1a224d","#445c8f","#91b4ce","#e2e6f3","#7397c0","#5274a8","#3c5687","#415b95","#d0eaf4","#8fb2d1","#536e9c","#c4f1f9"],
    hint:"沿雪脊向上，留意绿翼幼龙投下的石块。",
    terrain:[[0,1860,920]],
    ledges:[[158,1780,152],[350,1699,153],[548,1617,154],[718,1537,158],
      [533,1455,157],[350,1375,146],[170,1291,144],[25,1207,117],
      [178,1124,152],[370,1041,150],[556,958,148],[719,874,153],
      [531,794,146],[350,711,143],[174,629,139],[25,547,114],[165,470,139],
      [116,388,688]],
    enemies:[], spikes:[[632,1860,74],[793,1860,62]], checkpoint:null,
    ridge:{
      height:1930,
      checkpoints:[[770,1537],[234,1124],[230,629],[177,388]],
      roamers:[[2,598],[5,409],[10,626],[13,410]],
      drakes:[[389,1591,59],[651,1400,51],[277,1209,36],[487,997,58],[622,835,64],[285,497,37]]
    }
  },
  {
    name:"星轨高塔", en:"ASTRAL TOWER", icon:"M4 3h3v4h3V3h4v4h3V3h3v7h-3v11H7V10H4Z",
    palette:["#181939","#3c346b","#8072b0","#cfacd8","#7763a2","#574482","#392e63","#503779","#e1a6e3","#996aae","#523b72","#f0a2d3"],
    hint:"星轨闸门上了锁，在附近寻找水下入口。",
    terrain:[[0,395,289],[523,371,229],[993,351,246],[1474,386,140],[1680,386,82],[1844,386,218]],
    ledges:[[172,319,92],[317,340,91,"x",38],[589,288,105],[792,323,88,"x",52],[1048,269,107],[1277,316,90,"x",43],[1491,306,84]],
    enemies:[613,1085], spikes:[[235,395,28],[652,371,52],[1138,351,52]], checkpoint:[1520,386],
    floodgate:{x:1921,y:386,trap:[1614,1680],inlet:[1762,1844],returnX:1862}
  },
  {
    name:"终幕 · 星铃守卫", en:"BOSS BATTLE", icon:"M7 3h10v3h3v4h2v7h-5v4H7v-4H2v-7h2V6h3Zm0 7v4h3v-4Zm7 0v4h3v-4Z",
    palette:["#1b1437","#482e68","#9966a4","#ffc2be","#765394","#594180","#442d74","#543774","#e7a4d6","#996cb0","#55346d","#f5aedb"],
    hint:"等护盾消失再攻击。第三阶段的弹幕会扣两颗心。",
    terrain:[[0,403,768]], ledges:[[111,321,112],[260,334,106],[407,306,95]], enemies:[], spikes:[]
  }
];

const icon = name => '<svg aria-hidden="true"><use href="#i-' + name + '"/></svg>';
const pixelIcon = stage => '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="' + stage.icon + '"/></svg>';
const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
const overlap = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
const rect = (c,x,y,w,h,color) => {
  if (w <= 0 || h <= 0) return;
  c.fillStyle = color;
  c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));
};
function polygon(c,points,color) {
  c.fillStyle = color;
  c.beginPath();
  points.forEach(([x,y],i) => i ? c.lineTo(Math.round(x),Math.round(y)) : c.moveTo(Math.round(x),Math.round(y)));
  c.closePath();
  c.fill();
}

function sparkle(c,x,y,r,color) {
  const s=Math.round(r/3);
  rect(c,x-s,y-r,s*2,r*2,color);
  rect(c,x-r,y-s,r*2,s*2,color);
  rect(c,x-s*1.5,y-s*1.5,s*3,s*3,color);
}

function scenery(c,index,camera,t) {
  if (index===2) { mineScenery(c,camera,t); return; }
  const p=stages[index].palette;
  const sky=c.createLinearGradient(0,0,0,435);
  [[0,p[0]],[.45,p[1]],[.85,p[2]],[1,p[3]]].forEach(([offset,color])=>sky.addColorStop(offset,color));
  c.fillStyle=sky;
  c.fillRect(0,0,W,H);
  for (let i=0;i<77;i++) {
    const x=((i*233+85-camera*.025)%W+W)%W;
    const y=(i*67)%285;
    const a=(Math.sin(t*.027+i*7)+1)/2;
    c.globalAlpha=.19+a*.45;
    if (i%11===0) sparkle(c,x,y,5,p[3]); else rect(c,x,y,i%4===0?3:2,2,p[3]);
  }
  c.globalAlpha=1;
  const moonX=(index===7?625:592)-camera*.032, moonY=index===5?109:145, radius=index===7?76:62;
  const halo=c.createRadialGradient(moonX,moonY,35,moonX,moonY,radius*1.73);
  halo.addColorStop(0,p[3]+"9c");
  halo.addColorStop(1,p[3]+"00");
  c.fillStyle=halo;
  c.fillRect(moonX-radius*2,moonY-radius*2,radius*4,radius*4);
  for (let offset=-radius;offset<radius;offset+=4) {
    const half=Math.floor(Math.sqrt(radius*radius-offset*offset)/4)*4;
    rect(c,moonX-half,moonY+offset,half*2,4,offset<26?p[3]:p[2]);
    if (offset>=14 && offset%8===2) rect(c,moonX-half,moonY+offset,half*2,3,p[2]);
  }
  for (let i=0;i<10;i++) {
    const x=((i*177+124-camera*.10)%1010+1010)%1010-90;
    const y=95+(i*41)%161;
    c.globalAlpha=i%2===0?.32:.19;
    rect(c,x,y,89+i%3*24,4,p[3]);
    rect(c,x+11,y-5,31+i%3*14,5,p[3]);
    rect(c,x+28,y-10,28,5,p[3]);
    rect(c,x+30,y+5,82,3,p[3]);
  }
  c.globalAlpha=1;
  ridge(c,camera*.15,288,138,142,p[4],p[3],0);
  ridge(c,camera*.25,336,120,99,p[5],p[4],1);
  ridge(c,camera*.36,370,170,105,p[6],p[5],2);

  for (let i=-2;i<24;i++) {
    const x=i*56-(camera*.47)%112;
    const y=375+(i%3)*4;
    const size=35+Math.abs((i*17)%43);
    if (index===4) {
      rect(c,x+12,y-size,21,size,p[7]);
      rect(c,x,y-size+16,13,7,p[7]);
      rect(c,x,y-size+9,6,13,p[7]);
      rect(c,x+32,y-size+20,13,7,p[7]);
      rect(c,x+40,y-size+13,5,13,p[7]);
    } else if (index===3 || index>=6) {
      rect(c,x,y-size,25,size,p[7]);
      rect(c,x-4,y-size-4,33,5,p[7]);
      rect(c,x+8,y-size+12,7,23,p[6]);
      if (i%3===0) {
        rect(c,x+21,y-size-12,8,11,p[7]);
        rect(c,x+34,y-size-12,8,11,p[7]);
        rect(c,x+22,y-size-2,19,13,p[7]);
      }
    } else {
      for (let j=0;j<4;j++) {
        const bottom=y-j*size*.19;
        const radius=5+(4-j)*4.6;
        polygon(c,[[x-radius,bottom],[x-radius,bottom-5],[x-6,bottom-14],[x-6,bottom-19],[x,bottom-26],[x+6,bottom-19],[x+6,bottom-14],[x+radius,bottom-5],[x+radius,bottom]],p[7]);
      }
      rect(c,x-3,y-6,6,17,p[7]);
    }
  }
  rect(c,0,377,W,103,p[7]);
  if (index===3 || index===4 || index===7) {
    for (let i=0;i<18;i++) {
      const x=((i*149-camera*.2+t*.24)%W+W)%W;
      const y=413+i*13%67;
      rect(c,x,y,47+i%3*29,index===4?4:3,p[9]);
    }
  }
  c.globalAlpha=.12;
  for (let y=3;y<H;y+=5) rect(c,0,y,W,1,p[0]);
  c.globalAlpha=1;
}

function ridge(c,offset,baseline,width,height,color,highlight,layer) {
  const shift=offset%width;
  const seed=Math.floor(offset/width);
  for (let i=-2;i<W/width+2;i++) {
    const x=i*width-shift;
    const h=height+(Math.abs((i+seed)*83+layer*43)%63);
    const y=baseline-h;
    const pts=[[x-width*.31,baseline],[x,y+Math.floor(h*.41/5)*5],[x+width*.18,y+14],[x+width*.28,y],[x+width*.37,y],[x+width*.5,y+25],[x+width*.58,y+25],[x+width*1.2,baseline+42]];
    polygon(c,[...pts,[x+width*1.2,H],[x-width*.31,H]],color);
    if (layer<2) {
      c.globalAlpha=layer===0?.40:.28;
      polygon(c,[pts[1],pts[2],pts[3],pts[4],pts[5],pts[6],[x+width*.69,y+Math.floor(h*.5/5)*5],[x+width*.43,y+38],[x+width*.35,y+40],[x+width*.27,y+21],[x+width*.17,y+47]],highlight);
      c.globalAlpha=1;
    }
  }
}

function tile(c,s,p,cam) {
  const x=s.x-cam, y=s.y;
  const left=Math.max(x,-32), right=Math.min(x+s.w,W+32);
  if (left>=right) return;
  rect(c,left,y,right-left,s.h,p[10]);
  rect(c,left,y,right-left,3,p[3]);
  rect(c,left,y+3,right-left,6,p[8]);
  const period=s.ground?24:20;
  for (let j=Math.max(0,Math.floor((left-x)/period));x+j*period<right;j++) {
    const px=x+j*period;
    const tw=Math.min(period,s.w-j*period);
    rect(c,px,y+9,tw,4,p[9]);
    const detail=Math.min(15,tw);
    rect(c,px,y+13,detail,5,p[9]);
    rect(c,px+Math.min(3,tw),y+18,Math.min(5,tw-3),4,p[9]);
    if (!s.ground) {
      rect(c,px+Math.min(8,tw),y+17,Math.min(8,tw-8),3,p[7]);
      continue;
    }
    for (let k=0;y+29+k*21<H;k++) {
      const mark=Math.abs((j*13+k*17)%17);
      const dx=Math.min(mark,tw);
      rect(c,px+dx,y+28+k*23,Math.min(7,tw-dx),4,(j+k)%5===0?p[9]:p[7]);
      rect(c,px+Math.min(dx+3,tw),y+32+k*23,Math.min(4,tw-dx-3),3,p[7]);
    }
  }
}

function tuft(c,x,y,p,n) {
  if (n%3===0) {
    rect(c,x,y-11,3,11,p[11]);
    rect(c,x-4,y-13,4,3,p[3]);
    rect(c,x+3,y-17,5,4,p[3]);
    rect(c,x+3,y-5,4,3,p[11]);
  } else {
    rect(c,x,y-5,4,5,p[11]);
    rect(c,x-5,y-8,4,5,p[11]);
    rect(c,x+4,y-8,3,5,p[11]);
  }
}

function gem(c,x,y,t) {
  const lift=Math.round(Math.sin(t*.086+x*.05)*3);
  y+=lift;
  rect(c,x-3,y-8,6,2,"#fff1b5");
  rect(c,x-5,y-6,10,12,"#ffca72");
  rect(c,x-3,y+6,6,2,"#e78c65");
  rect(c,x-3,y-5,3,9,"#fff0a2");
  rect(c,x+2,y-4,2,7,"#eaa05d");
}

function playerSprite(c,x,y,dir,t,running,flying,flash) {
  if (flash && Math.floor(t/4)%2) return;
  const step=flying?4:running?(Math.floor(t/5)%2?4:-3):0;
  c.save();
  c.translate(Math.round(x),Math.round(y));
  c.scale(dir,1);
  rect(c,-10,-34,19,5,"#222143");
  rect(c,-13,-30,25,15,"#222143");
  rect(c,-11,-15,23,10,"#222143");
  rect(c,-10,-31,17,4,"#fff0be");
  rect(c,-12,-27,19,7,"#eeaf75");
  rect(c,-9,-29,14,4,"#ffd6a0");
  rect(c,3,-24,9,9,"#f6c49d");
  rect(c,7,-23,3,4,"#322140");
  rect(c,-9,-24,6,9,"#554777");
  rect(c,-5,-22,5,10,"#8272b2");
  rect(c,-11,-15,24,4,"#ef82af");
  rect(c,-14,-14,7,4,"#ee8eb9");
  rect(c,-21,-14+(running?step:0),10,4,"#f7a1c0");
  rect(c,-7,-11,15,9,"#695eab");
  rect(c,1,-10,6,5,"#a98ae1");
  rect(c,8,-10,5,5,"#ffccaa");
  rect(c,-8,-4,7,4,"#252341");
  rect(c,-9+step,-3,8,3,"#252341");
  rect(c,1,-4,6,4,"#252341");
  rect(c,2-step,-3,8,3,"#252341");
  c.restore();
}

function enemySprite(c,e,cam,t,camY=0) {
  const x=e.x-cam,y=e.y-camY+Math.round(Math.sin(t*.18+e.x/30));
  rect(c,x+3,y+19,e.w-6,4,"#261c37");
  rect(c,x+4,y+4,e.w-8,15,"#593756");
  rect(c,x+1,y+9,e.w-2,9,"#6b4169");
  rect(c,x+7,y+2,e.w-14,7,"#e08eaa");
  rect(c,x+4,y+8,e.w-8,4,"#bc709e");
  rect(c,x+7,y+11,3,4,"#f9d5b9");
  rect(c,x+16,y+11,3,4,"#f9d5b9");
}
