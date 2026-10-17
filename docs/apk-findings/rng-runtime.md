# RNG runtime reference — 2026-10-08

## Verified reference, not a full game execution

APK SHA256: `6236dc68a312d04295839cfbfd2699d4751877bdf162c3a4ce425481d28397bd`.
Both `lib/arm64-v8a/liblove.so` and `lib/armeabi-v7a/liblove.so` contain `LuaJIT 2.1.1700008891`.
The timestamp corresponds exactly to official LuaJIT commit `43d0a19158ceabaa51b0462c1ebc97612b420a2e`, committed 2023-11-15 00:41:31 UTC. This identifies the advertised upstream revision; a patched binary cannot be excluded solely from the string.

An official source archive at that pinned commit was downloaded and built natively for Linux x64 outside the repository. The resulting executable reports exactly `LuaJIT 2.1.1700008891`. Isolated original RNG functions from the uploaded APK were executed using this runtime. The full Android APK and LÖVE game were **not** run.

## Source coordinates and numerical contract

- APK `assets/functions/misc_functions.lua:282-324`: hash, mutable per-key state, seed prediction, and random poll.
- APK `assets/game.lua:2362-2367`: run seed plus hashed seed initialization.
- APK `assets/functions/common_events.lua:1983-2006`: initial Buffoon uses unkeyed `math.random(1,2)`; later booster uses a keyed poll.
- Official pinned `src/lib_math.c:103-131`: floating-point seed expands into four IEEE-754 bit patterns and performs ten warm-up steps.
- Official pinned `src/lj_prng.c:34-61`: four uint64 Tausworthe generators, parameter triples `(63,31,18)`, `(58,19,28)`, `(55,24,7)`, `(47,21,8)`; mask intermediate left shifts to uint64 before right shifts.
- Official pinned `src/lib_math.c:133-180`: random uses low 52 bits as mantissa of a number in [1,2), subtracts one; inclusive integer interval is scaled then floored.

Original `pseudohash` processes UTF-8 bytes backwards with IEEE-754 doubles and positive modulo 1. It does not process JavaScript UTF-16 characters. A keyed poll initially hashes key+run seed, advances a mutable key using the specified affine fractional transformation, normalizes via Lua `string.format("%.13f")`, and averages with run hashed seed. This normalized number seeds LuaJIT every poll. `pseudoseed('seed')` instead consumes current global RNG state. The prediction branch calculates without mutating saved key state.

The pinned LuaJIT formatter uses half-up for the verified positive fixed-13 half-way cases, not C printf nearest/even: 1/16384 formats as 0.0000610351563 and 5/16384 as 0.0003051757813. JS compatibility must preserve this decimal formatting/rounding and unsigned 64-bit wrapping, not truncate a fractional seed to an integer. The existing counter32 generator is not an equivalent algorithm.

## Own oracle tooling and fixtures

`scripts/reference-rng` is intentionally not gameplay code. Actual paths:
- `scripts/reference-rng/generate-fixtures.py`
- `scripts/reference-rng/fixtures.json`

The tool extracts only RNG function region into a temporary directory outside the repo, executes it, then removes it. No original Lua source, original artwork, or APK is added to the repository. Fixtures are own numerical output and metadata.

Fixture scope: 156 numeric values covering initial global state and direct seeds 0, 0.5, 1, 42, -1; run seeds `AAAAAAA1`, `PIERROT1`, `12345678`, UTF-8 `ПЬЕРО1` and `é🙂`; fixed-13 formatting edge values; keys `cdt1`, `rarity1sho`, `pack_generic1`, repeated cdt advancement, non-mutating prediction, unkeyed seed branch and first Buffoon integer draw immediately after each controlled poll. Interpreter and JIT-enabled runs produce identical fixture output. These are controlled traces, not claims about a complete shop generation sequence.

Reproduce from repository root:

```sh
python scripts/reference-rng/generate-fixtures.py --apk /path/to/reference.apk --luajit /path/to/pinned/luajit --output /tmp/fixtures.json
```

Runtime build: download `https://codeload.github.com/LuaJIT/LuaJIT/tar.gz/43d0a19158ceabaa51b0462c1ebc97612b420a2e`, extract outside repository, run `make -j2`. Never replace the pinned commit with a moving branch.

## Exact remaining dependencies

1. Compare independent JS implementation against all numerical fixtures and saved/reloaded key state.
2. Trace the complete ordered calls before each shop item, booster, voucher and shuffle; unkeyed first Buffoon depends on the immediately preceding global generator state, not solely the run seed.
3. Preserve original pool order and all unlock, ban, duplicate, Soul, rarity, edition and sticker filters. Correct RNG alone does not imply correct shop inventories.
4. Additional decimal half-way rounding and non-ASCII seed edge scenarios remain useful; current fixtures include both UTF-8 runs and fixed-13 formatting boundaries.
5. Full APK execution/device observation remains required to exclude bundled-runtime patches and validate integrated lifecycle. Native x64 oracle is stronger than static reading but is not an Android runtime proof.

Primary sources checked: official commit API, pinned upstream source archive, and https://luajit.org/extensions.html (the latter is current documentation, not a substitute for pinned 2023 implementation). Official documentation states equal seeded sequences across platforms and 52-bit output. No unofficial reimplementation was used as oracle.
