import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
const start=()=>dispatch(createRun('reorder',{runId:'r',money:4n}),{type:'START_BLIND',expectedRevision:0}).state;
test('reorder changes scoring order without consuming actions or RNG and survives save',async()=>{
  const s=start(), before=structuredClone(s), ids=[...s.hand].reverse();
  const r=dispatch(s,{type:'REORDER_HAND',expectedRevision:s.revision,cardIds:ids});
  assert.equal(r.error,null);assert.deepEqual(r.state.hand,ids);assert.deepEqual(s,before);
  assert.equal(r.state.revision,s.revision+1);assert.deepEqual(r.state.round,s.round);assert.deepEqual(r.state.rng,s.rng);
  const {serializeState,deserializeState}=await import('../../src/persistence/save.js');
  assert.deepEqual(deserializeState(serializeState(r.state)).hand,ids);
  const play=dispatch(r.state,{type:'PLAY_HAND',expectedRevision:r.state.revision,cardIds:ids.slice(0,2).reverse()});
  assert.deepEqual(play.state.discardPile,ids.slice(0,2));
});
test('reorder rejects missing duplicate foreign cards, wrong phase and stale revision',()=>{
  const s=start();
  for(const ids of [[],s.hand.slice(1),[s.hand[0],...s.hand.slice(0,-1)],[...s.hand.slice(1),'foreign'],null]) {
    const r=dispatch(s,{type:'REORDER_HAND',expectedRevision:s.revision,cardIds:ids});
    assert.ok(r.error);assert.equal(r.state,s);assert.deepEqual(r.events,[]);
  }
  assert.equal(dispatch(s,{type:'REORDER_HAND',expectedRevision:0,cardIds:s.hand}).error.code,'STALE_ACTION');
  s.phase='round_won';assert.equal(dispatch(s,{type:'REORDER_HAND',expectedRevision:s.revision,cardIds:s.hand}).error.code,'INVALID_PHASE');
});
