/* Visible Rider state, ammunition, and reload controls. No private item IDs are rendered. */
const beforeRiderHud=updateHud;
updateHud=function(){
 beforeRiderHud();if(!state||window.frontScreen||!$('.self-card'))return;
 let panel=$('#rider-resources');
 if(!panel){panel=document.createElement('div');panel.id='rider-resources';$('.self-card').appendChild(panel);}
 const gun=state.ammo;
 panel.hidden=!gun&&state.character!=='link';
 if(gun){
  const reload=state.busy?.type==='reload',blocked=statusReason('reload');
  panel.innerHTML=`<span>장전 <b>${gun.loaded} / ${gun.capacity}</b> · 예비탄 ${gun.reserve}</span><button class="small-btn" data-action="reload" ${state.dead||state.finished||!!state.busy||!!blocked||gun.loaded>=gun.capacity||gun.reserve<=0?'disabled':''}>${reload?'재장전 중':'재장전'} <kbd>T</kbd></button>`;
  const attackButton=$('#attack-button');if(attackButton&&(gun.loaded<=0||reload)){attackButton.disabled=true;if($('#attack-detail'))$('#attack-detail').textContent=reload?'재장전 중':'탄약 없음 · T 재장전';}
 }else if(state.character==='link')panel.innerHTML=`<span>제작 무기 강화 <b>+${state.weaponAttackBonus||0}</b></span><span>${state.hp/ownMaxHp()>=.8?'검격 강화 준비':'검격 강화 · HP 80% 필요'}</span>`;
 if(state.character==='amuro')$('#passive-status').textContent=remaining(state.predictionUntil)>0?Math.ceil(remaining(state.predictionUntil))+'초':'준비';
 if(state.character==='link')$('#passive-status').textContent=state.weaponAttackBonus?'무기 +'+state.weaponAttackBonus:'직접 제작';
 if($('#np-detail')&&!npUnavailable())$('#np-detail').textContent=`${character().cast?character().cast+'초 시전':'즉시'} · STA ${character().cost}`;
 const value=$('.hud-equipment-slot[data-slot="weapon"] .hud-equipment-value');if(value&&state.weaponAttackBonus)value.textContent=`공격 ${ITEMS[state.equipment.weapon].attack} + ${state.weaponAttackBonus}`;
};
document.addEventListener('click',e=>{const button=e.target.closest('[data-action="reload"]');if(!button||button.disabled||window.frontScreen)return;e.preventDefault();e.stopImmediatePropagation();gameAction('reload');},true);
document.addEventListener('keydown',e=>{if(e.key.toLowerCase()!=='t'||window.frontScreen||$('#modal').open||e.repeat||e.ctrlKey||e.altKey||e.metaKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable)return;e.preventDefault();e.stopImmediatePropagation();gameAction('reload');},true);
