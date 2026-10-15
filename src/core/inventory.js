import {disableBoss} from './boss-effects.js';
import {captureCashoutQuote} from './cashout.js';
import {supportsJoker} from '../content/jokers.js';
import catalogue from '../content/apk-shop-catalog.js';
import {currentApkShopContext} from './apk-shop-state.js';
const consumables=new Map(catalogue.centres.filter(c=>['Tarot','Planet','Spectral'].includes(c.set)).map(c=>[c.key,c.set]));
export function supportsConsumable(card){return consumables.get(card?.entityId)===card?.set&&card.originalKey===card.entityId&&!card.rental&&!card.perishable;}
export function canManageInventory(state){return ['blind_selection','playing','round_won','shop'].includes(state.phase);}
export function canSellOwned(state,card,area){return canManageInventory(state)&&!card.eternal&&typeof card.sellCost==='bigint'&&card.sellCost>=0n&&(area==='jokers'?supportsJoker(card,{owned:true}):area==='consumables'&&supportsConsumable(card));}
export function applyInventoryAction(state,action){
 const reject=(code,message)=>({state,events:[],error:{code,message}});
 if(!canManageInventory(state))return reject('INVALID_PHASE','Inventory is locked');
 const area=action.type==='REORDER_JOKERS'?'jokers':action.type==='REORDER_CONSUMABLES'?'consumables':action.area;
 if(!['jokers','consumables'].includes(area))return reject('INVALID_SELECTION','Unknown inventory area');
 const cards=state[area]??[];
 if(!Array.isArray(cards)||cards.some(c=>!c||typeof c.id!=='string')||new Set(cards.map(c=>c.id)).size!==cards.length)return reject('INVALID_STATE','Invalid inventory');
 let next,events;
 if(action.type.startsWith('REORDER_')){
  const ids=action.cardIds;
  if(!Array.isArray(ids)||ids.length!==cards.length||new Set(ids).size!==ids.length||ids.some(id=>!cards.some(c=>c.id===id)))return reject('INVALID_SELECTION','Expected an exact inventory permutation');
  next=structuredClone(state);if(state.phase==='round_won'&&!next.cashoutQuote)next.cashoutQuote=captureCashoutQuote(state);next[area]=ids.map(id=>next[area].find(c=>c.id===id));events=[{type:'inventory_reordered',area,cardIds:[...ids]}];
 }else{
  const card=cards.find(c=>c.id===action.cardId);
  if(!card)return reject('CARD_NOT_FOUND','Card is no longer owned');
  if(!canSellOwned(state,card,area))return reject('SALE_UNAVAILABLE','This card cannot be sold');
  if(typeof state.money!=='bigint')return reject('INVALID_STATE','Invalid money');
  next=structuredClone(state);if(state.phase==='round_won'&&!next.cashoutQuote)next.cashoutQuote=captureCashoutQuote(state);next[area]=next[area].filter(c=>c.id!==card.id);next.money+=card.sellCost;
  events=[{type:'owned_card_sold',area,cardId:card.id,sellCost:card.sellCost},{type:'money_changed',before:state.money,after:next.money,delta:card.sellCost}];
  if(area==='jokers'&&next.bossState?.hiddenJokerIds)next.bossState.hiddenJokerIds=next.bossState.hiddenJokerIds.filter(id=>id!==card.id);
  if(area==='jokers'&&next.bossState?.id==='bl_final_leaf')disableBoss(next,events);
  if(area==='jokers'&&next.bossState?.id==='bl_final_heart'&&next.bossState.heartDebuffedJokerId===card.id)next.bossState.heartDebuffedJokerId=null;
 }
 next.lastScore=null;next.revision++;
 if(next.apkShop)next.apkShop.context=currentApkShopContext(next);
 return {state:next,events,error:null};
}
