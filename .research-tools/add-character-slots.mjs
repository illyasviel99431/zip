import fs from 'node:fs';
function replaceOnce(text,from,to){if(!text.includes(from))throw new Error('Expected source missing: '+from.slice(0,80));return text.replace(from,to);}
const ui='grail-ui/dist/interface.js';let view=fs.readFileSync(ui,'utf8');
view=replaceOnce(view,'<section class="self-card"><button class="self-identity','<section class="self-card"><div class="self-hero">${characterArtwork(state.character,\'self\')}<button class="self-identity');
view=replaceOnce(view,'</div></button>${resourceMarkup()}','</div></button></div>${resourceMarkup()}');
view=view.replaceAll('UI PROTOTYPE 02','UI PROTOTYPE 03').replaceAll('INTERFACE STUDY 02','INTERFACE STUDY 03');
const errorHandler=`document.addEventListener('error',event=>{\n if(!(event.target instanceof HTMLImageElement)||!event.target.classList.contains('art-image'))return;\n const frame=event.target.closest('.character-art');if(frame){frame.classList.remove('has-art');frame.classList.add('is-empty');}\n},true);\n`;
view=replaceOnce(view,'\nstart();', '\n'+errorHandler+'start();');fs.writeFileSync(ui,view);
const engine='grail-ui/dist/app.js';let app=fs.readFileSync(engine,'utf8');
const encounter=` if(e?.kind==='player'){\n  const c=CHARACTERS[e.character];\n  stage.innerHTML=\`<div class="event-card servant-encounter">\${characterArtwork(e.character,'encounter')}<div class="encounter-info"><div class="event-type">SERVANT ENCOUNTER</div><div class="nickname">\${esc(e.nickname)} · \${c.class}</div><h2>\${c.full}</h2><div class="enemy-health"><div class="resource-label"><span>HP</span><span id="enemy-percent">\${Math.ceil(e.hp/e.maxHp*100)}%</span></div><div class="bar"><i style="--width:\${e.hp/e.maxHp*100}%"></i></div></div><div class="enemy-info">主무기 · \${esc(ITEMS[e.weapon].name)}</div><div id="enemy-mark">\${remaining(e.markUntil)>0?\`<span class="debuff">마력 간섭 <span id="mark-time">\${remaining(e.markUntil).toFixed(1)}초</span></span>\`:''}</div><div class="encounter-time">기척 유지 <span id="encounter-time">\${remaining(state.encounterUntil).toFixed(1)}</span>초</div></div></div>\`;return;\n }\n`;
app=replaceOnce(app,' if(e){stage.innerHTML=',encounter.replace('主무기','주무기')+' if(e){stage.innerHTML=');
app=replaceOnce(app,'${icon(c.icon)}<div class="caps">${c.class}</div><strong>','${characterArtwork(id,\'selection\')}<div class="caps">${c.class}</div><strong>');
fs.writeFileSync(engine,app);
const html='grail-ui/dist/index.html';let page=fs.readFileSync(html,'utf8');page=replaceOnce(page,'<script src="app.js"></script>','<script src="character-art.js"></script>\n  <script src="app.js"></script>');page=replaceOnce(page,'<link rel="stylesheet" href="interface.css">','<link rel="stylesheet" href="interface.css">\n  <link rel="stylesheet" href="character-art.css">');fs.writeFileSync(html,page);
