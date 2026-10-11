import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
const card=(key,id=key)=>{const c=catalogue.centres.find(c=>c.key===key);return {id,entityId:key,originalKey:key,set:c.set,cost:BigInt(c.cost),sellCost:1n};};
const act=(s,type,fields={})=>dispatch(s,{type,expectedRevision:s.revision,...fields});
const reload=s=>deserializeState(serializeState(s));
function shop(){let s=createRun('PLANET12',{runId:'planet12',money:20n,referenceRng:true,referenceShop:true});s=act(s,'START_BLIND').state;s.phase='round_won';s.round.score=s.round.target;return act(s,'CASH_OUT').state;}
test('native shop Planet purchase uses consumable slots, then upgrades once and reloads usage',()=>{
 const s=shop();s.shop.main=[card('c_pluto','planet')];const before=structuredClone(s),bought=act(s,'BUY_SHOP_CARD',{offerId:'planet'});assert.equal(bought.error,null);
 assert.equal(bought.state.money,s.money-3n);assert.equal(bought.state.jokers.length,0);assert.equal(bought.state.consumables.length,1);assert.deepEqual(reload(bought.state),bought.state);assert.deepEqual(s,before);
 const used=act(bought.state,'USE_CONSUMABLE',{cardId:'planet'});assert.equal(used.error,null);assert.equal(used.state.handLevels.high_card,2);assert.equal(used.state.consumables.length,0);assert.equal(used.state.lastTarotPlanet,'c_pluto');assert.equal(used.state.consumableUsageTotal.planet,1);assert.deepEqual(reload(used.state),used.state);
 assert.equal(act(used.state,'USE_CONSUMABLE',{cardId:'planet',expectedRevision:bought.state.revision}).error.code,'STALE_ACTION');assert.equal(act(used.state,'USE_CONSUMABLE',{cardId:'planet'}).error.code,'CARD_NOT_FOUND');
});
test('full consumable slots refuse purchase atomically and negative card supplies its own slot',()=>{
 const s=shop();s.consumables=[card('c_mercury','owned1'),card('c_venus','owned2')];s.shop.main=[card('c_pluto','offer')];const before=structuredClone(s),r=act(s,'BUY_SHOP_CARD',{offerId:'offer'});assert.equal(r.error.code,'NO_SPACE');assert.equal(r.state,s);assert.deepEqual(s,before);
 s.shop.main[0].edition='negative';const negative=act(s,'BUY_SHOP_CARD',{offerId:'offer'});assert.equal(negative.error,null);assert.equal(negative.state.consumables.length,3);assert.deepEqual(reload(negative.state),negative.state);
});
test('Black Hole upgrades all twelve hands and save corruption in usage is rejected',()=>{
 const s=createRun('BH',{runId:'bh',money:4n,referenceRng:true,referenceShop:true});s.consumables=[card('c_black_hole')];const r=act(s,'USE_CONSUMABLE',{cardId:'c_black_hole'});assert.equal(r.error,null);assert.ok(Object.values(r.state.handLevels).every(n=>n===2));assert.deepEqual(reload(r.state),r.state);
 for(const mutate of [s=>s.consumableUsageTotal.all++,s=>s.consumableUsage.c_black_hole.order=999,s=>s.lastTarotPlanet='c_black_hole',s=>s.consumableUsage.c_black_hole.count=-1]){const bad=structuredClone(r.state);mutate(bad);assert.throws(()=>serializeState(bad));}
});
test('legacy state without usage fields migrates on first implemented use and unsupported Tarot remains unavailable',()=>{
 const s=createRun('legacy12',{runId:'legacy12',money:4n});delete s.consumableUsage;delete s.consumableUsageTotal;delete s.lastTarotPlanet;s.consumables=[card('c_mercury')];const saved=reload(s),r=act(saved,'USE_CONSUMABLE',{cardId:'c_mercury'});assert.equal(r.error,null);assert.equal(r.state.handLevels.pair,2);assert.deepEqual(reload(r.state),r.state);
 const native=shop();native.shop.main=[card('c_devil')];assert.equal(act(native,'BUY_SHOP_CARD',{offerId:'c_devil'}).error.code,'UNSUPPORTED_CONTENT');
});

test('debuffed Planet and Black Hole are consumed and counted without changing levels',()=>{
 for(const key of ['c_pluto','c_black_hole']){
  const s=createRun('debuffed12',{runId:'debuffed12',money:4n});s.consumables=[{...card(key),debuffed:true}];s.handLevels.high_card=Number.MAX_SAFE_INTEGER;
  const before=reload(s),r=act(before,'USE_CONSUMABLE',{cardId:key});assert.equal(r.error,null);assert.deepEqual(r.state.handLevels,before.handLevels);assert.equal(r.state.consumables.length,0);assert.equal(r.state.consumableUsage[key].count,1);assert.equal(r.state.consumableUsageTotal.all,1);assert.equal(r.events.filter(e=>e.type==='hand_level_changed').length,0);assert.deepEqual(reload(r.state),r.state);
 }
});
