import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {applyItem7Discard} from '../../src/core/joker-item7-lifecycle.js';
function start(keys=[]){let s=createRun('PURPLE061',{runId:'purple-061',money:20n,referenceRng:true,referenceShop:true});s.jokers=keys.map((entityId,i)=>({id:`j${i}`,entityId,set:'Joker',originalKey:entityId,creationOrdinal:i+1,sellCost:2n}));s.nextJokerCreationOrdinal=keys.length+1;const r=dispatch(s,{type:'START_BLIND',expectedRevision:s.revision});assert.equal(r.error,null);return r.state;}
test('beforeCard runs after Burnt and before Trading individual effects',()=>{
 const s=start(['j_burnt','j_trading']),id=s.hand[0],events=[];let calls=0;
 const removed=applyItem7Discard(s,[id],events,{beforeCard:cardId=>{calls++;assert.equal(cardId,id);assert.ok(events.some(e=>e.type==='hand_level_changed'));assert.ok(!events.some(e=>e.type==='money_changed'));}});
 assert.equal(calls,1);assert.equal(removed[0].id,id);
});
test('callback visits each card exactly once even with copied jokers',()=>{
 const s=start(['j_blueprint','j_trading']),ids=s.hand.slice(0,2),seen=[];
 applyItem7Discard(s,ids,[],{beforeCard:id=>seen.push(id)});assert.deepEqual(seen,ids);
});
for(const keys of [[],['j_trading'],['j_blueprint','j_trading']])test(`public purple discard ${keys.join(',')}`,()=>{
 const s=start(keys),id=s.hand[0];s.cards[id].seal='purple';const before=s.money;
 const r=dispatch(s,{type:'DISCARD',cardIds:[id],expectedRevision:s.revision});assert.equal(r.error,null);
 assert.equal(r.state.consumables?.length??0,1);if(keys.includes('j_trading')){assert.equal(r.state.money,before+3n);assert.ok(!r.state.cards[id]);}
});
test('omitted callback retains helper behavior and does not create a seal consumable',()=>{
 const s=start(['j_trading']),id=s.hand[0];s.cards[id].seal='purple';
 const removed=applyItem7Discard(s,[id],[]);assert.equal(removed.length,1);assert.equal(s.consumables?.length??0,0);
});
test('Purple with full slots still pays Trading without adding Tarot',()=>{
 const s=start(['j_trading']),id=s.hand[0];s.cards[id].seal='purple';
 s.consumables=[{id:'c1',entityId:'c_sun',set:'Tarot'},{id:'c2',entityId:'c_moon',set:'Tarot'}];
 const r=dispatch(s,{type:'DISCARD',cardIds:[id],expectedRevision:s.revision});assert.equal(r.error,null);assert.equal(r.state.consumables.length,2);assert.ok(!r.state.cards[id]);assert.equal(r.state.money,s.money+3n);
});
test('second discard preserves Purple card and creates one Tarot',()=>{
 const s=start(['j_trading']),id=s.hand[0];s.round.discardsUsed=1;s.cards[id].seal='purple';
 const r=dispatch(s,{type:'DISCARD',cardIds:[id],expectedRevision:s.revision});assert.equal(r.error,null);assert.equal(r.state.consumables?.length??0,1);assert.ok(r.state.cards[id]);
});
for(const single of [false,true])test(`Hook handles Purple before lifecycle without duplicate seal, single=${single}`,()=>{
 let s=createRun('HOOKPURPLE061',{runId:'hook-purple-061',money:20n,referenceRng:true,referenceShop:true});
 s.round.blindId='boss';s.round.target=600n;s.apkBlinds.bossId='bl_hook';s.apkBlinds.bossesUsed.bl_hook=1;
 s.jokers=[{id:'trading',entityId:'j_trading',set:'Joker',originalKey:'j_trading',creationOrdinal:1,sellCost:2n}];s.nextJokerCreationOrdinal=2;
 let r=dispatch(s,{type:'START_BLIND',expectedRevision:s.revision});assert.equal(r.error,null);s=r.state;
 if(single){s.drawPile.push(...s.hand.slice(2));s.hand=s.hand.slice(0,2);}
 for(const id of s.hand)s.cards[id].seal='purple';
 r=dispatch(s,{type:'PLAY_HAND',cardIds:[s.hand[0]],expectedRevision:s.revision});assert.equal(r.error,null);
 const forced=r.events.find(e=>e.type==='cards_forced_discarded');assert.equal(forced.cardIds.length,single?1:2);assert.equal(r.state.consumables.length,single?1:2);
});
