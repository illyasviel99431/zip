import test from 'node:test';
import assert from 'node:assert/strict';
import {GameService} from './game-server.mjs';
function setup(chars=['artoria','artoria','artoria']){
 let time=1000,rng=.4,id=0;const game=new GameService({now:()=>time,random:()=>rng,token:()=>`combat-${++id}`});
 const first=game.create({character:chars[0]});for(const character of chars.slice(1))game.join({code:first.code,character});
 const r=game.room(first.code);for(const p of r.players)p.ready=true;game.command(r,r.players[0],{action:'start'});for(const p of r.players)game.command(r,p,{action:'start-region',id:5});
 const [p,q,z]=r.players,advance=n=>{time+=n;for(const x of r.players)x.lastSeen=time;game.tick();};
 return {game,r,p,q,z,advance,setRandom:n=>rng=n,setTime:n=>time=n};
}
test('stances alter only servant discovery; stealth weights are respected',()=>{
 const {game,p,q,setRandom}=setup();assert.equal(p.stance,'normal');setRandom(.75);assert.equal(game.searchTarget(p,[q]),null);p.stance='offensive';assert.equal(game.searchTarget(p,[q]),q);p.stance='stealth';assert.equal(game.searchTarget(p,[q]),null);setRandom(.45);assert.equal(game.searchTarget(p,[q]),q);q.stance='stealth';assert.equal(game.searchTarget(p,[q]),null);assert.equal(game.atk(p),24);assert.equal(game.def(p),22);
});
test('stance changes preserve channels, resources and attack timers; duplicate requests do not renew their cooldown',()=>{
 const {game,r,p,advance}=setup();game.command(r,p,{action:'search'});const busy=structuredClone(p.busy),sta=p.sta;p.attackUntil=1010;p.npUntil=1111;
 game.command(r,p,{action:'stance',id:'offensive',requestId:'stance-once'});assert.deepEqual(p.busy,busy);assert.equal(p.sta,sta);assert.equal(p.attackUntil,1010);assert.equal(p.npUntil,1111);const until=p.stanceUntil;
 advance(.5);game.command(r,p,{action:'stance',id:'offensive',requestId:'stance-once'});assert.equal(p.stanceUntil,until);assert.throws(()=>game.command(r,p,{action:'stance',id:'stealth'}));advance(1.5);game.command(r,p,{action:'stance',id:'stealth'});assert.equal(p.stance,'stealth');
});
test('magic state resistance is relative probability; physical states do not use it',()=>{
 const {game,r,p,q,setRandom}=setup();setRandom(.9);assert.equal(game.applyStatus(r,p,q,'silence'),false);assert.equal(game.applyStatus(r,p,q,'root'),true);assert.equal(q.statusEffects.root.until,1002);assert.throws(()=>game.applyStatus(r,p,q,'blind',{duration:NaN}));assert.throws(()=>game.applyStatus(r,p,q,'missing'));
});
test('stun interrupts a cast without refund and blocks costs; cancellation remains available',()=>{
 const {game,r,p,q}=setup();game.command(r,q,{action:'np'});const cooldown=q.npUntil;assert.ok(q.busy);game.applyStatus(r,p,q,'stun',{duration:2});assert.equal(q.busy,null);assert.equal(q.npUntil,cooldown);const before=[q.hp,q.sta,q.seals,q.bag[0].qty];
 for(const action of [{action:'travel',id:1,seal:true},{action:'food',slot:0},{action:'search'},{action:'attack'},{action:'stance',id:'stealth'}])assert.throws(()=>game.command(r,q,action),/기절/);
 assert.deepEqual([q.hp,q.sta,q.seals,q.bag[0].qty],before);game.command(r,q,{action:'cancel'});
});
test('continuous stun/root cannot extend beyond three seconds and grant a two-second immunity',()=>{
 const {game,r,p,q,advance}=setup();game.applyStatus(r,p,q,'root',{duration:3});advance(1.5);game.applyStatus(r,p,q,'stun',{duration:2});assert.equal(q.statusEffects.stun.until,1003);advance(1.5);assert.equal(q.controlImmuneUntil,1005);assert.equal(game.applyStatus(r,p,q,'root'),false);advance(2);assert.equal(game.applyStatus(r,p,q,'root'),true);
});
test('silence blocks only noble phantasms and root also blocks seal travel',()=>{
 const {game,r,p,q}=setup();game.applyStatus(r,p,q,'silence');assert.throws(()=>game.command(r,q,{action:'np'}),/침묵/);game.detect(q,p);game.command(r,q,{action:'attack'});game.tick();game.applyStatus(r,p,q,'root');const seals=q.seals;assert.throws(()=>game.command(r,q,{action:'travel',id:1,seal:true}),/속박/);assert.equal(q.seals,seals);
});
test('bleed ticks at every second including expiry without attack XP, mastery or encounter refresh',()=>{
 const {game,r,p,q,advance}=setup();game.detect(p,q);game.applyStatus(r,p,q,'bleed');advance(5);assert.equal(q.hp,105);assert.equal(p.stats.damage,15);assert.equal(p.xp,0);assert.equal(p.mastery.blade,21);assert.equal(game.snapshot(r,p).state.enemy,null);assert.equal(q.statusEffects.bleed,undefined);
});
test('DOT reapplication caps stacks, refreshes rather than adds duration, and keeps cadence',()=>{
 const {game,r,p,q,advance}=setup();game.applyStatus(r,p,q,'bleed');advance(.5);for(let i=0;i<4;i++)game.applyStatus(r,p,q,'bleed',{duration:10});assert.equal(q.statusEffects.bleed.stacks,3);assert.equal(q.statusEffects.bleed.until,1010.5);assert.equal(q.statusEffects.bleed.nextTick,1001);advance(.5);assert.equal(q.hp,111);
});
test('a DOT refreshed at its exact expiry does not lose or duplicate the old last tick',()=>{
 const {game,r,p,q,advance,setTime}=setup();game.applyStatus(r,p,q,'bleed');advance(4);assert.equal(q.hp,108);setTime(1005);game.applyStatus(r,p,q,'bleed',{power:6});game.tick();assert.equal(q.hp,105);assert.equal(q.statusEffects.bleed.stacks,1);advance(1);assert.equal(q.hp,99);
});
test('a weaker refresh cannot steal a stronger DOT owner or alter its damage attribute',()=>{
 const {game,r,p,q,z,advance}=setup();game.applyStatus(r,p,q,'burn',{power:6,attribute:'MAGIC'});game.applyStatus(r,z,q,'burn',{power:3,attribute:'PHYSICAL'});assert.equal(q.statusEffects.burn.sourceId,p.id);assert.equal(q.statusEffects.burn.attribute,'MAGIC');advance(1);assert.equal(q.hp,111);assert.equal(p.stats.damage,9);assert.equal(z.stats.damage,0);
});
test('burn is resisted as magic and a stalled server uses the original application timestamp',()=>{
 const {game,r,p,q,advance}=setup(['yukina','artoria','artoria']);game.applyStatus(r,p,q,'burn',{power:4,duration:2});advance(2);assert.equal(q.hp,114);game.detect(p,q);game.command(r,p,{action:'np'});advance(6);assert.equal(q.marks[p.id],1012);
});
test('shield caps at thirty percent max HP, absorbs after reductions, and grants no damage XP when fully blocked',()=>{
 const {game,r,p,q}=setup();game.applyStatus(r,q,q,'shield',{power:999});assert.equal(q.statusEffects.shield.power,36);game.detect(p,q);game.command(r,p,{action:'attack'});game.tick();assert.equal(q.hp,120);assert.equal(p.stats.damage,0);assert.equal(p.xp,0);assert.equal(p.mastery.blade,22);assert.equal(q.statusEffects.shield.power,19);
});
test('simultaneous attacks share shield absorption and allocate only real HP damage',()=>{
 const {game,r,p,q,z}=setup();z.hp=50;game.applyStatus(r,z,z,'shield',{power:30});game.detect(p,z);game.detect(q,z);game.command(r,p,{action:'attack'});game.command(r,q,{action:'attack'});game.tick();assert.equal(z.hp,46);assert.equal(p.stats.damage+q.stats.damage,4);assert.equal(p.stats.damage,2);assert.equal(q.stats.damage,2);assert.equal(z.statusEffects.shield,undefined);
});
test('fractional shield requests and max-HP caps never create fractional HP damage',()=>{
 const {game,r,p,q}=setup();q.level=2;game.applyStatus(r,q,q,'shield',{power:999});assert.equal(q.statusEffects.shield.power,38);delete q.statusEffects.shield;game.applyStatus(r,q,q,'shield',{power:10.9});assert.equal(q.statusEffects.shield.power,10);game.detect(p,q);game.command(r,p,{action:'attack'});game.tick();assert.ok(Number.isInteger(q.hp));assert.ok(Number.isInteger(p.stats.damage));
});
test('blind changes accuracy; weakness and vulnerability multiply before one final floor',()=>{
 const {game,r,p,q,setRandom,advance}=setup();game.applyStatus(r,q,p,'blind');game.detect(p,q);setRandom(.7);game.command(r,p,{action:'attack'});game.tick();assert.equal(q.hp,120);advance(6);setRandom(.4);game.applyStatus(r,q,p,'weaken');game.applyStatus(r,p,q,'vulnerable');game.detect(p,q);game.command(r,p,{action:'attack'});game.tick();assert.equal(q.hp,104);
});
test('haste affects the next approved interval and never rewinds an existing attack wait',()=>{
 const {game,r,p,q,advance}=setup();game.detect(p,q);game.command(r,p,{action:'attack'});game.tick();const wait=p.attackUntil;game.applyStatus(r,p,p,'haste');assert.equal(p.attackUntil,wait);advance(1.5);game.detect(p,q);game.command(r,p,{action:'attack'});assert.equal(p.attackUntil,1002.7);
});
test('DOT persists after its caster dies but remote kills do not remotely discover a corpse',()=>{
 const {game,r,p,q,z,advance}=setup();game.applyStatus(r,p,q,'bleed');p.region=1;q.hp=3;game.die(r,p,'test',1000);advance(1);assert.equal(q.dead,true);assert.equal(p.kills,1);assert.equal(p.xp,0);assert.equal(p.knownCorpses.includes(q.corpseId),false);assert.equal(z.dead,false);
});
test('status projections never reveal source IDs, shield amounts of opponents, their stance or private marks',()=>{
 const {game,r,p,q,z}=setup();game.applyStatus(r,p,q,'bleed');game.applyStatus(r,q,q,'shield');game.applyStatus(r,z,q,'interference');game.detect(p,q);const snap=game.snapshot(r,p),e=snap.state.enemy;assert.equal(e.stance,undefined);assert.ok(e.statuses.every(s=>!('sourceId' in s)&&!('power' in s)));assert.equal(e.statuses.some(s=>s.type==='interference'),false);assert.equal(JSON.stringify(snap).includes(p.id),false);assert.equal(JSON.stringify(snap).includes(q.id),false);
});
test('clients cannot apply statuses and failed or replayed requests cannot spend extra resources',()=>{
 const {game,r,p,q}=setup();assert.throws(()=>game.command(r,p,{action:'apply-status',target:q.id,type:'stun'}));assert.deepEqual(q.statusEffects,{});game.command(r,p,{action:'stance',id:'stealth',requestId:'same'});const until=p.stanceUntil;game.command(r,p,{action:'stance',id:'stealth',requestId:'same'});assert.equal(p.stanceUntil,until);
});
test('stance and effect validation rejects inherited object keys without mutating state',()=>{
 const {game,r,p,q}=setup();for(const id of ['__proto__','constructor','toString',{},null])assert.throws(()=>game.command(r,p,{action:'stance',id}),/잘못된 태세/);assert.equal(p.stance,'normal');assert.equal(p.stanceUntil,0);assert.throws(()=>game.applyStatus(r,p,q,'__proto__'),/지원하지 않는/);assert.deepEqual(q.statusEffects,{});
});
