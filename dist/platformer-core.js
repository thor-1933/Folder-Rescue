// Pure physics and procedural geometry; no filesystem side effects.
export const WORLD={width:960,height:480,floor:396,segment:420,speed:260,jump:600,gravity:1550};
export function terrain(total,from=0,to=960){
 const boxes=[{x:0,y:396,w:Math.max(960,total*420+400),h:150,ground:true}];
 for(let i=Math.max(0,Math.floor(from/420)-1);i<Math.min(total,Math.ceil(to/420)+1);i++)boxes.push({x:i*420+160,y:300,w:112,h:18});
 return boxes;
}
export function createPlayer(){return {x:65,y:354,w:26,h:42,vx:0,vy:0,grounded:true,coyote:.1,facing:1};}
export function stepPlayer(player,input,dt,{total=12}={}){
 const p={...player};dt=Math.max(0,Math.min(dt,1/30));
 p.vx=(Number(Boolean(input.right))-Number(Boolean(input.left)))*WORLD.speed;if(p.vx)p.facing=Math.sign(p.vx);
 p.coyote=p.grounded?.1:Math.max(0,p.coyote-dt);
 if(input.jump&&(p.grounded||p.coyote>0)){p.vy=-WORLD.jump;p.grounded=false;p.coyote=0;}
 p.vy=Math.min(800,p.vy+WORLD.gravity*dt);const oldY=p.y;
 p.x=Math.max(0,Math.min(Math.max(960,total*420+400)-p.w,p.x+p.vx*dt));p.y+=p.vy*dt;p.grounded=false;
 for(const b of terrain(total,p.x-50,p.x+80))if(p.x+p.w>b.x&&p.x<b.x+b.w&&p.vy>=0&&oldY+p.h<=b.y+1&&p.y+p.h>=b.y){p.y=b.y-p.h;p.vy=0;p.grounded=true;}
 return p;
}
export function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
export function nextCollectible(player,index,total,assist=false){
 const width=Math.max(960,total*420+400),segment=Math.min(Math.max(0,total-1),Math.floor((player.x+170)/420));
 // Elevated collectibles are the files themselves, not unrelated score tokens.
 if(!assist&&index%2)return {x:segment*420+200,y:266,w:30,h:34};
 return {x:Math.min(width-100,player.x+180),y:356,w:30,h:34};
}
