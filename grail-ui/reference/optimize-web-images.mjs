// Preserve artwork pixels; split item sheets so visible icons do not fetch an entire atlas.
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(process.env.REGION_ART_SHARP||'sharp');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.join(root,'dist'),rows=[];
async function writeVersion(relative,data){
 const output=path.join(dist,relative);await fs.mkdir(path.dirname(output),{recursive:true});
 try{const previous=await fs.readFile(output);if(!previous.equals(data))throw Error('Choose a new asset version before changing '+relative);}catch(e){if(e.code!=='ENOENT')throw e;await fs.writeFile(output,data);}
}
async function lossless(source,relative,crop){
 const input=path.join(dist,source);let image=sharp(input);if(crop)image=image.extract(crop);
 const {data,info}=await image.webp({lossless:true,effort:6}).toBuffer({resolveWithObject:true});
 const original=await (crop?sharp(input).extract(crop):sharp(input)).ensureAlpha().raw().toBuffer();
 const decoded=await sharp(data).ensureAlpha().raw().toBuffer();
 if(!original.equals(decoded))throw Error('Lossless pixel validation failed: '+relative);
 await writeVersion(relative,data);
 return {src:relative,width:info.width,height:info.height,bytes:data.length,pixelExact:true};
}
for(const name of (await fs.readdir(path.join(dist,'assets/regions'))).filter(n=>/-v1\.webp$/.test(n)).sort()){
 const source='assets/regions/'+name,meta=await sharp(path.join(dist,source)).metadata(),bytes=(await fs.stat(path.join(dist,source))).size;
 rows.push({kind:'region',source,src:source,width:meta.width,height:meta.height,bytes,pixelExact:true,preview:source.replace('-v1.webp','-v2-preview.webp')});
}
const sandbox={window:{}};vm.runInNewContext(await fs.readFile(path.join(dist,'item-art.js'),'utf8'),sandbox);
const itemArt=sandbox.window.GRAIL_ITEM_ART;
for(const [id,art] of Object.entries(itemArt)){
 const source='assets/items/'+art.sheet+'-v1.png',meta=await sharp(path.join(dist,source)).metadata();
 const left=Math.floor(art.x*meta.width/art.cols),top=Math.floor(art.y*meta.height/art.rows);
 const crop={left,top,width:Math.min(meta.width,Math.ceil((art.x+1)*meta.width/art.cols))-left,height:Math.min(meta.height,Math.ceil((art.y+1)*meta.height/art.rows))-top};
 const output=await lossless(source,'assets/items/detail/'+id+'-v3.webp',crop);
 Object.assign(art,{src:output.src,width:output.width,height:output.height});
 rows.push({kind:'item',id,source,crop,...output});
}
await fs.writeFile(path.join(dist,'item-art.js'),'/* Native-resolution, lossless crops from original item sheets. */\nwindow.GRAIL_ITEM_ART = '+JSON.stringify(itemArt,null,1)+';\n');
for(const source of ['assets/lumia-island-painted-v1.png','assets/lumia-island-hospital-v2.png']){
 const relative=source.replace(/-v\d+\.png$/,'-web-v4.webp');
 rows.push({kind:'map',source,before:(await fs.stat(path.join(dist,source))).size,...await lossless(source,relative)});
}
const totals=Object.fromEntries(['region','item','map'].map(kind=>{const group=rows.filter(r=>r.kind===kind);return [kind,{count:group.length,bytes:group.reduce((n,r)=>n+r.bytes,0),pixelExact:group.every(r=>r.pixelExact)}];}));
const common=['bread','water','fabric_armor','short_spear'];
totals.initialItemBytes=rows.filter(r=>r.kind==='item'&&common.includes(r.id)).reduce((n,r)=>n+r.bytes,0);
await fs.writeFile(path.join(root,'reference/web-image-manifest.json'),JSON.stringify({version:2,policy:'Original region images; native-resolution lossless maps and individual items; no small-region source.',totals,assets:rows},null,2)+'\n');
console.log(JSON.stringify(totals));
