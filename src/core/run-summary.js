// Run totals belong to the run, including seeded and challenge games. Career
// progression remains governed separately by the profile rules.
export function createRunSummary(){return {bestHand:0n,cardsPlayed:0,cardsDiscarded:0,cardsPurchased:0,rerolls:0};}
export function recordRunSummary(previous,next,events){
 // Older saves have no historical card totals. Preserve that uncertainty while
 // recording the best known score; do not invent totals from hand counts.
 if(!previous.runSummary)return;
 const summary=next.runSummary={...previous.runSummary};
 const add=(key,n=1)=>{summary[key]=Math.min(Number.MAX_SAFE_INTEGER,summary[key]+n);};
 for(const event of events){
  if(event.type==='hand_played'){add('cardsPlayed',event.cardIds.length);if(next.lastScore?.score>summary.bestHand)summary.bestHand=next.lastScore.score;}
  if(['cards_discarded','cards_forced_discarded'].includes(event.type))add('cardsDiscarded',event.cardIds.length);
  if(['shop_card_bought','voucher_redeemed'].includes(event.type)||event.type==='booster_opened'&&previous.phase==='shop')add('cardsPurchased');
  if(event.type==='shop_rerolled')add('rerolls');
 }
}
