import fs from 'node:fs';
const cache=new URL('../.research-cache/regions/',import.meta.url);fs.mkdirSync(cache,{recursive:true});
const regions=[
 [1,'고급주택가','高級住宅街',460834,'building','주거 지구'],[2,'학교','学校',460835,'book','교육 지구'],
 [3,'공장','工場',460824,'factory','산업 지구'],[4,'성당','教会',460827,'church','종교 지구'],
 [5,'숲','森',460843,'tree','삼림 지대'],[6,'연못','池',460833,'waves','수변 지대'],
 [7,'항구','港',460823,'anchor','항만 지구'],[8,'호텔','ホテル',460826,'building','숙박 지구'],
 [9,'골목길','路地裏',460828,'building','주거 지구'],[10,'마을회관','村会館',460829,'building','공공 지구'],
 [11,'소방서','消防署',460830,'building','공공 지구'],[12,'산길','山道',460836,'tree','산악 지대'],
 [13,'묘지','墓場',460837,'cross','추모 지구'],[14,'터널','トンネル',460838,'building','지하 통로'],
 [15,'절','寺',460839,'church','종교 지구'],[16,'등대','灯台',460840,'anchor','해안 지대'],
 [17,'양궁장','洋弓場',460841,'target','체육 지구'],[18,'병원','病院',460842,'cross','의료 지구'],
 [19,'모래사장','浜辺',460844,'waves','해안 지대'],[20,'우물','井戸',460845,'drop','수원 지대'],
 [21,'슬럼','スラム',460825,'building','주거 지구'],[22,'연구소','研究所',460846,'flask','특수 폐쇄 지구']
].map(([id,name,nameJa,page,icon,type])=>({id,name,nameJa,page,icon,type,source:`https://gamerch.com/blacksurvival/${page}`}));
const text=h=>h.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/\s+/g,' ').trim();
async function collect(r){const url=new URL(`${r.page}.html`,cache);let h;if(fs.existsSync(url))h=fs.readFileSync(url,'utf8');else{const res=await fetch(r.source);if(!res.ok)throw Error(`${r.page}: ${res.status}`);h=await res.text();fs.writeFileSync(url,h);}
 const start=h.search(/<h2[^>]*>探索<\/h2>/);const body=start<0?'':h.slice(start).split(/<h[234][^>]*>野生動物<\/h[234]>/)[0].split(/<h2[^>]*>地域の評価<\/h2>/)[0];
 const tables=[...body.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)].map(m=>[...m[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(row=>[...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/g)].map(c=>({text:text(c[1]),links:[...c[1].matchAll(/<a\b[^>]*href="(https:\/\/gamerch.com\/blacksurvival\/\d+)"[^>]*>/g)].map(a=>a[1])}))));
 r.loot=[];for(const rows of tables){if(!rows[0]?.some(c=>c.text==='配置数'))continue;for(const cells of rows.slice(1)){const name=cells[0],qty=cells.at(-1).text.normalize('NFKC').match(/^(\d+)個?$/);if(name?.text&&qty&&name.links.length)r.loot.push({nameJa:name.text,source:name.links[0],stockDiscoveries:+qty[1],cells:cells.map(c=>c.text)});}}
 const summary=tables.find(t=>t[0]?.[0]?.text==='種類数')?.[1]?.map(c=>c.text);r.summary=summary||null;r.restricted=r.id===22;
 console.log(r.name,r.loot.length,r.summary?.join('/'));return r;
}
for(let i=0;i<regions.length;i+=3)await Promise.all(regions.slice(i,i+3).map(collect));
const randomHtml=await fetch('https://gamerch.com/blacksurvival/460817').then(r=>r.text());fs.writeFileSync(new URL('random.html',cache),randomHtml);
fs.writeFileSync(new URL('snapshot.json',cache),JSON.stringify({retrievedAt:new Date().toISOString(),basis:'Gamerch current exploration tables, excludes change-history rollback tables',regions},null,2));
