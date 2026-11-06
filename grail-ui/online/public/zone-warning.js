/* Presentation state only. Region closures and elimination remain game rules. */
(function(root){
 root.GRAIL_ZONE_NOTICE={
  get({current,closed=[],upcoming=null,elapsed=0,dead=false,preview=null}){
   const demo=preview==='closed'||preview==='imminent';
   const ids=preview==='imminent'?[current]:(upcoming?.ids||[]);
   const seconds=preview==='imminent'?30:Number.isFinite(upcoming?.t)?Math.max(0,Math.ceil(upcoming.t-elapsed)):null;
   if(closed.includes(current)||preview==='closed')return {kind:'closed',danger:true,seconds:null,ids:[current],dead,demo};
   if(!dead&&seconds!==null&&seconds<=30&&ids.includes(current))return {kind:'imminent',danger:true,seconds,ids:[current],dead:false,demo};
   if(elapsed>=660)return {kind:'overload',danger:false,seconds:null,ids:[],dead,demo:false};
   if(seconds!==null&&seconds<=30&&ids.length)return {kind:'scheduled',danger:false,seconds,ids,dead,demo:false};
   return {kind:'none',danger:false,seconds:null,ids:[],dead,demo:false};
  }
 };
})(globalThis);
