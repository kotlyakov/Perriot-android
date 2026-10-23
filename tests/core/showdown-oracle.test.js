import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as effects from '../../src/core/boss-effects.js';
import {createApkRng,createApkMathState,nextApkRandom} from '../../src/core/apk-rng.js';
import {shuffleApkDeck} from '../../src/core/apk-deck.js';
const fixtures=JSON.parse(readFileSync(new URL('../../scripts/reference-rng/showdown-fixtures.json',import.meta.url)));
const initial=seed=>createApkRng(seed,createApkMathState(42));
const jokers=(count,reverse=false)=>{const list=Array.from({length:count},(_,i)=>({id:`joker_${i+1}`,creationOrdinal:i+1,debuffed:false}));return reverse?list.reverse():list;};
const cards=count=>Array.from({length:count},(_,i)=>({id:`card_clubs_${i+2}`,suit:'clubs',rank:i+2})).reverse();
const rngMatches=(rng,after)=>{assert.deepEqual(rng.streams,after.streams);assert.deepEqual(rng.mathState,after.mathState);};
test('Acorn executes three canonical shuffles after native setup Joker polls and nr8 deck shuffle',()=>{
 assert.equal(typeof effects.shuffleAcornJokers,'function');
 for(const row of fixtures.acorn){
  let rng=initial(row.seed);const pool=jokers(row.count,row.reverse);
  const trace=['set_blind'];for(const joker of pool){trace.push(`setting_blind:${joker.id}`);rng=nextApkRandom(rng,'setup_oracle',1,5).rng;}
  const deck=Object.keys({clubs:1,diamonds:1,hearts:1,spades:1}).flatMap(suit=>Array.from({length:13},(_,i)=>({id:`card_${suit}_${i+2}`,suit,rank:i+2})));
  const shuffled=shuffleApkDeck(deck,rng,'nr8');rng=shuffled.rng;trace.push('shuffle:nr8');
  const result=effects.shuffleAcornJokers(rng,pool);
  if(row.count>1)trace.push('shuffle:aajk','shuffle:aajk','shuffle:aajk');
  assert.deepEqual(trace,row.trace);assert.deepEqual(shuffled.cardIds,row.deckIds);
  assert.deepEqual(result.jokerIds,row.after.jokerIds);rngMatches(result.rng,row.after);
  assert.deepEqual(pool,jokers(row.count,row.reverse));
 }
});
test('Bell choice uses canonical creation order and consumes one keyed integer for one card',()=>{
 assert.equal(typeof effects.chooseBellCard,'function');
 for(const row of fixtures.bell.filter(row=>row.count)){
  let rng=initial(row.seed);
  for(const step of row.steps){
   if(step.action!=='already_forced'){
    const result=effects.chooseBellCard(rng,cards(row.count));rng=result.rng;
    assert.equal(result.cardId,step.after.forcedIds[0]);
   }
   rngMatches(rng,step.after);
  }
 }
});
test('empty Bell follows an explicit terminal path without inventing an identity',()=>{
 assert.equal(typeof effects.chooseBellCard,'function');
 assert.ok(fixtures.bell.filter(row=>row.count===0).every(row=>row.steps[0].ok===false));
 assert.throws(()=>effects.chooseBellCard(initial('PIERROT1'),[]),RangeError);
});
test('Heart initial and armed play draws exclude the old debuffed candidate; discard consumes none',()=>{
 assert.equal(typeof effects.chooseHeartJoker,'function');
 for(const row of fixtures.heart){
  let rng=initial(row.seed),pool=jokers(row.count,true);
  for(const step of row.steps){
   if(step.action!=='discard'){
    const result=effects.chooseHeartJoker(rng,pool);rng=result.rng;
    assert.equal(result.jokerId,step.after.disabledIds[0]??null);
    pool=pool.map(joker=>({...joker,debuffed:joker.id===result.jokerId}));
   }
   rngMatches(rng,step.after);
  }
 }
});
test('Heart excludes other preexisting debuffs before clearing them',()=>{
 assert.equal(typeof effects.chooseHeartJoker,'function');
 const row=fixtures.heartExcluded,pool=jokers(5,true).map(joker=>({...joker,debuffed:row.excludedIds.includes(joker.id)}));
 const result=effects.chooseHeartJoker(initial(row.seed),pool);
 assert.equal(result.jokerId,row.after.disabledIds[0]);rngMatches(result.rng,row.after);
});
test('canonical Joker order rejects ambiguous persistent identities',()=>{
 assert.equal(typeof effects.shuffleAcornJokers,'function');
 for(const pool of [[{id:'a'},{id:'b'}],[{id:'a',creationOrdinal:1},{id:'b',creationOrdinal:1}],[{id:'a',creationOrdinal:2},{id:'a',creationOrdinal:1}]]){
  assert.throws(()=>effects.shuffleAcornJokers(initial('PIERROT1'),pool),TypeError);
  assert.throws(()=>effects.chooseHeartJoker(initial('PIERROT1'),pool),TypeError);
 }
});
