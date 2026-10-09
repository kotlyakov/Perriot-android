import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {canUseConsumable} from '../../src/core/consumables.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {describeShopItem} from '../../src/content/shop-display.js';

const centre=key=>catalogue.centres.find(card=>card.key===key);
const card=(key,id=key,extra={})=>{const c=centre(key);return {id,entityId:key,originalKey:key,set:c.set,edition:'base',cost:BigInt(c.cost),sellCost:1n,...extra};};
const use=(state,id=state.consumables[0].id)=>dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:id});
const reload=state=>deserializeState(serializeState(state));
function run(key,{money=4n,jokers=[]}={}){const state=createRun('TAROT14',{runId:'tarot14',money});state.consumables=[card(key)];state.jokers=jokers;return state;}

test('Hermit grants current nonnegative money capped at twenty without RNG or hand changes',()=>{
 for(const [money,delta] of [[-5n,0n],[0n,0n],[7n,7n],[20n,20n],[31n,20n]]){
  const state=run('c_hermit',{money}),before=structuredClone(state),result=use(state);assert.equal(result.error,null);assert.equal(result.state.money,money+delta);assert.deepEqual(result.state.handLevels,state.handLevels);assert.deepEqual(result.state.rng,state.rng);assert.deepEqual(state,before);
  assert.deepEqual(result.events.filter(event=>event.type==='money_changed'),[{type:'money_changed',before:money,after:money+delta,delta}]);assert.deepEqual(reload(result.state),result.state);
 }
});

test('Temperance grants stored Joker sell values capped at fifty',()=>{
 for(const [values,delta] of [[[],0n],[[2n,7n,13n],22n],[[30n,40n],50n]]){
  const jokers=values.map((sellCost,index)=>({id:'joker-'+index,entityId:'joker_joker',edition:'base',sellCost}));const state=run('c_temperance',{money:3n,jokers}),result=use(state);
  assert.equal(result.error,null);assert.equal(result.state.money,3n+delta);assert.equal(result.events.find(event=>event.type==='money_changed').delta,delta);assert.deepEqual(result.state.jokers,jokers);assert.deepEqual(reload(result.state),result.state);
 }
});

test('targetless Tarot use records exact Tarot totals and last key; debuff consumes without payout',()=>{
 let state=run('c_hermit',{money:8n});let result=use(state);assert.deepEqual(result.state.consumableUsage.c_hermit,{count:1,order:10,set:'Tarot'});assert.deepEqual(result.state.consumableUsageTotal,{tarot:1,planet:0,spectral:0,tarot_planet:1,all:1});assert.equal(result.state.lastTarotPlanet,'c_hermit');
 state=run('c_temperance',{money:8n,jokers:[{id:'joker',entityId:'joker_joker',edition:'base',sellCost:11n}]});state.consumables[0].debuffed=true;result=use(state);assert.equal(result.error,null);assert.equal(result.state.money,8n);assert.equal(result.state.consumables.length,0);assert.equal(result.state.consumableUsage.c_temperance.count,1);assert.deepEqual(result.events.filter(event=>event.type==='money_changed'),[]);
});

test('Hermit and Temperance can be bought into consumable slots and used once',()=>{
 for(const key of ['c_hermit','c_temperance']){
  let state=createRun('TAROTSHOP',{runId:'tarot-shop',money:30n,referenceRng:true,referenceShop:true});state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;state.phase='round_won';state.round.score=state.round.target;state=dispatch(state,{type:'CASH_OUT',expectedRevision:state.revision}).state;state.shop.main=[card(key,'offer')];
  const bought=dispatch(state,{type:'BUY_SHOP_CARD',expectedRevision:state.revision,offerId:'offer'});assert.equal(bought.error,null);assert.equal(bought.state.consumables[0].entityId,key);const used=use(bought.state,'offer');assert.equal(used.error,null);assert.equal(used.state.consumables.length,0);assert.deepEqual(reload(used.state),used.state);
 }
});

test('invalid money/sell values and counter overflow reject Tarot use atomically',()=>{
 const cases=[s=>{s.money=1;},s=>{s.jokers=[{id:'joker',entityId:'joker_joker',sellCost:-1n}];},s=>{s.jokers=[{id:'joker',entityId:'joker_joker'}];},s=>{s.consumableUsageTotal.tarot=Number.MAX_SAFE_INTEGER;}];
 for(const change of cases){const state=run('c_temperance');change(state);const before=structuredClone(state),result=use(state);assert.ok(result.error);assert.equal(result.state,state);assert.deepEqual(state,before);assert.equal(canUseConsumable(state,state.consumables[0]).available,false);}
});

test('implemented money Tarot cards expose truthful Russian descriptions',()=>{
 assert.deepEqual(describeShopItem(card('c_hermit')), {name:'Отшельник',description:'Удваивает текущие деньги, но добавляет не более $20.',canBuy:true});
 assert.deepEqual(describeShopItem(card('c_temperance')), {name:'Умеренность',description:'Даёт сумму стоимости продажи всех ваших джокеров, но не более $50.',canBuy:true});
});
