import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='설계서 정리/원작 데이터';
const read=async n=>JSON.parse(await fs.readFile(`${dir}/${n}`,'utf8'));
const {items}=await read('items_full.json');const {characters}=await read('characters_full.json');const {categories}=await read('item_categories_japanese.json');
assert.equal(characters.length,53);assert.equal(new Set(characters.map(c=>c.name)).size,53);assert.equal(items.length,662);assert.equal(new Set(items.map(i=>i.id)).size,662);
for(const c of characters){assert.equal(Object.keys(c.stars5).length,4,c.name);assert.equal(c.skills.length,2,c.name);assert(c.additionalMechanicsKo,c.name);assert(c.lowerStarsEndpointTable,c.name);assert.equal(Object.keys(c.startingMastery).length,8,c.name);for(const s of Object.values(c.stars5))for(const v of Object.values(s))assert(Number.isFinite(v),c.name);}
for(const i of items){assert(i.japanese.rarity,i.name);assert(i.categories.length,i.name);assert(!i.japanese.effects.some(t=>t.context.some(h=>/変更履歴|必要材料|進級/.test(h))),i.name);}
const byId=new Map(items.map(i=>[i.id,i]));const coverage=new Map(),differences=[],missing=[];
const num=s=>{s=String(s??'').normalize('NFKC').trim();return /^\d+(?:\.\d+)?(?:個|発|x)?$/.test(s)?Number(s.replace(/[^0-9.]/g,'')):null};
const map={ATK:'攻撃力',DEF:'防御力',HP:'回復量',ST:'回復量',弾数:'装填',矢数:'装填',個数:'個数'};
for(const category of categories)for(const table of category.tables){const header=table.rows[0]?.map(c=>c.text)??[];if(header[0]!==''||!header.includes('等級'))continue;let remaining=0;
 for(const row of table.rows.slice(1)){if(remaining>0){remaining--;continue;}remaining=(row[0]?.rowspan??1)-1;const links=row[0]?.links??[];
  for(const link of links){const id=link.id;const item=byId.get(id);if(!item){missing.push({source:category.url,id,name:link.title});continue;}const seen=coverage.get(id)??[];seen.push(category.url);coverage.set(id,seen);
   for(const [k,jpKey] of Object.entries(map)){const index=header.indexOf(k);if(index<0)continue;const a=num(row[index]?.text),b=num(item.japanese.fields[jpKey]);if(a!==null&&b!==null&&a!==b)differences.push({name:item.name,field:jpKey,categoryValue:a,detailValue:b,categorySource:category.url,detailSource:item.japanese.source});}
  }
 }
}
assert.equal(missing.length,0,JSON.stringify(missing));
const active=items.filter(i=>i.sourceStatus==='listed_in_current_category_snapshot');const absent=active.filter(i=>!coverage.has(i.id)).map(i=>i.name);
assert.equal(absent.length,0,JSON.stringify(absent));
// Cross-check mechanically important examples against independently read source facts.
assert.deepEqual(items.find(i=>i.name==='Arcane Edge').japanese.recipes[0].ingredients.map(x=>x.name),['Arcane Stone','Bastard Sword']);
assert(items.find(i=>i.name==='Whetstone').japanese.effects.flatMap(t=>t.rows.flat()).some(s=>/修復.*1/.test(s)));
assert(items.find(i=>i.name==='Kundala').japanese.requiredMaterials.length>0);
assert(characters.find(c=>c.name==='Bianca').additionalMechanicsKo.includes('独立')===false);
assert(characters.find(c=>c.name==='Bianca').skills[1].summaryKo.includes('독립 CD 없음'));
const audit=await read('verification_audit.json');assert.equal(audit.unresolvedRecipeNames.length,0);assert.equal(audit.unmappedIndexedItems.length,0);
const report={checksPassed:true,characters:characters.length,skills:characters.reduce((n,c)=>n+c.skills.length,0),items:items.length,coveredCurrentItems:coverage.size,missingCategoryItems:missing,activeItemsNotInCategoryRows:absent,categoryVsDetailNumericDifferences:differences,scope:'Coverage and source consistency checks; source conflicts remain observations, not failures silently corrected'};
await fs.writeFile(`${dir}/category_vs_detail_verification.json`,JSON.stringify(report,null,2));
let md='# 일본어 분류표와 개별 문서의 수치 대조\n\n서로 다른 표 두 벌을 대조한 결과다. 원문이 서로 다르면 그대로 기록했다.\n\n';
md+=`캐릭터 53명·스킬 106개·아이템 662종의 고유성·필수 필드·재료 이름 연결 검사를 통과했다. 일본어 현재 분류표의 아이템 ${coverage.size}종이 모두 개별 문서와 연결되었다.\n\n|아이템|항목|분류표|개별 문서|출처|\n|---|---|---:|---:|---|\n`;
for(const d of differences)md+=`|${d.name}|${d.field}|${d.categoryValue}|${d.detailValue}|[분류표](${d.categorySource}) / [개별](${d.detailSource})|\n`;
await fs.writeFile(`${dir}/일본어_분류표와_개별문서_차이.md`,md);
console.log(JSON.stringify({checksPassed:true,characters:53,skills:106,items:662,currentCategoryCoverage:coverage.size,sourceNumericDifferences:differences.length,sourceItemsWithDifferences:new Set(differences.map(d=>d.name)).size},null,2));
