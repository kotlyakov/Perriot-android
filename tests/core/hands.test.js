import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateHand } from '../../src/core/hands.js';

const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
function cards(ranks, flush = false) {
  return ranks.map((rank, i) => Object.freeze({ id: `c${i}`, rank, suit: flush ? 'spades' : suits[i % 4] }));
}
// Fixtures derived from RULE-HAND-001..006, not from the evaluator.
for (const [name, ranks, flush, ids] of [
  ['high_card', [14,10,8,6,3], false, ['c0']],
  ['pair', [8,8,14], false, ['c0','c1']],
  ['two_pair', [7,7,4,4,14], false, ['c0','c1','c2','c3']],
  ['three_of_a_kind', [5,5,5,13], false, ['c0','c1','c2']],
  ['straight', [14,2,3,4,5], false, ['c0','c1','c2','c3','c4']],
  ['flush', [2,4,6,8,10], true, ['c0','c1','c2','c3','c4']],
  ['full_house', [7,7,7,2,2], false, ['c0','c1','c2','c3','c4']],
  ['four_of_a_kind', [9,9,9,9,2], false, ['c0','c1','c2','c3']],
  ['straight_flush', [6,7,8,9,10], true, ['c0','c1','c2','c3','c4']],
  ['five_of_a_kind', [2,2,2,2,2], false, ['c0','c1','c2','c3','c4']],
  ['flush_house', [3,3,3,2,2], true, ['c0','c1','c2','c3','c4']],
  ['flush_five', [14,14,14,14,14], true, ['c0','c1','c2','c3','c4']],
]) {
  test(`recognize ${name} and select scoring cards`, () => {
    const input = Object.freeze(cards(ranks, flush));
    assert.deepEqual(evaluateHand(input), {handId:name, scoringCardIds:ids, isRoyal:false});
  });
}
test('royal shares straight flush identity', () => {
  assert.deepEqual(evaluateHand(cards([14,13,12,11,10], true)), {
    handId:'straight_flush', scoringCardIds:['c0','c1','c2','c3','c4'], isRoyal:true,
  });
});
test('ace cannot wrap through king to two', () => {
  assert.equal(evaluateHand(cards([12,13,14,2,3])).handId, 'high_card');
});
test('scoring cards retain played order while kickers are excluded', () => {
  assert.deepEqual(evaluateHand(cards([7,14,7,4,4])).scoringCardIds, ['c0','c2','c3','c4']);
  assert.deepEqual(evaluateHand(cards([2])).scoringCardIds, ['c0']);
});
test('invalid selections and unresolved enhancements fail explicitly', () => {
  for (const input of [[], cards([2,3,4,5,6,7]), [{id:'x',rank:1,suit:'clubs'}], [{id:'x',rank:2,suit:'unknown'}], [{id:'x',rank:2,suit:'clubs'},{id:'x',rank:3,suit:'clubs'}], [{id:'x',rank:2,suit:'clubs',enhancement:'future'}]]) {
    assert.throws(() => evaluateHand(input));
  }
});
test('malformed enhancement is not silently treated as base', () => {
  for (const enhancement of ['', false, 0, null]) {
    assert.throws(() => evaluateHand([{id:'a',rank:14,suit:'spades',enhancement}]));
  }
});

