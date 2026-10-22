import {stakeScaling,runDiscards,validStake} from './stakes.js';
import {DECKS,deckHands,deckDiscards,deckHandSize,deckBlindScale} from '../content/decks.js';
import {voucherModifiers} from './vouchers.js';
import {createTagShopHooks} from './tag-effects.js';
import {createPlayingCard} from './apk-deck.js';
import {applyItem7PlayingCardsAdded} from './joker-item7-lifecycle.js';
import {canEnterBoss,bossTarget} from './boss-effects.js';
import {nativeBlindTarget,blindBase,canLeaveApkShop,chooseNextAnteBlinds} from './blind-progression.js';
import {chooseApkOrbitalHand} from './apk-tags.js';
import {SUPPORTED_JOKERS,supportsJoker} from '../content/jokers.js';
import {canAfford} from './shop-pricing.js';
import {validateApkRng} from './apk-rng.js';
import {rerollApkShop} from './apk-shop.js';
import {currentApkShopContext} from './apk-shop-state.js';
import {supportsConsumableEffect} from './consumables.js';

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
  return shop.freeRerolls>0?0n:shop.rerollCostOverride??shop.rerollBase+shop.rerollIncrease;
}
export function hasJokerSpace(state,offer) {
  const slots=state.jokerSlots??5;
  if(!count(slots) || !Array.isArray(state.jokers))return false;
  const negatives=state.jokers.filter(j=>j.edition==='negative').length;
  return state.jokers.length<slots+negatives+(offer?.edition==='negative'?1:0);
}
export function hasConsumableSpace(state,offer){
 const cards=state.consumables??[],slots=state.consumableSlots??2;
 return Array.isArray(cards)&&count(slots)&&cards.length<slots+cards.filter(c=>c.edition==='negative').length+(offer?.edition==='negative'?1:0);
}
export function stampJokerCreationOrdinals(state,cards){
 if(!Number.isSafeInteger(state.nextJokerCreationOrdinal)||state.nextJokerCreationOrdinal<1){
  const known=[...(state.jokers??[]),...(state.consumables??[]),...(state.shop?['main','vouchers','boosters'].flatMap(area=>state.shop[area]??[]):[])].map(card=>card?.creationOrdinal).filter(value=>Number.isSafeInteger(value)&&value>=1);
  state.nextJokerCreationOrdinal=(known.length?Math.max(...known):0)+1;
 }
 for(const card of cards)if((['Joker','Tarot','Planet','Spectral'].includes(card?.set)||supportsConsumableEffect(card))&&!Object.hasOwn(card,'creationOrdinal'))card.creationOrdinal=state.nextJokerCreationOrdinal++;
}
export function isPlayingShopCard(offer){return ['Base','Enhanced'].includes(offer?.set)&&typeof offer.frontKey==='string'&&/^[CDHS]_[2-9AJKQT]$/.test(offer.frontKey);}
export function canBuyShopCard(state,offer){
 const consumable=supportsConsumableEffect(offer),playing=isPlayingShopCard(offer);
 return state.phase==='shop'&&(state.inflation??0n)===0n&&(playing||consumable||supportsJoker(offer))&&canAfford(state.money,offer.cost,state.bankruptAt??0n)&&(playing?Object.keys(state.cards??{}).length<10000:consumable?hasConsumableSpace(state,offer):hasJokerSpace(state,offer));
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
    const consumable=supportsConsumableEffect(offer),playing=isPlayingShopCard(offer);
    if(!playing&&!consumable&&!supportsJoker(offer) || (state.inflation??0n)!==0n)
      return reject('UNSUPPORTED_CONTENT','Purchase effect is not implemented');
    if(state.apkShop&&(offer.originalKey!==offer.entityId||!(playing?['Base','Enhanced'].includes(offer.set):consumable?['Tarot','Planet','Spectral'].includes(offer.set):offer.set==='Joker')))return reject('INVALID_STATE','Invalid native offer identity');
    if(state.cards&&Object.hasOwn(state.cards,offer.id))return reject('INVALID_STATE','Instance ID collides with a playing card');
    if([...state.jokers,...(state.consumables??[])].some(j=>j.id===offer.id))return reject('INVALID_STATE','Instance ID already owned');
    if(!(playing?Object.keys(state.cards??{}).length<10000:consumable?hasConsumableSpace(state,offer):hasJokerSpace(state,offer)))return reject('NO_SPACE','Inventory area is full');
    if(!canAfford(state.money,offer.cost,floor))return reject('INSUFFICIENT_FUNDS','Insufficient available money');
    const next=structuredClone(state);
    next.shop.main=next.shop.main.filter(o=>o.id!==offer.id);
    const bought=structuredClone(offer);stampJokerCreationOrdinals(next,[bought]);
    if(playing){const [suit,rank]=offer.frontKey.split('_'),value=({A:14,K:13,Q:12,J:11,T:10})[rank]??Number(rank);const card=createPlayingCard(next,{rank:value,suit:({C:'clubs',D:'diamonds',H:'hearts',S:'spades'})[suit],edition:offer.edition,...(offer.enhancement?{enhancement:offer.enhancement}:{})});applyItem7PlayingCardsAdded(next,[card],[]);}else if(consumable){next.consumables??=[];next.consumables.push(bought);}else next.jokers.push(bought);next.money-=offer.cost;
    if(next.apkShop)next.apkShop.context=currentApkShopContext(next);
    return finish(next,[{type:'shop_card_bought',offerId:offer.id,...(consumable?{consumableId:offer.id}:{jokerId:offer.id}),cost:offer.cost},
      {type:'money_changed',before:state.money,after:next.money,delta:-offer.cost}]);
  }
  if(action.type==='SELL_JOKER') {
    const joker=state.jokers.find(j=>j.id===action.jokerId);
    if(!joker)return reject('JOKER_NOT_FOUND','Joker is no longer owned');
    if(joker.eternal)return reject('ETERNAL_CARD','Eternal cards cannot be sold');
    if(!amount(joker.sellCost))return reject('INVALID_STATE','Missing stored sell value');
    if(!SUPPORTED_JOKERS.includes(joker.entityId))return reject('UNSUPPORTED_CONTENT','Selling effect is not implemented');
    const next=structuredClone(state);next.jokers=next.jokers.filter(j=>j.id!==joker.id);next.money+=joker.sellCost;
    if(next.apkShop)next.apkShop.context=currentApkShopContext(next);
    return finish(next,[{type:'joker_sold',jokerId:joker.id,sellCost:joker.sellCost},
      {type:'money_changed',before:state.money,after:next.money,delta:joker.sellCost}]);
  }
  if(action.type==='REROLL_SHOP') {
    const cost=getRerollCost(state.shop);
    if(!canAfford(state.money,cost,floor))return reject('INSUFFICIENT_FUNDS','Insufficient available money');
    const native=!!state.apkShop;
    if(!native&&(typeof refill!=='function' || !state.rng?.shop))return reject('REFILL_UNAVAILABLE','No verified refill producer');
    let produced;const generationState=structuredClone(state),tagEvents=[];
    try {
      produced=native?rerollApkShop(state.rng.apk,currentApkShopContext(state),{mainHooks:createTagShopHooks(generationState,tagEvents),previousMain:state.shop.main,instancePrefix:'reroll_'+(state.revision+1)}):
        refill({rng:structuredClone(state.rng.shop),offers:structuredClone(state.shop.main)});
      if(!produced || !validMain(produced.main) || !produced.rng)return reject('INVALID_REFILL','Invalid refill output');
      if(native)validateApkRng(produced.rng);
      else if(produced.rng.algorithm!==state.rng.shop.algorithm ||
        !Number.isInteger(produced.rng.state) || produced.rng.state<0 || produced.rng.state>=2**32)
        return reject('INVALID_REFILL','Invalid refill output');
      const proposed={...state.shop,main:produced.main};
      if(!validShop(proposed) || produced.main.some(o=>state.jokers.some(j=>j.id===o.id)))return reject('INVALID_REFILL','Duplicate refill instance ID');
    }catch{return reject('INVALID_REFILL','Refill producer failed');}
    const next=generationState;next.shop.main=structuredClone(produced.main);
    stampJokerCreationOrdinals(next,next.shop.main);
    next.rng[native?'apk':'shop']=structuredClone(produced.rng);next.money-=cost;
    if(native)next.apkShop.context=currentApkShopContext(next);
    delete next.shop.rerollCostOverride;
    if(next.shop.freeRerolls>0)next.shop.freeRerolls--;
    else next.shop.rerollIncrease++;
    return finish(next,[...tagEvents,{type:'shop_rerolled',cost,offerIds:next.shop.main.map(o=>o.id),nextCost:getRerollCost(next.shop)},
      {type:'money_changed',before:state.money,after:next.money,delta:-cost}]);
  }
  if(action.type==='LEAVE_SHOP') {
    if(state.apkShop){
      const boss=state.round.blindId==='big'&&canEnterBoss({...state,phase:'blind_selection'});
      if(nextRound||!canLeaveApkShop(state))return reject('NEXT_BLIND_UNAVAILABLE','Next blind lifecycle is unavailable');
      const next=structuredClone(state);next.phase='blind_selection';next.shop=null;
      const newAnte=state.round.blindId==='boss',ante=state.round.ante+(newAnte?1:0);
      if(newAnte){
        try{
          // Old boss-shop saves lack a pending selection: create it once, preserving the paid shop.
          const selected=next.nextAnteBlinds?{selection:next.nextAnteBlinds,rng:next.rng.apk}:chooseNextAnteBlinds(next,next.rng.apk);
          next.apkBlinds=selected.selection;next.rng.apk=selected.rng;delete next.nextAnteBlinds;
          for(const id of ['small','big','boss']){
            const orbital=chooseApkOrbitalHand(next.rng.apk,next.apkBlinds.tagContext);
            next.apkBlinds.orbitalHands[id]=orbital.hand;next.rng.apk=orbital.rng;
          }
        }catch{return reject('NEXT_BLIND_UNAVAILABLE','Invalid next ante selection');}
      }
      const vouchers=voucherModifiers(next);delete next.round.targetAnte;
      next.round={...next.round,ante,blindId:newAnte?'small':boss?'boss':'big',target:newAnte?nativeBlindTarget(ante,deckBlindScale(next.deckId),stakeScaling(next)):boss?bossTarget(next):nativeBlindTarget(ante,1.5*deckBlindScale(next.deckId),stakeScaling(next)),score:0n,handsRemaining:deckHands(next.deckId)+vouchers.hands,discardsRemaining:runDiscards(next)+vouchers.discards};
      delete next.round.bossDisabled;
      next.hand=[];next.discardPile=[];next.apkShop.context=currentApkShopContext(next);
      return finish(next,[{type:'shop_left',nextBlindId:next.round.blindId}]);
    }
    if(!nextRound || typeof nextRound.blindId!=='string' || !amount(nextRound.target) || nextRound.target===0n ||
      !count(nextRound.ante) || nextRound.ante===0 || nextRound.score!==0n || !count(nextRound.handsRemaining) ||
      !count(nextRound.discardsRemaining) || !count(nextRound.handSize))return reject('NEXT_BLIND_UNAVAILABLE','Next blind configuration must be supplied');
    const next=structuredClone(state);next.phase='blind_selection';next.shop=null;
    next.round=structuredClone(nextRound);next.hand=[];next.discardPile=[];next.drawPile=Object.keys(next.cards);
    return finish(next,[{type:'shop_left',nextBlindId:nextRound.blindId}]);
  }
  return reject('UNKNOWN_ACTION','Unsupported shop action');
}




