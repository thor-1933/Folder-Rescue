import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD,createPlayer,stepPlayer,terrain,nextCollectible,overlaps} from '../dist/platformer-core.js';
const dt=1/120;
function advance(p,n,input){for(let i=0;i<n;i++)p=stepPlayer(p,typeof input==='function'?input(i):input,dt);return p;}
test('jump rises and lands back on safe ground',()=>{const p=createPlayer(),jump=stepPlayer(p,{jump:true},dt);assert.ok(jump.y<p.y);const land=advance(jump,160,{});assert.equal(land.y+land.h,WORLD.floor);assert.equal(land.grounded,true);});
test('mid-air jump does not grant infinite flight',()=>{let p=stepPlayer(createPlayer(),{jump:true},dt);p=advance(p,30,{});const before=p.vy;p=stepPlayer(p,{jump:true},dt);assert.ok(p.vy>before);});
test('platform catches descending courier',()=>{let p={...createPlayer(),x:180,y:210,vy:50,grounded:false};p=advance(p,60,{});assert.equal(p.y+p.h,300);assert.equal(p.grounded,true);});
test('collectible collision corresponds to the file pickup',()=>{const p=createPlayer(),file=nextCollectible(p,0,12);assert.equal(overlaps(p,file),false);const reached=advance(p,80,{right:true});assert.equal(overlaps(reached,file),true);assert.equal(overlaps({...p,x:file.x},file),true);});
test('assist places files at accessible ground height',()=>{const p={...createPlayer(),x:440};const elevated=nextCollectible(p,1,12,false);assert.equal(elevated.y,266);const assist=nextCollectible(p,1,12,true);assert.equal(assist.y,356);});
test('next file stays in bounds even at right edge',()=>{for(const index of [11,12]){const f=nextCollectible({...createPlayer(),x:5400},index,12);assert.ok(f.x+f.w<12*420+400);}});
test('visible geometry remains bounded for 500 files',()=>{assert.ok(terrain(500,120000,121000).length<10);});
test('physics clamps elapsed time and world bounds',()=>{const p=stepPlayer(createPlayer(),{left:true},99);assert.ok(p.x>50);const edge=advance({...p,x:0},20,{left:true});assert.equal(edge.x,0);});

