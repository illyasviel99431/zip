import fs from 'node:fs/promises';
const out='설계서 정리/원작 데이터';
const current=JSON.parse(await fs.readFile(`${out}/items_japanese_details.json`,'utf8')).items;
const archive=JSON.parse(await fs.readFile(`${out}/items_japanese_archived_details.json`,'utf8')).items;
const clean=s=>s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<img[^>]*>/g,'').replace(/<br[^>]*>/g,' / ').replace(/<[^>]*>/g,'').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const result=[];
for(const c of [...current,...archive].filter(c=>c.tables.some(t=>t.context[0]==='アイテム情報'))){const h=await fs.readFile(`.research-cache/japanese/${c.id}.html`,'utf8');const heads=[...h.matchAll(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/g)].map(m=>({title:clean(m[1]),at:m.index,end:m.index+m[0].length}));const n=heads.findIndex(x=>x.title==='アイテム情報');const section=n>=0?h.slice(heads[n].end,heads.slice(n+1).find(x=>/必要材料|配置地域|進級|製作|変更履歴|備考|コメント/.test(x.title))?.at??heads[n+1]?.at??h.length):'';const body=section.replace(/<table\b[\s\S]*?<\/table>/g,'');
 const bullets=[...body.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(m=>clean(m[1])).filter(s=>s&&!/^(?:テキストログ|LINK|Image|[.\.\[「])/u.test(s)&&/被害|攻撃|防御|回復|スタミナ|体力|スキル|損傷|半壊|破壊|貫通|確率|クール|装填|消費|致命|スタック|探索|個|製作|重複|装備/.test(s));
 result.push({id:c.id,name:c.englishName??c.nameJa,source:c.url,bullets:[...new Set(bullets)]});
}
await fs.writeFile('.research-cache/japanese/item_mechanics_supplements.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({items:result.length,withBullets:result.filter(i=>i.bullets.length).length,bullets:result.reduce((n,c)=>n+c.bullets.length,0),uniqueBullets:new Set(result.flatMap(c=>c.bullets)).size,characters:result.reduce((n,c)=>n+c.bullets.join('').length,0)}));
