'use strict';
const $=id=>document.getElementById(id),canvas=$('arena'),ctx=canvas.getContext('2d');
const W=480,H=320,T=16,dirs=[[0,-1],[1,0],[0,1],[-1,0]],keys=new Set();
const base={x:248,y:296},spawns=[[56,24],[232,24],[424,24]];
let mode,player,enemies,shots,sparks,grid,lives,health,kills,created,spawnTimer,score,mute=false,audio,clock=0;
function random(seed){let n=seed>>>0;return ()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296)}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h)}
function tank(c,x,y,d,red=false,icon=false){
 c.save();c.translate(Math.round(x),Math.round(y));c.rotate(d*Math.PI/2);
 let dark=red?'#763d31':'#89752b',mid=red?'#c5674b':'#cba53c',light=red?'#ee9a76':'#ffdf68';
 rect(c,-8,-6,17,16,'#333929');for(let s of [-8,5]){rect(c,s,-7,4,15,'#282d23');for(let j=-7;j<=6;j+=3){rect(c,s,j,4,2,dark);rect(c,s,j,2,1,light)}}
 rect(c,-5,-7,10,14,dark);rect(c,-5,-6,9,11,mid);rect(c,-4,4,8,2,dark);rect(c,-4,-5,8,8,'#434231');rect(c,-4,-6,7,7,light);rect(c,-3,-5,6,6,mid);rect(c,-2,-11,4,9,dark);rect(c,-2,-11,2,8,light);rect(c,-2,0,4,1,light);c.restore()
}
function icon(host,red=false){let c=document.createElement('canvas');c.width=c.height=20;tank(c.getContext('2d'),10,11,0,red);host.append(c);return c}
tank($('logo').getContext('2d'),10,11,1);
const art=document.createElement('canvas');art.width=W;art.height=H;const g=art.getContext('2d');
function terrain(){
 const r=random(1451);rect(g,0,0,W,H,'#575c3d');
 for(let y=0;y<H;y+=4)for(let x=0;x<W;x+=4){if(r()<.47)rect(g,x,y,4,4,['#54593a','#595e40','#525739'][Math.floor(r()*3)])}
 for(let n=0;n<5200;n++){let x=r()*W|0,y=r()*H|0;rect(g,x,y,1+r()*3|0,1,r()<.5?'#64694a':'#4d5337')}
}
function tile(x,y,type){
 let X=x*T,Y=y*T,r=random(871+x*93+y*119);const b=(a,d,w,h,col)=>rect(ctx,X+a,Y+d,w,h,col);
 if(type==='b'){b(0,1,16,16,'#392e24');for(let j=0;j<4;j++)for(let i=-1;i<2;i++){let a=i*9+(j%2)*4;let start=Math.max(a,0),end=Math.min(a+8,16);if(end<=start)continue;let col=['#93603c','#aa7148','#a0653f'][r()*3|0];b(start,j*4,end-start,3,col);b(start,j*4,end-start,1,'#c38d5e');b(start,j*4+2,end-start,1,'#824f33')}}
 if(type==='s'){b(0,0,16,16,'#393d36');b(1,0,14,14,'#9d9e8d');b(2,2,12,11,'#74796e');b(3,3,10,9,'#83877b');[[2,2],[12,2],[2,11],[12,11]].forEach(([a,d])=>b(a,d,1,1,'#494f46'))}
 if(type==='w'){b(0,0,16,16,'#41666b');for(let k=0;k<10;k++){let a=r()*11|0,d=r()*15|0;b(a,d,2+r()*4|0,1,k%3?'#527980':'#729499')}}
 if(type==='f'){b(0,0,16,16,'#38452a');for(let j=0;j<95;j++){let a=r()*15|0,d=r()*15|0;b(a,d,1+r()*2|0,1+r()*2|0,['#495935','#53623a','#657347','#313e28','#73804e'][r()*5|0])}}
}
function reset(){
 grid=Array.from({length:20},()=>Array(30).fill('.'));
 function patch(t,x,y,w,h){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)grid[j][i]=t}
 [['f',0,0,2,3],['f',0,2,4,2],['f',7,0,4,2],['f',19,0,3,2],['f',28,0,2,4],['b',5,3,4,1],['b',5,4,1,2],['b',12,2,1,3],['b',17,3,4,1],['s',23,3,2,2],['b',26,5,4,1],['w',0,7,4,3],['w',3,8,3,2],['s',8,6,2,1],['b',13,6,4,1],['b',16,7,1,2],['f',19,6,3,3],['f',21,8,3,2],['b',7,9,1,4],['b',8,12,3,1],['s',11,9,2,2],['b',25,9,3,1],['b',27,10,1,3],['b',1,12,3,1],['f',0,15,3,4],['f',3,17,3,3],['b',5,15,4,1],['s',10,16,1,2],['b',15,12,4,1],['b',18,13,1,2],['w',21,13,4,2],['w',23,15,3,1],['s',21,17,2,1],['f',27,16,3,4],['b',14,17,3,1],['b',14,18,1,2],['b',16,18,1,2]].forEach(a=>patch(...a));
 mode='ready';lives=3;health=4;kills=0;created=3;score=0;spawnTimer=3;shots=[];sparks=[];player={x:200,y:295,d:0,cd:0,shield:0};enemies=spawns.map(([x,y],i)=>enemy(x,y,i));sync()
}
function enemy(x,y,i){return {x,y,d:2,cd:1+i*.3,turn:1+i*.2}}
function sync(){let titles={ready:'系统就绪',run:'作战进行中',pause:'作战已暂停',win:'任务完成',lose:'防守失败'};$('status').textContent=titles[mode];$('play').textContent={ready:'▶　开始作战',run:'Ⅱ　暂停作战',pause:'▶　继续作战',win:'▶　再次作战',lose:'▶　再次作战'}[mode];$('score').textContent=String(score).padStart(6,'0');$('life').replaceChildren();for(let i=0;i<3;i++)icon($('life')).style.opacity=i<lives?1:.16;$('hp').textContent=health*25+'%';$('meter').replaceChildren();for(let i=0;i<8;i++)$('meter').appendChild(document.createElement('b')).style.opacity=i<health*2?1:.15;$('remaining').textContent=String(12-kills).padStart(2,'0')+' / 12';$('units').replaceChildren();for(let i=0;i<12;i++)icon($('units'),true).style.opacity=i<12-kills?1:.15;$('message').hidden=['ready','run'].includes(mode);$('message').innerHTML=titles[mode]+'<small>'+({pause:'按 P 继续',win:'基地守卫成功',lose:'重新开始，守住基地'}[mode]||'')+'</small>'}
function beep(f){if(mute)return;try{audio??=new AudioContext();audio.resume();let o=audio.createOscillator(),g=audio.createGain();o.type='square';o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(f*.4,audio.currentTime+.07);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.08);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.085)}catch{}}
function toggle(){if(mode==='win'||mode==='lose')reset();mode=mode==='run'?'pause':'run';keys.clear();sync()}
$('play').onclick=toggle;$('restart').onclick=()=>{keys.clear();reset();toggle()};$('sound').onclick=()=>{mute=!mute;$('sound').textContent=mute?'◖×　音效关闭':'◖))　音效开启';if(!mute)beep(240)};
const binds={ArrowUp:0,KeyW:0,ArrowRight:1,KeyD:1,ArrowDown:2,KeyS:2,ArrowLeft:3,KeyA:3};
function press(k){if(k==='KeyP'){if(mode==='run'||mode==='pause')toggle();return}if(mode==='ready')toggle();keys.add(k)}
onkeydown=e=>{if(e.code in binds||['Space','KeyP'].includes(e.code)){if(e.target.tagName==='BUTTON'&&e.code==='Space'&&mode!=='run')return;e.preventDefault();if(!e.repeat)press(e.code)}};onkeyup=e=>keys.delete(e.code);onblur=()=>{keys.clear();if(mode==='run')toggle()};
document.querySelectorAll('[data-k]').forEach(b=>{b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);press(b.dataset.k)};b.onlostpointercapture=()=>keys.delete(b.dataset.k)});
function block(x,y,obj){if(x<8||x>W-8||y<10||y>H-8)return true;for(let a of [-6,6])for(let b of [-6,6])if('bsw'.includes(grid[(y+b)>>4][(x+a)>>4]))return true;return [base,player,...enemies].some(q=>q!==obj&&Math.abs(q.x-x)<14&&Math.abs(q.y-y)<14)}
function move(o,v){let [a,b]=dirs[o.d],x=o.x+a*v,y=o.y+b*v;if(block(x,y,o))return false;o.x=x;o.y=y;return true}
function fire(o,hostile){let [a,b]=dirs[o.d];shots.push({x:o.x+a*8,y:o.y+b*8,a,b,hostile});o.cd=hostile?1.6+Math.random():.28;if(!hostile)beep(175)}
function burst(x,y){for(let i=0;i<12;i++)sparks.push({x,y,vx:(Math.random()-.5)*95,vy:(Math.random()-.5)*95,ttl:.15+Math.random()*.25})}
function update(dt){
 player.cd-=dt;player.shield-=dt;let direction=[...keys].reverse().find(k=>k in binds);if(direction){player.d=binds[direction];move(player,65*dt)}if(keys.has('Space')&&player.cd<=0)fire(player,false);
 for(let e of enemies){e.turn-=dt;e.cd-=dt;let moved=move(e,24*dt);if(!moved||e.turn<=0){let candidates=[0,1,2,3].filter(d=>!block(e.x+dirs[d][0]*2,e.y+dirs[d][1]*2,e));let target=Math.random()<.6?base:player;candidates.sort((a,b)=>distance(a)-distance(b));function distance(d){return Math.hypot(target.x-e.x-dirs[d][0]*12,target.y-e.y-dirs[d][1]*12)}if(candidates.length)e.d=candidates[Math.random()<.55?0:Math.floor(Math.random()*candidates.length)];e.turn=.65+Math.random()*1.4}if(e.cd<=0)fire(e,true)}
 spawnTimer-=dt;if(created<12&&enemies.length<4&&spawnTimer<=0){let p=spawns.find(([x,y])=>!block(x,y,null));if(p){enemies.push(enemy(...p,0));created++;spawnTimer=2.5}}
 shots=shots.filter(s=>{s.x+=s.a*185*dt;s.y+=s.b*185*dt;let tx=s.x>>4,ty=s.y>>4;if(s.x<0||s.y<0||s.x>=W||s.y>=H)return false;let t=grid[ty][tx];if(t==='s'||t==='b'){if(t==='b')grid[ty][tx]='.';burst(s.x,s.y);return false}
 const hit=q=>Math.abs(q.x-s.x)<8&&Math.abs(q.y-s.y)<8;
 if(hit(base)){if(s.hostile){health=Math.max(0,health-1);if(!health)mode='lose';sync()}burst(s.x,s.y);return false}
 if(s.hostile&&hit(player)){if(player.shield<=0){burst(player.x,player.y);lives--;if(!lives)mode='lose';let p=[[200,295],[184,295],[216,263],[152,295]].find(([x,y])=>!block(x,y,player));if(p)[player.x,player.y]=p;player.shield=2;sync()}return false}
 if(!s.hostile){let e=enemies.find(hit);if(e){enemies.splice(enemies.indexOf(e),1);burst(e.x,e.y);beep(85);kills++;score+=100;if(kills===12&&mode==='run')mode='win';sync();return false}}return true});for(let p of sparks){p.x+=p.vx*dt;p.y+=p.vy*dt;p.ttl-=dt}sparks=sparks.filter(p=>p.ttl>0)
}
function draw(){ctx.drawImage(art,0,0);for(let y=0;y<20;y++)for(let x=0;x<30;x++)if(grid[y][x]!=='.')tile(x,y,grid[y][x]);
 let x=base.x-7,y=base.y-7;rect(ctx,x-1,y-1,16,16,'#373e32');rect(ctx,x,y,14,14,'#97a293');rect(ctx,x+1,y+1,12,12,'#546159');ctx.fillStyle='#d0d5bd';ctx.beginPath();[[1,3],[5,5],[7,3],[9,5],[13,3],[12,7],[9,8],[7,12],[5,8],[2,7]].forEach(([a,b],i)=>i?ctx.lineTo(x+a,y+b):ctx.moveTo(x+a,y+b));ctx.fill();
 enemies.forEach(e=>tank(ctx,e.x,e.y,e.d,true));if(player.shield<=0||Math.floor(clock*10)%2)tank(ctx,player.x,player.y,player.d);if(mode==='ready'){ctx.fillStyle='#f6d45b';ctx.font='bold 7px monospace';ctx.textAlign='center';ctx.fillText('P1',player.x,player.y-17);rect(ctx,player.x-1,player.y-15,2,2,'#f6d45b')}
 shots.forEach(s=>rect(ctx,s.x-1,s.y-1,3,3,'#fff1b4'));sparks.forEach(p=>rect(ctx,p.x|0,p.y|0,2,2,p.ttl>.17?'#ebbc60':'#d27746'))}
terrain();reset();let last=0;function frame(t){let dt=Math.min(.032,(t-last)/1000);last=t;clock+=dt;if(mode==='run')update(dt);draw();requestAnimationFrame(frame)}requestAnimationFrame(frame)
