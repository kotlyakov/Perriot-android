import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const fresh=()=>{const s=createRun('inventory',{runId:'inventory',money:4n});s.jokers=[{id:'a',entityId:'j_joker',sellCost:2n},{id:'b',entityId:'j_duo',sellCost:4n}];return s;};
const act=(s,type,fields)=>dispatch(s,{type,expectedRevision:s.revision,...fields});
test('owned reorder persists an exact permutation without changing money, counters or RNG',()=>{
 const s=fresh(),before=structuredClone(s),r=act(s,'REORDER_JOKERS',{cardIds:['b','a']});
 assert.equal(r.error,null);assert.deepEqual(r.state.jokers.map(j=>j.id),['b','a']);
 assert.deepEqual(s,before);assert.deepEqual(r.state.rng,s.rng);assert.deepEqual(r.state.round,s.round);assert.equal(r.state.money,4n);
 assert.deepEqual(deserializeState(serializeState(r.state)).jokers,r.state.jokers);
 for(const cardIds of [['a'],['a','a'],['a','foreign']])assert.ok(act(s,'REORDER_JOKERS',{cardIds}).error);
});
test('drag sale pays once and rejects stale, eternal and finished runs',()=>{
 const s=fresh(),r=act(s,'SELL_OWNED_CARD',{area:'jokers',cardId:'a'});assert.equal(r.error,null);
 assert.equal(r.state.money,6n);assert.deepEqual(r.state.jokers.map(j=>j.id),['b']);
 assert.equal(dispatch(r.state,{type:'SELL_OWNED_CARD',area:'jokers',cardId:'a',expectedRevision:0}).error.code,'STALE_ACTION');
 assert.ok(act(r.state,'SELL_OWNED_CARD',{area:'jokers',cardId:'a'}).error);
 s.jokers[0].eternal=true;assert.ok(act(s,'SELL_OWNED_CARD',{area:'jokers',cardId:'a'}).error);
 s.phase='game_over';assert.ok(act(s,'REORDER_JOKERS',{cardIds:['b','a']}).error);
});
test('known consumables reorder and sell without executing use effects, surviving save',()=>{
 const s=fresh();s.consumables=[{id:'c',entityId:'c_fool',originalKey:'c_fool',set:'Tarot',cost:3n,sellCost:1n},{id:'d',entityId:'c_pluto',originalKey:'c_pluto',set:'Planet',cost:3n,sellCost:1n}];
 const r=act(s,'REORDER_CONSUMABLES',{cardIds:['d','c']});assert.equal(r.error,null);
 assert.deepEqual(deserializeState(serializeState(r.state)).consumables.map(c=>c.id),['d','c']);
 const sale=act(r.state,'SELL_OWNED_CARD',{area:'consumables',cardId:'c'});assert.equal(sale.error,null);assert.equal(sale.state.money,5n);
 assert.equal(deserializeState(serializeState(sale.state)).consumables.length,1);
});
