import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {bossTarget,disableBoss} from '../../src/core/boss-effects.js';
import {initializeItem7Joker,item7CapacityDeltas} from '../../src/core/joker-item7-lifecycle.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {nextApkRandom} from '../../src/core/apk-rng.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {changeHandSize} from '../../src/core/hand-size.js';
const act=(s,type,extra={})=>{const r=dispatch(s,{type,expectedRevision:s.revision,...extra});assert.ifError(r.error);return r;};
function start(boss,opts={}){
 let s=createRun('CONCEAL060',{runId:'boss-draw061',money:4n,referenceRng:true,referenceShop:true,...opts});
 if(!opts.challengeId){s.jokers=[initializeItem7Joker(s,{id:'juggler',entityId:'j_juggler',originalKey:'j_juggler',set:'Joker',edition:'base',sellCost:2n,creationOrdinal:1})];s.nextJokerCreationOrdinal=2;s.round.handSize+=item7CapacityDeltas(s.jokers).handSize;}
 Object.assign(s.round,{ante:2,blindId:'boss'});Object.assign(s.apkBlinds,{ante:2,bossId:boss});s.apkBlinds.bossesUsed[boss]=1;s.apkBlinds.tagContext.ante=2;s.apkShop.context.ante=2;s.round.target=bossTarget(s);return act(s,'START_BLIND').state;
}
function give(s,key){delete s.effectReplay;s.consumables=[{id:key,entityId:key,originalKey:key,set:'Spectral',edition:'base',cost:4n,sellCost:1n}];s.apkShop.context=currentApkShopContext(s);}
for(const boss of ['bl_house','bl_mark','bl_wheel'])test(`Ankh hand grant respects ${boss} and reload`,()=>{
 const s=start(boss);if(boss==='bl_mark'){const i=s.drawPile.findIndex(id=>s.cards[id].rank===11);[s.drawPile[i],s.drawPile[s.drawPile.length-1]]=[s.drawPile.at(-1),s.drawPile[i]];}
 give(s,'c_ankh');serializeState(s);const expectedWheel=boss==='bl_wheel'?nextApkRandom(s.rng.apk,'wheel').rng.streams.wheel:null;
 const r=act(s,'USE_CONSUMABLE',{cardId:'c_ankh'}),drawn=r.events.filter(e=>e.type==='cards_drawn').flatMap(e=>e.cardIds);assert.equal(drawn.length,1);
 if(boss==='bl_wheel')assert.equal(r.state.rng.apk.streams.wheel,expectedWheel);else assert.ok(r.state.bossState.hiddenCardIds.includes(drawn[0]));
 assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
});
test('House hides a complete Immolate refill before any play or discard',()=>{
 const s=start('bl_house',{challengeId:'five_card_draw'});give(s,'c_immolate');const r=act(s,'USE_CONSUMABLE',{cardId:'c_immolate'}),ids=r.events.filter(e=>e.type==='cards_drawn').flatMap(e=>e.cardIds);assert.equal(ids.length,5);assert.equal(r.state.round.handsPlayed,0);assert.equal(r.state.round.discardsUsed,0);assert.ok(ids.every(id=>r.state.bossState.hiddenCardIds.includes(id)));assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
});
test('disabled Wheel neither hides a hand grant nor consumes probability RNG',()=>{
 const s=start('bl_wheel');disableBoss(s,[]);const before=structuredClone(s.rng.apk),events=[];changeHandSize(s,1,{draw:true,events});assert.equal(s.rng.apk.streams.wheel,before.streams.wheel);assert.equal(s.bossState.hiddenCardIds.length,0);
});
test('House after a real discard does not hide later capacity grants',()=>{
 let s=start('bl_house');s=act(s,'DISCARD',{cardIds:[s.hand[0]]}).state;const events=[];changeHandSize(s,1,{draw:true,events});const ids=events.flatMap(e=>e.cardIds??[]);assert.ok(ids.length);assert.ok(ids.every(id=>!s.bossState.hiddenCardIds.includes(id)));
});
test('unversioned historical capacity draw retains old visibility and RNG',()=>{
 const s=start('bl_wheel');delete s.mechanicsVersion;const before=s.rng.apk.streams.wheel,events=[];changeHandSize(s,1,{draw:true,events});assert.equal(s.rng.apk.streams.wheel,before);
});
