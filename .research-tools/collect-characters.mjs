import fs from 'node:fs/promises';
import path from 'node:path';
const out='설계서 정리/원작 데이터';
const cache='.research-cache/characters';
await fs.mkdir(out,{recursive:true}); await fs.mkdir(cache,{recursive:true});
const decode=s=>s.replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
function clean(s){return decode(s.replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/<img[^>]*>/gi,'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/p>/gi,'\n').replace(/<[^>]*>/g,'').replace(/^\s*[| :\-]{3,}\s*$/gm,'').replace(/^\s*\|\s*|\s*\|\s*$/gm,'').replace(/[ \t]{2,}/g,' ').replace(/\n{3,}/g,'\n\n')).trim()}
const idx=await(await fetch('https://wiki.projectlumia.com/llms.txt')).text();
const entries=[...idx.matchAll(/^- \[([^\]]+)\]\((https:\/\/wiki\.projectlumia\.com\/characters\/[^)]+)\)/gm)].map(m=>({name:m[1],url:m[2]})).filter(x=>x.name!=='Scarlet');
const results=[];let next=0;
async function run(){while(next<entries.length){const entry=entries[next++];const slug=entry.url.split('/').pop().replace('.md','');try{
let t;try{t=await fs.readFile(path.join(cache,slug+'.md'),'utf8')}catch{const r=await fetch(entry.url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status);t=await r.text();await fs.writeFile(path.join(cache,slug+'.md'),t)}
const statSection=t.split(/#### PvP Stats/i)[1]?.split(/\n### /)[0]??'';
const stats={};for(const row of statSection.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)){const cells=[...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x=>clean(x[1]));if(['ATK','DEF','HP','STA'].includes(cells[0])) stats[cells[0]]={level1:Number(cells[1]),level18:Number(cells[2]),growth:Number(cells[3])}}
const mastSection=t.split(/#### Mastery/i)[1]?.split(/#### PvP Stats/i)[0]??'';const mastery={};
for(const row of mastSection.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)){const c=row[1];const filename=decodeURIComponent(c.match(/src="([^"]+)"/)?.[1]??'').match(/\/([^/?]+)\.png/)?.[1];if(filename)mastery[filename]=clean(c);}
let classic=t.split(/### Skills\s*-\s*Classic[^\n]*/i)[1]??'';classic=classic.split(/\*\*Skins\*\*|^#{1,6}\s*(?:Skills|Skins)/im)[0];
const sections=[...classic.matchAll(/#### ([^\n]+)\n([\s\S]*?)(?=\n#### |$)/g)].map(m=>({type:clean(m[1]),text:clean(m[2])}));
await fs.writeFile(path.join(cache,slug+'-classic.txt'),sections.map(s=>s.type+'\n'+s.text).join('\n\n'));
results.push({...entry,slug,sourceKind:'restoration_wiki',retrievedAt:new Date().toISOString(),originalFinalVersionVerified:false,stats,mastery,skills:sections.map(s=>({type:s.type,name:clean(s.text.split('\n').find(x=>x.trim()&&x.trim()!=='|')??''),cooldownSeconds:[...s.text.matchAll(/Cooldown[^\d]*(\d+(?:\.\d+)?)/gi)].map(x=>+x[1]),numericEvidence:[...new Set(s.text.match(/\d+(?:\.\d+)?\s*%?/g)??[])],sourceTextCache:path.join(cache,slug+'-classic.txt')})),issues:[]});
console.log(entry.name+': '+Object.keys(stats).length+' stats, '+sections.length+' skill sections');
}catch(e){results.push({...entry,slug,error:e.message});console.log(entry.name+': ERROR '+e.message)}}}
await Promise.all([run(),run(),run()]);
results.sort((a,b)=>entries.findIndex(x=>x.name===a.name)-entries.findIndex(x=>x.name===b.name));
for(const c of results){if(c.error)continue;for(const [stat,v]of Object.entries(c.stats)){if(Math.abs(v.level1+17*v.growth-v.level18)>.051)c.issues.push({type:'growth_mismatch',stat,...v})}if(Object.keys(c.stats).length!==4)c.issues.push({type:'missing_stats'});if(!c.skills.length)c.issues.push({type:'missing_skills'});}
await fs.writeFile(path.join(out,'characters_53_projectlumia.json'),JSON.stringify({scope:'53 original characters; restoration wiki snapshot, not final original verification',characters:results},null,2));
console.log(JSON.stringify({total:results.length,failed:results.filter(x=>x.error).map(x=>x.name),statsComplete:results.filter(x=>Object.keys(x.stats??{}).length===4).length,issues:results.filter(x=>x.issues?.length).map(x=>({name:x.name,issues:x.issues}))}));
