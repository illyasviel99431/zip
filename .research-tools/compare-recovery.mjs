import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const source=await fs.readFile('.research-tools/define-game-system.mjs','utf8');
const generated=new Map();
const proxy={readFile:(p,...args)=>fs.readFile(p,...args),writeFile:async(p,value)=>generated.set(path.basename(p),Buffer.from(value,'utf8'))};
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
await new AsyncFunction('fs',source.replace(/^import fs from 'node:fs\/promises';\s*/,''))(proxy);
const downloads='C:/Users/sprig/Downloads';
const folders=(await fs.readdir(downloads,{withFileTypes:true})).filter(x=>x.isDirectory()&&x.name.includes('2026-11-01'));
const names=['서번트_캐릭터_10종_관리표.txt','성배전쟁_공통_게임_규칙_v0.2.txt','알트리아_펜드래곤_캐릭터_성능_설계서_v2.2.txt'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const name of names){
 let found;
 for(const folder of folders){const p=path.join(downloads,folder.name,name);try{found={path:p,bytes:await fs.readFile(p)};break;}catch(e){if(e.code!=='ENOENT')throw e;}}
 if(!found){console.log(JSON.stringify({name,found:false}));continue;}
 const expected=generated.get(name),actual=found.bytes;
 const normalized=b=>b.toString('utf8').replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
 const equalText=normalized(actual)===normalized(expected);
 const result={name,path:found.path,bytes:actual.length,generatedBytes:expected.length,byteIdentical:actual.equals(expected),textIdenticalIgnoringBomAndLineEndings:equalText,actualSha256:hash(actual),generatedSha256:hash(expected),version:actual.toString('utf8').match(/문서 버전[^\r\n]*/)?.[0]};
 if(!equalText){const a=normalized(actual).split('\n'),b=normalized(expected).split('\n');const i=a.findIndex((line,i)=>line!==b[i]);result.firstDifference={line:i+1,attached:a[i],generated:b[i]};}
 console.log(JSON.stringify(result));
}
