import {access,readdir,stat} from 'node:fs/promises';
for(const file of ['index.html','styles.css','adventure.css','app.js','core.js','ai.js','storage.js','platformer.js','platformer-core.js'])await access('dist/'+file);
let size=0;for(const file of await readdir('dist'))size+=(await stat('dist/'+file)).size;
if(size>9_000_000)throw Error('Submission assets exceed budget');
console.log(`Static build ready: ${size} bytes. No installation or secrets required.`);
