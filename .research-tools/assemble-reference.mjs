import fs from 'node:fs/promises';
const out='설계서 정리/원작 데이터';
const read=async n=>JSON.parse(await fs.readFile(`${out}/${n}`,'utf8'));
const write=async(n,d)=>fs.writeFile(`${out}/${n}`,typeof d==='string'?d:JSON.stringify(d,null,2));
const en=(await read('items_indexed.json')).items;
const jpRaw=(await read('items_japanese_details.json')).items;
const archived=(await read('items_japanese_archived_details.json')).items;
const jp=jpRaw.filter(i=>i.tables?.some(t=>t.context[0]==='アイテム情報'));
const jpChars=(await read('characters_53_japanese.json')).characters;
const enChars=(await read('characters_53_indexed.json')).characters;
const restoration=(await read('characters_53_projectlumia.json')).characters;
const notes=JSON.parse(await fs.readFile('.research-tools/skill-notes-japanese.json','utf8'));
const addenda=JSON.parse(await fs.readFile('.research-tools/skill-addenda-ko.json','utf8'));
const oldNotes=JSON.parse(await fs.readFile('.research-tools/skill-notes.json','utf8'));
const itemSupplements=JSON.parse(await fs.readFile('.research-cache/japanese/item_mechanics_supplements.json','utf8'));
const historical=t=>t.context.some(h=>/変更履歴|備考|トリビア/.test(h));
const norm=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const esc=s=>String(s??'').replace(/\|/g,'\\|').replace(/\n/g,' ');
const texts=t=>t.rows.map(r=>r.map(c=>c.text));
const unique=a=>[...new Set(a)];
const aliases={
 '460971':'EB-M17A1','460992':'Brasil Gauntlet','461200':'Leather Whip','461216':'Bat (Weapon)',
 '461285':'Glacial Ice','461341':'Machine Gun','461345':'ZUG','461353':'SGOTY870','461354':'F92S','461355':'V-PP'
};
const aliasReason={
 '460971':'日本語ページの見出し自体が EB-M17A1。英名欄に旧実銃名。',
 '461345':'日本語ページの見出し自体が ZUG。英名欄に旧実銃名。',
 '461353':'日本語ページの見出し自体が SGOTY870。英名欄に旧実銃名。',
 '461354':'日本語ページの見出し自体が F92S。英名欄に旧実銃名。',
 '461355':'日本語ページの見出し自体が V-PP。英名欄に旧実銃名。'
};
const rarityMap={'一般':'Common','高級':'Uncommon','貴重':'Rare','英雄':'Epic','伝説':'Legendary'};
const rarityKo={Common:'일반',Uncommon:'고급',Rare:'희귀',Epic:'영웅',Legendary:'전설'};
const categoryKo={Blade_Weapons:'베기',Stab_Weapons:'찌르기',Blunt_Weapons:'둔기',Hand_Weapons:'권법',Gun_Weapons:'총',Bow_Weapons:'활',Thrown_Weapons:'던지기',Traps:'함정',Head_Armor:'머리',Clothes:'옷',Arm_Armor:'팔',Leg_Armor:'다리',Accessories:'장식',Health_Foods:'HP 음식',Stamina_Foods:'STA 음식',Enhance_Items:'강화·수리',Special_Items:'특수',Ingredients:'재료'};
const typeCategories={'斬り':'Blade_Weapons','突き':'Stab_Weapons','鈍器':'Blunt_Weapons','投げ':'Thrown_Weapons','銃':'Gun_Weapons','弓':'Bow_Weapons','拳法':'Hand_Weapons','トラップ':'Traps','頭':'Head_Armor','服':'Clothes','腕':'Arm_Armor','脚':'Leg_Armor','装具':'Accessories','食料':'Health_Foods','飲料':'Stamina_Foods','強化':'Enhance_Items','特殊':'Special_Items','材料':'Ingredients'};
const fieldKo={'武器種':'무기 계열','防具種':'방어구 부위','種別':'종류','攻撃力':'ATK','防御力':'DEF','回復量':'회복량','個数':'개수','等級':'등급','装填':'장탄'};
const locationKo={'港':'항구','浜辺':'모래사장','池':'연못','灯台':'등대','学校':'학교','工場':'공장','スラム':'빈민가','路地裏':'골목길','山道':'산길','墓場':'묘지','森':'숲','トンネル':'터널','寺':'절','ホテル':'호텔','教会':'교회','高級住宅街':'고급 주택가','消防署':'소방서','村会館':'마을회관','病院':'병원','洋弓場':'양궁장','井戸':'우물','研究所':'연구소','ランダム地域':'무작위 지역','初期武器':'시작 무기','地下通路':'지하 통로'};
function grid(rows){const g=[];for(let y=0;y<rows.length;y++){g[y]??=[];let x=0;for(const c of rows[y]){while(g[y][x]!==undefined)x++;for(let dy=0;dy<c.rowspan;dy++){g[y+dy]??=[];for(let dx=0;dx<c.colspan;dx++)g[y+dy][x+dx]=c;}x+=c.colspan;}}return g;}
const stripped=s=>s.normalize('NFKC').replace(/^\s*\/\s*/,'').replace(/\s*(?:\(\d+\)|\[[\d∞]+\])\s*$/,'').trim();
function info(i){const t=i.tables.find(t=>t.context[0]==='アイテム情報');const r=texts(t);return Object.fromEntries(r[0].map((k,j)=>[k,r[1]?.[j]??null]));}
const enByNorm=new Map(en.map(i=>[norm(i.name),i]));
const alljp=[...jp,...archived];const jaToName=new Map();
for(const i of alljp){const candidate=aliases[i.id]??i.englishName??i.nameJa;const match=enByNorm.get(norm(candidate));jaToName.set(i.nameJa,match?.name??candidate);jaToName.set(i.nameJa.normalize('NFKC'),match?.name??candidate);}
const translateName=s=>jaToName.get(stripped(s))??stripped(s);
const activeCategories=new Map();const cats=(await read('item_categories_japanese.json')).categories;
for(const c of cats)for(const t of c.tables){if(t.context.some(h=>/削除済/.test(h)))continue;const g=grid(t.rows);for(const r of g.slice(1)){for(const l of r[0]?.links??[]){const set=activeCategories.get(l.id)??new Set();set.add(c.id);activeCategories.set(l.id,set);}}}
const categoryId={'460792':'Blade_Weapons','460793':'Stab_Weapons','460795':'Blunt_Weapons','460796':'Thrown_Weapons','460797':'Gun_Weapons','460799':'Bow_Weapons','460800':'Hand_Weapons','460804':'Traps','460805':'Clothes','460806':'Head_Armor','460807':'Arm_Armor','460808':'Leg_Armor','460809':'Accessories','460810':'Health_Foods','460811':'Stamina_Foods'};
const itemDifferences=[];const items=[];
for(const j of alljp){
 const name=jaToName.get(j.nameJa),e=enByNorm.get(norm(name));const fields=info(j);const rarity=rarityMap[fields['等級']]??null;
 const byType=String(fields['武器種']??fields['防具種']??fields['種別']??'').split('・').map(x=>typeCategories[x]).filter(Boolean);
 const categories=unique([...e?.categories??[],...byType,...[...activeCategories.get(j.id)??[]].map(id=>categoryId[id]).filter(Boolean)]);
 const tables=j.tables.filter(t=>t.context.includes('アイテム情報')&&!t.context.some(h=>/必要材料|配置地域|進級|製作|変更履歴|備考|トリビア/.test(h)));
 const effects=tables.slice(1).map(t=>({source:j.url,context:t.context,rows:texts(t).map(r=>r.filter(s=>s&&!/^[：:”“"]/.test(s))).filter(r=>r.length)}));
 const recipeTrees=j.tables.filter(t=>t.context.includes('進級・製作')&&!historical(t)&&t.rows[0]?.some(c=>/製作図/.test(c.text)));
 const recipes=recipeTrees.map(t=>{const g=grid(t.rows.slice(1));return {source:j.url,ingredients:unique(g.map(r=>r[1]?.text).filter(Boolean)).map(s=>({name:translateName(s),raw:s})),tree:g.map(r=>r.map(c=>c?.text??''))};});
 const locations=j.tables.filter(t=>t.context.includes('配置地域')&&!historical(t)).map(t=>({context:t.context,rows:texts(t),source:j.url}));
 const requiredMaterials=j.tables.filter(t=>t.context.includes('必要材料')&&!historical(t)).map(t=>({context:t.context,rows:texts(t),source:j.url}));
 const upgrades=j.tables.filter(t=>t.context.includes('進級・製作')&&t.context.includes('進級先')&&!historical(t)).map(t=>({context:t.context,rows:texts(t),source:j.url}));
 const craftRewards=j.tables.filter(t=>!historical(t)&&t.rows[0]?.some(c=>/製作から得る/.test(c.text))).map(t=>({rows:texts(t),source:j.url}));
 const differences=[];
 const checks=[['攻撃力',['Damage','Attack']],['防御力',['Armor','Defense']],['回復量',['HP Value','Stamina Value','STA Value','ST Value','Heal','Recovery','Restore']],['装填',['Ammo Capacity']],['個数',['Quantity']]];
 for(const o of e?.observations??[])for(const [jpKey,enKeys] of checks){const k=enKeys.find(k=>o.fields[k]!==undefined);if(!k||fields[jpKey]===undefined)continue;const a=Number(o.fields[k].normalize('NFKC').replace(/[^0-9.\-]/g,'')),b=Number(fields[jpKey].normalize('NFKC').replace(/[^0-9.\-]/g,''));if(Number.isFinite(a)&&Number.isFinite(b)&&a!==b)differences.push({field:jpKey,indexedValue:o.fields[k],japaneseValue:fields[jpKey],indexedSource:o.source,japaneseSource:j.url});}
 if(e?.rarity&&e.rarity!==rarity)differences.push({field:'等級',indexedValue:e.rarity,japaneseValue:rarity,indexedSource:e.rarityObservations?.[0]?.source??e.observations[0].source,japaneseSource:j.url});
 if(differences.length)itemDifferences.push({name,differences});
 items.push({id:j.id,name,nameJa:j.nameJa,englishNameInJapaneseSource:j.englishName,aliasReason:aliases[j.id]?(aliasReason[j.id]??'표기 차이·오탈자 정규화; 출처 원문 이름을 별도 보존'):null,sourceStatus:archived.some(a=>a.id===j.id)?'listed_in_deleted_item_category':'listed_in_current_category_snapshot',categories,japanese:{source:j.url,updatedAt:j.updatedAt,fields,rarity,effects,recipes,locations,requiredMaterials,upgrades,craftRewards,additionalMechanicsJa:itemSupplements.find(x=>x.id===j.id)?.bullets??[]},indexed:e??null,differences,originalFinalVersionVerified:false});
}
items.sort((a,b)=>a.name.localeCompare(b.name,'en'));
const itemNames=new Set(items.map(i=>norm(i.name)));
const unmappedIndexed=en.filter(i=>!itemNames.has(norm(i.name))).map(i=>i.name);
const unresolvedRecipes=[];for(const i of items)for(const r of i.japanese.recipes)for(const x of r.ingredients)if(!itemNames.has(norm(x.name)))unresolvedRecipes.push({item:i.name,ingredient:x});
const characterDifferences=[],growthErrors=[],lowerStarGrowthErrors=[];
const koNames=['재키','피오라','자히르','현우','윌리엄','로살리오','제니','JP','쇼우','나딘','아야','혜진','알렉스','캐시','바바라','아이솔','레온','매그너스','실비아','리 다이린','키아라','하트','쇼이치','아르다','카밀로','버니스','시셀라','아델라','아드리아나','나타폰','유키','레녹스','수아','마이','얀','루크','로지','엠마','일레븐','다니엘','리오','에바','니키','에키온','비앙카','클로에','요한','셀린','라우라','에이든','띠아','엘레나','펠릭스'];
const characters=jpChars.map((j,index)=>{
 const e=enChars.find(c=>norm(c.name)===norm(j.name)),r=restoration.find(c=>norm(c.name)===norm(j.name)),n=notes[j.name];
 if(!n||n.length!==3)throw Error('Missing Korean notes '+j.name);
 const diffs=[];const invalid=[];
 for(const [stat,v] of Object.entries(j.stats)){
  const a=e?.stats[stat];if(a&&(a.level1!==v.level1||a.level18!==v.level18)){const d={name:j.name,stat,indexed:[a.level1,a.level18],japanese:[v.level1,v.level18],indexedSource:e.source,japaneseSource:j.url};diffs.push(d);characterDifferences.push(d);}
  for(const lv of [9,18]){const expected=Number((v.level1+(lv-1)*v.growth).toFixed(3));if(Math.abs(expected-v[`level${lv}`])>.011){const issue={name:j.name,stat,level:lv,observed:v[`level${lv}`],expectedFromPublishedGrowth:expected,source:j.url};invalid.push(issue);growthErrors.push(issue);}}
 }
 const base=j.tables.find(t=>t.rows[0]?.some(c=>c.text==='開始熟練度'));
 const masteryGrid=base?grid(base.rows):null;
 const mastery=masteryGrid?Object.fromEntries(masteryGrid[1].map((c,k)=>[c.text,masteryGrid[2]?.[k]?.text])):null;
 const lowStars=j.tables.find(t=>t.rows[0]?.some(c=>/☆1/.test(c.text)));
 const commonGrowth=j.tables.find(t=>t.rows[0]?.some(c=>/成長値：☆共通/.test(c.text)));
 const lowErrors=[];
 if(lowStars&&commonGrowth)for(const [k,row] of lowStars.rows.slice(2).entries())for(let star=1;star<row.length;star++){
  const [a,b]=row[star].text.split('/').map(Number),g=Number(commonGrowth.rows[2]?.[k]?.text),expected=Number((a+17*g).toFixed(3));
  if(Number.isFinite(expected)&&Math.abs(expected-b)>.011){const d={name:j.name,stat:['ATK','DEF','HP','STA'][k],stars:star,observedLevel18:b,level1:a,publishedGrowth:g,expectedLevel18:expected,source:j.url};lowErrors.push(d);lowerStarGrowthErrors.push(d);}
 }
 const traits=j.tables.filter(t=>t.rows[1]?.some(c=>c.text==='Lv1')&&t.rows[1]?.some(c=>c.text==='Lv5')).map(t=>({context:t.context,rows:texts(t),source:j.url,status:'historical_VF_trait_do_not_add_to_current_baseline'}));
 const currentSkills=j.tables.filter(t=>t.context[0]==='スキル'||(j.name==='Echion'&&t.context[0]==='データ')||(j.name==='Echion'&&t.context[0]==='毒蛇の牙'));
 const skillHeaders=currentSkills.filter(t=>t.rows.flat().some(c=>/^タイプ[：:]/.test(c.text)));
 const skills=skillHeaders.map((t,k)=>({nameJa:j.name==='Echion'&&k===0?'専用武器進化':t.context.at(-1),nameEn:r?.skills[k]?.name,type:t.rows.flat().find(c=>/^タイプ[：:]/.test(c.text))?.text,summaryKo:n[k],source:j.url}));
 if(skills.length!==2)throw Error('Skill count '+j.name+' '+skills.length);
 return {name:j.name,nameKo:koNames[index],source:j.url,updatedAt:j.updatedAt,stars5:j.stats,levelSeries:Object.fromEntries(Object.entries(j.stats).map(([s,v])=>[s,{basis:'calculated_from_published_level1_and_growth_not_individually_observed',hasSourceContradiction:invalid.some(x=>x.stat===s),values:Array.from({length:18},(_,k)=>({level:k+1,value:Number((v.level1+k*v.growth).toFixed(3))}))}])),startingMastery:mastery,lowerStarsEndpointTable:lowStars?texts(lowStars):null,publishedCommonGrowthTable:commonGrowth?texts(commonGrowth):null,lowerStarGrowthErrors:lowErrors,skills,skillMechanicsTables:currentSkills.map(t=>({context:t.context,rows:texts(t).filter(r=>r.some(s=>s&&!/^[”“"]/.test(s))).map(r=>r.map(s=>/^[”“"]/.test(s)?String():s))})),notes:n[2],additionalMechanicsKo:addenda[j.name],indexedSkillSnapshotKo:oldNotes[j.name],historicalTraits:traits,indexedStats:e,restorationStats:r?.stats,statDifferences:diffs,growthErrors:invalid,originalFinalVersionVerified:false};
});
await write('items_full.json',{retrievedAt:'2026-11-01',scope:'Union of original community wiki snapshots, including explicitly separated deleted items; not one final original patch',items});
await write('characters_full.json',{retrievedAt:'2026-11-01',scope:'53 original characters; 5-star base stats plus lower-star endpoint tables, 106 PvP skills; sources and historical traits separated',characters});
const audit={retrievedAt:'2026-11-01',characters:characters.length,skills:characters.reduce((n,c)=>n+c.skills.length,0),charactersWith4Stats:characters.filter(c=>Object.keys(c.stars5).length===4).length,charactersWithLowerStarTables:characters.filter(c=>c.lowerStarsEndpointTable).length,charactersWithStartingMastery:characters.filter(c=>c.startingMastery).length,characterStatDifferences:characterDifferences,growthErrors,items:items.length,currentCategorySnapshotItems:jp.length,deletedCategoryItems:archived.length,japaneseItemPagesRead:alljp.length,nonItemLinksExcluded:jpRaw.filter(i=>!jp.includes(i)).map(i=>({id:i.id,title:i.nameJa})),indexedItems:en.length,unmappedIndexedItems:unmappedIndexed,itemsWithRarity:items.filter(i=>i.japanese.rarity).length,itemsWithRecipeTrees:items.filter(i=>i.japanese.recipes.length).length,itemsWithRequiredMaterialLocations:items.filter(i=>i.japanese.requiredMaterials.length).length,itemsWithDirectLocationTables:items.filter(i=>i.japanese.locations.length).length,itemsWithEffectTables:items.filter(i=>i.japanese.effects.length).length,itemsWithCraftRewardTables:items.filter(i=>i.japanese.craftRewards.length).length,itemsWithNumericDifferences:itemDifferences.length,unresolvedRecipeNames:unresolvedRecipes,finalOriginalPatchVerified:false};
audit.lowerStarGrowthErrors=lowerStarGrowthErrors;
await write('verification_audit.json',audit);
// Readable character reference. The observed level-9 values remain visible when they contradict growth.
let cm='# 원작 캐릭터 53명: 능력치와 스킬\n\n확인일: 2026-11-01. 원작 일반 개인전 기준의 커뮤니티 문서 관측값이다. 최종 패치 확정본이나 구현용 밸런스 확정값이 아니다. 기본 표는 일본어 원작 위키, 다른 수치와 오류는 아래 및 `출처간_수치차이.md`에 병기했다. 복원 프로젝트의 신규 캐릭터는 제외했다.\n\n기본 능력치는 5성이다. 각 항목은 **레벨 1 / 레벨 9 / 레벨 18 / 레벨당 성장** 순서. 계산식은 원칙상 `Lv1+(레벨-1)×성장`이며 표와 맞지 않는 경우 원문과 계산을 모두 보존했다. 낮은 성급 표의 셀은 레벨 1/18이다. CD는 재사용 대기시간, 미기재는 0초라는 뜻이 아니다.\n\n';
for(const [index,c] of characters.entries()){
 cm+=`## ${index+1}. ${c.nameKo} (${c.name})\n\n[일본어 원작 자료](${c.source}) · [영문 통계](${c.indexedStats.source}) · 문서 갱신 ${c.updatedAt?.trim()??'미표기'}\n\n|능력치|Lv1|Lv9|Lv18|성장|\n|---|---:|---:|---:|---:|\n`;
 for(const [s,v] of Object.entries(c.stars5))cm+=`|${s}|${v.level1}|${v.level9}|${v.level18}|${v.growth}|\n`;
 cm+=`\n시작 숙련도: ${Object.entries(c.startingMastery??{}).map(([k,v])=>`${({'斬り':'베기','突き':'찌르기','鈍器':'둔기','投げ':'던지기','銃':'총','弓':'활','拳法':'권법','ランダム':'무작위'})[k]??k} ${v}`).join(' · ')}\n\n`;
 for(const [k,s] of c.skills.entries())cm+=`${k+1}. ${s.summaryKo}\n`;
 cm+=`\n확인 메모: ${c.notes}\n\n추가 판정: ${c.additionalMechanicsKo}\n\n`;
 if(c.statDifferences.length)cm+='영문 통계와 차이: '+c.statDifferences.map(d=>`${d.stat} 영문 ${d.indexed.join('/')} ↔ 일본어 ${d.japanese.join('/')}`).join('; ')+'.\n\n';
 if(c.growthErrors.length)cm+='성장식 불일치: '+c.growthErrors.map(d=>`${d.stat} Lv${d.level} 원문 ${d.observed}, 성장식 ${d.expectedFromPublishedGrowth}`).join('; ')+'. 자동으로 고치지 않았다.\n\n';
 if(c.lowerStarsEndpointTable){cm+='1~4성 끝점(각 셀 Lv1/Lv18):\n\n|능력치|1성|2성|3성|4성|\n|---|---:|---:|---:|---:|\n';for(const row of c.lowerStarsEndpointTable.slice(2))cm+=`|${row.map((v,k)=>esc(k? v:({'攻':'ATK','攻撃':'ATK','防':'DEF','防御':'DEF','体':'HP','体力':'HP','ス':'STA','スタ':'STA'})[v]??v)).join('|')}|\n`;cm+='\n';}
 if(c.lowerStarGrowthErrors.length)cm+='낮은 성급 표의 성장식 불일치: '+c.lowerStarGrowthErrors.map(d=>`${d.stars}성 ${d.stat} Lv18 원문 ${d.observedLevel18}, 공개 공통 성장값 계산 ${d.expectedLevel18}`).join('; ')+'.\n\n';
}
cm+='## 과거 특성 주의\n\nVF 특성 표는 과거 자료로 분리했다. 피오라 문서의 2022-04-20 롤백 기록에는 VF 특성 삭제가 명시되어 있다. 다른 페이지에 특성 표가 남아 있더라도 기본 능력치에 더하지 않는다. `characters_full.json`의 `historicalTraits`에 출처·원래 문맥을 보존했다.\n';
await write('캐릭터_53명_수치와_스킬.md',cm);
const fmtFields=fields=>Object.entries(fields).filter(([k])=>!['武器種','防具種','種別','等級'].includes(k)).map(([k,v])=>`${fieldKo[k]??k} ${v}`).join(' · ');
const recipeSummary=i=>i.japanese.recipes.map(r=>r.ingredients.map(x=>x.name).join(' + ')).join(' / ');
const effectSummary=i=>i.japanese.effects.flatMap(t=>t.rows.map(r=>r.join(' '))).join(' / ');
let im='# 원작 아이템 전체 대조 목록\n\n확인일: 2026-11-01. 항목 수는 **현재 목록 641종 + 삭제 목록 21종 = 662종**이다. 이 숫자는 수집한 일본어 위키의 현재/삭제 목록 합집합이며 게임의 단일 최종 패치 총량이라는 뜻은 아니다. 영문 색인 644종도 이름을 대조해 모두 연결했다. 10건의 별칭·오탈자는 원래 이름과 정규화 이유를 JSON에 보존했다.\n\n아이템 이름은 영문 또는 출처 표기를 유지한다. 표의 등급·수치는 일본어 개별 문서 관측값이며 다른 출처 값으로 덮어쓰지 않았다. 같은 아이템이 여러 계열에 속하면 여러 표에 나타난다. 특수 효과의 정확한 조건은 아래 개별 상세에서 원문과 출처를 확인할 수 있다.\n\n';
for(const [category,label] of Object.entries(categoryKo)){
 const list=items.filter(i=>i.categories.includes(category)&&i.sourceStatus!=='listed_in_deleted_item_category');
 im+=`## ${label} (${list.length}개 항목)\n\n|아이템|등급|수치|직접 재료|다른 출처 수치 차이|\n|---|---|---|---|---|\n`;
 for(const i of list)im+=`|[${esc(i.name)}](${i.japanese.source})|${rarityKo[i.japanese.rarity]??i.japanese.rarity}|${esc(fmtFields(i.japanese.fields))}|${esc(recipeSummary(i))||'별도 획득 표 확인'}|${i.differences.length?'있음':'—'}|\n`;
 im+='\n';
}
im+='## 삭제된 아이템 21종\n\n현재 아이템과 섞지 않는다. 삭제 목록에 속한다는 근거는 `item_archive_categories.json`에 보존했다.\n\n|아이템|등급|수치|\n|---|---|---|\n';
for(const i of items.filter(i=>i.sourceStatus==='listed_in_deleted_item_category'))im+=`|[${esc(i.name)}](${i.japanese.source})|${rarityKo[i.japanese.rarity]}|${esc(fmtFields(i.japanese.fields))}|\n`;
await write('아이템_662종_분류표.md',im);
let detail='# 아이템 개별 상세\n\n`아이템_662종_분류표.md`의 보충 자료. 원문 표의 기능·수치·제작 경로·획득 수량을 보존했다. 일본어 효과 문구는 임의 번역으로 의미가 바뀌지 않도록 출처 원문을 함께 남겼다. 무기 ATK/방어구 DEF/음식 회복량은 서로 다른 항목이다. 재료 표의 획득 장소는 완성품 자체의 드롭 장소가 아니다. 하위 조합 트리·중간 재료 수량은 `items_full.json`의 `recipes.tree`와 `requiredMaterials`에 있다. `x2` 등 괄호 수량은 원래 표기이며 조합 소모량/산출량의 의미를 임의 변환하지 않았다.\n\n';
function smallTable(rows){if(!rows.length)return '';const cols=Math.max(...rows.map(r=>r.length));return '|'+Array.from({length:cols},(_,k)=>esc(rows[0][k]??'')).join('|')+'|\n|'+Array.from({length:cols},()=> '---').join('|')+'|\n'+rows.slice(1).map(r=>'|'+Array.from({length:cols},(_,k)=>esc(r[k]??'')).join('|')+'|').join('\n')+'\n';}
for(const i of items){
 detail+=`## ${i.name}\n\n${i.nameJa} · ${i.sourceStatus==='listed_in_deleted_item_category'?'삭제 목록':'현재 목록'} · [원문](${i.japanese.source}) · 갱신 ${i.japanese.updatedAt??'미표기'}\n\n${rarityKo[i.japanese.rarity]} · ${fmtFields(i.japanese.fields)}\n\n`;
 if(i.aliasReason)detail+=`별칭: 원문 영문명 ${i.englishNameInJapaneseSource??'미표기'} / 일본어 표제 ${i.nameJa}. 이름을 연결해도 수치는 별도 관측값으로 보존한다.\n\n`;
 if(i.japanese.recipes.length)detail+=`직접 재료: ${recipeSummary(i)}\n\n`;
 const eff=effectSummary(i);if(eff)detail+=`특수 효과(일본어 원문): ${eff}\n\n`;
 if(i.japanese.additionalMechanicsJa.length)detail+=String.fromCharCode(10)+i.japanese.additionalMechanicsJa.map(s=>String.fromCharCode(45,32)+s).join(String.fromCharCode(10))+String.fromCharCode(10,10);
 const enEff=unique((i.indexed?.observations??[]).flatMap(o=>Object.entries(o.fields).filter(([k,v])=>/Buff|Special Effect|Effect|Dmg/.test(k)&&v).map(([k,v])=>`${k}: ${v}`)));
 if(enEff.length)detail+=`영문 목록의 효과 관측값: ${enEff.join(' / ')}\n\n`;
 for(const t of i.japanese.locations){detail+=`획득 표(${t.context.join(' / ')}):\n\n`;const rows=t.rows.map(r=>r.map(s=>{const k=stripped(s);return locationKo[k]??s}));detail+=smallTable(rows)+'\n';}
 for(const t of i.japanese.requiredMaterials){detail+='기초 재료별 획득 장소·수량(완성품 드롭 아님):\n\n';detail+=smallTable(t.rows.map((r,n)=>r.map((s,k)=>n&&k===0?translateName(s):s)))+'\n';}
 for(const t of i.japanese.craftRewards)detail+='제작 보상(트리 누적값 포함, 원문 구분 유지):\n\n'+smallTable(t.rows)+'\n';
 if(i.differences.length)detail+='출처 차이: '+i.differences.map(d=>`${d.field} 영문 ${d.indexedValue} ↔ 일본어 ${d.japaneseValue}`).join('; ')+'.\n\n';
}
await write('아이템_개별상세.md',detail);
let dif='# 출처 간 수치 차이와 검증 보류\n\n확인일 2026-11-01. 커뮤니티 위키는 서로 다른 패치·갱신 시점과 내부 오류를 포함한다. 아래 어느 한쪽을 최종 정답으로 자동 선택하지 않았다. 과거 공식 패치 한 건도 이후 변경 여부를 확인하지 않으면 서비스 종료 시점의 확정값이 아니다.\n\n## 캐릭터 기본 능력치 차이\n\n|캐릭터|능력치|영문 Lv1/Lv18|일본어 Lv1/Lv18|일본어 출처|\n|---|---|---|---|---|\n';
for(const d of characterDifferences)dif+=`|${d.name}|${d.stat}|${d.indexed.join('/')}|${d.japanese.join('/')}|[원문](${d.japaneseSource})|\n`;
dif+='\n## 같은 문서 안의 성장식 오류\n\n|캐릭터|능력치|레벨|원문 표|공개 성장값으로 계산|\n|---|---|---:|---:|---:|\n';
for(const d of growthErrors)dif+=`|${d.name}|${d.stat}|${d.level}|${d.observed}|${d.expectedFromPublishedGrowth}|\n`;
dif+='\n1~4성 끝점과 같은 페이지의 공통 성장값 불일치:\n\n|캐릭터|성급|능력치|원문 Lv18|공개 공통 성장값 계산|\n|---|---:|---|---:|---:|\n';
for(const d of lowerStarGrowthErrors)dif+=`|${d.name}|${d.stars}|${d.stat}|${d.observedLevel18}|${d.expectedLevel18}|\n`;
dif+='\n## 스킬 수치·판정 주의\n\n';for(const c of characters)dif+=`- ${c.nameKo} (${c.name}): ${c.notes}\n`;
dif+='\n## 아이템 숫자·등급 차이\n\n비교 대상: ATK, DEF, 회복량, 장탄, 등급. 효과 문구·제작법·지역 배치의 차이까지 모두 동일하다는 뜻은 아니다.\n\n|아이템|항목|영문 관측|일본어 관측|출처|\n|---|---|---|---|---|\n';
for(const i of itemDifferences)for(const d of i.differences)dif+=`|${esc(i.name)}|${d.field}|${esc(d.indexedValue)}|${esc(d.japaneseValue)}|[영문](${d.indexedSource}) / [일본어](${d.japaneseSource})|\n`;
dif+='\n## 직접 재료 이름 연결 보류\n\n';dif+=unresolvedRecipes.length?unresolvedRecipes.map(x=>`- ${x.item}: ${x.ingredient.name} (원문 ${x.ingredient.raw})`).join('\n'):'미연결 이름 없음. 이름 연결 검증은 실제 제작 가능 여부·소모 수량 검증과 다르다.';
dif+='\n\n## 아직 증명하지 못한 것\n\n- 모든 항목이 서비스 종료 직전의 동일한 패치라는 점.\n- 소스 코드로만 알 수 있는 반올림, 동시 피해·사망·회복 순서, 확률 합산 방식.\n- 문서에 없는 스킬 독립 CD, 스택 만료·상한 등을 0초·무제한으로 해석하는 것.\n- 아이템별 효과·제작법·배치의 모든 시기 차이. 숫자 대조와 원본 보존을 완료했으며, 전 항목에 대한 최종 공식 변경 이력 대조 완료를 뜻하지 않는다.\n';
await write('출처간_수치차이.md',dif);
const readme=`# 블랙서바이벌 원작 데이터 조사\n\n확인일: 2026-11-01. 이터널 리턴이 아닌 원작 블랙서바이벌 자료다. 연결된 공통 규칙 v0.2, 서번트 10종 관리표, 알트리아 v2.2를 읽고, 이 프로젝트의 캐릭터·보구 설계에 필요한 비교 자료로 수집했다. 사용자 원본 설계 TXT는 변경하지 않았다.\n\n## 이번에 확보한 범위\n\n- 원작 캐릭터 53명: 5성 ATK·DEF·HP·STA의 레벨 1/9/18과 성장값, 1~4성 레벨 1/18 표, 시작 숙련도.\n- 일반 개인전 스킬 106개: 발동 조건, 수치·계수, 비용·지속시간·재사용 시간 및 예외를 한국어로 정리. 미기재 수치는 미기재로 남김.\n- 아이템 662종: 일본어 위키 현재 목록 641종 및 삭제 목록 21종. 각각 개별 문서를 읽음. 영문 18개 분류의 644종·677행을 모두 연결.\n- 아이템별 등급·기본 수치, 장탄/묶음 수량, 효과, 직접·하위 제작 트리, 재료별 획득 장소·배치 수량, 제작 XP·숙련도 중 각 문서에 제공된 표를 보존. 무조건 모든 항목에 모든 필드가 있는 것은 아님.\n\n## 읽을 파일\n\n1. [캐릭터 53명 수치와 스킬](캐릭터_53명_수치와_스킬.md)\n2. [아이템 662종 분류표](아이템_662종_분류표.md)\n3. [아이템 개별 상세](아이템_개별상세.md)\n4. [출처 간 차이·미확정 사항](출처간_수치차이.md)\n\n반복해서 활용할 원자료: characters_full.json, items_full.json. 검사 결과: verification_audit.json. JSON에는 출처 URL·갱신 시각·원본 수치·이름 정규화 이유·다른 출처 값·직접 계산한 값 여부를 함께 저장했다.\n\n## 해석상 중요한 발견\n\n목록만 읽으면 삭제된 조잡한 시작 무기 7종이 현재 장비처럼 섞인다. 일본어 보존 문서에서는 삭제 목록에 속한다. 반대로 영문 목록에 없던 음식 4종은 일본어 현재 목록에서 추가로 확인했다. 총의 예전 실총 이름과 변경된 가상 이름도 별도로 연결했다.\n\n기본 능력치에서도 영문·일본어 간 ${characterDifferences.length}개 필드가 다르며, 일본어 5성 성장 표 자체의 불일치는 ${growthErrors.length}개 셀이다. 아이템 숫자·등급 차이는 ${itemDifferences.length}종에서 확인했다. VF 특성은 2022-04-20 삭제 기록이 있어 과거 수치로 분리했다. 이 차이를 무시하고 하나의 밸런스 표로 섞지 않는다.\n\n## 설계에 적용할 때\n\n목표는 마스터가 서번트를 운용하는 실시간 지역 탐색·제작·생존 PvP를 만드는 것이다. 원작 캐릭터를 비교할 때는 기본 능력치+성장+숙련도+장비 제작 비용+회복 경제+패시브/능동 스킬의 실전 기회비용을 함께 본다. 네 설계의 HP/STA, 패시브 1개+보구 1개, 생존용 영주 3획, 보구 사전 지역 예고 없음이라는 조건에 맞춰 변환해야 한다. 관리표의 선택지 10종을 한 경기 인원 10명으로 해석하지 않는다.\n\n이 조사에서 수집·대조를 완료한 것과 원작 최종 패치로 확정한 것은 다르다. 현재는 **모든 캐릭터 및 수집 목록 전체의 세부 자료를 확보한 상태**이며, 모든 값을 단일 최종 패치의 확정값이라고 주장할 수는 없다.\n\n주요 출처: [일본어 원작 위키](https://gamerch.com/blacksurvival), [영문 원작 능력치 표](https://blacksurvival.fandom.com/wiki/Character_Stats), [복원 프로젝트 위키](https://wiki.projectlumia.com/). 복원 프로젝트는 보조 비교 출처로만 사용했다. 각 상세의 직접 출처는 항목별 링크에 있다.\n`;
await write('README.md',readme);
console.log(JSON.stringify({...audit,characterStatDifferences:characterDifferences.length,growthErrors:growthErrors.length,unresolvedRecipeNames:unresolvedRecipes.slice(0,30)},null,2));
if(unmappedIndexed.length)throw Error('Unmapped indexed items: '+unmappedIndexed.join(', '));
