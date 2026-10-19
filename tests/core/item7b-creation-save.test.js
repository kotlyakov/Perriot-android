import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {initializeItem7Joker} from '../../src/core/joker-item7-lifecycle.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';

const act=(state,type,extra={})=>{const r=dispatch(state,{type,expectedRevision:state.revision,...extra});assert.equal(r.error,null);return r.state;};
test('successive Vagabond creations retain unique ordinals and resume across scoring checkpoints',()=>{
 let state=createRun('REVIEWVAG',{runId:'reviewvag',money:0n,referenceRng:true,referenceShop:true});
 state.jokers=[initializeItem7Joker(state,{id:'vagabond',entityId:'j_vagabond',originalKey:'j_vagabond',set:'Joker',edition:'base',cost:4n,sellCost:2n,creationOrdinal:1})];
 state.nextJokerCreationOrdinal=2;
 state=act(state,'START_BLIND');
 for(let i=0;i<2;i++){
  state=act(state,'PLAY_HAND',{cardIds:[state.hand[0]]});
  assert.equal(state.consumables.length,i+1);
  assert.equal(state.nextJokerCreationOrdinal,i+3,'creation counter must advance with scoring results');
  assert.deepEqual(state.consumables.map(c=>c.creationOrdinal),Array.from({length:i+1},(_,n)=>n+2));
  assert.deepEqual(deserializeState(serializeState(state)),state);
 }
});
