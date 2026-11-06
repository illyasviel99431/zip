// Standard web export only: preserve the generated composition and dimensions.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(process.env.REGION_ART_SHARP||'sharp');
const [source,id,slug]=process.argv.slice(2);
if(!source||!/^\d+$/.test(id)||!/^[a-z-]+$/.test(slug))throw Error('Expected source, numeric region ID and slug');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.join(root,'dist/assets/regions',`${id.padStart(2,'0')}-${slug}-v1.webp`);
await fs.mkdir(path.dirname(target),{recursive:true});
try{await fs.access(target);throw Error('Refusing to overwrite existing art: '+target);}catch(e){if(e.code!=='ENOENT')throw e;}
const info=await sharp(source).webp({quality:88,effort:6}).toFile(target);
console.log(JSON.stringify({id:Number(id),slug,source,asset:`assets/regions/${path.basename(target)}`,width:info.width,height:info.height,bytes:info.size}));
