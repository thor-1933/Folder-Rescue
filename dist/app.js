import {CATEGORIES,classify,planMission,formatBytes,DEMO} from './core.js';
import {rescue,undo,history} from './storage.js';
import {createPlatformer} from './platformer.js';
const $=id=>document.getElementById(id);
let files=[],total=0,done=0,selected='',root=null,busy=false,logs=[],skips=0;
let automatic=true;
try{automatic=localStorage.getItem('rescue-sort-mode')!=='manual';}catch{}
const icons=['▤','▧','▷','▣','⌘','◇'];
const game=createPlatformer({canvas:$('gameCanvas'),onPickup(){
 if(automatic){selected=classify(files[0].name).category;organizeCurrent();return;}
 showManualReview();
},onStartDemo(){resetDemo();game.begin();},onChooseFolder(){$('connect').click();},announce(message){$('gameAnnouncement').textContent=message;}});
function showManualReview(){
 game.review();
 $('checkpointPanel').hidden=false;
 $('checkpointPanel').scrollTop=0;
 document.querySelector('.game-stage').scrollIntoView({block:'center',behavior:'instant'});
 $('fileName').focus({preventScroll:true});
}
function updateSortingMode(){
 game.setAutomatic(automatic);
 $('sortModeLabel').textContent=automatic?'AUTO SORT':'MANUAL SORT';
 $('sortingNotice').textContent=automatic?'Automatic mode: touching a file organizes it immediately into Rescued / category. Undo is available. Change to Manual in Settings to review each move.':'Manual mode: touching a file opens a destination review. Nothing moves until you approve. Change modes anytime in Settings.';
}
document.querySelector('.game-stage').append($('checkpointPanel'));
$('continueGame').onclick=()=>{if(busy)return;$('skip').click();};
const destinations=$('destinations');
CATEGORIES.forEach((category,i)=>{const b=document.createElement('button');b.className='destination';b.dataset.category=category;b.setAttribute('aria-pressed','false');b.append(document.createTextNode(`${icons[i]} ${category} `));const k=document.createElement('kbd');k.textContent=i+1;b.append(k);b.onclick=()=>{if(!busy&&files.length){selected=category;renderSelection();}};destinations.append(b);});
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function renderSelection(){destinations.querySelectorAll('button').forEach(b=>{b.classList.toggle('selected',b.dataset.category===selected);b.setAttribute('aria-pressed',String(b.dataset.category===selected));b.disabled=busy||!files.length;});$('rescue').disabled=busy||!files.length||!selected;$('skip').disabled=busy||!files.length;$('preview').textContent=files.length?`${root?'Move':'Demo move'}: ${files[0].name} → Rescued / ${selected} / ${files[0].name}`:'All files reviewed. Start a new workspace when you’re ready.';}
function render(){
 const item=files[0];selected=item?classify(item.name).category:'';
 $('modeLabel').textContent=root?'LIVE · LOCAL FOLDER':'DEMO WORKSPACE';
 $('rescued').replaceChildren(document.createTextNode(`${done} `));const small=document.createElement('small');small.textContent=`/ ${total}`;$('rescued').append(small);
 $('points').textContent=String(done*100).padStart(3,'0')+' XP';const pct=total?Math.round(done/total*100):0;$('percent').textContent=pct+'%';$('progress').value=pct;$('progressText').textContent=pct+'%';
 $('rank').textContent=done===total&&total?'Folder guardian':done>=5?'Clutter ranger':'First responder';
 game.sync({total,done,item:files[0],live:Boolean(root)});
 $('wave').textContent=item?`MISSION ${String(done+1).padStart(2,'0')} / ${total}`:'DISTRICT RESTORED';
 $('streak').textContent=done?`✦ ${done} ${root?'LOCAL FILE':'DEMO'} RESCUES`:'✦ EVERY FILE COUNTS';
 $('fileName').textContent=item?.name||'You made room for better things.';
 $('fileDetails').textContent=item?`${classify(item.name).category} · ${formatBytes(item.size)}`:`${done} files rescued. ${done*100} points earned.`;
 $('fileNumber').textContent=item?String(done+1).padStart(2,'0'):'✓';
 $('reason').textContent=item?classify(item.name).reason:'Mission complete. Check your rescue log to review or undo any move.';
 $('fileIcon').textContent=item?icons[CATEGORIES.indexOf(classify(item.name).category)]:'✓';
 $('directorText').textContent=planMission(files).text;
 $('logCount').textContent=logs.filter(l=>l.status!=='undone').length;
 renderSelection();
}
function resetDemo(){root=null;files=DEMO.map(f=>({...f}));total=files.length;done=0;skips=0;$('checkpointPanel').hidden=true;game.sync({total,done,item:files[0],live:false,reset:true});render();status('Choose your own folder to begin, or try the clearly labeled sample mission.');}
function setBusy(value){busy=value;['connect','demo','continueGame','gameStart','gameChoose','gamePause','gameInteract','gameNext','gameAssist','settings'].forEach(id=>$(id).disabled=value||(['gamePause','gameInteract','gameNext'].includes(id)&&!files.length));renderSelection();}
async function organizeCurrent(){
 if(busy||!files.length)return;setBusy(true);const item=files[0],category=selected;
 try{let entry;const prediction=classify(item.name);$('gameAnnouncement').textContent=`${automatic?'Auto-sorting':'Organizing'} ${item.name} → ${category}. ${prediction.source==='local-ai'?'Local AI filename model.':prediction.source==='file-type'?'Recognized file type.':'Uncertain type; Other fallback.'}`;if(root){status('Verifying and organizing your file in the background…');entry=await rescue(root,item,category);}else{entry={id:crypto.randomUUID(),name:item.name,category,status:'moved',demo:true,time:Date.now()};}
 logs.unshift(entry);files.shift();done++;render();$('checkpointPanel').hidden=true;game.continueRun();status(`${item.name} organized in ${category}. ${root?'Real file moved. Undo is available in Rescue log.':'Sample file only; your device was not changed.'}`);
 }catch(e){status(`Rescue stopped: ${e.message} Open Rescue log to inspect any saved recovery entry.`,true);showManualReview();await loadHistory();}
 finally{setBusy(false);}
}
$('rescue').onclick=organizeCurrent;
$('skip').onclick=()=>{if(busy||!files.length)return;files.push(files.shift());skips++;render();$('checkpointPanel').hidden=true;game.continueRun();status('File deferred without changes. It will appear again; the mission ends only when every file is organized.');};
$('connect').onclick=async()=>{
 game.pause();
 if(!window.showDirectoryPicker){openDialog('Real folder access',body=>{paragraph(body,'Your browser does not expose the folder write API. Play the full demo here, or open this site in a desktop browser with showDirectoryPicker support, such as Chrome or Edge, over HTTPS.');paragraph(body,'Folder access always requires your explicit permission. Demo mode never changes real files.');});return;}
 try{const chosen=await window.showDirectoryPicker({mode:'readwrite',id:'folder-rescue'});setBusy(true);status('Scanning file names…');const found=[];for await(const [name,h]of chosen.entries()){if(h.kind==='file'&&!name.startsWith('.')){const f=await h.getFile();if(f.size<=50*1024*1024)found.push({name,size:f.size});}if(found.length===500)break;}
 root=chosen;files=found;total=files.length;done=0;skips=0;$('checkpointPanel').hidden=true;game.sync({total,done,item:files[0],live:true,reset:true});render();game.continueRun();status(`${found.length} eligible files found in ${chosen.name}. ${automatic?'Automatic mode: touching a file categorizes and moves it.':'Manual mode: review and approve each move.'} Top-level visible files under 50 MB only; maximum 500. Undo is available in Rescue log.`);
 }catch(e){if(e.name!=='AbortError')status(`Could not open folder: ${e.message}`,true);}finally{setBusy(false);}
};
$('demo').onclick=()=>resetDemo();
function openDialog(title,fill){game.pause();$('dialogTitle').textContent=title;$('dialogBody').replaceChildren();fill($('dialogBody'));$('dialog').showModal();}
function paragraph(body,text){const p=document.createElement('p');p.textContent=text;body.append(p);}
$('closeDialog').onclick=()=>$('dialog').close();
$('missionNav').onclick=()=>{$('gameCanvas').focus();$('gameCanvas').scrollIntoView({block:'center',behavior:'instant'});};
$('guideNav').onclick=()=>openDialog('Your field guide',body=>{
 paragraph(body,'1. Try the demo, or choose a real folder. We inspect filenames and sizes on your device, never upload them, and never scan nested folders.');
 paragraph(body,'Choose your folder before starting, or explicitly choose the sample mission. Move with A/D or arrows; jump with Space/W/up. In Automatic mode, touching a file classifies and moves it immediately in the background. No sorting question interrupts your run. The mission ends when no eligible files remain.');
 paragraph(body,'2. Settings → Sorting mode → Manual opens a review after each pickup. Press 1–6 or click a category to override the suggestion. Organize / E approves the previewed move. Later makes no changes and returns the file to the queue. Assist mode keeps files at ground level; Pick up next file bypasses movement. There is no timer or penalty.');
 paragraph(body,'3. Real files move into Rescued / category inside the selected folder. We copy, verify SHA-256, then remove the original. Existing destination filenames are never intentionally overwritten.');
 paragraph(body,'4. Open Rescue log to undo. Recovery records are stored in this browser, including after a reload. Keep browser storage until you finish. If interrupted, undo a copied or prepared entry to restore the original when a verified copy exists.');
 paragraph(body,'Safety boundaries: do not edit the selected folder in another app during a rescue. Browser file APIs do not offer atomic cross-folder moves. This is a local organization tool, not a backup service. Files over 50 MB, hidden files, subfolders, and files beyond the first 500 are excluded. Empty category folders may remain after undo.');
 paragraph(body,'Classification uses recognized extensions first, then a small locally trained Naive Bayes filename model. Low-confidence names go to Other. It is a local statistical classifier, not a generative AI service; it never reads file contents or sends names to a provider. Manual mode lets you choose a destination for every type.');
});
async function loadHistory(){try{const saved=await history();const demos=logs.filter(l=>l.demo);logs=[...saved,...demos].sort((a,b)=>b.time-a.time);$('logCount').textContent=logs.filter(l=>l.status!=='undone').length;}catch{status('Browser recovery storage is unavailable. Real moves will be blocked; the demo still works.',true);}}
function showHistory(){openDialog('Rescue log & recovery',body=>{
 paragraph(body,'Undo checks file contents before restoring them. Live records survive reloads in this browser. Prepared/copied entries may represent an interrupted operation.');
 if(!logs.length)paragraph(body,'Your first rescue is waiting. Completed moves will appear here.');
 for(const entry of logs){const row=document.createElement('div');row.className='log-row';const label=document.createElement('div');label.textContent=entry.name;const info=document.createElement('small');info.textContent=`${entry.demo?'DEMO':'LOCAL'} → ${entry.category} · ${entry.status}`;label.append(info);row.append(label);if(entry.status!=='undone'){const b=document.createElement('button');b.className='secondary';b.textContent='Undo';b.onclick=async()=>{b.disabled=true;setBusy(true);try{if(entry.demo)entry.status='undone';else await undo(entry);if((entry.demo&&!root)||(!entry.demo&&root&&await root.isSameEntry(entry.root))){if(!files.some(f=>f.name===entry.name)){files.push({name:entry.name,size:0,demo:entry.demo});done=Math.max(0,done-1);}}
 render();$('dialog').close();status(`${entry.name} restored. ${entry.demo?'Demo only.':'Original verified before the rescued copy was removed.'}`);}catch(e){info.textContent=`Undo stopped: ${e.message}`;info.classList.add('error');b.disabled=false;}finally{setBusy(false);}};row.append(b);}body.append(row);}
 });}
$('historyNav').onclick=async()=>{if(busy)return;await loadHistory();showHistory();};
let reduced=false;try{reduced=localStorage.getItem('rescue-motion')==='off';}catch{}document.body.classList.toggle('no-motion',reduced);
$('settings').onclick=()=>openDialog('Game settings',body=>{
 const modeLabel=document.createElement('label'),modeSelect=document.createElement('select');modeSelect.id='sortingMode';
 for(const [value,text]of [['auto','Automatic — organize on pickup'],['manual','Manual — review each destination']]){const option=document.createElement('option');option.value=value;option.textContent=text;modeSelect.append(option);}
 modeSelect.value=automatic?'auto':'manual';modeSelect.onchange=()=>{automatic=modeSelect.value==='auto';try{localStorage.setItem('rescue-sort-mode',automatic?'auto':'manual');}catch{}updateSortingMode();};
 modeLabel.append(document.createTextNode('Sorting mode'),modeSelect);body.append(modeLabel);
 paragraph(body,'Automatic is the default: collecting a file chooses its category and moves it in the background. Manual opens an in-game review so you can change its destination. Your preference is saved on this device. A file already awaiting review stays there until you approve or defer it.');
 paragraph(body,'Local classification combines recognized file extensions with a small Naive Bayes filename model for unknown types. Uncertain names go to Other. It does not inspect file contents or contact an AI provider.');
 paragraph(body,'All missions are untimed. Platforming is optional: Pick up next file gives the same file-organizing experience. Assist mode keeps collectibles on the ground. Tab reaches controls; Enter/Space activates buttons. After pickup, use 1–6 to override the suggested category and E to organize. Escape closes this dialog.');
 const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=document.body.classList.contains('no-motion');input.onchange=()=>{document.body.classList.toggle('no-motion',input.checked);try{localStorage.setItem('rescue-motion',input.checked?'off':'on');}catch{}};label.append(input,document.createTextNode('Reduce decorative motion'));body.append(label);
 paragraph(body,'Your system reduced-motion preference is also respected. No sound, flashing effects, or time pressure. Each completed action is announced to screen readers.');
});
document.addEventListener('keydown',e=>{if(busy||$('dialog').open||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(game.isSorting()&&e.key.toLowerCase()==='e'&&!e.repeat){e.preventDefault();$('rescue').click();return;}const n=Number(e.key);if(n>=1&&n<=6&&files.length&&game.isSorting()){selected=CATEGORIES[n-1];renderSelection();}});
updateSortingMode();resetDemo();loadHistory();

