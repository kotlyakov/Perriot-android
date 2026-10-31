import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {scoreHand} from '../../src/core/score.js';
import {applyConsumableAction} from '../../src/core/consumables.js';
import {createApkRng,createApkMathState} from '../../src/core/apk-rng.js';
import {generateApkArcanaPack} from '../../src/core/arcana-pack-generation.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const owned=key=>({id:key,entityId:key,originalKey:key,set:'Tarot',edition:'base',cost:3n,sellCost:1n});
function run(seed,key){const s=createRun(seed,{runId:'mechanics-consumables',money:4n,referenceRng:true,referenceShop:true});s.consumables=[owned(key)];return s;}
function use(s,targets=[],legacy=false){const action={type:'USE_CONSUMABLE',expectedRevision:s.revision,cardId:s.consumables[0].id,targetCardIds:targets};return legacy?applyConsumableAction(s,action):dispatch(s,action);}
for(const [leftBonus,rightBonus] of [[0,25],[30,0],[30,undefined]])test(`AU02 Death copies permanent bonus ${leftBonus} -> ${rightBonus}`,()=>{
 let s=run('AUDITDEATH','c_death');s=dispatch(s,{type:'START_BLIND',expectedRevision:s.revision}).state;
 const [left,right]=s.hand;s.cards[left].permaBonus=leftBonus;if(rightBonus!==undefined)s.cards[right].permaBonus=rightBonus;
 Object.assign(s.cards[right],{edition:'foil',seal:'red',enhancement:'bonus'});
 const r=use(s,[right,left]);assert.equal(r.error,null);assert.equal(r.state.cards[left].permaBonus,rightBonus);
 assert.equal(Object.hasOwn(r.state.cards[left],'permaBonus'),rightBonus!==undefined);
 for(const key of ['rank','suit','edition','seal','enhancement'])assert.equal(r.state.cards[left][key],s.cards[right][key]);
 assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
 r.state.jokers=[{id:'hiker',entityId:'j_hiker'},{id:'chad',entityId:'j_hanging_chad'}];
 const scored=scoreHand(r.state,[r.state.cards[left]]);assert.equal(scored.item7State.cards[left].permaBonus,(rightBonus??0)+20);
 const withoutBonus=structuredClone(r.state);delete withoutBonus.cards[left].permaBonus;
 assert.equal(scored.chips-scoreHand(withoutBonus,[withoutBonus.cards[left]]).chips,BigInt(rightBonus??0)*4n);
 delete s.mechanicsVersion;const old=use(s,[left,right],true);assert.equal(old.error,null);assert.equal(old.state.cards[left].permaBonus,leftBonus);
});
for(const [discount,rental,expectedCost,expectedSale] of [[0,false,7n,23n],[25,false,5n,22n],[0,true,1n,21n]])test(`AU03 Wheel retains extraValue discount=${discount} rental=${rental}`,()=>{
 const s=run('WHEEL3','c_wheel_of_fortune');s.apkShop.context.discountPercent=discount;
 s.jokers=[{id:'egg',entityId:'j_egg',originalKey:'j_egg',set:'Joker',edition:'base',cost:4n,sellCost:22n,extraValue:20n,creationOrdinal:1,...(rental?{rental:true}:{})}];s.nextJokerCreationOrdinal=2;
 const r=use(s);assert.equal(r.error,null);assert.equal(r.state.jokers[0].edition,'holographic');assert.equal(r.state.jokers[0].cost,expectedCost);assert.equal(r.state.jokers[0].sellCost,expectedSale);
 assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
 r.state.consumables=[owned('c_temperance')];const before=r.state.money,temperance=use(r.state);assert.equal(temperance.error,null);assert.equal(temperance.state.money-before,expectedSale);
 delete s.mechanicsVersion;const old=use(s,[],true);assert.equal(old.error,null);assert.equal(old.state.jokers[0].sellCost,expectedCost/2n||1n);
});
for(const boosterId of ['p_arcana_normal_1','p_arcana_jumbo_1','p_arcana_mega_1'])test(`AU04 inactive Showman does not alter Arcana pool or RNG ${boosterId}`,()=>{
 const rng=createApkRng('ARCANA0',createApkMathState(17)),context={ownedCentreIds:['j_ring_master','c_hermit'],activeCentreIds:[],usedCentreIds:['c_hermit']};
 const inactive=generateApkArcanaPack(rng,context,{boosterId});
 const absent=generateApkArcanaPack(rng,{...context,ownedCentreIds:['c_hermit']},{boosterId});
 assert.deepEqual(inactive,absent);assert.equal(new Set(inactive.cards.map(c=>c.entityId)).size,inactive.cards.length);
 const active=generateApkArcanaPack(rng,{...context,activeCentreIds:['j_ring_master']},{boosterId});
 const legacy=generateApkArcanaPack(rng,context,{boosterId,legacyShowman:true});assert.deepEqual(active,legacy);
 if(boosterId==='p_arcana_normal_1')assert.deepEqual(active.cards.map(c=>c.entityId),['c_sun','c_fool','c_sun']);
});

test('AU04 core Arcana open routes marked and legacy states to their generator rules',async()=>{
 const {applyCelestialPackAction}=await import('../../src/core/celestial-pack.js');
 const {currentApkShopContext}=await import('../../src/core/apk-shop-state.js');
 for(const current of [false,true]){
  const s=run('ARCANA0','c_hermit');s.money=50n;s.phase='shop';s.shop={main:[],vouchers:[],boosters:[{id:'pack',entityId:'p_arcana_normal_1',originalKey:'p_arcana_normal_1',set:'Booster',edition:'base',cost:4n,sellCost:2n}]};
  s.jokers=[{id:'showman',entityId:'j_ring_master',originalKey:'j_ring_master',set:'Joker',edition:'base',cost:5n,sellCost:2n,debuffed:true}];
  if(!current)delete s.mechanicsVersion;
  const expected=generateApkArcanaPack(s.rng.apk,currentApkShopContext(s),{boosterId:'p_arcana_normal_1',instancePrefix:`pack_${s.revision+1}`,legacyShowman:!current});
  const opened=applyCelestialPackAction(s,{type:'OPEN_BOOSTER',expectedRevision:s.revision,offerId:'pack'});assert.equal(opened.error,null);assert.deepEqual(opened.state.packState.cards,expected.cards);assert.deepEqual(opened.state.rng.apk,expected.rng);
 }
});
