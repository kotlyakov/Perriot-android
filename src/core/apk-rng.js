/*
 * LuaJIT 2.1.1700008891 Tausworthe arithmetic port, pinned upstream commit
 * 43d0a19158ceabaa51b0462c1ebc97612b420a2e (src/lj_prng.c, lib_math.c).
 * Copyright (C) 2005-2023 Mike Pall. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * The APK's seed/key transformations are independently reconstructed from the
 * verified numerical contract in docs/apk-findings/rng-runtime.md. No original
 * game Lua or assets are embedded. This module is not a cryptographic RNG.
 */
const ALGORITHM = 'apk-luajit223-v1';
const U64 = (1n << 64n) - 1n;
const MANTISSA = (1n << 52n) - 1n;
const PARAMETERS = [[63n, 31n, 18n], [58n, 19n, 28n], [55n, 24n, 7n], [47n, 21n, 8n]];
const DEFAULT_STATE = ['a0d277570a345b8c', '764a296c5d4aa64f', '51220704070adeaa', '2a2717b5a7b7b927'];

function doubleBits(number) {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, number);
  return view.getBigUint64(0);
}

function step(words) {
  let result = 0n;
  const state = words.map((word, i) => {
    const [k, q, shift] = PARAMETERS[i];
    const value = ((((word << q) & U64) ^ word) >> (k - shift)) ^
      (((word & ((U64 << (64n - k)) & U64)) << shift) & U64);
    result ^= value;
    return value;
  });
  return { state, result };
}

function encode(words) { return words.map(word => word.toString(16).padStart(16, '0')); }
function decode(state) { return state.map(word => BigInt(`0x${word}`)); }

function validateMathState(state) {
  if (!Array.isArray(state) || state.length !== 4 || !state.every(word => typeof word === 'string' && /^[0-9a-f]{16}$/.test(word))) {
    throw new TypeError('Invalid APK math.random state');
  }
}

export function validateApkRng(rng) {
  if (!rng || rng.algorithm !== ALGORITHM || typeof rng.seed !== 'string' || !rng.seed.length ||
      !Number.isFinite(rng.hashedSeed) || rng.hashedSeed < 0 || rng.hashedSeed > 1 ||
      !rng.streams || typeof rng.streams !== 'object' || Array.isArray(rng.streams) ||
      !Object.values(rng.streams).every(value => Number.isFinite(value) && value >= 0 && value <= 1)) {
    throw new TypeError('Invalid APK RNG state');
  }
  validateMathState(rng.mathState);
}

export function createApkMathState(seed) {
  if (seed === undefined) return [...DEFAULT_STATE];
  if (!Number.isFinite(seed)) throw new TypeError('APK random seed must be a finite number');
  let number = seed;
  let state = PARAMETERS.map(([k]) => {
    number = number * Math.PI + Math.E;
    let word = doubleBits(number);
    const threshold = 1n << (64n - k);
    if (word < threshold) word += threshold;
    return word;
  });
  for (let i = 0; i < 10; i++) state = step(state).state;
  return encode(state);
}

export function nextApkMathRandom(state, min, max) {
  validateMathState(state);
  if ((min !== undefined && !Number.isFinite(min)) || (max !== undefined && !Number.isFinite(max)) ||
      (max !== undefined && (min === undefined || max < min)) || (max === undefined && min !== undefined && min < 1)) {
    throw new RangeError('Invalid APK random interval');
  }
  const next = step(decode(state));
  let value = Number(next.result & MANTISSA) / 2 ** 52;
  if (min !== undefined) value = max === undefined ? Math.floor(value * min) + 1 : Math.floor(value * (max - min + 1)) + min;
  return { value, state: encode(next.state) };
}

export function apkPseudoHash(text) {
  if (typeof text !== 'string') throw new TypeError('APK hash input must be a string');
  const bytes = new TextEncoder().encode(text);
  let value = 1;
  for (let i = bytes.length; i > 0; i--) {
    value = ((1.1239285023 / value) * bytes[i - 1] * Math.PI + Math.PI * i) % 1;
  }
  return value;
}

// Reproduce LuaJIT %.13f's decimal half-up rounding from the exact binary64
// value (its own formatter differs from C printf's nearest/even rounding).
// Multiplying by 1e13 first would introduce an extra rounding step.
export function apkNormalizeStream(value) {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new RangeError('APK stream must be in [0,1]');
  const bits = doubleBits(value);
  const exponent = Number((bits >> 52n) & 0x7ffn);
  const mantissa = (bits & MANTISSA) | (exponent ? 1n << 52n : 0n);
  const binaryPower = (exponent || 1) - 1023 - 52;
  const numerator = mantissa * 10000000000000n;
  const denominator = binaryPower < 0 ? 1n << BigInt(-binaryPower) : 1n;
  const scaled = binaryPower < 0 ? numerator : numerator << BigInt(binaryPower);
  let rounded = scaled / denominator;
  const remainder = scaled % denominator;
  if (remainder * 2n >= denominator) rounded++;
  return Number(rounded) / 1e13;
}

function advanceStream(value) {
  return apkNormalizeStream((2.134453429141 + value * 1.72431234) % 1);
}

export function createApkRng(seed, mathState = createApkMathState()) {
  if (typeof seed !== 'string' || !seed.length) throw new TypeError('APK run seed must be a nonempty string');
  validateMathState(mathState);
  return { algorithm: ALGORITHM, seed, hashedSeed: apkPseudoHash(seed), streams: {}, mathState: [...mathState] };
}

export function predictApkSeed(key, seed) {
  if (typeof key !== 'string' || typeof seed !== 'string') throw new TypeError('APK key and prediction seed must be strings');
  if (key === 'seed') throw new RangeError('The seed key consumes global random state and cannot be predicted from a run seed');
  return (advanceStream(apkPseudoHash(key + seed)) + apkPseudoHash(seed)) / 2;
}

export function nextApkSeed(rng, key) {
  validateApkRng(rng);
  if (typeof key !== 'string') throw new TypeError('APK stream key must be a string');
  if (key === 'seed') {
    const next = nextApkMathRandom(rng.mathState);
    return { value: next.value, rng: { ...rng, mathState: next.state } };
  }
  const state = advanceStream(Object.hasOwn(rng.streams, key) ? rng.streams[key] : apkPseudoHash(key + rng.seed));
  return { value: (state + rng.hashedSeed) / 2, rng: { ...rng, streams: { ...rng.streams, [key]: state } } };
}

export function nextApkRandom(rng, key, min, max) {
  validateApkRng(rng);
  if (key !== undefined && typeof key !== 'string' && !Number.isFinite(key)) throw new TypeError('APK random key must be a string or finite numeric seed');
  let current = rng;
  if (key !== undefined) {
    const next = typeof key === 'string' ? nextApkSeed(rng, key) : { value: key, rng };
    current = { ...next.rng, mathState: createApkMathState(next.value) };
  }
  // The game wrapper supplies bounds only when both are present. An unkeyed
  // call represents raw math.random, which also supports one-bound intervals.
  const next = key !== undefined && (min === undefined || max === undefined)
    ? nextApkMathRandom(current.mathState)
    : nextApkMathRandom(current.mathState, min, max);
  return { value: next.value, rng: { ...current, mathState: next.state } };
}
