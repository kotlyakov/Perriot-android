import catalogue from '../content/apk-shop-catalog.js';
import {supportsConsumable,canManageInventory} from './inventory.js';
import {APK_HAND_NAMES,currentApkShopContext} from './apk-shop-state.js';

const centres=new Map(catalogue.centres.map(c=>[c.key,c]));
const handIds=Object.fromEntries(Object.entries(APK_HAND_NAMES).map(([id,name])=>[name,id]));
const totalKeys=['tarot','planet','spectral','tarot_planet','all'];
const emptyTotals=()=>Object.fromEntries(totalKeys.map(key=>[key,0]));
const counter=value=>Number.isSafeInteger(value)&&value>=0;
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const blocked=(code,reason)=>({available:false,code,reason});
export function supportsConsumableEffect(card){const centre=centres.get(card?.entityId);return supportsConsumable(card)&&!!(centre?.set==='Planet'&&handIds[centre.handType]||centre?.key==='c_black_hole');}

export function validConsumableUsage(state){
 const hasUsage=Object.hasOwn(state,'consumableUsage'),hasTotals=Object.hasOwn(state,'consumableUsageTotal');
 if(hasUsage!==hasTotals)return false;
 if(Object.hasOwn(state,'lastTarotPlanet')&&state.lastTarotPlanet!==null&&!['Tarot','Planet'].includes(centres.get(state.lastTarotPlanet)?.set))return false;
 if(Object.hasOwn(state,'consumableUsage')){
  if(!record(state.consumableUsage))return false;
  for(const [key,usage] of Object.entries(state.consumableUsage)){
   const centre=centres.get(key);
   if(!centre?.consumeable||!record(usage)||Object.keys(usage).length!==3||!counter(usage.count)||usage.count<1||usage.order!==centre.order||usage.set!==centre.set)return false;
  }
 }
 if(Object.hasOwn(state,'consumableUsageTotal')){
  const totals=state.consumableUsageTotal;
  if(!record(totals)||Object.keys(totals).length!==totalKeys.length||!totalKeys.every(key=>counter(totals[key])))return false;
  const expected=emptyTotals();
  for(const usage of Object.values(state.consumableUsage)){
   const set=usage.set.toLowerCase();if(!['tarot','planet','spectral'].includes(set))return false;
   expected[set]+=usage.count;
  }
  expected.tarot_planet=expected.tarot+expected.planet;expected.all=expected.tarot_planet+expected.spectral;
  if(!totalKeys.every(key=>counter(expected[key])&&totals[key]===expected[key]))return false;
 }
 return true;
}

// Read-only capability query for an owned card. Purchase-and-use must acquire it first.
export function canUseConsumable(state,card){
 if(!canManageInventory(state))return blocked('INVALID_PHASE','Расходная карта недоступна в текущей фазе.');
 if(!counter(state.revision)||state.revision===Number.MAX_SAFE_INTEGER)return blocked('INVALID_STATE','Некорректная версия состояния.');
 const cards=state.consumables??[];
 if(!Array.isArray(cards)||cards.some(c=>!c||typeof c.id!=='string'||!c.id)||new Set(cards.map(c=>c.id)).size!==cards.length)return blocked('INVALID_STATE','Некорректный набор расходных карт.');
 const owned=cards.find(c=>c.id===card?.id);
 if(!owned)return blocked('CARD_NOT_FOUND','Карта больше не принадлежит игроку.');
 const centre=centres.get(owned.entityId);
 if(!supportsConsumableEffect(owned))return blocked('USE_UNAVAILABLE','Эффект этой расходной карты ещё не реализован.');
 const affected=owned.debuffed?[]:centre.key==='c_black_hole'?Object.keys(APK_HAND_NAMES):[handIds[centre.handType]];
 if(!record(state.handLevels)||Object.keys(state.handLevels).length!==Object.keys(APK_HAND_NAMES).length||!Object.keys(APK_HAND_NAMES).every(id=>Number.isSafeInteger(state.handLevels[id])&&state.handLevels[id]>=1)||affected.some(id=>state.handLevels[id]===Number.MAX_SAFE_INTEGER)||!validConsumableUsage(state))return blocked('INVALID_STATE','Некорректный уровень комбинации или счётчик использования.');
 const totals=state.consumableUsageTotal??emptyTotals();
 const incremented=centre.set==='Planet'?['planet','tarot_planet','all']:['spectral','all'];
 if(state.consumableUsage?.[centre.key]?.count===Number.MAX_SAFE_INTEGER||incremented.some(key=>totals[key]===Number.MAX_SAFE_INTEGER))return blocked('INVALID_STATE','Переполнение счётчика использования.');
 try{if(state.apkShop)currentApkShopContext(state);}catch{return blocked('INVALID_STATE','Некорректное состояние магазина.');}
 return {available:true,code:null,reason:null};
}

// Own revision validation as well as dispatch validation, so direct calls remain atomic.
export function applyConsumableAction(state,action){
 const reject=(code,message)=>({state,events:[],error:{code,message}});
 if(!action||action.type!=='USE_CONSUMABLE'||!Number.isSafeInteger(action.expectedRevision)||typeof action.cardId!=='string'||!action.cardId)return reject('INVALID_ACTION','Malformed consumable action');
 if(action.expectedRevision!==state.revision)return reject('STALE_ACTION','State revision has changed');
 const card=Array.isArray(state.consumables)?state.consumables.find(c=>c?.id===action.cardId):null;
 const capability=canUseConsumable(state,card);
 if(!capability.available)return reject(capability.code,capability.reason);
 const centre=centres.get(card.entityId),next=structuredClone(state),events=[];
 const affected=card.debuffed?[]:centre.key==='c_black_hole'?Object.keys(APK_HAND_NAMES):[handIds[centre.handType]];
 for(const handId of affected){next.handLevels[handId]++;events.push({type:'hand_level_changed',handId,levels:1,level:next.handLevels[handId]});}
 // States predating the first implemented use operation have no possible prior uses.
 next.consumableUsage??={};next.consumableUsageTotal??=emptyTotals();next.lastTarotPlanet??=null;
 const usage=next.consumableUsage[centre.key]??{count:0,order:centre.order,set:centre.set};
 usage.count++;next.consumableUsage[centre.key]=usage;
 if(centre.set==='Planet'){next.consumableUsageTotal.planet++;next.consumableUsageTotal.tarot_planet++;next.lastTarotPlanet=centre.key;}
 else next.consumableUsageTotal.spectral++;
 next.consumableUsageTotal.all++;
 next.consumables=next.consumables.filter(c=>c.id!==card.id);next.lastScore=null;next.revision++;
 if(next.apkShop)next.apkShop.context=currentApkShopContext(next);
 events.unshift({type:'consumable_used',cardId:card.id,entityId:centre.key,set:centre.set});
 events.push({type:'consumable_usage_changed',entityId:centre.key,count:usage.count});
 return {state:next,events,error:null};
}
