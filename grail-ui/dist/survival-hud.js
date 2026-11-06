/* Full-scene survival HUD. Existing action handlers and authoritative rules stay in use. */
const survivalView={rail:'bag',goal:false};
const beforeSurvivalRender=render,beforeSurvivalHud=updateHud,beforeSurvivalPanel=renderPanel,beforeSurvivalFront=frontRender;
frontRender=function(){document.body.classList.remove('survival-playing');beforeSurvivalFront();};
render=function(){beforeSurvivalRender();mountSurvivalHud();updateHud();};
renderPanel=function(){beforeSurvivalPanel();if($('.survival-shell'))paintSurvivalRail();};
updateHud=function(){beforeSurvivalHud();if(!state||window.frontScreen||!$('.survival-shell'))return;paintSurvivalRail();$('.self-card')?.classList.toggle('hp-low',!state.dead&&state.hp/ownMaxHp()<=.25);};
function mountSurvivalHud(){
 const shell=$('.shell');if(!shell||window.frontScreen)return;
 shell.classList.add('survival-shell');document.body.classList.add('survival-playing');
 const warning=$('#warning-host');if(warning)shell.appendChild(warning);
 shell.dataset.rail=survivalView.rail;shell.dataset.goalExpanded=String(survivalView.goal);
 const sceneTop=$('.scene-top>div'),mode=$('#mode-pill');if(sceneTop&&mode)sceneTop.appendChild(mode);
 const tools=document.createElement('nav');tools.className='hud-tools';tools.setAttribute('aria-label','연습 도구');const sceneMenu=$('.scene-menu');if(sceneMenu)tools.appendChild(sceneMenu);shell.appendChild(tools);
 const goal=$('.goal-section');goal.insertAdjacentHTML('afterbegin',`<div class="hud-goal-heading"><span>제작 목표</span><button data-action="catalog" aria-label="제작 목표 아이템 변경">${icon('book')} 도감</button></div>`);
 goal.insertAdjacentHTML('beforeend',`<button class="hud-goal-toggle" data-hud="goal" aria-expanded="${survivalView.goal}" aria-label="목표 재료 ${survivalView.goal?'접기':'펼치기'}">${icon('chevrondown')}<span>재료 ${survivalView.goal?'접기':'보기'}</span></button>`);
 const rail=$('.rightcol');rail.insertAdjacentHTML('afterbegin',`<div class="hud-rail-tabs" role="group" aria-label="아이템 슬롯 전환"><button data-hud="rail" data-rail="bag" aria-pressed="${survivalView.rail==='bag'}">가방 <small id="hud-bag-count"></small></button><button data-hud="rail" data-rail="equipment" aria-pressed="${survivalView.rail==='equipment'}">장비</button><kbd>N</kbd></div>`);
 const equipment=document.createElement('div');equipment.className='hud-equipment';equipment.setAttribute('aria-label','장착한 장비');rail.insertBefore(equipment,$('.tool-launchers'));
 $('.log-head .caps').textContent='전장 기록';paintSurvivalRail();
}
function paintSurvivalRail(){
 const shell=$('.survival-shell');if(!shell||!state?.equipment)return;
 shell.dataset.rail=survivalView.rail;const count=$('#hud-bag-count');if(count)count.textContent=`${state.bag.filter(Boolean).length}/6`;
 document.querySelectorAll('.hud-rail-tabs [data-rail]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rail===survivalView.rail)));
 const host=$('.hud-equipment');if(!host)return;
 const signature=JSON.stringify(state.equipment);if(host.dataset.equipment===signature)return;host.dataset.equipment=signature;
 const symbols={weapon:'sword',head:'helmet',body:'armor',arm:'shield',leg:'boot',accessory:'ring'};
 host.innerHTML=Object.entries(state.equipment).map(([slot,id])=>{const i=ITEMS[id];return `<button class="hud-equipment-slot ${i?'rarity-'+i.rarity:'is-empty'}" data-action="equipped" data-slot="${slot}" aria-label="${slotNames[slot]} · ${i?esc(i.name):'미장착'}" ${i?'':'disabled'}><span class="hud-slot-type">${slotNames[slot]}</span><span class="hud-equipment-icon">${i?icon(itemIcon(i)):icon(symbols[slot])}</span><span class="hud-equipment-name">${i?esc(i.name):'미장착'}</span>${i?`<span class="hud-equipment-value">${i.kind==='weapon'?'공격 '+i.attack:'방어 '+i.defense}</span>`:''}</button>`;}).join('');
}
function switchSurvivalRail(rail){survivalView.rail=rail|| (survivalView.rail==='bag'?'equipment':'bag');paintSurvivalRail();}
document.addEventListener('click',e=>{const b=e.target.closest('[data-hud]');if(!b||window.frontScreen)return;e.preventDefault();if(b.dataset.hud==='rail')switchSurvivalRail(b.dataset.rail);else if(b.dataset.hud==='goal'){survivalView.goal=!survivalView.goal;$('.survival-shell').dataset.goalExpanded=String(survivalView.goal);b.setAttribute('aria-expanded',String(survivalView.goal));b.setAttribute('aria-label','목표 재료 '+(survivalView.goal?'접기':'펼치기'));b.querySelector('span').textContent='재료 '+(survivalView.goal?'접기':'보기');}});
document.addEventListener('keydown',e=>{if(e.key.toLowerCase()!=='n'||window.frontScreen||!$('.survival-shell')||e.repeat||e.ctrlKey||e.altKey||e.metaKey||$('#modal').open)return;if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable)return;e.preventDefault();switchSurvivalRail();},true);
