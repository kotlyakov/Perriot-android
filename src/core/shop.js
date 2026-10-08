import {SUPPORTED_JOKERS} from '../content/jokers.js';
import {canAfford} from './shop-pricing.js';

const amount=x=>typeof x==='bigint' && x>=0n;
const count=x=>Number.isSafeInteger(x) && x>=0;
function validMain(main) {
  return Array.isArray(main) && main.every(o=>o && typeof o.id==='string' && o.id &&
    typeof o.entityId==='string' && amount(o.cost) && amount(o.sellCost)) &&
    new Set(main.map(o=>o.id)).size===main.length;
}
function validShop(shop) {
  if(!shop || !validMain(shop.main) || !Array.isArray(shop.vouchers) || !Array.isArray(shop.boosters) ||
    !amount(shop.rerollBase) || !amount(shop.rerollIncrease) || !count(shop.freeRerolls))return false;
  const ids=[...shop.main,...shop.vouchers,...shop.boosters].map(o=>o?.id);
  return ids.every(id=>typeof id==='string' && id) && new Set(ids).size===ids.length;
}
export function createShop({offers,rerollBase=5n,freeRerolls=0}={}) {
  const shop={main:offers?.main??[],vouchers:offers?.vouchers??[],boosters:offers?.boosters??[],
    rerollBase,rerollIncrease:0n,freeRerolls};
  if(!validShop(shop))throw new TypeError('Invalid shop offers or reroll configuration');
  return structuredClone(shop);
}
export function getRerollCost(shop) {
  if(!validShop(shop))throw new TypeError('Invalid shop');
  return shop.freeRerolls>0?0n:shop.rerollBase+shop.rerollIncrease;
}
export function hasJokerSpace(state,offer) {
  const slots=state.jokerSlots??5;
  if(!count(slots) || !Array.isArray(state.jokers))return false;
  const negatives=state.jokers.filter(j=>j.edition==='negative').length;
  return state.jokers.length<slots+negatives+(offer?.edition==='negative'?1:0);
}

// Caller supplies verified offers and RNG producer; no inferred original pool here.
export function applyShopAction(state,action,{refill,nextRound}={}) {
  const reject=(code,message)=>({state,events:[],error:{code,message}});
  if(!action || typeof action.type!=='string' || !Number.isSafeInteger(action.expectedRevision))return reject('INVALID_ACTION','Malformed action');
  if(action.expectedRevision!==state.revision)return reject('STALE_ACTION','State revision has changed');
  if(state.phase!=='shop')return reject('INVALID_PHASE','Shop is not active');
  if(!count(state.revision) || state.revision===Number.MAX_SAFE_INTEGER || !validShop(state.shop) ||
    typeof state.money!=='bigint' || typeof (state.bankruptAt??0n)!=='bigint' || !Array.isArray(state.jokers) ||
    state.jokers.some(j=>!j || typeof j.id!=='string' || !j.id) ||
    new Set(state.jokers.map(j=>j.id)).size!==state.jokers.length)return reject('INVALID_STATE','Invalid shop state');
  const floor=state.bankruptAt??0n;
  const finish=(next,events)=>{next.revision++;next.lastScore=null;return {state:next,events,error:null};};
  if(action.type==='BUY_SHOP_CARD') {
    const offer=state.shop.main.find(o=>o.id===action.offerId);
    if(!offer)return reject('OFFER_NOT_FOUND','Shop offer is no longer available');
    if(!SUPPORTED_JOKERS.includes(offer.entityId) || offer.edition && offer.edition!=='base' ||
      offer.rental || offer.perishable || offer.debuffed || (state.inflation??0n)!==0n)
      return reject('UNSUPPORTED_CONTENT','Purchase effect is not implemented');
    if(state.jokers.some(j=>j.id===offer.id))return reject('INVALID_STATE','Instance ID already owned');
    if(!hasJokerSpace(state,offer))return reject('NO_SPACE','Joker area is full');
    if(!canAfford(state.money,offer.cost,floor))return reject('INSUFFICIENT_FUNDS','Insufficient available money');
    const next=structuredClone(state);
    next.shop.main=next.shop.main.filter(o=>o.id!==offer.id);
    next.jokers.push(structuredClone(offer));next.money-=offer.cost;
    return finish(next,[{type:'shop_card_bought',offerId:offer.id,jokerId:offer.id,cost:offer.cost},
      {type:'money_changed',before:state.money,after:next.money,delta:-offer.cost}]);
  }
  if(action.type==='SELL_JOKER') {
    const joker=state.jokers.find(j=>j.id===action.jokerId);
    if(!joker)return reject('JOKER_NOT_FOUND','Joker is no longer owned');
    if(joker.eternal)return reject('ETERNAL_CARD','Eternal cards cannot be sold');
    if(!amount(joker.sellCost))return reject('INVALID_STATE','Missing stored sell value');
    if(!SUPPORTED_JOKERS.includes(joker.entityId))return reject('UNSUPPORTED_CONTENT','Selling effect is not implemented');
    const next=structuredClone(state);next.jokers=next.jokers.filter(j=>j.id!==joker.id);next.money+=joker.sellCost;
    return finish(next,[{type:'joker_sold',jokerId:joker.id,sellCost:joker.sellCost},
      {type:'money_changed',before:state.money,after:next.money,delta:joker.sellCost}]);
  }
  if(action.type==='REROLL_SHOP') {
    const cost=getRerollCost(state.shop);
    if(!canAfford(state.money,cost,floor))return reject('INSUFFICIENT_FUNDS','Insufficient available money');
    if(typeof refill!=='function' || !state.rng?.shop)return reject('REFILL_UNAVAILABLE','No verified refill producer');
    let produced;
    try {
      produced=refill({rng:structuredClone(state.rng.shop),offers:structuredClone(state.shop.main)});
      if(!produced || !validMain(produced.main) || !produced.rng || produced.rng.algorithm!==state.rng.shop.algorithm ||
        !Number.isInteger(produced.rng.state) || produced.rng.state<0 || produced.rng.state>=2**32)
        return reject('INVALID_REFILL','Invalid refill output');
      const proposed={...state.shop,main:produced.main};
      if(!validShop(proposed) || produced.main.some(o=>state.jokers.some(j=>j.id===o.id)))return reject('INVALID_REFILL','Duplicate refill instance ID');
    }catch{return reject('INVALID_REFILL','Refill producer failed');}
    const next=structuredClone(state);next.shop.main=structuredClone(produced.main);
    next.rng.shop=structuredClone(produced.rng);next.money-=cost;
    if(next.shop.freeRerolls>0)next.shop.freeRerolls--;
    else next.shop.rerollIncrease++;
    return finish(next,[{type:'shop_rerolled',cost,offerIds:next.shop.main.map(o=>o.id),nextCost:getRerollCost(next.shop)},
      {type:'money_changed',before:state.money,after:next.money,delta:-cost}]);
  }
  if(action.type==='LEAVE_SHOP') {
    if(!nextRound || typeof nextRound.blindId!=='string' || !amount(nextRound.target) || nextRound.target===0n ||
      !count(nextRound.ante) || nextRound.ante===0 || nextRound.score!==0n || !count(nextRound.handsRemaining) ||
      !count(nextRound.discardsRemaining) || !count(nextRound.handSize))return reject('NEXT_BLIND_UNAVAILABLE','Next blind configuration must be supplied');
    const next=structuredClone(state);next.phase='blind_selection';next.shop=null;
    next.round=structuredClone(nextRound);next.hand=[];next.discardPile=[];next.drawPile=Object.keys(next.cards);
    return finish(next,[{type:'shop_left',nextBlindId:nextRound.blindId}]);
  }
  return reject('UNKNOWN_ACTION','Unsupported shop action');
}
