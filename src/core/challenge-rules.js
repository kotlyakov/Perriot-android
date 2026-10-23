import {CHALLENGE_BY_ID} from '../content/challenges.js';
export const challengeFor=state=>state?.challengeId?CHALLENGE_BY_ID[state.challengeId]:null;
export const challengeHands=state=>challengeFor(state)?.hands??4;
export const challengeDiscards=state=>challengeFor(state)?.discards??3;
export const challengeHandSize=state=>challengeFor(state)?.handSize??8;
export const challengeBossBans=state=>challengeFor(state)?.bannedBossIds??[];
export const challengeTagBans=state=>challengeFor(state)?.bannedTagIds??[];
export const challengeJokerLimit=state=>challengeFor(state)?.jokerSlots??5;
export const challengeReward=(state,id,base)=>{
 const m=challengeFor(state)?.modifiers??{};
 return m.noReward||m.noSmallReward&&id==='small'||m.noBigReward&&id==='big'?0n:base;
};
export const challengeHandMoney=state=>!challengeFor(state)?.modifiers?.noHandMoney;
export const challengeInterest=state=>!challengeFor(state)?.modifiers?.noInterest;
export function challengeShopContext(state){
 const challenge=challengeFor(state),ctx=state.apkShop.context;
 if(!challenge)return ctx;
 const m=challenge.modifiers??{};
 return {...ctx,bannedCentreIds:[...new Set([...ctx.bannedCentreIds,...(challenge.bannedCentreIds??[])])],
  modifiers:{...ctx.modifiers,...(m.allEternal?{all_eternal:true}:{})},
  rates:{...ctx.rates,...(m.noShopJokers?{Joker:0}:{})}};
}
