import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {getRerollCost} from '../../src/core/shop.js';
import {applyTagRoundStart} from '../../src/core/tag-effects.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {APK_BLINDS_BY_ID} from '../../src/content/apk-blinds.js';

const act=(state,type,extra={})=>dispatch(state,{type,expectedRevision:state.revision,...extra});
const reload=state=>deserializeState(serializeState(state));
const run=()=>createRun('ITEM9SAVE',{runId:'item9save',money:100n,referenceRng:true,referenceShop:true});
function shop(){let state=act(run(),'START_BLIND').state;state.phase='round_won';state.round.score=state.round.target;const result=act(state,'CASH_OUT');assert.equal(result.error,null);return result.state;}
function offer(key,id=key){const centre=catalogue.centres.find(card=>card.key===key);return {id,entityId:key,originalKey:key,set:centre.set,edition:'base',cost:BigInt(centre.cost??1),sellCost:1n};}

test('item9 ordered duplicate deferred tags and free pack queues round trip without consuming rewards or RNG',()=>{
 const state=run();state.pendingTags=['tag_investment','tag_negative','tag_investment','tag_juggle','tag_d_six'];state.pendingTagPacks=['tag_charm','tag_ethereal','tag_charm'];state.pendingDoubleTags=2;state.bossRerollUsed=true;
 assert.deepEqual(reload(state),state);
 for(const mutate of [s=>s.pendingTags.push('tag_skip'),s=>s.pendingTagPacks.push('p_arcana_normal_1'),s=>s.bossRerollUsed=1,s=>s.pendingDoubleTags=10001]){const bad=structuredClone(state);mutate(bad);assert.throws(()=>reload(bad));}
});

test('item9 Juggle hand-size provenance survives pre-deal save and rejects forged grants',()=>{
 const state=run();state.pendingTags=['tag_juggle','tag_juggle'];applyTagRoundStart(state);assert.equal(state.activeTagHandSize,6);assert.equal(state.round.handSize,14);assert.deepEqual(reload(state),state);
 for(const mutate of [s=>s.activeTagHandSize=4,s=>s.round.handSize++,s=>s.activeTagHandSize=-3]){const bad=structuredClone(state);mutate(bad);assert.throws(()=>reload(bad));}
});

test('item9 voucher hand-size bonuses persist and cannot drift from redeemed voucher identities',()=>{
 const state=run();state.apkShop.context.usedVoucherIds=['v_paint_brush','v_palette'];state.round.handSize=10;assert.deepEqual(reload(state),state);const repeated=structuredClone(state);repeated.apkShop.context.usedVoucherIds.push('v_palette');assert.throws(()=>reload(repeated));state.round.handSize=9;assert.throws(()=>reload(state));
});

test('item9 free tag packs preserve blind-selection return without requiring a paid shop or completed round',()=>{
 const state=shop();state.shop.boosters=[offer('p_arcana_mega_1','tag-pack')];let result=act(state,'OPEN_BOOSTER',{offerId:'tag-pack'});assert.equal(result.error,null);const packed=result.state;packed.shop=null;packed.round.score=0n;packed.packState.returnPhase='blind_selection';packed.apkShop.context=currentApkShopContext(packed);
 assert.deepEqual(reload(packed),packed);
 const bad=structuredClone(packed);bad.packState.returnPhase='playing';assert.throws(()=>reload(bad));
 const paid=structuredClone(packed);delete paid.packState.returnPhase;assert.throws(()=>reload(paid));
});

test('item9 coupon pricing marker and stored sale value survive purchase and owned save',()=>{
 const state=shop();state.shop.main=[{...offer('j_joker','coupon'),cost:0n,couponed:true}];state.apkShop.context=currentApkShopContext(state);assert.deepEqual(reload(state),state);
 const bought=act(state,'BUY_SHOP_CARD',{offerId:'coupon'});assert.equal(bought.error,null);assert.equal(bought.state.money,state.money);assert.equal(bought.state.jokers[0].sellCost,1n);assert.deepEqual(reload(bought.state),bought.state);const bad=structuredClone(bought.state);bad.jokers[0].couponed=false;assert.throws(()=>reload(bad));
});


test('item9 Hieroglyph and Petroglyph retain earned target and selected boss provenance through negative ante shops',()=>{
 let state=shop();const selected=structuredClone(state.apkBlinds),originalTarget=state.round.target;
 for(const key of ['v_hieroglyph','v_petroglyph']){state.shop.vouchers=[offer(key)];const result=act(state,'BUY_VOUCHER',{offerId:key});assert.equal(result.error,null);state=result.state;assert.equal(state.round.target,originalTarget);assert.deepEqual(state.apkBlinds,selected);assert.deepEqual(reload(state),state);}
 assert.equal(state.round.ante,-1);assert.equal(state.round.targetAnte,1);
 let result=act(state,'LEAVE_SHOP');assert.equal(result.error,null);state=result.state;assert.equal(state.round.targetAnte,undefined);assert.equal(state.round.target,150n);assert.deepEqual(reload(state),state);
 result=act(state,'START_BLIND');assert.equal(result.error,null);assert.equal(result.state.round.handsRemaining,3);state=result.state;assert.deepEqual(reload(state),state);
 state.phase='round_won';state.round.score=state.round.target;result=act(state,'CASH_OUT');assert.equal(result.error,null);state=result.state;assert.deepEqual(reload(state),state);result=act(state,'LEAVE_SHOP');assert.equal(result.error,null);state=result.state;assert.equal(state.round.blindId,'boss');assert.deepEqual(reload(state),state);result=act(state,'START_BLIND');assert.equal(result.error,null);assert.deepEqual(reload(result.state),result.state);
});


test('item9 legacy zero-counter shop supports Hieroglyph negative hands without admitting invalid active counters',()=>{
 const state=shop();state.round.handsRemaining=0;state.shop.vouchers=[offer('v_hieroglyph')];const result=act(state,'BUY_VOUCHER',{offerId:'v_hieroglyph'});assert.equal(result.error,null);assert.equal(result.state.round.handsRemaining,-1);assert.deepEqual(reload(result.state),result.state);
 const bad=structuredClone(result.state);bad.round.handsRemaining=-2;assert.throws(()=>reload(bad));
 const next=act(result.state,'LEAVE_SHOP');assert.equal(next.error,null);assert.equal(next.state.round.handsRemaining,3);assert.deepEqual(reload(next.state),next.state);
});

test('item9 Retcon after Hieroglyph replaces a retained showdown boss with current ante ordinary selection and persists',()=>{
 let state=run();state.round.ante=8;state.round.target=50000n;state.roundNumber=22;state.apkBlinds.ante=8;state.apkBlinds.tagContext.ante=8;state.apkShop.context.ante=8;state.apkBlinds.bossId='bl_final_vessel';state.apkBlinds.bossesUsed.bl_final_vessel=1;state.apkShop.context.usedVoucherIds=['v_directors_cut','v_retcon'];
 let result=act(state,'START_BLIND');assert.equal(result.error,null);state=result.state;state.phase='round_won';state.round.score=state.round.target;result=act(state,'CASH_OUT');assert.equal(result.error,null);state=result.state;state.shop.vouchers=[offer('v_hieroglyph')];result=act(state,'BUY_VOUCHER',{offerId:'v_hieroglyph'});assert.equal(result.error,null);state=result.state;assert.equal(state.round.ante,7);assert.deepEqual(reload(state),state);
 result=act(state,'LEAVE_SHOP');assert.equal(result.error,null);state=result.state;result=act(state,'REROLL_BOSS');assert.equal(result.error,null);state=result.state;assert.equal(state.apkBlinds.bossSelectionAnte,7);assert.equal(APK_BLINDS_BY_ID[state.apkBlinds.bossId].showdown,false);assert.deepEqual(reload(state),state);
 const bad=structuredClone(state);bad.apkBlinds.bossSelectionAnte=9;assert.throws(()=>reload(bad));
});

test('item9 Observatory matching held Planet score persists through replay and rejects forged source or missing journal',()=>{
 let state=run();state.apkShop.context.usedVoucherIds=['v_telescope','v_observatory'];state.consumables=[offer('c_pluto','held-pluto')];state.apkShop.context=currentApkShopContext(state);state=act(state,'START_BLIND').state;
 const result=act(state,'PLAY_HAND',{cardIds:[state.hand[0]]});assert.equal(result.error,null);assert.equal(result.state.phase,'playing');assert.equal(result.state.effectReplay?.version,2);assert.ok(result.state.lastScore.trace.some(event=>event.phase==='observatory'&&event.sourceId==='held-pluto'));assert.deepEqual(reload(result.state),result.state);
 const raw=JSON.parse(serializeState(result.state));const row=raw.state.lastScore.trace.find(event=>event.phase==='observatory');row.sourceId='foreign-planet';assert.throws(()=>deserializeState(JSON.stringify(raw)));
 const forgedMult=JSON.parse(serializeState(result.state));forgedMult.state.lastScore.mult='999';assert.throws(()=>deserializeState(JSON.stringify(forgedMult)));
 const noJournal=structuredClone(result.state);delete noJournal.effectReplay;assert.throws(()=>reload(noJournal));
});


test('item9 glyphs bought in consecutive shops preserve an ante-zero earned target',()=>{
 let state=shop();state.shop.vouchers=[offer('v_hieroglyph')];state=act(state,'BUY_VOUCHER',{offerId:'v_hieroglyph'}).state;state=act(state,'LEAVE_SHOP').state;state=act(state,'START_BLIND').state;state.phase='round_won';state.round.score=state.round.target;state=act(state,'CASH_OUT').state;state.shop.vouchers=[offer('v_petroglyph')];const result=act(state,'BUY_VOUCHER',{offerId:'v_petroglyph'});assert.equal(result.error,null);assert.equal(result.state.round.ante,-1);assert.equal(result.state.round.targetAnte,0);assert.deepEqual(reload(result.state),result.state);
});


test('item9 D6 displayed reroll reduction persists without lowering the later reroll tier',()=>{
 let state=shop();state.shop.rerollBase=0n;state.shop.rerollIncrease=2n;state.shop.vouchers=[offer('v_reroll_surplus')];const bought=act(state,'BUY_VOUCHER',{offerId:'v_reroll_surplus'});assert.equal(bought.error,null);state=bought.state;assert.equal(state.shop.rerollCostOverride,0n);assert.equal(state.shop.rerollIncrease,2n);assert.equal(getRerollCost(state.shop),0n);state=reload(state);assert.equal(getRerollCost(state.shop),0n);
 const bad=JSON.parse(serializeState(state));bad.state.shop.rerollCostOverride='-1';assert.throws(()=>deserializeState(JSON.stringify(bad)));
 const rerolled=act(state,'REROLL_SHOP');assert.equal(rerolled.error,null);assert.equal(rerolled.state.money,state.money);assert.equal(rerolled.state.shop.rerollCostOverride,undefined);assert.equal(getRerollCost(rerolled.state.shop),3n);assert.deepEqual(reload(rerolled.state),rerolled.state);
});
