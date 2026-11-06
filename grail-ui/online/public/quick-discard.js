/* Resolve the item under the pointer at key-down, including after a server repaint. */
let bagPointer=null;
document.addEventListener('pointermove',event=>{bagPointer={x:event.clientX,y:event.clientY};},{passive:true});
document.addEventListener('pointerout',event=>{if(!event.relatedTarget)bagPointer=null;},{passive:true});
window.addEventListener('blur',()=>{bagPointer=null;});
document.addEventListener('keydown',event=>{
 if(event.key.toLowerCase()!=='v'||event.ctrlKey||event.altKey||event.metaKey)return;
 if(window.frontScreen||!state||state.dead||state.finished||document.querySelector('dialog[open]'))return;
 if(['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)||event.target.isContentEditable||!bagPointer)return;
 const slot=document.elementFromPoint(bagPointer.x,bagPointer.y)?.closest('.bag-slot[data-action="item"]');
 if(!slot||!slot.closest('#panel'))return;
 event.preventDefault();event.stopImmediatePropagation();if(event.repeat)return;
 const index=Number(slot.dataset.slot);if(!state.bag[index])return;
 if(window.roomConnected)void send('discard',{slot:index});else discardItem(index);
},true);
