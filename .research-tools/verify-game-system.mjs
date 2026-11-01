import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='설계서 정리';
const data=JSON.parse(await fs.readFile(`${dir}/게임_아이템_데이터.json`,'utf8'));
const original=JSON.parse(await fs.readFile(`${dir}/원작 데이터/items_full.json`,'utf8')).items;
const activeReference=new Set(original.filter(i=>i.sourceStatus==='listed_in_current_category_snapshot').map(i=>i.id));
const byId=new Map(data.items.map(i=>[i.id,i]));
assert.equal(data.items.length,102);assert.equal(byId.size,102);
assert.equal(new Set(data.items.map(i=>i.name)).size,102);assert.equal(data.regions.length,8);
const encountered=new Set();
for(const i of data.items){
 assert(activeReference.has(i.reference.id),`Deleted/unknown original item ${i.name}`);
 assert(i.name&&i.reference.url,`Identity/source missing ${i.id}`);
 for(const n of [i.attack,i.defense,i.restoreAmount,i.stackLimit])assert(Number.isFinite(n)&&n>=0,i.name);
 if(i.kind==='weapon')assert(i.weaponTypes.length&&i.attack>0,i.name);
 if(i.kind==='armor')assert(['head','body','arm','leg','accessory'].includes(i.slot),i.name);
 if(i.kind==='food')assert(i.restoreAmount>0&&i.restoreAmount<=100,i.name);
 if(i.recipe){
  assert.equal(i.loot,null,i.name);assert(i.recipe.outputQuantity>0,i.name);
  for(const input of i.recipe.inputs){assert(byId.has(input.itemId),`${i.name}: missing ${input.referenceName}`);assert.equal(input.quantity,1,i.name);}
 }else{
  assert(i.loot.regionIds.length>=2,`Insufficient locations ${i.name}`);
  assert(i.loot.stockUnitsPerRegion>=i.loot.quantityPerDiscovery,i.name);
 }
}
for(const area of data.regions){
 assert(data.animals.some(a=>a.id===area.animal),area.name);
 for(const row of area.loot){const i=byId.get(row.itemId);assert(i?.loot?.regionIds.includes(area.id),area.name);assert.equal(row.stockUnits,i.loot.stockUnitsPerRegion);encountered.add(row.itemId);}
}
// Verify the complete dependency graph independently from the root-collection pass.
const reachable=new Set(encountered),depth=new Map([...encountered].map(id=>[id,0]));
let changed=true;
while(changed){changed=false;for(const i of data.items){if(reachable.has(i.id)||!i.recipe)continue;if(i.recipe.inputs.every(x=>reachable.has(x.itemId))){reachable.add(i.id);depth.set(i.id,1+Math.max(...i.recipe.inputs.map(x=>depth.get(x.itemId))));changed=true;}}}
assert.equal(reachable.size,102,`Unreachable items: ${data.items.filter(i=>!reachable.has(i.id)).map(i=>i.name)}`);
for(const root of data.roots)assert(reachable.has(root),root);
for(const animal of data.animals)for(const drop of animal.drops)assert(byId.has(drop.itemId)&&drop.quantity>0,animal.name);
const start=[['Long Sword',10],['Short Spear',10],['Fabric Armor',8]];
for(const [name,value] of start){const i=data.items.find(i=>i.referenceName===name);assert(i);assert.equal(i.kind==='weapon'?i.attack:i.defense,value);}
const paths={common:'성배전쟁_공통_게임_규칙_v0.2.txt',roster:'서번트_캐릭터_10종_관리표.txt',artoria:'알트리아_펜드래곤_캐릭터_성능_설계서_v2.2.txt',yukina:'히메라기_유키나_캐릭터_성능_설계서.txt'};
const documents=Object.fromEntries(await Promise.all(Object.entries(paths).map(async([k,p])=>[k,await fs.readFile(`${dir}/${p}`,'utf8')])));
assert(documents.common.includes('문서 버전: v0.3'));
assert(documents.roster.includes('문서 버전: v0.5'));
assert(documents.artoria.includes('문서 버전: v2.3'));
assert(documents.yukina.includes('문서 버전:v0.3'));
assert(documents.artoria.includes('속성:MAGIC'));
assert(!documents.artoria.includes('공격 속성             : NEUTRAL'));
assert(documents.yukina.includes('간섭 시전자 유키나가 받는 부분만50% 감소'));
assert.equal(documents.roster.split('\n').filter(s=>/^0[12] \|/.test(s)).length,2);
assert.equal(documents.roster.split('\n').filter(s=>/^0[3-9] \| 미정|^10 \| 미정/.test(s)).length,8);
for(const i of data.items)assert(documents.common.includes(`${i.name} | ${i.referenceName} |`),`Missing appendix row ${i.name}`);
const openCounts=[8,6,4,2,1];assert.equal(openCounts.reduce((n,v,k)=>k?n+openCounts[k-1]-v:n,0),7);
const report={status:'passed',scope:'Document/data consistency and recipe reachability only; no implemented match or combat simulation has been tested',characters:2,regularPlayers:4,regions:8,activeItems:data.items.length,directLootItems:encountered.size,recipes:data.items.filter(i=>i.recipe).length,allItemsReachableFromLoot:reachable.size===data.items.length,maxRecipeDepth:Math.max(...depth.values()),closedDependencyGraph:true,startingLoadoutsMatch:true,individualCharacterDocumentsAgree:true,existingTxtFilesUpdated:Object.values(paths)};
await fs.writeFile('.research-cache/system/validation.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
