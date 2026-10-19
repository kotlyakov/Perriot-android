# Item7b native callback and target oracle

2026-10-19. The new `scripts/reference-rng/item7b-fixtures.json.gz` contains **1004 original-function cases**, supplementing the unchanged **2000 item7 cases**. Both generators execute private APK Lua in LuaJIT with JIT enabled and disabled and require identical decoded outputs. Source hashes are checked before execution. The private source is never written into repository resources. The source functions are loaded unchanged; application constructors and UI services are harness stubs.

`tests/core/item7b-native-contracts.test.js` adds17 tests; together with the existing6 native item7 tests: **23 PASS,0 FAIL,0 SKIP** when private-source environment variables are supplied. The existing2000 fixture file was independently regenerated and compared byte-for-byte. The new1004 fixture file has an automated byte-for-byte regeneration check.

## Reproduction

Run from the repository root. Paths below identify the source/toolchain available in this working session and are not release dependencies.

```sh
export NATIVE_APK_ASSETS=/workspace/scratch/2c556ddf4f1c/reference-apk/assets
export NATIVE_LUAJIT=/workspace/scratch/2c556ddf4f1c/toolchains/LuaJIT/src/luajit
python scripts/reference-rng/generate-item7b-fixtures.py --assets "$NATIVE_APK_ASSETS" --luajit "$NATIVE_LUAJIT" --output /tmp/item7b-native.json.gz
cmp /tmp/item7b-native.json.gz scripts/reference-rng/item7b-fixtures.json.gz
python scripts/reference-rng/generate-item7-fixtures.py --assets "$NATIVE_APK_ASSETS" --luajit "$NATIVE_LUAJIT" --output /tmp/item7-native.json.gz
cmp /tmp/item7-native.json.gz scripts/reference-rng/item7-fixtures.json.gz
node --test tests/core/item7-native.test.js tests/core/item7b-native-contracts.test.js
```

Without both environment variables, only the private regeneration test skips; all committed-fixture comparisons run normally. The test requires Python and the private original source only for regeneration.

## What the new oracle proves

| Area | Original functions and observations | Runtime comparison |
|---|---|---|
| All43 item7b identities | Unchanged `set_ability` and main callback, debuffed/active defaults | Numeric main effects and creation callbacks; the manifest assertion is identity coverage, not a claim that every effect branch is exercised |
| 8 Ball, Hallucination | Probability samples immediately below/at1/4 and1/2; owned/copied/debuffed;0/1/2 occupied consumable slots | Exact creation set/suffix/count; Hallucination uses a real runtime seed in the oracle's matching probability half |
| Cartomancer, Riff-raff, Vagabond, Superposition, Seance | Original callback reservations and drained creation callbacks, copies and full-capacity suppression | Counts/sets; direct scoring callbacks also compare suffixes |
| Sixth Sense | Singleton6, copies/debuffs, full consumable capacity | Destruction return and created count, including destruction with no creation room |
| Caino, Glass, Hologram | Drained destruction/added-card callbacks; faces/nonfaces, copies/debuffs | Exact stored × counters |
| Gift, Invisible age, Campfire, Hit the Road | General endround copy/debuff guards and mutation | Stored resale/age/× counters |
| Mr. Bones |24/25/26 chips against100 target | Save return and scheduled removal at the quarter boundary |
| Chicot, Dagger, Madness | Boss/nonboss, neighbour eternal/noneternal, copies/debuffs | Boss disable and stored growth |
| Luchador, Diet Cola, Perkeo | Sale/shop exit original callbacks | Boss disable, Double-tag queue, creation count |
| Showman | Original `get_current_pool`, owned duplicate, source debuff, lock and ban combinations | Exact selected/fallback Tarot centre |
| Astronomer | Original `set_cost` with active/debuffed owner | Cost and resale of a Planet |
| To Do List | Matching before callback owned/copied/debuffed | Money delta |
| Burnt | Pre-discard, Hook and copy/debuff guards | Hand level delta; copied raw return also checked independently |
| Baseball | Original `other_joker` return at rarities1–4 | Ratio of integrated scored Mult with/without Baseball |
| Smeared | Original `is_suit` for all4 suits | Runtime suit predicate |
| Judgement | Original `can_use_consumeable` and `use_consumeable` at0/4/5/6 owned Jokers; active/debuffed Tarot | Availability, no creation at capacity, debuffed use, created count and original `Joker`/`jud` constructor arguments |
| Before ordering | Original inventory callbacks Midas→DNA, DNA→Midas, Vampire→DNA, Blueprint→DNA | Physical-copy enhancement, permanent bonus15 and Hologram growth |
| Round targets | Original4 `reset_*` functions, original pseudoseed/pseudorandom_element and actual LuaJIT PRNG |120 cases:20 seeds × unset/Spades prior Ancient ×3rounds; exact targets, keyed streams, four raw64-bit PRNG words |

The round-target oracle has **no owned Jokers**, deliberately scrambles array order against physical sort_id3/1/2/4, and excludes Stone. It verifies resets independently of ownership; an unset first Ancient can choose Spades. Runtime `onlyMissing:true` is checked to preserve all established targets and draw no RNG. The native reset functions are loaded from pinned `common_events.lua:2320–2373`.

The existing2000-case oracle supplies the broader scoring-rank/suit/probability matrix, per-card growth, main stored-counter profiles, ordered before transformations, discard changes and depletion branches for the item7b identities already present there.

## Limits

This is a callback/contract oracle, not a complete original-game simulation. Most chance branches use injected probability samples. The target-reset matrix alone restores original RNG functions and verifies exact PRNG state. Creation constructors record requests; they do not prove generated identity, constructor raw draws, animation timing or whole-game event ordering. Perkeo and Invisible duplication attributes and Certificate first-draw creation remain covered by separate integration/source review rather than a new full-constructor native fixture here. Judgement identity selection remains the shared shop/effect generation contract.

The FIFO queue drains original nested callbacks and applies returned8 Ball `extra.func` at effect application. It does not execute the full native `state_events.evaluate_play` loop. In particular, these fixtures do not claim native evidence for the newly reviewed8 Ball/Bloodstone pass chronology or Sixth Sense/Glass destruction chronology; those need the full scoring harness or separate integration/source review. The all43 manifest/default test must not be represented as complete positive/boundary coverage of all43 effects.
