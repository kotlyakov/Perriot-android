import { APK_BOSSES, APK_BLINDS_BY_ID } from '../content/apk-blinds.js';
import { validateApkRng, nextApkSeed, createApkMathState, nextApkMathRandom } from './apk-rng.js';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// Ordinary full-version selection only. Tutorial locks, prescribed and forced
// bosses are separate original paths and must not silently use this selector.
export function chooseApkBoss(rng, options = {}) {
  validateApkRng(rng);
  if (!object(options) || Object.keys(options).some(key => !['ante', 'winAnte', 'bossesUsed', 'bannedKeys'].includes(key))) {
    throw new TypeError('Unsupported APK boss selection context');
  }
  const { ante = 1, winAnte = 8, bossesUsed = {}, bannedKeys = [] } = options;
  if (!Number.isSafeInteger(ante) || ante < 0 || !Number.isSafeInteger(winAnte) || winAnte < 1) {
    throw new RangeError('Invalid boss ante or winAnte');
  }
  if (!object(bossesUsed) || Object.entries(bossesUsed).some(([id, count]) =>
    !Object.hasOwn(APK_BLINDS_BY_ID, id) || APK_BLINDS_BY_ID[id].minAnte === null || !Number.isSafeInteger(count) || count < 0 || count >= Number.MAX_SAFE_INTEGER)) {
    throw new TypeError('Invalid APK boss usage');
  }
  if (!Array.isArray(bannedKeys) || bannedKeys.some(id => typeof id !== 'string' || !Object.hasOwn(APK_BLINDS_BY_ID, id))) {
    throw new TypeError('Invalid APK banned blind keys');
  }
  const usage = Object.fromEntries(APK_BOSSES.map(boss => [boss.id, Object.hasOwn(bossesUsed, boss.id) ? bossesUsed[boss.id] : 0]));
  const showdown = ante >= 2 && ante % winAnte === 0;
  const eligible = APK_BOSSES.filter(boss => boss.showdown === showdown &&
    (showdown || boss.minAnte <= Math.max(1, ante)) && !bannedKeys.includes(boss.id));
  // The original initializes min_use to 100; retain that edge rather than
  // inventing a fallback when an exhausted/fully banned pool cannot be sampled.
  const minUse = Math.min(100, ...eligible.map(boss => usage[boss.id]));
  const keys = eligible.filter(boss => usage[boss.id] <= minUse).map(boss => boss.id).sort();
  if (!keys.length) throw new RangeError('No eligible APK bosses');
  const seed = nextApkSeed(rng, 'boss');
  const next = nextApkMathRandom(createApkMathState(seed.value), keys.length);
  const bossId = keys[next.value - 1];
  usage[bossId]++;
  return { bossId, bossesUsed: usage, rng: { ...seed.rng, mathState: next.state } };
}
