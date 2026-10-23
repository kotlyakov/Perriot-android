import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateHand} from '../../src/core/hands.js';
import {isBossCardDebuffed} from '../../src/core/boss-effects.js';
import {scoreHand} from '../../src/core/score.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {canUseConsumable} from '../../src/core/consumables.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {describeShopItem} from '../../src/content/shop-display.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';

const card=(id,rank,suit,enhancement)=>({id,rank,suit,...(enhancement?{enhancement}:{})});
const levels=()=>Object.fromEntries(['high_card','pair','two_pair','three_of_a_kind','straight','flush','full_house','four_of_a_kind','straight_flush','five_of_a_kind','flush_house','flush_five'].map(id=>[id,1]));
const scoringState=(jokers=[],bossState)=>({handLevels:levels(),jokers,bossState});
const loversCentre=catalogue.centres.find(card=>card.key==='c_lovers');
const lovers=()=>({id:'lovers-owned',entityId:'c_lovers',originalKey:'c_lovers',set:'Tarot',edition:'base',cost:BigInt(loversCentre.cost),sellCost:1n});
function run(reference=false){let state=createRun('WILD0019',{runId:'wild-card',money:4n,...(reference?{referenceRng:true,referenceShop:true}:{})});state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;state.consumables=[lovers()];if(reference)state.apkShop.context=currentApkShopContext(state);return state;}
const use=(state,targetCardIds)=>dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:'lovers-owned',targetCardIds});
const reload=state=>deserializeState(serializeState(state));

test('active Wild supplies every suit for flush recognition and preserves scoring order',()=>{
 const cards=[card('h2',2,'hearts'),card('h4',4,'hearts'),card('wild',6,'spades','wild'),card('h8',8,'hearts'),card('h10',10,'hearts')];
 assert.deepEqual(evaluateHand(cards),{handId:'flush',scoringCardIds:cards.map(c=>c.id),isRoyal:false});
 const compound=[card('a',3,'hearts'),card('b',3,'hearts'),card('w',3,'spades','wild'),card('c',2,'hearts'),card('d',2,'hearts')];
 assert.equal(evaluateHand(compound).handId,'flush_house');
});

test('debuffed Wild loses universal suit but retains its printed base suit',()=>{
 const offSuit=[card('h2',2,'hearts'),card('h4',4,'hearts'),card('wild',6,'spades','wild'),card('h8',8,'hearts'),card('h10',10,'hearts')];
 assert.equal(evaluateHand(offSuit,{isCardDebuffed:c=>c.id==='wild'}).handId,'high_card');
 const baseSuit=offSuit.map(c=>c.id==='wild'?{...c,suit:'hearts'}:c);
 assert.equal(evaluateHand(baseSuit,{isCardDebuffed:c=>c.id==='wild'}).handId,'flush');
 const integrated=scoreHand(scoringState([],{id:'bl_pillar',playedBeforeBoss:['wild']}),baseSuit);assert.equal(integrated.handId,'flush');assert.equal(integrated.trace.some(e=>e.phase==='scored_card'&&e.sourceId==='wild'),false);
});

test('multiple active Wild Cards can jointly supply one flush suit',()=>{
 const cards=[card('h2',2,'hearts'),card('w4',4,'clubs','wild'),card('w6',6,'diamonds','wild'),card('h8',8,'hearts'),card('h10',10,'hearts')];
 assert.equal(evaluateHand(cards).handId,'flush');
});

test('every suit boss debuffs Wild regardless of printed suit',()=>{
 const wild=card('wild',6,'hearts','wild');
 for(const id of ['bl_club','bl_goad','bl_window','bl_head'])assert.equal(isBossCardDebuffed({bossState:{id,playedBeforeBoss:[]}},wild),true,id);
 assert.equal(isBossCardDebuffed({bossState:{id:'bl_club',playedBeforeBoss:[]}},card('plain',6,'hearts')),false);
});

test('active Wild triggers each scored suit Joker and completes Droll flush',()=>{
 const wild=card('wild',14,'spades','wild'),suitJokers=['j_greedy_joker','j_lusty_joker','j_wrathful_joker','j_gluttenous_joker'].map((entityId,i)=>({id:'j'+i,entityId}));
 const single=scoreHand(scoringState(suitJokers),[wild]);
 assert.deepEqual(single.trace.filter(e=>e.phase==='scored_card'&&e.effectSourceId).map(e=>e.effectSourceId),['j0','j1','j2','j3']);
 const flushCards=[card('h2',2,'hearts'),card('h4',4,'hearts'),card('w6',6,'spades','wild'),card('h8',8,'hearts'),card('h10',10,'hearts')];
 const flush=scoreHand(scoringState([{id:'droll',entityId:'j_droll'}]),flushCards);assert.equal(flush.handId,'flush');assert.ok(flush.trace.some(e=>e.sourceId==='droll'&&e.operation==='add_mult'));
});

test('suit boss debuffed Wild gives neither rank chips nor suit Joker effects',()=>{
 const wild=card('wild',14,'spades','wild'),result=scoreHand(scoringState([{id:'greedy',entityId:'j_greedy_joker'}],{id:'bl_club',playedBeforeBoss:[]}),[wild]);
 assert.equal(result.trace.filter(e=>e.phase==='scored_card').length,0);
});

test('Lovers accepts exactly one unique card in hand and rejects invalid targets atomically',()=>{
 const valid=run(),target=valid.hand[0];assert.equal(canUseConsumable(valid,valid.consumables[0],[target]).available,true);
 for(const targets of [[],valid.hand.slice(0,2),[valid.drawPile[0]],['missing']]){
  const state=run(),before=structuredClone(state),result=use(state,targets);
  assert.equal(result.error.code,'INVALID_TARGETS');assert.equal(result.state,state);assert.deepEqual(state,before);
 }
});

test('Lovers overwrites one enhancement with Wild, persists, and derives m_wild shop identity',()=>{
 const state=run(true),target=state.hand[0],original=structuredClone(state.cards[target]),rng=structuredClone(state.rng);state.cards[target].enhancement='bonus';
 const result=use(state,[target]);assert.equal(result.error,null);assert.deepEqual(result.state.cards[target],{...original,enhancement:'wild'});
 assert.deepEqual(result.events.filter(e=>e.type==='card_enhanced'),[{type:'card_enhanced',cardId:target,enhancement:'wild',sourceId:'lovers-owned'}]);
 assert.equal(result.state.consumables.length,0);assert.deepEqual(result.state.consumableUsage.c_lovers,{count:1,order:loversCentre.order,set:'Tarot'});assert.equal(result.state.lastTarotPlanet,'c_lovers');
 assert.deepEqual(result.state.apkShop.context.enhancementIds,['m_wild']);assert.deepEqual(result.state.rng,rng);assert.deepEqual(reload(result.state),result.state);
});

test('save rejects duplicate enhancement identities that omit a distinct actual modifier',()=>{
 const state=run(true),[wild,bonus]=state.hand;state.cards[wild].enhancement='wild';state.cards[bonus].enhancement='bonus';state.apkShop.context=currentApkShopContext(state);assert.deepEqual(reload(state),state);
 state.apkShop.context.enhancementIds=['m_wild','m_wild'];assert.throws(()=>serializeState(state));
});

test('debuffed Lovers consumes and counts without changing its target',()=>{
 const state=run(),target=state.hand[0],before=structuredClone(state.cards[target]);state.consumables[0].debuffed=true;
 const result=use(state,[target]);assert.equal(result.error,null);assert.deepEqual(result.state.cards[target],before);assert.equal(result.state.consumables.length,0);assert.deepEqual(result.events.filter(e=>e.type==='card_enhanced'),[]);assert.equal(result.state.consumableUsage.c_lovers.count,1);
});

test('Lovers shop copy describes its implemented one-card Wild conversion',()=>{
 assert.equal(describeShopItem(lovers()).description,'Усиливает 1 выбранную карту до Дикой: она считается картой любой масти.');
});
