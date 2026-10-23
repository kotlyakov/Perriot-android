import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../../src/core/run.js';
import {CHALLENGES} from '../../src/content/challenges.js';
import {applyChallengeStart} from '../../src/core/challenge-start.js';
import {hasJokerSpace} from '../../src/core/shop.js';
import {voucherModifiers} from '../../src/core/vouchers.js';

const start=id=>createRun('NATIVE-CHALLENGE-START',{runId:`start-${id}`,challengeId:id,money:999n});
// Native Challenge Deck has the neutral 4 hands, 3 discards and 8-card hand.
const resources={rich_get_richer:[100n,4,3,8,5],luxury_tax:[4n,4,3,10,5],blast_off:[4n,2,2,8,4],five_card_draw:[4n,4,6,5,7],golden_needle:[10n,1,6,8,5],cruelty:[4n,4,3,8,3],jokerless:[4n,4,3,8,0]};
const inventories={omelette:['j_egg','j_egg','j_egg','j_egg','j_egg'],fifteen_minute_city:['j_ride_the_bus','j_shortcut'],knife_edge:['j_ceremonial'],mad_world:['j_pareidolia','j_business'],medusa:['j_marble'],inflation:['j_credit_card'],bram_poker:['j_vampire'],fragile:['j_oops','j_oops'],monolith:['j_obelisk','j_marble'],blast_off:['j_constellation','j_rocket'],five_card_draw:['j_card_sharp','j_joker'],golden_needle:['j_credit_card']};
const eternal=new Set(['fifteen_minute_city','knife_edge','mad_world','medusa','bram_poker','fragile','monolith','blast_off']);
const vouchers={rich_get_richer:['v_seed_money','v_money_tree'],bram_poker:['v_magic_trick','v_illusion'],blast_off:['v_planet_merchant','v_planet_tycoon']};

test('all 20 native challenge starts use neutral resources and exact initial inventories',()=>{
 assert.equal(CHALLENGES.length,20);
 for(const challenge of CHALLENGES){
  const state=start(challenge.id),id=challenge.id;
  assert.match(challenge.name,/[А-Яа-я]/,id);
  assert.deepEqual([state.money,state.round.handsRemaining,state.round.discardsRemaining,state.round.handSize,state.jokerSlots??5],resources[id]??[4n,4,3,8,5],id);
  assert.deepEqual(state.jokers.map(j=>j.entityId),inventories[id]??[],id);
  assert.deepEqual(state.jokers.map(j=>!!j.eternal),state.jokers.map(()=>eternal.has(id)),id);
  assert.deepEqual(state.jokers.map(j=>j.edition==='negative'),state.jokers.map((_,i)=>id==='fragile'||id==='mad_world'&&i===0||id==='monolith'&&i===1),id);
  assert.equal(state.jokers.filter(j=>j.pinned).length,id==='knife_edge'?1:0,id);
  assert.deepEqual((state.consumables??[]).map(c=>c.entityId),id==='bram_poker'?['c_empress','c_emperor']:[],id);
  assert.deepEqual(state.apkShop.context.usedVoucherIds,vouchers[id]??[],id);
  assert.deepEqual(state.apkShop.context.ownedCentreIds,[...state.jokers,...(state.consumables??[])].map(c=>c.entityId),id);
  assert.equal(state.bankruptAt??0n,['inflation','golden_needle'].includes(id)?-20n:0n,id);
  assert.deepEqual(state.runStats,{handsPlayed:0,unusedDiscards:0,skips:0},id);
  assert.equal(state.consumableUsageTotal.all,0,id);
  assert.equal(new Set([...state.jokers,...(state.consumables??[])].map(c=>c.id)).size,state.jokers.length+(state.consumables??[]).length,id);
 }
});

test('native custom challenge decks retain exact rank, enhancement and seal distributions',()=>{
 for(const {id} of CHALLENGES){
  const state=start(id),cards=Object.values(state.cards);
  assert.equal(cards.length,id==='mad_world'?32:52,id);
  assert.equal(state.drawPile.length,cards.length,id);
  for(const suit of ['clubs','diamonds','hearts','spades']){
   const ranks=cards.filter(c=>c.suit===suit).map(c=>c.rank).sort((a,b)=>a-b);
   const expected=id==='fifteen_minute_city'?[4,5,6,7,8,9,10,11,11,12,12,13,13]:id==='mad_world'?[2,3,4,5,6,7,8,9]:[2,3,4,5,6,7,8,9,10,11,12,13,14];
   assert.deepEqual(ranks,expected,id);
  }
  assert.equal(cards.filter(c=>c.enhancement==='stone').length,id==='medusa'?12:0,id);
  assert.equal(cards.filter(c=>c.enhancement==='glass').length,id==='fragile'?52:0,id);
  assert.equal(cards.filter(c=>c.seal==='red').length,id==='double_or_nothing'?52:0,id);
  assert.deepEqual(state.apkShop.context.enhancementIds,id==='medusa'?['m_stone']:id==='fragile'?['m_glass']:[],id);
 }
});

test('starting vouchers and negative Jokers apply their passive effects without consuming purchases',()=>{
 assert.equal(voucherModifiers(start('rich_get_richer')).interestCap,20n);
 assert.equal(start('bram_poker').apkShop.context.rates.Base,4);
 assert.equal(start('bram_poker').apkShop.context.rates.Joker,0);
 assert.equal(start('blast_off').apkShop.context.rates.Planet,32);
 const fragile=start('fragile');assert.equal(fragile.jokerSlots??5,5);
 assert.deepEqual(fragile.jokers.map(j=>[j.cost,j.sellCost]),[[9n,4n],[9n,4n]]);
 while(fragile.jokers.length<7)fragile.jokers.push({id:`filler${fragile.jokers.length}`,entityId:'j_joker',edition:'base'});
 assert.equal(hasJokerSpace(fragile),false);
 assert.equal(hasJokerSpace(fragile,{edition:'negative'}),true);
 assert.equal(start('monolith').jokers[0].xMult,1);
 assert.equal(start('blast_off').jokers[1].rocketDollars,1n);
});

test('starting inventory advances the caller RNG and repeated full starts replay exactly',()=>{
 const state=createRun('CHALLENGE-RNG',{runId:'challenge-rng',money:4n,referenceRng:true,referenceShop:true});
 const before=structuredClone(state.rng.apk),after=applyChallengeStart(state,CHALLENGES[0]);
 assert.notDeepEqual(after,before);assert.deepEqual(after,state.rng.apk);
 for(const {id} of CHALLENGES)assert.deepEqual(start(id),start(id),id);
});
