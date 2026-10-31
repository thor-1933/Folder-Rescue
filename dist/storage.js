import {CATEGORIES,safeName} from './core.js';
const db=new Promise((resolve,reject)=>{const r=indexedDB.open('folder-rescue-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('journal',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function transaction(mode,fn){const d=await db;return new Promise((resolve,reject)=>{const t=d.transaction('journal',mode);const r=fn(t.objectStore('journal'));t.oncomplete=()=>resolve(r?.result);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||Error('Journal unavailable'));});}
export const save=record=>transaction('readwrite',s=>s.put(record));
export const history=()=>transaction('readonly',s=>s.getAll());
async function digest(file){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('');}
async function absent(dir,name){try{await dir.getFileHandle(name);throw Error('Destination already exists. Nothing was overwritten.');}catch(e){if(e.name!=='NotFoundError')throw e;}}
async function write(dir,name,file){const h=await dir.getFileHandle(name,{create:true});const w=await h.createWritable();try{await w.write(file);await w.close();}catch(e){try{await w.abort();}catch{}throw e;}return h;}
export async function rescue(root,item,category){
 if(!CATEGORIES.includes(category))throw Error('Invalid category');safeName(item.name);
 const source=await root.getFileHandle(item.name);const file=await source.getFile();if(file.size>50*1024*1024)throw Error('Safety limit: choose files smaller than 50 MB.');
 const hash=await digest(file);const dest=await root.getDirectoryHandle('Rescued',{create:true});const folder=await dest.getDirectoryHandle(category,{create:true});await absent(folder,item.name);
 const record={id:crypto.randomUUID(),name:item.name,category,root,folder,hash,status:'prepared',time:Date.now()};await save(record);
 const copy=await write(folder,item.name,file);if(await digest(await copy.getFile())!==hash)throw Error('Copy verification failed; original kept.');
 record.status='copied';await save(record);
 if(await digest(await source.getFile())!==hash)throw Error('Source changed during rescue; original kept.');
 await root.removeEntry(item.name);record.status='moved';await save(record);return record;
}
export async function undo(record){
 if(record.status==='undone')return;
 if(await record.root.requestPermission({mode:'readwrite'})!=='granted')throw Error('Folder permission required.');
 const copy=await record.folder.getFileHandle(record.name);const file=await copy.getFile();if(await digest(file)!==record.hash)throw Error('Rescued file changed. Undo stopped to protect your edits.');
 let original;try{original=await record.root.getFileHandle(record.name);}catch(e){if(e.name!=='NotFoundError')throw e;}
 if(original){if(await digest(await original.getFile())!==record.hash)throw Error('Original filename is occupied by different content. Undo stopped.');}
 else {const restored=await write(record.root,record.name,file);if(await digest(await restored.getFile())!==record.hash)throw Error('Restore verification failed; rescued copy kept.');}
 await record.folder.removeEntry(record.name);record.status='undone';await save(record);
}
