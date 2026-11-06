import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import './dist/world-rules.js';
import {GameService} from './game-server.mjs';
const DATA=JSON.parse(fs.readFileSync(new URL('./dist/items.json',import.meta.url)));
const SOURCE=JSON.parse(fs.readFileSync(new URL('./reference/original-map-snapshot.json',import.meta.url)));
const WORLD=globalThis.GRAIL_WORLD;
test('all 22 original areas preserve every fixed item row and discovery stock',()=>{
 assert.equal(DATA.regions.length,22);assert.equal(DATA.regions.filter(r=>!r.restricted).length,21);
 assert.equal(new Set(DATA.regions.flatMap(r=>r.loot.map(l=>l.itemId))).size,154);
 for(const r of DATA.regions){const ref=SOURCE.regions.find(x=>x.id===r.id);assert.equal(r.loot.length,ref.loot.length,r.name);for(const l of r.loot){const item=DATA.items.find(i=>i.id===l.itemId),row=ref.loot.find(x=>x.source===item.reference.url);assert.ok(row,r.name+':'+l.itemId);assert.equal(l.stockDiscoveries,row.stockDiscoveries);assert.equal(l.stockUnits,l.stockDiscoveries*l.quantityPerDiscovery);assert.ok(item.loot.regionIds.includes(r.id));assert.ok(item.stackLimit>=l.quantityPerDiscovery);}}
 assert.equal(DATA.regions.find(r=>r.id===3).loot.find(l=>l.itemId==='scrap_metal').stockUnits,8);
 const water=DATA.regions.find(r=>r.id===6).loot.find(l=>l.itemId==='water');assert.equal(water.stockDiscoveries,17);assert.equal(water.stockUnits,51);
 assert.equal(DATA.regions.find(r=>r.id===22).loot.length,0);
});
test('random waves respect total bundle amounts, closed areas and one-time release',()=>{
 const world={stock:WORLD.stock(DATA)};const start=structuredClone(world.stock);
 WORLD.release(DATA,world,0,[22],()=>.1);assert.equal(world.releasedLoot.length,1);
 for(const e of DATA.randomLoot[0].entries){const added=Object.keys(world.stock).filter(k=>k.endsWith(':'+e.itemId)).reduce((n,k)=>n+world.stock[k]-(start[k]||0),0);assert.equal(added,e.stockDiscoveries*e.quantityPerDiscovery);}
 assert.equal(WORLD.available(DATA,world,3).some(l=>l.itemId==='meteorite'),false);
 assert.equal(WORLD.release(DATA,world,179,[22],()=>0).length,0);
 assert.equal(WORLD.release(DATA,world,180,[1,22],()=>0).length,1);
 assert.ok(world.stock['2:meteorite']>0);assert.equal(world.stock['1:meteorite'],undefined);
 const final=structuredClone(world.stock);WORLD.release(DATA,world,660,[22],()=>0);assert.deepEqual(world.stock,final);
});
test('22-area closure schedule leaves exactly one legal final area',()=>{
 for(let seed=0;seed<30;seed++){let n=seed;const plan=WORLD.closures(DATA,()=>((n=(n*1664525+1013904223)>>>0)/2**32));assert.deepEqual(plan.map(c=>c.ids.length),[6,6,5,3]);const ids=plan.flatMap(c=>c.ids);assert.equal(new Set(ids).size,20);assert.ok(!ids.includes(22));assert.equal(DATA.regions.filter(r=>!r.restricted&&!ids.includes(r.id)).length,1);}
});
test('research center cannot be a start or travel destination; every new regular area works',()=>{
 const game=new GameService(),a=game.create({}),b=game.join({code:a.code}),[r,p]=game.auth(a.key),[,q]=game.auth(b.key);p.ready=q.ready=true;game.command(r,p,{action:'start'});assert.throws(()=>game.command(r,p,{action:'start-region',id:22}));game.command(r,p,{action:'start-region',id:21});game.command(r,q,{action:'start-region',id:18});assert.equal(r.phase,'battle');assert.deepEqual(r.closed,[22]);
 for(const area of DATA.regions.filter(r=>!r.restricted)){p.moveUntil=0;if(p.region!==area.id)game.command(r,p,{action:'travel',id:area.id});assert.equal(p.region,area.id);assert.ok(r.animals[area.id]);}
 assert.throws(()=>game.command(r,p,{action:'travel',id:22}));
 r.started=Date.now()/1000-181;p.region=q.region=r.closures.at(-1).ids[0];game.tick();assert.equal(r.releasedLoot.filter(t=>t===180).length,1);
 assert.equal(game.snapshot(r,p).state.stock,undefined);
});
test('new fixed loot is discoverable and bundle stock is deducted only by actual pickup',()=>{
 const game=new GameService(),a=game.create({}),b=game.join({code:a.code}),[r,p]=game.auth(a.key),[,q]=game.auth(b.key);p.ready=q.ready=true;game.command(r,p,{action:'start'});game.command(r,p,{action:'start-region',id:18});game.command(r,q,{action:'start-region',id:2});r.animals[18].hp=0;r.stock={'18:bandage':8};p.bag=[{id:'bandage',qty:4},...Array(5).fill({id:'long_sword',qty:1})];
 game.random=()=>0;game.searchResult(r,p,game.now());assert.equal(p.bag[0].qty,5);assert.equal(r.stock['18:bandage'],7);assert.equal(p.result.qty,1);
});
test('illustrated map has unique region hit areas, safe label targets and geographic placement',()=>{
 const art=fs.readFileSync(new URL('./dist/map-illustration.js',import.meta.url),'utf8'),source=fs.readFileSync(new URL('./dist/map.js',import.meta.url),'utf8'),context=vm.createContext({DATA});vm.runInContext(art+';globalThis.result={MAP_AREAS,MAP_CENTERS,MAP_COAST};',context);const {MAP_AREAS,MAP_CENTERS,MAP_COAST}=context.result;
 const inside=(p,points)=>{let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 for(const r of DATA.regions){const a=MAP_AREAS[r.id];assert.ok(a.shape.endsWith('Z'));assert.ok(!a.shape.includes('NaN'));assert.ok(inside([a.x,a.y],a.points),r.name+' label is clickable');assert.equal(DATA.regions.filter(q=>inside([a.x,a.y],MAP_AREAS[q.id].points)).length,1,r.name+' label cannot select its neighbor');}
 // Painted building fronts used to activate neighboring regions because the old
 // ground polygons were below their roofs. These are points on the actual art.
 const landmarkPoints={3:[292,95],21:[500,70],8:[802,140],4:[1003,240],10:[260,198],11:[425,200],6:[612,205],9:[140,280],2:[310,287],22:[548,305],14:[719,330],1:[945,350],17:[100,350],18:[207,402],5:[270,510],12:[430,410],13:[584,473],20:[741,462],15:[866,469],16:[1015,540],19:[589,599],7:[126,190]};
 for(const [id,[x,y]] of Object.entries(landmarkPoints)){const point=[x*1000/1101,y*680/747];assert.ok(inside(point,MAP_AREAS[id].points),'painted landmark must belong to region '+id);assert.equal(DATA.regions.filter(r=>inside(point,MAP_AREAS[r.id].points)).length,1,'painted landmark cannot activate a neighboring region');}
 let land=0,covered=0;for(let y=50;y<640;y+=5)for(let x=40;x<970;x+=5){if(!inside([x,y],MAP_COAST))continue;land++;const hits=DATA.regions.filter(r=>inside([x,y],MAP_AREAS[r.id].points)).length;assert.ok(hits<=1,'region boundaries cannot overlap');if(hits)covered++;}assert.ok(covered/land>.98,'only narrow roads may sit between hit areas');
 assert.ok(MAP_CENTERS[7][0]<MAP_CENTERS[3][0]);assert.ok(MAP_CENTERS[3][1]<MAP_CENTERS[10][1]);assert.ok(MAP_CENTERS[8][0]>MAP_CENTERS[22][0]);assert.ok(MAP_CENTERS[16][0]>MAP_CENTERS[15][0]);assert.ok(MAP_CENTERS[19][1]>MAP_CENTERS[13][1]);
 assert.ok(source.includes('class="outline-color" d="${to.shape}"'));
});
