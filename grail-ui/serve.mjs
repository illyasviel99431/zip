import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GameService} from './game-server.mjs';
const game=new GameService();
const timer=setInterval(()=>game.tick(game.now()-.001),100);
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
 if(await game.handle(req,res))return;
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end('Not found');return;}const versionedImage=/-v\d+(-small|-preview)?\.(webp|png|svg)$/.test(file),headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':versionedImage?'private, max-age=31536000, immutable':'no-cache'};res.writeHead(200,headers);res.end(data);});
});
server.listen(Number(process.env.PORT||4173),process.env.HOST||'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${server.address().port}`));
server.on('close',()=>clearInterval(timer));
