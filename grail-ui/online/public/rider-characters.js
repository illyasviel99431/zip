/* Rider roster records; gameplay authority remains in game-core.js. */
Object.assign(CHARACTERS,{
 amuro:{name:'아무로',full:'아무로 레이',class:'RIDER',weapon:'southern_revolver',weaponType:'gun',maxHp:120,maxSta:120,attack:15,defense:14,hpGrowth:6,staGrowth:5,atkGrowth:2.2,defGrowth:2.3,passive:'뉴타입 감응',passiveText:'서번트의 다음 일반 공격 피해 20% 감소 · 발동 후 12초 재충전 · 동물·보구 제외',np:'핀 판넬',npText:'1초 전개 후 8초 동안 총 일반 공격 3회에 마술 추가 피해 5 + 0.7 × 레벨. 빗나감·영시에도 횟수 소비, 이동·총 해제 시 종료.',cd:70,cast:1,cost:18,icon:'target',npWeapon:'gun',goal:'rail_rifle'},
 link:{name:'링크',full:'링크',class:'RIDER',weapon:'long_sword',weaponType:'blade',maxHp:120,maxSta:124,attack:14,defense:14,hpGrowth:7,staGrowth:6,atkGrowth:2.2,defGrowth:2.2,passive:'스크래빌드',passiveText:'직접 제작한 무기를 본인이 장착하면 무기 공격력 +2/3/4/5 · 일반/고급/희귀/영웅 · 재장착 중첩 없음',np:'퇴마의 검격',npText:'일반 피해 100% + 마술 추가 피해 12 + 1.5 × 레벨. HP 80% 이상이면 추가로 4 + 0.5 × 레벨. 베기 무기와 발견한 적 서번트가 필요합니다.',cd:60,cast:0,cost:12,icon:'sword',targeted:true,npWeapon:'blade',goal:'hades_edge'}
});
Object.assign(CHARACTERS.artoria,{npText:'같은 지역의 모든 적 서번트에게 마술 추가 피해 20 + 4 × 레벨. 시전 2초.',goal:'bastard_sword'});
Object.assign(CHARACTERS.yukina,{targeted:true,npWeapon:'stab',goal:'long_spear'});
