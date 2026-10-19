import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../../src/core/run.js';
import {canonicalCards,createPlayingCard} from '../../src/core/apk-deck.js';
import {nextApkRandom,nextApkMathRandom} from '../../src/core/apk-rng.js';
import * as lifecycle from '../../src/core/joker-item7-lifecycle.js';
import {applyJokerBeforeScore,applyJokerBlindStart} from '../../src/core/joker-lifecycle.js';
const setup=(keys=[])=>{const s=createRun('LIFECYCLE7B',{runId:'lifecycle7b',money:10n,referenceRng:true,referenceShop:true});s.jokers=keys.map((entityId,i)=>({id:`j${i}`,entityId,set:'Joker',creationOrdinal:i+1,sellCost:2n}));for(const j of s.jokers)lifecycle.initializeItem7Joker(s,j);return s;};

test('Madness chooses physical creation order independently of visual reorder',()=>{
 const a=setup(['j_madness','j_joker','j_burglar','j_marble']),b=structuredClone(a),ea=[],eb=[];
 b.jokers=[b.jokers[0],b.jokers[3],b.jokers[1],b.jokers[2]];
 lifecycle.applyItem7BlindStart(a,ea);lifecycle.applyItem7BlindStart(b,eb);
 assert.deepEqual(ea.filter(e=>e.type==='joker_removed').map(e=>e.sourceId),eb.filter(e=>e.type==='joker_removed').map(e=>e.sourceId));
 assert.deepEqual(a.rng,b.rng);
});
test('deferred slicing keeps original adjacency and suppresses sliced Marble/copy targets',()=>{
 const s=setup(['j_ceremonial','j_marble','j_blueprint','j_ceremonial','j_joker']),events=[];
 const pending=lifecycle.applyItem7BlindStart(s,events,{deferRemoval:true});
 assert.equal(s.jokers.length,5);assert.equal(s.jokers[1].gettingSliced,true);assert.equal(s.jokers[4].gettingSliced,true);
 assert.deepEqual(applyJokerBlindStart(s,events),[]);
 lifecycle.finishItem7BlindStart(s,events,pending);
 assert.deepEqual(s.jokers.map(j=>j.id),['j0','j2','j3']);
 assert.equal(s.jokers[0].mult,4);assert.equal(s.jokers[2].mult,4);
 assert.equal(events.filter(e=>e.type==='joker_removed').length,2);
});
test('round target picks weight physical instances and use immutable creation order',()=>{
 const s=setup(['j_idol','j_mail','j_ancient','j_castle']);
 const ids=['card_spades_11','card_clubs_2','card_hearts_14'];
 s.cards=Object.fromEntries(ids.map(id=>[id,s.cards[id]]));s.hand=[];s.drawPile=[...ids];s.discardPile=[];
 const copy=createPlayingCard(s,{rank:2,suit:'clubs'});s.cards.card_hearts_14.enhancement='stone';
 const candidates=canonicalCards(s.cards).map(id=>s.cards[id]).filter(c=>c.enhancement!=='stone');
 let rng=s.rng.apk;
 const pick=key=>{const d=nextApkRandom(rng,key+s.round.ante,1,candidates.length);rng=d.rng;return candidates[d.value-1];};
 const idol=pick('idol'),mail=pick('mail');
 const ancient=nextApkRandom(rng,'anc'+s.round.ante,1,3);rng=ancient.rng;
 const castle=pick('cas');
 lifecycle.resetItem7RoundTargets(s);
 assert.deepEqual(s.round.idolCard,{rank:idol.rank,suit:idol.suit});assert.equal(s.round.mailRank,mail.rank);
 assert.equal(s.round.castleSuit,castle.suit);assert.deepEqual(s.rng.apk,rng);assert.ok(copy.creationOrdinal>52);
});
test('onlyMissing target setup preserves prior values and consumes no existing target streams',()=>{
 const s=setup(['j_idol','j_mail','j_ancient','j_castle']);lifecycle.resetItem7RoundTargets(s);const prior=structuredClone(s);
 lifecycle.resetItem7RoundTargets(s,{onlyMissing:true});assert.deepEqual(s,prior);
 delete s.round.mailRank;const old=structuredClone(s.rng.apk),draw=nextApkRandom(old,'mail'+s.round.ante,1,52);
 lifecycle.resetItem7RoundTargets(s,{onlyMissing:true});assert.deepEqual(s.rng.apk,draw.rng);assert.equal(s.round.idolCard.rank,prior.round.idolCard.rank);
});
test('Stone accessors retain raw RNG for discard rank and face predicates',()=>{
 for(const key of ['j_mail','j_hit_the_road','j_faceless']){
  const s=setup([key]);s.round.discardsUsed=0;s.round.mailRank=11;s.cards.card_spades_11.enhancement='stone';
  const before=s.rng.apk.mathState,expected=nextApkMathRandom(before).state;
  lifecycle.applyItem7Discard(s,['card_spades_11'],[]);assert.deepEqual(s.rng.apk.mathState,expected,key);
 }
 const s=setup(['j_caino','j_pareidolia']);s.cards.card_spades_11.enhancement='stone';
 const expected=nextApkMathRandom(s.rng.apk.mathState).state;
 lifecycle.applyItem7CardsDestroyed(s,[s.cards.card_spades_11],[]);
 assert.equal(s.jokers[0].cainoXMult,2);assert.deepEqual(s.rng.apk.mathState,expected);
});
test('DNA preserves permanent Hiker bonus on a fresh physical identity',()=>{
 const s=setup(['j_dna','j_hologram']);s.round.handsPlayed=0;s.cards.card_spades_6.permaBonus=35;
 const made=applyJokerBeforeScore(s,['card_spades_6'],[]);assert.equal(made.length,1);assert.equal(made[0].permaBonus,35);assert.notEqual(made[0].id,'card_spades_6');assert.equal(s.jokers[1].xMult,1.25);
});
