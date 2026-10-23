import {changeHandSize} from './hand-size.js';
import {initializeItem7Joker,item7CapacityDeltas,resetItem7RoundTargets} from './joker-item7-lifecycle.js';
import {item7EconomyModifiers,applyItem7EconomyContext,applyItem7SoldJoker,repriceItem7Cards} from './joker-item7-economy.js';
import {stampJokerCreationOrdinals} from './shop.js';
import {disableBoss} from './boss-effects.js';
import {currentApkShopContext} from './apk-shop-state.js';

// One transaction boundary for effects shared by shop, inventory and pack actions.
export function finishItem7Action(before,next,action,events){
 const oldIds=new Set(before.jokers.map(j=>j.id));
 for(const joker of next.jokers)if(!oldIds.has(joker.id))initializeItem7Joker(next,joker);
 stampJokerCreationOrdinals(next,next.jokers.filter(j=>!oldIds.has(j.id)));
 const oldConsumableIds=new Set((before.consumables??[]).map(card=>card.id));
 if(next.rng?.apk)stampJokerCreationOrdinals(next,(next.consumables??[]).filter(card=>!oldConsumableIds.has(card.id)));
 if(next.jokers.some(j=>!oldIds.has(j.id)&&['j_idol','j_mail','j_ancient','j_castle'].includes(j.entityId)))resetItem7RoundTargets(next,{onlyMissing:true});
 const soldId=action.type==='SELL_JOKER'?action.jokerId:action.type==='SELL_OWNED_CARD'?action.cardId:null;
 if(soldId){
  const sold=before.jokers.find(j=>j.id===soldId);
  if(sold)applyItem7SoldJoker(next,sold,events,{acceptedRevision:before.revision});
  applyItem7EconomyContext(next,{type:'selling_card'},events);
 }
 const context={REROLL_SHOP:'reroll_shop',LEAVE_SHOP:'ending_shop',SKIP_PACK:'skipping_booster'}[action.type];
 if(context)applyItem7EconomyContext(next,{type:context},events);
 if(next.jokers.some(j=>j.entityId==='j_chicot'&&!j.debuffed)&&next.bossState&&!next.bossState.disabled)disableBoss(next,events,{acceptedRevision:before.revision});
 const oldDelta=item7CapacityDeltas(before.jokers),delta=item7CapacityDeltas(next.jokers),reset=['LEAVE_SHOP','SKIP_BLIND'].includes(action.type)||action.type==='CASH_OUT'&&!!next.apkShop;
 const applied=events.filter(event=>event.type==='joker_capacity_changed');
 const handDelta=delta.handSize-oldDelta.handSize-applied.reduce((sum,event)=>sum+event.handSize,0);
 changeHandSize(next,handDelta,{events,draw:true});
 next.round.discardsRemaining=Math.max(0,next.round.discardsRemaining+(reset?delta.discards:delta.discards-oldDelta.discards)-applied.reduce((sum,event)=>sum+event.discards,0));
 if(reset)next.round.handsRemaining=Math.max(1,next.round.handsRemaining+delta.hands);
 const old=item7EconomyModifiers(before),mod=item7EconomyModifiers(next);
 if(mod.bankruptAt!==0n||old.bankruptAt!==0n)next.bankruptAt=mod.bankruptAt;
 if(mod.astronomer!==old.astronomer)repriceItem7Cards(next);
 if(next.shop)next.shop.freeRerolls=!before.shop?mod.chaosCount:Math.max(0,next.shop.freeRerolls+mod.chaosCount-old.chaosCount);
 if(before.phase==='pack'&&next.phase==='pack'&&next.packState?.handDraw){
  const draw=next.packState.handDraw;
  for(const id of next.hand.filter(id=>!before.hand.includes(id))){
   const key=!before.cards[id]?'createdCardIds':before.drawPile.includes(id)?'extraDrawIds':null;
   if(key){draw[key]??=[];if(!draw[key].includes(id))draw[key].push(id);}
  }
 }
 if(next.apkShop)next.apkShop.context=currentApkShopContext(next);
}
