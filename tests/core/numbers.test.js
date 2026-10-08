import test from 'node:test';
import assert from 'node:assert/strict';
import { fraction, add, multiply, floor } from '../../src/core/numbers.js';

test('normalize signs and zero', () => {
  assert.deepEqual(fraction(-2n, -4n), { n: 1n, d: 2n });
  assert.deepEqual(fraction(0n, 24n), { n: 0n, d: 1n });
  assert.throws(() => fraction(1n, 0n), RangeError);
});
test('fractional operations stay exact and do not mutate inputs', () => {
  const a = Object.freeze(fraction(1n, 3n));
  const b = Object.freeze(fraction(1n, 6n));
  assert.deepEqual(add(a, b), { n: 1n, d: 2n });
  assert.deepEqual(multiply(fraction(3n, 2n), fraction(2n, 3n)), { n: 1n, d: 1n });
});
test('addition then multiplication differs from reverse order', () => {
  assert.equal(floor(multiply(add(fraction(2n), fraction(3n)), fraction(2n))), 10n);
  assert.equal(floor(add(multiply(fraction(2n), fraction(2n)), fraction(3n))), 7n);
});
test('large scores do not lose integer precision', () => {
  assert.equal(floor(multiply(fraction(9007199254740993n), fraction(3n, 2n))), 13510798882111489n);
});
test('floor rounds negative fractions down', () => {
  assert.equal(floor(fraction(-1n, 2n)), -1n);
  assert.equal(floor(fraction(-4n, 2n)), -2n);
  assert.equal(floor(fraction(1n, 2n)), 0n);
});
