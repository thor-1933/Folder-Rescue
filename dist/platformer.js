import {WORLD,terrain,createPlayer,stepPlayer,overlaps,nextCollectible} from './platformer-core.js';
import {classify} from './core.js';

export function createPlatformer({canvas,onPickup,onStartDemo,onChooseFolder,announce}){
 const ctx=canvas.getContext('2d'),$=id=>document.getElementById(id);
 let player=createPlayer(),camera=0,total=12,done=0,item=null,parcel=null,frame=0,last=0,time=0;
 let running=false,started=false,sorting=false,complete=false,accepted=false,assist=false,jumpQueued=false,mode='demo',automatic=true;
 const keys=new Set(),held=new Set();
 const reduced=()=>document.body.classList.contains('no-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const colors=['#f6d77d','#e99e9c','#a7c5ee','#c1abe0','#8ad8c5','#d2ddaa'];
 function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
 function text(value,x,y,size=12,color='#203d35',align='left'){ctx.fillStyle=color;ctx.font=`bold ${size}px monospace`;ctx.textAlign=align;ctx.fillText(value,Math.round(x),Math.round(y));ctx.textAlign='left';}
 function folder(x,y,color='#ffdd7d'){rect(x+3,y,13,5,color);rect(x,y+4,32,22,'#273d35');rect(x+2,y+6,28,18,color);rect(x+5,y+9,22,2,'#ffffff66');}
 function cloud(x,y){rect(x,y,64,18,'#e4f0d9');rect(x+12,y-12,38,15,'#e4f0d9');rect(x+24,y-20,16,12,'#e4f0d9');}
 function mountain(x,y,w,h,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w*.18,y-h*.45);ctx.lineTo(x+w*.33,y-h*.45);ctx.lineTo(x+w*.48,y-h);ctx.lineTo(x+w*.62,y-h);ctx.lineTo(x+w*.77,y-h*.35);ctx.lineTo(x+w,y);ctx.fill();}
 function hero(){
  ctx.save();ctx.translate(Math.round(player.x+13),Math.round(player.y));ctx.scale(player.facing,1);ctx.translate(-13,0);
  rect(-5,18,10,16,'#ffdd7d');rect(4,2,20,6,'#f59860');rect(0,8,27,8,'#f59860');rect(5,3,7,3,'#ffcf8c');
  rect(5,16,19,12,'#ffe1ad');rect(16,17,10,6,'#294746');rect(18,18,3,3,'#b3f0e0');
  rect(5,27,18,10,'#2f7974');rect(11,28,4,6,'#b9e39b');rect(21,29,6,8,'#ffe1ad');
  const stride=!reduced()&&player.grounded&&player.vx?Math.sin(time*15)*3:0;
  rect(5,36+stride,7,5,'#26433f');rect(15,36-stride,7,5,'#26433f');rect(3,40+stride,10,3,'#f59860');rect(15,40-stride,11,3,'#f59860');ctx.restore();
 }
 function scene(){
  ctx.imageSmoothingEnabled=false;rect(0,0,960,480,'#a7d6dc');rect(0,225,960,170,'#bbd9b3');
  const par=reduced()?0:camera;
  rect(767-par*.02,47,45,45,'#f6edb5');rect(760-par*.02,54,59,31,'#f6edb5');
  for(let i=-1;i<6;i++)mountain(i*270-(par*.13%270),320,330,130+(i%2)*50,'#6caaa4');
  for(let i=-1;i<7;i++)mountain(i*210-(par*.26%210),355,260,100+(i%2)*35,'#79b297');
  for(let i=-1;i<5;i++)cloud(i*310-(par*.08%310)+60,65+(Math.abs(i)%3)*33);
  for(let i=-1;i<9;i++){const x=i*170-(par*.4%170);rect(x,330,8,65,'#375c4d');rect(x-22,295,52,39,'#699e62');rect(x-12,278,32,25,'#84b365');}
  ctx.save();ctx.translate(-Math.round(camera),0);
  for(const b of terrain(total,camera-60,camera+1000)){
   if(b.ground){const left=Math.max(0,Math.floor(camera/28)*28);rect(b.x,b.y,b.w,b.h,'#5b4c43');rect(b.x,b.y,b.w,9,'#b5dd6e');rect(b.x,b.y+9,b.w,6,'#6caa56');for(let x=left;x<camera+1000;x+=28){rect(x+6,b.y+19,13,5,'#817564');rect(x+14,b.y+51,8,4,'#433f38');rect(x,b.y+74,16,5,'#736553');}}
   else{rect(b.x,b.y+5,b.w,b.h,'#4e6550');rect(b.x,b.y,b.w,6,'#efd799');rect(b.x+3,b.y+8,b.w-6,5,'#b69b6c');}
  }
  // As actual files are sorted, their destination folders populate the landscape.
  const first=Math.max(0,Math.floor(camera/420)-1),end=Math.min(total,Math.ceil((camera+1000)/420));
  for(let i=first;i<end;i++){
   const x=i*420+70;rect(x,368,3,28,'#548550');rect(x-3,364,9,6,'#e8a585');
   if(i<done){folder(i*420+290,369,'#d1fb76');text('SORTED',i*420+306,358,9,'#315b43','center');}
  }
  if(parcel&&item&&!sorting){
   const bob=reduced()?0:Math.sin(time*3)*3;
   rect(parcel.x-8,parcel.y-8+bob,46,47,'#f7e8a244');folder(parcel.x,parcel.y+bob,colors[done%6]);
   const name=item.name.length>27?item.name.slice(0,24)+'…':item.name;
   text(name,parcel.x+16,parcel.y-18,11,'#203d35','center');
   text('PICK UP FILE',parcel.x+16,parcel.y+48,9,'#315b43','center');
  }
  hero();ctx.restore();
  rect(22,21,210,31,'#213e38e8');text(mode==='demo'?'SAMPLE FOLDER / DEMO':'YOUR FOLDER / LIVE',34,41,11,'#eff4dc');
  rect(752,21,186,31,'#213e38e8');text(`SORTED ${done} / ${total}`,766,41,12,'#ffdd7d');
  if(sorting){rect(0,0,960,480,'#122b2455');}
 }
 function clearInput(){keys.clear();held.clear();jumpQueued=false;}
 function freeze(){running=false;cancelAnimationFrame(frame);clearInput();}
 function pause(title='Taking a breather?',copy='Your file progress is safe. Resume when you’re ready.'){
  freeze();if(sorting){$('gameOverlay').hidden=true;scene();return;}$('gameOverlay').hidden=false;$('gameOverlayTitle').textContent=title;$('gameOverlayCopy').textContent=copy;
  $('gameStart').textContent=complete?'Play a sample mission →':started?'Resume run →':'Try sample folder →';$('gameChoose').textContent='Choose my folder ↗';$('gamePause').textContent='Resume';scene();
 }
 function resume(focusCanvas=true){if(!accepted||document.hidden||$('dialog').open||sorting||complete)return;started=true;running=true;$('gameOverlay').hidden=true;$('gamePause').textContent='Pause';last=performance.now();cancelAnimationFrame(frame);frame=requestAnimationFrame(loop);if(focusCanvas)canvas.focus({preventScroll:true});}
 function pickup(){if(!accepted||!item||sorting||complete)return;sorting=true;if(!automatic)freeze();$('gameOverlay').hidden=true;scene();announce(`Picked up ${item.name}. ${automatic?'Automatically organizing into':'Suggested destination:'} ${classify(item.name).category}.`);queueMicrotask(onPickup);}
 function loop(stamp){
  if(!running)return;let delta=Math.min((stamp-last)/1000,.05);last=stamp;
  while(delta>0){const dt=Math.min(delta,1/120);time+=dt;player=stepPlayer(player,{left:keys.has('a')||keys.has('ArrowLeft')||held.has('left'),right:keys.has('d')||keys.has('ArrowRight')||held.has('right'),jump:jumpQueued},dt,{total});jumpQueued=false;delta-=dt;
   camera=Math.max(0,Math.min(Math.max(960,total*420+400)-960,player.x-280));
   if(parcel&&overlaps(player,parcel)){pickup();break;}
  }
  scene();if(running)frame=requestAnimationFrame(loop);
 }
 canvas.addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowLeft','ArrowRight','ArrowUp','a','d','w',' ','p','Escape'].includes(k)){e.preventDefault();if(k==='p'||k==='Escape'){if(!e.repeat&&!sorting)(running?pause():resume());return;}if(running){keys.add(k);if(['w',' ','ArrowUp'].includes(k)&&!e.repeat)jumpQueued=true;}}});
 canvas.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));canvas.addEventListener('blur',clearInput);
 window.addEventListener('blur',()=>{if(running)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)pause();});
 $('gameStart').onclick=()=>{if(!started||complete)onStartDemo();else resume();};$('gameChoose').onclick=onChooseFolder;
 $('gamePause').onclick=()=>{if(!sorting)(running?pause():resume());};
 $('gameInteract').onclick=pickup;$('gameNext').onclick=pickup;
 $('gameAssist').onchange=e=>{assist=e.target.checked;if(item&&!sorting)parcel=nextCollectible(player,done,total,assist);scene();};
 document.querySelectorAll('[data-game-control]').forEach(button=>{
  const action=button.dataset.gameControl;
  button.addEventListener('pointerdown',e=>{if(sorting||complete)return;if(!running)resume(false);if(action==='jump')jumpQueued=true;else held.add(action);button.setPointerCapture(e.pointerId);e.preventDefault();});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>held.delete(action));
  button.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!sorting&&!complete){e.preventDefault();if(!running)resume(false);if(action==='jump'&&!e.repeat)jumpQueued=true;else held.add(action);}});
  button.addEventListener('keyup',()=>held.delete(action));button.addEventListener('blur',()=>held.delete(action));
 });
 return {
  pause,resume,begin(){accepted=true;resume();},setAutomatic(value){automatic=Boolean(value);},review(){sorting=true;freeze();$('gameOverlay').hidden=true;scene();},
  sync(state){
   const changed=item?.name!==state.item?.name;total=state.total;done=state.done;item=state.item||null;mode=state.live?'live':'demo';
   if(state.reset){freeze();player=createPlayer();camera=0;sorting=false;started=false;complete=false;accepted=false;parcel=item?nextCollectible(player,done,total,assist):null;
    pause('Your folder. Your adventure.','Choose a folder first. Its files become collectibles. Automatic mode organizes on contact; Manual mode lets you review every destination.');
   }else if(changed){sorting=false;if(item)complete=false;parcel=item?nextCollectible(player,done,total,assist):null;}
   $('sparkCount').textContent=String(Math.max(0,total-done));
   if(!item&&started){complete=true;sorting=false;pause('Folder rescued. Game complete!',`${done} files organized. Your real-world chore is done. Review or undo moves in Rescue log.`);}
   scene();
  },
  continueRun(){sorting=false;accepted=true;if(!item){complete=true;const summary=`${done} eligible files organized. ${mode==='demo'?'Sample mission complete.':'Your selected mission is complete.'} Review or undo moves in Rescue log.`;announce(summary);pause('Folder rescued. Game complete!',summary);$('gameOverlayTitle').tabIndex=-1;$('gameOverlayTitle').focus({preventScroll:true});}else{parcel=nextCollectible(player,done,total,assist);resume();}},
  isSorting:()=>sorting
 };
}
