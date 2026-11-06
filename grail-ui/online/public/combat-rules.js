/* Project combat rules v0.7. Shared by the server and local practice. */
(() => {
 const STANCES={normal:{name:'보통',find:.7,visibility:1,text:'서번트 발견 70% · 기본 태세'},offensive:{name:'공격',find:.9,visibility:1,text:'서번트 발견 90% · 공격력/방어력 변화 없음'},stealth:{name:'은신',find:.5,visibility:.8,text:'서번트 발견 50% · 상대에게 발견될 확률 ×80%'}};
 const EFFECTS={
  funnels:{name:'핀 판넬',icon:'bolt',harmful:false,readOnly:true,text:'총 일반 공격 3회에 지원 사격. 빗나감·회피도 횟수 소비, 이동·총 해제 시 종료.'},
  interference:{name:'마력 간섭',icon:'seal',harmful:true,attribute:'MAGIC',duration:10,maxDuration:10,paired:true,text:'다음 보구 승인 시 소비. 시전자에게 가는 보구 추가 피해 50% 감소.'},
  stun:{name:'기절',icon:'bolt',harmful:true,attribute:'MAGIC',duration:1,maxDuration:2,hard:true,text:'취소·기권을 제외한 행동 불가. 진행 중 행동과 휴식을 중단.'},
  root:{name:'속박',icon:'pin',harmful:true,attribute:'PHYSICAL',duration:2,maxDuration:3,hard:true,text:'일반 이동과 령주 철수 불가. 공격·음식은 사용 가능.'},
  silence:{name:'침묵',icon:'moon',harmful:true,attribute:'MAGIC',duration:3,maxDuration:4,text:'보구 사용 불가. 진행 중 보구 시전을 중단.'},
  bleed:{name:'출혈',icon:'sword',harmful:true,attribute:'PHYSICAL',duration:5,maxDuration:10,power:3,maxPower:10,maxStacks:3,dot:true,text:'1초마다 물리 추가 피해. 최대 3중첩, 일반 DEF 우회.'},
  burn:{name:'화상',icon:'bolt',harmful:true,attribute:'MAGIC',duration:5,maxDuration:10,power:3,maxPower:10,maxStacks:3,dot:true,text:'1초마다 마술 추가 피해. 최대 3중첩, 마술 저항 적용.'},
  blind:{name:'실명',icon:'eye',harmful:true,attribute:'PHYSICAL',duration:4,maxDuration:6,power:.2,maxPower:.5,text:'일반 공격 명중률 감소. 확정 명중 보구는 영향 없음.'},
  weaken:{name:'약화',icon:'sword',harmful:true,attribute:'MAGIC',duration:5,maxDuration:8,power:.2,maxPower:.4,text:'가하는 전투 피해 감소. 환경 피해는 영향 없음.'},
  vulnerable:{name:'취약',icon:'target',harmful:true,attribute:'MAGIC',duration:5,maxDuration:8,power:.15,maxPower:.3,text:'받는 전투 피해 증가. 환경 피해는 영향 없음.'},
  haste:{name:'가속',icon:'clock',harmful:false,attribute:'NEUTRAL',duration:5,maxDuration:8,power:.2,maxPower:.4,text:'일반 공격·설하랑의 다음 공격 간격 단축. 이미 시작한 대기는 유지.'},
  shield:{name:'보호막',icon:'shield',harmful:false,attribute:'MAGIC',duration:8,maxDuration:10,power:30,maxPower:1000,text:'피해 감소 계산 후 전투 피해 흡수. 최대 HP의 30%까지, 환경 피해 제외.'},
  controlImmunity:{name:'제어 면역',icon:'shield',harmful:false,readOnly:true,text:'기절·속박 종료 후 2초 동안 해당 제어에 면역.'}
 };
 const active=(p,type,t)=>p.statusEffects?.[type]?.until>t?p.statusEffects[type]:null;
 const power=(p,type,t)=>active(p,type,t)?.power||0;
 const attackInterval=(p,t)=>Math.max(.75,1.5*(1-power(p,'haste',t)));
 const blocked=(p,action,t)=>active(p,'stun',t)&&!['cancel','leave'].includes(action)?'기절 중에는 행동할 수 없습니다.':action==='travel'&&active(p,'root',t)?'속박 중에는 이동할 수 없습니다.':action==='np'&&active(p,'silence',t)?'침묵 중에는 보구를 사용할 수 없습니다.':'';
 globalThis.GRAIL_COMBAT={STANCES,EFFECTS,active,power,attackInterval,blocked};
})();
