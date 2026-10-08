import test from 'node:test';
import assert from 'node:assert/strict';
import { fraction, add, multiply, floor } from '../app/src/main/assets/src/core/numbers.js';
import { createRng, randomInt } from '../app/src/main/assets/src/core/rng.js';

test('fractions normalize sign and reduce', () => {
  assert.deepEqual(fraction(4n, -6n), { n: -2n, d: 3n });
  assert.deepEqual(add(fraction(1n, 2n), fraction(1n, 3n)), { n: 5n, d: 6n });
  assert.deepEqual(multiply(fraction(2n, 3n), fraction(3n, 4n)), { n: 1n, d: 2n });
  assert.equal(floor(fraction(-7n, 3n)), -3n);
  assert.throws(() => fraction(1n, 0n), RangeError);
});

test('RNG deterministic replay and bounded output', () => {
  let a = createRng('same-seed');
  let b = createRng('same-seed');
  for (let i = 0; i < 1000; i++) {
    const first = randomInt(a, 52);
    const second = randomInt(b, 52);
    assert.equal(first.value, second.value);
    assert.ok(first.value >= 0 && first.value < 52);
    a = first.rng;
    b = second.rng;
  }
  assert.throws(() => randomInt(a, 0), RangeError);
});
