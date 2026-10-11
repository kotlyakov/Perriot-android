import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {canUseConsumable} from '../../src/core/consumables.js';
import {bossTarget} from '../../src/core/boss-effects.js';
import {evaluateHand} from '../../src/core/hands.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {scoreHand} from '../../src/core/score.js';
import {sortHand} from '../../src/core/sort.js';
import {deckStats} from '../../src/ui/deck-view.js';
import {cardMarkup} from '../../src/ui/field.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {describeShopItem} from '../../src/content/shop-display.js';

const centre=key=>catalogue.centres.find(card=>card.key===key);
const levels=()=>Object.fromEntries(['high_card','pair','two_pair','three_of_a_kind','straight','flush','full_house','four_of_a_kind','straight_flush','five_of_a_kind','flush_house','flush_five'].map(id=>[id,1]));
const card=(id,rank,suit,enhancement)=>({id,rank,suit,...(enhancement?{enhancement}:{})});
const tower=()=>{const c=centre('c_tower');return {id:'tower',entityId:c.key,originalKey:c.key,set:c.set,edition:'base',cost:3n,sellCost:1n};};
const reload=state=>deserializeState(serializeState(state));
function run(){
 let state=createRun('STONE21',{runId:'stone',money:4n,referenceRng:true,referenceShop:true});
 state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;
 state.consumables=[tower()];state.apkShop.context=currentApkShopContext(state);return state;
}
const use=(state,targetCardIds)=>dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:'tower',targetCardIds});

test('Tower accepts exactly one current-hand target, overwrites its enhancement and spends no RNG',()=>{
 const state=run(),target=state.hand[0],before=structuredClone(state),rng=structuredClone(state.rng);state.cards[target].enhancement='glass';state.apkShop.context=currentApkShopContext(state);
 assert.equal(canUseConsumable(state,state.consumables[0],[target]).available,true);
 const result=use(state,[target]);assert.equal(result.error,null);assert.equal(result.state.cards[target].enhancement,'stone');
 assert.deepEqual(result.events.filter(event=>event.type==='card_enhanced'),[{type:'card_enhanced',cardId:target,enhancement:'stone',sourceId:'tower'}]);
 assert.deepEqual(result.state.apkShop.context.enhancementIds,['m_stone']);assert.deepEqual(result.state.rng,rng);assert.deepEqual(reload(result.state),result.state);
 assert.equal(before.cards[target].enhancement,undefined);
 for(const targets of [[],state.hand.slice(0,2),[state.drawPile[0]],['missing']]){const fixture=run(),snapshot=structuredClone(fixture),rejected=use(fixture,targets);assert.equal(rejected.error.code,'INVALID_TARGETS');assert.equal(rejected.state,fixture);assert.deepEqual(fixture,snapshot);}
});

test('debuffed Tower consumes and counts without changing its target',()=>{
 const state=run(),target=state.hand[0],before=structuredClone(state.cards[target]);state.consumables[0].debuffed=true;
 const result=use(state,[target]);assert.equal(result.error,null);assert.deepEqual(result.state.cards[target],before);assert.equal(result.state.consumables.length,0);
 assert.deepEqual(result.events.filter(event=>event.type==='card_enhanced'),[]);assert.deepEqual(result.state.consumableUsage.c_tower,{count:1,order:centre('c_tower').order,set:'Tarot'});
});

test('Stone has no rank or suit for recognition and every played Stone scores in physical order',()=>{
 const cards=[card('eight-a',8,'clubs'),card('stone',14,'spades','stone'),card('eight-b',8,'diamonds'),card('four',4,'hearts'),card('two',2,'clubs')];
 const hand=evaluateHand(cards);assert.equal(hand.handId,'pair');assert.deepEqual(hand.scoringCardIds,['eight-a','eight-b']);assert.equal(hand.isRoyal,false);
 const result=scoreHand({handLevels:levels(),jokers:[]},cards);assert.deepEqual(result.scoringCardIds,['eight-a','stone','eight-b']);
 assert.deepEqual(result.trace.filter(event=>event.phase==='scored_card').map(event=>[event.sourceId,event.operation,event.after.chips]),[
  ['eight-a','add_chips',18n],['stone','add_chips',68n],['eight-b','add_chips',76n],
 ]);
 assert.equal(result.score,152n);
 const only=scoreHand({handLevels:levels(),jokers:[]},[card('only',13,'hearts','stone')]);assert.equal(only.handId,'high_card');assert.deepEqual(only.scoringCardIds,['only']);assert.equal(only.score,55n);
 const tied=[card('tied-stone',8,'diamonds','stone'),card('ranked-eight',8,'clubs')];assert.deepEqual(evaluateHand(tied).scoringCardIds,['ranked-eight']);assert.deepEqual(scoreHand({handLevels:levels(),jokers:[]},tied).scoringCardIds,['tied-stone','ranked-eight']);
});

test('Stone ignores printed rank and suit for Jokers, bosses and Mark concealment',()=>{
 const stone=card('stone',14,'spades','stone'),state={handLevels:levels(),jokers:[{id:'scholar',entityId:'j_scholar'},{id:'arrow',entityId:'j_arrowhead'}]};
 const ordinary=scoreHand(state,[stone]);assert.equal(ordinary.chips,55n);assert.equal(ordinary.mult,1n);assert.equal(ordinary.trace.filter(event=>event.effectSourceId).length,0);
 for(const bossId of ['bl_goad','bl_plant']){const active=scoreHand({...state,bossState:{id:bossId,playedBeforeBoss:[]}},[stone]);assert.equal(active.chips,55n);assert.deepEqual(active.scoringCardIds,['stone']);}
 const pillar=scoreHand({...state,bossState:{id:'bl_pillar',playedBeforeBoss:['stone']}},[stone]);assert.equal(pillar.chips,5n);assert.deepEqual(pillar.scoringCardIds,['stone']);

 let marked=createRun('STONE21',{runId:'stone-mark',money:4n,referenceRng:true,referenceShop:true});for(const value of Object.values(marked.cards))if(value.rank>=11&&value.rank<=13)value.enhancement='stone';marked.round.ante=2;marked.round.blindId='boss';marked.apkBlinds.ante=2;marked.apkBlinds.tagContext.ante=2;marked.apkBlinds.bossId='bl_mark';marked.apkBlinds.bossesUsed.bl_mark=1;marked.round.target=bossTarget(marked);marked.apkShop.context=currentApkShopContext(marked);marked.apkShop.context.ante=2;
 marked=dispatch(marked,{type:'START_BLIND',expectedRevision:marked.revision}).state;
 assert.equal(marked.hand.some(id=>marked.cards[id].rank>=11&&marked.cards[id].rank<=13),true);assert.deepEqual(marked.bossState.hiddenCardIds,[]);
 assert.deepEqual(reload(marked),marked);

 let converted=createRun('STONE21',{runId:'stone-mark-convert',money:4n,referenceRng:true,referenceShop:true});converted.round.ante=2;converted.round.blindId='boss';converted.apkBlinds.ante=2;converted.apkBlinds.tagContext.ante=2;converted.apkBlinds.bossId='bl_mark';converted.apkBlinds.bossesUsed.bl_mark=1;converted.round.target=bossTarget(converted);converted.consumables=[tower()];converted.apkShop.context=currentApkShopContext(converted);converted.apkShop.context.ante=2;
 converted=dispatch(converted,{type:'START_BLIND',expectedRevision:converted.revision}).state;const hiddenFace=converted.bossState.hiddenCardIds[0];assert.ok(hiddenFace);
 converted=use(converted,[hiddenFace]).state;assert.equal(converted.cards[hiddenFace].enhancement,'stone');assert.ok(converted.bossState.hiddenCardIds.includes(hiddenFace));assert.deepEqual(reload(converted),converted);
 const forged=structuredClone(converted),pip=forged.hand.find(id=>forged.cards[id].rank<11&&!forged.bossState.hiddenCardIds.includes(id));assert.ok(pip);forged.cards[pip].enhancement='stone';forged.bossState.hiddenCardIds.push(pip);assert.throws(()=>serializeState(forged),/Invalid save data/);
});

test('Splash never duplicates Stone and deck statistics omit its printed rank and suit',()=>{
 const cards=[card('stone',14,'spades','stone'),card('normal',2,'clubs')];
 const result=scoreHand({handLevels:levels(),jokers:[{id:'splash',entityId:'joker_splash'}]},cards);assert.deepEqual(result.scoringCardIds,['stone','normal']);assert.equal(result.trace.filter(event=>event.phase==='scored_card'&&event.sourceId==='stone'&&event.operation==='add_chips').length,1);
 const state={cards:Object.fromEntries(cards.map(value=>[value.id,value])),drawPile:['stone','normal'],bossState:null};const stats=deckStats(state,'full');assert.equal(stats.total,2);assert.equal(stats.suits.spades,0);assert.equal(stats.suits.clubs,1);assert.equal(stats.ranks[14],0);assert.equal(stats.ranks[2],1);assert.equal(stats.categories.numbered,1);
});

test('Stone sorts after ranked cards and renders without printed identity',()=>{
 const state={sortMode:'rank',hand:['stone','low','high'],cards:{stone:card('stone',14,'spades','stone'),low:card('low',2,'clubs'),high:card('high',13,'hearts')}};sortHand(state,'rank');assert.deepEqual(state.hand,['high','low','stone']);sortHand(state,'suit');assert.equal(state.hand.at(-1),'stone');
 const markup=cardMarkup(state.cards.stone);assert.doesNotMatch(markup,/\bA\b|spades|suit-/);assert.match(markup,/stone-face/);
 const css=readFileSync(new URL('../../web/styles.css',import.meta.url),'utf8');assert.match(css,/\.playing-card\[data-enhancement=stone\]::after/);
});

test('Tower and Stone modifier copy describe the implemented effect truthfully',()=>{
 assert.equal(describeShopItem(tower()).description,'Усиливает 1 выбранную карту до Каменной: она всегда участвует в подсчёте, не имеет ранга и масти и даёт +50 фишек.');
});
