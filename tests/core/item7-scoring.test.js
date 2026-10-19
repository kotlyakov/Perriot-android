import test from 'node:test';
import assert from 'node:assert/strict';
import {item7BeforeScore,item7ScoredEffects,item7IndependentEffect,item7HeldEffects} from '../../src/core/joker-score-effects.js';
const card=(id,rank,suit='hearts',extra={})=>({id,rank,suit,...extra});
const state=(jokers,cards=[])=>({jokers,cards:Object.fromEntries(cards.map(c=>[c.id,c])),handLevels:{pair:1},handUsage:{pair:1},round:{handUsage:{pair:0}},money:0n});
const ctx=joker=>({source:joker,target:joker,copied:false});
const opts={handId:'pair',playedCards:[card('a',2),card('b',2)],scoringCards:[card('a',2),card('b',2)],isDebuffed:()=>false,roll:()=>0};
test('item7 native before growth applies once, copied Trousers cannot grow target',()=>{
 const trousers={id:'t',entityId:'j_trousers',mult:0},s=state([{id:'b',entityId:'j_blueprint'},trousers]);
 item7BeforeScore(s,{...opts,handId:'two_pair',playedCards:[...opts.playedCards,card('c',3),card('d',3)]});
 assert.equal(s.jokers[1].mult,2);
 assert.deepEqual(item7IndependentEffect(s,ctx(s.jokers[1]),opts),{operation:'add_mult',amount:2n});
});
test('item7 Hiker upgrades after current chips and copies upgrade, Wee skips copied contexts',()=>{
 const h={id:'h',entityId:'j_hiker'},c=card('a',2),s=state([h],[c]);
 item7ScoredEffects(s,ctx(h),c,opts);item7ScoredEffects(s,{source:{id:'b'},target:h,copied:true},c,opts);
 assert.equal(c.permaBonus,10);
 const w={id:'w',entityId:'j_wee',chips:0};
 item7ScoredEffects(s,ctx(w),c,opts);item7ScoredEffects(s,{source:{id:'b'},target:w,copied:true},c,opts);
 assert.equal(w.chips,8);
});
test('item7 Photograph uses first scoring face and Triboulet only native Q/K ranks',()=>{
 const face=card('q',12),next=card('k',13),o={...opts,scoringCards:[face,next]};
 const p={id:'p',entityId:'j_photograph'},s=state([p]);
 assert.deepEqual(item7ScoredEffects(s,ctx(p),face,o),[{operation:'multiply_mult',amount:2n}]);
 assert.deepEqual(item7ScoredEffects(s,ctx(p),next,o),[]);
 assert.deepEqual(item7ScoredEffects(s,ctx({entityId:'j_triboulet'}),card('j',11),o),[]);
});
test('item7 money uses suit/enhancement/face and held parking chance',()=>{
 const s=state([]),o={...opts,roll:()=>0};
 assert.deepEqual(item7ScoredEffects(s,ctx({entityId:'j_rough_gem'}),card('d',2,'diamonds'),o),[{operation:'money',amount:1n}]);
 assert.deepEqual(item7ScoredEffects(s,ctx({entityId:'j_ticket'}),card('g',2,'hearts',{enhancement:'gold'}),o),[{operation:'money',amount:4n}]);
 assert.deepEqual(item7HeldEffects(s,ctx({entityId:'j_reserved_parking'}),card('q',12),o),[{operation:'money',amount:1n}]);
});
test('item7 Vampire and Midas ordering mutates scoring card before scoring',()=>{
 const c=card('q',12),s=state([{id:'m',entityId:'j_midas_mask'},{id:'v',entityId:'j_vampire',xMult:1}],[c]);
 item7BeforeScore(s,{...opts,scoringCards:[c]});
 assert.equal(c.enhancement,'base');assert.equal(s.jokers[1].xMult,1.1);
});
test('item7 random rolls are keyed and chance boundaries strict',()=>{
 const keys=[],s=state([]),o={...opts,roll:(key)=>{keys.push(key);return .5;}};
 assert.deepEqual(item7ScoredEffects(s,ctx({entityId:'j_bloodstone'}),card('h',2),o),[]);
 assert.deepEqual(keys,['bloodstone']);
 assert.deepEqual(item7IndependentEffect(s,ctx({entityId:'j_misprint'}),{...o,roll:()=>.999}),{operation:'add_mult',amount:23n});
});
test('item7 loyalty copied before its target sees same sixth-hand activation',()=>{
 const loyalty={id:'l',entityId:'j_loyalty_card',loyaltyRemaining:0},s=state([{id:'b',entityId:'j_blueprint'},loyalty]);
 item7BeforeScore(s,opts);
 assert.equal(loyalty.loyaltyRemaining,0);
 assert.deepEqual(item7IndependentEffect(s,{source:s.jokers[0],target:loyalty,copied:true},opts),{operation:'multiply_mult',amount:4n});
 assert.deepEqual(item7IndependentEffect(s,ctx(loyalty),opts),{operation:'multiply_mult',amount:4n});
});
test('item7 Madness uses generic native xMult branch and zero Castle is silent',()=>{
 assert.deepEqual(item7IndependentEffect(state([]),ctx({entityId:'j_madness',xMult:2}),opts),{operation:'multiply_mult',amount:2n});
 assert.equal(item7IndependentEffect(state([]),ctx({entityId:'j_castle',chips:0}),opts),null);
});

import {scoreHand} from '../../src/core/score.js';
import {createApkRng} from '../../src/core/apk-rng.js';
function scoringState(jokers,cards){return {...state(jokers,cards),hand:cards.map(c=>c.id),round:{handsRemaining:3,discardsRemaining:3},rng:{apk:createApkRng('ITEM7-SCORING')}};}
test('item7 scored mutation transaction is pure and Hiker adds only on subsequent retriggers',()=>{
 const c=card('two',2,'hearts',{seal:'red'}),s=scoringState([{id:'h',entityId:'j_hiker'},{id:'b',entityId:'j_blueprint'},{id:'h2',entityId:'j_hiker'}],[c]),before=structuredClone(s);
 const result=scoreHand(s,[c]);
 assert.deepEqual(s,before);assert.equal(result.chips,24n);assert.equal(result.item7State.cards.two.permaBonus,30);
});
test('item7 Wee grows each retrigger and its new value scores in same hand',()=>{
 const c=card('two',2,'hearts',{seal:'red'}),s=scoringState([{id:'w',entityId:'j_wee'}],[c]);
 const result=scoreHand(s,[c]);assert.equal(result.chips,25n);assert.equal(result.item7State.jokers[0].chips,16);
});
test('item7 Lucky Cat grows once for a pass with both Lucky outcomes and ignores Blueprint growth',()=>{
 const c=card('two',2,'hearts',{enhancement:'lucky',seal:'red'}),s=scoringState([{id:'b',entityId:'j_blueprint'},{id:'l',entityId:'j_lucky_cat'},...Array.from({length:4},(_,i)=>({id:'o'+i,entityId:'j_oops'}))],[c]);
 const result=scoreHand(s,[c]);assert.equal(result.item7State.jokers[1].xMult,1.5);assert.deepEqual(result.mult,{n:369n,d:4n});assert.equal(result.trace.filter(e=>e.type==='score_money').reduce((n,e)=>n+e.amount,0n),40n);
});
test('item7 Midas followed by Vampire removes enhancement and scores upgraded xMult',()=>{
 const c=card('q',12),s=scoringState([{id:'m',entityId:'j_midas_mask'},{id:'v',entityId:'j_vampire'}],[c]);
 const result=scoreHand(s,[c]);assert.equal(result.item7State.cards.q.enhancement,'base');assert.equal(result.item7State.jokers[1].xMult,1.1);assert.equal(result.score,16n);
});
test('item7 Throwback acquired after earlier skips uses run skip history',()=>{
 const s=state([]);s.runStats={skips:3};
 assert.deepEqual(item7IndependentEffect(s,ctx({entityId:'j_throwback',xMult:1}),opts),{operation:'multiply_mult',amount:{n:7n,d:4n}});
});
