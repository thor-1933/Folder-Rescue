// Tiny multinomial Naive Bayes filename model, trained locally on curated examples.
// No network, user-file content, telemetry, or third-party model dependencies.
const examples={
 Documents:['invoice receipt payment billing statement','meeting agenda minutes notes','report proposal research thesis essay','budget expenses finance accounts spreadsheet','resume cover letter application contract agreement','presentation slides lecture study homework assignment','manual guide instructions documentation checklist','letter memo correspondence certificate transcript'],
 Images:['photo photograph portrait selfie picture','screenshot screen capture snapshot','wallpaper background illustration artwork drawing','logo icon banner thumbnail avatar','image scan sketch design mockup','landscape sunset vacation camera gallery','poster graphic texture sprite render','family wedding birthday album collage'],
 Media:['video movie film clip footage recording','audio song music playlist soundtrack album','podcast episode interview voice sound','animation trailer broadcast stream replay','lecture recording performance concert dance','timelapse montage reel screencast tutorial','track beat melody remix instrumental','webinar session playback narration demo'],
 Archives:['archive backup bundle compressed package','export dump snapshot backup restore','zipped tarball packed collection bundle','release distribution installer archive','backup archive compressed packaged files'],
 Code:['script function module component source','server client api endpoint controller','frontend backend router middleware service','config schema migration database query','test spec fixture assertion suite','styles stylesheet markup template layout','program main index utils helper compiler','docker build deploy pipeline workflow package']
};
export function tokenize(name){return name.replace(/([a-z])([A-Z])/g,'$1 $2').toLowerCase().split(/[^a-z]+/).filter(w=>w.length>2);}
const categories=Object.keys(examples),vocabulary=new Set(),counts={},totals={};
for(const category of categories){counts[category]=new Map();totals[category]=0;for(const text of examples[category])for(const token of tokenize(text)){vocabulary.add(token);counts[category].set(token,(counts[category].get(token)||0)+1);totals[category]++;}}
export function inferFilename(name){
 const words=tokenize(name).filter(w=>vocabulary.has(w));
 if(!words.length)return {category:'Other',confidence:0,source:'fallback',reason:'No reliable filename signal. Automatic mode uses Other; Manual mode lets you choose.'};
 const scores=categories.map(category=>({category,score:words.reduce((s,w)=>s+Math.log(((counts[category].get(w)||0)+1)/(totals[category]+vocabulary.size)),Math.log(1/categories.length))})).sort((a,b)=>b.score-a.score);
 const max=scores[0].score,denom=scores.reduce((s,c)=>s+Math.exp(c.score-max),0),confidence=1/denom;
 if(confidence<.45)return {category:'Other',confidence,source:'fallback',reason:'Filename meaning is ambiguous. Automatic mode uses Other; choose Manual for review.'};
 return {category:scores[0].category,confidence,source:'local-ai',reason:`Local filename model suggests ${scores[0].category} from “${[...new Set(words)].slice(0,4).join(', ')}”. Confidence ${Math.round(confidence*100)}%; filename only, no content uploaded.`};
}
