import {validPlayingCardModifiers} from './playing-card-modifiers.js';
import { nextApkSeed, createApkMathState, nextApkMathRandom } from './apk-rng.js';

const SUITS = { clubs: 'C', diamonds: 'D', hearts: 'H', spades: 'S' };
const RANKS = { 10: 'T', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
export const APK_BASE_CARD_IDS=Object.freeze(Object.keys(SUITS).flatMap(suit=>Array.from({length:13},(_,index)=>`card_${suit}_${index+2}`)));
const prototypeKey=id=>{const match=/^card_(clubs|diamonds|hearts|spades)_(\d+)$/.exec(id);return `${SUITS[match[1]]}_${RANKS[match[2]]??match[2]}`;};
const baseOrder=new Map([...APK_BASE_CARD_IDS].sort((a,b)=>prototypeKey(a)<prototypeKey(b)?-1:1).map((id,index)=>[id,index+1]));

// Reserved physical identities encode their ordinal as well as recording it on
// new cards. Original IDs recover their immutable order without rewriting v1 saves.
export function playingCardOrdinal(id) {
  if(baseOrder.has(id))return baseOrder.get(id);
  const match=typeof id==='string'&&/^card_created_([1-9]\d*)$/.exec(id),ordinal=match?Number(match[1]):NaN;
  if(!Number.isSafeInteger(ordinal)||ordinal<=52)throw new TypeError('Unknown physical card identity');
  return ordinal;
}

export function identityCard(id) {
  const ordinal=playingCardOrdinal(id);
  return {id,rank:2,suit:'clubs',...(ordinal>52?{creationOrdinal:ordinal}:{})};
}

export function validatePlayingCardIdentities(state) {
  const cards=Object.values(state.cards),destroyed=state.destroyedCardIds??[];
  canonicalCards(state.cards);
  if(!Array.isArray(destroyed)||new Set(destroyed).size!==destroyed.length||destroyed.some(id=>Object.hasOwn(state.cards,id)))throw new TypeError('Invalid destroyed card identities');
  const issued=[...cards.map(card=>card.id),...destroyed].map(playingCardOrdinal).filter(n=>n>52);
  const next=state.nextPlayingCardOrdinal??53;
  if(!Number.isSafeInteger(next)||next<53||new Set(issued).size!==issued.length||issued.length!==next-53||issued.some(n=>n>=next))throw new TypeError('Invalid playing card identity counter');
}

// Low-level creation boundary for future generators; this enables no new content.
// The caller chooses the destination; no face, ID, or RNG from the source is reused.
export function createPlayingCard(state, source, {area='drawPile'}={}) {
  validatePlayingCardIdentities(state);
  if(!['hand','drawPile','discardPile'].includes(area)||!Array.isArray(state[area])||!source||
    !Object.hasOwn(SUITS,source.suit)||!Number.isInteger(source.rank)||source.rank<2||source.rank>14||
    Object.keys(source).some(key=>!['id','rank','suit','enhancement','edition','seal','creationOrdinal'].includes(key))||
    !validPlayingCardModifiers(source)||
    source.enhancement!==undefined&&!['bonus','mult','lucky','wild','steel','glass','stone','gold'].includes(source.enhancement))throw new TypeError('Invalid playing card creation');
  const ordinal=state.nextPlayingCardOrdinal??53,id=`card_created_${ordinal}`;
  const occupied=[...(state.jokers??[]),...(state.consumables??[]),...(state.shop?['main','vouchers','boosters'].flatMap(key=>state.shop[key]??[]):[]),...(state.packState?.cards??[])];
  if(ordinal===Number.MAX_SAFE_INTEGER||Object.keys(state.cards).length>=10000||occupied.some(card=>card.id===id))throw new RangeError('Playing card identity unavailable');
  const card={id,rank:source.rank,suit:source.suit,...(source.enhancement!==undefined?{enhancement:source.enhancement}:{}),...(source.edition!==undefined?{edition:source.edition}:{}),...(source.seal!==undefined?{seal:source.seal}:{}),creationOrdinal:ordinal};
  state.cards[id]=card;state[area].push(id);state.nextPlayingCardOrdinal=ordinal+1;
  return card;
}

// Canonical creation order for the 52 original physical identities. Original cards
// sort by persistent creation sort_id before *every* shuffle; plain52 creation
// follows ASCII prototype order C,D,H,S / 2..9,A,J,K,Q,T, not numeric rank.
// A modified face retains its physical ordinal. New copies sort after originals.
export function canonicalCards(cards) {
  if (!cards || typeof cards !== 'object') throw new TypeError('Expected plain cards');
  const list = Array.isArray(cards) ? [...cards] : Object.entries(cards).map(([id, card]) => {
    if (card?.id !== id) throw new TypeError('Card registry key must match its identity');
    return card;
  });
  const seen = new Set();
  const keyed = list.map(card => {
    if (!card || !Object.hasOwn(SUITS, card.suit) || !Number.isInteger(card.rank) || card.rank < 2 || card.rank > 14 ||
        typeof card.id !== 'string' || seen.has(card.id)) throw new TypeError('Invalid or duplicated plain-card identity');
    const ordinal=playingCardOrdinal(card.id);
    if((ordinal>52||Object.hasOwn(card,'creationOrdinal'))&&card.creationOrdinal!==ordinal)throw new TypeError('Invalid physical card creation order');
    seen.add(card.id);
    return { id: card.id, ordinal };
  });
  keyed.sort((a, b) => a.ordinal-b.ordinal);
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


