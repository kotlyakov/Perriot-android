import {canSellOwned,canManageInventory} from '../core/inventory.js';
import {canUseConsumable,supportsConsumableEffect} from '../core/consumables.js';
import {canBuyShopCard,canBuyAndUseShopCard,hasConsumableSpace,hasJokerSpace,isPlayingShopCard} from '../core/shop.js';
import {supportsBooster,canUsePackCard} from '../core/celestial-pack.js';
import {canBuyVoucher} from '../core/vouchers.js';
import {canAfford} from '../core/shop-pricing.js';
export const SHOP_DROP_REGIONS={buy:[454,15,736,180],sell:[1210,15,180,180],use:[1210,215,180,420]};
export function shopDropActions(state,offer,kind,targets=[]){
 const owned=['owned','consumable'].includes(kind),fromPack=kind==='pack',area=kind==='owned'?'jokers':'consumables';
 const take=fromPack&&/^p_(standard|buffoon)_/.test(state.packState?.sourceEntityId??'');
 const actions={buy:{label:take?'Забрать':'Купить',reason:'Эта карта уже принадлежит вам.'},sell:{label:'Продать',reason:'Продавать можно только свои карты.'},use:{label:owned||fromPack?'Применить':'Купить и\nПрименить',reason:'Эту карту нельзя применить.'}};
 if(owned){
  actions.sell={...actions.sell,action:'SELL_OWNED_CARD',fields:{area,cardId:offer.id},price:offer.sellCost,reason:canSellOwned(state,offer,area)?null:offer.eternal?'Вечную карту нельзя продать.':'Продажа сейчас недоступна.'};
  if(kind==='consumable'){const capability=canUseConsumable(state,offer,targets);actions.use={...actions.use,action:'USE_CONSUMABLE',fields:{cardId:offer.id,targetCardIds:targets},reason:capability.reason};}
 }else if(fromPack){
  const capability=canUsePackCard(state,offer,targets),key=take?'buy':'use';actions[key]={...actions[key],action:'USE_PACK_CARD',fields:{cardId:offer.id,targetCardIds:targets},reason:capability.reason};
  if(!take)actions.buy.reason='Карту из этого набора нужно применить.';
 }else if(state.phase==='shop'){
  const pack=kind==='booster'&&supportsBooster(offer.entityId),voucher=kind==='voucher',consumable=supportsConsumableEffect(offer);
  let reason=!canAfford(state.money,offer.cost,state.bankruptAt??0n)?'Недостаточно денег.':null;
  if(!reason&&voucher&&!canBuyVoucher(state,offer))reason='Этот билет уже получен или недоступен.';
  if(!reason&&!pack&&!voucher&&!isPlayingShopCard(offer)&&!(consumable?hasConsumableSpace(state,offer):hasJokerSpace(state,offer)))reason=consumable?'Нет места для расходной карты.':'Нет места для Джокера.';
  if(!reason&&!pack&&!voucher&&!canBuyShopCard(state,offer))reason='Эту карту сейчас нельзя купить.';
  actions.buy={...actions.buy,action:pack?'OPEN_BOOSTER':voucher?'BUY_VOUCHER':'BUY_SHOP_CARD',fields:{offerId:offer.id},price:offer.cost,reason};
  if(consumable){const capability=canBuyAndUseShopCard(state,offer,targets);actions.use={...actions.use,action:'BUY_AND_USE_SHOP_CARD',fields:{offerId:offer.id,targetCardIds:targets},price:offer.cost,reason:capability.reason};}
 }
 for(const action of Object.values(actions))action.available=!!action.action&&!action.reason&&(!owned||canManageInventory(state));
 return actions;
}
