import {usesCurrentMechanics} from './mechanics-version.js';
import {applyChallengeDraw} from './challenge-draw.js';
import {takeTagPack} from './tag-effects.js';
import catalogue from '../content/apk-shop-catalog.js';
import {generateApkCelestialPack,session} from './apk-shop.js';
import {currentApkShopContext} from './apk-shop-state.js';
import {generateApkArcanaPack,supportsArcanaBooster} from './arcana-pack-generation.js';
import {supportsRemainingBooster,getRemainingBoosterConfig,generateApkRemainingPack} from './booster-generation.js';
import {createPlayingCard} from './apk-deck.js';
import {hasJokerSpace,hasConsumableSpace,stampJokerCreationOrdinals,applyChallengePurchaseInflation} from './shop.js';
import {supportsJoker} from '../content/jokers.js';
import {applyItem7PlayingCardsAdded} from './joker-item7-lifecycle.js';
import {sortHand} from './sort.js';
import {applyItem7EconomyContext} from './joker-item7-economy.js';
import {canUseConsumable,applyConsumableAction} from './consumables.js';
import {canAfford} from './shop-pricing.js';

export {supportsArcanaBooster};
const centres=new Map(catalogue.centres.map(card=>[card.key,card]));
export const supportsCelestialBooster=id=>centres.get(id)?.set==='Booster'&&centres.get(id)?.kind==='Celestial';
export const supportsBooster=id=>supportsCelestialBooster(id)||supportsArcanaBooster(id)||supportsRemainingBooster(id);
const config=id=>supportsRemainingBooster(id)?getRemainingBoosterConfig(id):{size:id.includes('_normal_')?3:5,choices:id.includes('_mega_')?2:1,kind:centres.get(id)?.kind};
const handPack=id=>['Arcana','Spectral'].includes(config(id).kind);
function physicalCard(offer){const [suit,rank]=offer.frontKey.split('_'),value=({A:14,K:13,Q:12,J:11,T:10})[rank]??Number(rank);return {suit:({C:'clubs',D:'diamonds',H:'hearts',S:'spades'})[suit],rank:value,...(offer.enhancement?{enhancement:offer.enhancement}:{}),...(offer.seal?{seal:offer.seal}:{}),edition:offer.edition??'base'};}
export function canUsePackCard(state,card,targetCardIds=[]){
 if(state.phase!=='pack'||!state.packState?.cards.some(c=>c.id===card?.id))return {available:false,code:'CARD_NOT_FOUND',reason:'Карта набора недоступна.'};
 const kind=config(state.packState.sourceEntityId).kind;
 if(kind==='Buffoon')return supportsJoker(card)&&hasJokerSpace(state,card)?{available:true,code:null,reason:null}:{available:false,code:'USE_UNAVAILABLE',reason:hasJokerSpace(state,card)?'Эффект Джокера недоступен.':'Нет места для Джокера.'};
 if(kind==='Standard')return Object.keys(state.cards).length<10000?{available:true,code:null,reason:null}:{available:false,code:'USE_UNAVAILABLE',reason:'Достигнут предел размера колоды.'};
 const staged={...state,phase:'pack',consumables:[...(state.consumables??[]),card]};
 return canUseConsumable(staged,card,targetCardIds,{fromPack:true});
}
// Taking a pack card is distinct from using its effect: targets are chosen later.
export function canTakePackCard(state,card){
 if(state.phase!=='pack'||!state.packState?.cards.some(c=>c.id===card?.id))return {available:false,code:'CARD_NOT_FOUND',reason:'Карта набора недоступна.'};
 const kind=config(state.packState.sourceEntityId).kind;
 if(kind==='Standard'||kind==='Buffoon')return canUsePackCard(state,card);
 return hasConsumableSpace(state,card)?{available:true,code:null,reason:null}:{available:false,code:'NO_SPACE',reason:'Нет места для расходной карты.'};
}
function closePack(state){
 if(handPack(state.packState.sourceEntityId)){state.drawPile.unshift(...[...state.hand].reverse());state.hand=[];}
 const returnPhase=state.packState.returnPhase??'shop';delete state.packState;state.phase=returnPhase;
}
const reject=(state,code,message)=>({state,events:[],error:{code,message}});

export function applyCelestialPackAction(state,action){
 if(!action||!['OPEN_BOOSTER','USE_PACK_CARD','TAKE_PACK_CARD','SKIP_PACK'].includes(action.type)||!Number.isSafeInteger(action.expectedRevision))return reject(state,'INVALID_ACTION','Malformed pack action');
 if(action.expectedRevision!==state.revision)return reject(state,'STALE_ACTION','State revision has changed');
 if(action.type==='OPEN_BOOSTER'){
  if(Object.keys(action).some(key=>!['type','expectedRevision','offerId'].includes(key))||typeof action.offerId!=='string'||!action.offerId)return reject(state,'INVALID_ACTION','Malformed pack action');
  if(state.phase!=='shop'||!state.shop||state.packState)return reject(state,'INVALID_PHASE','A shop pack cannot be opened now');
  const offer=state.shop.boosters?.find(card=>card?.id===action.offerId);
  if(!offer)return reject(state,'OFFER_NOT_FOUND','Booster offer is no longer available');
  const arcana=supportsArcanaBooster(offer.entityId);
  if(!supportsBooster(offer.entityId)||offer.originalKey!==offer.entityId||offer.set!=='Booster')return reject(state,'UNSUPPORTED_CONTENT','This Booster effect is not implemented');
  if(typeof offer.cost!=='bigint'||!canAfford(state.money,offer.cost,state.bankruptAt??0n))return reject(state,'INSUFFICIENT_FUNDS','Insufficient available money');
  const next=structuredClone(state),events=[];
  // Native open callbacks finish before the delayed card-generation callback.
  applyItem7EconomyContext(next,{type:'open_booster'},events);
  applyChallengePurchaseInflation(next);
  const options={instancePrefix:'pack_'+(state.revision+1)};
  const generated=supportsRemainingBooster(offer.entityId)?generateApkRemainingPack(next.rng.apk,currentApkShopContext(next),{...options,boosterId:offer.entityId}):arcana?generateApkArcanaPack(next.rng.apk,currentApkShopContext(next),{...options,boosterId:offer.entityId,legacyShowman:!usesCurrentMechanics(next)}):generateApkCelestialPack(next.rng.apk,currentApkShopContext(next),{...options,...config(offer.entityId)});
  next.shop.boosters=next.shop.boosters.filter(card=>card.id!==offer.id);next.money-=offer.cost;next.rng.apk=generated.rng;next.phase='pack';next.revision++;
  next.packState={version:1,sourceEntityId:offer.entityId,cards:generated.cards,choicesRemaining:config(offer.entityId).choices};
  if(config(offer.entityId).kind==='Buffoon')stampJokerCreationOrdinals(next,next.packState.cards);
  if(handPack(offer.entityId)){const count=Math.min(next.drawPile.length,Math.max(0,next.round.handSize-next.hand.length)),ids=Array.from({length:count},()=>next.drawPile.pop());applyChallengeDraw(next,ids);next.hand.push(...ids);sortHand(next);next.packState.handDraw={cardIds:ids,handSize:next.round.handSize};if(ids.length)events.push({type:'cards_drawn',cardIds:ids});}
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
 if(action.type==='TAKE_PACK_CARD'&&Object.hasOwn(action,'targetCardIds'))return reject(state,'INVALID_ACTION','Taking a card does not use targets');
 const capability=action.type==='TAKE_PACK_CARD'?canTakePackCard(state,card):canUsePackCard(state,card,action.targetCardIds);if(!capability.available)return reject(state,capability.code,capability.reason);
 const kind=config(state.packState.sourceEntityId).kind;
 if(action.type==='TAKE_PACK_CARD'||kind==='Standard'||kind==='Buffoon'){
  const next=structuredClone(state),events=[];
  if(kind==='Standard'){const created=createPlayingCard(next,physicalCard(card));next.drawPile.pop();next.drawPile.unshift(created.id);applyItem7PlayingCardsAdded(next,[created],events);events.push({type:'playing_card_created',sourceId:card.id,cardId:created.id,card:structuredClone(created)});}
  else if(kind==='Buffoon')next.jokers.push(structuredClone(card));
  else {next.consumables??=[];next.consumables.push(structuredClone(card));stampJokerCreationOrdinals(next,[next.consumables.at(-1)]);}
  next.packState.cards=next.packState.cards.filter(c=>c.id!==card.id);next.packState.choicesRemaining--;next.revision++;
  const closed=next.packState.choicesRemaining===0;if(closed)closePack(next);
  next.apkShop.context=currentApkShopContext(next);
  return {state:next,events:[{type:'pack_card_taken',cardId:card.id,entityId:card.entityId},...events,...(closed?[{type:'booster_closed'}]:[])],error:null};
 }
 const staged=structuredClone(state);staged.phase='pack';staged.consumables??=[];staged.consumables.push(structuredClone(card));
 const used=applyConsumableAction(staged,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:card.id,targetCardIds:action.targetCardIds},{fromPack:true});if(used.error)return reject(state,used.error.code,used.error.message);
 used.state.packState.cards=used.state.packState.cards.filter(candidate=>candidate.id!==card.id);used.state.packState.choicesRemaining--;
 const closed=used.state.packState.choicesRemaining===0||used.state.packState.cards.length===0;
 if(closed)closePack(used.state);else used.state.phase='pack';
 used.state.apkShop.context=currentApkShopContext(used.state);
 return {state:used.state,events:[{type:'pack_card_used',cardId:card.id,entityId:card.entityId},...used.events,...(closed?[{type:'booster_closed'}]:[])],error:null};
}

// A tag opens the existing pack lifecycle without charging or inventing a shop.
export function openPendingTagPack(state,events=[]){
 if(state.phase!=='blind_selection'||!state.pendingTagPacks?.length)return state;
 const staged=structuredClone(state),boosterId=takeTagPack(staged);
 const savedShop=staged.shop,revision=staged.revision;
 const constructor=session(staged.rng.apk,{...currentApkShopContext(staged),reducedMotion:false});
 constructor.construct(boosterId,'tag_pack_'+revision,{materialize:true});staged.rng.apk=constructor.rng;
 staged.phase='shop';staged.shop={main:[],vouchers:[],boosters:[{id:'tag_pack_'+revision,entityId:boosterId,originalKey:boosterId,set:'Booster',edition:'base',cost:0n,sellCost:0n}],rerollBase:5n,rerollIncrease:0n,freeRerolls:0};
 // The same ante is retained while a free pack interrupts blind selection.
 staged.tagPackOpening=true;
 const opened=applyCelestialPackAction(staged,{type:'OPEN_BOOSTER',expectedRevision:revision,offerId:'tag_pack_'+revision});
 if(opened.error)throw new TypeError(opened.error.message);
 const next=opened.state;delete next.tagPackOpening;next.packState.returnPhase='blind_selection';next.revision=revision;
 if(savedShop===undefined)delete next.shop;else next.shop=savedShop;
 next.apkShop.context=currentApkShopContext(next);
 events.push(...opened.events.filter(event=>event.type!=='money_changed'));
 return next;
}
