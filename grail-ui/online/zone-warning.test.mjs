import test from 'node:test';
import assert from 'node:assert/strict';
import './public/zone-warning.js';
const notice=globalThis.GRAIL_ZONE_NOTICE.get;
test('only players in the upcoming region receive the red imminent warning',()=>{
 assert.equal(notice({current:5,upcoming:{t:180,ids:[5,7]},elapsed:149}).kind,'none');
 const own=notice({current:5,upcoming:{t:180,ids:[5,7]},elapsed:150});
 assert.equal(own.kind,'imminent');assert.equal(own.seconds,30);assert.equal(own.danger,true);
 assert.equal(notice({current:8,upcoming:{t:180,ids:[5,7]},elapsed:150}).kind,'scheduled');
});
test('a closed current region takes priority over overload and later closures',()=>{
 const closed=notice({current:5,closed:[5,22],upcoming:{t:900,ids:[7]},elapsed:700});
 assert.equal(closed.kind,'closed');assert.equal(closed.danger,true);assert.equal(closed.seconds,null);
});
test('moving to a safe region clears the red warning',()=>{
 assert.equal(notice({current:8,closed:[5,22],elapsed:181}).danger,false);
 assert.equal(notice({current:8,closed:[5,22],elapsed:700}).kind,'overload');
});
test('countdown rounds up and never becomes negative while waiting for the server',()=>{
 assert.equal(notice({current:5,upcoming:{t:180,ids:[5]},elapsed:179.1}).seconds,1);
 assert.equal(notice({current:5,upcoming:{t:180,ids:[5]},elapsed:180.2}).seconds,0);
});
test('dead players are not told to escape an imminent closure',()=>{
 assert.equal(notice({current:5,upcoming:{t:180,ids:[5]},elapsed:160,dead:true}).danger,false);
 const dead=notice({current:5,closed:[5],dead:true});assert.equal(dead.dead,true);assert.equal(dead.kind,'closed');
});
test('UI previews are explicit and never mutate the actual closure arrays',()=>{
 const closed=[22],upcoming={t:180,ids:[7]};
 const result=notice({current:5,closed,upcoming,elapsed:0,preview:'closed'});
 assert.equal(result.kind,'closed');assert.equal(result.demo,true);assert.deepEqual(closed,[22]);assert.deepEqual(upcoming.ids,[7]);
});
