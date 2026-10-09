import { nextApkSeed, createApkMathState, nextApkMathRandom } from './apk-rng.js';

const SUITS = { clubs: 'C', diamonds: 'D', hearts: 'H', spades: 'S' };
const RANKS = { 10: 'T', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

// Canonical creation order for unmodified base-card identities. Original cards
// sort by persistent creation sort_id before *every* shuffle; plain52 creation
// follows ASCII prototype order C,D,H,S / 2..9,A,J,K,Q,T, not numeric rank.
// Modified/added duplicate cards need explicit persistent sort_id support and
// are deliberately outside this module's verified scope. See deck-generation.md.
export function canonicalCards(cards) {
  if (!cards || typeof cards !== 'object') throw new TypeError('Expected plain cards');
  const list = Array.isArray(cards) ? [...cards] : Object.entries(cards).map(([id, card]) => {
    if (card?.id !== id) throw new TypeError('Card registry key must match its identity');
    return card;
  });
  const seen = new Set();
  const keyed = list.map(card => {
    if (!card || !Object.hasOwn(SUITS, card.suit) || !Number.isInteger(card.rank) || card.rank < 2 || card.rank > 14 ||
        card.id !== `card_${card.suit}_${card.rank}` || seen.has(card.id)) throw new TypeError('Invalid or duplicated plain-card identity');
    seen.add(card.id);
    return { id: card.id, key: `${SUITS[card.suit]}_${RANKS[card.rank] ?? card.rank}` };
  });
  keyed.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  return keyed.map(card => card.id);
}

export function shuffleApkDeck(cards, rng, key) {
  const cardIds = canonicalCards(cards);
  const seed = nextApkSeed(rng, key);
  // Unlike pseudorandom(), pseudoshuffle() reseeds without polling a float.
  let mathState = createApkMathState(seed.value);
  for (let count = cardIds.length; count > 1; count--) {
    const next = nextApkMathRandom(mathState, count);
    mathState = next.state;
    const index = next.value - 1;
    [cardIds[count - 1], cardIds[index]] = [cardIds[index], cardIds[count - 1]];
  }
  return { cardIds, rng: { ...seed.rng, mathState } };
}

