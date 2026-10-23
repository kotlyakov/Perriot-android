import test from 'node:test';import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';import {serializeState,deserializeState} from '../../src/persistence/save.js';import {shuffleApkDeck} from '../../src/core/apk-deck.js';import {getCashout} from '../../src/core/cashout.js';
const act=(s,type)=>dispatch(s,{type,expectedRevision:s.revision});
function smallShop(){let s=createRun('BIGNEXT1',{runId:'next-big',money:4n,referenceRng:true,referenceShop:true});s=act(s,'START_BLIND').state;s.phase='round_won';s.round.score=300n;s.round.handsRemaining=1;s=act(s,'CASH_OUT').state;return s;}
test('leaving first native shop selects exact Big Blind and preserves money ownership and RNG',()=>{
 const s=smallShop();s.jokers=[{id:'bought',entityId:'j_joker',originalKey:'j_joker',set:'Joker',edition:'base',cost:4n,sellCost:2n}];const before=structuredClone(s),r=act(s,'LEAVE_SHOP');assert.equal(r.error,null);assert.equal(r.state.phase,'blind_selection');assert.equal(r.state.round.blindId,'big');assert.equal(r.state.round.target,450n);assert.equal(r.state.round.score,0n);assert.equal(r.state.round.handsRemaining,4);assert.equal(r.state.round.discardsRemaining,4);assert.equal(r.state.money,s.money);assert.deepEqual(r.state.jokers,s.jokers);assert.deepEqual(r.state.rng,s.rng);assert.equal(r.state.apkShop.voucherId,s.apkShop.voucherId);assert.deepEqual(s,before);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
 assert.equal(dispatch(r.state,{type:'LEAVE_SHOP',expectedRevision:s.revision}).error.code,'STALE_ACTION');
 const expected=shuffleApkDeck(Object.values(r.state.cards),r.state.rng.apk,'nr1');const play=act(r.state,'START_BLIND');assert.equal(play.error,null);assert.deepEqual(play.state.rng.apk,expected.rng);assert.notEqual(play.state.rng.apk.streams.nr1,s.rng.apk.streams.nr1);assert.deepEqual(deserializeState(serializeState(play.state)),play.state);
});
test('Big payout keeps its voucher and enters the already assigned boss without RNG',()=>{
 const s=act(smallShop(),'LEAVE_SHOP').state;s.phase='round_won';s.round.score=450n;s.round.handsRemaining=2;const quote=getCashout(s);assert.equal(quote.reward,4n);
 const r=act(s,'CASH_OUT');assert.equal(r.error,null);assert.equal(r.state.money,s.money+quote.total);assert.equal(r.state.apkShop.voucherId,s.apkShop.voucherId);assert.equal(r.state.round.ante,1);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);const next=act(r.state,'LEAVE_SHOP');assert.equal(next.error,null);assert.equal(next.state.round.blindId,'boss');assert.equal(next.state.round.target,600n);assert.deepEqual(next.state.rng,r.state.rng);assert.equal(next.state.apkBlinds.bossId,r.state.apkBlinds.bossId);assert.deepEqual(deserializeState(serializeState(next.state)),next.state);
 const old=structuredClone(r.state);delete old.apkBlinds.playedCardIds;const gated=act(old,'LEAVE_SHOP');assert.equal(gated.error.code,'NEXT_BLIND_UNAVAILABLE');assert.strictEqual(gated.state,old);
});

