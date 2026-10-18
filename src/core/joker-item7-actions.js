import {initializeItem7Joker,item7CapacityDeltas} from './joker-item7-lifecycle.js';
import {item7EconomyModifiers,applyItem7EconomyContext,applyItem7SoldJoker,repriceItem7Cards} from './joker-item7-economy.js';
import {stampJokerCreationOrdinals} from './shop.js';
import {disableBoss} from './boss-effects.js';
import {currentApkShopContext} from './apk-shop-state.js';

// One transaction boundary for effects shared by shop, inventory and pack actions.
export function finishItem7Action(before,next,action,events){
 const oldIds=new Set(before.jokers.map(j=>j.id));
 for(const joker of next.jokers)if(!oldIds.has(joker.id))initializeItem7Joker(next,joker);
 stampJokerCreationOrdinals(next,next.jokers.filter(j=>!oldIds.has(j.id)));
 const soldId=action.type==='SELL_JOKER'?action.jokerId:action.type==='SELL_OWNED_CARD'?action.cardId:null;
 if(soldId){
  const sold=before.jokers.find(j=>j.id===soldId);
  if(sold)applyItem7SoldJoker(next,sold,events);
  applyItem7EconomyContext(next,{type:'selling_card'},events);
 }
 const context={REROLL_SHOP:'reroll_shop',LEAVE_SHOP:'ending_shop',OPEN_BOOSTER:'open_booster',SKIP_PACK:'skipping_booster'}[action.type];
 if(context)applyItem7EconomyContext(next,{type:context},events);
 const oldDelta=item7CapacityDeltas(before.jokers),delta=item7CapacityDeltas(next.jokers),reset=action.type==='LEAVE_SHOP'||action.type==='SKIP_BLIND';
 const applied=events.filter(event=>event.type==='joker_capacity_changed');
 const handDelta=delta.handSize-oldDelta.handSize-applied.reduce((sum,event)=>sum+event.handSize,0);
 next.round.handSize+=handDelta;
 if(next.bossState)next.bossState.baseHandSize+=handDelta;
 next.round.discardsRemaining=Math.max(0,next.round.discardsRemaining+(reset?delta.discards:delta.discards-oldDelta.discards)-applied.reduce((sum,event)=>sum+event.discards,0));
 if(reset)next.round.handsRemaining=Math.max(1,next.round.handsRemaining+delta.hands);
 const old=item7EconomyModifiers(before),mod=item7EconomyModifiers(next);
 if(mod.bankruptAt!==0n||old.bankruptAt!==0n)next.bankruptAt=mod.bankruptAt;
 if(mod.astronomer!==old.astronomer)repriceItem7Cards(next);
 if(next.shop)next.shop.freeRerolls=!before.shop?mod.chaosCount:Math.max(0,next.shop.freeRerolls+mod.chaosCount-old.chaosCount);
 if(next.jokers.some(j=>j.entityId==='j_chicot'&&!j.debuffed)&&next.bossState&&!next.bossState.disabled)disableBoss(next,events);
 if(next.apkShop)next.apkShop.context=currentApkShopContext(next);
}
