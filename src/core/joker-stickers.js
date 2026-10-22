import catalogue from '../content/apk-shop-catalog.js';
import {item7CapacityDeltas} from './joker-item7-lifecycle.js';
import {changeHandSize} from './hand-size.js';

const centres=new Map(catalogue.centres.filter(c=>c.set==='Joker').map(c=>[c.key,c]));
const aliases={joker_joker:'j_joker',joker_sly_joker:'j_sly',joker_clever_joker:'j_clever',joker_splash:'j_splash'};
export function validJokerStickers(card){
 if(!card||typeof card!=='object'||Array.isArray(card))return false;
 for(const key of ['eternal','perishable','rental'])if(Object.hasOwn(card,key)&&typeof card[key]!=='boolean')return false;
 const centre=centres.get(aliases[card.entityId]??card.entityId);
 if(card.eternal&&(!centre?.eternal_compat||card.perishable))return false;
 if(card.perishable)return !!centre?.perishable_compat&&Number.isSafeInteger(card.perishRounds)&&card.perishRounds>=0&&card.perishRounds<=5;
 return !Object.hasOwn(card,'perishRounds')&&(!card.rental||!!centre);
}
export const isPerished=card=>card?.perishable===true&&card.perishRounds===0;

// Native set_debuff refuses to revive an expired Perishable, including when
// Crimson Heart is disabled, chooses a different card, or leaves the boss.
export function setJokerBossDebuff(card,debuffed){
 if(!card||typeof card!=='object'||typeof debuffed!=='boolean')throw new TypeError('Invalid Joker debuff');
 card.debuffed=debuffed||isPerished(card);return card.debuffed;
}

// Pass {jokers:[joker]} immediately after its native end_of_round effect to
// preserve interleaving. The explicit list may include a Joker whose queued
// native removal the reducer has already applied; that round's rent is owed.
export function applyJokerStickerEndRound(state,events=[],{jokers=state?.jokers}={}){
 if(!state||!Array.isArray(state.jokers)||!state.round||typeof state.money!=='bigint'||!Array.isArray(events)||!Array.isArray(jokers)||
   jokers.some(j=>!validJokerStickers(j)||typeof j.id!=='string'||!j.id)||new Set(jokers.map(j=>j.id)).size!==jokers.length)throw new TypeError('Invalid Joker sticker state');
 for(const joker of jokers){
  if(joker.rental){
   const before=state.money;state.money-=3n;
   events.push({type:'joker_rental_paid',sourceId:joker.id,amount:3n},{type:'money_changed',sourceId:joker.id,before,after:state.money,delta:-3n});
  }
  if(joker.perishable&&joker.perishRounds>0){
   const before=joker.perishRounds,beforeCapacity=item7CapacityDeltas(state.jokers);
   joker.perishRounds--;
   events.push({type:'joker_counter_changed',sourceId:joker.id,counter:'perishRounds',before,after:joker.perishRounds});
   if(joker.perishRounds===0){
    setJokerBossDebuff(joker,true);events.push({type:'joker_expired',sourceId:joker.id});
    const afterCapacity=item7CapacityDeltas(state.jokers),handSize=afterCapacity.handSize-beforeCapacity.handSize,discards=afterCapacity.discards-beforeCapacity.discards;
    changeHandSize(state,handSize);
    state.round.discardsRemaining=Math.max(0,state.round.discardsRemaining+discards);
    if(handSize||discards)events.push({type:'joker_capacity_changed',handSize,discards});
   }
  }
 }
}
