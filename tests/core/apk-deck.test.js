import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createApkRng, nextApkSeed } from '../../src/core/apk-rng.js';
const api = await import('../../src/core/apk-deck.js').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});
const fixture = JSON.parse(readFileSync(new URL('../../scripts/reference-rng/deck-fixtures.json', import.meta.url)));
const suits = { C: 'clubs', D: 'diamonds', H: 'hearts', S: 'spades' };
const ranks = { A: 14, J: 11, K: 13, Q: 12, T: 10 };
function card(key) {
  const [s, r] = key.split('_');
  const suit = suits[s]; const rank = ranks[r] ?? Number(r);
  const id = `card_${suit}_${rank}`;
  return { id, rank, suit };
}
const ids = keys => keys.map(key => card(key).id);

// Independent original APK pseudoshuffle run on the pinned native LuaJIT oracle.
test('APK shuffle, blind deal and gap replenishment match all three native deck fixtures', () => {
  assert.equal(typeof api.shuffleApkDeck, 'function', 'APK deck implementation is missing');
  for (const [seed, expected] of Object.entries(fixture.seeds)) {
    const cards = Object.fromEntries(expected.canonical.map(key => { const c = card(key); return [c.id, c]; }));
    let rng = createApkRng(seed);
    assert.equal(nextApkSeed(rng, 'shuffle').value, expected.start_shuffle_seed);
    const initial = api.shuffleApkDeck(cards, rng, 'shuffle'); rng = initial.rng;
    assert.deepEqual(initial.cardIds, ids(expected.start_order_bottom_to_top));
    assert.equal(nextApkSeed(rng, 'nr1').value, expected.first_nr1_seed);
    const first = api.shuffleApkDeck(initial.cardIds.map(id => cards[id]), rng, 'nr1'); rng = first.rng;
    assert.deepEqual(first.cardIds, ids(expected.first_blind_order_bottom_to_top));
    const pile = [...first.cardIds]; const deal = [];
    for (let i = 0; i < 8; i++) deal.push(pile.pop());
    assert.deepEqual(deal, ids(expected.first_hand_deal_order));
    assert.deepEqual(pile, ids(expected.remaining_bottom_to_top));
    assert.deepEqual([pile.pop(), pile.pop(), pile.pop()], ids(expected.three_replacements_deal_order));
    assert.equal(nextApkSeed(rng, 'nr1').value, expected.second_nr1_seed);
    const second = api.shuffleApkDeck([...Object.values(cards)].reverse(), rng, 'nr1');
    assert.deepEqual(second.cardIds.slice(-8).reverse(), ids(expected.second_blind_deal_order));
  }
});

test('APK deck shuffle restores creation order before shuffling and never mutates caller state', () => {
  const cards = fixture.seeds.PIERROT1.canonical.map(card);
  const rng = createApkRng('PIERROT1'); const before = JSON.stringify({ cards, rng });
  const first = api.shuffleApkDeck(cards, rng, 'nr1');
  const reversed = api.shuffleApkDeck([...cards].reverse(), rng, 'nr1');
  assert.deepEqual(reversed, first);
  assert.equal(JSON.stringify({ cards, rng }), before);
  assert.deepEqual(api.shuffleApkDeck(cards, JSON.parse(JSON.stringify(rng)), 'nr1'), first);
});

test('APK deck supports plain-card subsets and rejects malformed or modified duplicate identities', () => {
  const rng = createApkRng('PIERROT1'); const c = card('C_A');
  assert.deepEqual(api.shuffleApkDeck([c], rng, 'nr1').cardIds, [c.id]);
  assert.deepEqual(api.shuffleApkDeck([], rng, 'nr1').cardIds, []);
  for (const cards of [null, [c, c], [{ ...c, id: 'modified_ace' }], [{ ...c, rank: 15 }], [{ ...c, suit: 'unknown' }], { wrong: c }]) {
    assert.throws(() => api.shuffleApkDeck(cards, rng, 'nr1'), TypeError);
  }
  assert.throws(() => api.shuffleApkDeck([c], rng, 1), TypeError);
});
