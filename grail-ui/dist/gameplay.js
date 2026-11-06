/* UI adapter; all actual actions use game-core.js, locally or via the room API. */
let practiceGame=null,practiceRoom=null,practicePlayer=null,practiceOffset=0,practiceResult=null,practiceSignature='';
const gameplayId=()=>crypto.randomUUID();
const gameplayActive=()=>!!practiceGame&&!window.frontScreen&&!window.roomConnected;
function gameAction(action,extra={}){
 if(window.roomConnected)return send(action,extra);
 if(!gameplayActive())return;
 try{practicePlayer.lastSeen=practiceGame.now();practiceGame.command(practiceRoom,practicePlayer,{action,requestId:gameplayId(),...extra});practiceGame.tick();syncPractice();}catch(e){toast(e.message);syncPractice();}
}
start=function(characterId='artoria'){
 sequence++;practiceOffset=0;practiceSignature='';practiceResult=null;window.practiceCoreActive=true;window.frontScreen=false;document.body.classList.remove('in-lobby');
 practiceGame=new GRAIL_GAME.GameCore(DATA,{now:()=>clock()+practiceOffset});
 const session=practiceGame.create({character:characterId,nickname:'나 · 혼자 연습'});
 [practiceRoom,practicePlayer]=practiceGame.auth(session.key);
 practiceRoom.practice=true;practicePlayer.startRegion=deploySelected||5;
 practiceGame.start(practiceRoom);state=null;closeModal();syncPractice();
};
function syncPractice(){
 if(!practiceGame||window.frontScreen||window.roomConnected)return;
 const snap=practiceGame.snapshot(practiceRoom,practicePlayer),incoming=snap.state,offset=clock()-snap.serverNow;
 for(const k of ['started','sealUntil','hpFoodUntil','staFoodUntil','npUntil','attackUntil','moveUntil','evadeUntil','encounterUntil','markUntil','stanceUntil','predictionUntil'])incoming[k]=incoming[k]?incoming[k]+offset:0;
 if(incoming.busy){incoming.busy.start+=offset;incoming.busy.end+=offset;}if(incoming.enemy?.markUntil)incoming.enemy.markUntil+=offset;for(const s of [...(incoming.statuses||[]),...(incoming.enemy?.statuses||[])])s.until+=offset;
 const old=state;state={target:characterIdTarget(incoming.character),filter:'all',query:'',selected:null,guideHistory:[],guideId:null,mapFocus:null,warningDemo:false,...old,...incoming};practiceResult=snap.result;
 const signature=JSON.stringify([state.character,state.region,state.equipment,state.dead]);
 if(!$('#stage')||signature!==practiceSignature){practiceSignature=signature;render();}else{renderStage();const bag=JSON.stringify(state.bag);if($('#panel').dataset.bag!==bag){renderPanel();$('#panel').dataset.bag=bag;}renderLogs();updateHud();}
 if(state.dead&&!state.practiceResultSeen){state.practiceResultSeen=true;showResults();}
}
const characterIdTarget=id=>CHARACTERS[id].goal;
search=()=>gameAction('search');doAttack=()=>gameAction('attack');useNp=()=>gameAction('np');cancelAction=()=>gameAction('cancel');
useFood=slot=>{closeModal();return gameAction('food',{slot});};
equip=slot=>chooseEquip(slot);craft=id=>chooseCraft(id);
travel=(id,seal=false)=>{closeModal();state.warningDemo=false;state.zoneWarningPreview=null;return gameAction('travel',{id,seal});};
pickupItem=slot=>{closeModal();return gameAction('pickup',{slot});};
discardItem=slot=>{closeModal();return gameAction('discard',{slot});};
const gameplayRestDialog=restDialog;
restDialog=function(){if(state.rest){gameAction('rest',{resource:state.rest});return;}gameplayRestDialog();};
function chooseEquip(slot,weaponType){
 const i=ITEMS[state.bag[slot]?.id];if(!i)return;
 const types=i.weaponTypes.filter(t=>['blade','stab','gun'].includes(t));
 if(i.kind==='weapon'&&types.length>1&&!weaponType)return showModal('장착할 무기 계열',`<p>${esc(i.name)}에 사용할 숙련도를 선택하세요. 선택한 계열만 성장합니다.</p><div class="modal-actions">${types.map(type=>`<button data-action="equip-type" data-slot="${slot}" data-type="${type}">${typeName(type)} · ${GRAIL_GAME.grade(state.mastery?.[type]||0)[0]}</button>`).join('')}</div>`,'weapon-type');
 closeModal();gameAction('equip',{slot,weaponType});
}
function chooseCraft(id,weaponType){
 const i=ITEMS[id];if(!i)return;const types=i.weaponTypes.filter(t=>['blade','stab','gun'].includes(t));
 if(types.length>1&&!weaponType)return showModal('제작 무기의 숙련도',`<p>${esc(i.name)}의 제작 숙련도를 받을 계열입니다. 장착 재료로 자동 교체된다면 같은 계열로 사용합니다.</p><div class="modal-actions">${types.map(type=>`<button data-action="craft-type" data-id="${id}" data-type="${type}">${typeName(type)} · ${GRAIL_GAME.grade(state.mastery?.[type]||0)[0]}</button>`).join('')}</div>`,'weapon-type');
 closeModal();gameAction('craft',{id,weaponType});
}
function typeName(type){return type==='blade'?'베기':type==='stab'?'찌르기':type==='gun'?'총':'맨손';}
function acquisitionMarkup(i){
 const waves=DATA.randomLoot.filter(w=>w.entries.some(e=>e.itemId===i.id));if(!waves.length)return '';
 return `<div class="acquisition-note"><strong>무작위 탐색 아이템</strong>${waves.map(w=>{const e=w.entries.find(e=>e.itemId===i.id);return `<p>${w.at?`경기 ${timeString(w.at)}`:'경기 시작'} · 맵 전체 ${e.stockDiscoveries*e.quantityPerDiscovery}개${e.quantityPerDiscovery>1?` (${e.stockDiscoveries}묶음)`:''}<br>${w.at&&!window.frontScreen?`<b data-rare-at="${w.at}"></b><br>`:''}등장할 때 열려 있는 일반 지역에 무작위 배치됩니다. 그 지역에서 탐색으로 획득하며, 실제 위치와 남은 재고는 공개하지 않습니다.</p>`;}).join('')}${['mithril','ogre_skin'].includes(i.id)?'<p>이 재료의 상위 제작법은 아직 미정입니다. 현재 제작 용도는 없습니다.</p>':''}${i.id==='meteorite'?'<p>운석 + 철광석 → 운석강. 운석강 + 돌멩이 → 문스톤.</p>':''}${i.id==='tree_of_life'?'<p>사용하면 STA 100 회복. STA 회복품의 5초 대기시간을 공유합니다.</p>':''}</div>`;
}
const gameplayEquipmentDialog=equipmentDialog;
equipmentDialog=function(){gameplayEquipmentDialog();if(!state.mastery)return;const body=$('#modal .modal-body');body.insertAdjacentHTML('beforeend',`<div class="mastery-summary"><button class="outline-button" data-action="mastery">무기 숙련도 보기</button>${ITEMS[state.equipment.weapon]?.weaponTypes.filter(t=>['blade','stab','gun'].includes(t)).map(type=>`<button class="small-btn" data-action="switch-type" data-type="${type}" ${state.weaponType===type?'disabled':''}>${typeName(type)} 사용 · 0.5초</button>`).join('')||''}</div>`);};
function masteryDialog(){
 const scores=state.mastery||{blade:21,stab:0};showModal('무기 숙련도',`<div class="mastery-overview">${['blade','stab','gun'].map(type=>{const score=scores[type],g=GRAIL_GAME.grade(score),next=GRAIL_GAME.GRADES.find(x=>x[1]>score);return `<section><h3>${typeName(type)} ${state.weaponType===type?'· 사용 중':''}</h3><strong>${g[0]} · ${score}점</strong><p>피해 배율 ${Math.round(g[2]*100)}% · 기본 명중 ${Math.round(g[3]*100)}%<br>${next?`${next[0]}까지 ${shortNumber(next[1]-score)}점`:'최고 등급'}</p></section>`;}).join('')}</div><p>공격 시도 +1 · 무기 제작 +0.5/1/1.5/2 · 금지 단계 생존 +3<br>공격 경험치는 실제 피해를 줬을 때만 지급합니다. 맨손은 배율55%·명중70%이며 성장하지 않습니다.</p><table class="mastery-table"><thead><tr><th>등급</th><th>점수</th><th>피해</th><th>명중</th></tr></thead><tbody>${GRAIL_GAME.GRADES.map(g=>`<tr><td>${g[0]}</td><td>${g[1]}</td><td>${Math.round(g[2]*100)}%</td><td>${Math.round(g[3]*100)}%</td></tr>`).join('')}</tbody></table>`,'mastery');
}
function corpseDialog(id){const c=state.corpses?.find(c=>c.id===id);if(!c){toast('현재 지역에서 발견한 시체가 없습니다.');return;}showModal(c.owner+' · 전리품',`<p>가져갈 물품을 선택하세요. 획득은 0.5초이며 다른 참가자가 먼저 가져갈 수 있습니다.</p><div class="corpse-loot-list">${c.entries.filter(e=>e.qty>0).map(e=>`<button data-action="corpse-loot" data-corpse="${c.id}" data-entry="${e.key}">${icon(itemIcon(ITEMS[e.id]))}<span>${esc(ITEMS[e.id].name)} ×${e.qty}</span><small>0.5초 회수</small></button>`).join('')}</div>`,'corpse');}
const gameplayGroundDialog=groundDialog;
groundDialog=function(){gameplayGroundDialog();$('#modal .modal-body').insertAdjacentHTML('beforeend',`<h3>발견한 시체</h3><div class="corpse-list">${state.corpses?.length?state.corpses.map(c=>`<button class="outline-button" data-action="corpse-open" data-corpse="${c.id}">${esc(c.owner)} · 남은 물품 ${c.entries.filter(e=>e.qty>0).length}묶음</button>`).join(''):'<p>이 지역에서 발견한 시체가 없습니다. 탐색으로 발견하거나 상대를 처치하면 표시됩니다.</p>'}</div>`);};
const gameplayStage=renderStage;
renderStage=function(){const host=$('#stage');if(!host)return;const enemy=currentEncounter();const key=JSON.stringify([state.dead,state.region,state.result,enemy&&[enemy.kind,enemy.character,enemy.nickname,enemy.hp,enemy.maxHp,enemy.weapon,remaining(enemy.markUntil)>0],state.corpseTarget,state.corpses?.map(c=>[c.id,c.entries.map(e=>e.qty)])]);if(host.dataset.gameplayStage===key)return;host.dataset.gameplayStage=key;if(state?.corpseTarget&&!currentEncounter()&&!state.result){const c=state.corpses?.find(c=>c.id===state.corpseTarget);if(c){$('#stage').innerHTML=`<div class="event-card"><div class="event-type">REMAINS DISCOVERED</div><h2>남겨진 계약</h2><p>${esc(c.owner)}의 시체를 발견했습니다.</p><button class="outline-button" data-action="corpse-open" data-corpse="${c.id}">전리품 선택</button></div>`;return;}}gameplayStage();};
showResults=function(){const result=window.roomConnected?roomView.result:practiceResult;if(!result)return;const own=result.own;showModal(result.practice?'혼자 연습 종료':result.won?'성배에 도달했습니다':result.draw?'무승부':'계약 종료',`<div class="result-summary">${icon('grail')}<h2>${result.practice?'연습 결과':result.won?'최후의 생존자':result.draw?'동시 탈락':'나의 전투 기록'}</h2><p>${timeString(state.elapsedSeconds||elapsed())} · ${esc(own.reason)}${result.finished?'':' · 경기는 계속 진행 중입니다.'}</p></div><div class="result-metrics">${[['생존 순위',result.practice?'—':own.rank+'위'],['처치',own.kills],['실제 피해량',own.damage],['보구 사용',own.npUses+'회'],['영시로 막은 피해',own.evadedDamage],['간섭으로 줄인 피해',own.interferencePrevented]].map(([k,v])=>`<div><span>${k}</span><strong>${v}</strong></div>`).join('')}</div>${result.finished&&!result.practice?`<div class="survivor-list">${result.players.sort((a,b)=>a.rank-b.rank).map(p=>`<div><span>${p.rank}위 · ${esc(p.nickname)}</span><span>처치 ${p.kills} · 피해 ${p.damage}</span></div>`).join('')}</div>`:''}<div class="modal-actions"><button data-front="${window.roomConnected?'leave':'practice-exit'}">로비로 돌아가기</button></div>`,'results');};
const gameplayHud=updateHud;
updateHud=function(){gameplayHud();if(!state||window.frontScreen)return;if($('#level-value'))$('#level-value').textContent=state.level;if(state.level>=18){$('#xp-text').textContent='최대 레벨';$('#xp-bar').style.width='100%';}document.querySelectorAll('.seals .seal').forEach((el,i)=>el.classList.toggle('spent',i>=state.seals));const el=$('#mastery-status');if(el){const score=state.weaponType?state.mastery?.[state.weaponType]||0:0;el.textContent=`${typeName(state.weaponType)} ${GRAIL_GAME.grade(score)[0]} · ${score}`;}for(const el of document.querySelectorAll('[data-rare-at]')){const left=Number(el.dataset.rareAt)-elapsed();el.textContent=left>0?`등장까지 ${timeString(left)}`:'등장 완료 · 열린 지역에서 탐색하세요';}if(state.markUntil>clock()&&$('#own-mark-status'))$('#own-mark-status').textContent=`마력 간섭 ${Math.ceil(remaining(state.markUntil))}초 · 다음 보구 사용 시 소비`;else if($('#own-mark-status'))$('#own-mark-status').textContent='';};
const gameplayRender=render;
render=function(){gameplayRender();if(!window.roomConnected){$('.match-label').textContent='혼자 연습 · 실제 참가자 없음';$('.subbar-right').innerHTML='<span>공통 게임 규칙 적용</span><span class="demo-chip">SOLO PRACTICE 13.0</span>';$('.footer').innerHTML='<span>혼자 연습 · 상황 테스트는 수동으로 생성하는 예시입니다</span><span>GRAIL WAR / ALPHA 13.0</span>';$('#alive-count').innerHTML='—';}const attrib=$('.self-attributes');if(attrib){attrib.lastElementChild.innerHTML='<button class="small-btn" id="mastery-status" data-action="mastery"></button>';attrib.insertAdjacentHTML('afterend','<p class="small" id="own-mark-status"></p>');}updateHud();};
scenariosDialog=function(){showModal('혼자 연습 · 상황 테스트',`<p>이 메뉴는 연습 전용입니다. 상대 서번트는 아래 버튼으로 만든 예시이며 실제 참가자나 자동 행동하는 봇이 아닙니다.</p><div class="scenario-list">${[['rider-kit','라이더 제작 재료 예시'],['player','서번트 조우 예시'],['animal','현재 지역 동물 발견'],['corpse','전리품 시체 예시'],['rare','3분 희귀 재료 등장 확인'],['damage','HP 30 감소'],['effects','상태 효과 묶음 예시'],['enemy-effects','상대 상태 효과 예시'],['interference','마력 간섭 받기'],['stun','기절과 행동 차단 확인'],['clear-effects','상태 효과 해제'],['warning','폐쇄 예고 표시'],['zone-closed','폐쇄 경고 표시'],['zone-clear','경고 테스트 해제']].map(([kind,label])=>`<button data-action="practice-scenario" data-kind="${kind}">${label}</button>`).join('')}<button data-action="practice-reset">연습 초기화</button></div><p>상태 효과 예시는 저항 없이 부여하는 연습 전용 테스트입니다. 실제 전투는 속성 저항을 적용합니다.</p><p>3분 확인은 연습 시간을 앞으로 이동시킵니다. 현재 지역이 폐쇄되면 실제로 탈락합니다.</p>`,'scenarios');};
function practiceScenario(kind){
 if(!gameplayActive()||practicePlayer.dead)return;const p=practicePlayer,r=practiceRoom,g=practiceGame;closeModal();
 if(kind==='rider-kit'){const ids=p.character==='link'?['steel','rapier']:p.character==='amuro'?['steel','gunpowder']:[];if(!ids.length)toast('라이더 캐릭터로 확인해 주세요.');for(const id of ids){const put=g.add(p,id,1);g.log(r,put?`제작 테스트 재료 · ${ITEMS[id].name} 1개 지급.`:'가방 공간이 부족합니다.');}}
 else if(kind==='player'){let dummy=r.players.find(x=>x!==p&&!x.dead);if(!dummy){dummy=g.player(p.character==='artoria'?'yukina':'artoria','상황 테스트용 서번트');const seed=new GRAIL_GAME.GameCore(DATA,{now:g.now});const s=seed.create({character:dummy.character,nickname:dummy.nickname});const [room,dp]=seed.auth(s.key);dp.startRegion=p.region;room.practice=true;seed.start(room);dummy=dp;r.players.push(dummy);}dummy.region=p.region;g.detect(p,dummy);}
 else if(kind==='animal'){const a=r.animals[p.region];if(a.hp>0)g.detect(p,a);else toast('이 지역 동물은 재출현 대기 중입니다.');}
 else if(kind==='corpse'){const c={id:gameplayId(),owner:'상황 테스트용 시체',region:p.region,entries:[{id:'bread',qty:2,key:gameplayId()},{id:'meteorite',qty:1,key:gameplayId()},{id:'long_sword',qty:1,key:gameplayId()}]};r.corpses.push(c);p.knownCorpses.push(c.id);p.corpseTarget=c.id;p.targetId=null;p.result=null;}
 else if(kind==='rare'){practiceOffset+=Math.max(0,180-g.elapsed(r));g.tick();}
 else if(kind==='damage'){p.hp=Math.max(0,p.hp-30);if(!p.hp)g.die(r,p,'연습 피격',g.now());}
 else if(['effects','enemy-effects','interference','stun'].includes(kind)){
  let source=r.players.find(x=>x!==p&&!x.dead);if(!source){practiceScenario('player');source=r.players.find(x=>x!==p&&!x.dead);}if(!source)return;
  const options={attribute:'NEUTRAL'};
  if(kind==='effects'){g.applyStatus(r,source,p,'weaken',{...options,duration:8});g.applyStatus(r,source,p,'blind',{...options,duration:6});g.applyStatus(r,source,p,'bleed',{...options,duration:10});g.applyStatus(r,p,p,'shield',{duration:10});}
  else if(kind==='enemy-effects'){g.applyStatus(r,p,source,'root',{...options,duration:3});g.applyStatus(r,p,source,'vulnerable',{...options,duration:8});source.region=p.region;g.detect(p,source);}
  else if(kind==='interference')g.applyStatus(r,source,p,'interference',options);
  else g.applyStatus(r,source,p,'stun',{...options,duration:2});
 }
 else if(kind==='clear-effects'){p.statusEffects={};p.marks={};p.controlImmuneUntil=0;p.controlStarted=null;r.queue=r.queue.filter(e=>e.type!=='dot'||e.target!==p.id);}
 else if(kind==='warning'){state.zoneWarningPreview='imminent';state.warningDemo=true;}
 else if(kind==='zone-closed'){state.zoneWarningPreview='closed';state.warningDemo=false;}
 else if(kind==='zone-clear'){state.zoneWarningPreview=null;state.warningDemo=false;}
 syncPractice();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b||b.disabled||window.frontScreen)return;const a=b.dataset.action;const own={mastery:masteryDialog,'equip-type':()=>chooseEquip(Number(b.dataset.slot),b.dataset.type),'craft-type':()=>chooseCraft(b.dataset.id,b.dataset.type),'switch-type':()=>{closeModal();gameAction('weapon-type',{weaponType:b.dataset.type});},'corpse-open':()=>corpseDialog(b.dataset.corpse),'corpse-loot':()=>{closeModal();gameAction('corpse-loot',{corpseId:b.dataset.corpse,entryKey:b.dataset.entry});},'practice-scenario':()=>practiceScenario(b.dataset.kind),'practice-reset':()=>start(state.character)};
 if(own[a]){e.preventDefault();e.stopImmediatePropagation();own[a]();return;}
 if(!gameplayActive())return;
 const commands={'start-rest':()=>gameAction('rest',{resource:b.dataset.resource==='stamina'?'sta':b.dataset.resource}),'seal-heal':()=>gameAction('seal-heal'),reset:()=>start(state.character)};
 if(commands[a]){e.preventDefault();e.stopImmediatePropagation();closeModal();commands[a]();}
},true);
setInterval(()=>{if(!gameplayActive())return;practicePlayer.lastSeen=practiceGame.now();practiceGame.tick();syncPractice();},100);
