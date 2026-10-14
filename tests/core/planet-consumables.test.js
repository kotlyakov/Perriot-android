import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../../src/core/run.js';
import {canUseConsumable,applyConsumableAction} from '../../src/core/consumables.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
const mapping={c_pluto:'high_card',c_mercury:'pair',c_uranus:'two_pair',c_venus:'three_of_a_kind',c_saturn:'straight',c_jupiter:'flush',c_earth:'full_house',c_mars:'four_of_a_kind',c_neptune:'straight_flush',c_planet_x:'five_of_a_kind',c_ceres:'flush_house',c_eris:'flush_five'};
const card=key=>{const c=catalogue.centres.find(c=>c.key===key);return {id:key+'-owned',entityId:key,originalKey:key,set:c.set,cost:BigInt(c.cost),sellCost:1n};};
const fresh=(key='c_pluto')=>{const s=createRun('planet',{runId:'planet',money:4n,referenceRng:true,referenceShop:true});s.consumables=[card(key)];s.apkShop.context=currentApkShopContext(s);return s;};
const use=(s,fields={})=>applyConsumableAction(s,{type:'USE_CONSUMABLE',cardId:s.consumables[0]?.id,expectedRevision:s.revision,...fields});
for(const [key,handId] of Object.entries(mapping))test(key+' levels its exact APK hand once without discovery or RNG',()=>{
 const s=fresh(key),before=structuredClone(s),r=use(s),centre=catalogue.centres.find(c=>c.key===key);
 assert.equal(canUseConsumable(s,s.consumables[0]).available,true);assert.equal(r.error,null);
 const levels={...s.handLevels,[handId]:2};assert.deepEqual(r.state.handLevels,levels);
 assert.deepEqual(r.state.consumables,[]);assert.equal(r.state.lastScore,null);assert.equal(r.state.revision,s.revision+1);
 assert.deepEqual(r.state.consumableUsage,{[key]:{count:1,order:centre.order,set:'Planet'}});
 assert.deepEqual(r.state.consumableUsageTotal,{tarot:0,planet:1,spectral:0,tarot_planet:1,all:1});assert.equal(r.state.lastTarotPlanet,key);
 assert.deepEqual(r.state.discoveredHands,s.discoveredHands);assert.deepEqual(r.state.rng,s.rng);assert.deepEqual(r.state.round,s.round);assert.equal(r.state.money,s.money);assert.equal(r.state.consumableSlots,s.consumableSlots);
 assert.ok(!r.state.apkShop.context.ownedCentreIds.includes(key));assert.ok(!r.state.apkShop.context.usedCentreIds.includes(key));assert.deepEqual(s,before);
 assert.deepEqual(r.events.filter(e=>e.type==='hand_level_changed'),[{type:'hand_level_changed',handId,levels:1,level:2}]);
 assert.equal(use(r.state,{cardId:s.consumables[0].id,expectedRevision:s.revision}).error.code,'STALE_ACTION');
 assert.equal(use(r.state,{cardId:s.consumables[0].id}).error.code,'CARD_NOT_FOUND');
});
test('Black Hole levels all twelve hands and records Spectral usage without replacing last Planet',()=>{
 const s=fresh('c_black_hole');s.lastTarotPlanet='c_pluto';s.handLevels.flush_five=8;
 const r=use(s);assert.equal(r.error,null);assert.deepEqual(r.state.handLevels,Object.fromEntries(Object.entries(s.handLevels).map(([id,level])=>[id,level+1])));
 assert.equal(r.events.filter(e=>e.type==='hand_level_changed').length,12);assert.equal(r.state.lastTarotPlanet,'c_pluto');assert.deepEqual(r.state.rng,s.rng);
 assert.deepEqual(r.state.consumableUsageTotal,{tarot:0,planet:0,spectral:1,tarot_planet:0,all:1});assert.deepEqual(r.state.discoveredHands,s.discoveredHands);
});
test('all ordinary inventory phases allow targetless use; unsupported effects and transient phases block it',()=>{
 for(const phase of ['blind_selection','playing','round_won','shop']){const s=fresh();s.phase=phase;if(phase==='round_won')s.round.score=s.round.target;assert.equal(use(s).error,null);}
 for(const phase of ['game_over','victory','scoring','pack']){const s=fresh();s.phase=phase;assert.equal(canUseConsumable(s,s.consumables[0]).available,false);assert.equal(use(s).error.code,'INVALID_PHASE');}
 for(const key of ['c_fool','c_ankh']){const s=fresh(key);assert.equal(canUseConsumable(s,s.consumables[0]).available,false);assert.equal(use(s).error.code,'USE_UNAVAILABLE');}
 const s=fresh();assert.equal(canUseConsumable(s,{...s.consumables[0],id:'foreign'}).available,false);assert.equal(use(s,{cardId:'foreign'}).error.code,'CARD_NOT_FOUND');
});
test('malformed state/action and every increment overflow reject atomically',()=>{
 const cases=[s=>{s.revision=Number.MAX_SAFE_INTEGER;},s=>{s.handLevels.high_card=Number.MAX_SAFE_INTEGER;},s=>{s.handLevels.high_card=0;},s=>{s.handLevels.high_card=1.5;},s=>{s.consumables.push({...s.consumables[0]});},s=>{s.consumables[0].originalKey='c_mercury';},s=>{s.consumableUsage={c_pluto:{count:Number.MAX_SAFE_INTEGER,order:9,set:'Planet'}};},s=>{s.consumableUsageTotal={tarot:0,planet:Number.MAX_SAFE_INTEGER,spectral:0,tarot_planet:0,all:0};},s=>{s.consumableUsageTotal={tarot:0,planet:0,spectral:0,tarot_planet:Number.MAX_SAFE_INTEGER,all:0};},s=>{s.consumableUsageTotal={tarot:0,planet:0,spectral:0,tarot_planet:0,all:Number.MAX_SAFE_INTEGER};},s=>{s.consumableUsageTotal={all:0};}];
 for(const change of cases){const s=fresh();change(s);const before=structuredClone(s),r=use(s);assert.ok(r.error);assert.equal(r.state,s);assert.deepEqual(r.events,[]);assert.deepEqual(s,before);assert.equal(canUseConsumable(s,s.consumables[0]).available,false);}
 const s=fresh();for(const action of [null,{}, {type:'SELL',expectedRevision:0},{type:'USE_CONSUMABLE',cardId:s.consumables[0].id},{type:'USE_CONSUMABLE',expectedRevision:0,cardId:4}])assert.equal(applyConsumableAction(s,action).error.code,'INVALID_ACTION');
 const black=fresh('c_black_hole');black.handLevels.flush_five=Number.MAX_SAFE_INTEGER;assert.ok(use(black).error);
});
test('repeat uses accumulate counts and preserve native duplicate eligibility from another owned card',()=>{
 const s=fresh();s.consumableUsage=Object.fromEntries([['c_pluto',3],['c_fool',2],['c_ankh',1]].map(([key,count])=>{const c=catalogue.centres.find(c=>c.key===key);return [key,{count,order:c.order,set:c.set}];}));s.consumableUsageTotal={tarot:2,planet:3,spectral:1,tarot_planet:5,all:6};s.consumables.push({...card('c_pluto'),id:'second'});
 const r=use(s);assert.equal(r.error,null);assert.equal(r.state.consumableUsage.c_pluto.count,4);assert.deepEqual(r.state.consumableUsageTotal,{tarot:2,planet:4,spectral:1,tarot_planet:6,all:7});assert.ok(r.state.apkShop.context.usedCentreIds.includes('c_pluto'));
 const legacy=createRun('legacy',{runId:'legacy',money:0n});legacy.consumables=[card('c_pluto')];assert.equal(use(legacy).error,null);
});

test('using a card preserves unbought shop duplicate offers and rejects Spectral counter overflow',()=>{
 const s=fresh();s.shop={main:[card('c_pluto')],vouchers:[],boosters:[]};
 const r=use(s);assert.equal(r.error,null);assert.deepEqual(r.state.apkShop.context.ownedCentreIds,[]);assert.ok(r.state.apkShop.context.usedCentreIds.includes('c_pluto'));
 const black=fresh('c_black_hole');black.consumableUsageTotal={tarot:0,planet:0,spectral:Number.MAX_SAFE_INTEGER,tarot_planet:0,all:0};
 const before=structuredClone(black),rejected=use(black);assert.equal(rejected.error.code,'INVALID_STATE');assert.equal(rejected.state,black);assert.deepEqual(black,before);
});
