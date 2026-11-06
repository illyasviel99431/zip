/* Opponent inspection and combat feedback use only the server's public encounter view. */
const encounterView={peek:false,target:null,seen:new Set(),started:null};
const beforeEncounterStage=renderStage,beforeEncounterHud=updateHud,beforeEncounterFront=frontRender,beforeEncounterRail=switchSurvivalRail;
const servantEncounter=()=>{const enemy=state&&!window.frontScreen?currentEncounter():null;return enemy?.kind==='player'?enemy:null;};
frontRender=function(){encounterView.peek=false;encounterView.target=null;encounterView.seen.clear();encounterView.started=null;beforeEncounterFront();};
renderStage=function(){
 const host=$('#stage'),enemy=servantEncounter();if(!host)return;
 if(enemy){
  const key=JSON.stringify([enemy.character,enemy.nickname,window.CHARACTER_ART?.[enemy.character]?.src]);
  delete host.dataset.gameplayStage;
  if(host.dataset.encounterStage!==key){host.dataset.encounterStage=key;const c=CHARACTERS[enemy.character];host.innerHTML=`<div class="battle-opponent" aria-label="조우한 상대"><div class="battle-opponent-caption"><span>서번트 조우</span><strong>${esc(c.full)}</strong></div>${characterArtwork(enemy.character,'battle')}<div class="battle-opponent-foot"><span>${c.class}</span><b>${esc(enemy.nickname)}</b><small>공격하거나 이동해 교전을 벗어나세요.</small></div></div>`;}
  return;
 }
 if(host.dataset.encounterStage){delete host.dataset.encounterStage;delete host.dataset.gameplayStage;}
 beforeEncounterStage();
};
updateHud=function(){beforeEncounterHud();if(!state||window.frontScreen||!$('.survival-shell'))return;renderStage();paintEncounterHud();paintCombatFeedback();};
switchSurvivalRail=function(rail){if(servantEncounter()&&!rail){encounterView.peek=!encounterView.peek;paintEncounterHud();return;}if(servantEncounter())encounterView.peek=true;beforeEncounterRail(rail);paintEncounterHud();};
function paintEncounterHud(){
 const shell=$('.survival-shell');if(!shell)return;
 let panel=$('#opponent-panel');if(!panel){panel=document.createElement('section');panel.id='opponent-panel';panel.className='opponent-panel';panel.setAttribute('aria-label','조우한 상대의 정보와 장착 장비');shell.appendChild(panel);}
 if(!$('.opponent-return'))$('.rightcol').insertAdjacentHTML('afterbegin','<button class="opponent-return" data-encounter="opponent">상대 장비로 돌아가기 <kbd>N</kbd></button>');
 const enemy=servantEncounter(),target=enemy?JSON.stringify([enemy.character,enemy.nickname]):null;
 if(target!==encounterView.target){encounterView.target=target;encounterView.peek=false;}
 shell.dataset.servantEncounter=String(!!enemy);shell.dataset.encounterView=encounterView.peek?'bag':'opponent';panel.hidden=!enemy||encounterView.peek;
 if(!enemy){panel.innerHTML='';delete panel.dataset.signature;return;}
 const equipment=enemy.equipment||{weapon:enemy.weapon,head:null,body:null,arm:null,leg:null,accessory:null};
 const percent=Math.max(0,Math.min(100,Math.ceil(enemy.hp/enemy.maxHp*100))),c=CHARACTERS[enemy.character];
 const key=JSON.stringify([enemy.character,enemy.nickname,enemy.level,percent,equipment,enemy.weaponType,enemy.masteryGrade,remaining(enemy.markUntil)>0]);
 if(panel.dataset.signature!==key){panel.dataset.signature=key;
  panel.innerHTML=`<header class="opponent-heading"><div class="opponent-level" aria-label="상대 레벨 ${enemy.level||1}"><small>Lv.</small><b>${enemy.level||1}</b></div><div class="opponent-identity"><div class="opponent-name">${icon(c.icon)}<strong>${esc(enemy.nickname)}</strong></div><div class="opponent-character">${esc(c.full)} · ${c.class}</div><div class="opponent-health" aria-label="상대 체력 ${percent}%"><div class="opponent-hp-track"><i style="width:${percent}%"></i></div><b id="enemy-percent">${percent}%</b></div></div></header><div class="opponent-detail"><span>${typeName(enemy.weaponType)} <b>${esc(enemy.masteryGrade||'—')}</b></span><span>기척 <b id="encounter-time">${remaining(state.encounterUntil).toFixed(1)}</b>초</span></div><div class="opponent-equipment" aria-label="상대 장비 6칸">${['weapon','head','body','arm','leg','accessory'].map(slot=>{const item=ITEMS[equipment[slot]];return item?`<button class="opponent-slot rarity-${item.rarity}" data-action="guide" data-id="${item.id}" aria-label="상대 ${slotNames[slot]} · ${esc(item.name)}"><small>${slotNames[slot]}</small>${icon(itemIcon(item))}<span>${esc(item.name)}</span></button>`:`<div class="opponent-slot empty" aria-label="상대 ${slotNames[slot]} · 미장착"><small>${slotNames[slot]}</small>${icon({weapon:'sword',head:'helmet',body:'armor',arm:'shield',leg:'boot',accessory:'ring'}[slot])}<span>미장착</span></div>`;}).join('')}</div><div class="opponent-state" id="enemy-mark">${remaining(enemy.markUntil)>0?'<span class="debuff">마력 간섭 <span id="mark-time"></span></span>':''}</div><nav class="opponent-utilities" aria-label="조우 중 내 소지품"><button data-encounter="bag">내 가방 <kbd>N</kbd></button><button data-encounter="hp" aria-label="체력 음식 사용 1">HP 회복 <kbd>1</kbd></button><button data-encounter="sta" aria-label="스태미나 음식 사용 2">STA 회복 <kbd>2</kbd></button></nav>`;
 }
 const time=$('#encounter-time');if(time)time.textContent=remaining(state.encounterUntil).toFixed(1);
 const mark=$('#mark-time');if(mark)mark.textContent=remaining(enemy.markUntil).toFixed(1)+'초';
 for(const [kind,id] of [['hp','quick-hp'],['sta','quick-stamina']]){const b=panel.querySelector(`[data-encounter="${kind}"]`),original=$('#'+id);if(b&&original)b.disabled=original.disabled;}
}
function paintCombatFeedback(){
 const shell=$('.survival-shell');if(!shell)return;
 let host=$('#combat-feedback');if(!host){host=document.createElement('div');host.id='combat-feedback';host.setAttribute('aria-live','polite');host.setAttribute('aria-atomic','false');shell.appendChild(host);}
 const start=Math.round(state.started||0);if(encounterView.started!==start){encounterView.started=start;encounterView.seen.clear();host.replaceChildren();}
 for(const event of state.combatEvents||[]){
  if(encounterView.seen.has(event.id))continue;encounterView.seen.add(event.id);if(event.age>1.5)continue;
  const pop=document.createElement('div');pop.className='combat-float combat-float--'+event.kind;
  pop.style.setProperty('--combat-lane',(host.querySelectorAll('.combat-float--'+event.kind).length%3)*60+'px');
  const amount=document.createElement('strong');amount.textContent=event.value>0?(event.kind==='taken'?'−':'')+event.value:event.label;
  const label=document.createElement('span');label.textContent=event.value>0?(event.kind==='taken'?'받은 피해 · ':'피해 · ')+event.label:event.kind==='evade'?'상대의 일반 공격을 회피':'피해 없음';
  pop.append(amount,label);host.appendChild(pop);pop.addEventListener('animationend',()=>pop.remove(),{once:true});setTimeout(()=>pop.remove(),1800);
  while(host.children.length>6)host.firstElementChild.remove();
  if(event.kind==='taken'&&event.value>0){shell.classList.remove('combat-hit');void shell.offsetWidth;shell.classList.add('combat-hit');setTimeout(()=>shell.classList.remove('combat-hit'),550);}
 }
 if(encounterView.seen.size>80)encounterView.seen=new Set([...encounterView.seen].slice(-40));
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-encounter]');if(!b||b.disabled||window.frontScreen)return;e.preventDefault();const a=b.dataset.encounter;if(a==='bag'||a==='opponent'){encounterView.peek=a==='bag';if(a==='bag')beforeEncounterRail('bag');paintEncounterHud();}else if(a==='hp'||a==='sta')quickFood(a==='sta'?'stamina':'hp');});
