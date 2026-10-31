import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {session} from '../../src/core/apk-shop.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';

function fixture(key='c_pluto'){
 const state=createRun('BUYUSE',{runId:'buy-use',money:20n,referenceRng:true,referenceShop:true});
 state.phase='shop';state.round.score=state.round.target;const gen=session(state.rng.apk,currentApkShopContext(state));
 const offer=gen.construct(key,'buy-use-offer');offer.cost=3n;
 state.shop={main:[offer],vouchers:[],boosters:[],rerollBase:5n,rerollIncrease:0n,freeRerolls:0};state.rng.apk=gen.rng;
 state.consumables=['c_mercury','c_mars'].map((id,i)=>gen.construct(id,'owned-'+i));state.rng.apk=gen.rng;
 state.apkShop.context=currentApkShopContext(state);return state;
}
test('buy and use consumes a planet atomically even when consumable slots are full',()=>{
 const state=fixture(),before=structuredClone(state),r=dispatch(state,{type:'BUY_AND_USE_SHOP_CARD',offerId:'buy-use-offer',targetCardIds:[],expectedRevision:state.revision});
 assert.equal(r.error,null);assert.deepEqual(state,before);assert.equal(r.state.money,17n);assert.equal(r.state.handLevels.high_card,state.handLevels.high_card+1);assert.equal(r.state.shop.main.length,0);assert.deepEqual(r.state.consumables,state.consumables);assert.equal(r.state.revision,state.revision+1);
 const loaded=deserializeState(serializeState(r.state));assert.equal(loaded.handLevels.high_card,r.state.handLevels.high_card);
 const again=dispatch(r.state,{type:'BUY_AND_USE_SHOP_CARD',offerId:'buy-use-offer',expectedRevision:state.revision});assert.ok(again.error);assert.strictEqual(again.state,r.state);
});
test('failed immediate use never charges or removes an offer',()=>{
 const state=fixture('c_strength'),before=structuredClone(state);const r=dispatch(state,{type:'BUY_AND_USE_SHOP_CARD',offerId:'buy-use-offer',targetCardIds:[],expectedRevision:state.revision});
 assert.equal(r.error.code,'INVALID_TARGETS');assert.strictEqual(r.state,state);assert.deepEqual(state,before);
});
test('buy and use cannot pay for a generator with no room, or for an unaffordable card',()=>{
 const state=fixture('c_emperor'),before=structuredClone(state);const r=dispatch(state,{type:'BUY_AND_USE_SHOP_CARD',offerId:'buy-use-offer',targetCardIds:[],expectedRevision:state.revision});assert.ok(r.error);assert.deepEqual(state,before);
 const poor=fixture();poor.money=0n;const outcome=dispatch(poor,{type:'BUY_AND_USE_SHOP_CARD',offerId:'buy-use-offer',expectedRevision:poor.revision});assert.equal(outcome.error.code,'INSUFFICIENT_FUNDS');assert.strictEqual(outcome.state,poor);
});
test('spectral immediate use retains effect replay and roundtrips',()=>{
 const state=fixture('c_black_hole'),r=dispatch(state,{type:'BUY_AND_USE_SHOP_CARD',offerId:'buy-use-offer',targetCardIds:[],expectedRevision:state.revision});assert.equal(r.error,null);assert.ok(r.state.effectReplay);assert.doesNotThrow(()=>deserializeState(serializeState(r.state)));
});
