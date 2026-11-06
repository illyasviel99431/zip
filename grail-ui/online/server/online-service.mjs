/* Stateless Worker adapter: the shared game engine is committed atomically per room. */
import '../public/world-rules.js';
import '../public/combat-rules.js';
import '../public/game-core.js';
import DATA from '../public/items.json' with {type:'json'};

const SESSION_TTL=2*60*60*1000,MAX_ROOM_BYTES=1_500_000,MAX_RETRIES=12;
const secureToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(24)),x=>x.toString(16).padStart(2,'0')).join('');
class ApiError extends Error{constructor(message,status=400,code='INVALID_ACTION'){super(message);this.status=status;this.code=code;}}
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store, private','Vary':'Authorization','X-Content-Type-Options':'nosniff'}});
const hash=async key=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key))),x=>x.toString(16).padStart(2,'0')).join('');

export function serializeGame(game,room){
 const players=room.players.map(p=>({...p,requests:[...(p.requests||new Map())].slice(-512)}));
 const json=JSON.stringify({schema:1,room:{...room,players},serial:game.serial,feedbackSerial:game.feedbackSerial});
 if(new TextEncoder().encode(json).length>MAX_ROOM_BYTES)throw new ApiError('방의 저장 한도를 초과했습니다. 새 방을 만들어 주세요.',413,'ROOM_TOO_LARGE');
 return json;
}
export function restoreGame(json,options={}){
 const value=JSON.parse(json);if(value.schema!==1||!Array.isArray(value.room?.players))throw Error('Invalid stored room');
 const game=new globalThis.GRAIL_GAME.GameCore(DATA,{token:secureToken,...options});
 const room=value.room;for(const p of room.players)p.requests=new Map(p.requests||[]);
 game.rooms.set(room.code,room);game.serial=value.serial||0;game.feedbackSerial=value.feedbackSerial||0;
 return {game,room};
}

export class RoomRepository{
 constructor(db){this.db=db?.withSession?db.withSession('first-primary'):db;}
 async ready(){await this.db.prepare('SELECT code FROM game_rooms LIMIT 1').first();}
 async session(tokenHash,now){return this.db.prepare('SELECT room_code, player_id FROM game_sessions WHERE token_hash = ? AND expires_at > ?').bind(tokenHash,now).first();}
 async room(code,now){return this.db.prepare('SELECT code, state, revision, expires_at FROM game_rooms WHERE code = ? AND expires_at > ?').bind(code,now).first();}
 async clean(now){await this.db.batch([this.db.prepare('DELETE FROM game_sessions WHERE expires_at <= ?').bind(now),this.db.prepare('DELETE FROM game_rooms WHERE expires_at <= ?').bind(now)]);}
 async capacity(now){return (await this.db.prepare('SELECT count(*) AS total FROM game_rooms WHERE expires_at > ?').bind(now).first()).total<128;}
 async create(code,state,session,now){
  await this.db.batch([
   this.db.prepare('INSERT INTO game_rooms (code, state, revision, operation_id, expires_at, updated_at) VALUES (?, ?, 1, ?, ?, ?)').bind(code,state,secureToken(),now+180000,now),
   this.db.prepare('INSERT INTO game_sessions (token_hash, room_code, player_id, expires_at) VALUES (?, ?, ?, ?)').bind(session.hash,code,session.playerId,now+SESSION_TTL)
  ]);
 }
 async commit(record,state,room,now,session){
  const operation=secureToken(),revision=record.revision+1;
  const expiry=!room.players.length?now:now+(room.phase==='battle'?SESSION_TTL:room.phase==='finished'?3600000:180000);
  const statements=[this.db.prepare('UPDATE game_rooms SET state = ?, revision = ?, operation_id = ?, expires_at = ?, updated_at = ? WHERE code = ? AND revision = ?').bind(state,revision,operation,expiry,now,record.code,record.revision)];
  // The operation ID prevents an unsuccessful CAS from inserting a losing join's session.
  if(session)statements.push(this.db.prepare('INSERT INTO game_sessions (token_hash, room_code, player_id, expires_at) SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM game_rooms WHERE code = ? AND revision = ? AND operation_id = ?)').bind(session.hash,record.code,session.playerId,now+SESSION_TTL,record.code,revision,operation));
  const results=await this.db.batch(statements);return results[0].meta.changes===1;
 }
}

export class OnlineGameService{
 constructor(db,{now=()=>Date.now(),random=Math.random,repository}={}){this.repo=repository||new RoomRepository(db);this.now=now;this.random=random;}
 engine(now){return new globalThis.GRAIL_GAME.GameCore(DATA,{now:()=>now/1000,random:this.random,token:secureToken});}
 async create(body){
  const now=this.now();await this.repo.clean(now);if(!await this.repo.capacity(now))throw new ApiError('현재 방이 많습니다. 잠시 후 다시 시도해 주세요.',429,'ROOM_LIMIT');
  for(let i=0;i<12;i++){
   const game=this.engine(now);let result;
   try{result=game.create(body);}catch(e){throw new ApiError(e.message);}
   const room=game.room(result.code),player=room.players[0];
   try{await this.repo.create(room.code,serializeGame(game,room),{hash:await hash(result.key),playerId:player.id},now);return {...result,revision:1};}
   catch(e){if(!String(e.message).includes('game_rooms.code'))throw e;}
  }
  throw new ApiError('방 코드를 생성하지 못했습니다. 다시 시도해 주세요.',503,'CODE_BUSY');
 }
 async mutate(code,operation){
  for(let i=0;i<MAX_RETRIES;i++){
   const now=this.now(),record=await this.repo.room(code,now);
   if(!record)throw new ApiError('방이 종료되었거나 존재하지 않습니다.',404,'ROOM_NOT_FOUND');
   const {game,room}=restoreGame(record.state,{now:()=>now/1000,random:this.random,token:secureToken});
   game.tick(now/1000-.001);
   let output,error,session;
   try{({output,session}=await operation(game,room,now));}
   catch(e){error=e instanceof ApiError?e:new ApiError(e.message);}
   if(await this.repo.commit(record,serializeGame(game,room),room,now,session)){
    if(error)throw error;return {...output,revision:record.revision+1};
   }
  }
  throw new ApiError('동시에 처리 중인 행동이 많습니다. 잠시 후 다시 시도해 주세요.',503,'ROOM_BUSY');
 }
 async join(body){
  if(typeof body.code!=='string'||!/^\d{6}$/.test(body.code.trim()))throw new ApiError('6자리 방 코드를 입력해 주세요.');
  return this.mutate(body.code.trim(),async(game,room)=>{
   let result;try{result=game.join(body);}catch(e){throw new ApiError(e.message);}
   const auth=game.sessions.get(result.key);
   return {output:result,session:{hash:await hash(result.key),playerId:auth.id}};
  });
 }
 async state(key,body){
  if(!/^[a-f0-9]{48}$/.test(key||''))throw new ApiError('방에 다시 입장해 주세요.',401,'INVALID_SESSION');
  const session=await this.repo.session(await hash(key),this.now());
  if(!session)throw new ApiError('방 연결이 만료되었습니다. 다시 입장해 주세요.',401,'SESSION_EXPIRED');
  return this.mutate(session.room_code,(game,room)=>{
   if(!game.rooms.has(room.code)||!room.players.some(p=>p.id===session.player_id))throw new ApiError('현재 방에서 퇴장했습니다.',410,'PLAYER_LEFT');
   game.sessions.set(key,{id:session.player_id,code:room.code});
   const [,player]=game.auth(key);
   let receipt;
   if(body){
    if(typeof body.action!=='string'||typeof body.requestId!=='string'||!body.requestId||body.requestId.length>100)throw new ApiError('유효한 행동과 요청 ID가 필요합니다.');
    receipt=game.command(room,player,body);
   }
   return {output:{...game.snapshot(room,player),...(receipt?{receipt}:{})}};
  });
 }
 async handle(request){
  const url=new URL(request.url),path=url.pathname;
  try{
   if(!['/api/health','/api/create','/api/join','/api/state','/api/action'].includes(path))throw new ApiError('존재하지 않는 API입니다.',404,'NOT_FOUND');
   const expected=['/api/health','/api/state'].includes(path)?'GET':'POST';
   if(request.method!==expected)throw new ApiError('지원하지 않는 요청 방식입니다.',405,'METHOD_NOT_ALLOWED');
   if(path==='/api/health'){await this.repo.ready();return reply({ok:true,mode:'online-rooms',version:'0.14.0',storage:'persistent',maxPlayers:4});}
   let body;
   if(expected==='POST'){
    const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)throw new ApiError('같은 게임 주소에서 요청해 주세요.',403,'ORIGIN_MISMATCH');
    if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))throw new ApiError('JSON 요청이 필요합니다.',415,'CONTENT_TYPE');
    const reader=request.body?.getReader();const chunks=[];let size=0;
    if(reader){while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();throw new ApiError('요청이 너무 큽니다.',413,'BODY_TOO_LARGE');}chunks.push(value);}}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{throw new ApiError('요청 내용을 확인해 주세요.');}
    if(!body||typeof body!=='object'||Array.isArray(body))throw new ApiError('요청 내용을 확인해 주세요.');
   }
   if(path==='/api/create')return reply(await this.create(body));
   if(path==='/api/join')return reply(await this.join(body));
   const key=request.headers.get('Authorization')?.replace(/^Bearer /,'');
   return reply(await this.state(key,path==='/api/action'?body:null));
  }catch(e){
   if(e instanceof ApiError)return reply({error:e.message,code:e.code},e.status);
   // Storage details and SQL/session contents never go to browser clients or logs.
   return reply({error:'온라인 서버에 잠시 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',code:'SERVER_UNAVAILABLE'},503);
  }
 }
}
