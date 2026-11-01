import fs from 'node:fs/promises';
const root='.research-cache/japanese', out='설계서 정리/원작 데이터';
const dec=s=>s.replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const clean=s=>dec(s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<img[^>]*>/g,'').replace(/<br\s*\/?\s*>/gi,' / ').replace(/<[^>]*>/g,'').replace(/\s+/g,' ')).trim();
function parse(html,id){
 const title=clean(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]??'');
 const heads=[...html.matchAll(/<h([234])[^>]*>([\s\S]*?)<\/h\1>/g)].map(m=>({level:+m[1],title:clean(m[2]),at:m.index}));
 const tables=[];
 for(const m of html.matchAll(/<table\b[\s\S]*?<\/table>/g)){
  const stack=[];for(const h of heads.filter(h=>h.at<m.index)){while(stack.length&&stack.at(-1).level>=h.level)stack.pop();stack.push(h);}
  const rows=[...m[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(r=>[...r[1].matchAll(/<t[dh]([^>]*)>([\s\S]*?)<\/t[dh]>/g)].map(c=>({text:clean(c[2]),rowspan:Number(c[1].match(/rowspan="(\d+)"/)?.[1]??1),colspan:Number(c[1].match(/colspan="(\d+)"/)?.[1]??1),links:[...c[2].matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/g)].map(a=>({url:dec(a[1]),title:clean(a[2])})).filter(a=>/gamerch.com\/blacksurvival\/\d+$/.test(a.url)&&a.title)})));
  tables.push({context:stack.map(h=>h.title),rows});
 }
 const paragraphs=[...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(m=>clean(m[1]));
 const bilingual=paragraphs.find(p=>/[／]/.test(p)&&/[A-Za-z]{2}/.test(p)&&p.length<160);
 return {id,url:`https://gamerch.com/blacksurvival/${id}`,nameJa:title,englishName:bilingual?.split('／').slice(1).join('／').trim()??null,bilingualName:bilingual??null,updatedAt:html.match(/最終更新日時[^<]*<[^>]*>([^<]+)/)?.[1]?.trim()??null,tables,originalFinalVersionVerified:false};
}
const targets=JSON.parse(await fs.readFile(process.argv[2]??`${root}/item_targets.json`,'utf8'));const result=[];let cursor=0,downloaded=0;
async function work(){while(cursor<targets.length){const target=targets[cursor++];try{
 let html;try{html=await fs.readFile(`${root}/${target.id}.html`,'utf8')}catch{const r=await fetch(target.url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`HTTP ${r.status}`);html=await r.text();await fs.writeFile(`${root}/${target.id}.html`,html);downloaded++;}
 result.push(parse(html,target.id));if(result.length%50===0)console.log(`items ${result.length}/${targets.length}`);
 }catch(e){result.push({...target,error:e.message});console.log(`${target.id}: ${e.message}`);}}}
await Promise.all([work(),work(),work()]);result.sort((a,b)=>+a.id-+b.id);
await fs.writeFile(process.argv[3]??`${out}/items_japanese_details.json`,JSON.stringify({scope:'Public Japanese wiki pages; current/historical tables retain heading context; collected page counts include links later checked for non-item targets; collection is not a claim of final-version verification',items:result},null,2));
console.log(JSON.stringify({pages:result.length,downloaded,errors:result.filter(x=>x.error),englishNames:result.filter(x=>x.englishName).length,withTables:result.filter(x=>x.tables?.length).length},null,2));
