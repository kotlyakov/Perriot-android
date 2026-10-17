import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng, randomInt } from '../../src/core/rng.js';

function draw(rng, count, limit = 52) {
  const values = [];
  for (let i = 0; i < count; i++) {
    const next = randomInt(rng, limit);
    values.push(next.value);
    rng = next.rng;
  }
  return { values, rng };
}

test('same seed and action sequence reproduce draws', () => {
  assert.deepEqual(draw(createRng('Печатная мастерская'), 100), draw(createRng('Печатная мастерская'), 100));
  assert.notDeepEqual(draw(createRng('A'), 100).values, draw(createRng('B'), 100).values);
});
test('JSON save resumes the next draws', () => {
  const before = draw(createRng('save'), 17).rng;
  assert.deepEqual(draw(before, 100), draw(JSON.parse(JSON.stringify(before)), 100));
});
test('drawing advances the state and produces varying values', () => {
  const initial = createRng('advance');
  const result = draw(initial, 100);
  assert.notEqual(result.rng.state, initial.state);
  assert.ok(new Set(result.values).size > 1);
});
test('draw leaves input state and other stream untouched', () => {
  const deck = Object.freeze(createRng('deck'));
  const shop = Object.freeze(createRng('shop'));
  const snapshot = JSON.stringify({ deck, shop });
  draw(deck, 100);
  assert.equal(JSON.stringify({ deck, shop }), snapshot);
});
test('limits include singleton and entire uint32 interval', () => {
  assert.deepEqual(draw(createRng('one'), 8, 1).values, Array(8).fill(0));
  for (const limit of [3, 52, 2147483649, 4294967296]) {
    for (const value of draw(createRng('boundary'), 100, limit).values) {
      assert.ok(Number.isInteger(value) && value >= 0 && value < limit);
    }
  }
});
test('bad seed and draw bounds reject without changing RNG', () => {
  for (const seed of ['', null, 12]) assert.throws(() => createRng(seed));
  const rng = Object.freeze(createRng('unchanged'));
  for (const limit of [0, -1, 1.5, NaN, Infinity, 4294967297]) assert.throws(() => randomInt(rng, limit));
});
test('corrupt persisted states reject', () => {
  for (const rng of [null, {}, {algorithm:'other',state:1}, ...[-1,1.5,4294967296].map(state=>({algorithm:'counter32-v1',state}))]) {
    assert.throws(() => randomInt(rng, 52));
  }
});
test('counter32-v1 preserves saved sequence known answers', () => {
  assert.deepEqual(createRng('A'), { algorithm: 'counter32-v1', state: 3289118412 });
  assert.deepEqual(randomInt({ algorithm: 'counter32-v1', state: 0 }, 4294967296), {
    value: 1684164658, rng: { algorithm: 'counter32-v1', state: 2654435769 },
  });
});
test('rejection consumes another candidate outside the unbiased interval', () => {
  assert.deepEqual(randomInt({ algorithm: 'counter32-v1', state: 3 }, 2147483649), {
    value: 1437520376, rng: { algorithm: 'counter32-v1', state: 3668340014 },
  });
});
