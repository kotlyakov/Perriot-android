import {applyEndRoundCardEffects} from './card-effects.js';
import {getJokerCashoutBonuses} from './joker-cashout.js';
import {canEnterBoss,isBossCardDebuffed,needleRestorationAfterEarning} from './boss-effects.js';
import {APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
// Interest snapshots money before this payout.
export function getCashout(state) {
 if(state?.phase!=='round_won' || !['small','big','boss'].includes(state.round?.blindId) || !['red','blue'].includes(state.deckId) || typeof state.money!=='bigint' ||
    !Number.isSafeInteger(state.round.handsRemaining) || state.round.handsRemaining<0 || state.round.handsRemaining>(state.deckId==='blue'?5:4) ||
    typeof state.round.score!=='bigint' || typeof state.round.target!=='bigint' || state.round.target<=0n || state.round.score<state.round.target)throw new TypeError('Invalid cashout state');
 if(state.round.blindId==='boss' && (!state.bossState || state.bossState.id!==state.apkBlinds?.bossId || !canEnterBoss(state)))throw new TypeError('Invalid boss payout');
 const reward=state.round.blindId==='boss'?BigInt(APK_BLINDS_BY_ID[state.bossState.id].dollars):state.round.blindId==='big'?4n:3n;
 const hands=BigInt(state.round.handsRemaining);
 if(state.cashoutQuote){
  const snapshot=state.cashoutQuote,q=snapshot.quote,context=snapshot.bonusContext;
  const earnedHands=Object.hasOwn(snapshot,'handsRemainingBefore')?snapshot.handsRemainingBefore:Number(q?.hands);
  if(Object.keys(snapshot).some(key=>!['moneyBefore','handsRemainingBefore','earnedRevision','bonusContext','quote'].includes(key)))throw new TypeError('Invalid cashout snapshot fields');
  if(!Number.isSafeInteger(earnedHands)||earnedHands<0||earnedHands>(state.deckId==='blue'?5:4))throw new TypeError('Invalid earned hand counter');
  if(!Number.isSafeInteger(snapshot.earnedRevision)||snapshot.earnedRevision<0||snapshot.earnedRevision>state.revision||!context||!Array.isArray(context.sources)||context.sources.length>10000||new Set(context.sources.map(row=>row?.id)).size!==context.sources.length||context.sources.some(row=>!row||typeof row.id!=='string'||!row.id||!['j_golden','j_cloud_9'].includes(row.entityId))||!Array.isArray(context.nineCardIds)||new Set(context.nineCardIds).size!==context.nineCardIds.length||context.nineCardIds.some(id=>!Object.hasOwn(state.cards,id)&&!state.destroyedCardIds?.includes(id)))throw new TypeError('Invalid bonus provenance');
  let expectedHands=state.round.handsRemaining;
  if(state.bossState?.id==='bl_needle'&&state.bossState.disabled)expectedHands-=needleRestorationAfterEarning(state,snapshot.earnedRevision);
  if(earnedHands!==expectedHands)throw new TypeError('Invalid earned hand provenance');
  const expectedRows=context.sources.map(row=>({sourceId:row.id,entityId:row.entityId,amount:row.entityId==='j_golden'?4n:BigInt(context.nineCardIds.length)})).filter(row=>row.amount>0n);
  // Acknowledgement adds one revision while retaining the completed score and quote.
  const acknowledged=state.winNotified&&!state.winPending&&state.round.blindId==='boss'&&state.round.ante===(state.winAnte??8);
  if(acknowledged&&snapshot.earnedRevision===state.revision)throw new TypeError('Missing acknowledgement revision');
  if(state.lastScore&&snapshot.earnedRevision!==state.revision-(acknowledged?1:0))throw new TypeError('Invalid earning revision');
  if(state.revision===snapshot.earnedRevision||acknowledged&&state.revision===snapshot.earnedRevision+1){
   const current=cashoutBonusContext(state);
   if(state.round.handsRemaining!==earnedHands||state.money!==snapshot.moneyBefore||context.sources.length!==current.sources.length||context.sources.some((row,i)=>row.id!==current.sources[i].id||row.entityId!==current.sources[i].entityId)||context.nineCardIds.length!==current.nineCardIds.length||context.nineCardIds.some((id,i)=>id!==current.nineCardIds[i]))throw new TypeError('Invalid fresh cashout context');
  }
  const earned=typeof snapshot.moneyBefore==='bigint'&&snapshot.moneyBefore>0n?snapshot.moneyBefore/5n:0n;
  const interest=earned>5n?5n:earned,rows=q?.jokerBonuses??[];
  if(typeof snapshot.moneyBefore!=='bigint'||!q||q.reward!==reward||q.hands!==BigInt(earnedHands)||q.interest!==interest||typeof q.total!=='bigint'||!Array.isArray(rows)||rows.length>10000||new Set(rows.map(row=>row?.sourceId)).size!==rows.length||rows.some(row=>!row||typeof row.sourceId!=='string'||!row.sourceId||typeof row.amount!=='bigint'||row.amount<=0n||!(row.entityId==='j_golden'&&row.amount===4n||row.entityId==='j_cloud_9'&&row.amount<=10000n))||rows.length!==expectedRows.length||rows.some((row,i)=>row.sourceId!==expectedRows[i].sourceId||row.entityId!==expectedRows[i].entityId||row.amount!==expectedRows[i].amount)||q.total!==reward+BigInt(earnedHands)+interest+rows.reduce((sum,row)=>sum+row.amount,0n))throw new TypeError('Invalid cashout snapshot');
  return structuredClone(q);
 }
 const earned=state.money>0n?state.money/5n:0n,interest=earned>5n?5n:earned;
 const jokerBonuses=getJokerCashoutBonuses(state),bonus=jokerBonuses.reduce((total,row)=>total+row.amount,0n);
 return {reward,hands,interest,total:reward+hands+interest+bonus,...(jokerBonuses.length?{jokerBonuses}:{})};
}



function cashoutBonusContext(state){
 const sources=state.jokers.filter(j=>!j.debuffed&&['j_golden','j_cloud_9'].includes(j.entityId)).map(j=>({id:j.id,entityId:j.entityId}));
 const nineCardIds=sources.some(j=>j.entityId==='j_cloud_9')?Object.values(state.cards).filter(c=>c.rank===9&&c.enhancement!=='stone').map(c=>c.id).sort():[];
 return {sources,nineCardIds};
}
export function captureCashoutQuote(state,earnedRevision=state.revision){return {moneyBefore:state.money,handsRemainingBefore:state.round.handsRemaining,earnedRevision,bonusContext:cashoutBonusContext(state),quote:getCashout(state)};}

// Both scoring and a lowered disabled-boss target settle through the same path.
export function settleRoundSuccess(state,events){
 if(state.phase!=='playing'||!(state.round.score>=state.round.target))return false;
 if(state.runStats)state.runStats.unusedDiscards+=state.round.discardsRemaining;
 applyEndRoundCardEffects(state,events);
 state.phase='round_won';state.cashoutQuote=captureCashoutQuote(state,state.revision+1);events.push({type:'round_won',score:state.round.score});
 if(state.round.blindId==='boss'&&state.round.ante===(state.winAnte??8)){
  state.won=true;
  if(!state.winNotified){state.winNotified=true;state.winPending=true;events.push({type:'victory_pending'});}
 }
 return true;
}
