import {hasEffectMechanisms} from './playing-card-modifiers.js';
import {nextApkMathRandom} from './apk-rng.js';
import {isBossCardDebuffed} from './boss-effects.js';
import {jokerEffectContext} from './joker-contexts.js';
import {generateApkSealConsumables} from './apk-shop.js';
import {currentApkShopContext,APK_HAND_NAMES} from './apk-shop-state.js';
import catalogue from '../content/apk-shop-catalog.js';
const planets=new Map(catalogue.centres.filter(c=>c.set==='Planet').map(c=>[c.handType,c.key]));
const debuffed=(state,card)=>card.debuffed===true||isBossCardDebuffed(state,card);
const freeSlots=state=>Math.max(0,(state.consumableSlots??2)+(state.consumables??[]).filter(c=>c.edition==='negative').length-(state.consumables??[]).length);
function createReserved(state,requests,events,phase,callbacks=requests){
 if(!callbacks.length)return;
 const prefix=`seal:${phase}:${state.revision}`;
 const occupied=new Set([...Object.keys(state.cards),...state.jokers.map(c=>c.id),...(state.consumables??[]).map(c=>c.id)]);
 if(requests.some((_,index)=>occupied.has(`${prefix}:${index+1}`)))throw new TypeError('Seal creation identity collision');
 let index=0;
 for(const callback of callbacks){
  if(callback.juice){const draw=nextApkMathRandom(state.rng.apk.mathState);state.rng.apk={...state.rng.apk,mathState:draw.state};continue;}
  const result=generateApkSealConsumables(state.rng.apk,currentApkShopContext(state),{requests:[callback],instancePrefix:prefix,instanceOffset:index++});
  state.rng.apk=result.rng;state.consumables??=[];state.consumables.push(...result.cards);
  const card=result.cards[0];events.push({type:'consumable_created',sourceId:callback.sourceId,cardId:card.id,entityId:card.entityId,set:card.set});
  if(state.apkShop)state.apkShop.context=currentApkShopContext(state);
 }
}
// Request reservations precede callback execution, matching the shared native buffer.
export function applyDiscardSeals(state,cardIds,events){
 const requests=[],space=freeSlots(state);
 for(const id of cardIds){const card=state.cards[id];if(!card)throw new TypeError('Unknown discarded card');if(requests.length<space&&card.seal==='purple'&&!debuffed(state,card))requests.push({set:'Tarot',sourceId:id});}
 createReserved(state,requests,events,'discard');
}
export function applyEndRoundCardEffects(state,events){
 const requests=[],callbacks=[],space=freeSlots(state),before=state.money,admitGoldJuice=hasEffectMechanisms(state);
 const mimeSources=state.jokers.map((_,index)=>jokerEffectContext(state.jokers,index)).filter(context=>context?.target.entityId==='j_mime').map(context=>context.source.id);
 const centreId=planets.get(APK_HAND_NAMES[state.lastPlayedHand]);
 for(const id of state.hand){
  const card=state.cards[id];if(debuffed(state,card))continue;
  const initialEffect=card.enhancement==='gold'||card.seal==='blue'&&requests.length<space;
  if(!initialEffect)continue;
  const repeats=[null,...(card.seal==='red'?[id]:[]),...mimeSources];
  for(const effectSourceId of repeats){
   if(card.enhancement==='gold'){state.money+=3n;events.push({type:'gold_card_paid',cardId:id,amount:3n,...(effectSourceId?{effectSourceId}:{})});}
   if(card.seal==='blue'&&centreId&&requests.length<space){const request={set:'Planet',centreId,sourceId:id};requests.push(request);callbacks.push(request);}
   if(card.enhancement==='gold'&&admitGoldJuice&&state.rng?.apk)callbacks.push({juice:true});
  }
 }
 if(state.money!==before)events.push({type:'money_changed',before,after:state.money,delta:state.money-before});
 createReserved(state,requests,events,'round',callbacks);
}
