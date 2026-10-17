import test from 'node:test';
import assert from 'node:assert/strict';
import {shopMoneyFontSize} from '../../src/ui/shop-screen.js';

test('shop prices retain full bigint precision and fit the measured plaque',()=>{
 assert.equal(shopMoneyFontSize(4n,56),27);
 const amount=123456789012345678901234567890n;
 const size=shopMoneyFontSize(amount,56);
 assert.ok(size>0&&size<27);
 assert.ok(size*(String(amount).length+1)*.66<=56+.000001);
 assert.equal(shopMoneyFontSize(amount,112),size*2);
});
