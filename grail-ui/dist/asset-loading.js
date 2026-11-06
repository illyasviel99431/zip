/* Warm only chosen destinations and the current character's common item sheets. */
const artWarmups=new Map();
function warmGameImage(src,priority='low'){
 const key=src;
 if(artWarmups.has(key))return artWarmups.get(key);
 const image=new Image();image.decoding='async';image.fetchPriority=priority;
 const ready=new Promise(resolve=>{
  image.onload=()=>{const decoded=typeof image.decode==='function'?image.decode():Promise.resolve();decoded.catch(()=>{}).then(()=>resolve(true));};
  image.onerror=()=>{artWarmups.delete(key);resolve(false);};
 });
 artWarmups.set(key,ready);image.src=src;
 return ready;
}
function warmRegionArt(id){const art=window.REGION_ART?.[id];if(!art)return;return warmGameImage(art.src,'high');}
function warmCommonItemArt(){
 if(navigator.connection?.saveData)return;
 const characterId=typeof profile!=='undefined'?profile.character:'artoria';
 const ids=['bread','water','fabric_armor',GRAIL_GAME.C[characterId]?.weapon];
 const sources=new Set(ids.map(id=>window.GRAIL_ITEM_ART?.[id]?.src).filter(Boolean));
 for(const src of sources)warmGameImage(src);
}
const beforeArtSelectRegion=selectMapRegion,beforeArtFrontRender=frontRender;
selectMapRegion=function(id){if(DATA.regions.some(r=>r.id===id&&!r.restricted))warmRegionArt(id);return beforeArtSelectRegion(id);};
frontRender=function(){beforeArtFrontRender();if(front==='deployment'&&deploySelected)warmRegionArt(deploySelected);if(front==='home'||front==='deployment')scheduleCommonArt();};
let artWarmupTimer;
function scheduleCommonArt(){clearTimeout(artWarmupTimer);artWarmupTimer=setTimeout(warmCommonItemArt,250);}
scheduleCommonArt();
