const SUITS = new Set(['clubs', 'diamonds', 'hearts', 'spades']);

// Mirrors the native is_suit contract for the supported modifier slice.
// Boss selection bypasses debuffs; flush calculation lets a debuffed Wild fall
// back to its printed suit without retaining its universal-suit ability.
export function isCardSuit(card, suit, {debuffed = false, bypassDebuff = false, flushCalc = false} = {}) {
  if (!card || !SUITS.has(card.suit) || !SUITS.has(suit)) throw new TypeError('Invalid card or suit');
  if (debuffed && !bypassDebuff && !flushCalc) return false;
  if (card.enhancement === 'wild' && (!flushCalc || !debuffed)) return true;
  return card.suit === suit;
}
