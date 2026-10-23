import {challengeBossBans} from './challenge-rules.js';
import catalogue from '../content/apk-shop-catalog.js';
import {createApkShopContext,session} from './apk-shop.js';
import {APK_HAND_NAMES,currentApkShopContext} from './apk-shop-state.js';
import {canAfford} from './shop-pricing.js';
import {changeHandSize} from './hand-size.js';
import {repriceItem7Cards} from './joker-item7-economy.js';
import {stampJokerCreationOrdinals,applyChallengePurchaseInflation} from './shop.js';
import {chooseApkBoss} from './apk-blinds.js';
import {bossTarget} from './boss-effects.js';
import {createTagShopHooks} from './tag-effects.js';

const centres=new Map(catalogue.centres.map(card=>[card.key,card]));
export const SUPPORTED_VOUCHERS=Object.freeze(catalogue.centres.filter(card=>card.set==='Voucher').map(card=>card.key));
export const hasVoucher=(state,key)=>(state.apkShop?.context.usedVoucherIds??[]).includes(key);

// Card:apply_to_run sets rates and caps; the two tiers do not multiply them.
export function voucherModifiers(state){
 const has=key=>hasVoucher(state,key),count=(...keys)=>keys.filter(has).length;
 return {
  hands:count('v_grabber','v_nacho_tong')-count('v_hieroglyph'),
  discards:count('v_wasteful','v_recyclomancy')-count('v_petroglyph'),
  handSize:count('v_paint_brush','v_palette'),jokerSlots:count('v_antimatter'),consumableSlots:count('v_crystal_ball'),
  anteReduction:count('v_hieroglyph','v_petroglyph'),
  interestCap:has('v_money_tree')?20n:has('v_seed_money')?10n:5n,
  rerollBase:5n-2n*BigInt(count('v_reroll_surplus','v_reroll_glut')),
  mainSlots:2+count('v_overstock_norm','v_overstock_plus'),
  discountPercent:has('v_liquidation')?50:has('v_clearance_sale')?25:0,
  editionRate:has('v_glow_up')?4:has('v_hone')?2:1,
  tarotRate:has('v_tarot_tycoon')?32:has('v_tarot_merchant')?9.6:4,
  planetRate:has('v_planet_tycoon')?32:has('v_planet_merchant')?9.6:4,
  playingCardRate:has('v_magic_trick')||has('v_illusion')?4:0,
 };
}
export function syncVoucherShopContext(state){
 if(!state.apkShop)return;
 const context=state.apkShop.context,mod=voucherModifiers(state);
 state.apkShop.context=createApkShopContext({...context,mainSlots:mod.mainSlots,
  editionRate:mod.editionRate,discountPercent:mod.discountPercent,
  rates:{...context.rates,Tarot:mod.tarotRate,Planet:mod.planetRate,Base:mod.playingCardRate}});
}
export function canBuyVoucher(state,offer){
 const centre=centres.get(offer?.entityId);
 return !!(state.phase==='shop'&&state.apkShop&&centre?.set==='Voucher'&&offer.originalKey===offer.entityId&&
  typeof offer.cost==='bigint'&&offer.cost>=0n&&!hasVoucher(state,offer.entityId)&&
  (!centre.requires||centre.requires.every(key=>hasVoucher(state,key)))&&
  canAfford(state.money,offer.cost,state.bankruptAt??0n));
}
// Pure query: each non-debuffed matching owned Planet is a separate x1.5 source.
export function getObservatorySources(state,handId){
 if(!hasVoucher(state,'v_observatory'))return [];
 return (state.consumables??[]).filter(card=>!card.debuffed&&centres.get(card.entityId)?.set==='Planet'&&
  centres.get(card.entityId).handType===APK_HAND_NAMES[handId]).map(card=>({sourceId:card.id,xMult:{n:3n,d:2n}}));
}

export function applyVoucherAction(state,action){
 const reject=(code,message)=>({state,events:[],error:{code,message}});
 if(action?.type!=='BUY_VOUCHER'||!Number.isSafeInteger(action.expectedRevision))return reject('INVALID_ACTION','Malformed voucher action');
 if(action.expectedRevision!==state.revision)return reject('STALE_ACTION','State revision has changed');
 if(!Number.isSafeInteger(state.revision)||state.revision<0||state.revision===Number.MAX_SAFE_INTEGER)return reject('INVALID_STATE','Invalid revision');
 if(state.phase!=='shop'||!state.shop||!state.apkShop)return reject('INVALID_PHASE','Shop is not active');
 const offer=state.shop.vouchers.find(card=>card.id===action.offerId);
 if(!offer)return reject('OFFER_NOT_FOUND','Voucher is no longer available');
 const centre=centres.get(offer.entityId);
 if(centre?.set!=='Voucher'||offer.originalKey!==offer.entityId||typeof offer.cost!=='bigint'||offer.cost<0n)return reject('INVALID_STATE','Invalid voucher offer');
 if(hasVoucher(state,offer.entityId))return reject('VOUCHER_REDEEMED','Voucher already redeemed');
 if(centre.requires?.some(key=>!hasVoucher(state,key)))return reject('VOUCHER_PREREQUISITE','Voucher prerequisite is missing');
 if(!canAfford(state.money,offer.cost,state.bankruptAt??0n))return reject('INSUFFICIENT_FUNDS','Insufficient available money');
 const next=structuredClone(state),events=[],before=voucherModifiers(state),key=offer.entityId;
 next.money-=offer.cost;next.shop.vouchers=next.shop.vouchers.filter(card=>card.id!==offer.id);
 next.apkShop.context.usedVoucherIds.push(key);
 // The ante's ordinary voucher remains redeemed even after re-entering its shop.
 next.apkShop.voucherId=null;
 syncVoucherShopContext(next);
 const after=voucherModifiers(next);
 next.round.handsRemaining+=after.hands-before.hands;
 next.round.discardsRemaining=Math.max(0,next.round.discardsRemaining+after.discards-before.discards);
 changeHandSize(next,after.handSize-before.handSize);
 if(after.jokerSlots!==before.jokerSlots)next.jokerSlots=(next.jokerSlots??5)+after.jokerSlots-before.jokerSlots;
 if(after.consumableSlots!==before.consumableSlots)next.consumableSlots=(next.consumableSlots??2)+after.consumableSlots-before.consumableSlots;
 if(after.anteReduction!==before.anteReduction){
  next.round.targetAnte??=state.round.ante;
  next.round.ante-=after.anteReduction-before.anteReduction;
  events.push({type:'ante_changed',before:state.round.ante,after:next.round.ante});
 }
 if(after.rerollBase!==before.rerollBase){
  const reduction=before.rerollBase-after.rerollBase;
  // D6 changes this shop's base, while redemption only lowers its currently
  // displayed price. Native calculate_reroll_cost keeps the paid tier intact.
  if(next.shop.rerollBase<before.rerollBase||Object.hasOwn(next.shop,'rerollCostOverride')){
   const current=next.shop.rerollCostOverride??next.shop.rerollBase+next.shop.rerollIncrease;
   next.shop.rerollCostOverride=current>reduction?current-reduction:0n;
  }else next.shop.rerollBase=next.shop.rerollBase>reduction?next.shop.rerollBase-reduction:0n;
 }
 if(after.discountPercent!==before.discountPercent)repriceItem7Cards(next);
 if(after.mainSlots!==before.mainSlots){
  const missing=Math.max(0,after.mainSlots-next.shop.main.length);
  if(missing){
   const context=createApkShopContext({...currentApkShopContext(next),mainSlots:missing}),generator=session(next.rng.apk,context);
   const added=generator.main('voucher_'+(state.revision+1),false,createTagShopHooks(next,events));next.shop.main.push(...added);next.rng.apk=generator.rng;
   stampJokerCreationOrdinals(next,added);
   events.push({type:'shop_slots_added',offerIds:added.map(card=>card.id)});
  }
 }
 applyChallengePurchaseInflation(next);
 next.apkShop.context=currentApkShopContext(next);next.revision++;next.lastScore=null;
 events.unshift({type:'voucher_redeemed',voucherId:key,offerId:offer.id,cost:offer.cost});
 events.push({type:'money_changed',before:state.money,after:next.money,delta:-offer.cost});
 return {state:next,events,error:null};
}

export function canRerollBoss(state){
 return !!(state.phase==='blind_selection'&&state.apkBlinds&&state.rng?.apk&&
  (hasVoucher(state,'v_retcon')||hasVoucher(state,'v_directors_cut')&&!state.bossRerollUsed)&&
  canAfford(state.money,10n,state.bankruptAt??0n));
}
export function applyBossRerollAction(state,action){
 const reject=(code,message)=>({state,events:[],error:{code,message}});
 if(action?.type!=='REROLL_BOSS'||!Number.isSafeInteger(action.expectedRevision))return reject('INVALID_ACTION','Malformed boss reroll action');
 if(action.expectedRevision!==state.revision)return reject('STALE_ACTION','State revision has changed');
 if(!Number.isSafeInteger(state.revision)||state.revision<0||state.revision===Number.MAX_SAFE_INTEGER)return reject('INVALID_STATE','Invalid revision');
 if(!canRerollBoss(state))return reject('BOSS_REROLL_UNAVAILABLE','Boss reroll is not available');
 const next=structuredClone(state),selected=chooseApkBoss(next.rng.apk,{ante:Math.max(1,next.round.ante),bossesUsed:next.apkBlinds.bossesUsed,bannedKeys:challengeBossBans(next)});
 next.apkBlinds.bossId=selected.bossId;next.apkBlinds.bossesUsed=selected.bossesUsed;next.rng.apk=selected.rng;
 next.apkBlinds.bossSelectionAnte=next.round.ante;
 next.money-=10n;next.bossRerollUsed=true;
 if(next.round.blindId==='boss')next.round.target=bossTarget(next);
 next.revision++;next.lastScore=null;
 return {state:next,events:[{type:'boss_rerolled',bossId:selected.bossId},{type:'money_changed',before:state.money,after:next.money,delta:-10n}],error:null};
}
