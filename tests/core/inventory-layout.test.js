import test from 'node:test';
import assert from 'node:assert/strict';
import {ownedJokerLayout} from '../../src/ui/shop-screen.js';
import {LAYOUT} from '../../src/ui/layout.js';

test('every owned Joker stays in its dedicated top region as the row grows',()=>{
 const [left,,width]=LAYOUT.joker_region_inferred;
 for(const count of [1,2,3,4,5,6,10,25,100]){
  const {start,step}=ownedJokerLayout(count);
  assert.ok(start>=left,`${count} cards cross the HUD`);
  assert.ok(start+(count-1)*step+104<=left+width,`${count} cards cross consumables`);
  if(count>5)assert.ok(step<ownedJokerLayout(5).step,'large inventories compress spacing');
 }
});
