import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {createShop} from '../../src/core/shop.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
function run(){return createRun('ITEM7-INTEGRATION',{runId:'item7',money:4n,referenceRng:true,referenceShop:true});}
function buy(state,key,cost=4n){state.phase='shop';state.shop=createShop({offers:{main:[{id:'offer-'+key,entityId:key,originalKey:key,set:'Joker',edition:'base',cost,sellCost:cost/2n}],vouchers:[],boosters:[]}});return dispatch(state,{type:'BUY_SHOP_CARD',offerId:'offer-'+key,expectedRevision:state.revision});}
test('item7 mutable Joker acquisition initializes counters and saves exact state',()=>{
 const state=run();const result=buy(state,'j_runner');assert.equal(result.error,null);assert.equal(result.state.jokers[0].chips,0);
 // A fresh blind-selection save has no fabricated payout/shop history.
 const next=result.state;next.phase='blind_selection';next.shop=null;next.apkShop.context.usedCentreIds=['j_runner'];
 assert.deepEqual(deserializeState(serializeState(next)),next);
});
test('Credit Card buying/selling updates native bankruptcy floor atomically',()=>{
 const result=buy(run(),'j_credit_card');assert.equal(result.error,null);assert.equal(result.state.bankruptAt,-20n);
 const next=result.state;const sold=dispatch(next,{type:'SELL_OWNED_CARD',area:'jokers',cardId:next.jokers[0].id,expectedRevision:next.revision});assert.equal(sold.error,null);assert.equal(sold.state.bankruptAt,0n);
});
test('Juggler acquisition and removal adjust hand size without changing baseline',()=>{
 const state=run(),result=buy(state,'j_juggler');assert.equal(result.error,null);assert.equal(result.state.round.handSize,9);assert.equal(state.round.handSize,8);
 const sold=dispatch(result.state,{type:'SELL_OWNED_CARD',area:'jokers',cardId:result.state.jokers[0].id,expectedRevision:result.state.revision});assert.equal(sold.error,null);assert.equal(sold.state.round.handSize,8);
});
