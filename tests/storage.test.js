import test from 'node:test';
import assert from 'node:assert/strict';
const records=new Map();
globalThis.indexedDB={open(){const req={};setTimeout(()=>{req.result={createObjectStore(){},transaction(){const tx={objectStore(){return {put(v){records.set(v.id,{...v});return {};},getAll(){return {result:[...records.values()]};}};}};setTimeout(()=>tx.oncomplete(),0);return tx;}};req.onsuccess();},0);return req;}};
const {rescue,undo,history}=await import('../dist/storage.js');
function notFound(){return new DOMException('Not found','NotFoundError');}
class Directory{
 constructor(){this.files=new Map();this.dirs=new Map();}
 async getFileHandle(name,{create=false}={}){if(!this.files.has(name)){if(!create)throw notFound();this.files.set(name,new Blob([]));}const self=this;return {getFile:async()=>self.files.get(name),createWritable:async()=>({write:async f=>{self.pending=f;},close:async()=>{self.files.set(name,self.pending);},abort:async()=>{}})};}
 async getDirectoryHandle(name,{create=false}={}){if(!this.dirs.has(name)){if(!create)throw notFound();this.dirs.set(name,new Directory());}return this.dirs.get(name);}
 async removeEntry(name){if(this.failDelete)throw Error('Permission lost');this.files.delete(name);}
 async requestPermission(){return 'granted';}
}
test('real engine moves, verifies, journals, and restores content',async()=>{const root=new Directory();root.files.set('a.pdf',new Blob(['original']));const r=await rescue(root,{name:'a.pdf'},'Documents');assert.equal(r.status,'moved');assert.equal(root.files.has('a.pdf'),false);assert.equal(await (await r.folder.getFileHandle('a.pdf')).getFile().then(f=>f.text()),'original');await undo(r);assert.equal(await root.files.get('a.pdf').text(),'original');assert.equal(r.folder.files.has('a.pdf'),false);assert.equal(r.status,'undone');assert.ok((await history()).some(x=>x.id===r.id));});
test('collision preserves both existing files',async()=>{const root=new Directory();root.files.set('a.pdf',new Blob(['original']));const dest=await root.getDirectoryHandle('Rescued',{create:true});const folder=await dest.getDirectoryHandle('Documents',{create:true});folder.files.set('a.pdf',new Blob(['existing']));await assert.rejects(rescue(root,{name:'a.pdf'},'Documents'),/already exists/);assert.equal(await root.files.get('a.pdf').text(),'original');assert.equal(await folder.files.get('a.pdf').text(),'existing');});
test('failed removal retains recoverable verified copy and original',async()=>{const root=new Directory();root.files.set('a.pdf',new Blob(['keep']));root.failDelete=true;await assert.rejects(rescue(root,{name:'a.pdf'},'Documents'),/Permission lost/);assert.ok(root.files.has('a.pdf'));const r=(await history()).findLast(x=>x.root===root);assert.equal(r.status,'copied');root.failDelete=false;await undo(r);assert.equal(await root.files.get('a.pdf').text(),'keep');});
test('undo refuses changed rescued file',async()=>{const root=new Directory();root.files.set('a.pdf',new Blob(['first']));const r=await rescue(root,{name:'a.pdf'},'Documents');r.folder.files.set('a.pdf',new Blob(['edited']));await assert.rejects(undo(r),/changed/);assert.equal(await r.folder.files.get('a.pdf').text(),'edited');});
test('undo refuses conflicting original filename',async()=>{const root=new Directory();root.files.set('a.pdf',new Blob(['first']));const r=await rescue(root,{name:'a.pdf'},'Documents');root.files.set('a.pdf',new Blob(['new original']));await assert.rejects(undo(r),/occupied/);assert.equal(await root.files.get('a.pdf').text(),'new original');});
test('invalid category cannot touch filesystem',async()=>{await assert.rejects(rescue(new Directory(),{name:'a.pdf'},'../bad'),/Invalid category/);});
