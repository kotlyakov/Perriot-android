# Task1 — independent oracle and finite target contract

Status: DONE_WITH_CONCERNS. Branch `feat/showdown-lifecycle`, starting commit `83a2a4f`.

## Implementation and files

- `scripts/reference-rng/generate-showdown-fixtures.py`: own Python extraction/generation tool. Reads original private assets, writes extracted Lua only in a removed temporary directory, imports no JS gameplay code, executes pinned LuaJIT with JIT off/on and requires identical outputs.
- `scripts/reference-rng/showdown-fixtures.json`: own numerical/identity output and source hashes. Three run seeds; 0/1/2/5 Jokers; both creation/display orders for Acorn; Bell initial/play/discard/already-forced and empty terminal case; Heart initial/play/discard/old-disabled/preexisting-debuff exclusion; five disable hooks; default targets and 1.5x/6x multipliers at every Ante1–39. Records named streams and four final raw PRNG words, plus facings, forced IDs and debuffed IDs.
- `tests/core/showdown-oracle.test.js`: canonical choices and Acorn order/RNG checked against independent native output. Setup sequence includes own keyed stochastic setting_blind probe, native nr8 deck shuffle, then three Acorn shuffles. Full named stream state and raw math state are compared, including one-element choice consumption and zero-Joker/no-discard Heart consumption.
- `tests/core/endless-targets.test.js`: all finite base/Big/6x targets, native multiplication-before-BigInt rounding, explicit Ante39NaN boundary, validation, target-only showdown calculation and disabled low-Ante Vessel.
- `src/core/blind-progression.js`: `nativeBlindTarget(ante,multiplier=1)` reproduces the native default binary64 formula and two-significant-digit truncation; permits finite integer Numbers above 2^53, multiplies before BigInt conversion; `blindBase` delegates with multiplier1.
- `src/core/boss-effects.js`: `bossTarget` delegates to shared target helper, including 2x disabled Vessel; adds immutable `chooseBellCard`, `chooseHeartJoker`, and `shuffleAcornJokers`. Joker helper inputs require unique persistent `creationOrdinal` and identity; Heart uses JS `debuffed` metadata. Zero Jokers return `{jokerId:null,rng}`. Empty Bell/candidate pools reject explicitly.
- `src/core/shop.js`, `src/core/skip-blind.js`: root-authorized minimal Big-target call replacements with `nativeBlindTarget(ante,1.5)`.
- `tests/core/expanded-boss-effects.test.js`: root-authorized replacement of obsolete target-only rejection assertions. Existing showdown/Ante9 admission exclusions are unchanged.

## Executable source boundary and setup order

Original hooks extracted: `Blind:press_play`, `drawn_to_hand`, `disable`, `debuff_card`; original Acorn `set_blind` region; native RNG/shuffle/element/default target functions; native `CardArea:shuffle`; original `state_events.lua:354–365` setup callback; whole original `engine/event.lua` and original `common_events.delay` temporarily loaded.

The oracle uses original `Event` and `EventManager` blocking/delay handling, explicit increasing REAL/TOTAL clock (1/60 ticks), and an own minimal Object class adapter. Own CardArea/highlight/flip/debuff/creation-ID adapters omit rendering; sounds, wiggle and HUD text are inert. `set_blind` initialization is supplied explicitly with its original Acorn region executed; this is not execution of the whole HUD-dependent `set_blind` method. Stochastic setting_blind probe is adapter-owned, not a claimed native Joker implementation.

Verified order: `set_blind` queues the Acorn outer callback; setting_blind Jokers run synchronously; native delay/nr8 callback is queued; Acorn outer callback appends the three shuffle events behind the pending nr8 callback. Thus actual RNG order in this extracted setup is setting_blind probe → nr8 deck shuffle → aajk shuffle1 → shuffle2 → shuffle3. Each Acorn shuffle re-sorts creation IDs. n<=1 consumes no aajk RNG; choice with one candidate consumes one keyed integer. Both interpreter/JIT results are identical.

## RED/GREEN and full verification

1. Native fixture generation:

   `python scripts/reference-rng/generate-showdown-fixtures.py --assets /workspace/scratch/2c556ddf4f1c/reference-apk/assets --luajit /workspace/scratch/669d7c37bc9d/private-apk-research/LuaJIT-43d0a19158ceabaa51b0462c1ebc97612b420a2e/src/luajit --output scripts/reference-rng/showdown-fixtures.json`

   PASS, JIT/interpreter equal. Final generated version includes original event classes/clock and facing output; no private source retained.

2. RED before production changes:

   `node --test tests/core/showdown-oracle.test.js tests/core/endless-targets.test.js`

   10 tests, 0 pass, 10 fail. Expected missing nativeBlindTarget/choice/shuffle helper assertions and preexisting Unsupported boss target. Output `/tmp/showdown-task1-red.log` is scratch-only evidence. The wrapper's trailing cat exited0; the embedded test run recorded10 failures.

3. GREEN after implementation, repeated after final fixture facing-output enrichment:

   Same focused command: 10 pass, 0 fail, 0 skip.

4. Full suite once after all production changes and final generated fixtures:

   `npm test`

   874 tests: 873 pass, 0 fail, 1 skip; 1962ms. The sole existing optional skipped test is `cashout helper agrees with native APK tally, get_id and calculate_dollar_bonus methods`: worktree-relative private APK source path is unavailable (`Private APK source and verified LuaJIT required for native oracle`). Root baseline confirms it passes with the original source path. Full output `/tmp/showdown-task1-full.log` is scratch-only.

5. `git diff --check`: clean. No UI, scoring, payout, admission, artwork, geometry, save schema or publication modifications. No dependencies added.

## Self-review and remaining concerns

- Compared every Ante1–38 base, native1.5x and native6x output, including modulo/log10/power rounding; confirmed Ante39 is nativeNaN. No safe-integer target rejection or geometric substitute. Ante validity still requires a positive safe integer (the ante counter, not target).
- Checked every caller of blindBase/bossTarget before changes; both Big callsites now share multiplication-before-conversion. Existing module cycle blind-progression/boss-effects gains a reverse import but all accesses occur inside functions after module initialization; focused and full imports/tests pass.
- Choice/shuffle helpers do not mutate inputs. Persistent Joker identities are validated. Unsupported ambiguous creation order rejects rather than inventing order. Showdown admission remains unchanged until Task2.
- Ante39 nonfinite durable handling is deliberately incomplete and belongs to Task6. `bossTarget` disabled Vessel currently recomputes multiplier2; high-Ante native `(base*6)/3` double rounding can differ from `base*2`, and Task6 owns the exact disable-division treatment. This task does not claim those boundaries completed.
- Empty Bell native execution consumes its seed/raw draw and then errors; helper rejects before returning an invalid identity/RNG result. Fixture records the native terminal state, but no successful durable empty-hand path or invented fallback is asserted. A fully debuffed multi-Joker Heart candidate pool likewise rejects; stable eligible/zero-Joker cases have exact fixture parity.
- Plain52 canonical card identities (including modified faces) remain the Bell verified scope. Newly created duplicate physical card IDs need the existing broader persistent creation-ID work, outside this helper task.
- Native x64 pinned upstream LuaJIT and extracted event queue are independent executable evidence for stated boundaries, not Android execution or complete native parity. HUD events, full setup-Joker methods, scoring/animations/profile progression and whole-game timing are not executed here.
