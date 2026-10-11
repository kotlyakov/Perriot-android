import {isBossCardDebuffed,isBossHandDebuffed} from './boss-effects.js';
import { evaluateHand } from './hands.js';
import { HANDS } from '../content/hands.js';
import { SUPPORTED_JOKERS, independentEffect, originalJokerKey, supportsJoker, scoredJokerEffects } from '../content/jokers.js';
import {nextApkRandom} from './apk-rng.js';
import {randomInt} from './rng.js';

export function scoreHand(state, playedCards) {
  const hand = evaluateHand(playedCards,{isCardDebuffed:card=>isBossCardDebuffed(state,card)});
  if (!state || !state.handLevels || typeof state.handLevels !== 'object' || !Array.isArray(state.jokers)) throw new TypeError('Invalid scoring state');
  const heldCards = state.hand === undefined ? [] : state.hand.map(id=>state.cards[id]);
  for (const card of [...playedCards,...heldCards]) {
    evaluateHand([card]); // Refuse unsupported held recognition/effects too.
    if ((card.edition !== undefined && card.edition !== 'base') || card.seal !== undefined || card.debuffed === true) throw new Error('Unsupported card modifier');
  }
  const jokerIds = new Set();
  for (const joker of state.jokers) {
    if (!joker || typeof joker.id !== 'string' || !joker.id || jokerIds.has(joker.id) || !SUPPORTED_JOKERS.includes(joker.entityId)) throw new Error('Invalid or unsupported joker');
    if (!supportsJoker(joker)) throw new Error('Unsupported joker modifier');
    jokerIds.add(joker.id);
  }
  if(isBossHandDebuffed(state,playedCards,hand.handId))return {...hand,playedCardIds:playedCards.map(c=>c.id),scoringCardIds:[],handDebuffed:true,chips:0n,mult:0n,score:0n,trace:[
    {type:'score_step',phase:'base',sourceId:`hand:${hand.handId}`,operation:'base',before:{chips:0n,mult:0n},after:{chips:0n,mult:0n}},
    {type:'score_total',phase:'total',chips:0n,mult:0n,score:0n}]};
  const level = state.handLevels[hand.handId] ?? 1;
  if (!Number.isSafeInteger(level) || level < 1) throw new RangeError('Invalid hand level');
  const definition = HANDS[hand.handId];
  let chips = BigInt(definition.chips) + BigInt(level-1)*BigInt(definition.chipGain);
  let mult = BigInt(definition.mult) + BigInt(level-1)*BigInt(definition.multGain);
  if(state.bossState?.id==='bl_flint'){
    chips=(chips+1n)/2n;
    mult=(mult+1n)/2n;
    if(mult<1n)mult=1n;
  }
  const trace = [{type:'score_step',phase:'base',sourceId:`hand:${hand.handId}`,operation:'base',before:{chips:0n,mult:0n},after:{chips,mult}}];
  const scoringCardIds = state.jokers.some(j=>originalJokerKey(j.entityId)==='j_splash') ? playedCards.map(c=>c.id) : hand.scoringCardIds;
  const scoringSet = new Set(scoringCardIds);
  let luckyRng,luckyRngBefore,luckyKind;const luckyRolls=[];
  const luckySnapshot=rng=>({lucky_mult:rng.streams.lucky_mult??null,lucky_money:rng.streams.lucky_money??null});
  function luckyRoll(key,bound){
    if(!luckyRng){
      if(state.rng?.apk){luckyKind='apk';luckyRng=state.rng.apk;}
      else if(state.rng?.effects){luckyKind='effects';luckyRng=state.rng.effects;}
      else throw new TypeError('Missing Lucky Card RNG');
      luckyRngBefore=luckyKind==='apk'?luckySnapshot(luckyRng):structuredClone(luckyRng);
    }
    if(luckyKind==='apk'){const draw=nextApkRandom(luckyRng,key);luckyRng=draw.rng;return draw.value;}
    const draw=randomInt(luckyRng,bound);luckyRng=draw.rng;return draw.value/bound;
  }
  function apply(effect,phase,sourceId,effectSourceId){
    const before={chips,mult};
    if(effect.operation==='add_chips')chips+=effect.amount;
    else if(effect.operation==='multiply_mult')mult*=effect.amount;
    else mult+=effect.amount;
    trace.push({type:'score_step',phase,sourceId,operation:effect.operation,before,after:{chips,mult},...(effectSourceId?{effectSourceId}:{})});
  }
  for (const card of playedCards) {
    if (!scoringSet.has(card.id) || isBossCardDebuffed(state,card)) continue;
    const before = {chips,mult};
    chips += BigInt(card.rank===14 ? 11 : Math.min(card.rank,10));
    trace.push({type:'score_step',phase:'scored_card',sourceId:card.id,operation:'add_chips',before,after:{chips,mult}});
    if(card.enhancement==='bonus')apply({operation:'add_chips',amount:30n},'scored_card',card.id);
    if(card.enhancement==='mult')apply({operation:'add_mult',amount:4n},'scored_card',card.id);
    if(card.enhancement==='lucky'){
      const multRoll=luckyRoll('lucky_mult',5),multTriggered=multRoll<1/5;if(multTriggered)apply({operation:'add_mult',amount:20n},'scored_card',card.id);
      const moneyRoll=luckyRoll('lucky_money',15),moneyTriggered=moneyRoll<1/15;if(moneyTriggered)trace.push({type:'score_money',phase:'scored_card',sourceId:card.id,amount:20n});
      luckyRolls.push({cardId:card.id,multRoll,moneyRoll,multTriggered,moneyTriggered});
    }
    for(const joker of state.jokers)for(const effect of scoredJokerEffects(joker.entityId,card))apply(effect,'scored_card',card.id,joker.id);
  }
  const rankCounts = new Map();
  for (const card of playedCards) rankCounts.set(card.rank,(rankCounts.get(card.rank)??0)+1);
  for (const joker of state.jokers) {
    if(joker.edition==='foil')apply({operation:'add_chips',amount:50n},'edition',joker.id);
    if(joker.edition==='holographic')apply({operation:'add_mult',amount:10n},'edition',joker.id);
    const effect=independentEffect(joker.entityId,[...rankCounts.values()],{playedCards,handId:hand.handId,jokerCount:state.jokers.length});
    if(effect)apply(effect,'independent',joker.id);
  }
  const score = chips*mult;
  trace.push({type:'score_total',phase:'total',chips,mult,score});
  return {...hand,playedCardIds:playedCards.map(c=>c.id),scoringCardIds,chips,mult,score,trace,...(luckyRolls.length?{luckyRolls,luckyRngKind:luckyKind,luckyRngBefore,luckyRngAfter:luckyKind==='apk'?{...luckySnapshot(luckyRng),mathState:[...luckyRng.mathState]}:luckyRng}:{})};
}


