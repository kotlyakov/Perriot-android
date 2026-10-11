import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {canUseConsumable} from '../../src/core/consumables.js';
import {scoreHand} from '../../src/core/score.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {describeShopItem} from '../../src/content/shop-display.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';

const centre=key=>catalogue.centres.find(card=>card.key===key);
const consumable=key=>{const c=centre(key);return {id:key+'-owned',entityId:key,originalKey:key,set:c.set,edition:'base',cost:BigInt(c.cost),sellCost:1n};};
const reload=state=>deserializeState(serializeState(state));
function run(key){let state=createRun('ENHANCE15',{runId:'enhance15',money:4n});state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;state.consumables=[consumable(key)];return state;}
const use=(state,targetCardIds)=>dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:state.consumables[0].id,targetCardIds});

test('Empress and Hierophant accept one or two unique hand targets only',()=>{
 for(const key of ['c_empress','c_heirophant'])for(const count of [1,2]){
  const state=run(key),targets=state.hand.slice(0,count);
  assert.equal(canUseConsumable(state,state.consumables[0],targets).available,true);
  assert.equal(use(state,targets).error,null);
 }
 for(const targets of [[],['missing'],['same','same']]){
  const state=run('c_empress'),actual=targets[0]==='same'?[state.hand[0],state.hand[0]]:targets,before=structuredClone(state),result=use(state,actual);
  assert.equal(result.error.code,'INVALID_TARGETS');assert.equal(result.state,state);assert.deepEqual(state,before);
 }
 {const state=run('c_empress'),result=use(state,state.hand.slice(0,3));assert.equal(result.error.code,'INVALID_TARGETS');}
 {const state=run('c_empress'),result=use(state,[state.drawPile[0]]);assert.equal(result.error.code,'INVALID_TARGETS');}
});

test('targeted Tarot conversion overwrites enhancement and preserves card identity',()=>{
 for(const [key,want] of [['c_empress','mult'],['c_heirophant','bonus']]){
  const state=run(key),targets=state.hand.slice(0,2);state.cards[targets[0]].enhancement=want==='mult'?'bonus':'mult';const originals=targets.map(id=>structuredClone(state.cards[id]));
  const result=use(state,targets);assert.equal(result.error,null);assert.equal(result.state.consumables.length,0);
  targets.forEach((id,index)=>assert.deepEqual(result.state.cards[id],{...originals[index],enhancement:want}));
  assert.deepEqual(result.events.filter(e=>e.type==='card_enhanced').map(e=>[e.cardId,e.enhancement]),targets.map(id=>[id,want]));
  assert.deepEqual(result.state.consumableUsage[key],{count:1,order:centre(key).order,set:'Tarot'});assert.equal(result.state.lastTarotPlanet,key);
  assert.deepEqual(reload(result.state),result.state);
 }
});

test('debuffed enhancement Tarot still consumes and counts but leaves targets unchanged',()=>{
 const state=run('c_empress'),targets=state.hand.slice(0,2);state.consumables[0].debuffed=true;const before=targets.map(id=>structuredClone(state.cards[id]));
 const result=use(state,targets);assert.equal(result.error,null);assert.equal(result.state.consumables.length,0);assert.deepEqual(targets.map(id=>result.state.cards[id]),before);assert.deepEqual(result.events.filter(e=>e.type==='card_enhanced'),[]);assert.equal(result.state.consumableUsage.c_empress.count,1);
});

test('Bonus and Mult apply only to scoring cards in native per-card order',()=>{
 const base={jokers:[],handLevels:{pair:1,high_card:1}};
 const pair=[{id:'a',rank:8,suit:'clubs',enhancement:'bonus'},{id:'b',rank:8,suit:'hearts',enhancement:'mult'},{id:'k',rank:14,suit:'spades',enhancement:'bonus'}];
 const result=scoreHand(base,pair);assert.equal(result.chips,56n);assert.equal(result.mult,6n);assert.equal(result.score,336n);
 assert.deepEqual(result.trace.filter(e=>e.phase==='scored_card').map(e=>[e.sourceId,e.operation,e.after.chips,e.after.mult]),[
  ['a','add_chips',18n,2n],['a','add_chips',48n,2n],['b','add_chips',56n,2n],['b','add_mult',56n,6n],
 ]);
 const splash=scoreHand({jokers:[{id:'s',entityId:'joker_splash'}],handLevels:{pair:1}},pair);
 assert.equal(splash.chips,97n); // kicker rank 11 plus its +30 Bonus
});

test('boss-debuffed enhanced cards form the hand but award neither rank nor enhancement',()=>{
 const cards=[{id:'a',rank:8,suit:'clubs',enhancement:'bonus'},{id:'b',rank:8,suit:'clubs',enhancement:'mult'}];
 const result=scoreHand({jokers:[],handLevels:{pair:1},bossState:{id:'bl_club'}},cards);
 assert.equal(result.handId,'pair');assert.equal(result.chips,10n);assert.equal(result.mult,2n);assert.equal(result.score,20n);assert.equal(result.trace.filter(e=>e.phase==='scored_card').length,0);
});

test('playing-card enhancement codec is strict and legacy cards remain compatible',()=>{
 const state=run('c_empress'),id=state.hand[0];assert.doesNotThrow(()=>reload(state));
 for(const enhancement of ['base','mult','bonus']){const copy=structuredClone(state);copy.cards[id].enhancement=enhancement;assert.equal(reload(copy).cards[id].enhancement,enhancement);}
 for(const enhancement of ['gold','',null,false]){const copy=structuredClone(state);copy.cards[id].enhancement=enhancement;assert.throws(()=>serializeState(copy));}
});

test('APK shop enhancement identities derive from cards and forged saved context is rejected',()=>{
 let state=createRun('ENHANCECTX',{runId:'enhance-context',money:4n,referenceRng:true,referenceShop:true});const id=Object.keys(state.cards)[0];state.cards[id].enhancement='mult';state.apkShop.context=currentApkShopContext(state);
 assert.deepEqual(state.apkShop.context.enhancementIds,['m_mult']);assert.deepEqual(reload(state),state);
 const forged=structuredClone(state);forged.apkShop.context.enhancementIds=[];assert.throws(()=>serializeState(forged));
});

test('implemented enhancement Tarots expose truthful descriptions',()=>{
 assert.equal(describeShopItem(consumable('c_empress')).description,'Усиливает до 2 выбранных карт: каждая даёт +4 к множителю при подсчёте.');
 assert.equal(describeShopItem(consumable('c_heirophant')).description,'Усиливает до 2 выбранных карт: каждая даёт +30 очков при подсчёте.');
});
