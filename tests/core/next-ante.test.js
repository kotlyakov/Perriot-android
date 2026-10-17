import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {blindBase} from '../../src/core/blind-progression.js';
const act=(s,type)=>dispatch(s,{type,expectedRevision:s.revision});
test('accepted legacy ante-three selection can render its blind base',()=>{
 const s=createRun('legacy',{runId:'legacy3',money:4n});s.round.ante=3;s.round.target=2000n;
 const restored=deserializeState(serializeState(s));assert.equal(blindBase(restored.round.ante),2000n);
});
function wonBoss(deckId='red'){
 const s=createRun('AAAAAAA1',{runId:'ante2',deckId,money:4n,referenceRng:true,referenceShop:true});
 s.round.blindId='boss';s.round.target=600n;
 const active=act(s,'START_BLIND').state;active.phase='round_won';active.round.score=600n;return active;
}
test('boss cashout persists next ante selection; leaving starts ante two without another payout',()=>{
 const won=wonBoss(),shop=act(won,'CASH_OUT').state;
 assert.equal(shop.nextAnteBlinds?.ante,2);
 assert.equal(shop.nextAnteBlinds.bossesUsed[won.apkBlinds.bossId],1);
 assert.deepEqual(deserializeState(serializeState(shop)),shop);
 const before=structuredClone(shop),r=act(shop,'LEAVE_SHOP');assert.equal(r.error,null);
 assert.equal(r.state.round.ante,2);assert.equal(r.state.round.blindId,'small');assert.equal(r.state.round.target,800n);
 assert.equal(r.state.money,shop.money);assert.equal(r.state.apkShop.voucherId,shop.apkShop.voucherId);
 assert.deepEqual(r.state.apkBlinds.playedCardIds,[]);assert.equal(r.state.nextAnteBlinds,undefined);
 assert.deepEqual(shop,before);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
 assert.deepEqual(act(deserializeState(serializeState(shop)),'LEAVE_SHOP'),r);
 assert.equal(act(r.state,'LEAVE_SHOP').error.code,'INVALID_PHASE');
 const started=act(r.state,'START_BLIND');assert.equal(started.error,null);assert.equal(started.state.roundNumber,4);
 assert.ok(started.state.rng.apk.streams.nr2);assert.deepEqual(deserializeState(serializeState(started.state)),started.state);
});
test('ante two small to big preserves ownership, voucher, RNG and deck counters',()=>{
 for(const deckId of ['red','blue']){
  let s=act(act(wonBoss(deckId),'CASH_OUT').state,'LEAVE_SHOP').state;
  assert.equal(s.round.ante,2);s=act(s,'START_BLIND').state;s.phase='round_won';s.round.score=800n;
  const shop=act(s,'CASH_OUT').state,r=act(shop,'LEAVE_SHOP');assert.equal(r.error,null);
  assert.equal(r.state.round.target,1200n);assert.equal(r.state.round.blindId,'big');assert.deepEqual(r.state.rng,shop.rng);
  assert.equal(r.state.round.handsRemaining,deckId==='blue'?5:4);assert.equal(r.state.round.discardsRemaining,deckId==='red'?4:3);
  const started=act(r.state,'START_BLIND');assert.equal(started.state.roundNumber,5);assert.deepEqual(deserializeState(serializeState(started.state)),started.state);
 }
});
test('legacy boss shop continues once without regenerating shop or paying again',()=>{
 const shop=act(wonBoss(),'CASH_OUT').state;delete shop.nextAnteBlinds;
 const saved=deserializeState(serializeState(shop)),r=act(saved,'LEAVE_SHOP');assert.equal(r.error,null);
 assert.equal(r.state.round.ante,2);assert.equal(r.state.money,shop.money);assert.equal(r.state.apkShop.voucherId,shop.apkShop.voucherId);
 assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
});
