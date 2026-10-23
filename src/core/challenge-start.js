import {isVerificationSeed} from './verification-seed.js';
import {session} from './apk-shop.js';
import {stampJokerCreationOrdinals} from './shop.js';
import {syncVoucherShopContext,voucherModifiers} from './vouchers.js';
import {challengeHands,challengeDiscards,challengeHandSize,challengeShopContext} from './challenge-rules.js';
import {changeHandSize} from './hand-size.js';
import {initializeItem7Joker,item7CapacityDeltas} from './joker-item7-lifecycle.js';
import {item7EconomyModifiers} from './joker-item7-economy.js';
import {currentApkShopContext} from './apk-shop-state.js';

export function applyChallengeStart(state,challenge){
 state.challengeId=challenge.id;
 state.money=isVerificationSeed(state.seed)?100n:BigInt(challenge.money??4);
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
   initializeItem7Joker(state,joker);
   return s.reprice(joker);
  });
  state.rng.apk=s.rng;stampJokerCreationOrdinals(state,state.jokers);
 }
 const capacity=item7CapacityDeltas(state.jokers);
 state.round.handsRemaining+=capacity.hands;
 state.round.discardsRemaining+=capacity.discards;
 changeHandSize(state,capacity.handSize);
 const bankruptAt=item7EconomyModifiers(state).bankruptAt;
 if(bankruptAt!==0n)state.bankruptAt=bankruptAt;
 if(challenge.startingConsumables?.length){
  const s=session(state.rng.apk,state.apkShop.context);
  const cards=challenge.startingConsumables.map((id,index)=>s.construct(id,`challenge_${challenge.id}_consumable_${index+1}`,{materialize:true}));
  state.consumables=[...(state.consumables??[]),...cards];
  state.rng.apk=s.rng;stampJokerCreationOrdinals(state,cards);
 }
 const divisor=challenge.modifiers?.minusHandSizePerDollars;
 if(divisor){state.challengeLuxuryTax=Number(state.money/BigInt(divisor));changeHandSize(state,-state.challengeLuxuryTax);}
 state.apkShop.context=challengeShopContext(state);
 state.apkShop.context=currentApkShopContext(state);
 return state.rng.apk;
}
