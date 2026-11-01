/* Contextual interface v0.3: shared character-art slots and contextual windows. */
function characterArtwork(id,placement){
 const c=CHARACTERS[id],art=window.CHARACTER_ART?.[id],src=typeof art?.src==='string'?art.src.trim():'';
 if(!c)return '';
 return `<div class="character-art art-${placement} ${src?'has-art':'is-empty'}" data-character="${id}" role="img" aria-label="${c.full} 일러스트 영역"><span class="art-corner art-corner-top" aria-hidden="true"></span><div class="art-placeholder" aria-hidden="true"><span class="art-class">${c.class}</span><span class="art-sigil">${icon(c.icon)}</span><span class="art-placeholder-label">이미지 준비 중</span></div>${src?`<img class="art-image" src="${esc(src)}" alt="" draggable="false" decoding="async" style="object-position:${esc(art.objectPosition||'50% 100%')}">`:''}<span class="art-corner art-corner-bottom" aria-hidden="true"></span></div>`;
}
function render(){
 const c=character(),r=region(),goal=ITEMS[state.target];
 const requirements=goal.recipe?.inputs||[{itemId:goal.id,quantity:1}];
 $('#app').innerHTML=`<div class="shell">
 <header class="topbar"><div class="brand">${icon('grail','brand-symbol')}<div><div class="brand-title">성배전쟁</div><div class="caps">HOLY GRAIL WAR</div></div></div><div class="top-divider"></div><div class="match-label"><i class="live-dot"></i> 자유 생존전 <span class="muted">/</span> 4인</div>
 <div class="topstats"><button class="topstat survivors-button" data-action="survivors" aria-label="생존자 목록">${icon('people')}<span><span class="label">생존</span> <b class="value mono" id="alive-count">${state.dead?3:Math.max(1,4-state.kills)}<span class="muted"> / 4</span></b></span></button><div class="topstat">${icon('clock')}<span class="value mono" id="match-clock">00:00</span></div></div><button class="top-btn" data-action="character">${icon(c.icon)}<span class="button-label">서번트 변경</span></button><button class="top-btn" data-action="help" aria-label="조작 안내">${icon('help')}</button></header>
 <div class="subbar"><div class="breadcrumb"><span>전장</span><span>›</span><span id="region-breadcrumb">${esc(r.name)}</span><span class="mode-pill" id="mode-pill">탐색</span></div><div class="subbar-right"><span class="muted">브라우저 단독 체험</span><span class="demo-chip">UI PROTOTYPE 03</span></div></div>
 <div class="mobile-hud" aria-label="현재 체력과 스태미나"><div class="mobile-identity">${c.name}<span>Lv.${state.level}</span></div><div class="mobile-resource"><div>HP <span id="mobile-hp"></span></div><div class="bar"><i id="mobile-hp-bar"></i></div></div><div class="mobile-resource sta"><div>STA <span id="mobile-sta"></span></div><div class="bar"><i id="mobile-sta-bar"></i></div></div></div>
 <main class="workspace"><aside class="leftcol" aria-label="내 상태와 제작 목표"><section class="goal-section"><div class="section-heading"><h2>${goal.recipe?'제작':'탐색'} 목표</h2><button class="small-btn" data-action="catalog" aria-label="목표 아이템 변경">${icon('settings')}</button></div><div class="goal-card"><button class="goal-top goal-open" data-action="guide" data-id="${goal.id}"><div class="item-emblem rarity-${goal.rarity}">${icon(itemIcon(goal))}</div><div><div class="small rarity-${goal.rarity}">${rarityName[goal.rarity]}</div><div class="goal-name">${esc(goal.name)}</div><div class="small">${esc(itemStat(goal))}</div></div></button><div class="goal-line"></div>${requirements.map(input=>`<button class="material-row material-open" data-action="guide" data-id="${input.itemId}"><span>${icon(countItem(input.itemId)?'check':'cube')}${esc(ITEMS[input.itemId].name)}</span><span class="${countItem(input.itemId)?'ready':'muted'}">${Math.min(countItem(input.itemId),input.quantity)} / ${input.quantity}</span></button>`).join('')}<button class="outline-button" data-action="guide" data-id="${goal.id}">아이템 가이드 열기 ↗</button></div></section>
 <section class="local-supplies"><div class="section-heading"><h2>이 지역의 재료</h2>${icon('leaf')}</div><div class="region-materials">${r.loot.slice(0,6).map(x=>`<button class="material-chip" data-action="guide" data-id="${x.itemId}">${esc(ITEMS[x.itemId].name)}</button>`).join('')}</div><p class="region-desc">재료를 누르면 제작 경로와<br>발견 지역을 확인할 수 있습니다.</p></section>
 <section class="self-card"><div class="self-hero">${characterArtwork(state.character,'self')}<button class="self-identity self-open" data-action="equipment" aria-label="내 장비와 능력치"><div class="class-badge">${icon(c.icon)}</div><div><div class="self-name">${c.name}</div><div class="self-sub">${c.class} · 마스터 01</div></div><div class="level"><small>Lv.</small><span id="level-value">${state.level}</span></div></button></div>${resourceMarkup()}<div class="self-attributes"><span>공격 <b id="attack-stat"></b></span><span>방어 <b id="defense-stat"></b></span><span>${c.weaponType==='blade'?'베기':'찌르기'} <b>D+</b></span></div><div class="seal-row"><button class="small-btn ability-open" data-action="abilities">${c.passive} <span id="passive-status"></span></button><div class="seals">${[0,1,2].map(i=>icon('seal',`seal ${i>=state.seals?'spent':''}`)).join('')}</div></div></section></aside>
 <section class="battlefield" aria-label="전장"><div class="scene-noise"></div>${forestSvg()}<div class="scene-gradient"></div><div class="scene-top"><div><div class="location-name">${icon('pin')}<span>${esc(r.name)}</span></div><div class="location-coords">SECTOR ${String(r.id).padStart(2,'0')} / SPIRIT OBSERVATION</div></div><button class="scene-menu" data-action="scenarios">${icon('settings')}상황 테스트</button></div><div id="warning-host"></div><div class="stage" id="stage"></div><div class="scene-bottom"><div id="channel-host"></div><div class="activity"><i class="status-dot"></i><b id="activity-text"></b><span id="activity-detail"></span></div><div class="log-head"><span class="caps">FIELD LOG</span><button class="small-btn" data-action="logs">전체 기록 ↗</button></div><div class="logs" id="logs" aria-live="polite"></div></div></section>
 <aside class="rightcol" aria-label="가방"><div class="bag-heading"><h2>가방</h2><span>6 SLOTS</span></div><div class="panel-content" id="panel"></div><nav class="tool-launchers" aria-label="별도 창 열기"><button data-action="equipment">${icon('armor')}<span>내 장비</span><kbd>C</kbd></button><button data-action="catalog">${icon('book')}<span>아이템 도감</span><kbd>F</kbd></button><button data-action="ground">${icon('cube')}<span>바닥 아이템</span><kbd>M</kbd></button></nav></aside></main>
 <section class="controlbar" aria-label="현재 상황의 행동"><div class="control-label">${icon('eye')}<div><div class="caps" id="control-mode">EXPLORATION</div><div class="small" id="control-description">주변을 탐색하세요.</div></div></div><div class="action-group" id="action-group"></div></section><footer class="footer"><span>테스트 재료 포함 · 실제 대전 서버 미연결 · 캐릭터 이미지 미사용</span><span>GRAIL WAR / INTERFACE STUDY 03</span></footer></div>`;
 renderPanel();renderStage();renderActions();renderLogs();updateHud();
}
function renderPanel(){
 const panel=$('#panel');if(!panel)return;
 panel.innerHTML=`<div class="bag-caption"><span>소지품 <b>${state.bag.filter(Boolean).length} / 6</b></span><span>눌러서 사용·제작</span></div><div class="bag-grid">${state.bag.map((slot,i)=>slot?`<button class="bag-slot rarity-${ITEMS[slot.id].rarity}" data-action="item" data-slot="${i}" aria-label="${esc(ITEMS[slot.id].name)} ${slot.qty}개"><span class="slot-key">0${i+1}</span><span class="slot-count">${slot.qty}</span>${icon(itemIcon(ITEMS[slot.id]))}<span class="slot-name">${esc(ITEMS[slot.id].name)}</span></button>`:`<div class="bag-slot empty" aria-label="빈 가방 칸 ${i+1}"><span>+</span><span class="small">빈 슬롯</span></div>`).join('')}</div><p class="bag-hint">아이템을 누르면 사용·장착·제작 메뉴가 열립니다.</p><div class="section-heading quick-heading"><h2>빠른 회복</h2><span class="small">대기 5초</span></div><div class="quick-use">${quickMarkup('hp','1')}${quickMarkup('stamina','2')}</div>`;
}
function renderActions(){
 const e=currentEncounter(),c=character(),busy=state.busy;
 const action=(id,act,label,symbol,key,extra='')=>`<button class="action ${extra}" id="${id}-button" data-action="${act}">${icon(symbol)}<span class="action-title">${label}</span><span class="action-detail" id="${id}-detail"></span><kbd>${key}</kbd></button>`;
 const mode=state.dead?'dead':e?'encounter':'exploration';
 $('#action-group').dataset.mode=mode;
 $('#action-group').innerHTML=state.dead?`<button class="action primary" data-action="reset">${icon('reset')}<span class="action-title">다시 시작</span></button>`:e?
 action('attack','attack','일반 공격',c.icon,'A','primary')+action('np','np',c.np,'bolt','Q','np')+action('escape','map','도주','arrow','S')+action('seal','seal','령주','seal','X','seal-action'):
 action('search','search',busy?'행동 취소':'탐색','search','R','primary')+action('move','map','이동','map','E')+action('rest','rest','휴식','moon','S')+(c.cast?action('np','np',c.np,'bolt','A','np'):'')+action('seal','seal','령주','seal','X','seal-action');
 $('#action-group').style.setProperty('--action-count',String($('#action-group').children.length));
 $('#control-mode').textContent=e?'ENCOUNTER':'EXPLORATION';$('#control-description').textContent=e?'공격하거나 다른 지역으로 도주하세요.':'탐색하거나 이동할 지역을 선택하세요.';
 $('.battlefield').classList.toggle('is-encounter',!!e);$('#mode-pill').textContent=e?(e.kind==='player'?'서번트 조우':'동물 조우'):'탐색';$('#mode-pill').classList.toggle('encounter',!!e);
}
function npUnavailable(){
 const c=character(),e=currentEncounter(),wait=remaining(state.npUntil),attackWait=remaining(state.attackUntil);
 return state.dead?'계약 종료':state.busy?'행동 진행 중':wait>0?`${Math.ceil(wait)}초 대기`:c.cost>state.sta?'STA 부족':c.class==='LANCER'&&(!e||e.kind!=='player')?'서번트 대상 필요':c.class==='LANCER'&&!ITEMS[state.equipment.weapon]?.weaponTypes.includes('stab')?'찌르기 무기 필요':c.class==='LANCER'&&attackWait>0?`${attackWait.toFixed(1)}초 후 사용`:'';
}
function updateHud(){
 if(!state||!$('#match-clock'))return;const c=character(),e=currentEncounter(),busy=state.busy,t=elapsed();
 const mode=state.dead?'dead':e?'encounter':'exploration';if($('#action-group').dataset.mode!==mode)renderActions();
 $('#match-clock').textContent=timeString(t);
 for(const [key,value,max] of [['hp',Math.ceil(state.hp),ownMaxHp()],['sta',Math.floor(state.sta),ownMaxSta()]]){for(const prefix of ['', 'mobile-']){const txt=$(`#${prefix}${key}${prefix?'':'-text'}`),bar=$(`#${prefix}${key}-bar`);if(txt)txt.textContent=`${value} / ${max}`;if(bar)bar.style.width=`${state[key]/max*100}%`;}}
 $('#xp-text').textContent=`${state.xp} / ${10+2*(state.level-1)}`;$('#xp-bar').style.width=`${state.xp/(10+2*(state.level-1))*100}%`;
 $('#attack-stat').textContent=shortNumber(attack());$('#defense-stat').textContent=shortNumber(defense());
 $('#passive-status').textContent=c.class==='LANCER'?(remaining(state.evadeUntil)>0?`${Math.ceil(remaining(state.evadeUntil))}초`:'준비'):'상시';
 $('#channel-host').innerHTML=busy?`<div class="channel" aria-label="${esc(busy.label)} 진행"><i style="width:${Math.min(100,(clock()-busy.start)/busy.duration*100)}%"></i></div><button class="channel-cancel" data-action="cancel">행동 취소 · Esc</button>`:'';
 $('#activity-text').textContent=busy?busy.label:state.rest?(state.rest==='hp'?'체력 회복 중':'스태미나 회복 중'):e?'조우 중 · 공격 또는 도주':state.dead?'계약 종료':'주변의 기척을 살피는 중';
 $('#activity-detail').textContent=busy?`${remaining(busy.end).toFixed(1)}초`:state.rest?'S로 휴식 중지':e?'기척이 사라지기 전에 행동하세요':'탐색 대기';
 function button(id,disabled,detail){const btn=$(`#${id}-button`);if(btn)btn.disabled=disabled;const text=$(`#${id}-detail`);if(text)text.textContent=detail;}
 button('search',state.dead,busy?'예약 재료 유지 · 취소':state.rest?'휴식 중지 후 탐색':'1.5초 · STA 3');
 if($('#search-button'))$('#search-button .action-title').textContent=busy?'행동 취소':'탐색';
 const atkWait=remaining(state.attackUntil),moveWait=remaining(state.moveUntil),sealWait=remaining(state.sealUntil),reason=npUnavailable();
 button('attack',actionBlocked()||!e||atkWait>0,atkWait>0?`${atkWait.toFixed(1)}초 후 사용`:'STA 0 · 1.5초 간격');
 button('np',!!reason,reason||(c.cast?'2초 시전 · 지역 공격':'STA 10 · 마력 간섭'));
 button('move',state.dead||busy?.type==='np',moveWait>0?`${moveWait.toFixed(1)}초 후 이동`:'지도에서 목적지 선택');
 button('escape',state.dead||busy?.type==='np','지도에서 목적지 선택 · E 가능');
 button('rest',actionBlocked(),state.rest?'휴식 중지':'HP / STA 회복 선택');
 button('seal',state.dead||busy?.type==='np'||state.seals<=0||sealWait>0,sealWait>0?`${Math.ceil(sealWait)}초 대기`:`남은 ${state.seals}획`);
 if(e){if($('#encounter-time'))$('#encounter-time').textContent=remaining(state.encounterUntil).toFixed(1);if($('#mark-time'))$('#mark-time').textContent=`${remaining(e.markUntil).toFixed(1)}초`;if(remaining(e.markUntil)<=0&&$('#enemy-mark')?.innerHTML)$('#enemy-mark').innerHTML='';}
 for(const resource of ['hp','stamina']){const btn=$(`#quick-${resource}`);if(!btn)continue;const wait=remaining(resource==='hp'?state.hpFoodUntil:state.staFoodUntil),slot=state.bag.find(x=>x&&ITEMS[x.id].restoreResource===resource);btn.disabled=!slot||state.dead||busy?.type==='np'||wait>0||(resource==='hp'?state.hp>=ownMaxHp()||t>=660:state.sta>=ownMaxSta());$(`#quick-${resource}-text`).textContent=wait>0?`${Math.ceil(wait)}초 대기`:`${resource==='hp'?'HP':'STA'} ${slot?'+'+ITEMS[slot.id].restoreAmount:'회복'}`;}
 const closure=nextClosure(),soon=state.warningDemo||(closure&&closure-t<=30),warning=$('#warning-host');
 const text=t>=660?'과부하 발생 · 모든 HP 회복 불가':closedRegions().includes(state.region)?'현재 지역 폐쇄 · 즉시 이동하세요':soon?`${closurePair().map(id=>DATA.regions.find(r=>r.id===id).name).join(' · ')} 폐쇄 예정`:'';
 const html=text?`<div class="zone-warning">${icon('warning')}<span>${esc(text)}</span><span class="right mono">${soon?(state.warningDemo?'30초':Math.ceil(closure-t)+'초'):''}</span></div>`:'';if(warning.innerHTML!==html)warning.innerHTML=html;
 if(modalType==='map'&&$('#map-move-wait'))$('#map-move-wait').textContent=busy?.type==='np'?'보구 시전 중 이동 불가':moveWait>0?`이동 대기 ${moveWait.toFixed(1)}초`:'지역을 누르면 STA 5를 사용해 이동합니다';
 if(modalType==='map'&&state.mapSignature!==mapStateSignature())mapDialog(state.mapFocus,true);
}
function showModal(title,body,type='info'){
 modalType=type;const modal=$('#modal');modal.dataset.view=type;modal.innerHTML=`<div class="modal-head"><div><div class="caps">${['map','catalog','guide'].includes(type)?'FIELD INTERFACE':'HOLY GRAIL WAR'}</div><h2 id="modal-title">${esc(title)}</h2></div><button class="close-button" data-action="close" aria-label="닫기">${icon('close')}</button></div><div class="modal-body">${body}</div><div class="window-footer">창을 열어도 전장의 시간은 계속 흐릅니다.<span>Esc 닫기</span></div>`;if(!modal.open)modal.showModal();
}
function closeModal(){modalType='';$('#modal').close();}
function mapStateSignature(){return `${state.region}:${closedRegions().join(',')}:${!!(state.warningDemo||nextClosure()-elapsed()<=30)}`;}
function mapDialog(focusItem=null,refresh=false){
 if(modalType==='map'&&!focusItem&&!refresh){closeModal();return;}state.mapFocus=focusItem;state.mapSignature=mapStateSignature();
 const item=focusItem&&ITEMS[focusItem],locations=item?.loot?.regionIds||[];
 showModal('이동 · 목적지 선택',`<div class="map-summary"><div><span class="gold">현재 위치 · ${esc(region().name)}</span><p id="map-move-wait"></p></div><span class="key-badge">E</span></div>${item?`<div class="map-focus">${icon(itemIcon(item))}<span>${esc(item.name)} 발견 지역을 표시하고 있습니다.</span></div>`:''}<div class="travel-map">${DATA.regions.map(r=>{const closed=closedRegions().includes(r.id),soon=(state.warningDemo||nextClosure()-elapsed()<=30)&&closurePair().includes(r.id);return `<button class="map-region ${r.id===state.region?'current':''} ${closed?'closed':soon?'soon':''} ${locations.includes(r.id)?'has-material':''}" data-action="travel" data-id="${r.id}" ${closed||r.id===state.region?'disabled':''} aria-label="${r.name}${closed?' 폐쇄':r.id===state.region?' 현재 위치':' 이동'}"><span class="map-number">${String(r.id).padStart(2,'0')}</span>${icon(regionIcons[r.id-1])}<strong>${r.name}</strong><div class="small">${closed?'폐쇄됨':r.id===state.region?'현재 위치':soon?'폐쇄 예정':'STA 5 · 즉시 이동'}</div>${locations.includes(r.id)?'<span class="material-marker">목표 재료</span>':''}</button>`;}).join('')}</div><div class="map-legend"><span><i></i>현재 위치</span><span><i class="danger"></i>폐쇄 예정</span><span>이동 대기 3초</span></div><p class="map-note">목적지를 누르기 전에는 이동하거나 STA를 소모하지 않습니다. 다른 플레이어의 위치는 공개되지 않습니다.</p>`,'map');updateHud();
}
const normalizeSearch=text=>String(text).normalize('NFC').trim().toLocaleLowerCase('ko');
function catalogDialog(){
 showModal('아이템 도감',`<div class="catalog-search-row">${icon('search')}<input class="recipe-search" id="catalog-search" type="search" autocomplete="off" placeholder="아이템 이름을 입력하세요" aria-label="아이템 이름 검색" value="${esc(state.query)}"><button class="small-btn" data-action="clear-search">초기화</button></div><div class="catalog-filters">${[['all','전체'],['weapon','무기'],['armor','방어구'],['food','회복'],['material','재료'],['ready','제작 가능']].map(([id,label])=>`<button class="filter-btn ${state.filter===id?'active':''}" data-action="catalog-filter" data-filter="${id}">${label}</button>`).join('')}</div><div class="catalog-caption"><span>검색 결과 <b id="catalog-count"></b></span><span>아이템 이름에 포함된 글자로 검색</span></div><div class="catalog-results" id="catalog-results"></div>`,'catalog');updateCatalogResults();
}
function updateCatalogResults(){
 if(modalType!=='catalog'||!$('#catalog-results'))return;const query=normalizeSearch(state.query);
 const items=DATA.items.filter(i=>(state.filter==='all'||state.filter==='ready'&&canCraft(i)||i.kind===state.filter)&&normalizeSearch(i.name).includes(query));
 $('#catalog-count').textContent=`${items.length} / ${DATA.items.length}`;
 $('#catalog-results').innerHTML=items.map(i=>`<button class="catalog-item" data-action="catalog-item" data-id="${i.id}"><span class="item-emblem rarity-${i.rarity}">${icon(itemIcon(i))}</span><span><strong class="catalog-item-name">${esc(i.name)}</strong><span class="small">${esc(itemStat(i))}</span></span><span class="catalog-item-type">${canCraft(i)?'제작 가능':i.recipe?'제작':'탐색'}</span></button>`).join('')||'<div class="empty-note">이름에 해당 글자가 포함된 아이템이 없습니다.</div>';
}
function recipeDialog(id){openGuide(id,true);}
function openGuide(id,newPath=false){
 const i=ITEMS[id];if(!i)return;
 if(newPath)state.guideHistory=[];if(state.guideHistory.at(-1)!==id)state.guideHistory.push(id);state.guideId=id;
 const upgrades=DATA.items.filter(x=>x.recipe?.inputs.some(input=>input.itemId===id));
 const owned=countItem(id),equipped=equippedSlot(id),inputIndex=state.bag.findIndex(x=>x?.id===id),locations=i.loot?.regionIds||[];
 const header=`<div class="guide-toolbar"><button data-action="catalog">${icon('book')}도감 목록</button><button data-action="guide-back" ${state.guideHistory.length<2?'disabled':''}>${icon('arrow')}이전 아이템</button></div>`;
 showModal('아이템 가이드',`${header}<div class="item-guide"><section class="guide-left"><div class="guide-item-card"><div class="guide-emblem rarity-${i.rarity}">${icon(itemIcon(i))}</div><span class="small rarity-${i.rarity}">${rarityName[i.rarity]} · ${i.kind==='weapon'?'무기':i.kind==='armor'?'방어구':i.kind==='food'?'회복':'재료'}</span><h3>${esc(i.name)}</h3><p>${esc(itemStat(i))}</p>${i.effects.map(x=>`<p class="small">${esc(x.description)}</p>`).join('')}<div class="ownership">소지 ${owned}개${equipped?' · 장착 중':''}</div></div><div class="guide-actions"><button class="guide-craft" data-action="craft" data-id="${id}" ${!canCraft(i)||actionBlocked()?'disabled':''}>${icon('hammer')}${i.recipe?'제작하기 · 1초':'탐색으로 얻는 아이템'}${i.recipe?'<kbd>Space</kbd>':''}</button><button class="outline-button" data-action="set-target" data-id="${id}">${state.target===id?'현재 목표 아이템':'목표로 설정'}</button>${inputIndex>=0&&i.kind==='food'?`<button class="outline-button" data-action="use-item" data-slot="${inputIndex}">사용하기 · ${esc(itemStat(i))}</button>`:inputIndex>=0&&['weapon','armor'].includes(i.kind)?`<button class="outline-button" data-action="equip" data-slot="${inputIndex}">장착하기 · 0.5초</button>`:''}</div><div class="guide-find"><h3>탐색 · 발견 지역</h3>${locations.length?`<div class="guide-regions">${locations.map(r=>`<button data-action="guide-map" data-id="${id}" class="${closedRegions().includes(r)?'closed':''}">${icon('pin')}${DATA.regions.find(x=>x.id===r).name}</button>`).join('')}</div><p>지역을 누르면 지도에서 목적지를 선택할 수 있습니다.</p>`:`<p>${i.recipe?'재료를 조합해 제작할 수 있습니다.':'탐색 또는 야생동물 전리품으로 획득합니다.'}</p>`}</div></section><section class="guide-right"><div class="guide-upgrades"><h3>이 아이템으로 만드는 것 <span>${upgrades.length}</span></h3><div class="upgrade-items">${upgrades.map(x=>`<button class="upgrade-item ${canCraft(x)?'craftable':''}" data-action="guide" data-id="${x.id}"><span class="item-emblem rarity-${x.rarity}">${icon(itemIcon(x))}</span><strong>${esc(x.name)}</strong><small>${canCraft(x)?'제작 가능':itemStat(x)}</small></button>`).join('')||'<p class="empty-note">연결된 상위 제작품이 없습니다.</p>'}</div></div><div class="recipe-tree"><div class="recipe-tree-heading"><h3>${i.recipe?'제작 재료':'기본 아이템'}</h3><span>${i.recipe?'완성 '+i.recipe.outputQuantity+'개':'탐색 획득'}</span></div><div class="tree-result"><div class="item-emblem rarity-${i.rarity}">${icon(itemIcon(i))}</div><strong>${esc(i.name)}</strong><span>소지 ${owned}개</span></div>${i.recipe?`<div class="tree-connectors"></div><div class="tree-inputs">${i.recipe.inputs.map(input=>{const m=ITEMS[input.itemId],n=countItem(m.id);return `<button class="tree-input ${n>=input.quantity?'owned':''}" data-action="guide" data-id="${m.id}"><div class="item-emblem rarity-${m.rarity}">${icon(itemIcon(m))}</div><strong>${esc(m.name)}</strong><span>${n} / ${input.quantity}${equippedSlot(m.id)?' · 장착 중':''}</span><small>${m.recipe?'하위 제작법 보기':'발견 지역 보기'} ↗</small></button>`;}).join('')}</div><p class="guide-message ${canCraft(i)?'gold':''}">${canCraft(i)?'재료가 준비되었습니다. 제작 버튼 또는 Space를 누르세요.':'필요한 재료가 부족합니다. 재료를 눌러 경로를 확인하세요.'}</p>`:'<p class="guide-message">제작할 수 없는 기본 아이템입니다.<br>발견 지역을 확인하거나 상위 제작품을 선택하세요.</p>'}</div></section></div>`,'guide');
}
function itemDialog(index){
 const slot=state.bag[index];if(!slot)return;const i=ITEMS[slot.id];state.selected={index,id:i.id};
 showModal(i.name,`<div class="item-detail-header"><div class="item-emblem rarity-${i.rarity}">${icon(itemIcon(i))}</div><div><h3>${esc(i.name)}</h3><div class="small">${rarityName[i.rarity]} · ${esc(itemStat(i))} · ${slot.qty}개</div></div></div>${i.effects.map(x=>`<p>${esc(x.description)}</p>`).join('')}<div class="item-menu-actions">${i.kind==='food'?`<button data-action="use-item" data-slot="${index}">${icon('heart')}사용하기 <kbd>R</kbd></button>`:['weapon','armor'].includes(i.kind)?`<button data-action="equip" data-slot="${index}">${icon('armor')}장착하기 <kbd>R</kbd></button>`:''}<button data-action="guide" data-id="${i.id}">${icon('hammer')}제작 · 아이템 가이드 <kbd>F</kbd></button><button class="danger-text" data-action="discard" data-slot="${index}">${icon('cube')}1개 버리기 <kbd>V</kbd></button></div>`,'item');
}
function equipmentDialog(){
 const c=character();showModal('내 장비 · 능력치',`<div class="equipment-summary"><div><span class="caps">${c.class} · Lv.${state.level}</span><h3>${c.full}</h3></div><span>공격 ${shortNumber(attack())} / 방어 ${shortNumber(defense())}</span></div><div class="equipment-grid">${Object.entries(state.equipment).map(([slot,id])=>`<button class="equipment-slot" data-action="equipped" data-slot="${slot}"><div class="caps">${slotNames[slot]}</div><div class="equipment-name ${id?'rarity-'+ITEMS[id].rarity:'muted'}">${icon(id?itemIcon(ITEMS[id]):'shield')}${id?esc(ITEMS[id].name):'미장착'}</div><div class="small">${id?esc(itemStat(ITEMS[id])):'—'}</div></button>`).join('')}</div><p>장착품을 누르면 상세 정보와 제작 경로를 확인할 수 있습니다.</p><div class="modal-actions"><button data-action="abilities">패시브 · 보구 설명</button></div>`,'equipment');
}
function abilitiesDialog(){
 const c=character();showModal('서번트 능력',`<div class="ability-detail"><h3>${c.passive}</h3><p>${c.passiveText}</p><h3>${c.np}</h3><p>${c.npText}<br>${c.cast?'시전 2초':'즉시 발동'} · STA ${c.cost} · 대기 ${c.cd}초<br>현재 보구 대기 ${Math.ceil(remaining(state.npUntil))}초</p></div>`,'abilities');
}
function groundDialog(){
 const drops=state.ground[state.region]||[];showModal('바닥 아이템 · '+region().name,`<p>현재 지역에서 내려놓은 아이템입니다. 회수는 0.5초가 걸립니다.</p><div class="ground-items">${drops.map((x,index)=>`<div class="ground-row">${icon(itemIcon(ITEMS[x.id]))}<span>${esc(ITEMS[x.id].name)} ×${x.qty}</span><button data-action="pickup" data-slot="${index}" ${actionBlocked()?'disabled':''}>회수하기</button></div>`).join('')||'<div class="empty-note">현재 지역에 내려놓은 아이템이 없습니다.</div>'}</div>`,'ground');
}
function discardItem(index){
 if(actionBlocked()){toast('진행 중인 행동을 먼저 마쳐줘.');return;}const s=state.bag[index];if(!s)return;
 const drops=state.ground[state.region]??(state.ground[state.region]=[]),same=drops.find(x=>x.id===s.id);if(same)same.qty++;else drops.push({id:s.id,qty:1});log(`${ITEMS[s.id].name} 1개를 바닥에 내려놓았습니다.`);takeBagSlot(index,1);closeModal();render();toast('바닥 아이템 창(M)에서 다시 회수할 수 있어.');
}
function pickupItem(index){
 const drops=state.ground[state.region]||[],item=drops[index];if(!item||actionBlocked())return;closeModal();
 beginAction('pickup',`${ITEMS[item.id].name} 회수 중`,.5,()=>{const put=addItem(item.id,item.qty);if(put){item.qty-=put;if(!item.qty)drops.splice(index,1);log(`${ITEMS[item.id].name} ×${put} 회수.`);}else toast('가방에 빈 공간이 없어.');render();});
}
function survivorsDialog(){
 showModal('생존자 목록',`<div class="survivor-list">${[['마스터 01',character().full,'나'],['눈꽃의 계약자',CHARACTERS.yukina.full,''],['새벽의 계약자',CHARACTERS.artoria.full,''],['마스터 04','서번트 미확인','']].map(([name,c,me])=>`<div><span>${name} <b class="gold">${me}</b></span><span class="small">${c}</span></div>`).join('')}</div><p>참가자 목록을 보여주는 UI 예시입니다. 상대의 위치·가방·보구 대기시간은 공개하지 않습니다.</p>`,'survivors');
}
function helpDialog(){
 showModal('조작 안내',`<p>탐색 중에는 탐색·이동·휴식, 조우 중에는 공격·보구·도주 버튼이 나타납니다.</p><div class="help-grid">${[['R','탐색 / 행동 취소'],['E','이동 지도 열기·닫기'],['S','평상시 휴식 / 조우 시 도주'],['A','조우 시 일반 공격'],['Q','조우 시 보구'],['A','평상시 알트리아 지역 보구'],['C','내 장비'],['F','아이템 도감'],['M','바닥 아이템'],['X','령주'],['1 / 2','HP / STA 빠른 회복'],['Esc','창 닫기 / 행동 취소']].map(([key,label])=>`<div><kbd>${key}</kbd>${label}</div>`).join('')}</div><p>아이템을 누른 뒤 F로 제작 가이드, R로 사용·장착, V로 버리기를 실행할 수 있습니다. 가이드에서는 재료·상위 아이템을 눌러 이동하고 Space로 제작합니다.</p><div class="testnote">실제 대전 서버가 연결되지 않은 브라우저 단독 UI입니다. 테스트용 재료가 지급되며 탐색 결과는 고정 순서입니다.</div>`,'help');
}
document.addEventListener('click',event=>{
 const btn=event.target.closest('[data-action]');if(!btn||btn.disabled)return;const action=btn.dataset.action,id=btn.dataset.id,slot=btn.dataset.slot;
 switch(action){
 case 'close':closeModal();break;case 'cancel':cancelAction();break;case 'character':characterDialog();break;
 case 'choose-character':start(id);toast(`${character().full}(으)로 시작했어.`);break;
 case 'help':helpDialog();break;case 'scenarios':scenariosDialog();break;
 case 'scenario':{const kind=btn.dataset.kind;closeModal();if(['player','animal'].includes(kind))spawnEnemy(kind);else if(kind==='damage'){if(state.character==='yukina'&&remaining(state.evadeUntil)<=0){state.evadeUntil=clock()+30;log('영시 발동. 서번트 일반 공격을 회피했습니다.','combat');floatingDamage('회피');}else damageSelf(30,'테스트 일반 공격');updateHud();}else{state.warningDemo=!state.warningDemo;updateHud();}break;}
 case 'reset':start(state.character);toast('체험을 초기화했어.');break;
 case 'search':search();break;case 'attack':doAttack();break;case 'np':useNp();break;
 case 'map':mapDialog();break;case 'travel':travel(Number(id));break;case 'guide-map':mapDialog(id);break;
 case 'catalog':catalogDialog();break;case 'catalog-filter':state.filter=btn.dataset.filter;$$Filters();updateCatalogResults();break;
 case 'clear-search':state.query='';state.filter='all';$('#catalog-search').value='';$$Filters();updateCatalogResults();$('#catalog-search').focus();break;
 case 'catalog-item':openGuide(id,true);break;
 case 'guide':openGuide(id,modalType!=='guide');break;
 case 'guide-back':if(state.guideHistory.length>1){state.guideHistory.pop();openGuide(state.guideHistory.at(-1));}break;
 case 'set-target':state.target=id;closeModal();render();toast(`${ITEMS[id].name}을 목표로 설정했어.`);break;
 case 'craft':craft(id);break;case 'item':itemDialog(Number(slot));break;
 case 'found-detail':openGuide(id,true);break;case 'use-item':useFood(Number(slot));break;
 case 'quick':quickFood(btn.dataset.resource);break;case 'equip':equip(Number(slot));break;
 case 'discard':discardItem(Number(slot));break;case 'ground':groundDialog();break;case 'pickup':pickupItem(Number(slot));break;
 case 'equipment':equipmentDialog();break;case 'abilities':abilitiesDialog();break;
 case 'equipped':if(state.equipment[slot])openGuide(state.equipment[slot],true);else toast('아직 장착한 장비가 없어.');break;
 case 'survivors':survivorsDialog();break;
 case 'rest':restDialog();break;case 'start-rest':state.rest=btn.dataset.resource;closeModal();log(`${state.rest==='hp'?'체력':'스태미나'} 회복을 시작합니다.`);updateHud();break;
 case 'seal':sealDialog();break;
 case 'seal-heal':if(state.seals>0&&remaining(state.sealUntil)<=0&&remaining(state.hpFoodUntil)<=0&&state.hp<ownMaxHp()&&elapsed()<660){const amount=Math.min(ownMaxHp()-state.hp,Math.ceil(ownMaxHp()*.15));state.hp+=amount;state.seals--;state.sealUntil=clock()+30;state.hpFoodUntil=clock()+5;closeModal();log(`령주 회복 · HP +${amount}`);render();}else toast('지금은 령주 회복을 사용할 수 없어.');break;
 case 'seal-map':showModal('령주 도주 · 목적지 선택',`<p>령주 1획과 STA 5를 사용하고 이동 대기시간을 무시합니다.</p><div class="travel-map">${DATA.regions.filter(r=>r.id!==state.region&&!closedRegions().includes(r.id)).map(r=>`<button class="map-region" data-action="seal-travel" data-id="${r.id}">${icon(regionIcons[r.id-1])}<strong>${r.name}</strong></button>`).join('')}</div>`,'map-seal');break;
 case 'seal-travel':travel(Number(id),true);break;
 case 'logs':showModal('전장 기록',`<div class="scroll-log">${state.logs.map(l=>`<div class="log-line"><span class="log-time">${l.time}</span><span>${esc(l.message)}</span></div>`).join('')}</div>`,'logs');break;
 }
});
function $$Filters(){document.querySelectorAll('.catalog-filters .filter-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.filter===state.filter));}
function handleCatalogInput(event){
 if(event.target.id!=='catalog-search')return;state.query=event.target.value;
 if(event.isComposing)return;state.filter='all';$$Filters();updateCatalogResults();
}
document.addEventListener('input',handleCatalogInput);
document.addEventListener('compositionend',handleCatalogInput);
document.addEventListener('keydown',event=>{
 if(event.repeat||event.ctrlKey||event.altKey||event.metaKey)return;
 const typing=['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)||event.target.isContentEditable;
 if(typing)return;
 const key=event.key.toLowerCase();
 if(key==='escape'){event.preventDefault();if($('#modal').open)closeModal();else cancelAction();return;}
 if(key==='e'){event.preventDefault();mapDialog();return;}
 if($('#modal').open){
  if(modalType==='item'){const selected=state.selected,slot=selected&&state.bag[selected.index];if(!slot||slot.id!==selected.id)return;
   if(key==='f'){event.preventDefault();openGuide(slot.id,true);}else if(key==='v'){event.preventDefault();discardItem(selected.index);}else if(key==='r'){event.preventDefault();if(ITEMS[slot.id].kind==='food')useFood(selected.index);else if(['weapon','armor'].includes(ITEMS[slot.id].kind))equip(selected.index);}
  }else if(modalType==='guide'&&key===' '){event.preventDefault();const i=ITEMS[state.guideId];if(canCraft(i)&&!actionBlocked())craft(i.id);}
  return;
 }
 const encounter=!!currentEncounter(),actions={r:()=>{if(!encounter)search();},a:()=>{if(encounter)doAttack();else if(character().cast)useNp();},q:()=>{if(encounter)useNp();},s:()=>encounter?mapDialog():restDialog(),c:equipmentDialog,f:catalogDialog,m:groundDialog,x:sealDialog,'1':()=>quickFood('hp'),'2':()=>quickFood('stamina'),tab:survivorsDialog};
 if(actions[key]){event.preventDefault();actions[key]();}
});
$('#modal').addEventListener('cancel',event=>{event.preventDefault();closeModal();});
$('#modal').addEventListener('click',event=>{if(event.target!==$('#modal'))return;const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal();});
document.addEventListener('error',event=>{
 if(!(event.target instanceof HTMLImageElement)||!event.target.classList.contains('art-image'))return;
 const frame=event.target.closest('.character-art');if(frame){frame.classList.remove('has-art');frame.classList.add('is-empty');}
},true);
start();
