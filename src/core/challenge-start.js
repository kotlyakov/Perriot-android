import {session} from './apk-shop.js';
import {stampJokerCreationOrdinals} from './shop.js';
import {syncVoucherShopContext,voucherModifiers} from './vouchers.js';
import {challengeHands,challengeDiscards,challengeHandSize,challengeShopContext} from './challenge-rules.js';
import {changeHandSize} from './hand-size.js';

export function applyChallengeStart(state,challenge){
 state.challengeId=challenge.id;
 state.money=BigInt(challenge.money??4);
 state.round.handsRemaining=challengeHands(state);
 state.round.discardsRemaining=challengeDiscards(state);
 state.round.handSize=challengeHandSize(state);
 if(challenge.jokerSlots!==undefined)state.jokerSlots=challenge.jokerSlots;
 if(challenge.startingVouchers?.length){
  const ctx=state.apkShop.context;
  ctx.usedVoucherIds=[...new Set([...ctx.usedVoucherIds,...challenge.startingVouchers])];
  const mod=voucherModifiers(state);
  state.round.handsRemaining+=mod.hands;
  state.round.discardsRemaining+=mod.discards;
  state.round.handSize+=mod.handSize;
  state.jokerSlots=(state.jokerSlots??5)+mod.jokerSlots;
  state.consumableSlots=(state.consumableSlots??2)+mod.consumableSlots;
  syncVoucherShopContext(state);
 }
 state.apkShop.context=challengeShopContext(state);
 if(challenge.startingJokers?.length){
  const s=session(state.rng.apk,state.apkShop.context);
  state.jokers=challenge.startingJokers.map((row,index)=>{
   const joker=s.construct(row.id,`challenge_${challenge.id}_joker_${index+1}`,{materialize:true});
   if(row.eternal)joker.eternal=true;
   if(row.negative)joker.edition='negative';
   if(row.pinned)joker.pinned=true;
   return joker;
  });
  state.rng.apk=s.rng;stampJokerCreationOrdinals(state,state.jokers);
 }
 if(challenge.startingConsumables?.length){
  const s=session(state.rng.apk,state.apkShop.context);
  const cards=challenge.startingConsumables.map((id,index)=>s.construct(id,`challenge_${challenge.id}_consumable_${index+1}`,{materialize:true}));
  state.consumables=[...(state.consumables??[]),...cards];
  state.rng.apk=s.rng;stampJokerCreationOrdinals(state,cards);
 }
 const divisor=challenge.modifiers?.minusHandSizePerDollars;
 if(divisor)changeHandSize(state,-Number(state.money/BigInt(divisor)));
 state.apkShop.context=challengeShopContext(state);
}
