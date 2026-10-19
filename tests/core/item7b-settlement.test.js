import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {initializeItem7Joker} from '../../src/core/joker-item7-lifecycle.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';

test('Mr Bones rescue applies Gift and Invisible end-round effects once and survives cashout',()=>{
 let s=createRun('BONES7B',{runId:'bones7b',money:20n,referenceRng:true,referenceShop:true});
 s.jokers=['j_mr_bones','j_gift','j_egg','j_invisible'].map((entityId,i)=>initializeItem7Joker(s,{id:'j'+i,entityId,set:'Joker',originalKey:entityId,edition:'base',cost:4n,sellCost:2n,creationOrdinal:i+1}));s.nextJokerCreationOrdinal=5;
 let r=dispatch(s,{type:'START_BLIND',expectedRevision:s.revision});assert.equal(r.error,null);s=r.state;
 s.round.handsRemaining=1;s.round.score=75n;
 r=dispatch(s,{type:'PLAY_HAND',cardIds:[s.hand[0]],expectedRevision:s.revision});assert.equal(r.error,null);s=r.state;
 assert.equal(s.phase,'round_won');assert.equal(s.round.savedByBones,true);
 assert.equal(s.jokers.find(j=>j.entityId==='j_invisible').invisibleRounds,1);
 assert.equal(s.jokers.find(j=>j.entityId==='j_gift').sellCost,3n);
 assert.equal(s.jokers.find(j=>j.entityId==='j_egg').sellCost,6n);
 assert.deepEqual(deserializeState(serializeState(s)),s);
 r=dispatch(s,{type:'CASH_OUT',expectedRevision:s.revision});assert.equal(r.error,null);
 assert.equal(r.state.jokers.find(j=>j.entityId==='j_invisible').invisibleRounds,1);
});

test('Gift runs before Blue seal creates a Planet at round end',()=>{
 let s=createRun('GIFTBLUE',{runId:'giftblue7b',money:20n,referenceRng:true,referenceShop:true});
 s.jokers=[{id:'gift',entityId:'j_gift',set:'Joker',originalKey:'j_gift',sellCost:2n,creationOrdinal:1}];s.nextJokerCreationOrdinal=2;
 let r=dispatch(s,{type:'START_BLIND',expectedRevision:s.revision});assert.equal(r.error,null);s=r.state;
 s.cards[s.hand[1]].seal='blue';s.round.score=s.round.target-1n;
 r=dispatch(s,{type:'PLAY_HAND',cardIds:[s.hand[0]],expectedRevision:s.revision});assert.equal(r.error,null);
 assert.equal(r.state.phase,'round_won');assert.equal(r.state.consumables.length,1);
 assert.equal(r.state.consumables[0].sellCost,1n);assert.equal(r.state.consumables[0].extraValue??0n,0n);
 assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
});
