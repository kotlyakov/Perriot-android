import catalogue from '../content/apk-shop-catalog.js';
import {generateApkCelestialPack} from './apk-shop.js';
import {currentApkShopContext} from './apk-shop-state.js';
import {applyConsumableAction} from './consumables.js';
import {canAfford} from './shop-pricing.js';

const centres=new Map(catalogue.centres.map(card=>[card.key,card]));
export const supportsCelestialBooster=id=>centres.get(id)?.set==='Booster'&&centres.get(id)?.kind==='Celestial';
const config=id=>({size:id.includes('_normal_')?3:5,choices:id.includes('_mega_')?2:1});
const reject=(state,code,message)=>({state,events:[],error:{code,message}});

export function applyCelestialPackAction(state,action){
 if(!action||!['OPEN_BOOSTER','USE_PACK_CARD','SKIP_PACK'].includes(action.type)||!Number.isSafeInteger(action.expectedRevision))return reject(state,'INVALID_ACTION','Malformed pack action');
 if(action.expectedRevision!==state.revision)return reject(state,'STALE_ACTION','State revision has changed');
 if(action.type==='OPEN_BOOSTER'){
  if(Object.keys(action).some(key=>!['type','expectedRevision','offerId'].includes(key))||typeof action.offerId!=='string'||!action.offerId)return reject(state,'INVALID_ACTION','Malformed pack action');
  if(state.phase!=='shop'||!state.shop||state.packState)return reject(state,'INVALID_PHASE','A shop pack cannot be opened now');
  const offer=state.shop.boosters?.find(card=>card?.id===action.offerId);
  if(!offer)return reject(state,'OFFER_NOT_FOUND','Booster offer is no longer available');
  if(!supportsCelestialBooster(offer.entityId)||offer.originalKey!==offer.entityId||offer.set!=='Booster')return reject(state,'UNSUPPORTED_CONTENT','This Booster effect is not implemented');
  if(typeof offer.cost!=='bigint'||!canAfford(state.money,offer.cost,state.bankruptAt??0n))return reject(state,'INSUFFICIENT_FUNDS','Insufficient available money');
  let generated;try{generated=generateApkCelestialPack(state.rng.apk,currentApkShopContext(state),{...config(offer.entityId),instancePrefix:'pack_'+(state.revision+1)});}catch{return reject(state,'INVALID_STATE','Invalid Celestial pack state');}
  const next=structuredClone(state);next.shop.boosters=next.shop.boosters.filter(card=>card.id!==offer.id);next.money-=offer.cost;next.rng.apk=generated.rng;next.phase='pack';next.revision++;
  next.packState={version:1,sourceEntityId:offer.entityId,cards:generated.cards,choicesRemaining:config(offer.entityId).choices};next.apkShop.context=currentApkShopContext(next);
  return {state:next,events:[{type:'booster_opened',offerId:offer.id,entityId:offer.entityId,cardIds:generated.cards.map(card=>card.id),choices:next.packState.choicesRemaining},{type:'money_changed',before:state.money,after:next.money,delta:-offer.cost}],error:null};
 }
 if(state.phase!=='pack'||!state.packState)return reject(state,'INVALID_PHASE','No Celestial pack is open');
 if(action.type==='SKIP_PACK'){
  if(Object.keys(action).some(key=>!['type','expectedRevision'].includes(key)))return reject(state,'INVALID_ACTION','Malformed pack action');
  const next=structuredClone(state);delete next.packState;next.phase='shop';next.revision++;next.apkShop.context=currentApkShopContext(next);
  return {state:next,events:[{type:'booster_skipped'}],error:null};
 }
 if(Object.keys(action).some(key=>!['type','expectedRevision','cardId'].includes(key))||typeof action.cardId!=='string'||!action.cardId)return reject(state,'INVALID_ACTION','Malformed pack action');
 const card=state.packState.cards.find(candidate=>candidate.id===action.cardId);if(!card)return reject(state,'CARD_NOT_FOUND','Pack card is no longer available');
 const staged=structuredClone(state);staged.phase='shop';staged.consumables??=[];staged.consumables.push(structuredClone(card));
 const used=applyConsumableAction(staged,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:card.id});if(used.error)return reject(state,used.error.code,used.error.message);
 used.state.packState.cards=used.state.packState.cards.filter(candidate=>candidate.id!==card.id);used.state.packState.choicesRemaining--;
 const closed=used.state.packState.choicesRemaining===0||used.state.packState.cards.length===0;
 if(closed)delete used.state.packState;else used.state.phase='pack';
 used.state.apkShop.context=currentApkShopContext(used.state);
 return {state:used.state,events:[{type:'pack_card_used',cardId:card.id,entityId:card.entityId},...used.events,...(closed?[{type:'booster_closed'}]:[])],error:null};
}
