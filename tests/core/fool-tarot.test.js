import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {generateApkFoolCard} from '../../src/core/apk-shop.js';
import {nextApkMathRandom} from '../../src/core/apk-rng.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {canUseConsumable} from '../../src/core/consumables.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';

const centre=key=>catalogue.centres.find(card=>card.key===key);
const card=(key,id=key,extra={})=>{const c=centre(key);return {id,entityId:key,originalKey:key,set:c.set,edition:'base',cost:BigInt(c.cost),sellCost:BigInt(Math.floor(c.cost/2)),...extra};};
const reload=state=>deserializeState(serializeState(state));
const use=(state,id='fool-card')=>dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:id});
function run(lastTarotPlanet='c_pluto',extra={}){const state=createRun('FOOL15',{runId:'fool15',money:7n});state.lastTarotPlanet=lastTarotPlanet;state.consumables=[card('c_fool','fool-card',extra)];return state;}

test('Fool is unavailable until a non-Fool Tarot or Planet was used',()=>{
 for(const last of [null,'c_fool']){const state=run(last),before=structuredClone(state),capability=canUseConsumable(state,state.consumables[0]),result=use(state);assert.equal(capability.available,false);assert.equal(capability.code,'USE_UNAVAILABLE');assert.equal(result.error.code,'USE_UNAVAILABLE');assert.equal(result.state,state);assert.deepEqual(state,before);}
 assert.equal(canUseConsumable(run('c_hermit'),run('c_hermit').consumables[0]).available,true);
});

test('legacy Fool creates the previous Tarot or Planet once without legacy RNG or economy changes',()=>{
 const state=run('c_pluto'),before=structuredClone(state),result=use(state);assert.equal(result.error,null);assert.equal(result.state.money,state.money);assert.deepEqual(result.state.rng,state.rng);assert.deepEqual(result.state.handLevels,state.handLevels);assert.deepEqual(state,before);
 assert.deepEqual(result.state.consumables,[card('c_pluto','fool:fool-card')]);assert.deepEqual(result.events.filter(event=>event.type==='consumable_created'),[{type:'consumable_created',sourceId:'fool-card',cardId:'fool:fool-card',entityId:'c_pluto',set:'Planet'}]);
 assert.deepEqual(result.state.consumableUsage.c_fool,{count:1,order:1,set:'Tarot'});assert.deepEqual(result.state.consumableUsageTotal,{tarot:1,planet:0,spectral:0,tarot_planet:1,all:1});assert.equal(result.state.lastTarotPlanet,'c_fool');assert.deepEqual(reload(result.state),result.state);
});

test('Fool frees its own slot before creating and may duplicate an owned centre',()=>{
 const state=run('c_hermit');state.consumables.push(card('c_hermit','held-hermit'));const result=use(state);assert.equal(result.error,null);assert.deepEqual(result.state.consumables.map(c=>[c.id,c.entityId]),[['held-hermit','c_hermit'],['fool:fool-card','c_hermit']]);assert.equal(result.state.consumables.length,2);assert.deepEqual(reload(result.state),result.state);
});

test('Fool can reproduce a currently unsupported Tarot as a truthful owned card',()=>{
 const result=use(run('c_magician'));assert.equal(result.error,null);assert.deepEqual(result.state.consumables,[card('c_magician','fool:fool-card')]);assert.equal(canUseConsumable(result.state,result.state.consumables[0]).available,false);assert.deepEqual(reload(result.state),result.state);
});

test('debuffed Fool is consumed and counted but creates nothing',()=>{
 const state=run('c_pluto',{debuffed:true}),result=use(state);assert.equal(result.error,null);assert.deepEqual(result.state.consumables,[]);assert.equal(result.state.lastTarotPlanet,'c_fool');assert.equal(result.state.consumableUsage.c_fool.count,1);assert.deepEqual(result.events.filter(event=>event.type==='consumable_created'),[]);assert.deepEqual(result.state.rng,state.rng);
});

test('Fool rejects a generated instance collision atomically',()=>{
 const state=run('c_pluto');state.jokers=[{id:'fool:fool-card',entityId:'j_joker',edition:'base',cost:4n,sellCost:2n}];const before=structuredClone(state),result=use(state);assert.equal(result.error.code,'INVALID_STATE');assert.equal(canUseConsumable(state,state.consumables[0]).available,false);assert.equal(result.state,state);assert.deepEqual(state,before);assert.deepEqual(result.events,[]);
});

test('Fool may be bought before it becomes usable and later creates its copy',()=>{
 let state=createRun('FOOLSHOP',{runId:'fool-shop',money:20n});state.phase='shop';state.shop={main:[card('c_fool','offer')],vouchers:[],boosters:[],rerollBase:5n,rerollIncrease:0n,freeRerolls:0};let result=dispatch(state,{type:'BUY_SHOP_CARD',expectedRevision:state.revision,offerId:'offer'});assert.equal(result.error,null);assert.equal(result.state.money,17n);assert.equal(canUseConsumable(result.state,result.state.consumables[0]).available,false);
 state=result.state;state.lastTarotPlanet='c_temperance';result=dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:'offer'});assert.equal(result.error,null);assert.equal(result.state.consumables[0].entityId,'c_temperance');
});

// Native construction consumes visual Math RNG, but no keyed selection stream for a forced centre.
test('native Fool copy advances constructor Math RNG and uses native pricing',()=>{
 for(const reducedMotion of [true,false]){
  const state=createRun('FOOLNATV',{runId:'fool-native',money:7n,referenceRng:true,referenceShop:true,reducedMotion});state.lastTarotPlanet='c_pluto';state.consumables=[card('c_fool','fool-card')];state.apkShop.context.discountPercent=50;state.apkShop.context.inflation=2;state.apkShop.context=currentApkShopContext(state);
  let math=state.rng.apk.mathState;for(let i=0;i<3;i++)math=nextApkMathRandom(math).state;math=nextApkMathRandom(math).state;math=nextApkMathRandom(math).state;
  const result=use(state);assert.equal(result.error,null);assert.equal(result.state.consumables[0].cost,2n);assert.equal(result.state.consumables[0].sellCost,1n);assert.deepEqual(result.state.rng.apk.mathState,math);assert.deepEqual(result.state.rng.apk.streams,state.rng.apk.streams);assert.deepEqual(reload(result.state),result.state);
 }
});

test('negative Fool retains its slot during creation and can leave native overcapacity',()=>{
 const state=run('c_pluto',{edition:'negative'});state.consumables.push(card('c_hermit','one'),card('c_temperance','two'));
 const result=use(state);assert.equal(result.error,null);assert.deepEqual(result.state.consumables.map(c=>c.id),['one','two','fool:fool-card']);assert.equal(result.state.consumableUsage.c_fool.count,1);assert.equal(result.events.some(e=>e.type==='consumable_created'),true);assert.deepEqual(reload(result.state),result.state);
});

test('banned previous centre does not silently create a forbidden forced copy',()=>{
 const state=createRun('FOOLBAND',{runId:'fool-banned',money:7n,referenceRng:true,referenceShop:true});state.lastTarotPlanet='c_pluto';state.consumables=[card('c_fool','fool-card')];state.apkShop.context.bannedCentreIds=['c_pluto'];
 const before=structuredClone(state),result=use(state);assert.equal(result.error?.code,'USE_UNAVAILABLE');assert.equal(result.state,state);assert.deepEqual(state,before);
});

test('forced Fool centre ignores lock and softlock filters',()=>{
 const state=createRun('FOOLFREE',{runId:'fool-free',money:7n,referenceRng:true,referenceShop:true});state.lastTarotPlanet='c_eris';state.consumables=[card('c_fool','fool-card')];state.apkShop.context.lockedCentreIds=['c_eris'];state.apkShop.context=currentApkShopContext(state);
 const result=use(state);assert.equal(result.error,null);assert.equal(result.state.consumables[0].entityId,'c_eris');assert.equal(result.state.consumables[0].cost,3n);assert.equal(result.state.consumables[0].sellCost,1n);assert.deepEqual(reload(result.state),result.state);
});

test('malformed Fool shop context rejects atomically instead of throwing',()=>{
 const state=createRun('FOOLBAD',{runId:'fool-bad',money:7n,referenceRng:true,referenceShop:true});state.lastTarotPlanet='c_pluto';state.consumables=[card('c_fool','fool-card')];delete state.apkShop.context;const before=structuredClone(state);
 const result=use(state);assert.equal(result.error.code,'INVALID_STATE');assert.equal(result.state,state);assert.deepEqual(state,before);
});

test('native generated Planet pricing with Astronomer keeps minimum sell value',()=>{
 const state=createRun('FOOLPRICE',{runId:'fool-price',money:7n,referenceRng:true,referenceShop:true});const result=generateApkFoolCard(state.rng.apk,{...state.apkShop.context,ownedCentreIds:['j_astronomer']},{centreId:'c_pluto',instanceId:'copy'});assert.equal(result.card.cost,0n);assert.equal(result.card.sellCost,1n);
});

