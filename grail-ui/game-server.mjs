import {randomBytes} from 'node:crypto';
import fs from 'node:fs';
import './dist/world-rules.js';
import './dist/combat-rules.js';
import './dist/game-core.js';
const DATA=JSON.parse(fs.readFileSync(new URL('./dist/items.json',import.meta.url)));
export class GameService extends globalThis.GRAIL_GAME.GameCore {
 constructor(options={}){super(DATA,{token:()=>randomBytes(24).toString('hex'),...options});}
 async handle(req,res){
  if(!req.url.startsWith('/api/'))return false;
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
  try{
   if(req.method==='GET'&&req.url==='/api/health'){res.end(JSON.stringify({ok:true,mode:'private-rooms',version:'0.13.0'}));return true;}
   let body={};if(req.method==='POST'){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>8192)throw Error('요청이 너무 큽니다.');}body=JSON.parse(raw||'{}');}
   const url=new URL(req.url,'http://localhost');
   if(req.method==='POST'&&!['/api/create','/api/join','/api/action'].includes(url.pathname))throw Error('잘못된 요청입니다.');
   if(req.method==='POST'&&req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw Error('같은 주소에서 요청해 주세요.');
   if(url.pathname==='/api/create'&&req.method==='POST')res.end(JSON.stringify(this.create(body)));
   else if(url.pathname==='/api/join'&&req.method==='POST')res.end(JSON.stringify(this.join(body)));
   else {
    // Requests in the current millisecond share a damage batch.
    this.tick(this.now()-.001);
    const [r,p]=this.auth(req.headers.authorization?.replace('Bearer ',''));
    if(url.pathname==='/api/action'&&req.method==='POST'){
     if(typeof body.requestId!=='string'||!body.requestId)throw Error('행동 요청 ID가 필요합니다.');
     const receipt=this.command(r,p,body);res.end(JSON.stringify({...this.snapshot(r,p),receipt}));return true;
    }else if(url.pathname!=='/api/state'||req.method!=='GET')throw Error('잘못된 요청입니다.');
    res.end(JSON.stringify(this.snapshot(r,p)));
   }
  }catch(e){res.statusCode=400;res.end(JSON.stringify({error:e.message}));}
  return true;
 }
}
