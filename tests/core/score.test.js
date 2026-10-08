import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreHand } from '../../src/core/score.js';

const suits = ['clubs','diamonds','hearts','spades'];
const cards = (ranks, flush=false) => ranks.map((rank,i)=>({id:`c${i}`,rank,suit:flush?'spades':suits[i%4]}));
const state = (jokers=[], handLevels={}) => ({jokers:jokers.map((entityId,i)=>({id:`j${i}`,entityId})),handLevels});
for (const [ranks,flush,want,level] of [
  [[14,10,8,6,3],false,16n],[[8,8,14],false,52n],[[7,7,4,4,14],false,84n],
  [[5,5,5,13],false,135n],[[14,2,3,4,5],false,220n],[[6,7,8,9,10],false,280n],
  [[2,4,6,8,10],true,260n],[[7,7,7,2,2],false,260n],[[9,9,9,9,2],false,672n],
  [[14,13,12,11,10],true,1208n],[[2,2,2,2,2],false,1560n],
  [[3,3,3,2,2],true,2142n],[[14,14,14,14,14],true,3440n],[[8,8,14],false,123n,2],
]) test(`base score ${ranks} flush=${flush} level=${level??1}`,()=>{
  assert.equal(scoreHand(state([],level?{pair:level}:{}),cards(ranks,flush)).score,want);
});
test('rank chips and trace preserve scored card order and omit kicker',()=>{
  const result=scoreHand(state(),cards([8,14,8]));
  assert.equal(result.chips,26n);assert.equal(result.mult,2n);
  assert.deepEqual(result.trace.filter(e=>e.phase==='scored_card').map(e=>e.sourceId),['c0','c2']);
  assert.equal(result.trace.at(-1).score,52n);
  assert.equal(result.trace[1].before.chips,10n);assert.equal(result.trace[1].after.chips,18n);
});
test('four basic joker effects and no-trigger conditions',()=>{
  assert.equal(scoreHand(state(['joker_joker']),cards([14])).score,80n);
  assert.equal(scoreHand(state(['joker_sly_joker']),cards([8,8])).score,152n);
  assert.equal(scoreHand(state(['joker_sly_joker']),cards([5,5,5])).score,285n);
  assert.equal(scoreHand(state(['joker_sly_joker']),cards([14])).score,16n);
  assert.equal(scoreHand(state(['joker_clever_joker']),cards([7,7,4,4])).score,244n);
  assert.equal(scoreHand(state(['joker_clever_joker']),cards([9,9,9,9,2])).score,672n);
  const splash=scoreHand(state(['joker_splash']),cards([8,8,14]));
  assert.equal(splash.score,74n);assert.equal(splash.handId,'pair');
  assert.deepEqual(splash.scoringCardIds,['c0','c1','c2']);
});
test('independent effects trace follows joker positions',()=>{
  const result=scoreHand(state(['joker_joker','joker_sly_joker']),cards([8,8]));
  assert.deepEqual(result.trace.filter(e=>e.phase==='independent').map(e=>[e.sourceId,e.operation]),[['j0','add_mult'],['j1','add_chips']]);
  assert.equal(result.score,456n);
});
test('levels do not choose a weaker hand with larger point value',()=>{
  assert.equal(scoreHand(state([],{pair:100}),cards([8,8,8,7,7])).handId,'full_house');
});
test('unknown effects and modifiers fail instead of partial score',()=>{
  assert.throws(()=>scoreHand(state(['joker_blueprint']),cards([14])));
  for(const extra of [{edition:'foil'},{seal:'red'},{debuffed:true},{enhancement:'glass'}]) {
    assert.throws(()=>scoreHand(state(),[{id:'x',rank:14,suit:'spades',...extra}]));
  }
  assert.throws(()=>scoreHand(state([],{high_card:0}),cards([14])));
  assert.throws(()=>scoreHand(state([],{high_card:1.5}),cards([14])));
});
test('scoring leaves state and cards unchanged',()=>{
  const input=state(['joker_splash','joker_joker']);const hand=cards([8,8,14]);
  const before=JSON.stringify({input,hand});scoreHand(input,hand);
  assert.equal(JSON.stringify({input,hand}),before);
});
