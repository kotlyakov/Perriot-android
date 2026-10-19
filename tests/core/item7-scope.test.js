import test from 'node:test';
import assert from 'node:assert/strict';
import {NATIVE_JOKERS,ITEM7A_JOKERS as ITEM7_JOKERS,supportsJoker} from '../../src/content/jokers.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {createShop} from '../../src/core/shop.js';
import {canUseConsumable} from '../../src/core/consumables.js';

test('first half remains43 identities and unknown purchases remain atomic',()=>{
 assert.equal(ITEM7_JOKERS.length,43);
 assert.equal(new Set(NATIVE_JOKERS).size,150);
 for(const key of ['j_unknown','j_unknown_vampire']){
  assert.equal(supportsJoker({id:'offer',entityId:key,edition:'base'}),false,key);
  const state=createRun('SCOPE7',{runId:'scope7',money:20n,referenceRng:true,referenceShop:true});
  state.phase='shop';state.shop=createShop({offers:{main:[{id:'offer',entityId:key,edition:'base',cost:4n,sellCost:2n}],vouchers:[],boosters:[]}});
  const before=structuredClone(state),r=dispatch(state,{type:'BUY_SHOP_CARD',offerId:'offer',expectedRevision:state.revision});
  assert.ok(r.error,key);assert.equal(r.state,state);assert.deepEqual(state,before);assert.deepEqual(r.events,[]);
 }
});
test('unimplemented Spectral effects wait for item8 without consuming a card or RNG',()=>{
 const state=createRun('SCOPE7',{runId:'scope7',money:20n,referenceRng:true,referenceShop:true});
 const card={id:'jud',entityId:'c_ankh',originalKey:'c_ankh',set:'Spectral',edition:'base',cost:3n,sellCost:1n};
 state.consumables=[card];const before=structuredClone(state);
 assert.equal(canUseConsumable(state,card).available,false);
 const result=dispatch(state,{type:'USE_CONSUMABLE',cardId:card.id,expectedRevision:state.revision});
 assert.ok(result.error);assert.equal(result.state,state);assert.deepEqual(state,before);
});
