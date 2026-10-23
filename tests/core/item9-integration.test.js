import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {nativeBlindTarget} from '../../src/core/blind-progression.js';
import {session,createApkShopContext} from '../../src/core/apk-shop.js';
import {createApkRng} from '../../src/core/apk-rng.js';

test('voucher ante zero uses native base100',()=>{assert.equal(nativeBlindTarget(0),100n);assert.equal(nativeBlindTarget(-1,1.5),150n);});
test('forced tag creation precedes ordinary shop type RNG',()=>{
 const rng=createApkRng('ITEM9'),s=session(rng,createApkShopContext());
 const offers=s.main('forced',false,{create:(native,id)=>native.construct(native.select('Joker','uta',0.9),id,{main:true})});
 assert.equal(offers.length,2);assert.ok(offers.every(card=>card.set==='Joker'));assert.equal(s.rng.streams.cdt1,undefined);
});
test('free pack tag opens before the next blind and closes back to selection',()=>{
 let state=createRun('FREEPACK',{runId:'free',deckId:'red',money:20n,referenceRng:true,referenceShop:true});
 state.apkBlinds.tags.small='tag_charm';
 const result=dispatch(state,{type:'SKIP_BLIND',expectedRevision:state.revision});assert.equal(result.error,null);
 state=result.state;assert.equal(state.phase,'pack');assert.equal(state.packState.sourceEntityId,'p_arcana_mega_1');assert.equal(state.packState.returnPhase,'blind_selection');assert.equal(state.shop,undefined);
 const closed=dispatch(state,{type:'SKIP_PACK',expectedRevision:state.revision});assert.equal(closed.error,null);assert.equal(closed.state.phase,'blind_selection');assert.equal(closed.state.round.blindId,'big');assert.equal(closed.state.money,20n);
});
test('enhanced playing offers bought after Magic Trick retain physical enhancement',()=>{
 let state=createRun('TRICK',{runId:'trick',money:100n,referenceRng:true,referenceShop:true});
 state.phase='shop';state.shop={main:[],vouchers:[],boosters:[],rerollBase:5n,rerollIncrease:0n,freeRerolls:0};
 const native=session(state.rng.apk,createApkShopContext());const offer=native.construct('m_bonus','bonus',{main:true,frontKey:'S_A'});state.shop.main.push(offer);
 const bought=dispatch(state,{type:'BUY_SHOP_CARD',expectedRevision:state.revision,offerId:'bonus'});assert.equal(bought.error,null);assert.equal(bought.state.cards.card_created_53.enhancement,'bonus');assert.equal(bought.state.cards.card_created_53.rank,14);
});
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {APK_TAGS} from '../../src/content/apk-tags.js';
const act=(state,type,fields={})=>{const result=dispatch(state,{type,expectedRevision:state.revision,...fields});assert.equal(result.error,null,`${type}: ${result.error?.message}`);return result.state;};
const reload=state=>deserializeState(serializeState(state));
test('all24 tag rewards survive skip, pack close, winning round, cashout and purchase',()=>{
 for(const tag of APK_TAGS){
  let state=createRun('TAG-MATRIX',{runId:tag.id,money:50n,referenceRng:true,referenceShop:true});
  state.round.ante=2;state.round.target=800n;state.roundNumber=4;state.apkBlinds.ante=2;state.apkBlinds.tagContext.ante=2;state.apkShop.context.ante=2;state.apkBlinds.tags.small=tag.id;state.apkBlinds.tagContext.discoveredCentreIds=[...new Set(APK_TAGS.map(t=>t.requires).filter(Boolean))];
  for(const id of Object.keys(state.handLevels))state.handLevels[id]=1000;
  state=reload(act(state,'SKIP_BLIND'));while(state.phase==='pack')state=reload(act(state,'SKIP_PACK'));
  state=reload(act(state,'START_BLIND'));state=reload(act(state,'PLAY_HAND',{cardIds:[state.hand[0]]}));assert.equal(state.phase,'round_won',tag.id);
  state=reload(act(state,'CASH_OUT'));assert.equal(state.phase,'shop',tag.id);
  const offer=state.shop.main.find(card=>card.set==='Joker');if(offer)state=reload(act(state,'BUY_SHOP_CARD',{offerId:offer.id}));
  state=reload(act(state,'LEAVE_SHOP'));assert.equal(state.phase,'blind_selection',tag.id);
 }
});
test('cashout resets next round hands before shopping and glyph redemption',()=>{
 let state=createRun('COUNTER-RESET',{runId:'counter-reset',money:50n,referenceRng:true,referenceShop:true});
 state=act(state,'START_BLIND');state.round.handsRemaining=1;for(const id of Object.keys(state.handLevels))state.handLevels[id]=1000;
 state=act(state,'PLAY_HAND',{cardIds:[state.hand[0]]});assert.equal(state.round.handsRemaining,0);state=act(state,'CASH_OUT');assert.equal(state.round.handsRemaining,4);assert.equal(state.round.discardsRemaining,4);
});
test('boss shop glyph retains completed boss target through save',()=>{
 let state=createRun('BOSS-GLYPH',{runId:'boss-glyph',money:50n,referenceRng:true,referenceShop:true});
 state.round.blindId='boss';state.round.target=600n;state.roundNumber=3;state=act(state,'START_BLIND');for(const id of Object.keys(state.handLevels))state.handLevels[id]=1000;
 state=act(state,'PLAY_HAND',{cardIds:[state.hand[0]]});state=act(state,'CASH_OUT');delete state.effectReplay;state.shop.vouchers=[{id:'glyph',entityId:'v_hieroglyph',originalKey:'v_hieroglyph',set:'Voucher',edition:'base',cost:10n,sellCost:5n}];
 state=reload(act(state,'BUY_VOUCHER',{offerId:'glyph'}));assert.equal(state.round.ante,0);assert.equal(state.round.target,600n);
});
