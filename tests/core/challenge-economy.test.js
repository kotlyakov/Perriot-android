import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../../src/core/run.js';
import {getCashout,captureCashoutQuote} from '../../src/core/cashout.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {generateApkShop,generateApkEffectCards,session} from '../../src/core/apk-shop.js';
import {applyShopAction,createShop,canBuyShopCard} from '../../src/core/shop.js';
import {chooseNextAnteBlinds} from '../../src/core/blind-progression.js';
import {generateApkRemainingPack} from '../../src/core/booster-generation.js';
const fresh=id=>{const state=createRun('CHALLENGE-ECONOMY',{runId:'challenge-economy',money:4n,referenceRng:true,referenceShop:true});state.challengeId=id;return state;};
test('challenge cashout suppresses reward, unused hand money and interest with validated snapshots',()=>{
 for(const [id,reward,hands,interest] of [['omelette',0n,0n,0n],['mad_world',3n,0n,0n],['cruelty',0n,3n,5n]]){
  const state=fresh(id);state.phase='round_won';state.money=100n;state.round.score=state.round.target;state.round.handsRemaining=3;
  const q=getCashout(state);assert.equal(q.reward,reward,id);assert.equal(q.hands,hands,id);assert.equal(q.interest,interest,id);assert.equal(q.total,reward+hands+interest,id);
  state.cashoutQuote=captureCashoutQuote(state);assert.deepEqual(getCashout(state),q,id);
 }
});
test('challenge contexts enforce shop rates, eternal and complete booster family bans',()=>{
 assert.equal(currentApkShopContext(fresh('bram_poker')).rates.Joker,0);
 const state=fresh('jokerless'),context=currentApkShopContext(state);
 assert.equal(context.bannedCentreIds.includes('p_buffoon_normal_1'),true);assert.equal(context.bannedCentreIds.includes('p_buffoon_mega_1'),true);
 for(let index=0;index<20;index++){
  const generated=generateApkShop(state.rng.apk,context,{voucherId:'v_blank',instancePrefix:'test'+index});state.rng.apk=generated.rng;
  assert.ok(generated.offers.main.every(c=>c.set!=='Joker'));assert.ok(generated.offers.boosters.every(c=>!c.entityId.startsWith('p_buffoon')));
 }
 const eternal=fresh('non_perishable'),pack=generateApkRemainingPack(eternal.rng.apk,currentApkShopContext(eternal),{boosterId:'p_buffoon_mega_1'});
 assert.ok(pack.cards.every(c=>c.eternal));
});
test('inflation increments accepted main purchases and reprices owned and remaining cards',()=>{
 const state=fresh('inflation');state.phase='shop';state.money=100n;state.jokers=[];
 const s=session(state.rng.apk,currentApkShopContext(state)),first=s.construct('j_joker','one',{main:true}),second=s.construct('j_greedy_joker','two',{main:true});state.rng.apk=s.rng;
 state.shop=createShop({offers:{main:[first,second],vouchers:[],boosters:[]}});
 const buy=applyShopAction(state,{type:'BUY_SHOP_CARD',offerId:'one',expectedRevision:state.revision});assert.equal(buy.error,null);
 assert.equal(buy.state.money,100n-first.cost);assert.equal(buy.state.apkShop.context.inflation,1);assert.equal(buy.state.shop.main[0].cost,second.cost+1n);
 assert.equal(canBuyShopCard(buy.state,buy.state.shop.main[0]),true);
 const again=applyShopAction(buy.state,{type:'BUY_SHOP_CARD',offerId:'two',expectedRevision:buy.state.revision});assert.equal(again.error,null);assert.equal(again.state.apkShop.context.inflation,2);
 assert.equal(state.apkShop.context.inflation,0);
});
test('subsequent ante generation retains challenge boss and tag bans',()=>{
 const state=fresh('jokerless');state.round.ante=7;
 for(let index=0;index<30;index++){
  const generated=chooseNextAnteBlinds(state,state.rng.apk);state.rng.apk=generated.rng;
  assert.ok(!['bl_final_heart','bl_final_leaf','bl_final_acorn'].includes(generated.selection.bossId));
  assert.ok(generated.selection.tagContext.bannedKeys.includes('tag_buffoon'));
 }
});

test('challenge rerolls retain banned centres, no-shop-Joker rates and Eternal stickers',()=>{
 for(const id of ['omelette','non_perishable','jokerless']){
  let state=fresh(id);state.phase='shop';state.money=1000n;state.shop=createShop({offers:{main:[],vouchers:[],boosters:[]}});
  for(let index=0;index<12;index++){
   const next=applyShopAction(state,{type:'REROLL_SHOP',expectedRevision:state.revision});assert.equal(next.error,null);state=next.state;
   for(const card of state.shop.main){
    assert.ok(!currentApkShopContext(state).bannedCentreIds.includes(card.entityId));
    if(id==='jokerless')assert.notEqual(card.set,'Joker');
    if(id==='non_perishable'&&card.set==='Joker')assert.equal(card.eternal,true);
   }
  }
 }
});


test('challenge restrictions apply to effect generation while no-shop-Jokers only changes shop rates',()=>{
 const eternal=fresh('non_perishable');
 const generated=generateApkEffectCards(eternal.rng.apk,currentApkShopContext(eternal),{set:'Joker',count:25,instancePrefix:'effect',append:'test'});
 assert.ok(generated.cards.every(card=>card.eternal));
 assert.ok(generated.cards.every(card=>!currentApkShopContext(eternal).bannedCentreIds.includes(card.entityId)));
 const bram=fresh('bram_poker');
 const allowed=generateApkEffectCards(bram.rng.apk,currentApkShopContext(bram),{set:'Joker',count:1,instancePrefix:'bram-effect'});
 assert.equal(allowed.cards[0].set,'Joker');
});

function inflationShop(){
 const state=fresh('inflation');state.phase='shop';state.money=100n;
 const s=session(state.rng.apk,currentApkShopContext(state));
 state.shop=createShop({offers:{main:[s.construct('j_joker','main')],vouchers:[s.construct('v_blank','voucher')],boosters:[s.construct('p_buffoon_normal_1','pack')]}});state.rng.apk=s.rng;
 return state;
}
test('native Inflation also counts voucher redemption',async()=>{
 const {applyVoucherAction}=await import('../../src/core/vouchers.js');
 const state=inflationShop();
 const redeemed=applyVoucherAction(state,{type:'BUY_VOUCHER',offerId:'voucher',expectedRevision:state.revision});assert.equal(redeemed.error,null);
 assert.equal(redeemed.state.apkShop.context.inflation,1);assert.equal(redeemed.state.shop.main[0].cost,state.shop.main[0].cost+1n);
 assert.equal(state.apkShop.context.inflation,0);
});
test('native Inflation also counts paid and free booster openings before constructing pack cards',async()=>{
 const {applyCelestialPackAction}=await import('../../src/core/celestial-pack.js');
 for(const cost of [4n,0n]){
  const staged=inflationShop();staged.shop.boosters[0].cost=cost;
  const opened=applyCelestialPackAction(staged,{type:'OPEN_BOOSTER',offerId:'pack',expectedRevision:staged.revision});assert.equal(opened.error,null);
  assert.equal(opened.state.money,staged.money-cost);assert.equal(opened.state.apkShop.context.inflation,1);
  assert.equal(opened.state.shop.main[0].cost,staged.shop.main[0].cost+1n);
  const repricer=session(opened.state.rng.apk,currentApkShopContext(opened.state));
  for(const card of opened.state.packState.cards)assert.equal(card.sellCost,repricer.reprice({...card}).sellCost);
  assert.equal(staged.apkShop.context.inflation,0);
 }
});
test('native Inflation counts free tag packs through the blind-selection lifecycle',async()=>{
 const {openPendingTagPack}=await import('../../src/core/celestial-pack.js');
 const state=fresh('inflation');state.pendingTagPacks=['tag_buffoon'];
 const next=openPendingTagPack(state,[]);
 assert.equal(next.apkShop.context.inflation,1);assert.equal(next.money,state.money);
 assert.equal(next.packState.returnPhase,'blind_selection');assert.equal(state.apkShop.context.inflation,0);
});
