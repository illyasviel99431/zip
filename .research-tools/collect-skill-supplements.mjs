import fs from 'node:fs/promises';
const dir='설계서 정리/원작 데이터';const a=JSON.parse(await fs.readFile(`${dir}/characters_53_japanese.json`,'utf8')).characters;
const clean=s=>s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<img[^>]*>/g,'').replace(/<br[^>]*>/g,' / ').replace(/<[^>]*>/g,'').replace(/&#123;/g,'{').replace(/&#125;/g,'}').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const result=[];
for(const c of a){const h=await fs.readFile(`.research-cache/japanese/${c.id}.html`,'utf8');const heads=[...h.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map(m=>({title:clean(m[1]),at:m.index,end:m.index+m[0].length}));
 let n=heads.findIndex(x=>x.title==='スキル');let section=n>=0?h.slice(heads[n].end,heads[n+1]?.at??h.length):'';
 if(c.name==='Echion'){let from=h.indexOf('タイプ：フィールド');let to=heads.find(x=>x.title==='スキル（チーム戦）')?.at;section=h.slice(from,to);}
 const withoutTables=section.replace(/<table\b[\s\S]*?<\/table>/g,'');
 const bullets=[...withoutTables.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(m=>clean(m[1])).filter(s=>s&&!/^(?:テキストログ|LINK|Image)/.test(s));
 const currentText=clean(section);
 result.push({name:c.name,source:c.url,bullets:[...new Set(bullets)],currentText});
}
await fs.writeFile(`${dir}/character_skill_supplements.json`,JSON.stringify({scope:'Classic PvP section text and explanatory bullets outside tables; no biographies/team/PvE sections',characters:result},null,2));
console.log(JSON.stringify({characters:result.length,withText:result.filter(c=>c.currentText).length,bullets:result.reduce((n,c)=>n+c.bullets.length,0)}));
