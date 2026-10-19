import {resetItem7RoundTargets} from '../../src/core/joker-item7-lifecycle.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {chooseApkVoucher,generateApkShop} from '../../src/core/apk-shop.js';
import {shuffleApkDeck} from '../../src/core/apk-deck.js';
import {chooseApkTag,chooseApkOrbitalHand,createApkTagContext} from '../../src/core/apk-tags.js';
import {chooseApkBoss} from '../../src/core/apk-blinds.js';
import {nativeBlindTarget} from '../../src/core/blind-progression.js';
import {APK_BLINDS_BY_ID} from '../../src/content/apk-blinds.js';
import {bossTarget,disableBoss} from '../../src/core/boss-effects.js';
import {settleRoundSuccess,getCashout,captureCashoutQuote} from '../../src/core/cashout.js';
import {canManageInventory,canSellOwned,applyInventoryAction} from '../../src/core/inventory.js';
import {canUseConsumable,applyConsumableAction} from '../../src/core/consumables.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {createRepository} from '../../src/persistence/repository.js';
const act=(s,type,fields={})=>dispatch(s,{type,expectedRevision:s.revision,...fields});
const reload=s=>deserializeState(serializeState(s));
// Native successful settlement resets four targets after scoring, with no boss poll.
function settledRng(s){const copy=structuredClone(s);resetItem7RoundTargets(copy);return copy.rng;}
function active(ante=8,bossId='bl_final_heart',blindId='boss'){
 const s=createRun('AAAAAAA1',{runId:'victory',money:10n,referenceRng:true,referenceShop:true});
 s.round.ante=ante;s.round.blindId=blindId;s.apkShop.context.ante=ante;s.apkBlinds.ante=ante;s.apkBlinds.tagContext.ante=ante;
 s.apkBlinds.bossId=bossId;s.apkBlinds.bossesUsed[bossId]=1;s.round.target=blindId==='boss'?bossTarget(s):nativeBlindTarget(ante,blindId==='big'?1.5:1);
 s.jokers=[{id:'golden',entityId:'j_golden',creationOrdinal:1,sellCost:2n}];s.nextJokerCreationOrdinal=2;
 s.consumables=[{id:'hermit',entityId:'c_hermit',originalKey:'c_hermit',set:'Tarot',cost:3n,sellCost:1n}];
 const r=act(s,'START_BLIND');assert.equal(r.error,null);return r.state;
}
function win(s=active()){
 s.round.score=s.round.target-1n;s.cards[s.hand[1]].enhancement='gold';s.apkShop.context=currentApkShopContext(s);
 const r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);assert.equal(r.state.phase,'round_won');return r;
}

test('successful win-Ante Boss settles Gold and frozen Heart suppression before one-time pending victory',()=>{
 const {state:s,events}=win();assert.equal(s.won,true);assert.equal(s.winNotified,true);assert.equal(s.winPending,true);assert.equal(s.winAnte,8);
 assert.equal(s.round.ante,8);assert.equal(s.money,13n);assert.equal(getCashout(s).reward,8n);assert.equal(getCashout(s).jokerBonuses,undefined);
 assert.deepEqual(s.cashoutQuote.bonusContext.sources,[]);assert.ok(events.findIndex(e=>e.type==='gold_card_paid')<events.findIndex(e=>e.type==='victory_pending'));
 const snapshot=structuredClone(s),extra=[];assert.equal(settleRoundSuccess(s,extra),false);assert.deepEqual(s,snapshot);assert.deepEqual(extra,[]);assert.deepEqual(reload(s),s);
});

test('small/big at win Ante and ordinary Boss wins do not trigger victory',()=>{
 for(const [ante,boss,blind] of [[8,'bl_final_heart','small'],[8,'bl_final_heart','big'],[1,'bl_club','boss']]){
  const s=win(active(ante,boss,blind)).state;assert.equal(s.won,false);assert.equal(s.winNotified,false);assert.equal(s.winPending,false);
 }
});

test('pending victory rejects all routed actions and capability queries without mutation',()=>{
 const s=win().state,before=structuredClone(s);
 for(const type of ['CASH_OUT','SELL_OWNED_CARD','REORDER_JOKERS','REORDER_CONSUMABLES','USE_CONSUMABLE','SELL_JOKER','BUY_SHOP_CARD','REROLL_SHOP','LEAVE_SHOP','OPEN_BOOSTER','USE_PACK_CARD','SKIP_PACK','SKIP_BLIND','START_BLIND','PLAY_HAND','DISCARD','SET_SORT','REORDER_HAND']){
  const r=act(s,type,{area:'jokers',cardId:'golden',cardIds:s.hand,mode:'rank'});assert.equal(r.error?.code,'VICTORY_PENDING',type);assert.equal(r.state,s);assert.deepEqual(r.events,[]);
 }
 assert.equal(canManageInventory(s),false);assert.equal(canSellOwned(s,s.jokers[0],'jokers'),false);assert.equal(canUseConsumable(s,s.consumables[0]).available,false);
 assert.ok(applyInventoryAction(s,{type:'SELL_OWNED_CARD',area:'jokers',cardId:'golden'}).error);assert.ok(applyConsumableAction(s,{type:'USE_CONSUMABLE',cardId:'hermit'}).error);assert.deepEqual(s,before);
});

test('Endless acknowledges once, retains completed round/quote/RNG/balance, and rejects stale payout',()=>{
 const s=win().state,before=structuredClone(s),r=act(reload(s),'CONTINUE_ENDLESS');assert.equal(r.error,null);
 assert.deepEqual(r.events,[{type:'endless_continued'}]);assert.deepEqual(r.state,{...before,winPending:false,revision:before.revision+1,effectReplay:r.state.effectReplay});assert.equal(r.state.effectReplay.actions.length,before.effectReplay.actions.length+1);assert.deepEqual(reload(r.state),r.state);assert.deepEqual(getCashout(r.state),getCashout(s));
 assert.equal(act(r.state,'CONTINUE_ENDLESS').error.code,'INVALID_PHASE');assert.equal(dispatch(r.state,{type:'CASH_OUT',expectedRevision:s.revision}).error.code,'STALE_ACTION');assert.deepEqual(s,before);
 for(const phase of ['blind_selection','playing','shop','game_over']){const other=createRun('x',{runId:'x',money:4n});other.phase=phase;assert.equal(act(other,'CONTINUE_ENDLESS').error.code,'INVALID_PHASE');}
});

test('failed acknowledgement write keeps pending save and retry preserves exact earning facts',()=>{
 for(const failSlot of ['backup','current']){
  const s=win().state,text=serializeState(s),data={current:text,backup:''};let fail=true;
  const repo=createRepository({read:slot=>data[slot],write:(slot,value)=>{if(fail&&slot===failSlot)throw Error('full');data[slot]=value;}});assert.equal(repo.load().status,'current');
  const acknowledged=act(s,'CONTINUE_ENDLESS');assert.equal(acknowledged.error,null);assert.throws(()=>repo.save(acknowledged.state));assert.equal(data.current,text);assert.equal(createRepository({read:slot=>data[slot]}).load().state.winPending,true);
  fail=false;repo.save(acknowledged.state);const restored=repo.load().state;assert.deepEqual(restored,acknowledged.state);assert.deepEqual(restored.cashoutQuote,s.cashoutQuote);assert.equal(restored.winNotified,true);
 }
});

test('disabled Vessel completion uses the same one-time victory settlement',()=>{
 const s=active(8,'bl_final_vessel');s.round.score=100000n;const rng=settledRng(s),events=[];disableBoss(s,events);s.revision++;
 assert.equal(s.winPending,true);assert.equal(s.won,true);assert.equal(getCashout(s).reward,8n);assert.deepEqual(s.rng,rng);assert.deepEqual(reload(s),s);
});

test('native losing win-Ante Boss sets won only, leaves loss and gives no payout or notification',()=>{
 let s=active();for(let i=0;i<4;i++){const r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);s=r.state;}
 assert.equal(s.phase,'game_over');assert.equal(s.won,true);assert.equal(s.winNotified,false);assert.equal(s.winPending,false);assert.equal(s.money,10n);assert.equal(s.cashoutQuote,undefined);assert.equal(act(s,'CASH_OUT').error.code,'INVALID_PHASE');assert.deepEqual(reload(s),s);
});

test('later losses retain victory flags and acknowledged victory cannot notify again',()=>{
 const acknowledged=act(win().state,'CONTINUE_ENDLESS').state;assert.equal(acknowledged.winPending,false);
 let later=active(1,'bl_club');Object.assign(later,{won:true,winNotified:true,winPending:false});
 for(let i=0;i<4;i++)later=act(later,'PLAY_HAND',{cardIds:[later.hand[0]]}).state;
 assert.equal(later.phase,'game_over');assert.equal(later.won,true);assert.equal(later.winNotified,true);assert.deepEqual(reload(later),later);
 const notified=active();notified.winNotified=true;notified.won=true;notified.round.score=notified.round.target-1n;
 const repeat=act(notified,'PLAY_HAND',{cardIds:[notified.hand[0]]});assert.equal(repeat.error,null);assert.equal(repeat.state.winPending,false);assert.ok(!repeat.events.some(e=>e.type==='victory_pending'));

});

test('cashout remains one-time after acknowledgement through the existing non-generated-shop path',()=>{
 // Retain the generic payout path alongside the real generated-shop regression below.
 const pending=createRun('cashout',{runId:'paid',money:10n});Object.assign(pending,{phase:'round_won',won:true,winNotified:true,winPending:true});pending.round.score=pending.round.target;pending.cashoutQuote=captureCashoutQuote(pending);
 const s=act(pending,'CONTINUE_ENDLESS').state;
 const r=act(s,'CASH_OUT');assert.equal(r.error,null);assert.equal(r.state.money,s.money+getCashout(s).total);assert.equal(r.state.winNotified,true);assert.equal(act(r.state,'CASH_OUT').error.code,'INVALID_PHASE');assert.equal(dispatch(r.state,{type:'CASH_OUT',expectedRevision:s.revision}).error.code,'STALE_ACTION');
});

test('save validates win fields and pending invariants while legacy schema-one saves remain supported',()=>{
 const s=win().state;
 for(const mutate of [s=>s.won='true',s=>s.winPending=1,s=>s.winNotified=null,s=>s.winAnte=0,s=>s.winAnte=16,s=>s.won=false,s=>s.winNotified=false,s=>s.phase='playing',s=>s.round.blindId='small',s=>delete s.cashoutQuote]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>serializeState(bad));}
 const old=createRun('old',{runId:'old',money:4n});for(const key of ['won','winNotified','winPending','winAnte'])delete old[key];assert.deepEqual(reload(old),old);
});


test('acknowledged victory still validates earning context and requires the acknowledgement revision',()=>{
 const pending=win().state,acknowledged=act(pending,'CONTINUE_ENDLESS').state;
 const skipped=structuredClone(pending);skipped.winPending=false;assert.throws(()=>serializeState(skipped));
 const forged=structuredClone(acknowledged),id=forged.jokers[0].id;
 forged.cashoutQuote.bonusContext.sources=[{id,entityId:'j_golden'}];forged.cashoutQuote.quote.jokerBonuses=[{sourceId:id,entityId:'j_golden',amount:4n}];forged.cashoutQuote.quote.total+=4n;
 assert.throws(()=>serializeState(forged));
});

function scorelessVesselVictory(){
 const s=active(8,'bl_final_vessel');s.round.score=100000n;disableBoss(s,[]);s.revision++;
 assert.equal(s.lastScore,null);assert.equal(s.winPending,true);return s;
}

test('scoreless Vessel rejects skipped acknowledgement while actual acknowledgement and later inventory retain frozen quote',()=>{
 const pending=scorelessVesselVictory(),quote=getCashout(pending);assert.deepEqual(reload(pending),pending);
 const skipped=structuredClone(pending);skipped.winPending=false;
 assert.throws(()=>serializeState(skipped));
 const raw=JSON.parse(serializeState(pending));raw.state.winPending=false;assert.throws(()=>deserializeState(JSON.stringify(raw)));
 const accepted=act(pending,'CONTINUE_ENDLESS');assert.equal(accepted.error,null);const acknowledged=accepted.state;
 assert.equal(acknowledged.revision,pending.revision+1);assert.equal(acknowledged.lastScore,null);assert.equal(acknowledged.winPending,false);assert.deepEqual(reload(acknowledged),acknowledged);assert.deepEqual(acknowledged.cashoutQuote,pending.cashoutQuote);assert.deepEqual(getCashout(acknowledged),quote);
 const sold=act(acknowledged,'SELL_OWNED_CARD',{area:'jokers',cardId:'golden'});assert.equal(sold.error,null);assert.equal(sold.state.revision,pending.revision+2);assert.equal(sold.state.money,acknowledged.money+2n);assert.deepEqual(sold.state.cashoutQuote,pending.cashoutQuote);assert.deepEqual(getCashout(sold.state),quote);assert.deepEqual(reload(sold.state),sold.state);
});

test('invalid current with pending backup restores the exact victory and then persists acknowledgement',()=>{
 for(const pending of [win().state,scorelessVesselVictory()]){
  const raw=serializeState(pending),data={current:'invalid current',backup:raw};
  const repository=createRepository({read:slot=>data[slot],write:(slot,value)=>data[slot]=value});
  const loaded=repository.load();assert.equal(loaded.status,'recovery');assert.deepEqual(loaded.state,pending);
  const restored=repository.restoreBackup();assert.deepEqual(restored,pending);assert.equal(data.current,raw);assert.equal(data.backup,raw);
  const continued=act(restored,'CONTINUE_ENDLESS');assert.equal(continued.error,null);repository.save(continued.state);
  assert.equal(data.backup,raw);assert.deepEqual(repository.load().state,continued.state);assert.deepEqual(continued.state.cashoutQuote,pending.cashoutQuote);assert.deepEqual(continued.state.rng,pending.rng);assert.equal(continued.state.money,pending.money);
 }
});

test('real Ante8 acknowledgement cashes frozen quote once into generated Ante9 shop and resumes deterministically',()=>{
 const pending=win().state,quote=getCashout(pending),rng=structuredClone(pending.rng);
 assert.deepEqual(quote,{reward:8n,hands:3n,interest:2n,total:13n});
 const continuous=act(pending,'CONTINUE_ENDLESS');assert.equal(continuous.error,null);assert.deepEqual(continuous.state.rng,rng);
 const resumed=act(reload(pending),'CONTINUE_ENDLESS');assert.deepEqual(resumed,continuous);
 const paid=act(continuous.state,'CASH_OUT'),repaid=act(reload(resumed.state),'CASH_OUT');assert.equal(paid.error,null);assert.deepEqual(repaid,paid);
 const shop=paid.state;assert.equal(quote.reward,8n);assert.equal(shop.money,pending.money+quote.total);assert.equal(shop.apkShop.context.ante,9);assert.equal(shop.nextAnteBlinds.ante,9);assert.equal(APK_BLINDS_BY_ID[shop.nextAnteBlinds.bossId].showdown,false);assert.deepEqual(shop.nextAnteBlinds.orbitalHands,{});assert.equal(shop.shop.main.length,2);assert.deepEqual(reload(shop),shop);
 assert.equal(act(shop,'CASH_OUT').error.code,'INVALID_PHASE');assert.equal(dispatch(shop,{type:'CASH_OUT',expectedRevision:continuous.state.revision}).error.code,'STALE_ACTION');
 const left=act(shop,'LEAVE_SHOP'),restoredLeft=act(reload(shop),'LEAVE_SHOP');assert.equal(left.error,null);assert.deepEqual(restoredLeft,left);assert.equal(left.state.round.ante,9);assert.equal(left.state.round.blindId,'small');assert.equal(left.state.round.target,110000n);assert.deepEqual(Object.keys(left.state.apkBlinds.orbitalHands),['small','big','boss']);assert.deepEqual(reload(left.state),left.state);
 const started=act(reload(left.state),'START_BLIND');assert.equal(started.error,null);assert.equal(started.state.roundNumber,25);assert.deepEqual(reload(started.state),started.state);
});
test('actual Ante16 showdown settles and continues without a second victory',()=>{
 const playing=active(16);Object.assign(playing,{won:true,winNotified:true,winPending:false});assert.equal(playing.round.target,BigInt(8.6e20*2));assert.equal(playing.roundNumber,48);assert.deepEqual(reload(playing),playing);
 const result=win(playing);assert.equal(result.state.winPending,false);assert.equal(result.state.winNotified,true);assert.ok(!result.events.some(e=>e.type==='victory_pending'));assert.deepEqual(reload(result.state),result.state);
 const paid=act(reload(result.state),'CASH_OUT');assert.equal(paid.error,null);assert.equal(paid.state.nextAnteBlinds.ante,17);assert.equal(paid.state.apkShop.context.ante,17);assert.equal(getCashout(result.state).reward,8n);assert.deepEqual(reload(paid.state),paid.state);
});
test('NaN Small/Big/Boss rounds retain unordered unwinnable semantics throughout action and reload',()=>{
 for(const [ante,bossId,blindId] of [[39,'bl_club','small'],[39,'bl_club','big'],[39,'bl_club','boss'],[40,'bl_final_vessel','boss'],[1000,'bl_final_vessel','boss']]){
  let s=active(ante,bossId,blindId);Object.assign(s,{won:true,winNotified:true,winPending:false});assert.ok(Number.isNaN(s.round.target));s.round.score=10n**300n;
  assert.deepEqual(JSON.parse(serializeState(s)).state.round.target,{native:'NaN'});assert.deepEqual(reload(s),s);
  if(bossId==='bl_final_vessel'){disableBoss(s,[]);s.revision++;assert.ok(Number.isNaN(s.round.target));assert.equal(s.phase,'playing');assert.deepEqual(reload(s),s);}
  for(let i=0;i<4;i++){const r=act(reload(s),'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);s=r.state;assert.equal(s.phase,i===3?'game_over':'playing');assert.equal(s.winPending,false);assert.deepEqual(reload(s),s);}
  assert.equal(s.cashoutQuote,undefined);assert.equal(act(s,'CASH_OUT').error.code,'INVALID_PHASE');
 }
});
test('native target saves reject wrong identity, noncanonical NaN encodings and false success phases',()=>{
 const s=active(39,'bl_club','small'),raw=JSON.parse(serializeState(s));
 for(const target of [null,'NaN','Infinity','-1','0','300',{native:'Infinity'},{native:'NaN',extra:true}]){const bad=structuredClone(raw);bad.state.round.target=target;assert.throws(()=>deserializeState(JSON.stringify(bad)));}
 for(const phase of ['round_won','shop']){const bad=structuredClone(s);bad.phase=phase;assert.throws(()=>serializeState(bad));}
 for(const ante of [9,32,38]){const finite=active(ante,ante%8===0?'bl_final_vessel':'bl_club','small');finite.round.target+=1n;assert.throws(()=>serializeState(finite));finite.round.target=NaN;assert.throws(()=>serializeState(finite));}
});
test('Endless skip paths preserve native targets and round numbers beyond 24 across reload',()=>{
 for(const ante of [9,16,39,40]){
  const bossId=ante%8===0?'bl_final_vessel':'bl_club';let s=createRun('AAAAAAA1',{runId:'skip-endless',money:4n,referenceRng:true,referenceShop:true});
  s.round.ante=ante;s.round.target=nativeBlindTarget(ante);s.apkShop.context.ante=ante;s.apkBlinds.ante=ante;s.apkBlinds.tagContext.ante=ante;s.apkBlinds.bossId=bossId;s.apkBlinds.bossesUsed[bossId]=1;s.apkBlinds.tags={small:'tag_skip',big:'tag_skip'};
  for(const blindId of ['small','big']){const skipped=act(reload(s),'SKIP_BLIND',{blindId});assert.equal(skipped.error,null);s=skipped.state;assert.ok(Object.is(s.round.target,s.round.blindId==='boss'?bossTarget(s):nativeBlindTarget(ante,1.5)));assert.deepEqual(reload(s),s);}
  const start=act(s,'START_BLIND');assert.equal(start.error,null);assert.equal(start.state.roundNumber,ante*3);assert.deepEqual(reload(start.state),start.state);
 }
});

test('disabled Wall and Vessel completed targets survive actual cashout, pack and shop reload until next ante',()=>{
 for(const [ante,id] of [[2,'bl_wall'],[8,'bl_final_vessel'],[24,'bl_final_vessel'],[32,'bl_final_vessel']]){
  let s=active(ante,id);s.round.score=bossTarget({...s,bossState:{...s.bossState,disabled:true}});disableBoss(s,[]);s.revision++;
  assert.equal(s.phase,'round_won');const target=s.round.target;assert.deepEqual(reload(s),s);
  if(s.winPending)s=act(reload(s),'CONTINUE_ENDLESS').state;
  const paid=act(s,'CASH_OUT');assert.equal(paid.error,null);s=paid.state;
  assert.equal(s.round.target,target);assert.deepEqual(reload(s),s);assert.equal(s.round.bossDisabled,true);assert.equal(s.bossState,undefined);
  for(const mutate of [s=>delete s.round.bossDisabled,s=>s.round.bossDisabled=false,s=>s.round.target+=1n,s=>s.round.target=nativeBlindTarget(ante,APK_BLINDS_BY_ID[id].mult)]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>serializeState(bad));}
  s.shop.boosters=[{id:'celestial',entityId:'p_celestial_normal_1',originalKey:'p_celestial_normal_1',set:'Booster',edition:'base',cost:4n,sellCost:2n}];
  const opened=act(reload(s),'OPEN_BOOSTER',{offerId:'celestial'});assert.equal(opened.error,null);assert.equal(opened.state.phase,'pack');assert.equal(opened.state.round.bossDisabled,true);assert.deepEqual(reload(opened.state),opened.state);
  const closed=act(reload(opened.state),'SKIP_PACK');assert.equal(closed.error,null);assert.deepEqual(reload(closed.state),closed.state);
  const left=act(reload(closed.state),'LEAVE_SHOP');assert.equal(left.error,null);assert.equal(left.state.round.bossDisabled,undefined);assert.equal(left.state.round.ante,ante+1);assert.equal(left.state.round.target,nativeBlindTarget(ante+1));assert.deepEqual(reload(left.state),left.state);
  const forged=structuredClone(left.state);forged.round.bossDisabled=true;assert.throws(()=>serializeState(forged));
 }
 const ordinary=act(win(active(1,'bl_club')).state,'CASH_OUT').state;ordinary.round.bossDisabled=true;assert.throws(()=>serializeState(ordinary));
 const playing=active(8,'bl_final_vessel');playing.round.bossDisabled=true;assert.throws(()=>serializeState(playing));
});

test('Ante9 cashout polls voucher, shuffle, Small/Big tags, boss, then shop; orbitals wait for selection',()=>{
 const s=act(win().state,'CONTINUE_ENDLESS').state,context=currentApkShopContext({...s,phase:'shop'});
 const voucher=chooseApkVoucher(s.rng.apk,context),shuffled=shuffleApkDeck(Object.values(s.cards),voucher.rng,'cashout9');
 const tagContext=createApkTagContext({...s.apkBlinds.tagContext,ante:9});
 const small=chooseApkTag(shuffled.rng,tagContext),big=chooseApkTag(small.rng,tagContext),boss=chooseApkBoss(big.rng,{ante:9,bossesUsed:s.apkBlinds.bossesUsed});
 const generated=generateApkShop(boss.rng,context,{voucherId:voucher.voucherId,firstShopBuffoon:s.apkShop.firstShopBuffoon,instancePrefix:'shop_'+(s.revision+1)});
 const paid=act(s,'CASH_OUT');assert.equal(paid.error,null);const shop=paid.state;
 assert.equal(shop.apkShop.voucherId,voucher.voucherId);assert.deepEqual(shop.drawPile,shuffled.cardIds);assert.deepEqual(shop.nextAnteBlinds.tags,{small:small.tagId,big:big.tagId});assert.equal(shop.nextAnteBlinds.bossId,boss.bossId);
 assert.deepEqual(shop.rng.apk,generated.rng);assert.deepEqual(shop.shop.main.map(({creationOrdinal,...offer})=>offer),generated.offers.main);assert.deepEqual(shop.shop.vouchers,generated.offers.vouchers);assert.deepEqual(shop.shop.boosters,generated.offers.boosters);
 let rng=generated.rng;const hands={};for(const id of ['small','big','boss']){const orbital=chooseApkOrbitalHand(rng,tagContext);rng=orbital.rng;hands[id]=orbital.hand;}
 const left=act(reload(shop),'LEAVE_SHOP');assert.equal(left.error,null);assert.deepEqual(left.state.rng.apk,rng);assert.deepEqual(left.state.apkBlinds.orbitalHands,hands);
});
test('acknowledged Ante8 native bonus and interest stay frozen through sale and generated cashout',()=>{
 const pending=win(active(8,'bl_final_leaf')).state,quote=getCashout(pending);
 assert.deepEqual(quote,{reward:8n,hands:3n,interest:2n,jokerBonuses:[{sourceId:'golden',entityId:'j_golden',amount:4n}],total:17n});
 let s=act(reload(pending),'CONTINUE_ENDLESS').state;s=act(s,'SELL_OWNED_CARD',{area:'jokers',cardId:'golden'}).state;
 assert.deepEqual(getCashout(reload(s)),quote);const paid=act(reload(s),'CASH_OUT');assert.equal(paid.error,null);assert.equal(paid.state.money,s.money+17n);assert.deepEqual(reload(paid.state),paid.state);assert.equal(act(paid.state,'CASH_OUT').error.code,'INVALID_PHASE');
});
