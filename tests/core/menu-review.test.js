import test from 'node:test';import assert from 'node:assert/strict';
import {handInfoRows,runInfoTabs} from '../../src/ui/menu-windows.js';
test('run menu shows actual hand levels/base scores and only discovered hands',()=>{
 const state={discoveredHands:['high_card','flush'],handLevels:{high_card:1,flush:3},stake:1};
 assert.deepEqual(handInfoRows(state).map(r=>[r.id,r.level,r.chips,r.mult]),[['flush',3,65,8],['high_card',1,5,1]]);
 assert.deepEqual(runInfoTabs(state).map(t=>t[0]),['hands','blinds','vouchers']);assert.equal(runInfoTabs({...state,stake:8}).at(-1)[0],'stake');
});
