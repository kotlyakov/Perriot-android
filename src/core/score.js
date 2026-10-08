import { evaluateHand } from './hands.js';
import { HANDS } from '../content/hands.js';
import { SUPPORTED_JOKERS, independentEffect } from '../content/jokers.js';

export function scoreHand(state, playedCards) {
  const hand = evaluateHand(playedCards);
  if (!state || !state.handLevels || typeof state.handLevels !== 'object' || !Array.isArray(state.jokers)) throw new TypeError('Invalid scoring state');
  const heldCards = state.hand === undefined ? [] : state.hand.map(id=>state.cards[id]);
  for (const card of [...playedCards,...heldCards]) {
    evaluateHand([card]); // Refuse unsupported held recognition/effects too.
    if ((card.edition !== undefined && card.edition !== 'base') || card.seal !== undefined || card.debuffed === true) throw new Error('Unsupported card modifier');
  }
  const jokerIds = new Set();
  for (const joker of state.jokers) {
    if (!joker || typeof joker.id !== 'string' || !joker.id || jokerIds.has(joker.id) || !SUPPORTED_JOKERS.includes(joker.entityId)) throw new Error('Invalid or unsupported joker');
    if ((joker.edition !== undefined && joker.edition !== 'base') || joker.debuffed === true) throw new Error('Unsupported joker modifier');
    jokerIds.add(joker.id);
  }
  const level = state.handLevels[hand.handId] ?? 1;
  if (!Number.isSafeInteger(level) || level < 1) throw new RangeError('Invalid hand level');
  const definition = HANDS[hand.handId];
  let chips = BigInt(definition.chips) + BigInt(level-1)*BigInt(definition.chipGain);
  let mult = BigInt(definition.mult) + BigInt(level-1)*BigInt(definition.multGain);
  const trace = [{type:'score_step',phase:'base',sourceId:`hand:${hand.handId}`,operation:'base',before:{chips:0n,mult:0n},after:{chips,mult}}];
  const scoringCardIds = state.jokers.some(j=>j.entityId==='joker_splash') ? playedCards.map(c=>c.id) : hand.scoringCardIds;
  const scoringSet = new Set(scoringCardIds);
  for (const card of playedCards) {
    if (!scoringSet.has(card.id)) continue;
    const before = {chips,mult};
    chips += BigInt(card.rank===14 ? 11 : Math.min(card.rank,10));
    trace.push({type:'score_step',phase:'scored_card',sourceId:card.id,operation:'add_chips',before,after:{chips,mult}});
  }
  const rankCounts = new Map();
  for (const card of playedCards) rankCounts.set(card.rank,(rankCounts.get(card.rank)??0)+1);
  for (const joker of state.jokers) {
    const effect = independentEffect(joker.entityId,[...rankCounts.values()]);
    if (!effect) continue;
    const before = {chips,mult};
    if (effect.operation==='add_chips') chips += effect.amount;
    else mult += effect.amount;
    trace.push({type:'score_step',phase:'independent',sourceId:joker.id,operation:effect.operation,before,after:{chips,mult}});
  }
  const score = chips*mult;
  trace.push({type:'score_total',phase:'total',chips,mult,score});
  return {...hand,scoringCardIds,chips,mult,score,trace};
}
