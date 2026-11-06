/* 성배전쟁 UI prototype. Browser-local interactions; no multiplayer connection. */
const DATA = window.GAME_DATA;
const ITEMS = Object.fromEntries(DATA.items.map(item => [item.id, item]));
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const paths = {
 grail:'M6 3h12v5a6 6 0 0 1-12 0V3Zm0 2H3v2a4 4 0 0 0 4 4m11-6h3v2a4 4 0 0 1-4 4m-5 3v6m-4 1h8',
 sword:'m4 20 3-3m-2-4 6 6m-4-5L18 3h3v3L10 17M15 6l3 3',
 spear:'M4 21 17 8m-1-4 5-2-2 6-5 2 2-6Zm-10 12 3 3',
 search:'M20 20l-5-5m2-6a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z',
 map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16',
 pin:'M18 10c0 5-6 11-6 11S6 15 6 10a6 6 0 1 1 12 0Zm-6-2v4m-2-2h4',
 people:'M16 21v-3a4 4 0 0 0-8 0v3m4-16a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm7 8a4 4 0 0 1 3 4v3M18 4a3 3 0 0 1 0 6M5 13a4 4 0 0 0-3 4v3M6 4a3 3 0 0 0 0 6',
 clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-5v5l3 2',
 settings:'M4 7h16M4 17h16M8 4v6m8 4v6',
 arrow:'M4 12h16m-6-6 6 6-6 6',
 chevron:'m9 5 7 7-7 7',
 chevrondown:'m5 9 7 7 7-7',
 close:'m6 6 12 12M6 18 18 6',
 book:'M3 4h7l2 2 2-2h7v16h-7l-2 1-2-1H3V4Zm9 2v15',
 shield:'m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6l8-3Zm0 5v7m-3-4h6',
 armor:'m7 3 5 2 5-2 5 5-5 4v9H7v-9L2 8l5-5Zm0 0v9m10-9v9',
 helmet:'M4 16v-5a8 8 0 0 1 16 0v5m-16-3 8 3 8-3m-8 3v6m-8-5 4 2v3m12-5-4 2v3',
 boot:'M7 3h8v10l5 3v4H4v-6l3-2V3Zm0 5h8m-8 3h8',
 ring:'M19 14a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-12-5L5 5l3-3h8l3 3-2 4M8 2l4 7 4-7',
 bread:'M5 11a4 4 0 0 1-1-7c2-2 4-1 5 0 2-2 4-2 6 0 2-1 4 0 5 2s0 4-1 5v9H5v-9Zm0 4h14M9 8v3m6-3v3',
 drop:'M12 2S5 10 5 15a7 7 0 0 0 14 0C19 10 12 2 12 2Zm-3 13a3 3 0 0 0 3 3',
 cube:'m12 2 9 5v10l-9 5-9-5V7l9-5ZM3 7l9 5 9-5m-9 5v10M7 4l10 6',
 hammer:'m4 20 9-9M11 5l4-3 7 7-3 4-8-8Zm0 0L8 8l4 4',
 leaf:'M20 3C7 3 2 10 5 16s15 4 15-13ZM4 21l12-12M9 15v-5m0 5h6',
 fire:'M13 2c1 5-4 6-3 10 3 0 4-3 4-3 7 8 2 13-3 13-7 0-10-10-4-16 0 3 2 4 2 4 2-3 3-5 4-8Z',
 snow:'M12 2v20M3 7l18 10M3 17 21 7M8 4l4 4 4-4M8 20l4-4 4 4M3 11l5-1-1-5m14 8-5 1 1 5M3 13l5 1-1 5m14-8-5-1 1-5',
 seal:'m12 2 4 7-4 4-4-4 4-7Zm-7 10 5 3-2 7-5-6 2-4Zm14 0-5 3 2 7 5-6-2-4',
 moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z',
 heart:'M12 21 3 12a6 6 0 0 1 9-8 6 6 0 0 1 9 8l-9 9Z',
 bolt:'m13 2-9 12h7l-1 8 10-13h-8l1-7Z',
 warning:'m12 3 10 18H2L12 3Zm0 6v5m0 3h.01',
 eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
 tree:'m12 2-6 8h3l-6 8h8v4m1-20 6 8h-3l6 8h-8',
 building:'M5 21V4h14v17M2 21h20M9 8h1m4 0h1M9 12h1m4 0h1M9 16h1m4 0h1m-4 5v-3h2v3',
 church:'M5 21V10l7-6 7 6v11M12 1v6M9 3h6M3 21h18m-11 0v-7h4v7',
 waves:'M2 8c3-5 7 5 10 0s7 5 10 0M2 13c3-5 7 5 10 0s7 5 10 0M2 18c3-5 7 5 10 0s7 5 10 0',
 anchor:'M12 6v15M9 4a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6 9h12M3 14c0 8 18 8 18 0M1 16l2-3 3 3m12 0 3-3 2 3',
 factory:'M3 21V9l6 4V9l6 4V3h4v18H3ZM6 17h2m3 0h2m3 0h1',
 animal:'M7 13a3 3 0 1 0-3-5 3 3 0 0 0 3 5Zm10 0a3 3 0 1 0 3-5 3 3 0 0 0-3 5Zm-8-6a2 2 0 1 0-3-3 2 2 0 0 0 3 3Zm6 0a2 2 0 1 0 3-3 2 2 0 0 0-3 3Zm-3 5c-3 0-8 7-5 9 2 1 3-1 5-1s3 2 5 1c3-2-2-9-5-9Z',
 check:'m5 12 4 4L19 6',
 target:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-4 0a5 5 0 1 1-10 0 5 5 0 0 1 10 0ZM12 2v4m0 12v4M2 12h4m12 0h4',
 reset:'M4 9a8 8 0 1 1 0 6m0-11v5h5',
 help:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 9a3 3 0 0 1 6 0c0 3-3 2-3 5m0 3h.01',
 flask:'M9 2h6M10 2v7l-5 9a3 3 0 0 0 3 4h8a3 3 0 0 0 3-4l-5-9V2M7 15h10',
 paper:'M5 2h10l4 4v16H5V2Zm10 0v5h4M8 11h8m-8 4h8m-8 4h5',
 feather:'M4 20 16 8M5 16c-6-9 14-17 15-11s-7 15-15 11Zm6-2h5m-5 0V9',
 cross:'M9 2h6v7h7v6h-7v7H9v-7H2V9h7V2Z'
};
const icon = (name, cls='') => {
 if(name.startsWith('item:')){
  const id=name.slice(5),art=window.GRAIL_ITEM_ART?.[id]||window.GRAIL_ITEM_ART?.[{tactical_rifle:'sgoty870',rail_rifle:'magnum_python'}[id]];
  if(art?.src)return `<img class="item-art ${cls}" data-item-art="${id}" src="${art.src}" width="${art.width}" height="${art.height}" alt="" aria-hidden="true" loading="lazy" decoding="async">`;
  if(art)return `<span class="item-art ${cls}" data-item-art="${id}" aria-hidden="true" style="--item-sheet:url('assets/items/${art.sheet}-v1.png');--item-size:${art.cols*100}% ${art.rows*100}%;--item-position:${art.cols>1?art.x/(art.cols-1)*100:0}% ${art.rows>1?art.y/(art.rows-1)*100:0}%"></span>`;
 }
 return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.cube}"/></svg>`;
};
const itemIcon = item => 'item:'+item.id;
const regionIcons = DATA.regions.map(r=>r.icon);
const rarityName = {Common:'일반',Uncommon:'고급',Rare:'희귀',Epic:'영웅'};
const slotNames = {weapon:'무기',head:'머리',body:'옷',arm:'팔',leg:'다리',accessory:'장식'};
const CHARACTERS = {
 artoria:{name:'알트리아',full:'알트리아 펜드래곤',class:'SABER',weapon:'long_sword',weaponType:'blade',maxHp:120,maxSta:112,attack:14,defense:14,hpGrowth:7,staGrowth:5,atkGrowth:2.3,defGrowth:2.2,passive:'대마력',passiveText:'받는 마법 피해 25% 감소',np:'엑스칼리버',npText:'같은 지역의 적 서번트에게 마법 추가 피해',cd:120,cast:2,cost:0,icon:'sword'},
 yukina:{name:'유키나',full:'히메라기 유키나',class:'LANCER',weapon:'short_spear',weaponType:'stab',maxHp:116,maxSta:124,attack:16,defense:12,hpGrowth:6,staGrowth:6,atkGrowth:2.2,defGrowth:2.2,passive:'영시',passiveText:'서번트의 다음 일반 공격 1회 회피',np:'설하랑',npText:'일반 공격 + 물리 추가 피해 · 마력 간섭 10초',cd:55,cast:0,cost:10,icon:'spear'}
};
let state, sequence=0, toastTimer, modalType='';
const clock = () => performance.now()/1000;
const character = () => CHARACTERS[state.character];
const region = () => DATA.regions.find(r=>r.id===state.region);
const remaining = until => Math.max(0,until-clock());
const timeString = seconds => `${Math.floor(Math.max(0,seconds)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,seconds)%60).toString().padStart(2,'0')}`;
let elapsed = () => clock()-state.started;
let nextClosure = () => state.closures?.find(c=>c.t>elapsed())?.t;
let closedRegions = () => [...GRAIL_WORLD.restricted(DATA),...(state.closures||[]).filter(c=>c.t<=elapsed()).flatMap(c=>c.ids)];
let closurePair = () => state.closures?.find(c=>c.t>elapsed())?.ids||[];
const currentEncounter = () => state.enemy && state.enemy.region===state.region && state.enemy.hp>0 && remaining(state.encounterUntil)>0 ? state.enemy : null;
let ownMaxHp = () => character().maxHp+(state.level-1)*character().hpGrowth;
const ownMaxSta = () => character().maxSta+(state.level-1)*character().staGrowth;
const attack = () => character().attack+(state.level-1)*character().atkGrowth+(ITEMS[state.equipment.weapon]?.attack||0)+(state.weaponAttackBonus||0);
const defense = () => character().defense+(state.level-1)*character().defGrowth+Object.values(state.equipment).reduce((sum,id)=>sum+(ITEMS[id]?.defense||0),0);
const shortNumber = num => Number.isInteger(num)?num:num.toFixed(1);
const countItem = (id,includeEquipped=true) => state.bag.filter(Boolean).filter(x=>x.id===id).reduce((sum,x)=>sum+x.qty,0)+(includeEquipped?Object.values(state.equipment).filter(x=>x===id).length:0);
const canCraft = item => !!item.recipe && item.recipe.inputs.every(input=>countItem(input.itemId)>=input.quantity);
const equippedSlot = id => Object.keys(state.equipment).find(slot=>state.equipment[slot]===id);
const running = () => !state.dead;
const actionBlocked = () => state.busy?.type==='np' || !running();

function start(characterId='artoria'){
 sequence++;
 if($('#modal').open) $('#modal').close();
 modalType='';
 state={character:characterId,started:clock(),region:5,level:1,xp:0,hp:CHARACTERS[characterId].maxHp,sta:CHARACTERS[characterId].maxSta,
  equipment:{weapon:CHARACTERS[characterId].weapon,head:null,body:'fabric_armor',arm:null,leg:null,accessory:null},
  bag:[{id:'bread',qty:2},{id:'water',qty:3},{id:'iron_ore',qty:1},{id:'scrap_metal',qty:1},null,null],
  target:characterId==='artoria'?'bastard_sword':'long_spear',tab:'bag',filter:'all',query:'',busy:null,rest:null,
  seals:3,sealUntil:0,hpFoodUntil:0,staFoodUntil:0,npUntil:0,attackUntil:0,moveUntil:0,evadeUntil:0,enemy:null,encounterUntil:0,
  result:null,logs:[],searches:0,kills:0,dead:false,zoneStep:GRAIL_WORLD.restricted(DATA).length,overloadPulse:0,warningDemo:false,closures:GRAIL_WORLD.closures(DATA),releasedLoot:[],stock:GRAIL_WORLD.stock(DATA),selected:null,guideHistory:[],guideId:null,mapFocus:null,ground:{}};
 GRAIL_WORLD.release(DATA,state,0);
 hadEncounter=false;
 log('사역 계약 성립. 숲에서 탐색을 시작합니다.','system');
 log('UI 테스트용 철광석·고철 각 1개가 지급되었습니다.','system');
 render();
}
function log(message,type='normal'){
 state.logs.unshift({message,type,time:timeString(elapsed())});
 if(state.logs.length>80)state.logs.length=80;
 renderLogs();
}
function toast(message){
 clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000);
}
function forestSvg(){return regionScene(state.region);}
function resourceMarkup(){
 return `<div class="resource hp"><div class="resource-label"><strong>HP <span>체력</span></strong><strong class="mono" id="hp-text"></strong></div><div class="bar"><i id="hp-bar"></i></div></div>
 <div class="resource sta"><div class="resource-label"><strong>STA <span>스태미나</span></strong><strong class="mono" id="sta-text"></strong></div><div class="bar"><i id="sta-bar"></i></div></div>
 <div class="resource xp"><div class="resource-label"><span>경험치</span><span class="mono" id="xp-text"></span></div><div class="bar"><i id="xp-bar"></i></div></div>`;
}
function itemStat(item){
 const stat=[];if(item.attack)stat.push(`공격력 +${item.attack}`);if(item.defense)stat.push(`방어력 +${item.defense}`);if(item.restoreAmount)stat.push(`${item.restoreResource==='hp'?'HP':'STA'} +${item.restoreAmount}`);if(!stat.length)stat.push('제작 재료');return stat.join(' · ');
}
function quickMarkup(resource,key){
 const s=state.bag.find(x=>x&&ITEMS[x.id].restoreResource===resource);const item=s&&ITEMS[s.id];return `<button class="quick-item ${resource==='stamina'?'stamina':''}" data-action="quick" data-resource="${resource}" id="quick-${resource}" ${!item?'disabled':''}>${icon(item?itemIcon(item):resource==='hp'?'heart':'drop')}<div><strong>${item?esc(item.name):'아이템 없음'}${s?' ×'+s.qty:''}</strong><div class="small" id="quick-${resource}-text">${resource==='hp'?'HP':'STA'} ${item?'+'+item.restoreAmount:'회복'}</div></div><kbd>${key}</kbd></button>`;
}
function renderLogs(){
 if(!state||!$('#logs'))return;
 $('#logs').innerHTML=state.logs.slice(0,3).map(l=>`<div class="log-line"><span class="log-time mono">${l.time}</span><span class="${l.type==='combat'?'gold':''}">${esc(l.message)}</span></div>`).join('');
}
function renderStage(){
 const stage=$('#stage');if(!stage)return;const e=currentEncounter();
 if(state.dead){stage.innerHTML=`<div class="event-card"><div class="event-type">CONTRACT ENDED</div><div class="event-symbol">${icon('grail')}</div><h2>계약이 종료되었습니다</h2><p class="stage-caption">이번 기록을 확인하고 다시 시작할 수 있습니다.</p><button class="outline-button" data-action="reset">다시 시작</button></div>`;return;}
 if(e?.kind==='player'){
  const c=CHARACTERS[e.character];
  stage.innerHTML=`<div class="event-card servant-encounter">${characterArtwork(e.character,'encounter')}<div class="encounter-info"><div class="event-type">SERVANT ENCOUNTER</div><div class="nickname">${esc(e.nickname)} · ${c.class}</div><h2>${c.full}</h2><div class="enemy-health"><div class="resource-label"><span>HP</span><span id="enemy-percent">${Math.ceil(e.hp/e.maxHp*100)}%</span></div><div class="bar"><i style="--width:${e.hp/e.maxHp*100}%"></i></div></div><div class="enemy-info">주무기 · ${esc(ITEMS[e.weapon].name)}</div><div id="enemy-mark">${remaining(e.markUntil)>0?`<span class="debuff">마력 간섭 <span id="mark-time">${remaining(e.markUntil).toFixed(1)}초</span></span>`:''}</div><div class="encounter-time">기척 유지 <span id="encounter-time">${remaining(state.encounterUntil).toFixed(1)}</span>초</div></div></div>`;return;
 }
 if(e){stage.innerHTML=`<div class="event-card"><div class="event-type">${e.kind==='player'?'SERVANT ENCOUNTER':'WILDLIFE ENCOUNTER'}</div><div class="event-symbol">${icon(e.kind==='player'?CHARACTERS[e.character].icon:'animal')}</div><div class="nickname">${e.kind==='player'?esc(e.nickname)+' · '+CHARACTERS[e.character].class:'야생동물'}</div><h2>${e.kind==='player'?CHARACTERS[e.character].full:esc(e.name)}</h2><div class="enemy-health"><div class="resource-label"><span>HP</span><span id="enemy-percent">${Math.ceil(e.hp/e.maxHp*100)}%</span></div><div class="bar"><i style="--width:${e.hp/e.maxHp*100}%"></i></div></div><div class="enemy-info">${e.kind==='player'?'주무기 · '+esc(ITEMS[e.weapon].name):'공격 시 살아 있으면 반격합니다'}</div><div id="enemy-mark">${remaining(e.markUntil)>0?`<span class="debuff">마력 간섭 <span id="mark-time">${remaining(e.markUntil).toFixed(1)}초</span></span>`:''}</div><div class="encounter-time">기척 유지 <span id="encounter-time">${remaining(state.encounterUntil).toFixed(1)}</span>초</div></div>`;return;}
 if(state.result){const item=ITEMS[state.result.id];stage.innerHTML=`<div class="event-card item"><div class="event-type">${state.result.full?'INVENTORY FULL':'ITEM DISCOVERED'}</div><div class="result-token rarity-${item.rarity}">${icon(itemIcon(item))}</div><h2>${esc(item.name)} <span class="muted">×${state.result.qty}</span></h2><div class="stage-caption">${state.result.full?'가방에 공간이 부족합니다.':'가방에 보관했습니다.'}<br>${esc(itemStat(item))}</div><button class="outline-button" style="width:auto;padding:9px 23px;margin-top:20px" data-action="found-detail" data-id="${item.id}">아이템 정보</button></div>`;return;}
 stage.innerHTML=`<div class="exploration-card"><span class="field-location-icon">${icon(regionIcons[state.region-1])}</span><span class="stage-eyebrow">탐색 준비</span><h1 class="stage-title">${esc(region().name)}</h1><p class="stage-caption">탐색으로 아이템과 주변의 기척을 찾아보세요.</p></div>`;
}
function gainXp(amount){
 state.xp+=amount;while(state.level<18&&state.xp>=10+2*(state.level-1)){state.xp-=10+2*(state.level-1);state.level++;if(elapsed()<660)state.hp=Math.min(ownMaxHp(),state.hp+character().hpGrowth);state.sta=Math.min(ownMaxSta(),state.sta+character().staGrowth);log(`Lv.${state.level} 달성. 능력치가 상승했습니다.`);$('#level-value').textContent=state.level;}
 if(state.level===18)state.xp=Math.min(state.xp,44);
}
function addItem(id,quantity){
 const bag=state.bag.map(x=>x?{...x}:null),item=ITEMS[id];let left=quantity;
 for(const slot of bag){if(slot&&slot.id===id&&slot.qty<item.stackLimit){const n=Math.min(item.stackLimit-slot.qty,left);slot.qty+=n;left-=n;}}
 while(left>0){const index=bag.indexOf(null);if(index<0)break;const qty=Math.min(item.stackLimit,left);bag[index]={id,qty};left-=qty;}
 state.bag=bag;return quantity-left;
}
function takeItem(id,quantity){
 let left=quantity;
 for(let i=0;i<state.bag.length&&left>0;i++){const slot=state.bag[i];if(slot?.id===id){const n=Math.min(left,slot.qty);slot.qty-=n;left-=n;if(!slot.qty)state.bag[i]=null;}}
 if(left>0){const equipped=equippedSlot(id);if(equipped){state.equipment[equipped]=null;left--;}}
 return left===0;
}
function spendSta(amount){
 const missing=Math.max(0,amount-state.sta);state.sta=Math.max(0,state.sta-amount);if(missing)damageSelf(missing*2,'스태미나 부족');
}
function damageSelf(amount,source){
 state.hp=Math.max(0,state.hp-amount);state.rest=null;log(`${source} · HP -${Math.ceil(amount)}`,'combat');$('.battlefield')?.classList.remove('hit-flash');requestAnimationFrame(()=>$('.battlefield')?.classList.add('hit-flash'));
 if(state.hp<=0){state.dead=true;state.busy=null;state.encounterUntil=0;log('계약이 종료되었습니다.','combat');render();}
}
function beginAction(type,label,duration,complete){
 if(actionBlocked())return false;state.rest=null;const token=++sequence;state.busy={type,label,duration,start:clock(),end:clock()+duration};updateHud();
 setTimeout(()=>{if(token!==sequence||!state.busy||state.dead)return;state.busy=null;complete();updateHud();},duration*1000);return true;
}
function cancelAction(){
 if(!state.busy)return;const label=state.busy.label;sequence++;state.busy=null;log(`${label} 취소. ${remaining(state.npUntil)>0?'이미 시작한 보구의 대기시간은 유지됩니다.':'예약한 재료는 소비되지 않았습니다.'}`);updateHud();
}
function search(){
 if(!running()||currentEncounter())return;if(state.busy){cancelAction();return;}state.rest=null;spendSta(3);if(state.dead)return;state.result=null;renderStage();
 beginAction('search','주변을 탐색하고 있습니다',1.5,()=>{state.searches++;gainXp(1);
  // Deliberately repeatable UI scenarios, not the production encounter probability engine.
  const n=state.searches%5;
  if(n===2){spawnEnemy('player');return;}if(n===4){spawnEnemy('animal');return;}
  const available=GRAIL_WORLD.available(DATA,state,state.region);
  if(!available.length){log('더 이상 발견한 물품이 없습니다.');toast('이 지역의 데모 아이템 재고를 모두 탐색했어.');render();return;}
  const found=available[(state.searches-1)%available.length];const qty=Math.min(found.quantityPerDiscovery,found.stockUnits);const put=addItem(found.itemId,qty);const stockKey=`${state.region}:${found.itemId}`;state.stock[stockKey]-=put;
  state.result={id:found.itemId,qty:put||qty,full:put<qty};state.enemy=null;log(put?`${ITEMS[found.itemId].name} ×${put} 획득.${put<qty?' 일부는 가방에 들어가지 않았습니다.':''}`:`${ITEMS[found.itemId].name} 발견. 가방 공간이 부족합니다.`);render();
 });
}
function spawnEnemy(kind){
 if(state.busy||state.dead){toast('현재 행동을 마친 뒤 사용할 수 있어.');return;}
 state.result=null;
 if(kind==='player'){
  const char=state.character==='artoria'?'yukina':'artoria',c=CHARACTERS[char];state.enemy={kind,character:char,nickname:char==='yukina'?'눈꽃의 계약자':'새벽의 계약자',maxHp:c.maxHp,hp:Math.floor(c.maxHp*.82),weapon:c.weapon,region:state.region,markUntil:0,evadeReady:char==='yukina'};
 }else{const a=DATA.animals.find(x=>x.id===region().animal);state.enemy={...a,kind:'animal',maxHp:a.hp,region:state.region};}
 state.encounterUntil=clock()+3;state.rest=null;log(kind==='player'?`${state.enemy.nickname} (${CHARACTERS[state.enemy.character].name}) 발견.`:`${state.enemy.name} 발견.`);renderStage();updateHud();
}
function floatingDamage(text){
 const el=document.createElement('div');el.className='damage-float';el.textContent=text;$('.stage').appendChild(el);setTimeout(()=>el.remove(),1150);
}
function basicDamage(target){
 const def=target.kind==='animal'?target.defense:CHARACTERS[target.character].defense+8;return Math.max(1,Math.floor(attack()*.9*100/(100+def)));
}
function hitEnemy(amount,label){
 const e=state.enemy;if(!e||e.hp<=0)return;e.hp=Math.max(0,e.hp-amount);state.encounterUntil=clock()+3;log(`${label} · ${e.kind==='player'?e.nickname:e.name}에게 ${amount} 피해.`,'combat');
 if(e.hp<=0){
  if(e.kind==='animal'){gainXp(e.killXp);for(const drop of e.drops){const put=addItem(drop.itemId,drop.quantity);log(`${ITEMS[drop.itemId].name} ×${put} 획득${put<drop.quantity?' · 가방 공간 부족':''}`);}}
  else{state.kills++;gainXp(20);toast('서번트를 쓰러뜨렸어. 이번 화면은 전투 UI 테스트 결과야.');}
  log(`${e.kind==='player'?e.nickname:e.name} 처치.`,'combat');state.encounterUntil=0;state.result=null;render();floatingDamage(amount);return;
 }
 renderStage();floatingDamage(amount);
}
function doAttack(){
 const e=currentEncounter();if(actionBlocked()||!e||remaining(state.attackUntil)>0)return;state.rest=null;state.attackUntil=clock()+1.5;state.encounterUntil=clock()+3;gainXp(1);
 if(e.kind==='player'&&e.evadeReady){e.evadeReady=false;log(`${e.nickname}의 영시 발동. 일반 공격을 회피했습니다.`,'combat');renderStage();floatingDamage('회피');updateHud();return;}
 hitEnemy(basicDamage(e),'일반 공격');
 if(e.kind==='animal'&&e.hp>0){const reflected=Math.max(1,Math.floor(e.attack*100/(100+defense())));damageSelf(reflected,`${e.name}의 반격`);}
 updateHud();
}
function useNp(){
 updateHud();if(!$('#np-button')||$('#np-button').disabled)return;const c=character();state.rest=null;state.npUntil=clock()+c.cd;
 if(c.cast){log(`${c.np} 시전을 시작합니다. 상대에게 사전 예고는 표시되지 않습니다.`);beginAction('np',`${c.np} 시전 중`,2,()=>{
  const e=state.enemy;if(e?.kind==='player'&&e.region===state.region&&e.hp>0){let amount=20+4*state.level;if(remaining(e.markUntil)>0){amount=Math.floor(amount*.5);e.markUntil=0;}hitEnemy(amount,'엑스칼리버');}else{log('엑스칼리버 발동. 같은 지역에 유효한 서번트가 없습니다.','combat');floatingDamage('발동');}updateHud();
 });}
 else{
  const e=currentEncounter();state.sta-=10;state.attackUntil=clock()+1.5;gainXp(1);const amount=basicDamage(e)+12+2*state.level;e.markUntil=clock()+10;hitEnemy(amount,'설하랑');if(e.hp>0)log('마력 간섭 적용 · 다음 신규 보구의 유키나 대상 추가 피해 50% 감소.');updateHud();
 }
}
function useFood(index){
 const slot=state.bag[index];if(!slot||state.dead)return;const i=ITEMS[slot.id];if(i.kind!=='food')return;
 if(state.busy?.type==='np'){toast('보구 시전 중에는 사용할 수 없어. Q로 시전을 취소할 수 있어.');return;}
 if(state.busy?.reserved?.includes(i.id)){toast('제작에 예약된 재료는 사용할 수 없어.');return;}
 const isHp=i.restoreResource==='hp',key=isHp?'hpFoodUntil':'staFoodUntil';if(remaining(state[key])>0){toast(`회복 아이템은 ${Math.ceil(remaining(state[key]))}초 후 사용할 수 있어.`);return;}
 if(isHp&&elapsed()>=660){toast('과부하 중에는 HP 회복이 제한돼.');return;}
 const resource=isHp?'hp':'sta',max=isHp?ownMaxHp():ownMaxSta();if(state[resource]>=max){toast(`${isHp?'HP':'STA'}가 가득 차 있어.`);return;}
 const before=state[resource];state[resource]=Math.min(max,before+i.restoreAmount);state[key]=clock()+5;takeBagSlot(index,1);closeModal();log(`${i.name} 사용 · ${isHp?'HP':'STA'} +${Math.ceil(state[resource]-before)}`);renderPanel();updateHud();
}
function takeBagSlot(index,qty){const slot=state.bag[index];if(!slot)return;slot.qty-=qty;if(slot.qty<=0)state.bag[index]=null;}
function quickFood(resource){const index=state.bag.findIndex(x=>x&&ITEMS[x.id].restoreResource===resource);if(index>=0)useFood(index);else toast('사용할 회복 아이템이 없어.');}
function equip(index){
 const slot=state.bag[index];if(slot&&ITEMS[slot.id].combatPending){toast('이 무기 계열의 전투는 준비 중입니다.');return;}if(!slot||actionBlocked()){toast('진행 중인 행동을 먼저 마쳐줘.');return;}const i=ITEMS[slot.id],dest=i.kind==='weapon'?'weapon':i.slot;
 closeModal();beginAction('equip',`${i.name} 장착 중`,.5,()=>{const old=state.equipment[dest];takeBagSlot(index,1);state.equipment[dest]=i.id;if(old)addItem(old,1);log(`${i.name} 장착 완료.`);render();});
}
function craft(id){
 const item=ITEMS[id];if(!canCraft(item)||actionBlocked())return;
 // Reserve ingredients until the atomic completion, matching the design document.
 const reserved=item.recipe.inputs.map(x=>x.itemId);const simulatedBag=state.bag.map(x=>x?{...x}:null),simEquipment={...state.equipment};const originalBag=state.bag,originalEquipment=state.equipment;
 state.bag=simulatedBag;state.equipment=simEquipment;for(const input of item.recipe.inputs)takeItem(input.itemId,input.quantity);const weaponIngredientConsumed=originalEquipment.weapon&&!simEquipment.weapon;
 const dest=item.kind==='weapon'?'weapon':item.kind==='armor'?item.slot:null;const autoEquip=!!dest&&!simEquipment[dest]&&(weaponIngredientConsumed||originalEquipment[dest]);
 const fits=autoEquip||addItem(id,item.recipe.outputQuantity)===item.recipe.outputQuantity;state.bag=originalBag;state.equipment=originalEquipment;
 if(!fits){toast('완성품을 보관할 공간이 부족해.');return;}
 closeModal();beginAction('craft',`${item.name} 제작 중`,1,()=>{
  for(const input of item.recipe.inputs)takeItem(input.itemId,input.quantity);
  if(autoEquip)state.equipment[dest]=id;else addItem(id,item.recipe.outputQuantity);
  gainXp({Common:1,Uncommon:2,Rare:3,Epic:4}[item.rarity]);log(`${item.name} ×${item.recipe.outputQuantity} 제작 완료${autoEquip?' · 자동 장착':''}.`);toast(`${item.name} 제작 완료${autoEquip?' · 장착했어':''}`);render();
 });if(state.busy)state.busy.reserved=reserved;
}
function travel(id,escape=false){
 if(state.dead||state.busy?.type==='np')return;if(id===state.region){toast('현재 있는 지역이야.');return;}if(closedRegions().includes(id)){toast('폐쇄된 지역으로는 이동할 수 없어.');return;}
 if(!escape&&remaining(state.moveUntil)>0){toast(`${remaining(state.moveUntil).toFixed(1)}초 후 이동할 수 있어.`);return;}
 if(escape&&(state.seals<=0||remaining(state.sealUntil)>0)){toast('지금은 령주를 사용할 수 없어.');return;}
 if(state.busy)cancelAction();state.rest=null;
 if(escape){state.seals--;state.sealUntil=clock()+30;}
 spendSta(5);if(state.dead)return;state.region=id;state.moveUntil=clock()+3;state.encounterUntil=0;state.enemy=null;state.result=null;state.warningDemo=false;state.zoneWarningPreview=null;log(`${region().name}(으)로 ${escape?'령주 도주':'이동'} · STA -5.`);closeModal();render();toast(`${region().name}에 도착했어.`);
}
function restDialog(){
 if(actionBlocked())return;if(state.rest){state.rest=null;log('휴식을 중지했습니다.');updateHud();return;}
 showModal('잠시 숨 고르기',`<p>한 번에 한 종류의 자원을 회복합니다.<br>다른 행동을 시작하거나 공격받으면 휴식이 중지됩니다.</p><div class="modal-actions"><button data-action="start-rest" data-resource="hp" ${elapsed()>=660?'disabled':''}>체력 회복 · HP 2/초</button><button data-action="start-rest" data-resource="sta">스태미나 회복 · STA 4/초</button></div>`,'rest');
}
function sealDialog(){
 if(!$('#seal-button')||$('#seal-button').disabled)return;showModal('령주로 명한다',`<p>남은 령주 <b class="gold">${state.seals}획</b> · 공통 대기시간 30초<br>령주는 회복과 도주에 사용됩니다.</p><div class="modal-actions"><button data-action="seal-heal" ${state.hp>=ownMaxHp()||remaining(state.hpFoodUntil)>0||elapsed()>=660?'disabled':''}>회복 · 최대 HP 15%</button><button data-action="seal-map">긴급 도주 · STA 5</button></div><p class="small">회복은 HP 회복 아이템과 5초 대기시간을 공유합니다.<br>도주는 기존 이동 대기시간을 무시합니다.</p>`,'seal');
}
function characterDialog(){
 showModal('서번트 선택',`<p>네 캐릭터의 HUD와 보구 동작을 확인할 수 있습니다.<br>서번트를 변경하면 현재 체험이 처음부터 시작됩니다.</p><div class="character-options">${Object.entries(CHARACTERS).map(([id,c])=>`<button class="character-option ${state.character===id?'active':''}" data-action="choose-character" data-id="${id}">${characterArtwork(id,'selection')}<div class="caps">${c.class}</div><strong>${c.full}</strong><div class="small">HP ${c.maxHp} · STA ${c.maxSta}<br>${c.passive} / ${c.np}<br>${c.passiveText}</div></button>`).join('')}</div><div class="testnote">4인 자유 생존전 · 캐릭터 중복 선택 가능<br>이 화면은 캐릭터 이미지 없이 구성한 UI 프로토타입입니다.</div>`,'character');
}
function scenariosDialog(){
 showModal('상황 테스트',`<p>원하는 장면을 바로 확인하는 UI 전용 도구입니다.<br>탐색 결과는 화면 확인을 위해 정해진 순서로 등장합니다.</p><div class="scenario-list"><button data-action="scenario" data-kind="player">${icon('sword')}<div>서번트 조우<span class="small">3초 유지 · 공격으로 기척 갱신</span></div></button><button data-action="scenario" data-kind="animal">${icon('animal')}<div>야생동물 발견<span class="small">일반 공격 · 생존 시 반격 · 처치 후 전리품</span></div></button><button data-action="scenario" data-kind="damage">${icon('heart')}<div>피격 및 회복 확인<span class="small">HP 30 감소 · 영시 회피도 확인 가능</span></div></button><button data-action="scenario" data-kind="warning">${icon('warning')}<div>내 지역 폐쇄 예고<span class="small">노란 경고·30초 표시 테스트</span></div></button><button data-action="scenario" data-kind="zone-closed">${icon('warning')}<div>내 지역 금지구역 경고<span class="small">폐쇄 경고 표시만 테스트 · 실제 폐쇄는 유지</span></div></button><button data-action="scenario" data-kind="zone-clear">${icon('check')}<div>지역 경고 테스트 해제<span class="small">실제 경기 상태의 경고로 돌아가기</span></div></button><button data-action="reset">${icon('reset')}<div>체험 초기화<span class="small">가방·장비·시간을 처음 상태로 되돌리기</span></div></button></div>`,'scenarios');
}
let previousTick=clock(),hadEncounter=false;
setInterval(()=>{
 if(!state||window.roomConnected||window.frontScreen||window.practiceCoreActive)return;const now=clock(),dt=Math.min(1,now-previousTick);previousTick=now;
 for(const wave of GRAIL_WORLD.release(DATA,state,elapsed(),closedRegions()))if(wave.at>0)log('희귀 재료가 섬 곳곳에 배치되었습니다.');
 if(state.rest&&!state.dead){if(state.rest==='hp'&&elapsed()<660)state.hp=Math.min(ownMaxHp(),state.hp+dt*2);else if(state.rest==='sta')state.sta=Math.min(ownMaxSta(),state.sta+dt*4);}
 const hasEncounter=!!currentEncounter();if(hadEncounter&&!hasEncounter){log('대상의 기척을 놓쳤습니다. 다시 탐색하세요.');renderStage();}hadEncounter=hasEncounter;
 const stage=closedRegions().length;if(stage!==state.zoneStep){state.zoneStep=stage;log('금지구역이 갱신되었습니다. 지도를 확인하세요.');if(modalType==='map')mapDialog(state.mapFocus,true);}
 if(elapsed()>=665&&!state.dead){const pulse=Math.floor((elapsed()-660)/5);if(pulse>state.overloadPulse){state.overloadPulse=pulse;damageSelf(Math.ceil(ownMaxHp()*.1),'과부하');}}
 updateHud();
},100);
