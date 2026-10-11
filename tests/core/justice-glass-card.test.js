import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createApkRng,nextApkRandom} from '../../src/core/apk-rng.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {canUseConsumable} from '../../src/core/consumables.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {scoreHand} from '../../src/core/score.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {describeShopItem} from '../../src/content/shop-display.js';

const centre=key=>catalogue.centres.find(card=>card.key===key);
const levels=()=>Object.fromEntries(['high_card','pair','two_pair','three_of_a_kind','straight','flush','full_house','four_of_a_kind','straight_flush','five_of_a_kind','flush_house','flush_five'].map(id=>[id,1]));
const card=(id,rank,suit,enhancement)=>({id,rank,suit,...(enhancement?{enhancement}:{})});
const justice=()=>{const c=centre('c_justice');return {id:'justice',entityId:c.key,originalKey:c.key,set:c.set,edition:'base',cost:3n,sellCost:1n};};
const reload=state=>deserializeState(serializeState(state));
function run(seed='GLASS2'){
 let state=createRun(seed,{runId:'glass',money:4n,referenceRng:true,referenceShop:true});
 state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;
 state.consumables=[justice()];state.apkShop.context=currentApkShopContext(state);return state;
}
const use=(state,targetCardIds)=>dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:'justice',targetCardIds});

test('Justice accepts exactly one current-hand target, overwrites its enhancement and spends no RNG',()=>{
 const state=run(),target=state.hand[0],before=structuredClone(state),rng=structuredClone(state.rng);state.cards[target].enhancement='steel';state.apkShop.context=currentApkShopContext(state);
 assert.equal(canUseConsumable(state,state.consumables[0],[target]).available,true);
 const result=use(state,[target]);assert.equal(result.error,null);assert.equal(result.state.cards[target].enhancement,'glass');
 assert.deepEqual(result.events.filter(event=>event.type==='card_enhanced'),[{type:'card_enhanced',cardId:target,enhancement:'glass',sourceId:'justice'}]);
 assert.deepEqual(result.state.apkShop.context.enhancementIds,['m_glass']);assert.deepEqual(result.state.rng,rng);assert.deepEqual(reload(result.state),result.state);
 assert.equal(before.cards[target].enhancement,undefined);
 for(const targets of [[],state.hand.slice(0,2),[state.drawPile[0]],['missing']]){const fixture=run(),snapshot=structuredClone(fixture),rejected=use(fixture,targets);assert.equal(rejected.error.code,'INVALID_TARGETS');assert.equal(rejected.state,fixture);assert.deepEqual(fixture,snapshot);}
});

test('debuffed Justice consumes and counts without changing the target',()=>{
 const state=run(),target=state.hand[0],before=structuredClone(state.cards[target]);state.consumables[0].debuffed=true;
 const result=use(state,[target]);assert.equal(result.error,null);assert.deepEqual(result.state.cards[target],before);assert.equal(result.state.consumables.length,0);
 assert.deepEqual(result.events.filter(event=>event.type==='card_enhanced'),[]);assert.deepEqual(result.state.consumableUsage.c_justice,{count:1,order:centre('c_justice').order,set:'Tarot'});
});

test('scoring Glass applies x2 before per-card Joker effects and only to scoring cards',()=>{
 const cards=[card('glass',8,'diamonds','glass'),card('pair',8,'clubs'),card('kicker',14,'diamonds','glass')];
 const state={handLevels:levels(),jokers:[{id:'greedy',entityId:'j_greedy_joker'}],rng:{apk:createApkRng('GLASS0')}};
 const result=scoreHand(state,cards);assert.equal(result.mult,7n);
 assert.deepEqual(result.trace.filter(event=>event.phase==='scored_card').map(event=>[event.sourceId,event.operation,event.effectSourceId]),[
  ['glass','add_chips',undefined],['glass','multiply_mult',undefined],['glass','add_mult','greedy'],['pair','add_chips',undefined],
 ]);
 assert.deepEqual(result.glassRolls.map(roll=>roll.cardId),['glass']);
 const splash=scoreHand({...state,jokers:[{id:'splash',entityId:'joker_splash'}]},cards);assert.deepEqual(splash.glassRolls.map(roll=>roll.cardId),['glass','kicker']);
});

test('Glass uses one keyed roll per active scoring card; boss-debuffed cards do not roll',()=>{
 const glass=card('glass',8,'diamonds','glass'),pair=card('pair',8,'clubs');
 const base={handLevels:levels(),jokers:[],rng:{apk:createApkRng('GLASS2')}};
 const expected=nextApkRandom(base.rng.apk,'glass'),result=scoreHand(base,[glass,pair]);
 assert.deepEqual(result.glassRolls,[{cardId:'glass',roll:expected.value,destroyed:true}]);assert.deepEqual(result.glassRngAfter,{glass:expected.rng.streams.glass,mathState:expected.rng.mathState});
 const debuffed=scoreHand({...base,bossState:{id:'bl_window',playedBeforeBoss:[]}},[glass,pair]);assert.equal(debuffed.glassRolls,undefined);assert.equal(debuffed.glassRngAfter,undefined);
});

test('a successful Glass roll removes the card after scoring, draws a replacement and survives reload',()=>{
 const state=run('GLASS2'),glassId=state.hand[0],pairId=state.hand[1];state.cards[glassId].rank=8;state.cards[glassId].suit='diamonds';state.cards[glassId].enhancement='glass';state.cards[pairId].rank=8;state.cards[pairId].suit='clubs';state.consumables=[];state.apkShop.context=currentApkShopContext(state);
 const beforeCount=Object.keys(state.cards).length,beforeRng=structuredClone(state.rng.apk),result=dispatch(state,{type:'PLAY_HAND',expectedRevision:state.revision,cardIds:[glassId,pairId]});
 assert.equal(result.error,null);assert.equal(result.state.lastScore.score>0n,true);assert.equal(result.state.lastScore.glassRolls[0].destroyed,true);
 assert.equal(Object.hasOwn(result.state.cards,glassId),false);assert.equal(result.state.discardPile.includes(glassId),false);assert.equal(Object.keys(result.state.cards).length,beforeCount-1);
 assert.deepEqual(result.events.filter(event=>event.type==='card_shattered'),[{type:'card_shattered',cardId:glassId}]);assert.equal(result.state.hand.length,result.state.round.handSize);
 assert.notDeepEqual(result.state.rng.apk,beforeRng);assert.deepEqual(reload(result.state),result.state);
});

test('a failed Glass roll keeps the card but commits RNG; forged replay metadata is rejected',()=>{
 const state=run('GLASS0'),glassId=state.hand[0],pairId=state.hand[1];state.cards[glassId].rank=8;state.cards[glassId].enhancement='glass';state.cards[pairId].rank=8;state.consumables=[];state.apkShop.context=currentApkShopContext(state);
 const result=dispatch(state,{type:'PLAY_HAND',expectedRevision:state.revision,cardIds:[glassId,pairId]});assert.equal(result.error,null);assert.equal(result.state.lastScore.glassRolls[0].destroyed,false);assert.equal(Object.hasOwn(result.state.cards,glassId),true);assert.deepEqual(reload(result.state),result.state);
 const payload=JSON.parse(serializeState(result.state));
 for(const mutate of [p=>p.state.lastScore.glassRolls[0].destroyed=true,p=>p.state.lastScore.glassRolls[0].roll=0,p=>p.state.lastScore.glassRngAfter.glass=0.5]){const copy=structuredClone(payload);mutate(copy);assert.throws(()=>deserializeState(JSON.stringify(copy)));}
});

test('Justice copy and Glass modifier copy describe the implemented effect truthfully',()=>{
 assert.equal(describeShopItem(justice()).description,'Усиливает 1 выбранную карту до Стеклянной: при подсчёте она даёт ×2 к множителю и имеет шанс 1 из 4 разрушиться.');
});

test('Glass cards have an owned marker and shattered played cards have a visual state',()=>{
 const css=readFileSync(new URL('../../web/styles.css',import.meta.url),'utf8');
 assert.match(css,/\.playing-card\[data-enhancement=glass\]::after/);
 assert.match(css,/\.played-card\.shattering/);
});
