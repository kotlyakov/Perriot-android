import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRun} from '../../src/core/run.js';
import {createShop,getRerollCost,applyShopAction} from '../../src/core/shop.js';
import {session,createApkShopContext} from '../../src/core/apk-shop.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {applyVoucherAction,voucherModifiers,syncVoucherShopContext,getObservatorySources,canBuyVoucher,
 applyBossRerollAction,canRerollBoss,SUPPORTED_VOUCHERS} from '../../src/core/vouchers.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
const centres=new Map(catalogue.centres.map(card=>[card.key,card]));
function fresh(key='v_blank',used=[]){
 const state=createRun('ITEM9-VOUCHERS',{runId:'item9-vouchers',money:100n,referenceRng:true,referenceShop:true});
 state.phase='shop';state.round.ante=3;state.round.target=2000n;
 state.apkShop.context.usedVoucherIds=[...used];syncVoucherShopContext(state);
 const generator=session(state.rng.apk,currentApkShopContext(state));
 const main=generator.main('voucher-fixture');state.rng.apk=generator.rng;
 state.shop=createShop({offers:{main,vouchers:[{id:'voucher',entityId:key,originalKey:key,set:'Voucher',edition:'base',cost:10n,sellCost:5n}],boosters:[]},rerollBase:voucherModifiers(state).rerollBase});
 state.apkShop.voucherId='v_blank';return state;
}
const action=state=>({type:'BUY_VOUCHER',offerId:'voucher',expectedRevision:state.revision});
const redeem=state=>{const result=applyVoucherAction(state,action(state));assert.equal(result.error,null);return result.state;};

test('all32 prerequisite chains match independently executed original Card:apply_to_run facts',()=>{
 // Facts captured using original Lua via liblua5.4 with synchronous event mocks;
 // no original source/assets are included, and this oracle makes no RNG claim.
 const fixtures=JSON.parse(readFileSync(new URL('../fixtures/item9-voucher-effects.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(fixtures).length,32);
 for(const [key,expected] of Object.entries(fixtures)){
  let state=fresh();state.round.handsRemaining=4;state.round.discardsRemaining=3;
  function buy(id){
   for(const prerequisite of centres.get(id).requires??[])if(!state.apkShop.context.usedVoucherIds.includes(prerequisite))buy(prerequisite);
   state.shop.vouchers=[{id:'voucher',entityId:id,originalKey:id,set:'Voucher',edition:'base',cost:10n,sellCost:5n}];
   state=redeem(state);
  }
  buy(key);const mod=voucherModifiers(state);
  const actual={ante:state.round.ante,blindAnte:state.round.ante,consumableSlots:state.consumableSlots??2,
   currentDiscards:state.round.discardsRemaining,currentHands:state.round.handsRemaining,currentRerollCost:Number(getRerollCost(state.shop)),
   discards:3+mod.discards,discountPercent:state.apkShop.context.discountPercent,editionRate:state.apkShop.context.editionRate,
   handSize:state.round.handSize,hands:4+mod.hands,interestCap:Number(mod.interestCap*5n),jokerSlots:state.jokerSlots??5,
   mainSlots:state.apkShop.context.mainSlots,planetRate:state.apkShop.context.rates.Planet,playingCardRate:state.apkShop.context.rates.Base,
   rerollBase:Number(mod.rerollBase),tarotRate:state.apkShop.context.rates.Tarot};
  assert.deepEqual(actual,expected,key);
 }
});

test('all 32 native Voucher identities redeem exactly once without mutating input',()=>{
 assert.equal(SUPPORTED_VOUCHERS.length,32);
 for(const key of SUPPORTED_VOUCHERS){
  const state=fresh(key,centres.get(key).requires??[]),before=structuredClone(state),next=redeem(state);
  assert.deepEqual(state,before,key);assert.equal(next.money,90n,key);assert.equal(next.revision,1,key);
  assert.deepEqual(next.apkShop.context.usedVoucherIds,[...before.apkShop.context.usedVoucherIds,key],key);
  assert.equal(next.shop.vouchers.length,0,key);assert.equal(next.apkShop.voucherId,null,key);
  const duplicate=applyVoucherAction(next,action(state));assert.equal(duplicate.error.code,'STALE_ACTION',key);
 }
});
test('missing prerequisites, insufficient money, stale action and repeated voucher fail atomically',()=>{
 for(const [key,mutate,code] of [
  ['v_money_tree',()=>{},'VOUCHER_PREREQUISITE'],
  ['v_blank',state=>{state.money=9n;},'INSUFFICIENT_FUNDS'],
  ['v_blank',state=>{state.apkShop.context.usedVoucherIds=['v_blank'];},'VOUCHER_REDEEMED'],
 ]){const state=fresh(key);mutate(state);const before=structuredClone(state),result=applyVoucherAction(state,action(state));assert.equal(result.error.code,code);assert.strictEqual(result.state,state);assert.deepEqual(state,before);assert.equal(canBuyVoucher(state,state.shop.vouchers[0]),false);}
 const state=fresh();state.bankruptAt=-20n;state.money=-10n;assert.equal(canBuyVoucher(state,state.shop.vouchers[0]),true);assert.equal(redeem(state).money,-20n);
 state.shop.vouchers[0].cost=-1n;assert.equal(applyVoucherAction(state,action(state)).error.code,'INVALID_STATE');
});
test('native Merchant/Tycoon, edition and playing-card rates replace rates rather than multiply them',()=>{
 for(const [key,used,field,value] of [
  ['v_tarot_merchant',[],'tarotRate',9.6],['v_tarot_tycoon',['v_tarot_merchant'],'tarotRate',32],
  ['v_planet_merchant',[],'planetRate',9.6],['v_planet_tycoon',['v_planet_merchant'],'planetRate',32],
  ['v_hone',[],'editionRate',2],['v_glow_up',['v_hone'],'editionRate',4],
  ['v_magic_trick',[],'playingCardRate',4],['v_illusion',['v_magic_trick'],'playingCardRate',4],
 ]){const next=redeem(fresh(key,used)),mod=voucherModifiers(next);assert.equal(mod[field],value,key);assert.equal(next.apkShop.context.editionRate,mod.editionRate);assert.equal(next.apkShop.context.rates.Tarot,mod.tarotRate);assert.equal(next.apkShop.context.rates.Planet,mod.planetRate);assert.equal(next.apkShop.context.rates.Base,mod.playingCardRate);}
 assert.deepEqual(voucherModifiers(createRun('no-vouchers',{runId:'empty',money:0n})),{hands:0,discards:0,handSize:0,jokerSlots:0,consumableSlots:0,anteReduction:0,interestCap:5n,rerollBase:5n,mainSlots:2,discountPercent:0,editionRate:1,tarotRate:4,planetRate:4,playingCardRate:0});
});
test('shop size fills all empty slots immediately, preserves existing cards and is deterministic',()=>{
 for(const [key,used,limit] of [['v_overstock_norm',[],3],['v_overstock_plus',['v_overstock_norm'],4]]){
  const state=fresh(key,used);state.shop.main=state.shop.main.slice(0,1);const owned=structuredClone(state.shop.main[0]),beforeRng=structuredClone(state.rng.apk);
  const next=redeem(state);assert.equal(next.shop.main.length,limit);assert.deepEqual(next.shop.main[0],owned);assert.notDeepEqual(next.rng.apk,beforeRng);assert.deepEqual(next,redeem(structuredClone(state)));
  assert.equal(new Set(next.shop.main.map(card=>card.id)).size,limit);
 }
});
test('Clearance/Liquidation reprice shop and owned cards, retain extra sell value and coupons',()=>{
 for(const [key,used,discount] of [['v_clearance_sale',[],25],['v_liquidation',['v_clearance_sale'],50]]){
  const state=fresh(key,used);state.jokers=[{id:'owned',entityId:'j_joker',originalKey:'j_joker',set:'Joker',edition:'base',cost:2n,sellCost:8n,extraValue:7n}];
  state.shop.main=[{id:'coupon',entityId:'j_joker',originalKey:'j_joker',set:'Joker',edition:'base',cost:0n,sellCost:1n,couponed:true}];
  const next=redeem(state);assert.equal(next.apkShop.context.discountPercent,discount);assert.equal(next.jokers[0].sellCost,8n);assert.equal(next.shop.main[0].cost,0n);
 }
});
test('permanent hand/discard grants and ante sacrifices alter current counters once',()=>{
 for(const [key,used,hands,discards] of [['v_grabber',[],1,0],['v_nacho_tong',['v_grabber'],1,0],['v_wasteful',[],0,1],['v_recyclomancy',['v_wasteful'],0,1],['v_hieroglyph',[],-1,0],['v_petroglyph',['v_hieroglyph'],0,-1]]){
  const state=fresh(key,used),next=redeem(state);assert.equal(next.round.handsRemaining,state.round.handsRemaining+hands,key);assert.equal(next.round.discardsRemaining,state.round.discardsRemaining+discards,key);
  if(key==='v_hieroglyph'||key==='v_petroglyph'){assert.equal(next.round.ante,2);assert.equal(next.round.targetAnte,3);assert.equal(next.round.target,2000n);assert.deepEqual(next.apkBlinds,state.apkBlinds);}
  else assert.equal(next.round.ante,3);
 }
 const noHands=fresh('v_hieroglyph');noHands.round.handsRemaining=0;assert.equal(redeem(noHands).round.handsRemaining,-1);
 const noDiscards=fresh('v_petroglyph',['v_hieroglyph']);noDiscards.round.discardsRemaining=0;assert.equal(redeem(noDiscards).round.discardsRemaining,0);
});
test('Paint/Palette, Crystal Ball and Antimatter add their actual area capacity',()=>{
 for(const [key,used] of [['v_paint_brush',[]],['v_palette',['v_paint_brush']]]){const state=fresh(key,used),next=redeem(state);assert.equal(next.round.handSize,state.round.handSize+1);}
 assert.equal(redeem(fresh('v_crystal_ball')).consumableSlots,3);
 assert.equal(redeem(fresh('v_antimatter',['v_blank'])).jokerSlots,6);
});
test('interest caps are 5/10/20 and reroll vouchers reduce current price and future base independently',()=>{
 assert.equal(voucherModifiers(redeem(fresh('v_seed_money'))).interestCap,10n);
 assert.equal(voucherModifiers(redeem(fresh('v_money_tree',['v_seed_money']))).interestCap,20n);
 for(const [key,used,base] of [['v_reroll_surplus',[],3n],['v_reroll_glut',['v_reroll_surplus'],1n]]){
  const state=fresh(key,used);state.shop.rerollIncrease=4n;state.shop.freeRerolls=2;const next=redeem(state);assert.equal(next.shop.rerollBase,base);assert.equal(next.shop.rerollIncrease,4n);assert.equal(next.shop.freeRerolls,2);
 }
 for(const current of [0n,1n,2n,5n]){
  const state=fresh('v_reroll_surplus');state.shop.rerollBase=0n;state.shop.rerollIncrease=current;
  const next=redeem(state);assert.equal(next.shop.rerollBase,0n);assert.equal(next.shop.rerollIncrease,current);assert.equal(next.shop.rerollCostOverride,current>2n?current-2n:0n);assert.equal(voucherModifiers(next).rerollBase,3n);
 }
});
test('D6 plus Surplus reduces the current quote without erasing the accumulated paid tier',()=>{
 const state=fresh('v_reroll_surplus');state.shop.rerollBase=0n;state.shop.rerollIncrease=2n;
 const next=redeem(state);assert.equal(getRerollCost(next.shop),0n);assert.equal(next.shop.rerollIncrease,2n);
 const rerolled=applyShopAction(next,{type:'REROLL_SHOP',expectedRevision:next.revision});
 assert.equal(rerolled.error,null);assert.equal(rerolled.state.money,next.money);assert.equal(getRerollCost(rerolled.state.shop),3n);
 assert.equal(rerolled.state.shop.rerollIncrease,3n);assert.equal(Object.hasOwn(rerolled.state.shop,'rerollCostOverride'),false);
});
test('Observatory grants each matching non-debuffed Planet its own factor, including Negative',()=>{
 const state=fresh();state.consumables=[{id:'pluto',entityId:'c_pluto',set:'Planet'},{id:'negative-pluto',entityId:'c_pluto',set:'Planet',edition:'negative'},{id:'debuffed',entityId:'c_pluto',set:'Planet',debuffed:true},{id:'mars',entityId:'c_mars',set:'Planet'}];
 assert.deepEqual(getObservatorySources(state,'high_card'),[]);state.apkShop.context.usedVoucherIds=['v_telescope','v_observatory'];
 assert.deepEqual(getObservatorySources(state,'high_card'),[{sourceId:'pluto',xMult:{n:3n,d:2n}},{sourceId:'negative-pluto',xMult:{n:3n,d:2n}}]);assert.deepEqual(getObservatorySources(state,'pair'),[]);
});
test('Director rerolls once until boss reset; Retcon permits subsequent paid rerolls',()=>{
 const state=fresh();state.phase='blind_selection';state.apkShop.context.usedVoucherIds=['v_directors_cut'];
 const action={type:'REROLL_BOSS',expectedRevision:state.revision},before=structuredClone(state),result=applyBossRerollAction(state,action);
 assert.equal(result.error,null);assert.deepEqual(state,before);assert.equal(result.state.money,90n);assert.equal(result.state.bossRerollUsed,true);assert.equal(canRerollBoss(result.state),false);
 assert.equal(applyBossRerollAction(result.state,{...action,expectedRevision:result.state.revision}).error.code,'BOSS_REROLL_UNAVAILABLE');
 result.state.apkShop.context.usedVoucherIds.push('v_retcon');assert.equal(canRerollBoss(result.state),true);const again=applyBossRerollAction(result.state,{...action,expectedRevision:result.state.revision});assert.equal(again.error,null);assert.equal(again.state.money,80n);
 again.state.money=9n;assert.equal(canRerollBoss(again.state),false);again.state.bankruptAt=-20n;assert.equal(canRerollBoss(again.state),true);
 for(const ante of [-1,0,7]){
  const lowered=structuredClone(state);lowered.round.ante=ante;lowered.apkBlinds.ante=8;
  const result=applyBossRerollAction(lowered,{...action,expectedRevision:lowered.revision});assert.equal(result.error,null);assert.equal(result.state.apkBlinds.bossSelectionAnte,ante);
 }
});
