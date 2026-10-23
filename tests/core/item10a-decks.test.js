import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {DECKS} from '../../src/content/decks.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {scoreHand} from '../../src/core/score.js';
import {getCashout} from '../../src/core/cashout.js';
import {bossTarget} from '../../src/core/boss-effects.js';
import {createApkShopContext,generateApkShop} from '../../src/core/apk-shop.js';
const run=(deckId,seed='DECK10AA')=>createRun(seed,{runId:'decks',deckId,money:4n,referenceRng:true,referenceShop:true,reducedMotion:true});
const action=(s,type,extra={})=>{const r=dispatch(s,{type,expectedRevision:s.revision,...extra});assert.equal(r.error,null,JSON.stringify(r.error));return r.state;};
const roundtrip=s=>{assert.deepEqual(deserializeState(serializeState(s)),s);return s;};
test('10a catalog contains exactly the 15 native playable decks',()=>assert.deepEqual(Object.keys(DECKS),['red','blue','yellow','green','black','magic','nebula','ghost','abandoned','checkered','zodiac','painted','anaglyph','plasma','erratic']));
for(const deck of ['red','blue','yellow','green','black','magic','nebula','ghost','abandoned','checkered','zodiac','painted','anaglyph','plasma','erratic'])test('10a '+deck+' startup, deal and resume are deterministic',()=>{
 let s=roundtrip(run(deck));assert.deepEqual(s,run(deck));s=roundtrip(action(s,'START_BLIND'));
 assert.equal(s.hand.length,deck==='painted'?10:8);
 s=action(s,'PLAY_HAND',{cardIds:s.hand.slice(0,1)});roundtrip(s);
 if(s.phase==='playing'){s=action(s,'DISCARD',{cardIds:s.hand.slice(0,1)});roundtrip(s);}
});
test('10a resource decks apply their native starting bonuses',()=>{
 assert.equal(run('yellow').money,14n);assert.equal(run('black').round.handsRemaining,3);assert.equal(run('black').jokerSlots,6);
 assert.equal(run('painted').round.handSize,10);assert.equal(run('painted').jokerSlots,4);
 assert.equal(run('magic').consumableSlots,3);assert.deepEqual(run('magic').consumables.map(c=>c.entityId),['c_fool','c_fool']);assert.deepEqual(run('magic').apkShop.context.usedVoucherIds,['v_crystal_ball']);
 assert.equal(run('nebula').consumableSlots,1);assert.deepEqual(run('nebula').apkShop.context.usedVoucherIds,['v_telescope']);
 assert.equal(run('ghost').apkShop.context.rates.Spectral,2);assert.deepEqual(run('ghost').consumables.map(c=>c.entityId),['c_hex']);
 const z=run('zodiac');assert.deepEqual(z.apkShop.context.usedVoucherIds,['v_tarot_merchant','v_planet_merchant','v_overstock_norm']);assert.equal(z.apkShop.context.mainSlots,3);assert.equal(z.apkShop.context.rates.Tarot,9.6);assert.equal(z.apkShop.context.rates.Planet,9.6);
 for(const id of ['magic','nebula','ghost','zodiac'])assert.equal(run(id).consumableUsageTotal.all,0);
});
test('10a Abandoned has forty cards and Checkered has only spades and hearts',()=>{
 const a=run('abandoned');assert.equal(Object.keys(a.cards).length,40);assert.equal(Object.values(a.cards).some(c=>c.rank>=11&&c.rank<=13),false);
 const c=run('checkered');assert.equal(Object.values(c.cards).filter(c=>c.suit==='spades').length,26);assert.equal(Object.values(c.cards).filter(c=>c.suit==='hearts').length,26);
});
test('10a Erratic has 52 stable physical cards with seeded duplicate fronts',()=>{
 const s=run('erratic'),fronts=Object.values(s.cards).map(c=>c.suit+':'+c.rank);assert.equal(fronts.length,52);assert.ok(new Set(fronts).size<52);assert.notDeepEqual(fronts,Object.values(run('erratic','DIFF10AA').cards).map(c=>c.suit+':'+c.rank));assert.equal(typeof s.rng.apk.streams.erratic,'number');roundtrip(s);
});
test('10a Green payout uses $2 per remaining hand, $1 per discard and no interest',()=>{
 const s=run('green');s.phase='round_won';s.round.score=s.round.target;s.round.handsRemaining=2;s.round.discardsRemaining=3;s.money=100n;
 const q=getCashout(s);assert.equal(q.hands,2n);assert.equal(q.handReward,4n);assert.equal(q.discards,3n);assert.equal(q.interest,0n);assert.equal(q.total,10n);
 let next=roundtrip(action(s,'CASH_OUT'));next=roundtrip(action(next,'LEAVE_SHOP'));assert.equal(next.round.handsRemaining,4);assert.equal(next.round.discardsRemaining,3);
});
test('10a Black reset counters survive cashout, shop and a skipped blind',()=>{
 let s=run('black');s.phase='round_won';s.round.score=s.round.target;s.round.handsRemaining=1;s=roundtrip(action(s,'CASH_OUT'));assert.equal(s.round.handsRemaining,3);s=roundtrip(action(s,'LEAVE_SHOP'));assert.equal(s.round.handsRemaining,3);
 s.apkBlinds.tags.big='tag_economy';s=roundtrip(action(s,'SKIP_BLIND'));assert.equal(s.round.blindId,'boss');assert.equal(s.round.handsRemaining,3);
});
test('10a Plasma balances after all modifiers and floors both factors',()=>{
 const s=run('plasma');const card=s.cards.card_clubs_2;s.hand=[card.id];
 const result=scoreHand(s,[card]);assert.equal(result.chips,4n);assert.equal(result.mult,4n);assert.equal(result.score,16n);assert.equal(result.trace.at(-2).operation,'balance');
 s.jokers=[{id:'j',entityId:'j_joker',edition:'polychrome'}];const modified=scoreHand(s,[card]);assert.equal(modified.chips,7n);assert.equal(modified.mult,7n);assert.equal(modified.score,49n);
});
test('10a Plasma doubles all blind targets including skips and bosses',()=>{
 let s=run('plasma');assert.equal(s.round.target,600n);assert.equal(bossTarget(s)%2n,0n);s.apkBlinds.tags.small='tag_economy';s=roundtrip(action(s,'SKIP_BLIND'));assert.equal(s.round.target,900n);
 const boss=bossTarget(s);s.apkBlinds.tags.big='tag_economy';s=roundtrip(action(s,'SKIP_BLIND'));assert.equal(s.round.target,boss);
});
test('10a Anaglyph grants one Double only after a boss is beaten, with replay and stale guard',()=>{
 let s=run('anaglyph');s.round.blindId='boss';s.apkBlinds.bossId='bl_club';s.apkBlinds.bossesUsed.bl_club=1;s.round.target=bossTarget(s);s=action(s,'START_BLIND');s.handLevels.high_card=1000;
 const r=dispatch(s,{type:'PLAY_HAND',expectedRevision:s.revision,cardIds:s.hand.slice(0,1)});assert.equal(r.error,null);assert.equal(r.state.phase,'round_won');assert.equal(r.state.pendingDoubleTags,1);roundtrip(r.state);
 assert.equal(dispatch(r.state,{type:'PLAY_HAND',expectedRevision:s.revision,cardIds:s.hand.slice(0,1)}).error.code,'STALE_ACTION');
});
test('10a starting voucher is excluded from offers and Ghost can draw real shop Spectral',()=>{
 for(const id of ['magic','nebula','zodiac']){const s=run(id);assert.ok(!s.apkShop.context.usedVoucherIds.includes(s.apkShop.voucherId));}
 const s=run('ghost'),context=createApkShopContext({...s.apkShop.context,mainSlots:30,rates:{Joker:0,Tarot:0,Planet:0,Base:0,Spectral:2}}),shop=generateApkShop(s.rng.apk,context,{voucherId:s.apkShop.voucherId});assert.ok(shop.offers.main.every(c=>c.set==='Spectral'));assert.ok(shop.offers.main.every(c=>!['c_soul','c_black_hole'].includes(c.entityId)));
});

test('10a Green earned quote freezes money and counters through sale and replay',()=>{
 let s=action(run('green'),'START_BLIND');s.money=100n;s.handLevels.high_card=1000;s.jokers=[{id:'golden',entityId:'j_golden',sellCost:2n}];
 s=roundtrip(action(s,'PLAY_HAND',{cardIds:s.hand.slice(0,1)}));assert.equal(s.phase,'round_won');
 const q=getCashout(s);assert.equal(q.hands,3n);assert.equal(q.handReward,6n);assert.equal(q.discards,3n);assert.equal(q.interest,0n);assert.equal(q.total,16n);
 const before=s;s=roundtrip(action(s,'SELL_OWNED_CARD',{area:'jokers',cardId:'golden'}));assert.deepEqual(getCashout(s),q);
 const paid=roundtrip(action(s,'CASH_OUT'));assert.equal(paid.money,s.money+q.total);
 const raw=JSON.parse(serializeState(before));raw.state.cashoutQuote.quote.discards='99';assert.throws(()=>deserializeState(JSON.stringify(raw)));
});

test('10a Plasma rejects forged unbalanced trace and remains exact above safe integers',()=>{
 let s=action(run('plasma'),'START_BLIND');s=roundtrip(action(s,'PLAY_HAND',{cardIds:s.hand.slice(0,1)}));
 const raw=JSON.parse(serializeState(s));raw.state.lastScore.trace.at(-2).after.mult='99';assert.throws(()=>deserializeState(JSON.stringify(raw)));
 const huge=run('plasma');huge.handLevels.high_card=9007199254740991;const r=scoreHand(huge,[huge.cards.card_clubs_2]);assert.equal(r.chips,r.mult);assert.equal(r.score,r.chips*r.chips);
});

test('10a starting consumables can be sold once without changing initial voucher effects',()=>{
 for(const id of ['magic','ghost']){let s=run(id);const card=s.consumables[0],before=s.money;s=roundtrip(action(s,'SELL_OWNED_CARD',{area:'consumables',cardId:card.id}));assert.equal(s.money,before+card.sellCost);assert.equal(s.consumables.length,id==='magic'?1:0);if(id==='magic')assert.equal(s.consumableSlots,3);}
});

test('10a every deck can start, play and resume against all 28 bosses',async()=>{
 const {APK_BOSSES}=await import('../../src/content/apk-blinds.js');
 for(const deck of Object.keys(DECKS))for(const boss of APK_BOSSES){
  try{
   let s=run(deck),ante=boss.showdown?8:Math.max(1,boss.minAnte);s.round.ante=ante;s.round.blindId='boss';s.apkShop.context.ante=ante;s.apkBlinds.ante=ante;s.apkBlinds.tagContext.ante=ante;s.apkBlinds.tags={small:'tag_economy',big:'tag_economy'};s.apkBlinds.bossId=boss.id;s.apkBlinds.bossesUsed[boss.id]=1;s.round.target=bossTarget(s);
   s=roundtrip(action(s,'START_BLIND'));let ids=s.hand.slice(0,1);if(s.bossState.forcedCardId)ids=[s.bossState.forcedCardId];s=roundtrip(action(s,'PLAY_HAND',{cardIds:ids}));
   if(s.phase==='playing'&&s.round.discardsRemaining)s=roundtrip(action(s,'DISCARD',{cardIds:s.bossState.forcedCardId?[s.bossState.forcedCardId]:s.hand.slice(0,1)}));
  }catch(error){throw new Error(deck+' / '+boss.id+': '+error.message,{cause:error});}
 }
});

test('10a blind selection previews include Plasma scaling before entering a blind',async()=>{
 const {blindChoiceTarget}=await import('../../src/ui/blind-select.js');const s=run('plasma');s.apkBlinds.bossId='bl_club';
 assert.equal(blindChoiceTarget(s,'small'),600n);assert.equal(blindChoiceTarget(s,'big'),900n);assert.equal(blindChoiceTarget(s,'boss'),1200n);
 const ordinary=run('black');ordinary.apkBlinds.bossId='bl_club';assert.equal(blindChoiceTarget(ordinary,'big'),450n);assert.equal(blindChoiceTarget(ordinary,'boss'),600n);
});
