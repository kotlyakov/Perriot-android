import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {canUseConsumable} from '../../src/core/consumables.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';

const reload=state=>deserializeState(serializeState(state));
function fresh(seed='JUDGEMENT-REVIEW'){
 const state=createRun(seed,{runId:'judgement-review',money:20n,referenceRng:true,referenceShop:true});
 state.consumables=[{id:'jud',entityId:'c_judgement',originalKey:'c_judgement',set:'Tarot',edition:'base',cost:3n,sellCost:1n}];
 return state;
}
const use=state=>dispatch(state,{type:'USE_CONSUMABLE',cardId:'jud',expectedRevision:state.revision});
const fill=state=>{state.jokers=Array.from({length:5},(_,i)=>({id:`joker-${i}`,entityId:'j_joker',edition:'base',sellCost:2n}));};

test('Judgement is deterministic across save before use and reload after use for100 seeds',()=>{
 for(let i=0;i<100;i++){
  const state=fresh(`JUDREVIEW${i}`),before=structuredClone(state);
  const result=use(state),resumed=use(reload(state));
  assert.equal(result.error,null,`seed ${i}`);assert.deepEqual(result,resumed,`seed ${i}`);
  assert.deepEqual(state,before);assert.deepEqual(reload(result.state),result.state,`seed ${i}`);
  assert.equal(result.state.jokers.length,1);assert.equal(result.state.consumables.length,0);
  assert.equal(result.state.money,state.money);assert.equal(result.state.consumableUsage.c_judgement.count,1);
  assert.equal(result.state.lastTarotPlanet,'c_judgement');
  const again=use(result.state);assert.ok(again.error);assert.equal(again.state,result.state);
 }
});

test('Judgement capacity query and failed use preserve card, money and RNG atomically',()=>{
 const state=fresh();fill(state);const before=structuredClone(state);
 assert.equal(canUseConsumable(state,state.consumables[0]).available,false);
 const result=use(state);assert.ok(result.error);assert.equal(result.state,state);
 assert.deepEqual(result.events,[]);assert.deepEqual(state,before);
});

test('a Negative Joker provides Judgement one effective free slot',()=>{
 const state=fresh();fill(state);state.jokers[0].edition='negative';
 assert.equal(canUseConsumable(state,state.consumables[0]).available,true);
 const result=use(state);assert.equal(result.error,null);
 assert.equal(result.state.jokers.length,6);assert.equal(result.state.consumables.length,0);
 assert.deepEqual(result.state.jokers.slice(0,5),state.jokers);
 assert.deepEqual(reload(result.state),result.state);
});

test('debuffed Judgement counts its use but creates no Joker and draws no RNG',()=>{
 const state=fresh();state.consumables[0].debuffed=true;
 const before=structuredClone(state);assert.equal(canUseConsumable(state,state.consumables[0]).available,true);
 const result=use(state);assert.equal(result.error,null);assert.deepEqual(state,before);
 assert.deepEqual(result.state.rng,state.rng);assert.equal(result.state.money,state.money);
 assert.deepEqual(result.state.jokers,[]);assert.deepEqual(result.state.consumables,[]);
 assert.equal(result.events.some(event=>event.type==='joker_created'),false);
 assert.equal(result.state.consumableUsage.c_judgement.count,1);assert.equal(result.state.lastTarotPlanet,'c_judgement');
 assert.deepEqual(reload(result.state),result.state);
});
