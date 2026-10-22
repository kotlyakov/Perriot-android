import {applyRoundEndJokers} from './round-end-jokers.js';
import {blindReward} from './stakes.js';
import {DECKS} from '../content/decks.js';
import {addItem7DoubleTag} from './joker-double-tags.js';
import {voucherModifiers} from './vouchers.js';
import {getTagInvestmentBonus,applyTagRoundEnd} from './tag-effects.js';
import {applyItem7EndRound,resetItem7RoundTargets} from './joker-item7-lifecycle.js';
import {applyItem7EconomyContext} from './joker-item7-economy.js';
import {applyEndRoundCardEffects} from './card-effects.js';
import {getJokerCashoutBonuses} from './joker-cashout.js';
import {canEnterBoss,isBossCardDebuffed,needleRestorationAfterEarning} from './boss-effects.js';
import {APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
// Interest snapshots money before this payout.
export function getCashout(state) {
 if(state?.phase!=='round_won' || !['small','big','boss'].includes(state.round?.blindId) || !Object.hasOwn(DECKS,state.deckId) || typeof state.money!=='bigint' ||
    !Number.isSafeInteger(state.round.handsRemaining) || state.round.handsRemaining<0 || state.round.handsRemaining>10000 ||
    typeof state.round.score!=='bigint' || typeof state.round.target!=='bigint' || state.round.target<=0n || (state.round.score<state.round.target&&!(state.round.savedByBones===true&&state.round.score*4n>=state.round.target)))throw new TypeError('Invalid cashout state');
 if(state.round.blindId==='boss' && (!state.bossState || state.bossState.id!==state.apkBlinds?.bossId || !canEnterBoss(state)))throw new TypeError('Invalid boss payout');
 const reward=blindReward(state);
 const green=state.deckId==='green',hands=BigInt(state.round.handsRemaining),handReward=hands*(green?2n:1n),discards=green?BigInt(state.round.discardsRemaining):0n;
 if(state.cashoutQuote){
  const snapshot=state.cashoutQuote,q=snapshot.quote,context=snapshot.bonusContext;
  const earnedHands=Object.hasOwn(snapshot,'handsRemainingBefore')?snapshot.handsRemainingBefore:Number(q?.hands);
  if(Object.keys(snapshot).some(key=>!['moneyBefore','handsRemainingBefore','discardsRemainingBefore','earnedRevision','bonusContext','quote'].includes(key)))throw new TypeError('Invalid cashout snapshot fields');
  if(!Number.isSafeInteger(earnedHands)||earnedHands<0||earnedHands>10000)throw new TypeError('Invalid earned hand counter');
  if(!Number.isSafeInteger(snapshot.earnedRevision)||snapshot.earnedRevision<0||snapshot.earnedRevision>state.revision||!context||!Array.isArray(context.sources)||context.sources.length>10000||new Set(context.sources.map(row=>row?.id)).size!==context.sources.length||context.sources.some(row=>!row||typeof row.id!=='string'||!row.id||!BONUS_KEYS.includes(row.entityId))||!Array.isArray(context.nineCardIds)||new Set(context.nineCardIds).size!==context.nineCardIds.length||context.nineCardIds.some(id=>!Object.hasOwn(state.cards,id)&&!state.destroyedCardIds?.includes(id)))throw new TypeError('Invalid bonus provenance');
  let expectedHands=state.round.handsRemaining;
  if(state.bossState?.id==='bl_needle'&&state.bossState.disabled)expectedHands-=needleRestorationAfterEarning(state,snapshot.earnedRevision);
  if(earnedHands!==expectedHands)throw new TypeError('Invalid earned hand provenance');
  const earnedDiscards=green?snapshot.discardsRemainingBefore:0;
  if(green&&(!Number.isSafeInteger(earnedDiscards)||earnedDiscards<0||earnedDiscards>10000))throw new TypeError('Invalid earned discard provenance');
  validateItem7Context(context);
  const expectedRows=expectedBonusRows(context);
  // Acknowledgement adds one revision while retaining the completed score and quote.
  const acknowledged=state.winNotified&&!state.winPending&&state.round.blindId==='boss'&&state.round.ante===(state.winAnte??8);
  if(acknowledged&&snapshot.earnedRevision===state.revision)throw new TypeError('Missing acknowledgement revision');
  if(state.lastScore&&snapshot.earnedRevision!==state.revision-(acknowledged?1:0))throw new TypeError('Invalid earning revision');
  if(state.revision===snapshot.earnedRevision||acknowledged&&state.revision===snapshot.earnedRevision+1){
   const current=cashoutBonusContext(state);
   if(state.round.handsRemaining!==earnedHands||green&&state.round.discardsRemaining!==earnedDiscards||state.money!==snapshot.moneyBefore||context.sources.length!==current.sources.length||context.sources.some((row,i)=>row.id!==current.sources[i].id||row.entityId!==current.sources[i].entityId)||context.nineCardIds.length!==current.nineCardIds.length||context.nineCardIds.some((id,i)=>id!==current.nineCardIds[i])||JSON.stringify(context.item7??null)!==JSON.stringify(current.item7??null))throw new TypeError('Invalid fresh cashout context');
  }
  const earned=typeof snapshot.moneyBefore==='bigint'&&snapshot.moneyBefore>0n?snapshot.moneyBefore/5n:0n;
  const interest=green?0n:(earned>voucherModifiers(state).interestCap?voucherModifiers(state).interestCap:earned)*BigInt(1+(context.item7?.moonIds.length??0)),rows=q?.jokerBonuses??[];
  if(typeof snapshot.moneyBefore!=='bigint'||!q||q.reward!==reward||q.hands!==BigInt(earnedHands)||q.interest!==interest||green&&(q.handReward!==BigInt(earnedHands)*2n||q.discards!==BigInt(earnedDiscards))||!green&&(Object.hasOwn(q,'handReward')||Object.hasOwn(q,'discards'))||(q.tagReward??0n)!==getTagInvestmentBonus(state)||typeof q.total!=='bigint'||!Array.isArray(rows)||rows.length>10000||new Set(rows.map(row=>row?.sourceId)).size!==rows.length||rows.some(row=>!row||typeof row.sourceId!=='string'||!row.sourceId||typeof row.amount!=='bigint'||row.amount<=0n||!BONUS_KEYS.includes(row.entityId))||rows.length!==expectedRows.length||rows.some((row,i)=>row.sourceId!==expectedRows[i].sourceId||row.entityId!==expectedRows[i].entityId||row.amount!==expectedRows[i].amount)||q.total!==reward+BigInt(earnedHands)*(green?2n:1n)+BigInt(earnedDiscards)+interest+(q.tagReward??0n)+rows.reduce((sum,row)=>sum+row.amount,0n))throw new TypeError('Invalid cashout snapshot');
  return structuredClone(q);
 }
 const earned=state.money>0n?state.money/5n:0n,interest=green?0n:(earned>voucherModifiers(state).interestCap?voucherModifiers(state).interestCap:earned)*BigInt(1+state.jokers.filter(j=>!j.debuffed&&j.entityId==='j_to_the_moon').length);
 const jokerBonuses=getJokerCashoutBonuses(state),bonus=jokerBonuses.reduce((total,row)=>total+row.amount,0n);
 const tagReward=getTagInvestmentBonus(state);
 return {reward,hands,...(green?{handReward,discards}:{}),interest,total:reward+handReward+discards+interest+bonus+tagReward,...(tagReward?{tagReward}:{}),...(jokerBonuses.length?{jokerBonuses}:{})};
}



const BONUS_KEYS=['j_golden','j_cloud_9','j_rocket','j_satellite','j_delayed_grat'];
const ITEM7_BONUS_KEYS=['j_rocket','j_satellite','j_delayed_grat','j_to_the_moon'];
function cashoutBonusContext(state){
 const active=state.jokers.filter(j=>!j.debuffed);
 const sources=active.filter(j=>BONUS_KEYS.includes(j.entityId)).map(j=>({id:j.id,entityId:j.entityId}));
 const nineCardIds=sources.some(j=>j.entityId==='j_cloud_9')?Object.values(state.cards).filter(c=>c.rank===9&&c.enhancement!=='stone').map(c=>c.id).sort():[];
 const item7=active.some(j=>ITEM7_BONUS_KEYS.includes(j.entityId))?{
  rocketValues:active.filter(j=>j.entityId==='j_rocket').map(j=>({sourceId:j.id,amount:(j.rocketDollars??1n).toString()})),
  planetIds:Object.keys(state.consumableUsage??{}).filter(id=>state.consumableUsage[id].set==='Planet').sort(),
  discardsUsed:state.round.discardsUsed??0,discardsRemaining:state.round.discardsRemaining,
  moonIds:active.filter(j=>j.entityId==='j_to_the_moon').map(j=>j.id),
 }:null;
 return {sources,nineCardIds,...(item7?{item7}:{})};
}
function validateItem7Context(context){
 if(Object.keys(context).some(k=>!['sources','nineCardIds','item7'].includes(k)))throw new TypeError('Invalid bonus context fields');
 const data=context.item7;
 if(!data){if(context.sources.some(row=>ITEM7_BONUS_KEYS.includes(row.entityId)))throw new TypeError('Missing item7 bonus provenance');return;}
 if(typeof data!=='object'||Array.isArray(data)||Object.keys(data).sort().join(',')!=='discardsRemaining,discardsUsed,moonIds,planetIds,rocketValues'||!Number.isSafeInteger(data.discardsUsed)||data.discardsUsed<0||!Number.isSafeInteger(data.discardsRemaining)||data.discardsRemaining<0||data.discardsRemaining>10000)throw new TypeError('Invalid item7 bonus provenance');
 for(const list of [data.planetIds,data.moonIds])if(!Array.isArray(list)||list.length>10000||list.some(id=>typeof id!=='string'||!id)||new Set(list).size!==list.length)throw new TypeError('Invalid item7 bonus IDs');
 const rockets=context.sources.filter(row=>row.entityId==='j_rocket');
 if(!Array.isArray(data.rocketValues)||data.rocketValues.length!==rockets.length||data.rocketValues.some((row,i)=>!row||Object.keys(row).sort().join(',')!=='amount,sourceId'||row.sourceId!==rockets[i].id||typeof row.amount!=='string'||!/^[1-9][0-9]*$/.test(row.amount)))throw new TypeError('Invalid Rocket provenance');
}
function expectedBonusRows(context){return context.sources.map(row=>{
 let amount=0n;
 if(row.entityId==='j_golden')amount=4n;
 if(row.entityId==='j_cloud_9')amount=BigInt(context.nineCardIds.length);
 if(row.entityId==='j_rocket')amount=BigInt(context.item7.rocketValues.find(value=>value.sourceId===row.id).amount);
 if(row.entityId==='j_satellite')amount=BigInt(context.item7.planetIds.length);
 if(row.entityId==='j_delayed_grat'&&context.item7.discardsUsed===0)amount=2n*BigInt(context.item7.discardsRemaining);
 return {sourceId:row.id,entityId:row.entityId,amount};
}).filter(row=>row.amount>0n);}
export function captureCashoutQuote(state,earnedRevision=state.revision){return {moneyBefore:state.money,handsRemainingBefore:state.round.handsRemaining,...(state.deckId==='green'?{discardsRemainingBefore:state.round.discardsRemaining}:{}),earnedRevision,bonusContext:cashoutBonusContext(state),quote:getCashout(state)};}

// Both scoring and a lowered disabled-boss target settle through the same path.
export function settleRoundSuccess(state,events,{saved=false,endRoundApplied=false}={}){
 if(state.phase!=='playing'||!(state.round.score>=state.round.target||saved&&state.round.score*4n>=state.round.target))return false;
 if(saved)state.round.savedByBones=true;
 if(state.runStats)state.runStats.unusedDiscards+=state.round.discardsRemaining;
 if(!endRoundApplied){
  applyRoundEndJokers(state,events);
 }
 applyEndRoundCardEffects(state,events);
 if(state.rng?.apk)resetItem7RoundTargets(state);
 applyTagRoundEnd(state,events);if(state.deckId==='anaglyph'&&state.round.blindId==='boss')addItem7DoubleTag(state,events);state.phase='round_won';state.cashoutQuote=captureCashoutQuote(state,state.revision+1);events.push({type:'round_won',score:state.round.score});
 if(state.round.blindId==='boss'&&state.round.ante===(state.winAnte??8)){
  state.won=true;
  if(!state.winNotified){state.winNotified=true;state.winPending=true;events.push({type:'victory_pending'});}
 }
 return true;
}
