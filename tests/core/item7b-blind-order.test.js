import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {initializeItem7Joker} from '../../src/core/joker-item7-lifecycle.js';

function start(keys,seed='DAGRIF'){
 const s=createRun(seed,{runId:'blind-order',money:20n,referenceRng:true,referenceShop:true});
 s.jokers=keys.map((entityId,i)=>initializeItem7Joker(s,{id:`j${i}`,entityId,originalKey:entityId,set:'Joker',sellCost:2n,creationOrdinal:i+1}));s.nextJokerCreationOrdinal=keys.length+1;
 const r=dispatch(s,{type:'START_BLIND',expectedRevision:s.revision});assert.equal(r.error,null);return r;
}
// Native Dagger decrements joker_buffer immediately; Riff reads it at its own slot.
test('Dagger before Riff reserves the freed slot at full Joker capacity',()=>{
 const r=start(['j_ceremonial','j_joker','j_riff_raff','j_joker','j_joker']);
 assert.equal(r.events.filter(e=>e.type==='joker_created').length,1);assert.equal(r.state.jokers.length,5);
});
test('Riff before Dagger cannot retroactively reserve a later freed slot',()=>{
 const r=start(['j_riff_raff','j_ceremonial','j_joker','j_joker','j_joker']);
 assert.equal(r.events.filter(e=>e.type==='joker_created').length,0);assert.equal(r.state.jokers.length,4);
});
test('Cartomancer callback reserved before Madness survives later source slicing',()=>{
 const r=start(['j_cartomancer','j_madness']);
 assert.equal(r.state.jokers.length,1);assert.equal(r.state.consumables.length,1);
});
test('Marble callback queued before Madness survives later source slicing',()=>{
 const r=start(['j_marble','j_madness']);
 assert.equal(r.state.jokers.length,1);assert.equal(Object.keys(r.state.cards).length,53);
});
test('creator sliced before its slot never schedules a callback',()=>{
 const r=start(['j_ceremonial','j_cartomancer']);
 assert.equal(r.state.consumables?.length??0,0);
});
