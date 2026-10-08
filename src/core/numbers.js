export function fraction(n, d = 1n) {
  if (typeof n !== 'bigint' || typeof d !== 'bigint') throw new TypeError('Fraction requires BigInt');
  if (d === 0n) throw new RangeError('Zero denominator');
  if (d < 0n) { n = -n; d = -d; }
  let a = n < 0n ? -n : n;
  let b = d;
  while (b !== 0n) [a, b] = [b, a % b];
  return { n: n / a, d: d / a };
}

export function add(a, b) {
  return fraction(a.n * b.d + b.n * a.d, a.d * b.d);
}

export function multiply(a, b) {
  return fraction(a.n * b.n, a.d * b.d);
}

export function floor(value) {
  const { n, d } = fraction(value.n, value.d);
  return n / d - (n < 0n && n % d !== 0n ? 1n : 0n);
}
