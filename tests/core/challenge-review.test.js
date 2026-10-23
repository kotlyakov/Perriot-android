import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {CHALLENGES} from '../../src/content/challenges.js';
import {session} from '../../src/core/apk-shop.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {createShop} from '../../src/core/shop.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';

const start=(id,seed='REVIEW')=>createRun(seed,{runId:'challenge-review',money:4n,challengeId:id});
const act=(state,type,extra={})=>{const result=dispatch(state,{type,expectedRevision:state.revision,...extra});assert.equal(result.error,null,JSON.stringify(result.error));return result.state;};

test('initial challenge voucher cannot select a banned or already granted voucher',()=>{
 for(const [id,seed] of [['omelette','R45'],['inflation','R64'],['fragile','R16'],['blast_off','R25'],['golden_needle','R25']]){
  const state=start(id,seed),challenge=CHALLENGES.find(c=>c.id===id);
  assert.ok(!challenge.bannedCentreIds?.includes(state.apkShop.voucherId),`${id}: ${state.apkShop.voucherId} is banned`);
  assert.ok(!challenge.startingVouchers?.includes(state.apkShop.voucherId),`${id}: voucher already granted`);
 }
});

for(const [type,key,lane]of [['BUY_VOUCHER','v_overstock_norm','vouchers'],['OPEN_BOOSTER','p_celestial_normal_1','boosters']])test(`Inflation increments after ${type}`,()=>{
 let state=start('inflation');state.phase='shop';state.money=100n;
 const constructor=session(state.rng.apk,currentApkShopContext(state));
 const offer=constructor.construct(key,'review_purchase',{materialize:true});
 state.rng.apk=constructor.rng;state.shop=createShop({offers:{main:[],vouchers:[],boosters:[],[lane]:[offer]}});
 const next=act(state,type,{offerId:offer.id});
 assert.equal(next.apkShop.context.inflation,1);
});

test('all challenges survive a complete small blind and start the next blind after repeated resume',()=>{
 for(const {id} of CHALLENGES){
  let state=start(id,'SMOKE');
  // A legal pre-action hand-level setup makes this a lifecycle test, not a strategy test.
  for(const key of Object.keys(state.handLevels))state.handLevels[key]=10000;
  for(const type of ['START_BLIND','PLAY_HAND','CASH_OUT','LEAVE_SHOP','START_BLIND']){
   state=act(state,type,type==='PLAY_HAND'?{cardIds:state.hand.slice(0,5)}:{});
   const restored=deserializeState(serializeState(state));assert.deepEqual(restored,state,`${id}: ${type}`);state=restored;
  }
  assert.equal(state.round.blindId,'big',id);assert.equal(state.phase,'playing',id);
 }
});
