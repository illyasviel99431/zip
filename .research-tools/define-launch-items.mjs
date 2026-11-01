import fs from 'node:fs/promises';
const base='설계서 정리';
const reference=JSON.parse(await fs.readFile(`${base}/원작 데이터/items_full.json`,'utf8')).items;
const byName=new Map(reference.map(i=>[i.name,i]));
const roots=['Monohoshizao',"Hades' Edge",'Lance of Poseidon','Beam Axe','Crystal Tiara','Close Helm','Crusader Armor','Sunset Armor','Steel Shield','Crimson Bracelet','Battle Boots','Maverick Runner','Moonlight Pendant','Eye of Horus','Garlic Ramen','Hot Ramen','Healing Potion','Garlic Bread','Hot Honey Water','Herbal Tea','Purified Water'];
const selected=new Set();
function include(name,trail=[]){if(trail.includes(name))throw Error('Recipe cycle '+[...trail,name].join(' -> '));if(selected.has(name))return;const i=byName.get(name);if(!i)throw Error('Missing '+name);selected.add(name);for(const x of i.japanese.recipes[0]?.ingredients??[])include(x.name,[...trail,name]);}
roots.forEach(n=>include(n));
const labels={
'Monohoshizao':'모노호시자오','Odachi':'오다치','Katana':'카타나','Iron Sheet':'철판','Scrap Metal':'고철','Hammer':'망치','Blueprint':'정교한 도면','Thick Paper':'두꺼운 종이','Fountain Pen':'만년필',"Hades' Edge":'하데스 엣지','Bastard Sword':'바스타드 소드','Steel':'강철','Iron Ore':'철광석','Long Sword':'장검','Rapier':'레이피어','Sabre':'사브르','Heated Whetstone':'달궈진 숫돌','Lighter':'라이터','Whetstone':'숫돌','Shamshir':'샴시르','Lance of Poseidon':'포세이돈의 창','Trident':'트라이던트','Twin Sword':'쌍칼','Sharp Kitchen Knife':'날카로운 식칼','Kitchen Knife':'식칼','Long Spear':'장창','Short Spear':'단창','Spear Handle':'창자루','Purified Water':'정화수','Boiling Water':'뜨거운 물','Water':'물','Ice':'얼음','Beam Axe':'빔 액스','Plasma Sword':'플라즈마 소드','Laser Pointer':'레이저 포인터','Battle Axe':'배틀 액스','Hatchet':'손도끼','Bamboo':'대나무','Crystal Tiara':'수정 티아라','Tiara':'티아라','Circlet':'서클릿','Hairband':'머리띠','Branch':'나뭇가지','Wire':'철사','Glass Pieces':'유리 조각','Glass Cup':'유리잔','Stone':'돌멩이','Close Helm':'투구','Mask':'가면','Glasses':'안경','Feather':'깃털','Steel Chain':'쇠사슬','Crusader Armor':'십자군 갑옷','Sheet Metal Armor':'판금 갑옷','Fabric Armor':'천 갑옷',"Bishop's Cassock":'주교복','Cassock':'사제복','Cross':'십자가','Sunset Armor':'황혼의 갑옷','Ruby':'루비','Gemstone':'원석','Steel Shield':'강철 방패','Leather Shield':'가죽 방패','Turtle Shell':'거북이 등딱지','Leather':'가죽','Crimson Bracelet':'진홍 팔찌','Bracelet':'팔찌','Battle Boots':'전투화','Advanced Military Boots':'기능성 군화','Boots':'부츠','Cloth':'천','Knee Pads':'무릎 보호대','Maverick Runner':'매버릭 러너','Heelys':'힐리스','Running Shoes':'운동화','Iron Ball':'쇠구슬','Electronic Parts':'전자 부품','Battery':'배터리','Moonlight Pendant':'달빛 펜던트','Moon Stone':'문스톤','Meteorsteel':'운석강','Meteorite':'운석','Ribbon':'리본','Eye of Horus':'호루스의 눈','Ancient Elixir Stone':'고대 영약석','Herb':'약초','Oriental Grass':'약초 잎','Flower':'꽃','Flint':'부싯돌','Gunpowder':'화약','Piano Wire':'피아노선','Garlic Ramen':'마늘 라면','Hot Ramen':'뜨거운 라면','Ramen':'라면','Garlic':'마늘','Healing Potion':'회복 물약','Glass Bottle':'유리병','Garlic Bread':'마늘빵','Bread':'빵','Hot Honey Water':'뜨거운 꿀물','Honey':'꿀','Herbal Tea':'약초차'
};
const locations={
'Katana':[1,4],'Scrap Metal':[3,7],'Hammer':[3,7],'Thick Paper':[2,4],'Fountain Pen':[2,8],'Iron Ore':[3,5],'Long Sword':[1,4],'Lighter':[7,8],'Whetstone':[3,8],'Shamshir':[1,7],'Kitchen Knife':[1,8],'Short Spear':[5,6],'Spear Handle':[5,6],'Water':[2,5,6,7],'Ice':[6,8],'Laser Pointer':[2,3],'Hatchet':[5,7],'Bamboo':[5,6],'Hairband':[2,4],'Branch':[5,6],'Wire':[2,3],'Glass Cup':[1,8],'Stone':[5,6],'Glasses':[2,8],'Feather':[5,7],'Steel Chain':[3,7],'Fabric Armor':[1,7],'Cassock':[4,8],'Cross':[4,6],'Gemstone':[4,8],'Turtle Shell':[6,7],'Leather':[1,5],'Bracelet':[1,4],'Boots':[3,7],'Cloth':[1,7],'Running Shoes':[2,8],'Iron Ball':[3,7],'Battery':[2,3],'Meteorite':[3,6],'Ribbon':[1,8],'Oriental Grass':[4,5],'Flower':[1,4],'Gunpowder':[3,7],'Piano Wire':[2,8],'Ramen':[2,8],'Garlic':[1,8],'Glass Bottle':[4,8],'Bread':[1,2],'Honey':[5,6]
};
const areas=[{id:1,name:'주택가',animal:'bat'},{id:2,name:'학교',animal:'crow'},{id:3,name:'공장',animal:'dog'},{id:4,name:'성당',animal:'bat'},{id:5,name:'숲',animal:'bear'},{id:6,name:'연못',animal:'crow'},{id:7,name:'항구',animal:'dog'},{id:8,name:'호텔',animal:'bat'}];
const rarityKo={Common:'일반',Uncommon:'고급',Rare:'희귀',Epic:'영웅',Legendary:'전설'};
const effectMap={
'Monohoshizao':[{id:'accuracy_bonus',value:0.03,description:'명중률 +3%p'}],
'Plasma Sword':[{id:'on_hit_magic',value:3,description:'기본 공격 및 기본 공격 동반 보구 적중 시 MAGIC 추가 피해3'}],
'Beam Axe':[{id:'on_hit_magic',value:5,description:'기본 공격 및 기본 공격 동반 보구 적중 시 MAGIC 추가 피해5'}],
'Crystal Tiara':[{id:'max_hp',value:15,description:'최대HP +15'}],
'Crusader Armor':[{id:'magic_damage_reduction',value:0.10,description:'MAGIC 피해10% 감소'}],
'Sunset Armor':[{id:'max_hp',value:25,description:'최대HP +25'}],
'Crimson Bracelet':[{id:'max_hp',value:10,description:'최대HP +10'}],
'Battle Boots':[{id:'move_stamina_reduction',value:1,description:'일반 이동 STA 소모 -1'}],
'Maverick Runner':[{id:'search_stamina_reduction',value:1,description:'탐색 STA 소모 -1'}],
'Moon Stone':[{id:'on_hit_magic',value:3,description:'기본 공격 및 기본 공격 동반 보구 적중 시 MAGIC 추가 피해3'}],
'Moonlight Pendant':[{id:'on_hit_magic',value:4,description:'기본 공격 및 기본 공격 동반 보구 적중 시 MAGIC 추가 피해4'}],
'Eye of Horus':[{id:'max_hp',value:20,description:'최대HP +20'},{id:'hp_food_recovery',value:0.20,description:'HP 음식·물약 회복량20% 증가; 령주·휴식·레벨업에는 미적용'}]
};
const number=s=>Number(String(s??'').normalize('NFKC').replace(/[^0-9.\-]/g,''));
const items=[...selected].map((name,index)=>{
 const ref=byName.get(name),f=ref.japanese.fields,weaponTypes=String(f['武器種']??'').split('・').filter(t=>['斬り','突き'].includes(t)).map(t=>t==='斬り'?'blade':'stab');
 const slot={'頭':'head','服':'body','腕':'arm','脚':'leg','装具':'accessory'}[f['防具種']];
 const resource={'食料':'hp','飲料':'stamina'}[f['種別']];
 const kind=weaponTypes.length?'weapon':slot?'armor':resource?'food':'material';
 const quantity=kind==='weapon'||kind==='armor'?1:Math.max(1,number(f['個数'])||1);
 const recipe=ref.japanese.recipes[0];
 const dropQuantity=name==='Iron Ball'?1:quantity;
 const lootLocations=recipe?[]:(locations[name]??[]);
 if(!labels[name])throw Error('Missing Korean label '+name);
 if(!recipe&&lootLocations.length<2)throw Error('Missing source locations '+name);
 let attack=kind==='weapon'?number(f['攻撃力']):0;
 if(name==='Bastard Sword')attack=34;
 if(name==='Beam Axe')attack=43;
 return {id:name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''),name:labels[name],referenceName:name,kind,weaponTypes,slot:slot??null,rarity:ref.japanese.rarity,attack,defense:kind==='armor'?number(f['防御力']):0,restoreResource:resource??null,restoreAmount:resource?number(f['回復量']):0,stackLimit:kind==='weapon'||kind==='armor'?1:resource?5:10,effects:effectMap[name]??[],recipe:recipe?{inputs:recipe.ingredients.map(i=>({referenceName:i.name,quantity:1})),outputQuantity:quantity,durationSeconds:1}:null,loot:recipe?null:{regionIds:lootLocations,quantityPerDiscovery:dropQuantity,stockUnitsPerRegion:dropQuantity*(name==='Meteorite'?1:ref.japanese.rarity==='Uncommon'?3:6)},reference:{id:ref.id,url:ref.japanese.source,fields:f},projectRule:'원작 이름·기본 수치·제작 경로를 참고한 본 게임 채택값. 입력 각1개·산출량·배치·효과는 이 데이터만 적용하며 원작 최종 패치 복제가 아니다.'};
});
const idByRef=new Map(items.map(i=>[i.referenceName,i.id]));
for(const i of items)for(const input of i.recipe?.inputs??[])input.itemId=idByRef.get(input.referenceName);
for(const area of areas)area.loot=items.filter(i=>i.loot?.regionIds.includes(area.id)).map(i=>({itemId:i.id,stockUnits:i.loot.stockUnitsPerRegion,quantityPerDiscovery:i.loot.quantityPerDiscovery}));
const data={version:'0.1',status:'first_release_implementation_baseline_numbers_tunable',basis:'Selected recipe closure from the researched original item data; this game deliberately supplies its own effects, quantities and region stocks',roots:roots.map(n=>idByRef.get(n)),items,regions:areas,animals:[{id:'bat',name:'박쥐',hp:40,attack:8,defense:0,killXp:4,respawnSeconds:60,drops:[{itemId:idByRef.get('Bread'),quantity:1},{itemId:idByRef.get('Leather'),quantity:1}]},{id:'crow',name:'까마귀',hp:60,attack:10,defense:5,killXp:6,respawnSeconds:75,drops:[{itemId:idByRef.get('Feather'),quantity:1},{itemId:idByRef.get('Oriental Grass'),quantity:1}]},{id:'dog',name:'들개',hp:110,attack:16,defense:10,killXp:10,respawnSeconds:100,drops:[{itemId:idByRef.get('Leather'),quantity:2},{itemId:idByRef.get('Lighter'),quantity:1}]},{id:'bear',name:'곰',hp:180,attack:24,defense:20,killXp:16,respawnSeconds:150,drops:[{itemId:idByRef.get('Leather'),quantity:2},{itemId:idByRef.get('Honey'),quantity:1}]}]};
await fs.writeFile(`${base}/게임_아이템_데이터.json`,JSON.stringify(data,null,2));
let appendix='\n\n부록 A. 첫 버전 아이템·제작·지역 데이터\n==============================================\n';
appendix+=`활성 아이템 ${items.length}종. 일반 직접 획득 ${items.filter(i=>i.loot).length}종, 제작 ${items.filter(i=>i.recipe).length}종.\n`;
appendix+='원작 조사662종은 참고 자료로 보존하며, 첫 버전 실제 적용 목록은 이 부록과 게임_아이템_데이터.json이다.\n원작의 모든 효과·배치·수량을 자동 상속하지 않는다. 재료는 각 종류1개씩 소비하며 산출 수량은 아래 표에 따른다.\n숫돌·운석강은 제작 재료로만 사용. 둔기·투척·함정 계열이었던 재료는 이 버전에서 장착·설치할 수 없다.\n등급에 따른 숨은 고정 피해 감소는 없고 표시된 DEF와 효과만 적용한다.\n\n';
appendix+='이름 | 원작 식별명 | 분류 | 채택 수치 | 제작(각 재료1개) → 산출 | 명시 효과\n';
for(const i of items){const stats=i.kind==='weapon'?`ATK${i.attack} / ${i.weaponTypes.join('+')}`:i.kind==='armor'?`DEF${i.defense} / ${i.slot}`:i.kind==='food'?`${i.restoreResource} ${i.restoreAmount}`:'재료';appendix+=`${i.name} | ${i.referenceName} | ${rarityKo[i.rarity]} | ${stats} | ${i.recipe?i.recipe.inputs.map(x=>labels[x.referenceName]).join('+')+' → '+i.recipe.outputQuantity+'개':'지역 획득'} | ${i.effects.map(e=>e.description).join('; ')||'없음'}\n`;}
appendix+='\n직접 획득 재료의 배치(괄호는 지역별 초기 단위 재고/한 번에 획득하는 단위 수):\n';
for(const area of areas){appendix+=`\n${area.id}. ${area.name} / 동물 ${data.animals.find(a=>a.id===area.animal).name}\n`;appendix+=area.loot.map(l=>`${items.find(i=>i.id===l.itemId).name}(${l.stockUnits}/${l.quantityPerDiscovery})`).join(', ')+'\n';}
appendix+='\n원작 자료와 의도적으로 다르게 채택한 주요 값:\n- 바스타드 소드 ATK34: 분류표34/개별 문서26 충돌 중 프로젝트값34 채택.\n- 빔 액스 ATK43+마술 추가5: 원작 개별 ATK47·광학 무기 효과를 프로젝트용으로 재설계.\n- 모노호시자오 명중+3%p: 원작의 명중 감소·시간제 스택을 단순화.\n- 플라즈마 소드·문스톤·달빛 펜던트: MAGIC 추가 피해로 명시.\n- 방어구의 등급별 고정 감소, 파손 방지, 범위 밖 계열 대응 효과는 자동 도입하지 않음.\n- 각 제조 입력1개, 산출 수량·유한 지역 배치·동물 드롭은 프로젝트 채택값.\n';
await fs.mkdir('.research-cache/system',{recursive:true});await fs.writeFile('.research-cache/system/item-appendix.md',appendix);
console.log(JSON.stringify({items:items.length,leafItems:items.filter(i=>i.loot).length,recipes:items.filter(i=>i.recipe).length,weapons:items.filter(i=>i.kind==='weapon').length,armor:items.filter(i=>i.kind==='armor').length,food:items.filter(i=>i.kind==='food').length,materials:items.filter(i=>i.kind==='material').length,regionRows:areas.map(a=>[a.name,a.loot.length])}));
