import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const {specs}=JSON.parse(fs.readFileSync(new URL('item-art-prompts.json',import.meta.url)));
const map={};
for(const s of specs) s.items.forEach((i,n)=>map[i.id]={sheet:s.name,cols:s.cols,rows:s.rows,x:n%s.cols,y:Math.floor(n/s.cols)});
// A separately generated replacement avoids the English magazine ambiguity.
map.magazine={sheet:'magazine',cols:1,rows:1,x:0,y:0};
fs.writeFileSync(new URL('dist/item-art.js',root),'/* Original illustrated inventory art. Grid order: reference/item-art-prompts.json. */\nwindow.GRAIL_ITEM_ART = '+JSON.stringify(map,null,1)+';\n');
console.log(`Mapped ${Object.keys(map).length} distinct inventory illustrations.`);
