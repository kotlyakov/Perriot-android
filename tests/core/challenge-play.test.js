import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {scoreHand} from '../../src/core/score.js';
import {isBossCardDebuffed} from '../../src/core/boss-effects.js';
import {runDiscards} from '../../src/core/stakes.js';
import {nextApkRandom} from '../../src/core/apk-rng.js';
import {createPlayingCard} from '../../src/core/apk-deck.js';

const run=id=>createRun('CHALTEST',{runId:`challenge-${id}`,money:4n,challengeId:id});
const act=(s,type,extra={})=>{const r=dispatch(s,{type,expectedRevision:s.revision,...extra});assert.equal(r.error,null,JSON.stringify(r.error));return r.state;};
test('challenge counters use neutral deck resources',()=>{assert.equal(runDiscards(run('omelette')),3);assert.equal(runDiscards(run('golden_needle')),6);});
test('Golden Needle charges each discard even when debt crosses credit limit',()=>{
 let s=act(run('golden_needle'),'START_BLIND');s.money=-20n;
 s=act(s,'DISCARD',{cardIds:[s.hand[0]]});assert.equal(s.money,-21n);assert.equal(s.round.discardsRemaining,5);
});
test('Rich get Richer caps base and every chips step at money without blocking multipliers',()=>{
 const s=run('rich_get_richer');s.money=2n;s.hand=['card_clubs_14'];s.jokers=[];
 const result=scoreHand(s,[s.cards[s.hand[0]]]);assert.equal(result.chips,2n);assert.equal(result.score,2n);
 assert.ok(result.trace.filter(e=>e.type==='score_step').every(e=>e.after.chips<=2n));
 s.money=-1n;assert.equal(scoreHand(s,[s.cards[s.hand[0]]]).score,0n);
});
test('Double or Nothing permanently debuffs only scoring cards after score',()=>{
 let s=act(run('double_or_nothing'),'START_BLIND');
 s.hand=['card_clubs_2','card_hearts_2','card_spades_14'];s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));s.round.target=999999n;
 s=act(s,'PLAY_HAND',{cardIds:[...s.hand]});
 assert.deepEqual(new Set(s.challengePlayedCardIds),new Set(['card_clubs_2','card_hearts_2']));
 assert.equal(isBossCardDebuffed(s,s.cards.card_clubs_2),true);assert.equal(isBossCardDebuffed(s,s.cards.card_spades_14),false);
});
test('X-ray Vision consumes flipped_card RNG for every dealt card',()=>{
 const before=run('xray_vision');let rng=before.rng.apk;const expected=[];
 // START_BLIND first shuffles nr1, so compare the persisted stream itself.
 const s=act(before,'START_BLIND');
 for(let i=0;i<s.hand.length;i++){const draw=nextApkRandom(rng,'flipped_card');rng=draw.rng;expected.push(draw.value<0.25);}
 assert.equal(s.rng.apk.streams.flipped_card,rng.streams.flipped_card);
 assert.equal(s.challengeFlippedCardIds.length,expected.filter(Boolean).length);
});
test('Luxury Tax recalculates on money changes and uses floor for negative dollars',()=>{
 let s=act(run('luxury_tax'),'START_BLIND');s.money=-1n;
 s=act(s,'SET_SORT',{mode:'suit'});assert.equal(s.round.handSize,11);assert.equal(s.challengeLuxuryTax,-1);
 s.money=50n;s=act(s,'SET_SORT',{mode:'rank'});assert.equal(s.round.handSize,0);
});
test('pinned ceremonial dagger cannot change position through reorder',()=>{
 const s=run('knife_edge');s.jokers.push({...s.jokers[0],id:'other',entityId:'j_joker',originalKey:'j_joker',pinned:false,eternal:false,creationOrdinal:2});
 const r=dispatch(s,{type:'REORDER_JOKERS',expectedRevision:s.revision,cardIds:s.jokers.map(j=>j.id).reverse()});assert.ok(r.error);assert.equal(r.state,s);
});
test('physical copies inherit permanent challenge debuff while new cards remain clean',()=>{
 const s=run('double_or_nothing');s.challengePlayedCardIds=['card_clubs_2'];
 const copy=createPlayingCard(s,s.cards.card_clubs_2);
 const fresh=createPlayingCard(s,{rank:2,suit:'clubs'});
 assert.equal(isBossCardDebuffed(s,copy),true);assert.equal(isBossCardDebuffed(s,fresh),false);
});
test('initial voucher selection respects challenge bans and already granted vouchers',()=>{
 for(const [seed,id,banned]of [['R45','omelette','v_seed_money'],['R64','inflation','v_clearance_sale'],['R16','fragile','v_magic_trick'],['R25','blast_off','v_grabber']]){
  const s=createRun(seed,{runId:'voucher-check',money:4n,challengeId:id});assert.notEqual(s.apkShop.voucherId,banned);
 }
 for(let i=0;i<60;i++){const s=createRun('V'+i,{runId:'voucher-check',money:4n,challengeId:'rich_get_richer'});assert.ok(!['v_seed_money','v_money_tree'].includes(s.apkShop.voucherId));}
});
test('reapplying an enhancement replaces the native ability and clears permanent challenge debuff',()=>{
 let s=act(run('double_or_nothing'),'START_BLIND');const id=s.hand[0];
 s.challengePlayedCardIds=[id];s.cards[id].enhancement='mult';
 s.consumables=[{id:'empress',entityId:'c_empress',originalKey:'c_empress',set:'Tarot',edition:'base',cost:3n,sellCost:1n}];
 s=act(s,'USE_CONSUMABLE',{cardId:'empress',targetCardIds:[id]});
 assert.equal(s.cards[id].enhancement,'mult');assert.equal(isBossCardDebuffed(s,s.cards[id]),false);
});
