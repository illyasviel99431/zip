import fs from 'node:fs/promises';
const out='설계서 정리/원작 데이터';
const data=JSON.parse(await fs.readFile(`${out}/items_indexed.json`,'utf8'));
const meta=JSON.parse(await fs.readFile(`${out}/item_page_metadata.json`,'utf8'));
const norm=s=>s.toLowerCase().normalize('NFKC').replace(/[’]/g,"'").replace(/\s+/g,' ').trim();
const rename={'First Aid Kit Treatment: Heals the latest wound':'First Aid Kit'};
for(const it of data.items){if(rename[it.name]){it.sourceLabel=it.name;it.name=rename[it.name];}}
const byName=new Map(data.items.map(x=>[norm(x.name),x]));
const aliases={'bat':'Bat (Weapon)','stone ax':'Stone Axe','spear handle,':'Spear Handle'};
const find=n=>byName.get(norm(n))??byName.get(norm(aliases[norm(n)]??''));
for(const it of data.items){it.rarityObservations=[];it.detailObservations=[];}
for(const m of meta.found){const it=find(rename[m.name]??m.name);if(!it)continue;it.detailObservations.push(m);if(m.rarity)it.rarityObservations.push({rarity:m.rarity.split('/').at(-1),source:m.url,evidence:'individual_item_details'});}
const navExtra=[];
for(const f of await fs.readdir('.research-cache/item-pages')){let t=await fs.readFile('.research-cache/item-pages/'+f,'utf8');const url=t.match(/\((https:\/\/blacksurvival\.fandom\.com\/wiki\/[^)]+)\)/)?.[1];t=t.slice(t.indexOf('\n# ')+1);for(const line of t.split('\n')){if(!/^[A-Za-z /]+ (?:Legendary|Epic|Rare|Uncommon|Common):/.test(line))continue;const parts=[...line.matchAll(/(?:^|\s)(Legendary|Epic|Rare|Uncommon|Common):\s*([\s\S]*?)(?=\s(?:Legendary|Epic|Rare|Uncommon|Common):|$)/g)];for(const p of parts){for(let name of p[2].split('•')){name=name.trim().replace(/\s*\|.*$/,'').trim();if(!name)continue;const it=find(name);if(it){if(!it.rarityObservations.some(x=>x.rarity===p[1]&&x.source===url))it.rarityObservations.push({rarity:p[1],source:url,evidence:'item_navigation_category'});}else navExtra.push({name,rarity:p[1],source:url});}}}}
for(const it of data.items){const rare=[...new Set(it.rarityObservations.map(x=>x.rarity))];it.rarity=rare.length===1?rare[0]:null;it.rarityStatus=rare.length===1?'observed':rare.length?'conflicting_sources':'missing';it.recipeObservations=it.observations.map(o=>({category:o.category,source:o.source,recipeText:o.fields['Made from']??o.fields['Made From']??'',ingredients:(o.fields['Made from']??o.fields['Made From']??'').split(/\s+\+\s+/).filter(Boolean).map(n=>({sourceLabel:n,resolvedName:find(n)?.name??null,nonItemSource:/^(N\/A|Ammo Supply Aptitude)$/.test(n)}))}));}
const unresolved=[];for(const it of data.items)for(const r of it.recipeObservations)for(const ingredient of r.ingredients)if(!ingredient.resolvedName&&!ingredient.nonItemSource)unresolved.push({item:it.name,...ingredient});
data.scope='644 named items across 18 indexed category tables; snapshot dates unverified, original final patch not confirmed';
await fs.writeFile(`${out}/items_indexed.json`,JSON.stringify(data,null,2));
const report={itemCount:data.items.length,rarityKnown:data.items.filter(x=>x.rarity).length,rarityMissing:data.items.filter(x=>x.rarityStatus==='missing').map(x=>x.name),rarityConflicts:data.items.filter(x=>x.rarityStatus==='conflicting_sources').map(x=>({name:x.name,rarities:[...new Set(x.rarityObservations.map(o=>o.rarity))]})),unresolvedRecipes:unresolved,navigationNamesNotInCategoryTables:[...new Map(navExtra.map(x=>[norm(x.name),x])).values()]};
await fs.writeFile(`${out}/item_enrichment_audit.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
