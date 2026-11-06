import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('./dist/',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
function context({saveData=false}={}){
 const requests=[],images=[];
 class Image{constructor(){images.push(this);}set src(value){this.url=value;requests.push(value);}decode(){return Promise.resolve();}}
 const c=vm.createContext({window:{},Image,Promise,Map,Set,innerWidth:390,devicePixelRatio:1,navigator:{connection:{saveData}},setTimeout:()=>1,clearTimeout(){},profile:{character:'artoria'},GRAIL_GAME:{C:{artoria:{weapon:'long_sword'}}},DATA:{regions:[{id:1},{id:2},{id:22,restricted:true}]},front:'home',deploySelected:null,selectMapRegion(){},frontRender(){}});
 for(const name of ['region-art.js','item-art.js'])vm.runInContext(read(name),c);
 vm.runInContext('GRAIL_ITEM_ART=window.GRAIL_ITEM_ART',c);vm.runInContext(read('asset-loading.js'),c);
 return {c,requests,images};
}
test('selected-region warming is deduplicated, retryable and does not fetch the whole island',async()=>{
 const {c,requests,images}=context();vm.runInContext('selectMapRegion(1);selectMapRegion(1);selectMapRegion(22)',c);assert.equal(requests.length,1);assert.match(requests[0],/01-villas-v1.webp$/);assert.equal(images[0].srcset,undefined);assert.equal(images[0].fetchPriority,'high');images[0].onerror();await Promise.resolve();vm.runInContext('selectMapRegion(1)',c);assert.equal(requests.length,2);images[1].onload();await Promise.resolve();await Promise.resolve();
});
test('idle warming fetches only individual starting items and respects reduced-data preference',()=>{
 const normal=context();vm.runInContext('warmCommonItemArt()',normal.c);assert.equal(normal.requests.length,4);assert.ok(normal.requests.every(src=>src.startsWith('assets/items/detail/')&&src.endsWith('-v3.webp')));assert.equal(new Set(normal.requests).size,normal.requests.length);
 const reduced=context({saveData:true});vm.runInContext('warmCommonItemArt()',reduced.c);assert.equal(reduced.requests.length,0);
});
test('all original backgrounds and 212 native item crops exist without a low-resolution region candidate',()=>{
 const {c}=context();const sources=vm.runInContext('Object.values(window.REGION_ART).flatMap(a=>[a.src,a.preview])',c);assert.equal(sources.length,44);
 const items=vm.runInContext('Object.values(window.GRAIL_ITEM_ART).map(a=>a.src)',c);assert.equal(items.length,212);
 for(const src of [...sources,...items,'assets/lumia-island-painted-web-v4.webp','assets/lumia-island-hospital-web-v4.webp'])assert.ok(fs.statSync(new URL(src,root)).size>100,src);
 const html=vm.runInContext('regionScene(1)',c);assert.doesNotMatch(html,/srcset=|small.webp/);assert.match(html,/01-villas-v1.webp/);assert.match(html,/-preview.webp/);
});
