import {isCardSuit} from './card-suits.js';

const SUITS = new Set(['clubs', 'diamonds', 'hearts', 'spades']);

// Base-card recognition. Effects that alter recognition are added separately.
export function evaluateHand(cards, {isCardDebuffed = () => false} = {}) {
  if (!Array.isArray(cards) || cards.length < 1 || cards.length > 5) throw new RangeError('Select 1 to 5 cards');
  if (typeof isCardDebuffed !== 'function') throw new TypeError('Invalid card debuff predicate');
  const ids = new Set();
  const ranks = new Map();
  for (const card of cards) {
    if (!card || typeof card.id !== 'string' || card.id.length === 0 || ids.has(card.id)
      || !Number.isInteger(card.rank) || card.rank < 2 || card.rank > 14 || !SUITS.has(card.suit)) {
      throw new TypeError('Invalid or duplicate card');
    }
    if (card.enhancement !== undefined && !['base','mult','bonus','lucky','wild','steel','glass'].includes(card.enhancement)) throw new Error('Enhanced recognition not implemented');
    ids.add(card.id);
    const group = ranks.get(card.rank) ?? [];
    group.push(card);
    ranks.set(card.rank, group);
  }
  const groups = [...ranks.values()].sort((a, b) => b.length - a.length);
  const unique = [...ranks.keys()].sort((a, b) => a - b);
  const flush = cards.length === 5 && [...SUITS].some(suit => cards.every(card => isCardSuit(card,suit,{debuffed:isCardDebuffed(card),flushCalc:true})));
  const straight = unique.length === 5 && (unique[4] - unique[0] === 4
    || unique.join(',') === '2,3,4,5,14');
  const five = groups[0].length === 5;
  const fullHouse = groups[0].length === 3 && groups[1]?.length === 2;
  let handId;
  let scoring = cards;
  if (flush && five) handId = 'flush_five';
  else if (flush && fullHouse) handId = 'flush_house';
  else if (five) handId = 'five_of_a_kind';
  else if (flush && straight) handId = 'straight_flush';
  else if (groups[0].length === 4) { handId = 'four_of_a_kind'; scoring = groups[0]; }
  else if (fullHouse) handId = 'full_house';
  else if (flush) handId = 'flush';
  else if (straight) handId = 'straight';
  else if (groups[0].length === 3) { handId = 'three_of_a_kind'; scoring = groups[0]; }
  else if (groups[0].length === 2 && groups[1]?.length === 2) { handId = 'two_pair'; scoring = [...groups[0], ...groups[1]]; }
  else if (groups[0].length === 2) { handId = 'pair'; scoring = groups[0]; }
  else { handId = 'high_card'; scoring = [cards.find(card => card.rank === unique.at(-1))]; }
  const scoredIds = new Set(scoring.map(card => card.id));
  return {
    handId,
    scoringCardIds: cards.filter(card => scoredIds.has(card.id)).map(card => card.id),
    isRoyal: handId === 'straight_flush' && unique[0] === 10 && unique[4] === 14,
  };
}

