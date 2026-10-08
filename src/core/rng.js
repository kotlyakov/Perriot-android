// Internal replay RNG. Does not reproduce the original game's seeds.
export function createRng(seed) {
  if (typeof seed !== 'string' || seed.length === 0) throw new TypeError('Seed must be a nonempty string');
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) state = Math.imul(state ^ seed.charCodeAt(i), 16777619) >>> 0;
  return { algorithm: 'counter32-v1', state };
}

export function randomInt(rng, maxExclusive) {
  if (!rng || rng.algorithm !== 'counter32-v1' || !Number.isInteger(rng.state) || rng.state < 0 || rng.state >= 2 ** 32) {
    throw new TypeError('Invalid RNG state');
  }
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 2 ** 32) throw new RangeError('Invalid RNG bound');
  const threshold = 2 ** 32 - (2 ** 32 % maxExclusive);
  let state = rng.state;
  let value;
  do {
    state = (state + 0x9e3779b9) >>> 0;
    value = state;
    value = Math.imul(value ^ (value >>> 16), 0x21f0aaad) >>> 0;
    value = Math.imul(value ^ (value >>> 15), 0x735a2d97) >>> 0;
    value = (value ^ (value >>> 15)) >>> 0;
  } while (value >= threshold);
  return { value: value % maxExclusive, rng: { algorithm: rng.algorithm, state } };
}
