import test from 'node:test';
import assert from 'node:assert/strict';
import { createApkRng, nextApkRandom } from '../../src/core/apk-rng.js';

const api = await import('../../src/core/apk-blinds.js').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});
const content = await import('../../src/content/apk-blinds.js').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});

test('APK blind catalogue includes all 30 identities and original difficulty facts', () => {
  assert.equal(content.APK_BLINDS?.length, 30);
  assert.equal(content.APK_BOSSES.length, 28);
  assert.equal(content.APK_BOSSES.filter(b => b.showdown).length, 5);
  assert.equal(content.APK_BLINDS_BY_ID.bl_big.mult, 1.5);
  assert.equal(content.APK_BLINDS_BY_ID.bl_wall.mult, 4);
  assert.equal(content.APK_BLINDS_BY_ID.bl_final_vessel.mult, 6);
  assert.equal(content.APK_BLINDS_BY_ID.bl_ox.minAnte, 6);
});

test('least-used boss selection respects min ante, bans, and ordinary/showdown boundaries', () => {
  assert.equal(typeof api.chooseApkBoss, 'function');
  const used = Object.fromEntries(content.APK_BOSSES.map(b => [b.id, 3]));
  used.bl_hook = 0; used.bl_club = 0; used.bl_ox = 0;
  const result = api.chooseApkBoss(createApkRng('PIERROT1'), { ante: 1, bossesUsed: used, bannedKeys: ['bl_club'] });
  assert.equal(result.bossId, 'bl_hook');
  assert.equal(result.bossesUsed.bl_hook, 1);
  for (const ante of [0, 1, 2, 7, 8, 9, 16, 24]) {
    for (let seed = 0; seed < 20; seed++) {
      const chosen = api.chooseApkBoss(createApkRng('BOUNDARY' + seed), { ante });
      const boss = content.APK_BLINDS_BY_ID[chosen.bossId];
      assert.equal(boss.showdown, ante >= 2 && ante % 8 === 0);
      if (!boss.showdown) assert.ok(boss.minAnte <= Math.max(1, ante));
    }
  }
});

test('custom win ante and endless ignores declared boss max and showdown min', () => {
  assert.equal(typeof api.chooseApkBoss, 'function');
  assert.ok(content.APK_BLINDS_BY_ID[api.chooseApkBoss(createApkRng('FINAL'), { ante: 4, winAnte: 4 }).bossId].showdown);
  const bannedKeys = content.APK_BOSSES.filter(b => b.id !== 'bl_ox').map(b => b.id);
  assert.equal(api.chooseApkBoss(createApkRng('ENDLESS'), { ante: 99, bannedKeys }).bossId, 'bl_ox');
});

test('every one of the 28 original bosses remains selectable independent of implemented gameplay effects', () => {
  for (const boss of content.APK_BOSSES) {
    const bannedKeys = content.APK_BOSSES.filter(other => other.id !== boss.id).map(other => other.id);
    const result = api.chooseApkBoss(createApkRng('ALLBOSSES'), { ante: boss.showdown ? 8 : 7, bannedKeys });
    assert.equal(result.bossId, boss.id);
  }
});

test('inputs stay immutable and RNG plus usage survives JSON resume', () => {
  assert.equal(typeof api.chooseApkBoss, 'function');
  const rng = createApkRng('SAVE'); const bossesUsed = { bl_hook: 2 };
  const before = JSON.stringify({ rng, bossesUsed });
  const first = api.chooseApkBoss(rng, { bossesUsed });
  assert.equal(JSON.stringify({ rng, bossesUsed }), before);
  const saved = JSON.parse(JSON.stringify(first));
  assert.deepEqual(api.chooseApkBoss(saved.rng, { bossesUsed: saved.bossesUsed }), api.chooseApkBoss(first.rng, { bossesUsed: first.bossesUsed }));
  assert.ok(Object.hasOwn(first.rng.streams, 'boss'));
  assert.notDeepEqual(first.rng.mathState, rng.mathState);
});

test('invalid state and exhausted eligible pool fail explicitly without mutation', () => {
  assert.equal(typeof api.chooseApkBoss, 'function');
  const rng = createApkRng('INVALID'); const before = JSON.stringify(rng);
  for (const options of [null, { ante: 1.1 }, { ante: -1 }, { winAnte: 0 }, { bossesUsed: [] }, { bossesUsed: { bl_hook: -1 } }, { bossesUsed: { bl_small: 0 } }, { bannedKeys: ['missing'] }, { forcedBoss: 'bl_hook' }]) {
    assert.throws(() => api.chooseApkBoss(rng, options));
  }
  assert.throws(() => api.chooseApkBoss({}, {}));
  assert.throws(() => api.chooseApkBoss(rng, { bannedKeys: content.APK_BOSSES.map(b => b.id) }), /eligible/);
  const usage = Object.fromEntries(content.APK_BOSSES.map(b => [b.id, 101]));
  assert.throws(() => api.chooseApkBoss(rng, { bossesUsed: usage }), /eligible/);
  assert.equal(JSON.stringify(rng), before);
});

// Independent pinned native LuaJIT executing original APK boss/RNG functions,
// 24 consecutive antes per run. Last column is the next unkeyed math.random.
const nativeBossTraces = {
  "PIERROT1": [
    [
      "bl_window",
      0.675909906385,
      0.9763965287209779
    ],
    [
      "bl_club",
      0.2999332214489,
      0.9418038893865293
    ],
    [
      "bl_mouth",
      0.6516319840613,
      0.9316470253841336
    ],
    [
      "bl_fish",
      0.2580705003966,
      0.9285181379493608
    ],
    [
      "bl_water",
      0.5794475775648,
      0.7242984360512017
    ],
    [
      "bl_wheel",
      0.1336020375191,
      0.7523927932635053
    ],
    [
      "bl_arm",
      0.3648250710843,
      0.8720069060698905
    ],
    [
      "bl_final_bell",
      0.763525801153,
      0.5955543363296363
    ],
    [
      "bl_tooth",
      0.4510103899775,
      0.7831531696878093
    ],
    [
      "bl_goad",
      0.9121362100474,
      0.5316945096303434
    ],
    [
      "bl_psychic",
      0.7072611518866,
      0.5842047496005534
    ],
    [
      "bl_ox",
      0.3539925609417,
      0.4777048139057558
    ],
    [
      "bl_plant",
      0.744847170241,
      0.2898400262841241
    ],
    [
      "bl_hook",
      0.4188025962016,
      0.5354548461684354
    ],
    [
      "bl_eye",
      0.8565999137955,
      0.28735874843936005
    ],
    [
      "bl_final_leaf",
      0.6114992309415,
      0.20235136469698323
    ],
    [
      "bl_mark",
      0.1888690989539,
      0.25533963666990367
    ],
    [
      "bl_serpent",
      0.4601227471119,
      0.8209388540339715
    ],
    [
      "bl_wall",
      0.9278487599007,
      0.08668593138286496
    ],
    [
      "bl_needle",
      0.7343544954915,
      0.31719208457360093
    ],
    [
      "bl_house",
      0.4007099476515,
      0.4402491743099328
    ],
    [
      "bl_flint",
      0.8254025366372,
      0.8737543589217389
    ],
    [
      "bl_manacle",
      0.5577052085318,
      0.7331711131817216
    ],
    [
      "bl_final_acorn",
      0.0961114022947,
      0.9108199881739505
    ]
  ],
  "AAAAAAA1": [
    [
      "bl_window",
      0.573137658849,
      0.8778797350226144
    ],
    [
      "bl_arm",
      0.122721766813,
      0.145043147748519
    ],
    [
      "bl_pillar",
      0.3460640860433,
      0.7502802238095672
    ],
    [
      "bl_eye",
      0.7311760031363,
      0.0747885088738931
    ],
    [
      "bl_wall",
      0.3952292340608,
      0.07859909985594116
    ],
    [
      "bl_manacle",
      0.8159520745608,
      0.9054871841803753
    ],
    [
      "bl_hook",
      0.5414096601548,
      0.39475450907512344
    ],
    [
      "bl_final_vessel",
      0.0680127871411,
      0.19071505799793953
    ],
    [
      "bl_tooth",
      0.2517287172862,
      0.12591886187705148
    ],
    [
      "bl_flint",
      0.56851236269,
      0.29506854908346103
    ],
    [
      "bl_needle",
      0.1147463115699,
      0.3552033803374348
    ],
    [
      "bl_psychic",
      0.3323119101505,
      0.5859540748475742
    ],
    [
      "bl_serpent",
      0.7074629565425,
      0.3348800887881609
    ],
    [
      "bl_head",
      0.3543405352001,
      0.008114219719622895
    ],
    [
      "bl_plant",
      0.7454471865487,
      0.6263041345094635
    ],
    [
      "bl_final_leaf",
      0.4198372117252,
      0.05812084544398588
    ],
    [
      "bl_goad",
      0.85838391411,
      0.39445446508392834
    ],
    [
      "bl_mark",
      0.6145754046984,
      0.9653944593765991
    ],
    [
      "bl_water",
      0.1941733833229,
      0.9684593963460617
    ],
    [
      "bl_club",
      0.4692689901042,
      0.47546083164390174
    ],
    [
      "bl_house",
      0.943619739557,
      0.39375557163711217
    ],
    [
      "bl_ox",
      0.7615485903267,
      0.4733650418926516
    ],
    [
      "bl_fish",
      0.4476010609509,
      0.17230418986883178
    ],
    [
      "bl_final_acorn",
      0.9062574619357,
      0.5233434412655384
    ]
  ],
  "ПЬЕРО1": [
    [
      "bl_psychic",
      0.7943300491145,
      0.5742582777873779
    ],
    [
      "bl_flint",
      0.5041265348619,
      0.6333897621391666
    ],
    [
      "bl_arm",
      0.0037250341248,
      0.5028742537213675
    ],
    [
      "bl_hook",
      0.1408765514493,
      0.7544825758158231
    ],
    [
      "bl_house",
      0.3773686052217,
      0.9004041260330267
    ],
    [
      "bl_wall",
      0.7851547718534,
      0.112300672977107
    ],
    [
      "bl_mark",
      0.4883054910577,
      0.6215414607966614
    ],
    [
      "bl_final_heart",
      0.9764446130616,
      0.6808828201780148
    ],
    [
      "bl_water",
      0.8181489247696,
      0.556047247600528
    ],
    [
      "bl_pillar",
      0.545197716079,
      0.045503588715628984
    ],
    [
      "bl_fish",
      0.0745445787158,
      0.01978550451427674
    ],
    [
      "bl_window",
      0.2629915661008,
      0.7248919441051771
    ],
    [
      "bl_manacle",
      0.5879330318845,
      0.8153768105007144
    ],
    [
      "bl_goad",
      0.1482336111131,
      0.5806904807004545
    ],
    [
      "bl_plant",
      0.3900544739861,
      0.07755860330880426
    ],
    [
      "bl_final_vessel",
      0.8070291719074,
      0.15050674025027355
    ],
    [
      "bl_serpent",
      0.5260237890009,
      0.6626722612163884
    ],
    [
      "bl_wheel",
      0.0414827396488,
      0.232562746130057
    ],
    [
      "bl_mouth",
      0.2059826290144,
      0.6599699470366276
    ],
    [
      "bl_ox",
      0.4896318181762,
      0.5035265968339895
    ],
    [
      "bl_needle",
      0.9787316152789,
      0.2014154892692821
    ],
    [
      "bl_eye",
      0.8220924309145,
      0.6364649436486314
    ],
    [
      "bl_club",
      0.5519975523875,
      0.21174533580221833
    ],
    [
      "bl_final_bell",
      0.0862696203726,
      0.20104113032884308
    ]
  ]
};

test('matches 72 native original boss selections, stream states and following global RNG draws', () => {
  for (const [seed, trace] of Object.entries(nativeBossTraces)) {
    let rng = createApkRng(seed); let bossesUsed = {};
    for (let index = 0; index < trace.length; index++) {
      const [bossId, stream, globalDraw] = trace[index];
      const chosen = api.chooseApkBoss(rng, { ante: index + 1, bossesUsed });
      assert.equal(chosen.bossId, bossId, `${seed} ante ${index + 1}`);
      assert.equal(chosen.rng.streams.boss, stream);
      const unkeyed = nextApkRandom(chosen.rng);
      assert.equal(unkeyed.value, globalDraw);
      rng = unkeyed.rng; bossesUsed = chosen.bossesUsed;
    }
  }
});
