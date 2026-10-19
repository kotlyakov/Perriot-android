import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {ITEM7A_JOKERS as ITEM7_JOKERS} from '../../src/content/jokers.js';
import {initializeItem7Joker,item7CapacityDeltas} from '../../src/core/joker-item7-lifecycle.js';
import {bossTarget} from '../../src/core/boss-effects.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
const reload=state=>deserializeState(serializeState(state));
function act(state,type,rest={}){const result=dispatch(state,{type,expectedRevision:state.revision,...rest});assert.equal(result.error,null,JSON.stringify(result.error));return result.state;}
function setup(keys,{boss}={}){
 const state=createRun('ITEM7-SAVE',{runId:'item7-save',money:25n,referenceRng:true,referenceShop:true});
 state.jokers=keys.map((entityId,i)=>initializeItem7Joker(state,{id:'save-j'+i,entityId,sellCost:2n,creationOrdinal:i+1}));state.nextJokerCreationOrdinal=keys.length+1;
 const delta=item7CapacityDeltas(state.jokers);state.round.handSize+=delta.handSize;state.round.handsRemaining+=delta.hands;state.round.discardsRemaining+=delta.discards;
 if(keys.includes('j_credit_card'))state.bankruptAt=-20n;
 if(boss){const ante=boss==='bl_final_heart'?8:boss==='bl_serpent'?5:3;state.round.ante=ante;state.round.blindId='boss';state.apkShop.context.ante=ante;state.apkBlinds.ante=ante;state.apkBlinds.tagContext.ante=ante;state.apkBlinds.bossId=boss;state.apkBlinds.bossesUsed[boss]=1;state.round.target=bossTarget(state);}
 state.apkShop.context=currentApkShopContext(state);
 return act(state,'START_BLIND');
}
for(const key of ITEM7_JOKERS)test(`${key} saves initial, real played and won states`,()=>{
 let state=setup([key]);assert.deepEqual(reload(state),state);
 state=act(state,'PLAY_HAND',{cardIds:[state.hand[0]]});assert.deepEqual(reload(state),state);
 if(state.phase==='playing'){
  state=reload(state);state.round.score=state.round.target-1n;state=act(state,'PLAY_HAND',{cardIds:[state.hand[0]]});
  assert.equal(state.phase,'round_won');assert.deepEqual(reload(state),state);assert.deepEqual(reload(reload(state)),state);
  const paid=act(state,'CASH_OUT');assert.deepEqual(reload(paid),paid);
 }
});
test('growth, money and mutable snapshots reject missing journal and tampered replay',()=>{
 const before=setup(['j_ride_the_bus','j_hiker','j_rocket']);
 const played=act(before,'PLAY_HAND',{cardIds:[before.hand[0]]}),raw=JSON.parse(serializeState(played));
 for(const mutate of [
  p=>delete p.state.effectReplay,
  p=>p.state.lastScore.item7State.jokers[0].mult++,
  p=>p.state.jokers[0].mult++,
  p=>p.state.money='999',
  p=>p.state.effectReplay.actions[0].cardIds=[before.hand[1]],
  p=>p.state.round.handsRemaining++,
  p=>delete p.state.lastScore.actionRng,
 ]){const p=structuredClone(raw);mutate(p);assert.throws(()=>deserializeState(JSON.stringify(p)));}
 assert.deepEqual(reload(played),played);

});

test('mutable native counter fields decode before ownership validation and reject foreign/corrupt fields',()=>{
 const state=setup(['j_rocket','j_egg']);state.jokers[0].rocketDollars=7n;state.jokers[1].extraValue=3n;
 assert.deepEqual(reload(state),state);
 const raw=JSON.parse(serializeState(state));
 for(const mutate of [p=>p.state.jokers[0].rocketDollars='0',p=>p.state.jokers[0].rocketDollars='01',p=>p.state.jokers[0].extraValue='-1',p=>p.state.jokers[1].rocketDollars='2',p=>p.state.jokers[1].mult=3]){
  const p=structuredClone(raw);mutate(p);assert.throws(()=>deserializeState(JSON.stringify(p)));
 }
});
test('passive and Burglar counters above legacy deck bounds roundtrip; invalid numeric counters reject',()=>{
 const state=setup(['j_burglar','j_drunkard','j_merry_andy','j_juggler','j_troubadour']);
 assert.ok(state.round.handsRemaining>5);assert.ok(state.round.discardsRemaining===0);
 assert.deepEqual(reload(state),state);
 const raw=JSON.parse(serializeState(state));
 for(const key of ['handsRemaining','discardsRemaining','handSize'])for(const count of [-1,10001,1.5,null]){
  const p=structuredClone(raw);p.state.round[key]=count;assert.throws(()=>deserializeState(JSON.stringify(p)),key+'='+count);
 }
 const discarded=setup(['j_drunkard','j_merry_andy']);assert.equal(discarded.round.discardsRemaining,8);
 assert.deepEqual(reload(act(discarded,'DISCARD',{cardIds:[discarded.hand[0]]})).round.discardsRemaining,7);
});
test('debuffed growth, later discard and depleted food replay without applying effects twice',()=>{
 const before=setup(['j_ride_the_bus','j_ramen','j_ice_cream']);before.jokers[0].debuffed=true;before.jokers[2].chips=5;
 const played=act(before,'PLAY_HAND',{cardIds:[before.hand[0]]});assert.equal(played.jokers[0].mult,0);assert.equal(played.jokers.some(j=>j.entityId==='j_ice_cream'),false);
 const discarded=act(played,'DISCARD',{cardIds:[played.hand[0]]});assert.equal(discarded.jokers.find(j=>j.entityId==='j_ramen').xMult,1.99);
 assert.deepEqual(reload(discarded),discarded);assert.deepEqual(reload(reload(discarded)),discarded);
});

for(const boss of ['bl_manacle','bl_water','bl_needle','bl_serpent','bl_final_heart'])test(`${boss} keeps passive resources and stored restoration counts`,()=>{
 let state=setup(['j_juggler','j_drunkard','j_merry_andy','j_troubadour'],{boss});
 assert.deepEqual(reload(state),state);
 state=act(state,'PLAY_HAND',{cardIds:[state.hand[0]]});assert.deepEqual(reload(state),state);
});

test('saved Hiker permanent chips and per-round history require valid counters',()=>{
 const state=setup(['j_hiker']);state.cards[state.hand[0]].permaBonus=5;
 assert.deepEqual(reload(state),state);
 const raw=JSON.parse(serializeState(state));
 for(const mutate of [
  p=>p.state.cards[state.hand[0]].permaBonus=-1,
  p=>p.state.cards[state.hand[0]].permaBonus='5',
  p=>p.state.cards[state.hand[0]].permaBonus=1.5,
  p=>p.state.round.discardsUsed=-1,
  p=>p.state.round.handUsage={foreign:1},
  p=>p.state.round.handUsage={high_card:1.5},
  p=>p.state.handUsage={high_card:-1},
 ]){const p=structuredClone(raw);mutate(p);assert.throws(()=>deserializeState(JSON.stringify(p)));}
});
test('standalone expanded earned quotes roundtrip and reject forged provenance',()=>{
 const before=setup(['j_burglar','j_rocket','j_satellite','j_delayed_grat','j_to_the_moon']);before.round.score=before.round.target-1n;
 const state=act(before,'PLAY_HAND',{cardIds:[before.hand[0]]});
 // Existing snapshot contract also supports settled states whose visible score
 // was cleared by a later inventory action; the frozen payout remains authoritative.
 state.lastScore=null;delete state.effectReplay;
 assert.ok(state.cashoutQuote.handsRemainingBefore>5);assert.deepEqual(reload(state),state);
 const raw=JSON.parse(serializeState(state));
 for(const mutate of [p=>p.state.cashoutQuote.bonusContext.item7.rocketValues[0].amount='999',p=>p.state.cashoutQuote.handsRemainingBefore++,p=>p.state.cashoutQuote.bonusContext.item7.discardsUsed=-1,p=>p.state.cashoutQuote.quote.total='999']){
  const p=structuredClone(raw);mutate(p);assert.throws(()=>deserializeState(JSON.stringify(p)));
 }
});
test('boss endround Rocket growth freezes and reloads the raised dollar bonus once',()=>{
 const before=setup(['j_rocket','j_egg'],{boss:'bl_manacle'});before.round.score=before.round.target-1n;
 const state=act(before,'PLAY_HAND',{cardIds:[before.hand[0]]});
 assert.equal(state.phase,'round_won');assert.equal(state.jokers[0].rocketDollars,3n);assert.equal(state.jokers[1].extraValue,3n);
 assert.equal(state.cashoutQuote.quote.jokerBonuses.find(row=>row.entityId==='j_rocket').amount,3n);
 assert.deepEqual(reload(state),state);assert.deepEqual(reload(reload(state)),state);
 const paid=act(reload(state),'CASH_OUT');assert.equal(paid.jokers[0].rocketDollars,3n);assert.deepEqual(reload(paid),paid);
});
test('copied Burglar grants persist with Needle and survive selling their source before play',()=>{
 const before=setup(['j_blueprint','j_burglar'],{boss:'bl_needle'});
 assert.equal(before.round.burglarHandsGranted,6);assert.equal(before.round.handsRemaining,7);assert.deepEqual(reload(before),before);
 const sold=act(before,'SELL_OWNED_CARD',{area:'jokers',cardId:before.jokers[1].id});
 assert.equal(sold.round.burglarHandsGranted,6);assert.equal(sold.round.handsRemaining,7);assert.deepEqual(reload(sold),sold);
 const played=act(sold,'PLAY_HAND',{cardIds:[sold.hand[0]]});assert.equal(played.round.handsRemaining,6);assert.deepEqual(reload(played),played);
 const raw=JSON.parse(serializeState(sold));
 for(const count of [-3,1,1.5,'3',10002,null]){
  const p=structuredClone(raw);p.state.round.burglarHandsGranted=count;assert.throws(()=>deserializeState(JSON.stringify(p)),String(count));
 }
 for(const mutate of [p=>delete p.state.round.burglarHandsGranted,p=>p.state.round.burglarHandsGranted=0,p=>p.state.round.burglarUnknownCounter=6,p=>p.state.round.handsRemaining=8]){
  const p=structuredClone(raw);mutate(p);assert.throws(()=>deserializeState(JSON.stringify(p)));
 }
});
