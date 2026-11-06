import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {GameService} from './game-server.mjs';

function setup(chars=['amuro','artoria','yukina']){
 let time=1000,random=.4,serial=0;
 const g=new GameService({now:()=>time,random:()=>random,token:()=>`rider-${++serial}`});
 const a=g.create({character:chars[0]});for(const character of chars.slice(1))g.join({code:a.code,character});
 const r=g.room(a.code);for(const p of r.players)p.ready=true;g.command(r,r.players[0],{action:'start'});for(const p of r.players)g.command(r,p,{action:'start-region',id:5});r.practice=true;
 const [p,q,z]=r.players;
 const advance=n=>{time+=n;for(const p of r.players)p.lastSeen=time;g.tick();};
 const attack=(actor=p,target=q,extra={})=>{g.detect(actor,target);g.command(r,actor,{action:'attack',...extra});g.tick();};
 return {g,r,p,q,z,advance,attack,setRandom:v=>random=v};
}
const normal=(g,p,q)=>g.atk(p)*g.mastery(p)[2]*100/(100+g.def(q));
function craft(g,r,p,id){const item=g.items[id];for(const x of item.recipe.inputs){const missing=x.quantity-g.count(p,x.itemId);if(missing>0)assert.equal(g.add(p,x.itemId,missing),missing);}g.command(r,p,{action:'craft',id});}

test('four characters start with their own stats, mastery, and finite ammunition',()=>{
 const {g,r,p}=setup();assert.equal(g.maxHp(p),120);assert.equal(g.atk(p),25);assert.equal(p.mastery.gun,21);assert.equal(p.equipmentMeta.weapon.ammo,6);assert.equal(g.count(p,'bullets'),20);
 const link=g.player('link');link.startRegion=5;const room={players:[link],practice:true,logs:[]};g.start(room);assert.equal(g.maxSta(link),124);assert.equal(g.weaponBonus(link),0);assert.equal(g.atk(link),24);
 assert.throws(()=>g.player('__proto__'));assert.throws(()=>g.player('constructor'));assert.equal(r.players.length,3);
});
test('shots consume exactly one loaded round including misses and duplicate request retries',()=>{
 const {g,r,p,q,attack,setRandom,advance}=setup();setRandom(.99);attack(p,q,{requestId:'shot'});assert.equal(p.equipmentMeta.weapon.ammo,5);assert.equal(q.hp,120);
 g.command(r,p,{action:'attack',requestId:'shot'});assert.equal(p.equipmentMeta.weapon.ammo,5);
 advance(1.5);p.equipmentMeta.weapon.ammo=0;const before=p.attackUntil;assert.throws(()=>attack());assert.equal(p.attackUntil,before);assert.equal(p.sta,120);
});
test('reload transfers only missing rounds at completion; cancel and stun consume nothing',()=>{
 const {g,r,p,q,attack,advance}=setup();attack();g.command(r,p,{action:'reload'});advance(.7);assert.equal(p.equipmentMeta.weapon.ammo,5);assert.equal(g.count(p,'bullets'),20);assert.throws(()=>attack());assert.throws(()=>g.command(r,p,{action:'np'}));
 g.command(r,p,{action:'cancel'});assert.equal(g.count(p,'bullets'),20);g.command(r,p,{action:'reload'});g.applyStatus(r,q,p,'stun',{attribute:'PHYSICAL',duration:1});advance(1);assert.equal(p.busy,null);assert.equal(p.equipmentMeta.weapon.ammo,5);
 g.command(r,p,{action:'reload'});advance(1.5);assert.equal(p.equipmentMeta.weapon.ammo,6);assert.equal(g.count(p,'bullets'),19);assert.throws(()=>g.command(r,p,{action:'reload'}));
});
test('gun magazines survive equip, discard, pickup and are never refilled by swapping',()=>{
 const {g,r,p,attack,advance}=setup();attack();const uid=p.equipmentMeta.weapon.uid;g.add(p,'long_sword',1);let slot=p.bag.findIndex(x=>x?.id==='long_sword');g.command(r,p,{action:'equip',slot});advance(.5);
 const gun=p.bag[slot];assert.equal(gun.meta.ammo,5);g.command(r,p,{action:'discard',slot});g.command(r,p,{action:'pickup',slot:0});advance(.5);
 slot=p.bag.findIndex(x=>x?.id==='southern_revolver');assert.equal(p.bag[slot].meta.uid,uid);g.command(r,p,{action:'equip',slot});advance(.5);assert.equal(p.equipmentMeta.weapon.ammo,5);assert.equal(p.equipmentMeta.weapon.uid,uid);
});
test('newly found guns are empty; first magazine capacity and shared gun mastery are real',()=>{
 const {g,r,p,advance}=setup();g.add(p,'im_10',1);const slot=p.bag.findIndex(x=>x?.id==='im_10');g.command(r,p,{action:'equip',slot});advance(.5);assert.equal(p.equipmentMeta.weapon.ammo,0);assert.equal(g.capacity(p.equipment.weapon),20);assert.equal(p.weaponType,'gun');assert.equal(p.mastery.gun,21);g.command(r,p,{action:'reload'});advance(1.5);assert.equal(p.equipmentMeta.weapon.ammo,20);assert.equal(g.count(p,'bullets'),0);
});
test('gun mastery is available to other classes without giving them Amuro abilities',()=>{
 const {g,r,p,advance}=setup(['link','artoria','yukina']);g.add(p,'southern_revolver',1);const slot=p.bag.findIndex(x=>x?.id==='southern_revolver');g.command(r,p,{action:'equip',slot});advance(.5);assert.equal(p.mastery.gun,0);assert.equal(g.mastery(p)[0],'F');assert.throws(()=>g.command(r,p,{action:'np'}));assert.equal(p.npUntil,0);
});
test('Newtype reduction applies once per twelve seconds and only to servant basics',()=>{
 const {g,p,q,attack,advance}=setup(['artoria','amuro','yukina']);let expected=Math.floor(normal(g,p,q)*.8);attack();assert.equal(120-q.hp,expected);assert.equal(q.predictionUntil,1012);
 advance(1.5);expected=Math.floor(normal(g,p,q));const before=q.hp;attack();assert.equal(before-q.hp,expected);advance(10.5);expected=Math.floor(normal(g,p,q)*.8);const hp=q.hp;attack();assert.equal(hp-q.hp,expected);assert.equal(q.predictionUntil,1024);
});
test('misses and direct Noble Phantasms do not consume Newtype prediction',()=>{
 const {g,r,p,q,attack,setRandom}=setup(['yukina','amuro','artoria']);setRandom(.99);attack();assert.equal(q.predictionUntil,0);p.attackUntil=0;setRandom(.4);g.detect(p,q);g.command(r,p,{action:'np'});g.tick();assert.equal(q.predictionUntil,0);
});
test('simultaneous basics share only the first Newtype reduction',()=>{
 const {g,r,p,q,z}=setup(['artoria','amuro','artoria']);const expected=Math.floor(normal(g,p,q)*.8)+Math.floor(normal(g,z,q));g.detect(p,q);g.detect(z,q);g.command(r,p,{action:'attack'});g.command(r,z,{action:'attack'});g.tick();assert.equal(120-q.hp,expected);assert.equal(q.predictionUntil,1012);
});
test('Fin Funnels take one second to deploy, preserve attack waits, and provide three shots',()=>{
 const {g,r,p,q,advance,attack}=setup();p.attackUntil=1002;g.command(r,p,{action:'np'});assert.equal(p.sta,102);assert.equal(p.npUntil,1070);assert.equal(p.funnels,null);advance(1);assert.equal(p.funnels.charges,3);assert.equal(p.attackUntil,1002);assert.equal(p.equipmentMeta.weapon.ammo,6);advance(1);
 const expected=Math.floor(normal(g,p,q)+5.7*.75),before=q.hp;attack();assert.equal(before-q.hp,expected);assert.equal(p.funnels.charges,2);assert.equal(p.mastery.gun,22);
 advance(1.5);attack();advance(1.5);attack();assert.equal(p.funnels,null);assert.equal(p.equipmentMeta.weapon.ammo,3);
});
test('Fin Funnel charges are spent on misses, animals and Spirit Sight without extra rewards',()=>{
 const {g,r,p,q,z,advance,attack,setRandom}=setup();g.command(r,p,{action:'np'});advance(1);setRandom(.99);attack();assert.equal(p.funnels.charges,2);assert.equal(q.hp,120);advance(1.5);setRandom(.4);attack(p,z);assert.equal(z.hp,116);assert.equal(p.funnels.charges,1);advance(1.5);const a=r.animals[p.region];const expected=Math.floor(g.atk(p)*g.mastery(p)[2]*100/(100+a.defense)),before=a.hp;attack(p,a);assert.equal(before-a.hp,expected);assert.equal(p.funnels,null);assert.equal(p.mastery.gun,24);
});
test('funnel interference snapshots at activation and reduces only the marked caster',()=>{
 const {g,r,p,q,z,advance,attack}=setup(['amuro','yukina','yukina']);q.evadeUntil=z.evadeUntil=9999;p.marks[q.id]=1005;g.command(r,p,{action:'np'});assert.deepEqual(p.marks,{});advance(1);p.marks[z.id]=1020;
 let expected=Math.floor(normal(g,p,q)+5.7*.5),before=q.hp;attack();assert.equal(before-q.hp,expected);advance(1.5);expected=Math.floor(normal(g,p,z)+5.7);before=z.hp;attack(p,z);assert.equal(before-z.hp,expected);assert.ok(p.marks[z.id]>1000);
});
test('move, expiry, silence and canceled deployment respect funnel lifetime and costs',()=>{
 const {g,r,p,q,advance}=setup();g.command(r,p,{action:'np'});g.command(r,p,{action:'cancel'});advance(1);assert.equal(p.funnels,null);assert.equal(p.npUntil,1070);assert.equal(p.sta,102);
 p.npUntil=0;g.command(r,p,{action:'np'});advance(1);g.applyStatus(r,q,p,'silence',{attribute:'PHYSICAL'});assert.ok(p.funnels);g.command(r,p,{action:'travel',id:7});assert.equal(p.funnels,null);
 advance(4);p.npUntil=0;g.command(r,p,{action:'np'});advance(1);advance(8);assert.ok(!g.visibleStatuses(p,g.now()).some(x=>x.type==='funnels'));
});
test('Link strengthens only personally crafted weapons and never his starting weapon',()=>{
 const {g,r,p,advance}=setup(['link','artoria','yukina']);assert.equal(g.weaponBonus(p),0);craft(g,r,p,'bastard_sword');assert.equal(g.weaponBonus(p),0);advance(1);assert.equal(p.equipment.weapon,'bastard_sword');assert.equal(g.weaponBonus(p),4);assert.equal(g.atk(p),52);
});
test('craft cancellation and preflight cannot mark, upgrade or duplicate weapons',()=>{
 const {g,r,p}=setup(['link','artoria','yukina']);const uid=p.equipmentMeta.weapon.uid;craft(g,r,p,'bastard_sword');g.command(r,p,{action:'cancel'});assert.equal(p.equipmentMeta.weapon.uid,uid);assert.equal(p.equipmentMeta.weapon.makerId,null);assert.equal(g.count(p,'bastard_sword'),0);assert.equal(g.count(p,'steel'),1);
});
test('recrafting creates one new enhancement instead of stacking old bonuses',()=>{
 const {g,r,p,advance}=setup(['link','artoria','yukina']);craft(g,r,p,'bastard_sword');advance(1);const uid=p.equipmentMeta.weapon.uid;craft(g,r,p,'hades_edge');advance(1);assert.equal(p.equipment.weapon,'hades_edge');assert.notEqual(p.equipmentMeta.weapon.uid,uid);assert.equal(g.weaponBonus(p),5);assert.equal(g.atk(p),66);
});
test('same item IDs keep their own maker identity across swaps and ground recovery',()=>{
 const {g,r,p,advance}=setup(['link','artoria','yukina']);craft(g,r,p,'bastard_sword');advance(1);const uid=p.equipmentMeta.weapon.uid;g.add(p,'bastard_sword',1);let slot=p.bag.findIndex(x=>x?.id==='bastard_sword');g.command(r,p,{action:'equip',slot});advance(.5);assert.equal(g.weaponBonus(p),0);assert.equal(p.bag[slot].meta.uid,uid);
 g.command(r,p,{action:'discard',slot});g.command(r,p,{action:'pickup',slot:0});advance(.5);slot=p.bag.findIndex(x=>x?.meta?.uid===uid);g.command(r,p,{action:'equip',slot});advance(.5);assert.equal(g.weaponBonus(p),4);assert.equal(p.equipmentMeta.weapon.uid,uid);
});
test('corpse looting preserves a gun magazine and does not transfer Link enhancement ownership',()=>{
 const {g,r,p,q,advance}=setup(['amuro','link','link']);r.practice=false;p.equipmentMeta.weapon.ammo=2;const uid=p.equipmentMeta.weapon.uid;g.die(r,p,'test',g.now());const corpse=r.corpses.at(-1);q.knownCorpses.push(corpse.id);const entry=corpse.entries.find(x=>x.id==='southern_revolver');g.command(r,q,{action:'corpse-loot',corpseId:corpse.id,entryKey:entry.key});advance(.5);let slot=q.bag.findIndex(x=>x?.meta?.uid===uid);g.command(r,q,{action:'equip',slot});advance(.5);assert.equal(q.equipmentMeta.weapon.ammo,2);assert.equal(g.weaponBonus(q),0);
 const foreign=g.meta('long_sword');foreign.makerId=p.id;g.add(q,'long_sword',1,foreign);slot=q.bag.findIndex(x=>x?.meta?.uid===foreign.uid);g.command(r,q,{action:'equip',slot});advance(.5);assert.equal(g.weaponBonus(q),0);
});
test('Link NP snapshots the HP80 threshold, costs, magic resistance and shared attack interval',()=>{
 for(const healthy of [false,true]){const {g,r,p,q}=setup(['link','artoria','yukina']);p.hp=g.maxHp(p)*(healthy?.8:.799);const expected=Math.floor(normal(g,p,q)+(healthy?18:13.5)*.75);g.detect(p,q);g.command(r,p,{action:'np'});g.tick();assert.equal(120-q.hp,expected);assert.equal(p.sta,112);assert.equal(p.npUntil,1060);assert.equal(p.attackUntil,1001.5);assert.equal(p.mastery.blade,22);assert.deepEqual(q.marks,{});assert.throws(()=>g.command(r,p,{action:'attack'}));}
});
test('Link NP ignores Spirit Sight and interference affects only its magic component',()=>{
 const {g,r,p,q}=setup(['link','yukina','artoria']);p.marks[q.id]=1010;const expected=Math.floor(normal(g,p,q)+18*.5);g.detect(p,q);g.command(r,p,{action:'np'});g.tick();assert.equal(116-q.hp,expected);assert.equal(q.evadeUntil,0);assert.ok(q.stats.interferencePrevented>0);assert.deepEqual(p.marks,{});
});
test('snapshots publish self ammo and crafted ownership booleans without internal maker or instance IDs',()=>{
 const {g,r,p,q}=setup();g.detect(q,p);const snap=g.snapshot(r,p),other=g.snapshot(r,q);assert.deepEqual(snap.state.ammo,{loaded:6,capacity:6,reserve:20});assert.equal(other.state.enemy.ammo,undefined);assert.equal(other.state.enemy.equipmentMeta,undefined);const raw=JSON.stringify(snap);assert.ok(!raw.includes('makerId'));assert.ok(!raw.includes('"uid"'));assert.ok(!raw.includes(p.id));
});
test('all gun recipes have reachable inputs, magazine data and a complete epic crafting path',()=>{
 const {g}=setup();for(const i of Object.values(g.items).filter(i=>i.weaponTypes.includes('gun'))){assert.ok(g.capacity(i.id)>0);assert.ok(!i.combatPending);}
 const visit=(id,seen=new Set())=>{assert.ok(g.items[id]);assert.ok(!seen.has(id),'recipe cycle');const i=g.items[id];if(!i.recipe)return assert.ok(i.loot.regionIds.length||i.loot.randomAt?.length);const next=new Set([...seen,id]);for(const x of i.recipe.inputs)visit(x.itemId,next);};visit('rail_rifle');assert.equal(g.items.rail_rifle.attack,46);assert.equal(g.items.rail_rifle.rarity,'Epic');assert.equal(Object.keys(g.items).length,214);assert.equal(Object.values(g.items).filter(i=>i.recipe).length,57);
});
test('Rider UI records match server growth, costs and abilities',()=>{
 const ctx=vm.createContext({CHARACTERS:{artoria:{},yukina:{}}});vm.runInContext(fs.readFileSync(new URL('./dist/rider-characters.js',import.meta.url),'utf8'),ctx);for(const id of ['amuro','link']){const ui=ctx.CHARACTERS[id],core=GRAIL_GAME.C[id];assert.equal(ui.maxHp,core.hp);assert.equal(ui.maxSta,core.sta);assert.equal(ui.atkGrowth,core.ag);assert.equal(ui.defGrowth,core.dg);assert.ok(ui.npText);assert.ok(ui.passiveText);}
});
