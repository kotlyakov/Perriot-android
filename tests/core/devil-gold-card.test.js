import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {canUseConsumable} from '../../src/core/consumables.js';
import {getCashout} from '../../src/core/cashout.js';
import {chooseHookDiscards} from '../../src/core/boss-effects.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {scoreHand} from '../../src/core/score.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {describeShopItem} from '../../src/content/shop-display.js';

const centre=key=>catalogue.centres.find(card=>card.key===key);
const devil=()=>{const c=centre('c_devil');return {id:'devil',entityId:c.key,originalKey:c.key,set:c.set,edition:'base',cost:3n,sellCost:1n};};
const reload=state=>deserializeState(serializeState(state));
function run(){
 let state=createRun('GOLD022',{runId:'gold',money:4n,referenceRng:true,referenceShop:true});
 state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;
 state.consumables=[devil()];state.apkShop.context=currentApkShopContext(state);return state;
}
const use=(state,targetCardIds)=>dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:'devil',targetCardIds});
function round({money=4n,target=1n,bossState=null}={}){
 const state=createRun('GOLDROUND',{runId:'gold-round',money});
 state.phase='playing';state.revision=1;state.round.target=target;state.round.handsRemaining=2;
 state.hand=['card_hearts_10','card_hearts_11','card_hearts_12','card_hearts_13','card_hearts_14','card_clubs_2','card_diamonds_3','card_spades_4'];
 state.drawPile=Object.keys(state.cards).filter(id=>!state.hand.includes(id));
 state.cards['card_clubs_2'].enhancement='gold';state.cards['card_diamonds_3'].enhancement='gold';
 if(bossState)state.bossState=bossState;
 return state;
}
const play=(state,ids=state.hand.slice(0,5))=>dispatch(state,{type:'PLAY_HAND',expectedRevision:state.revision,cardIds:ids});

test('Devil accepts exactly one current-hand target and rejects invalid targets atomically',()=>{
 const valid=run(),target=valid.hand[0];assert.equal(canUseConsumable(valid,valid.consumables[0],[target]).available,true);
 for(const targets of [[],valid.hand.slice(0,2),[valid.drawPile[0]],['missing']]){const state=run(),before=structuredClone(state),result=use(state,targets);assert.equal(result.error.code,'INVALID_TARGETS');assert.equal(result.state,state);assert.deepEqual(state,before);}
});

test('Devil replaces an enhancement with Gold, preserves identity, uses no RNG and persists m_gold',()=>{
 const state=run(),target=state.hand[0],before=structuredClone(state.cards[target]),rng=structuredClone(state.rng);state.cards[target].enhancement='stone';state.apkShop.context=currentApkShopContext(state);
 const result=use(state,[target]);assert.equal(result.error,null);assert.deepEqual(result.state.cards[target],{...before,enhancement:'gold'});
 assert.deepEqual(result.events.filter(event=>event.type==='card_enhanced'),[{type:'card_enhanced',cardId:target,enhancement:'gold',sourceId:'devil'}]);
 assert.deepEqual(result.state.consumableUsage.c_devil,{count:1,order:centre('c_devil').order,set:'Tarot'});assert.equal(result.state.lastTarotPlanet,'c_devil');
 assert.deepEqual(result.state.apkShop.context.enhancementIds,['m_gold']);assert.deepEqual(result.state.rng,rng);assert.deepEqual(reload(result.state),result.state);
});

test('debuffed Devil consumes and counts without changing its target',()=>{
 const state=run(),target=state.hand[0],before=structuredClone(state.cards[target]);state.consumables[0].debuffed=true;
 const result=use(state,[target]);assert.equal(result.error,null);assert.deepEqual(result.state.cards[target],before);assert.equal(result.state.consumables.length,0);
 assert.deepEqual(result.events.filter(event=>event.type==='card_enhanced'),[]);assert.equal(result.state.consumableUsage.c_devil.count,1);
});

test('Gold retains rank and suit for ordinary scoring and pays nothing before round end',()=>{
 const state=round({target:9999n}),before=state.money,result=play(state,['card_hearts_10']);assert.equal(result.error,null);assert.equal(result.state.phase,'playing');assert.equal(result.state.money,before);
 assert.equal(result.state.lastScore.chips,15n);assert.equal(result.state.lastScore.score,15n);assert.equal(result.events.some(event=>event.type==='gold_card_paid'),false);
});

test('winning round pays eligible held Gold in hand order before cashout interest',()=>{
 const state=round(),result=play(state);assert.equal(result.error,null);assert.equal(result.state.phase,'round_won');assert.equal(result.state.money,10n);
 assert.deepEqual(result.events.filter(event=>event.type==='gold_card_paid'),[
  {type:'gold_card_paid',cardId:'card_clubs_2',amount:3n},{type:'gold_card_paid',cardId:'card_diamonds_3',amount:3n},
 ]);
 assert.deepEqual(result.events.filter(event=>event.type==='money_changed').at(-1),{type:'money_changed',before:4n,after:10n,delta:6n});
 assert.deepEqual(getCashout(result.state),{reward:3n,hands:1n,interest:2n,total:6n});assert.deepEqual(reload(result.state),result.state);
 const paid=dispatch(reload(result.state),{type:'CASH_OUT',expectedRevision:result.state.revision});assert.equal(paid.state.money,16n);assert.equal(dispatch(paid.state,{type:'CASH_OUT',expectedRevision:paid.state.revision}).error.code,'INVALID_PHASE');
});

test('played, losing and boss-debuffed Gold do not pay; face-down Gold does',()=>{
 let state=round();let result=play(state,['card_hearts_10','card_hearts_11','card_hearts_12','card_hearts_13','card_clubs_2']);assert.equal(result.state.money,7n);assert.deepEqual(result.events.filter(e=>e.type==='gold_card_paid').map(e=>e.cardId),['card_diamonds_3']);
 state=round({target:9999n});state.round.handsRemaining=1;result=play(state);assert.equal(result.state.phase,'game_over');assert.equal(result.state.money,4n);
 state=round({bossState:{id:'bl_club',playedBeforeBoss:[]}});result=play(state);assert.equal(result.state.money,7n);assert.deepEqual(result.events.filter(e=>e.type==='gold_card_paid').map(e=>e.cardId),['card_diamonds_3']);
 state=round({bossState:{id:'bl_house',playedBeforeBoss:[],hiddenCardIds:['card_clubs_2']}});result=play(state);assert.equal(result.state.money,10n);
});

test('Hook-forced Gold discards are excluded from the end-round payout',()=>{
 const state=round();state.bossState={id:'bl_hook',playedBeforeBoss:[]};state.rng.apk=run().rng.apk;
 const played=state.hand.slice(0,5),remaining=state.hand.slice(5),forced=chooseHookDiscards(state.rng.apk,remaining).cardIds;
 for(const id of remaining)state.cards[id].enhancement='gold';
 const result=play(state,played);assert.deepEqual([...result.events.find(event=>event.type==='cards_forced_discarded').cardIds].sort(),[...forced].sort());
 assert.equal(result.state.money,4n+3n*BigInt(remaining.length-forced.length));assert.equal(result.events.filter(event=>event.type==='gold_card_paid').length,remaining.length-forced.length);
});

test('Gold state, copy and own marker are strict and truthful',()=>{
 const state=round();assert.deepEqual(reload(state),state);const forged=structuredClone(state);forged.cards['card_spades_4'].enhancement='future';assert.throws(()=>serializeState(forged));
 assert.equal(describeShopItem(devil()).description,'Усиливает 1 выбранную карту до Золотой: она даёт $3, если остаётся в руке в конце раунда.');
 const css=readFileSync(new URL('../../web/styles.css',import.meta.url),'utf8');assert.match(css,/data-enhancement=gold[^\n]+\$3 В КОНЦЕ/);
 const scored=scoreHand({handLevels:{high_card:1},jokers:[]},[{id:'gold',rank:14,suit:'spades',enhancement:'gold'}]);assert.equal(scored.chips,16n);assert.equal(scored.mult,1n);
});
