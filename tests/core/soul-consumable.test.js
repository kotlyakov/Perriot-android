import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {canUseConsumable,applyConsumableAction,supportsConsumableEffect} from '../../src/core/consumables.js';
import {generateApkEffectCards,createApkShopContext} from '../../src/core/apk-shop.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import catalogue from '../../src/content/apk-shop-catalog.js';

const legendary=catalogue.centres.filter(c=>c.set==='Joker'&&c.rarity===4).sort((a,b)=>a.order-b.order).map(c=>c.key);
function fresh(seed='SOUL'){
 const state=createRun(seed,{runId:'soul-test',money:20n,referenceRng:true,referenceShop:true});
 state.consumables=[{id:'soul',entityId:'c_soul',originalKey:'c_soul',set:'Spectral',edition:'base',cost:4n,sellCost:2n}];return state;
}
const use=state=>dispatch(state,{type:'USE_CONSUMABLE',cardId:'soul',expectedRevision:state.revision});
const reload=state=>deserializeState(serializeState(state));

test('Soul creates every native legendary, records spectral usage and survives save/replay',()=>{
 const seen=new Set();
 for(let index=0;index<100;index++){
  const state=fresh(`SOUL${index}`),before=structuredClone(state),result=use(state);
  assert.equal(supportsConsumableEffect(state.consumables[0]),true);
  assert.equal(result.error,null);assert.deepEqual(result,use(reload(state)));assert.deepEqual(state,before);
  assert.equal(result.state.jokers.length,1);assert.equal(result.state.consumables.length,0);
  const joker=result.state.jokers[0];assert.ok(legendary.includes(joker.entityId));seen.add(joker.entityId);
  assert.ok(joker.creationOrdinal>0);assert.equal(typeof joker.cost,'bigint');assert.equal(result.state.money,20n);
  assert.equal(result.state.consumableUsage.c_soul.count,1);assert.equal(result.state.consumableUsageTotal.spectral,1);
  assert.equal(result.state.lastTarotPlanet,null);assert.deepEqual(reload(result.state),result.state);
  assert.ok(use(result.state).error);
 }
 assert.deepEqual([...seen].sort(),[...legendary].sort());
});

test('Soul capacity failures preserve card and RNG, Negative joker grants a slot',()=>{
 const state=fresh();state.jokers=Array.from({length:5},(_,i)=>({id:`j${i}`,entityId:'j_joker',edition:'base',sellCost:2n}));
 const before=structuredClone(state);assert.equal(canUseConsumable(state,state.consumables[0]).available,false);
 const failed=use(state);assert.ok(failed.error);assert.equal(failed.state,state);assert.deepEqual(state,before);
 state.jokers[0].edition='negative';assert.equal(use(state).state.jokers.length,6);
});

test('debuffed Soul counts use without creating a joker or drawing RNG',()=>{
 const state=fresh();state.consumables[0].debuffed=true;const result=use(state);
 assert.equal(result.error,null);assert.deepEqual(result.state.rng,state.rng);assert.deepEqual(result.state.jokers,[]);
 assert.equal(result.state.consumableUsageTotal.spectral,1);assert.equal(result.state.lastTarotPlanet,null);
});

test('legendary creation retains native rarity poll, Joker4 key, edition key and full pool fallback',()=>{
 const state=fresh(),make=(context={})=>generateApkEffectCards(state.rng.apk,createApkShopContext(context),{set:'Joker',count:1,instancePrefix:'soul-generated',append:'sou',legendary:true});
 const result=make({lockedCentreIds:legendary});assert.ok(legendary.includes(result.cards[0].entityId));
 assert.ok(Object.hasOwn(result.rng.streams,'rarity1sou'));assert.ok(Object.hasOwn(result.rng.streams,'Joker4'));
 assert.ok(Object.hasOwn(result.rng.streams,'edisou1'));assert.equal(Object.hasOwn(result.rng.streams,'Joker4sou1'),false);
 for(const wanted of legendary){
  const others=legendary.filter(key=>key!==wanted);
  assert.equal(make({bannedCentreIds:others}).cards[0].entityId,wanted);
  assert.equal(make({ownedCentreIds:others}).cards[0].entityId,wanted);
 }
 assert.equal(make({bannedCentreIds:legendary}).cards[0].entityId,'j_joker');
 assert.equal(make({ownedCentreIds:legendary}).cards[0].entityId,'j_joker');
 assert.ok(legendary.includes(make({ownedCentreIds:[...legendary,'j_ring_master']}).cards[0].entityId));
});

function stagedGenerator(key,occupied,edition='base'){
 const state=fresh();state.lastTarotPlanet='c_strength';
 state.consumables=Array.from({length:occupied},(_,i)=>({id:`occupied${i}`,entityId:'c_pluto',originalKey:'c_pluto',set:'Planet',edition:'base',cost:3n,sellCost:1n}));
 state.consumables.push({id:'pack-source',entityId:key,originalKey:key,set:'Tarot',edition,cost:3n,sellCost:1n});return state;
}

test('staged pack generators and Fool cannot free a phantom slot, including Negative source',()=>{
 for(const key of ['c_emperor','c_high_priestess','c_fool'])for(const edition of ['base','negative']){
  const state=stagedGenerator(key,2,edition),card=state.consumables.at(-1),before=structuredClone(state);
  assert.equal(canUseConsumable(state,card,[],{fromPack:true}).available,false,key);
  const result=applyConsumableAction(state,{type:'USE_CONSUMABLE',cardId:card.id,expectedRevision:state.revision},{fromPack:true});
  assert.ok(result.error);assert.equal(result.state,state);assert.deepEqual(state,before);
 }
});

test('pack generators use actual free capacity and default owned use retains freed source slot',()=>{
 for(const [key,set] of [['c_emperor','Tarot'],['c_high_priestess','Planet']])for(const occupied of [0,1]){
  const state=stagedGenerator(key,occupied),result=applyConsumableAction(state,{type:'USE_CONSUMABLE',cardId:'pack-source',expectedRevision:state.revision},{fromPack:true});
  assert.equal(result.error,null);assert.equal(result.state.consumables.length,2);assert.equal(result.events.filter(e=>e.type==='consumable_created'&&e.set===set).length,2-occupied);
 }
 const owned=stagedGenerator('c_emperor',1),result=applyConsumableAction(owned,{type:'USE_CONSUMABLE',cardId:'pack-source',expectedRevision:owned.revision});
 assert.equal(result.error,null);assert.equal(result.state.consumables.length,2);
});
