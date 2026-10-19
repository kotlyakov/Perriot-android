import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreHand} from '../../src/core/score.js';
import {createApkRng} from '../../src/core/apk-rng.js';
import {item7BeforeScore,item7ScoredEffects,item7IndependentEffect} from '../../src/core/joker-score-effects.js';
const card=(id,rank=2,suit='hearts',extra={})=>({id,rank,suit,...extra});
const joker=(entityId,id=entityId,extra={})=>({id,entityId,...extra});
const state=(jokers,cards=[card('c')],extra={})=>({jokers,cards:Object.fromEntries(cards.map(c=>[c.id,c])),hand:cards.map(c=>c.id),handLevels:{high_card:1},money:0n,round:{handsRemaining:3,discardsRemaining:3},rng:{apk:createApkRng('ITEM7B-SCORING')},...extra});
const context=j=>({source:j,target:j,copied:false});
const opts={handId:'high_card',scoringCards:[],playedCards:[],isDebuffed:()=>false,roll:()=>0};
// Original card.lua:2739 debuffed_hand and :3722 joker_main are exclusive.
test('Matador pays copied and owned contexts once on a rejected Psychic hand',()=>{
 const s=state([joker('j_blueprint'),joker('j_matador')],undefined,{bossState:{id:'bl_psychic',disabled:false}});
 const result=scoreHand(s,[s.cards.c]);
 assert.equal(result.handDebuffed,true);
 assert.equal(result.score,0n);
 assert.deepEqual(result.trace.filter(e=>e.type==='score_money').map(e=>[e.sourceId,e.amount]),[['j_blueprint',8n],['j_matador',8n]]);
});
// Original state_events.lua:895–964 invokes other_joker for every owned slot,
// including a debuffed target; calculate_joker guards the Baseball source.
test('Baseball multiplies at a debuffed uncommon target slot in inventory order',()=>{
 const cards=[card('c')],s=state([joker('j_trousers','target',{debuffed:true,mult:20}),joker('j_baseball'),joker('j_joker')],cards);
 const result=scoreHand(s,cards);
 assert.deepEqual(result.mult,{n:11n,d:2n});
 const hit=result.trace.find(e=>e.effectSourceId==='j_baseball');
 assert.equal(hit.sourceId,'target');
 assert.equal(hit.after.mult.n,3n);
 assert.equal(hit.after.mult.d,2n);
});
test('debuffed Baseball source is silent while a copied Baseball keeps slot timing',()=>{
 const cards=[card('c')];
 const muted=scoreHand(state([joker('j_trousers','target',{debuffed:true}),joker('j_baseball','b',{debuffed:true})],cards),cards);
 assert.equal(muted.mult,1n);
 const copied=scoreHand(state([joker('j_trousers','target',{mult:2}),joker('j_blueprint'),joker('j_baseball')],cards),cards);
 assert.deepEqual(copied.mult,{n:27n,d:4n});
 assert.equal(copied.trace.filter(e=>e.effectSourceId==='j_baseball'||e.effectSourceId==='j_blueprint').length,2);
});
test('Idol with an empty native target never invents an Ace numeric id',()=>{
 const j=joker('j_idol'),s=state([j]);s.round.idolCard={suit:'spades'};
 assert.deepEqual(item7ScoredEffects(s,context(j),card('ace',14,'spades'),opts),[]);
 delete s.round.idolCard;
 assert.deepEqual(item7ScoredEffects(s,context(j),card('ace',14,'spades'),opts),[]);
});
// Original native predicates invoke get_id before Blueprint guards; Stone's
// accessor draws every time, so equivalent boolean results can consume more RNG.
test('copied Wee and Triboulet retain native rank accessor chronology',()=>{
 let draws=0;
 const stone=card('stone',2,'hearts',{enhancement:'stone'}),o={...opts,rankGetter:()=>{draws++;return -100;}};
 const wee=joker('j_wee');item7ScoredEffects(state([wee]),{...context(wee),copied:true},stone,o);
 assert.equal(draws,1);assert.equal(wee.chips,undefined);
 const trib=joker('j_triboulet');item7ScoredEffects(state([trib]),context(trib),stone,o);
 assert.equal(draws,3);
});
test('Superposition scans every scored rank before testing Straight and skips scan at capacity',()=>{
 const j=joker('j_superposition'),cards=[card('ace',14),card('stone',2,'hearts',{enhancement:'stone'})],s=state([j],cards);
 const ranks=[],created=[],o={...opts,scoringCards:cards,rankGetter:c=>{ranks.push(c.id);return c.enhancement==='stone'?-100:c.rank;},create:c=>created.push(c)};
 item7IndependentEffect(s,context(j),o);
 assert.deepEqual(ranks,['ace','stone']);assert.deepEqual(created,[]);
 ranks.length=0;item7IndependentEffect(s,context(j),{...o,handId:'straight'});
 assert.deepEqual(ranks,['ace','stone']);assert.equal(created.length,1);
 ranks.length=0;s.consumables=[{id:'a'},{id:'b'}];item7IndependentEffect(s,context(j),{...o,handId:'straight'});
 assert.deepEqual(ranks,[]);assert.equal(created.length,1);
});
test('Obelisk tie grows against postplay usage and resets when current hand becomes strictly greatest',()=>{
 const j=joker('j_obelisk','o',{xMult:2}),s=state([joker('j_blueprint'),j],undefined,{handUsage:{high_card:3,pair:4}});
 item7BeforeScore(s,opts);assert.equal(j.xMult,2.2);
 s.handUsage.high_card=4;item7BeforeScore(s,opts);assert.equal(j.xMult,1);
});
test('Vampire before Midas preserves final Gold and only the first Vampire consumes each card',()=>{
 const c=card('queen',12,'hearts',{enhancement:'bonus'}),v=joker('j_vampire','v'),v2=joker('j_vampire','v2'),s=state([v,joker('j_midas_mask'),v2],[c]);
 item7BeforeScore(s,{...opts,playedCards:[c],scoringCards:[c]});
 assert.equal(v.xMult,1.1);assert.equal(v2.xMult,undefined);assert.equal(c.enhancement,'gold');
});
