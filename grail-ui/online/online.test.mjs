import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import vm from 'node:vm';
import {OnlineGameService,RoomRepository,restoreGame,serializeGame} from './server/online-service.mjs';

/* Actual SQLite, async D1-shaped calls and atomic batches exercise the production SQL. */
class D1SQLite{
 constructor(migrate=true){this.sql=new DatabaseSync(':memory:');this.sql.exec('PRAGMA foreign_keys=ON');if(migrate)for(const name of fs.readdirSync(new URL('./drizzle/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort())this.sql.exec(fs.readFileSync(new URL('./drizzle/'+name,import.meta.url),'utf8'));this.conflicts=0;}
 withSession(constraint){assert.equal(constraint,'first-primary');return this;}
 prepare(sql){const db=this,query={sql,values:[],bind(...values){this.values=values;return this;},async first(){await Promise.resolve();return db.sql.prepare(sql).get(...this.values)||null;},runSync(){const result=db.sql.prepare(sql).run(...this.values);if(sql.startsWith('UPDATE game_rooms')&&!Number(result.changes))db.conflicts++;return {success:true,meta:{changes:Number(result.changes)}};},async run(){await Promise.resolve();return this.runSync();}};return query;}
 async batch(statements){await Promise.resolve();this.sql.exec('BEGIN IMMEDIATE');try{const result=statements.map(q=>q.runSync());this.sql.exec('COMMIT');return result;}catch(e){this.sql.exec('ROLLBACK');throw e;}}
}
function harness(){
 const db=new D1SQLite();let now=1_000_000;
 const service=()=>new OnlineGameService(db,{now:()=>now,random:()=>.4});
 const request=async(path,{key,body,method,headers={}}={})=>{
  const response=await service().handle(new Request('https://game.example/api/'+path,{method:method||(body?'POST':'GET'),headers:{...(body?{'Content-Type':'application/json'}:{}),...(key?{Authorization:'Bearer '+key}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})}));return {status:response.status,headers:response.headers,json:await response.json()};
 };
 const action=(key,action,extra={})=>request('action',{key,body:{action,requestId:crypto.randomUUID(),...extra}});
 return {db,request,action,advance:ms=>{now+=ms;},now:()=>now,service};
}
async function battle(chars=['amuro','link']){
 const h=harness(),a=(await h.request('create',{body:{character:chars[0],nickname:'A'}})).json,b=(await h.request('join',{body:{code:a.code,character:chars[1],nickname:'B'}})).json;
 assert.equal((await h.action(a.key,'ready')).status,200);assert.equal((await h.action(b.key,'ready')).status,200);assert.equal((await h.action(a.key,'start')).status,200);await h.action(a.key,'start-region',{id:5});await h.action(b.key,'start-region',{id:5});return {...h,a,b};
}

test('health confirms a real persistent database and never caches an API response',async()=>{
 const h=harness(),r=await h.request('health');assert.equal(r.status,200);assert.equal(r.json.mode,'online-rooms');assert.equal(r.json.storage,'persistent');assert.match(r.headers.get('Cache-Control'),/no-store/);
 const absent=await new OnlineGameService(undefined).handle(new Request('https://game.example/api/health'));assert.equal(absent.status,503);
 const missing=await new OnlineGameService(new D1SQLite(false)).handle(new Request('https://game.example/api/health'));assert.equal(missing.status,503);assert.ok(!(await missing.text()).includes('SQLITE'));
});
test('room and sessions survive a new service instance on every request',async()=>{
 const h=harness(),a=await h.request('create',{body:{character:'amuro',nickname:'온라인 A'}});assert.equal(a.status,200);const b=await h.request('join',{body:{code:a.json.code,character:'link',nickname:'온라인 B'}});assert.equal(b.status,200);
 const view=await h.request('state',{key:a.json.key});assert.equal(view.json.roster.length,2);assert.equal(view.json.code,a.json.code);assert.equal(view.json.phase,'waiting');assert.equal(view.json.roster.find(p=>p.isSelf).character,'amuro');assert.ok(view.json.revision>b.json.revision);
});
test('concurrent joins admit exactly four players without orphan sessions or lost updates',async()=>{
 const h=harness(),a=(await h.request('create',{body:{character:'amuro'}})).json;
 const joins=await Promise.all(Array.from({length:6},(_,i)=>h.request('join',{body:{code:a.code,character:i%2?'link':'artoria',nickname:'J'+i}})));
 assert.equal(joins.filter(x=>x.status===200).length,3);assert.ok(joins.filter(x=>x.status!==200).every(x=>x.status===400));
 const stored=h.db.sql.prepare('SELECT state FROM game_rooms').get(),room=restoreGame(stored.state).room,sessions=h.db.sql.prepare('SELECT player_id FROM game_sessions').all();assert.equal(room.players.length,4);assert.equal(sessions.length,4);assert.ok(sessions.every(s=>room.players.some(p=>p.id===s.player_id)));assert.ok(h.db.conflicts>0);
});
test('concurrent readiness and deployment keep every participant and private starting selection',async()=>{
 const h=harness(),first=(await h.request('create',{body:{character:'amuro'}})).json,players=[first];for(const character of ['link','artoria','yukina'])players.push((await h.request('join',{body:{code:first.code,character}})).json);
 const ready=await Promise.all(players.map(x=>h.action(x.key,'ready')));assert.ok(ready.every(r=>r.status===200));const r=await h.action(first.key,'start');assert.equal(r.json.phase,'selecting');
 await h.action(players[0].key,'start-region',{id:5});const hidden=await h.request('state',{key:players[1].key});assert.equal(hidden.json.ownRegion,null);assert.equal(hidden.json.selectedCount,1);assert.ok(hidden.json.roster.every(x=>x.region===undefined&&x.startRegion===undefined));
 const deployed=await Promise.all(players.slice(1).map(x=>h.action(x.key,'start-region',{id:5})));assert.ok(deployed.every(x=>x.status===200));const view=await h.request('state',{key:first.key});assert.equal(view.json.phase,'battle');assert.equal(view.json.state.alive,4);assert.equal(view.json.state.ammo.loaded,6);
});
test('concurrent retries of one shot consume one bullet and resolve damage once across restarts',async()=>{
 const h=await battle();await h.action(h.a.key,'search');h.advance(1501);const found=await h.request('state',{key:h.a.key});assert.equal(found.json.state.enemy.character,'link');
 const requestId='one-shot-retry',shots=await Promise.all([h.action(h.a.key,'attack',{requestId}),h.action(h.a.key,'attack',{requestId})]);assert.ok(shots.every(x=>x.status===200));h.advance(1);
 const target=await h.request('state',{key:h.b.key}),own=await h.request('state',{key:h.a.key});assert.equal(target.json.state.hp,102);assert.equal(own.json.state.ammo.loaded,5);assert.equal(own.json.state.mastery.gun,22);assert.equal(own.json.state.stats.damage,18);
 await h.action(h.a.key,'attack',{requestId});assert.equal((await h.request('state',{key:h.a.key})).json.state.ammo.loaded,5);
});
test('reload, funnel channel and status counters persist without a long-lived process',async()=>{
 const h=await battle();const activate=await h.action(h.a.key,'np');assert.equal(activate.json.state.sta,102);assert.equal(activate.json.state.busy.duration,1);h.advance(1001);
 const deployed=await h.request('state',{key:h.a.key});assert.equal(deployed.json.state.statuses.find(x=>x.type==='funnels').stacks,3);
 const row=h.db.sql.prepare('SELECT state FROM game_rooms WHERE code=?').get(h.a.code),restored=restoreGame(row.state);assert.ok(restored.game.rooms.has(h.a.code));assert.ok(restored.room.players[0].requests instanceof Map);assert.equal(restored.room.players[0].funnels.charges,3);
});
test('periodic effects catch up using their original timestamps after a Worker restart',async()=>{
 const h=await battle(),record=await new RoomRepository(h.db).room(h.a.code,h.now()),{game,room}=restoreGame(record.state,{now:()=>h.now()/1000});game.applyStatus(room,room.players[1],room.players[0],'bleed',{duration:3,power:3});assert.equal(await new RoomRepository(h.db).commit(record,serializeGame(game,room),room,h.now()),true);
 h.advance(3001);const own=await h.request('state',{key:h.a.key});assert.equal(own.json.state.hp,111);assert.ok(!own.json.state.statuses.some(x=>x.type==='bleed'));
});
test('reconnecting inside sixty seconds preserves a player; later disconnects do not resurrect them',async()=>{
 const h=await battle();h.advance(59000);await h.request('state',{key:h.b.key});const rejoin=await h.request('state',{key:h.a.key});assert.equal(rejoin.json.state.dead,false);
 h.advance(59000);await h.request('state',{key:h.b.key});h.advance(2000);const gone=await h.request('state',{key:h.a.key});assert.equal(gone.json.phase,'finished');assert.equal(gone.json.state.dead,true);assert.equal(gone.json.result.own.reason,'연결 종료');
});
test('server time controls closure and client time/HP fields cannot change outcomes',async()=>{
 const h=await battle();const before=await h.request('state',{key:h.a.key});const response=await h.action(h.a.key,'cancel',{now:9e15,hp:99999,region:22});assert.equal(response.json.state.hp,120);assert.equal(response.json.state.region,5);assert.equal(response.json.state.elapsedSeconds,before.json.state.elapsedSeconds);
});
test('stored sessions are SHA256 hashes and player IDs are not login keys',async()=>{
 const h=harness(),a=(await h.request('create',{body:{character:'link'}})).json;const session=h.db.sql.prepare('SELECT * FROM game_sessions').get();assert.equal(session.token_hash.length,64);assert.notEqual(session.token_hash,a.key);assert.equal((await h.request('state',{key:session.player_id})).status,401);
 const raw=h.db.sql.prepare('SELECT state FROM game_rooms').get().state;assert.ok(!raw.includes(a.key));const view=await h.request('state',{key:a.key});assert.ok(!JSON.stringify(view.json).includes(session.player_id));
});
test('expired rooms and sessions are removed together; old keys cannot attach to new rooms',async()=>{
 const h=harness(),a=(await h.request('create',{body:{character:'link'}})).json;h.advance(2*60*60*1000+1);assert.equal((await h.request('state',{key:a.key})).status,401);const b=await h.request('create',{body:{character:'amuro'}});assert.equal(b.status,200);assert.equal(h.db.sql.prepare('SELECT count(*) AS n FROM game_rooms').get().n,1);assert.equal(h.db.sql.prepare('SELECT count(*) AS n FROM game_sessions').get().n,1);assert.equal((await h.request('state',{key:a.key})).status,401);
});
test('create uses an atomic batch so a code collision cannot leave a session behind',async()=>{
 const h=harness(),repo=new RoomRepository(h.db),session={hash:'a'.repeat(64),playerId:'first'};await repo.create('123456','{}',session,h.now());await assert.rejects(()=>repo.create('123456','{}',{hash:'b'.repeat(64),playerId:'loser'},h.now()));assert.equal(h.db.sql.prepare('SELECT count(*) AS n FROM game_sessions').get().n,1);assert.equal(h.db.sql.prepare('SELECT count(*) AS n FROM game_rooms').get().n,1);
});
test('invalid origin, methods, payloads and session keys are rejected before mutation',async()=>{
 const h=harness();assert.equal((await h.request('create',{body:{},headers:{Origin:'https://evil.example'}})).status,403);assert.equal((await h.request('create',{body:{},headers:{'Content-Type':'text/plain'}})).status,415);assert.equal((await h.request('create',{method:'GET'})).status,405);assert.equal((await h.request('unknown')).status,404);assert.equal((await h.request('create',{body:{nickname:'a'.repeat(8300)}})).status,413);assert.equal((await h.request('create',{body:{character:'__proto__'}})).status,400);assert.equal((await h.request('state')).status,401);assert.equal((await h.request('join',{body:{code:"' OR 1=1"}})).status,400);assert.equal(h.db.sql.prepare('SELECT count(*) AS n FROM game_rooms').get().n,0);
});
test('invalid actions retain their receipt and cannot change inventory on retry',async()=>{
 const h=await battle();const body={action:'equip',slot:99,requestId:'bad-equip'};assert.equal((await h.request('action',{key:h.a.key,body})).status,400);assert.equal((await h.request('action',{key:h.a.key,body})).status,400);const s=await h.request('state',{key:h.a.key});assert.equal(s.json.state.ammo.loaded,6);assert.equal(s.json.state.lastAction.ok,false);
});
test('serialization bounds the retry cache and retains instance maker and magazine metadata',async()=>{
 const h=await battle(),row=h.db.sql.prepare('SELECT state FROM game_rooms').get(),{game,room}=restoreGame(row.state,{now:()=>h.now()/1000}),p=room.players[0];
 for(let i=0;i<600;i++)game.command(room,p,{action:'cancel',requestId:'cancel-'+i});const saved=serializeGame(game,room),restored=restoreGame(saved);assert.equal(restored.room.players[0].requests.size,512);assert.ok(restored.room.players[0].requests.has('cancel-599'));assert.deepEqual(restored.room.players[0].equipmentMeta,p.equipmentMeta);
 room.logs=[{message:'x'.repeat(1_600_000)}];assert.throws(()=>serializeGame(game,room),/저장 한도/);
});
test('the browser ignores stale revisions and responses from previous room sessions',()=>{
 const source=fs.readFileSync(new URL('./public/lobby.js',import.meta.url),'utf8'),code=source.slice(source.indexOf('function acceptRoomData('),source.indexOf('async function enterRoom('));const ctx=vm.createContext({roomKey:'current',roomView:{code:'123456',revision:10}});vm.runInContext(code,ctx);
 assert.equal(vm.runInContext("acceptRoomData({code:'123456',revision:9},'current')",ctx),false);assert.equal(vm.runInContext("acceptRoomData({code:'123456',revision:11},'previous')",ctx),false);assert.equal(vm.runInContext("acceptRoomData({code:'123456',revision:11},'current')",ctx),true);assert.equal(ctx.roomView.revision,11);
});
test('action network retries preserve the exact request ID and reject nonretryable errors',async()=>{
 const source=fs.readFileSync(new URL('./public/lobby.js',import.meta.url),'utf8'),code=source.slice(source.indexOf('async function api('),source.indexOf('function acceptRoomData('));const bodies=[];
 const ctx=vm.createContext({clock:()=>1000,roomKey:'test-session',AbortSignal,JSON,Error,Promise,setTimeout:fn=>fn(),fetch:async(url,options)=>{bodies.push(options.body);return Response.json(bodies.length===1?{error:'busy'}:{ok:true},{status:bodies.length===1?503:200});}});vm.runInContext(code,ctx);await vm.runInContext("api('action',{action:'attack',requestId:'retry-same'})",ctx);assert.equal(bodies.length,2);assert.equal(bodies[0],bodies[1]);
});
