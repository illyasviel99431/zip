import fs from 'node:fs';
const file='grail-ui/dist/app.js';let src=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
for(const [start,end] of [
 ['function render(){','function itemStat(item){'],
 ['function renderPanel(){','function quickMarkup(resource,key){'],
 ['function updateHud(){','function gainXp(amount){'],
 ['function itemDialog(index){','function useFood(index){'],
 ['function recipeDialog(id){','function craft(id){'],
 ["function showModal(title,body,type='info'){",'function characterDialog(){'],
 ['function helpDialog(){','let previousTick=clock(),hadEncounter=false;']
]){const a=src.indexOf(start),b=src.indexOf(end,a);if(a<0||b<0)throw new Error('Missing range '+start);src=src.slice(0,a)+src.slice(b);}
src=src.replace('selected:null};','selected:null,guideHistory:[],guideId:null,mapFocus:null,ground:{}};');
src=src.replace("updateHud();if($('#np-button').disabled)return;", "updateHud();if(!$('#np-button')||$('#np-button').disabled)return;");
src=src.replace("if(!running())return;if(state.busy)","if(!running()||currentEncounter())return;if(state.busy)");
src=src.replace("log('사역 계약 성립. 숲에서 탐색을 시작합니다.','system');","hadEncounter=false;\n log('사역 계약 성립. 숲에서 탐색을 시작합니다.','system');");
src=src.replace(/\nstart\(\);\s*$/, '\n');
fs.writeFileSync(file,src);
const html='grail-ui/dist/index.html';fs.writeFileSync(html,fs.readFileSync(html,'utf8').replace('<script src="app.js"></script>','<script src="app.js"></script>\n  <script src="interface.js"></script>'));
