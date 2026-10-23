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

export function divide(a, b) {
  if (b.n === 0n) throw new RangeError('Division by zero');
  return fraction(a.n * b.d, a.d * b.n);
}

export function exact(value) {
  if (typeof value === 'bigint') return {n:value,d:1n};
  if (!value || typeof value !== 'object' || typeof value.n !== 'bigint' || typeof value.d !== 'bigint') throw new TypeError('Invalid exact number');
  return fraction(value.n,value.d);
}

export function compact(value) {
  const normalized=exact(value);
  return normalized.d===1n?normalized.n:normalized;
}

export function addExact(a,b) { return compact(add(exact(a),exact(b))); }
export function subtractExact(a,b) { const right=exact(b);return compact(add(exact(a),{n:-right.n,d:right.d})); }
export function multiplyExact(a,b) { return compact(multiply(exact(a),exact(b))); }
export function divideExact(a,b) { return compact(divide(exact(a),exact(b))); }
export function floorExact(value) { return floor(exact(value)); }
export function equalExact(a,b) { const left=exact(a),right=exact(b);return left.n===right.n&&left.d===right.d; }
export function compareExact(a,b) { const left=exact(a),right=exact(b),delta=left.n*right.d-right.n*left.d;return delta<0n?-1:delta>0n?1:0; }

export function exactText(value) {
  if(typeof value==='bigint')return value.toString();
  const {n,d}=exact(value),negative=n<0n,absolute=negative?-n:n,whole=absolute/d;
  let remainder=absolute%d;if(remainder===0n)return (negative?'-':'')+whole;
  let denominator=d;while(denominator%2n===0n)denominator/=2n;while(denominator%5n===0n)denominator/=5n;
  if(denominator!==1n)return `${n}/${d}`;
  let digits='';while(remainder!==0n){remainder*=10n;digits+=remainder/d;remainder%=d;}
  return `${negative?'-':''}${whole}.${digits}`;
}

export function floor(value) {
  const { n, d } = fraction(value.n, value.d);
  return n / d - (n < 0n && n % d !== 0n ? 1n : 0n);
}

