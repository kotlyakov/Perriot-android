import test from 'node:test';import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {nativeBlindTarget} from '../../src/core/blind-progression.js';
import {CHALLENGES} from '../../src/content/challenges.js';
import {session} from '../../src/core/apk-shop.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const act=(s,type,fields={})=>dispatch(s,{type,expectedRevision:s.revision,...fields});
const reload=s=>deserializeState(serializeState(s));
test('a charm reward in challenge history saves with the actual UI blindId',()=>{
 for(const {id}of CHALLENGES){
  let state=createRun('13031990',{runId:'charm-'+id,money:100n,referenceRng:true,referenceShop:true,challengeId:id});state.apkBlinds.tags.small=state.apkBlinds.tags.big='tag_charm';
  const skip=act(state,'SKIP_BLIND',{blindId:'small'});assert.equal(skip.error,null,id);assert.equal(skip.state.phase,'pack');assert.deepEqual(reload(skip.state),skip.state,id);
  const next=act(skip.state,'SKIP_PACK');assert.equal(next.error,null);assert.equal(next.state.round.blindId,'big');assert.deepEqual(reload(next.state),next.state);
  const second=act(next.state,'SKIP_BLIND',{blindId:'big'});assert.equal(second.error,null,id);assert.equal(second.state.phase,'pack');assert.equal(second.state.round.blindId,'boss');assert.deepEqual(reload(second.state),second.state);
 }
});
test('all five free pack rewards open despite full slots, then can be skipped',()=>{
 for(const tag of ['tag_charm','tag_meteor','tag_standard','tag_buffoon','tag_ethereal']){
  const state=createRun('13031990',{runId:tag,money:0n,referenceRng:true,referenceShop:true}),gen=session(state.rng.apk,currentApkShopContext(state));
  state.round.ante=state.apkBlinds.ante=state.apkBlinds.tagContext.ante=2;state.round.target=nativeBlindTarget(2);
  state.jokers=Array.from({length:5},(_,i)=>gen.construct('j_joker','owned-j'+i));state.consumables=Array.from({length:2},(_,i)=>gen.construct('c_pluto','owned-c'+i));state.rng.apk=gen.rng;state.apkShop.context=currentApkShopContext(state);state.apkBlinds.tags.small=tag;
  const r=act(state,'SKIP_BLIND',{blindId:'small'});assert.equal(r.error,null,tag);assert.equal(r.state.phase,'pack');assert.equal(r.state.money,state.money);assert.deepEqual(reload(r.state),r.state);
  if(tag==='tag_buffoon'){
   const card=r.state.packState.cards[0],rejected=act(r.state,'USE_PACK_CARD',{cardId:card.id});assert.match(rejected.error.message,/Нет места для Джокера/);assert.strictEqual(rejected.state,r.state);
   const sold=act(r.state,'SELL_OWNED_CARD',{area:'jokers',cardId:r.state.jokers[0].id});assert.equal(sold.error,null);
   const taken=act(sold.state,'USE_PACK_CARD',{cardId:card.id});assert.equal(taken.error,null);assert.ok(taken.state.jokers.some(j=>j.id===card.id));assert.deepEqual(reload(taken.state),taken.state);
  }
  const closed=act(r.state,'SKIP_PACK');assert.equal(closed.error,null);assert.equal(closed.state.phase,'blind_selection');assert.equal(closed.state.round.blindId,'big');
 }
});
