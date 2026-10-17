import {isCardSuit} from './card-suits.js';

const SUITS = new Set(['clubs', 'diamonds', 'hearts', 'spades']);

export function evaluateHand(cards, {isCardDebuffed = () => false, fourFingers = false, shortcut = false, rankGetter} = {}) {
  if (!Array.isArray(cards) || cards.length < 1 || cards.length > 5) throw new RangeError('Select 1 to 5 cards');
  if (typeof isCardDebuffed !== 'function') throw new TypeError('Invalid card debuff predicate');
  if (typeof fourFingers !== 'boolean' || typeof shortcut !== 'boolean') throw new TypeError('Invalid recognition modifiers');
  const ids = new Set();
  const ranks = new Map();
  for (const card of cards) {
    if (!card || typeof card.id !== 'string' || card.id.length === 0 || ids.has(card.id)
      || !Number.isInteger(card.rank) || card.rank < 2 || card.rank > 14 || !SUITS.has(card.suit)) {
      throw new TypeError('Invalid or duplicate card');
    }
    if (card.enhancement !== undefined && !['base','mult','bonus','lucky','wild','steel','glass','stone','gold'].includes(card.enhancement)) throw new Error('Enhanced recognition not implemented');
    ids.add(card.id);
    if (card.enhancement === 'stone') continue;
    const group = ranks.get(card.rank) ?? [];
    group.push(card);
    ranks.set(card.rank, group);
  }
  // Native recognition evaluates fresh getters on both sides, including self
  // comparisons. A Stone getter must never be cached: collisions affect the
  // conditional extra getter even though negative ranks cannot form a group.
  if(rankGetter){
    for(const count of [5,4,3,2])for(let i=cards.length-1;i>=0;i--){
      let size=1;
      for(let j=0;j<cards.length;j++)if(rankGetter(cards[i])===rankGetter(cards[j])&&i!==j)size++;
      if(size===count)rankGetter(cards[i]);
    }
    if(cards.length>=(fourFingers?4:5))for(const card of cards)rankGetter(card);
  }
  const rankedCards=cards.filter(card=>card.enhancement!=='stone');
  if(!rankedCards.length)return {handId:'high_card',scoringCardIds:[cards[0].id],isRoyal:false};
  const groups = [...ranks.values()].sort((a, b) => b.length - a.length);
  const unique = [...ranks.keys()].sort((a, b) => a - b);
  const required = fourFingers ? 4 : 5;
  let flushCards = [], straightCards = [];
  if (cards.length >= required) {
    // Native get_flush returns the first qualifying suit, including all of its cards.
    for (const suit of ['spades','hearts','clubs','diamonds']) {
      const suited = cards.filter(card => isCardSuit(card,suit,{debuffed:isCardDebuffed(card),flushCalc:true}));
      if (suited.length >= required) { flushCards = suited; break; }
    }
    let length = 0, found = false, skipped = false;
    for (let rank = 1; rank <= 14; rank++) {
      const group = ranks.get(rank === 1 ? 14 : rank);
      if (group) {
        length++; skipped = false; straightCards.push(...group);
      } else if (shortcut && !skipped && rank !== 14) {
        skipped = true;
      } else {
        length = 0; skipped = false;
        if (found) break;
        straightCards = [];
      }
      if (length >= required) found = true;
    }
    if (!found) straightCards = [];
  }
  const flush = flushCards.length > 0, straight = straightCards.length > 0;
  const five = groups[0].length === 5;
  const fullHouse = groups[0].length === 3 && groups[1]?.length === 2;
  let handId;
  let scoring = cards;
  if (flush && five) handId = 'flush_five';
  else if (flush && fullHouse) handId = 'flush_house';
  else if (five) handId = 'five_of_a_kind';
  else if (flush && straight) { handId = 'straight_flush'; scoring = [...flushCards, ...straightCards]; }
  else if (groups[0].length === 4) { handId = 'four_of_a_kind'; scoring = groups[0]; }
  else if (fullHouse) handId = 'full_house';
  else if (flush) { handId = 'flush'; scoring = flushCards; }
  else if (straight) { handId = 'straight'; scoring = straightCards; }
  else if (groups[0].length === 3) { handId = 'three_of_a_kind'; scoring = groups[0]; }
  else if (groups[0].length === 2 && groups[1]?.length === 2) { handId = 'two_pair'; scoring = [...groups[0], ...groups[1]]; }
  else if (groups[0].length === 2) { handId = 'pair'; scoring = groups[0]; }
  else { handId = 'high_card'; scoring = [rankedCards.find(card => card.rank === unique.at(-1))]; }
  const scoredIds = new Set(scoring.map(card => card.id));
  return {
    handId,
    scoringCardIds: cards.filter(card => scoredIds.has(card.id)).map(card => card.id),
    isRoyal: handId === 'straight_flush' && scoring.every(card => card.rank >= 10),
  };
}

