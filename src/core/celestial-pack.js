import catalogue from '../content/apk-shop-catalog.js';
import {generateApkCelestialPack} from './apk-shop.js';
import {currentApkShopContext} from './apk-shop-state.js';
import {generateApkArcanaPack,supportsArcanaBooster} from './arcana-pack-generation.js';
import {sortHand} from './sort.js';
import {applyItem7EconomyContext} from './joker-item7-economy.js';
import {canUseConsumable,applyConsumableAction} from './consumables.js';
import {canAfford} from './shop-pricing.js';

export {supportsArcanaBooster};
const centres=new Map(catalogue.centres.map(card=>[card.key,card]));
export const supportsCelestialBooster=id=>centres.get(id)?.set==='Booster'&&centres.get(id)?.kind==='Celestial';
const config=id=>({size:id.includes('_normal_')?3:5,choices:id.includes('_mega_')?2:1});
export function canUsePackCard(state,card,targetCardIds=[]){
 if(state.phase!=='pack'||!state.packState?.cards.some(c=>c.id===card?.id))return {available:false,code:'CARD_NOT_FOUND',reason:'Карта набора недоступна.'};
 const staged={...state,phase:'shop',consumables:[...(state.consumables??[]),card]};
 return canUseConsumable(staged,card,targetCardIds,{fromPack:true});
}
function closePack(state){
 if(supportsArcanaBooster(state.packState.sourceEntityId)){state.drawPile.unshift(...[...state.hand].reverse());state.hand=[];}
 delete state.packState;state.phase='shop';
}
const reject=(state,code,message)=>({state,events:[],error:{code,message}});

export function applyCelestialPackAction(state,action){
 if(!action||!['OPEN_BOOSTER','USE_PACK_CARD','SKIP_PACK'].includes(action.type)||!Number.isSafeInteger(action.expectedRevision))return reject(state,'INVALID_ACTION','Malformed pack action');
 if(action.expectedRevision!==state.revision)return reject(state,'STALE_ACTION','State revision has changed');
 if(action.type==='OPEN_BOOSTER'){
  if(Object.keys(action).some(key=>!['type','expectedRevision','offerId'].includes(key))||typeof action.offerId!=='string'||!action.offerId)return reject(state,'INVALID_ACTION','Malformed pack action');
  if(state.phase!=='shop'||!state.shop||state.packState)return reject(state,'INVALID_PHASE','A shop pack cannot be opened now');
  const offer=state.shop.boosters?.find(card=>card?.id===action.offerId);
  if(!offer)return reject(state,'OFFER_NOT_FOUND','Booster offer is no longer available');
  const arcana=supportsArcanaBooster(offer.entityId);
  if(!(arcana||supportsCelestialBooster(offer.entityId))||offer.originalKey!==offer.entityId||offer.set!=='Booster')return reject(state,'UNSUPPORTED_CONTENT','This Booster effect is not implemented');
  if(typeof offer.cost!=='bigint'||!canAfford(state.money,offer.cost,state.bankruptAt??0n))return reject(state,'INSUFFICIENT_FUNDS','Insufficient available money');
  if(arcana&&state.apkShop.context.usedVoucherIds.includes('v_omen_globe'))return reject(state,'UNSUPPORTED_CONTENT','Omen Globe requires remaining Spectral effects (item 8b)');
  const next=structuredClone(state),events=[];
  // Native open callbacks finish before the delayed card-generation callback.
  applyItem7EconomyContext(next,{type:'open_booster'},events);
  const options={instancePrefix:'pack_'+(state.revision+1)};
  const generated=arcana?generateApkArcanaPack(next.rng.apk,currentApkShopContext(next),{...options,boosterId:offer.entityId}):generateApkCelestialPack(next.rng.apk,currentApkShopContext(next),{...options,...config(offer.entityId)});
  next.shop.boosters=next.shop.boosters.filter(card=>card.id!==offer.id);next.money-=offer.cost;next.rng.apk=generated.rng;next.phase='pack';next.revision++;
  next.packState={version:1,sourceEntityId:offer.entityId,cards:generated.cards,choicesRemaining:config(offer.entityId).choices};
  if(arcana){const count=Math.min(next.drawPile.length,Math.max(0,next.round.handSize-next.hand.length)),ids=Array.from({length:count},()=>next.drawPile.pop());next.hand.push(...ids);sortHand(next);next.packState.handDraw={cardIds:ids,handSize:next.round.handSize};if(ids.length)events.push({type:'cards_drawn',cardIds:ids});}
  next.apkShop.context=currentApkShopContext(next);
  return {state:next,events:[{type:'booster_opened',offerId:offer.id,entityId:offer.entityId,cardIds:generated.cards.map(card=>card.id),choices:next.packState.choicesRemaining},{type:'money_changed',before:state.money,after:next.money,delta:-offer.cost},...events],error:null};
 }
 if(state.phase!=='pack'||!state.packState)return reject(state,'INVALID_PHASE','No Celestial pack is open');
 if(action.type==='SKIP_PACK'){
  if(Object.keys(action).some(key=>!['type','expectedRevision'].includes(key)))return reject(state,'INVALID_ACTION','Malformed pack action');
  const next=structuredClone(state);closePack(next);next.revision++;next.apkShop.context=currentApkShopContext(next);
  return {state:next,events:[{type:'booster_skipped'}],error:null};
 }
 if(Object.keys(action).some(key=>!['type','expectedRevision','cardId','targetCardIds'].includes(key))||typeof action.cardId!=='string'||!action.cardId)return reject(state,'INVALID_ACTION','Malformed pack action');
 const card=state.packState.cards.find(candidate=>candidate.id===action.cardId);if(!card)return reject(state,'CARD_NOT_FOUND','Pack card is no longer available');
 const capability=canUsePackCard(state,card,action.targetCardIds);if(!capability.available)return reject(state,capability.code,capability.reason);
 const staged=structuredClone(state);staged.phase='shop';staged.consumables??=[];staged.consumables.push(structuredClone(card));
 const used=applyConsumableAction(staged,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:card.id,targetCardIds:action.targetCardIds},{fromPack:true});if(used.error)return reject(state,used.error.code,used.error.message);
 used.state.packState.cards=used.state.packState.cards.filter(candidate=>candidate.id!==card.id);used.state.packState.choicesRemaining--;
 const closed=used.state.packState.choicesRemaining===0||used.state.packState.cards.length===0;
 if(closed)closePack(used.state);else used.state.phase='pack';
 used.state.apkShop.context=currentApkShopContext(used.state);
 return {state:used.state,events:[{type:'pack_card_used',cardId:card.id,entityId:card.entityId},...used.events,...(closed?[{type:'booster_closed'}]:[])],error:null};
}
