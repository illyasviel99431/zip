import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Readable} from 'node:stream';
import {GameService} from './game-server.mjs';
const DATA=JSON.parse(fs.readFileSync(new URL('./dist/items.json',import.meta.url)));
function setup(chars=['artoria','yukina']){
 let time=1000,rng=.4,id=0;const game=new GameService({now:()=>time,random:()=>rng,token:()=>`public-${++id}`});
 const a=game.create({character:chars[0],nickname:'A'}),keys=[a.key];for(const character of chars.slice(1))keys.push(game.join({code:a.code,character,nickname:String(keys.length)}).key);
 const r=game.room(a.code);for(const p of r.players)p.ready=true;game.command(r,r.players[0],{action:'start'});for(const p of r.players)game.command(r,p,{action:'start-region',id:5});
 const advance=n=>{time+=n;for(const p of r.players)p.lastSeen=time;game.tick();};
 return {game,r,p:r.players[0],q:r.players[1],keys,advance,setRandom:n=>rng=n,setTime:n=>time=n,now:()=>time};
}
test('opponent inspection exposes six equipped slots and rank only during an active encounter',()=>{
 const {game,r,p,q,advance}=setup();q.bag[2]={id:'meteorite',qty:1};q.mastery.stab=29;q.npUntil=1100;q.sta=17;
 assert.equal(game.snapshot(r,p).state.enemy,null);game.detect(p,q);
 const enemy=game.snapshot(r,p).state.enemy;assert.deepEqual(enemy.equipment,q.equipment);assert.notEqual(enemy.equipment,q.equipment);assert.equal(enemy.level,1);assert.equal(enemy.masteryGrade,'C');assert.equal(enemy.weaponType,'stab');
 for(const key of ['bag','sta','npUntil','mastery','id','seals','marks','combatEvents'])assert.equal(enemy[key],undefined,key);
 assert.equal(enemy.maxHp,100);advance(3);assert.equal(game.snapshot(r,p).state.enemy,null);
});
test('combat feedback reports actual dealt and taken damage only to its participants and expires',()=>{
 const {game,r,p,q,advance}=setup(['artoria','artoria','artoria']);q.hp=1;game.detect(p,q);game.command(r,p,{action:'attack',requestId:'one-hit'});game.tick();
 const dealt=game.snapshot(r,p).state.combatEvents,taken=game.snapshot(r,q).state.combatEvents;assert.equal(dealt.length,1);assert.equal(taken.length,1);assert.equal(dealt[0].value,1);assert.equal(taken[0].value,1);assert.equal(dealt[0].kind,'dealt');assert.equal(taken[0].kind,'taken');assert.deepEqual(game.snapshot(r,r.players[2]).state.combatEvents,[]);
 assert.deepEqual(Object.keys(dealt[0]).sort(),['age','id','kind','label','value']);game.command(r,p,{action:'attack',requestId:'one-hit'});game.tick();assert.equal(game.snapshot(r,p).state.combatEvents.length,1);advance(3);assert.deepEqual(game.snapshot(r,p).state.combatEvents,[]);
});
test('miss and passive evasion feedback carry zero damage without revealing hidden attacker data',()=>{
 const {game,r,p,q,setRandom,advance}=setup();game.detect(p,q);setRandom(.99);game.command(r,p,{action:'attack'});game.tick();assert.equal(game.snapshot(r,p).state.combatEvents[0].label,'빗나감');assert.equal(game.snapshot(r,q).state.combatEvents.length,0);
 advance(1.5);setRandom(.4);game.command(r,p,{action:'attack'});game.tick();const evade=game.snapshot(r,q).state.combatEvents[0];assert.equal(evade.kind,'evade');assert.equal(evade.value,0);assert.equal(q.hp,116);assert.equal(game.snapshot(r,p).state.combatEvents.at(-1).label,'회피');
});
test('mastery uses adopted ranks, awards attempts on misses and caps SS',()=>{
 const {game,r,p,q,setRandom}=setup();assert.deepEqual(game.mastery(p),['D+',21,.9,.82]);game.detect(p,q);setRandom(.99);game.command(r,p,{action:'attack'});game.tick();assert.equal(p.mastery.blade,22);assert.equal(p.xp,0);assert.equal(q.hp,116);p.mastery.blade=110.5;game.addMastery(p,3);assert.equal(p.mastery.blade,111);assert.equal(game.mastery(p)[0],'SS');
});
test('Yukina evades only a hit BASIC; no HP damage grants no attack XP',()=>{
 const {game,r,p,q}=setup();game.detect(p,q);game.command(r,p,{action:'attack'});game.tick();assert.equal(p.xp,0);assert.equal(q.hp,116);assert.equal(q.evadeUntil,1030);assert.ok(q.stats.evadedDamage>0);assert.equal(p.mastery.blade,22);
});
test('damage attempts grow one selected dual type; equip selects requested type',()=>{
 const {game,r,p,advance}=setup();p.bag[2]={id:'katana',qty:1};game.command(r,p,{action:'equip',slot:2,weaponType:'stab'});advance(.5);assert.equal(p.weaponType,'stab');assert.equal(p.mastery.stab,0);assert.equal(game.mastery(p)[0],'F');assert.throws(()=>game.command(r,p,{action:'weapon-type',weaponType:'gun'}));
});
test('craft consumes bag duplicate first without deleting the equipped duplicate',()=>{
 const {game,r,p,advance}=setup();p.bag=[{id:'long_sword',qty:1},{id:'steel',qty:1},null,null,null,null];game.command(r,p,{action:'craft',id:'bastard_sword',weaponType:'blade'});advance(1);assert.equal(p.equipment.weapon,'long_sword');assert.equal(game.count(p,'long_sword'),1);assert.equal(game.count(p,'bastard_sword'),1);assert.equal(p.xp,3);assert.equal(p.mastery.blade,22.5);
});
test('equipped recipe input is replaced at completion; cancelled work grants nothing',()=>{
 const {game,r,p,advance}=setup();p.bag=[{id:'steel',qty:1},null,null,null,null,null];game.command(r,p,{action:'craft',id:'bastard_sword'});assert.equal(p.equipment.weapon,'long_sword');game.command(r,p,{action:'cancel'});advance(1);assert.equal(game.count(p,'steel'),1);assert.equal(p.xp,0);game.command(r,p,{action:'craft',id:'bastard_sword'});advance(1);assert.equal(p.equipment.weapon,'bastard_sword');assert.equal(game.count(p,'steel'),0);
});
test('craft rejects output overflow atomically and rarity rewards match spec',()=>{
 const {game,r,p,advance}=setup();p.bag=[{id:'iron_ore',qty:2},{id:'scrap_metal',qty:2},{id:'bread',qty:5},{id:'water',qty:5},{id:'stone',qty:10},{id:'cloth',qty:10}];assert.throws(()=>game.command(r,p,{action:'craft',id:'steel'}));assert.equal(game.count(p,'iron_ore'),2);p.bag[5]=null;game.command(r,p,{action:'craft',id:'steel'});advance(1);const item=DATA.items.find(i=>i.id==='steel');assert.equal(p.xp,{Common:1,Uncommon:2,Rare:3,Epic:4}[item.rarity]);
});
test('closure survivors gain selected mastery once; closed occupants cannot escape at boundary',()=>{
 const {game,r,p,q,setTime}=setup();r.closures=[{t:180,ids:[5]}];q.region=7;q.weaponType='stab';p.sta=112;setTime(1180);p.lastSeen=q.lastSeen=1180;assert.throws(()=>game.command(r,p,{action:'travel',id:7}));assert.equal(p.dead,true);assert.equal(p.region,5);assert.equal(q.mastery.stab,24);game.tick();assert.equal(q.mastery.stab,24);assert.equal(r.corpses.length,1);
});
test('lethal stamina deficit stops search and travel immediately',()=>{
 for(const action of ['search','travel']){const {game,r,p}=setup();p.hp=1;p.sta=0;game.command(r,p,{action,id:7});assert.equal(p.dead,true);assert.equal(p.busy,null);assert.equal(p.region,5);assert.equal(r.corpses.length,1);}
});
test('same timestamp lethal attacks are batched into a draw without posthumous XP',()=>{
 const {game,r,p,q}=setup(['artoria','artoria']);p.hp=q.hp=1;game.detect(p,q);game.detect(q,p);game.command(r,p,{action:'attack'});game.command(r,q,{action:'attack'});game.tick();assert.equal(p.dead,true);assert.equal(q.dead,true);assert.equal(r.phase,'finished');assert.equal(r.winner,null);assert.equal(p.level,1);assert.equal(q.level,1);assert.equal(p.xp,0);assert.equal(q.xp,0);assert.equal(game.rank(r,p),1);assert.equal(game.rank(r,q),1);
});
test('corpses retain every item once; killer sees selected loot immediately',()=>{
 const {game,r,p,q,advance}=setup(['artoria','artoria','artoria']);q.hp=1;game.detect(p,q);game.command(r,p,{action:'attack'});game.tick();const c=r.corpses[0];assert.equal(c.entries.reduce((s,e)=>s+e.qty,0),7);assert.ok(q.bag.every(x=>x===null));assert.ok(Object.values(q.equipment).every(x=>x===null));assert.ok(p.knownCorpses.includes(c.id));assert.equal(game.snapshot(r,p).state.corpses.length,1);const bread=c.entries.find(e=>e.id==='bread');game.command(r,p,{action:'corpse-loot',corpseId:c.id,entryKey:bread.key});assert.equal(bread.qty,2);advance(.5);assert.equal(bread.qty,0);assert.equal(game.count(p,'bread'),4);game.die(r,q,'again',game.now());assert.equal(r.corpses.length,1);
});
test('corpse collection rechecks distance, discovery, slots and competing pickups',()=>{
 const {game,r,p,q,advance}=setup(['artoria','artoria','artoria']);const victim=r.players[2];game.die(r,victim,'기권',game.now());const c=r.corpses[0],entry=c.entries.find(e=>e.id==='water');assert.throws(()=>game.command(r,p,{action:'corpse-loot',corpseId:c.id,entryKey:entry.key}));p.knownCorpses.push(c.id);q.knownCorpses.push(c.id);game.command(r,p,{action:'corpse-loot',corpseId:c.id,entryKey:entry.key});game.command(r,q,{action:'corpse-loot',corpseId:c.id,entryKey:entry.key});advance(.5);assert.equal(entry.qty,0);assert.equal(game.count(p,'water')+game.count(q,'water'),9);p.region=7;assert.throws(()=>game.command(r,p,{action:'corpse-loot',corpseId:c.id,entryKey:c.entries[0].key}));
});
test('corpse search is its own 20 percent stage ahead of items',()=>{
 const {game,r,p,q,setRandom}=setup(['artoria','artoria','artoria']);q.region=7;game.die(r,r.players[2],'기권',game.now());r.animals[5].hp=0;setRandom(.1);game.searchResult(r,p,game.now());assert.equal(p.knownCorpses.length,1);assert.equal(p.corpseTarget,r.corpses[0].id);assert.equal(p.result,null);
});
test('paired marks are consumed at NP approval; reduction applies only to each caster',()=>{
 const {game,r,p,q,advance}=setup(['artoria','yukina','yukina','artoria']);const y=r.players[2],other=r.players[3];p.marks={[q.id]:1010,[y.id]:1010};game.command(r,p,{action:'np'});assert.deepEqual(p.marks,{});assert.equal(p.busy.reductions.length,2);advance(2);assert.equal(q.hp,104);assert.equal(y.hp,104);assert.equal(other.hp,102);assert.equal(q.stats.interferencePrevented,12);
});
test('a later mark never reduces a previously approved NP; saved reduction survives expiry',()=>{
 const a=setup();a.game.command(a.r,a.p,{action:'np'});a.p.marks[a.q.id]=1010;a.advance(2);assert.equal(a.q.hp,92);
 const b=setup();b.p.marks[b.q.id]=1000.5;b.game.command(b.r,b.p,{action:'np'});b.advance(2);assert.equal(b.q.hp,104);assert.equal(b.p.marks[b.q.id],undefined);
});
test('total multiplicative reductions are capped at sixty percent and floored once',()=>{
 const {game,p,q}=setup();q.character='artoria';q.equipment.body='crusader_armor';assert.equal(game.factor(q,true,true),.4);assert.equal(Math.floor(92*game.factor(q,true,true)),36);q.character='yukina';assert.equal(game.factor(q,true,true),.45);assert.equal(Math.floor(92*game.factor(q,true,true)),41);
});
test('HP gear does not heal, food bonus is specific, and overload forbids all HP growth',()=>{
 const {game,r,p,advance}=setup();p.hp=50;p.bag[2]={id:'eye_of_horus',qty:1};game.command(r,p,{action:'equip',slot:2});advance(.5);assert.equal(p.hp,50);assert.equal(game.maxHp(p),140);game.command(r,p,{action:'food',slot:0});assert.equal(p.hp,74);p.hpFoodUntil=0;game.command(r,p,{action:'seal-heal'});assert.equal(p.hp,95);r.started=game.now()-660;p.hp=50;game.xp(r,p,10);assert.equal(p.hp,50);assert.throws(()=>game.command(r,p,{action:'food',slot:0}));assert.throws(()=>game.command(r,p,{action:'rest',resource:'hp'}));
});
test('duplicate request IDs preserve success/failure and never double-spend resources',()=>{
 const {game,r,p,advance}=setup();p.hp=10;const b={action:'food',slot:0,requestId:'food-1'};game.command(r,p,b);const hp=p.hp;advance(6);game.command(r,p,b);assert.equal(p.hp,hp);assert.equal(game.count(p,'bread'),1);const bad={action:'food',slot:5,requestId:'bad-1'};assert.throws(()=>game.command(r,p,bad));p.bag[5]={id:'bread',qty:1};assert.throws(()=>game.command(r,p,bad));assert.equal(p.bag[5].qty,1);
});
test('snapshots never expose session secrets, internal marks, queued targets or future closures',()=>{
 const {game,r,p,q,keys}=setup();p.marks[q.id]=1010;game.command(r,p,{action:'np'});game.detect(q,p);const snap=game.snapshot(r,p),json=JSON.stringify(snap);for(const key of keys)assert.equal(json.includes(key),false);assert.equal(snap.state.busy.reductions,undefined);assert.equal(snap.state.marks,undefined);assert.equal(snap.state.targetId,undefined);assert.equal(snap.state.stock,undefined);assert.equal(snap.state.closures,undefined);assert.equal(snap.state.corpses.length,0);
});
test('next closed regions are revealed only during the final thirty seconds',()=>{
 const {game,r,p,q,setTime}=setup();assert.deepEqual(game.snapshot(r,p).state.upcoming.ids,[]);setTime(1149);p.lastSeen=q.lastSeen=1149;assert.deepEqual(game.snapshot(r,p).state.upcoming.ids,[]);setTime(1150);assert.deepEqual(game.snapshot(r,p).state.upcoming.ids,r.closures[0].ids);
});
test('environment damage precedes same-time channel completion',()=>{
 const {game,r,p,q,setTime}=setup();r.closures=[];r.started=337;p.hp=q.hp=1;game.command(r,p,{action:'np'});setTime(1002);p.lastSeen=q.lastSeen=1002;game.tick();assert.equal(p.dead,true);assert.equal(q.dead,true);assert.equal(r.winner,null);assert.equal(p.stats.damage,0);
});
test('stalled ticks process all due overload pulses without skipping',()=>{
 const {game,r,p,q,setTime}=setup();r.closures=[];r.started=335;setTime(1020);p.lastSeen=q.lastSeen=1020;game.tick();assert.equal(r.pulse,5);assert.equal(p.hp,60);assert.equal(q.hp,56);
});
test('animals share HP, respawn on schedule and leave overflow on the ground',()=>{
 const {game,r,p,advance}=setup(['artoria','artoria']);const a=r.animals[5];a.hp=1;p.bag=Array.from({length:6},()=>({id:'steel',qty:10}));game.detect(p,a);game.command(r,p,{action:'attack'});game.tick();assert.equal(a.hp,0);assert.ok(r.ground[5].length);const wait=a.respawnSeconds;advance(wait);assert.equal(a.hp,a.maxHp);
});
test('equal simultaneous lethal contributions credit the lower server action ID',()=>{
 const {game,r,p,q}=setup(['artoria','artoria','artoria']);const target=r.players[2];target.hp=1;game.detect(p,target);game.detect(q,target);game.command(r,p,{action:'attack'});game.command(r,q,{action:'attack'});game.tick();assert.equal(p.kills,1);assert.equal(q.kills,0);assert.equal(p.stats.damage+q.stats.damage,1);
});
test('unreserved copies of food remain usable during crafting',()=>{
 const {game,r,p}=setup();p.hp=10;p.bag=[{id:'bread',qty:2},{id:'garlic',qty:1},null,null,null,null];game.command(r,p,{action:'craft',id:'garlic_bread'});game.command(r,p,{action:'food',slot:0});assert.equal(game.count(p,'bread'),1);assert.throws(()=>game.command(r,p,{action:'food',slot:0}));assert.ok(p.busy);
});
test('HTTP action contract requires IDs, returns a stable receipt and accepts surrender',async()=>{
 const {game,r,p,q,keys}=setup();async function action(body){const req=Readable.from([JSON.stringify(body)]);Object.assign(req,{method:'POST',url:'/api/action',headers:{host:'localhost',origin:'http://localhost',authorization:'Bearer '+keys[1]}});const res={statusCode:200,setHeader(){},end(value){this.body=JSON.parse(value);}};await game.handle(req,res);return res;}
 const bad=await action({action:'search'});assert.equal(bad.statusCode,400);const one=await action({action:'search',requestId:'http-1'}),two=await action({action:'search',requestId:'http-1'});assert.equal(one.statusCode,200);assert.deepEqual(one.body.receipt,two.body.receipt);assert.equal(q.sta,121);const leave=await action({action:'leave',requestId:'leave-1'});assert.equal(leave.statusCode,200);assert.equal(q.dead,true);game.tick();assert.equal(r.winner,p.id);
});
