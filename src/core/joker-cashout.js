// Cashout rows accumulate separately from money; they do not fund interest.
// Native sources: Card:calculate_dollar_bonus and the Cloud 9 Card:update tally.
export function getJokerCashoutBonuses(state) {
 const bonuses=[];
 let nines;
 for(const joker of state.jokers){
  if(joker.debuffed)continue;
  let amount=0n;
  if(joker.entityId==='j_golden')amount=4n;
  if(joker.entityId==='j_cloud_9'){
   nines??=Object.values(state.cards).reduce((count,card)=>count+(card.rank===9&&card.enhancement!=='stone'?1n:0n),0n);
   amount=nines;
  }
  if(joker.entityId==='j_rocket')amount=joker.rocketDollars??1n;
  if(joker.entityId==='j_satellite')amount=BigInt(Object.values(state.consumableUsage??{}).filter(usage=>usage.set==='Planet').length);
  if(joker.entityId==='j_delayed_grat'&&(state.round?.discardsUsed??0)===0&&(state.round?.discardsRemaining??0)>0)amount=2n*BigInt(state.round.discardsRemaining);
  if(amount>0n)bonuses.push({sourceId:joker.id,entityId:joker.entityId,amount});
 }
 return bonuses;
}
