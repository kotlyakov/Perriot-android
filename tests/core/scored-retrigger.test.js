import test from 'node:test';
import assert from 'node:assert/strict';
import * as content from '../../src/content/jokers.js';
import {scoreHand} from '../../src/core/score.js';
import {createApkRng} from '../../src/core/apk-rng.js';
import {createRng,randomInt} from '../../src/core/rng.js';
const card=(rank=2,enhancement,id='c1')=>({id,rank,suit:'clubs',...(enhancement?{enhancement}:{})});
const joker=(entityId,id=entityId)=>({id,entityId});
function state(jokers,cards=[card()],handsRemaining=1){return {handLevels:{high_card:1,pair:1},jokers,cards:Object.fromEntries(cards.map(c=>[c.id,c])),hand:cards.map(c=>c.id),round:{handsRemaining,discardsRemaining:3},rng:{apk:createApkRng('RETRIGGER5')}};}
const repeats=r=>r.trace.filter(e=>e.type==='score_repeat');

test('four predicates use exact additional counts, first physical identity and preplay last-hand counter',()=>{
 assert.equal(typeof content.scoredJokerRepetitions,'function');
 const helper=content.scoredJokerRepetitions,context={firstScoringCardId:'c1',handsRemaining:1};
 for(let rank=2;rank<=14;rank++){
  assert.equal(helper('j_hack',card(rank),context),rank<=5?1:0);
  assert.equal(helper('j_sock_and_buskin',card(rank),context),rank>=11&&rank<=13?1:0);
 }
 assert.equal(helper('j_hack',card(2,'stone'),context),0);assert.equal(helper('j_sock_and_buskin',card(12,'stone'),context),0);
 assert.equal(helper('j_hanging_chad',card(),context),2);assert.equal(helper('j_hanging_chad',card(2,undefined,'other'),context),0);
 assert.equal(helper('j_dusk',card(),context),1);assert.equal(helper('j_dusk',card(),{...context,handsRemaining:2}),0);
});

test('Chad, additive queue order and original per-pass sources produce exact scores',()=>{
 const c=card(),chad=joker('j_hanging_chad');
 let r=scoreHand(state([chad]),[c]);assert.equal(r.chips,11n);assert.equal(r.score,11n);
 assert.deepEqual(repeats(r),Array.from({length:2},()=>({type:'score_repeat',phase:'scored_card',sourceId:'c1',effectSourceId:chad.id})));
 const js=[chad,joker('j_hack'),joker('j_dusk')];r=scoreHand(state(js),[c]);assert.equal(r.score,15n);
 assert.deepEqual(repeats(r).map(e=>e.effectSourceId),['j_hanging_chad','j_hanging_chad','j_hack','j_dusk']);
 assert.deepEqual(repeats(scoreHand(state([...js].reverse()),[c])).map(e=>e.effectSourceId),['j_dusk','j_hack','j_hanging_chad','j_hanging_chad']);
 const scholar=scoreHand(state([chad,joker('j_scholar')],[card(14)]),[card(14)]);
 assert.equal(scholar.chips,98n);assert.equal(scholar.mult,13n);
 assert.equal(scholar.trace.filter(e=>e.effectSourceId==='j_scholar'&&e.operation==='add_chips').length,3);
});

test('Glass scores each repetition but receives exactly one destruction roll',()=>{
 const c=card(2,'glass'),s=state([joker('j_hanging_chad')],[c]),before=structuredClone(s);
 const r=scoreHand(s,[c]);assert.equal(r.chips,11n);assert.equal(r.mult,8n);assert.equal(r.score,88n);
 assert.equal(r.glassRolls.length,1);assert.equal(r.trace.filter(e=>e.operation==='multiply_mult').length,3);assert.deepEqual(s,before);
});

test('non-scoring and debuffed first cards do not transfer Chad repeats or trigger Hack',()=>{
 const cs=[card(10,undefined,'first'),card(10,undefined,'second'),card(2,undefined,'kicker')];
 const s=state([joker('j_hanging_chad'),joker('j_hack')],cs);s.bossState={id:'bl_pillar',playedBeforeBoss:['first']};
 const r=scoreHand(s,cs);assert.deepEqual(r.scoringCardIds,['first','second']);assert.equal(repeats(r).length,0);
 s.jokers[0].debuffed=true;assert.equal(repeats(scoreHand(s,cs)).length,0);
});

test('Dusk requires the real preplay last hand and leaves held effects and editions once',()=>{
 const c=card(11),steel=card(2,'steel','held');
 const js=[joker('j_dusk'),joker('j_sock_and_buskin'),{...joker('j_joker'),edition:'foil'}];
 const s=state(js,[c,steel],2),r=scoreHand(s,[c]);assert.equal(repeats(r).length,1);
 assert.equal(r.trace.filter(e=>e.phase==='held_card').length,1);assert.equal(r.trace.filter(e=>e.phase==='edition').length,1);
 s.round.handsRemaining=1;assert.equal(repeats(scoreHand(s,[c])).length,2);
 delete s.round;assert.throws(()=>scoreHand(s,[c]));
});

test('legacy effects RNG advances one shared chronological sequence through repeated Lucky and Glass',()=>{
 const lucky=card(2,'lucky'),glass=card(3,'glass','c2'),s=state([joker('j_hanging_chad'),joker('j_splash')],[lucky,glass]);
 delete s.rng.apk;s.rng.effects=createRng('REPEAT-EFFECTS');
 let current=s.rng.effects;const rolls=[];for(let i=0;i<3;i++){const a=randomInt(current,5),b=randomInt(a.rng,15);rolls.push([a.value/5,b.value/15]);current=b.rng;}
 const end=randomInt(current,4),r=scoreHand(s,[lucky,glass]);
 assert.deepEqual(r.luckyRolls.map(x=>[x.multRoll,x.moneyRoll]),rolls);assert.equal(r.glassRolls[0].roll,end.value/4);
 assert.deepEqual(r.glassRngBefore,current);assert.deepEqual(r.glassRngAfter,end.rng);
});
test('unknown Joker families and invalid playing-card modifiers remain rejected',()=>{
 for(const key of ['j_unknown_vampire','j_unknown_perkeo','j_unknown_invisible','j_seltzer']){
  const offer=joker(key);assert.equal(content.supportsJoker(offer,{owned:true}),false);assert.equal(content.supportsJoker(offer),false);
  assert.throws(()=>scoreHand(state([joker('j_hanging_chad'),offer]),[card()]));
 }
 for(const fields of [{seal:'unknown'},{edition:'negative'},{edition:'unknown'}]){
  const c={...card(),...fields};assert.throws(()=>scoreHand(state([joker('j_hanging_chad')],[c]),[c]));
 }
});
