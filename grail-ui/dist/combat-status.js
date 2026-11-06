/* Effects beside the self HUD; server projections contain no caster/session IDs. */
const beforeStatusHud=updateHud;
const statusGlyphs={bleed:'M12 2C10 6 5 10 5 15a7 7 0 0 0 14 0c0-5-5-9-7-13ZM8 15a4 4 0 0 0 4 4',burn:'M13 2c2 6-2 7 0 11 2-1 3-3 3-5 4 4 6 8 3 12a9 9 0 0 1-14-1c-2-4 1-8 4-11-1 4 0 6 2 7 2-4-1-7 2-13Z',stun:'m13 2-7 11h6l-1 9 7-13h-6l1-7ZM3 4h3m-1-1v3m13 12h3m-1-1v3',silence:'M6 9V6a6 6 0 0 1 12 0v3M5 9h14v12H5ZM12 13v4',weaken:'m6 3 3 5-3 2 4 3-3 3 4 5M16 3v14m-3-3 3 4 3-4',root:'M7 3v7c0 3-4 3-4 6s3 5 6 5m8-18v7c0 3 4 3 4 6s-3 5-6 5M8 12h8m-8 4h8'};
function statusSymbol(type){return statusGlyphs[type]?`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${statusGlyphs[type]}"/></svg>`:icon(GRAIL_COMBAT.EFFECTS[type]?.icon||'seal');}
const ownStatuses=()=>state?.statuses?.filter(s=>remaining(s.until)>0)||[];
function statusText(s){
 const def=GRAIL_COMBAT.EFFECTS[s.type];if(!def)return '';
 const percent=Math.round((s.power??def.power??0)*100);
 const value={blind:`명중률 −${percent}%p`,weaken:`가하는 전투 피해 −${percent}%`,vulnerable:`받는 전투 피해 +${percent}%`,haste:`공격 간격 −${percent}%`,shield:`남은 보호막 ${Math.floor(s.power||0)}`}[s.type];
 return (value?value+'. ':'')+def.text;
}
function statusReason(action){const statusEffects=Object.fromEntries(ownStatuses().map(s=>[s.type,s]));return GRAIL_COMBAT.blocked({statusEffects},action,clock());}
updateHud=function(){beforeStatusHud();if(!state||window.frontScreen||!$('.survival-shell'))return;paintCombatStatuses();};
function paintCombatStatuses(){
 const shell=$('.survival-shell');let host=$('#combat-status-panel');
 if(!host){host=document.createElement('section');host.id='combat-status-panel';host.setAttribute('aria-label','내 태세와 상태 효과');host.innerHTML=`<div class="stance-controls"><span>태세</span>${Object.entries(GRAIL_COMBAT.STANCES).map(([id,s])=>`<button data-stance="${id}" title="${s.text}" aria-pressed="false">${s.name}</button>`).join('')}<small id="stance-wait"></small><button class="combat-rules-help" data-combat-rules aria-label="공통 전투 규칙">${icon('help')}</button></div><div class="status-icons" role="group" aria-label="현재 적용된 상태 효과"></div>`;shell.appendChild(host);}
 const wait=remaining(state.stanceUntil),reason=statusReason('stance');
 for(const b of host.querySelectorAll('[data-stance]')){b.setAttribute('aria-pressed',String((state.stance||'normal')===b.dataset.stance));b.disabled=state.dead||state.finished||state.stance===b.dataset.stance||wait>0||!!reason||state.busy?.type==='np';}
 $('#stance-wait').textContent=wait>0?wait.toFixed(1)+'초':'';
 const effects=ownStatuses(),list=host.querySelector('.status-icons'),signature=JSON.stringify(effects.map(s=>[s.type,s.stacks]));
 if(list.dataset.signature!==signature){list.dataset.signature=signature;list.innerHTML=effects.map(s=>{const def=GRAIL_COMBAT.EFFECTS[s.type];if(!def)return '';return `<button class="status-chip ${def.harmful?'is-harmful':'is-beneficial'}" data-status-type="${s.type}"><span class="status-symbol">${statusSymbol(s.type)}</span>${s.stacks>1?`<b class="status-stacks">${s.stacks}</b>`:''}<span class="status-countdown"></span><span class="status-name">${def.name}</span></button>`;}).join('');}
 list.hidden=!effects.length;
 for(const b of list.querySelectorAll('[data-status-type]')){const s=effects.find(s=>s.type===b.dataset.statusType);if(!s)continue;const left=remaining(s.until),def=GRAIL_COMBAT.EFFECTS[s.type];b.querySelector('.status-countdown').textContent=(left<1?left.toFixed(1):Math.ceil(left))+'초';b.title=def.name+' · '+statusText(s);b.setAttribute('aria-label',def.name+' · '+Math.ceil(left)+'초 · 효과 설명');}
 for(const b of document.querySelectorAll('#action-group [data-action]')){const action=b.dataset.action,command=action==='map'?'travel':action,blocked=statusReason(command);if(!blocked)continue;const detail=b.querySelector('.action-detail');if(detail)detail.textContent=action==='map'?blocked+' (지도 확인)':blocked;if(action!=='map')b.disabled=true;}
 if(statusReason('food'))for(const b of document.querySelectorAll('#quick-hp,#quick-stamina,[data-encounter=hp],[data-encounter=sta]'))b.disabled=true;
 if($('#attack-detail')&&remaining(state.attackUntil)<=0&&!statusReason('attack'))$('#attack-detail').textContent=`STA 0 · ${(state.attackInterval||1.5).toFixed(1)}초 간격`;
 for(const el of document.querySelectorAll('[data-status-live]')){const s=effects.find(s=>s.type===el.dataset.statusLive);el.textContent=s?remaining(s.until).toFixed(1)+'초 남음':'효과 종료';}
 const panel=$('#opponent-panel'),enemy=currentEncounter();
 if(panel&&enemy?.kind==='player'&&!panel.hidden){let common=$('#opponent-common-states');if(!common){common=document.createElement('div');common.id='opponent-common-states';common.className='opponent-common-states';panel.insertBefore(common,panel.querySelector('.opponent-utilities'));}const visible=(enemy.statuses||[]).filter(s=>s.type!=='interference'&&remaining(s.until)>0);common.innerHTML=visible.map(s=>{const d=GRAIL_COMBAT.EFFECTS[s.type];return d?`<span title="${d.text}">${statusSymbol(s.type)}${d.name} <b>${Math.ceil(remaining(s.until))}초</b></span>`:'';}).join('');common.hidden=!visible.length;}
}
function statusDialog(type){const s=ownStatuses().find(s=>s.type===type);if(!s){toast('이미 종료된 상태 효과입니다.');return;}const d=GRAIL_COMBAT.EFFECTS[type];showModal(d.name,`<div class="status-detail-symbol">${statusSymbol(type)}</div><p class="status-detail-time" data-status-live="${type}">${remaining(s.until).toFixed(1)}초 남음</p><p>${esc(statusText(s))}</p>${s.stacks>1?`<p>${type==='interference'?'시전자별 독립 간섭':'현재 중첩'}: ${s.stacks}</p>`:''}<p>시간이 끝나거나 효과가 소비되면 아이콘이 사라집니다.</p>`,'status-effect');}
function combatRulesDialog(){showModal('공통 전투 규칙',`<h3>태세 · 전환 대기 2초 / STA 0</h3>${Object.values(GRAIL_COMBAT.STANCES).map(s=>`<p><b>${s.name}</b> · ${s.text}</p>`).join('')}<p>태세는 발견 확률을 조절합니다. 명중·공격력·방어력과 동물 발견 확률은 바꾸지 않습니다.</p><h3>피해와 상태 효과</h3><p>일반 피해는 DEF를 적용하고, 스킬 추가 피해는 속성 저항과 해당 감소 효과를 적용합니다. 최종 피해는 합산 후 한 번 내립니다.</p><p>같은 종류의 효과는 강한 수치를 유지하고 시간을 갱신합니다. 출혈·화상은 최대 3중첩입니다. 기절·속박의 연속 제어는 최대 3초이고, 종료 후 2초 제어 면역이 생깁니다.</p><p>보호막은 감소 계산 뒤 전투 피해를 흡수합니다. 금지구역·과부하·탈진에는 적용되지 않습니다. 영시와 마력 간섭은 캐릭터별 기존 규칙을 따릅니다.</p><h3>가드</h3><p>공격 대신 방어해 받는 피해를 줄이는 기능입니다. 현재 공통 기능으로는 채택하지 않았습니다.</p>`,'combat-rules');}
document.addEventListener('click',e=>{const b=e.target.closest('[data-stance],[data-status-type],[data-combat-rules]');if(!b||b.disabled||window.frontScreen)return;e.preventDefault();if(b.dataset.stance)gameAction('stance',{id:b.dataset.stance});else if(b.dataset.statusType)statusDialog(b.dataset.statusType);else combatRulesDialog();});
