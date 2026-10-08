import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {shuffleApkDeck} from '../../src/core/apk-deck.js';
import {getRerollCost} from '../../src/core/shop.js';
import {generateApkShop} from '../../src/core/apk-shop.js';
const fixtures=JSON.parse(readFileSync(new URL('../../scripts/reference-rng/shop-fixtures.json',import.meta.url))).cases;
const fresh=(seed='AAAAAAA1',reducedMotion=false)=>createRun(seed,{runId:'shop-integration',money:4n,referenceRng:true,referenceShop:true,reducedMotion});
const act=(s,type,extra={})=>dispatch(s,{type,expectedRevision:s.revision,...extra});
function won(seed='AAAAAAA1',reducedMotion=false){const s=fresh(seed,reducedMotion);s.phase='round_won';s.round.score=300n;s.round.handsRemaining=1;s.apkShop.context.playedHands={'High Card':1};return s;}
const summary=o=>({key:o.entityId,set:o.set,edition:o.edition==='base'?false:{[o.edition==='holographic'?'holo':o.edition]:true},cost:Number(o.cost),sell_cost:Number(o.sellCost),...(o.toDoPokerHand?{to_do:o.toDoPokerHand}:{})});
test('new reference shop run stores its voucher before play and records actual hand history',()=>{
 const s=fresh();assert.equal(s.apkShop.voucherId,'v_telescope');
 assert.equal(s.apkShop.context.reducedMotion,false);assert.deepEqual(s.apkShop.context.playedHands,{});
 const playing=act(s,'START_BLIND').state;
 const result=act(playing,'PLAY_HAND',{cardIds:[playing.hand[0]]});assert.equal(result.error,null);
 assert.equal(result.state.apkShop.context.playedHands['High Card'],1);
 assert.deepEqual(s.apkShop.context.playedHands,{});
 assert.deepEqual(deserializeState(serializeState(result.state)),result.state);
});
for(const f of fixtures)test(`cashout creates exact original conditional inventory ${f.seed}/${f.reduced_motion}`,()=>{
 const s=won(f.seed,f.reduced_motion),before=structuredClone(s),r=act(s,'CASH_OUT');assert.equal(r.error,null);
 assert.deepEqual(s,before);assert.equal(r.state.money,8n);assert.equal(r.state.revision,s.revision+1);
 assert.deepEqual(r.state.shop.main.map(summary),f.items);assert.deepEqual(r.state.shop.vouchers.map(summary),[f.voucher]);assert.deepEqual(r.state.shop.boosters.map(summary),f.packs);
 const shuffled=shuffleApkDeck(Object.values(s.cards),s.rng.apk,'cashout1');
 const expected=generateApkShop(shuffled.rng,s.apkShop.context,{voucherId:s.apkShop.voucherId,instancePrefix:'shop_1'});
 assert.deepEqual(r.state.rng.apk,expected.rng);assert.deepEqual(r.state.drawPile,shuffled.cardIds);
 assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
 const saved=serializeState(r.state);assert.equal(serializeState(deserializeState(saved)),saved);
 assert.equal(act(r.state,'CASH_OUT').error.code,'INVALID_PHASE');
 assert.equal(dispatch(r.state,{type:'CASH_OUT',expectedRevision:s.revision}).error.code,'STALE_ACTION');
});
test('native reroll preserves other areas and reload keeps the next RNG and paid tier',()=>{
 const s=act(won(),'CASH_OUT').state;s.money=100n;const before=structuredClone(s);
 let r=act(s,'REROLL_SHOP');assert.equal(r.error,null);assert.equal(r.state.money,95n);assert.equal(getRerollCost(r.state.shop),6n);
 assert.deepEqual(r.state.shop.vouchers,s.shop.vouchers);assert.deepEqual(r.state.shop.boosters,s.shop.boosters);assert.deepEqual(s,before);
 const restored=deserializeState(serializeState(r.state));assert.deepEqual(act(restored,'REROLL_SHOP'),act(r.state,'REROLL_SHOP'));
 r=act(restored,'REROLL_SHOP');assert.equal(r.state.money,89n);assert.equal(getRerollCost(r.state.shop),7n);
 assert.equal(dispatch(r.state,{type:'REROLL_SHOP',expectedRevision:restored.revision}).error.code,'STALE_ACTION');
 const ids=[...r.state.shop.main,...r.state.shop.vouchers,...r.state.shop.boosters].map(o=>o.id);assert.equal(new Set(ids).size,ids.length);
});
test('native reroll is atomic when unaffordable or unsupported, and free reroll keeps the paid tier',()=>{
 const s=act(won(),'CASH_OUT').state;s.money=0n;const before=structuredClone(s);
 const denied=act(s,'REROLL_SHOP');assert.equal(denied.error.code,'INSUFFICIENT_FUNDS');assert.strictEqual(denied.state,s);assert.deepEqual(s,before);
 s.shop.freeRerolls=1;const r=act(s,'REROLL_SHOP');assert.equal(r.error,null);assert.equal(r.state.money,0n);assert.equal(getRerollCost(r.state.shop),5n);
 const unsupported=act(r.state,'BUY_SHOP_CARD',{offerId:r.state.shop.main[0].id});assert.equal(unsupported.error.code,'UNSUPPORTED_CONTENT');assert.strictEqual(unsupported.state,r.state);
});
test('legacy and old reference runs retain their previous shop transition without retroactive generation',()=>{
 for(const referenceRng of [false,true]){const s=createRun('old',{runId:'old',money:4n,referenceRng});s.phase='round_won';s.round.score=300n;const r=act(s,'CASH_OUT');assert.equal(r.error,null);assert.ok(!Object.hasOwn(r.state,'apkShop'));assert.ok(!Object.hasOwn(r.state,'shop'));assert.deepEqual(deserializeState(serializeState(r.state)),r.state);}
 assert.throws(()=>createRun('bad',{runId:'bad',money:4n,referenceShop:true}));
});
test('save rejects forged native shop metadata and context without advancing RNG',()=>{
 const state=act(won(),'CASH_OUT').state,encoded=serializeState(state),before=structuredClone(state);
 for(const change of [p=>p.state.apkShop.version=2,p=>p.state.apkShop.voucherId='j_joker',p=>p.state.apkShop.context.ante=2,p=>p.state.apkShop.context.tags=[],p=>p.state.shop.main[0].originalKey='j_joker',p=>p.state.shop.main[0].set='Booster',p=>p.state.shop.main[0].toDoPokerHand='Fake',p=>delete p.state.rng.apk]){const p=JSON.parse(encoded);change(p);assert.throws(()=>deserializeState(JSON.stringify(p)));}
 assert.deepEqual(state,before);
});
test('unsupported cashout inputs preserve money, areas and RNG atomically',()=>{
 const s=won();s.apkShop.context.tags=['tag_juggle'];const before=structuredClone(s),r=act(s,'CASH_OUT');
 assert.equal(r.error.code,'UNSUPPORTED_SHOP_STATE');assert.strictEqual(r.state,s);assert.deepEqual(s,before);
});
test('native shop saves require actual inventory, original identities and correct areas',()=>{
 const encoded=serializeState(act(won(),'CASH_OUT').state);
 for(const change of [
  p=>delete p.state.shop,
  p=>p.state.shop=null,
  p=>{delete p.state.shop.main[0].originalKey;delete p.state.shop.main[0].set;p.state.shop.main[0].entityId='forged';},
  p=>{p.state.shop.main.push(p.state.shop.vouchers.pop());},
  p=>{p.state.shop.vouchers.push(p.state.shop.boosters.pop());},
 ]){const p=JSON.parse(encoded);change(p);assert.throws(()=>deserializeState(JSON.stringify(p)));}
});
test('native shop refuses caller-invented next blind configurations without losing its save',()=>{
 const s=act(won(),'CASH_OUT').state,before=structuredClone(s);
 const r=dispatch(s,{type:'LEAVE_SHOP',expectedRevision:s.revision},{nextRound:{...s.round,ante:2,score:0n}});
 assert.equal(r.error?.code,'NEXT_BLIND_UNAVAILABLE');assert.strictEqual(r.state,s);assert.deepEqual(s,before);
 assert.deepEqual(deserializeState(serializeState(s)),s);
});
