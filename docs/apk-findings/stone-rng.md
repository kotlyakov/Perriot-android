# Stone raw RNG: verified native phases and scope limits

Research date: 2026-10-15. Applies to selected plan item №4, current 53 native supported Jokers. No retrigger Joker from №5 is implemented or admitted here.

## Executed independent oracle

`scripts/reference-rng/generate-stone-fixtures.py` loads original private `card.lua`, `game.lua`, and `functions/misc_functions.lua`; creates minimal cards/globals; executes the original `evaluate_poker_hand`, `Card:get_id`, `Card:is_face`, `Card:calculate_joker`, native Lucky getters and the exact extracted Cloud9 update branch. It imports no production JS behavior. Original Lua text is loaded transiently, never copied to repository fixtures. Numeric fixtures contain source hashes.

Command:

```sh
python scripts/reference-rng/generate-stone-fixtures.py \
  --assets /workspace/scratch/2c556ddf4f1c/reference-apk/assets \
  --luajit /workspace/scratch/2c556ddf4f1c/toolchains/LuaJIT/src/luajit \
  --output scripts/reference-rng/stone-fixtures.json.gz
```

Result: **1407 cases**, each executed with JIT on and off, structurally identical outputs. Cases: 90 recognition, 1272 individual Joker contexts (53 × 2 areas × 2 card debuff states × 2 Joker debuff states × 3 raw seeds), 24 Cloud9 update schedules, 6 career-face probes, 15 prescribed mixed draw sequences. Raw seeds: 42, 1, 918273. Mixed keyed draws use run seed PIERROT1. Each consuming case records exact raw state before/after and chronological integer/float draws. Nonconsuming cases omit redundant states.

This is a **function/phase oracle**, not integrated `state_events.lua` execution, not an installed APK, not a complete score/round/save replay proof. Individual-play probes of a debuffed card intentionally test the function in isolation; the real outer scoring loop would skip that query. Mixed probes prescribe method order explicitly and are not evidence that native event scheduling uses any arbitrary chosen order.

## Exact native getter behavior

`card.lua:958–970`: a non-vampired Stone `get_id` draws one integer100..1000000 from unkeyed `math.random` and returns its negation. The debuff state does not suppress `get_id`. `is_face()` returns early on debuff; otherwise it calls `get_id` exactly once. `is_face(true)` ignores the early debuff check. Native vampired transitions remain unsupported.

`functions/misc_functions.lua:397–405,594–610`: recognition calls `get_X_same` for 5,4,3,2, in that order. Each helper traverses outer indices n..1, inner1..n, evaluates both getters **before** testing `i ~= j`, then conditionally calls the first card's getter when `#curr == num`. Native `get_straight` calls one getter per card when n>=5 (or n>=4 with active Four Fingers). `get_flush`, `get_highest`, and the Royal Flush check do not add Stone getters for the exercised admitted hands; Stone cannot form a straight.

Measured recognition with one Stone, distinct other ranks:

| Played count | Without Four Fingers | Active Four Fingers |
|---|---:|---:|
|1|8|8|
|2|16|16|
|3|24|24|
|4|32|33|
|5|41|41|

The fixtures include every Stone count1..n at each n1..5, not just one Stone. **8 × n × StoneCount plus straight getters is not a universal semantic replacement**: independent random negative IDs can collide between two Stone comparisons. A collision can alter `curr` and trigger an extra getter. Preserve native short-circuit and loop chronology, or explicitly define/justify a narrower deterministic action contract. Numeric Stone ID values cannot safely be cached once per card: the native getter resamples each call.

`state_events.lua:499–505`: before moving played cards and before recognizing the scored hand, each played card's career-stat `is_face()` query adds one Stone draw unless card debuffed. These calls occur even when the eventual whole hand is boss-debuffed. Recognition also occurs before whole-hand rejection.

## Current 53 Joker queries

The following are the only nonzero individual-query counts observed across **all53 current native keys**. Counts are per Stone per active Joker evaluation, not whole-hand totals.

| Phase | Native Joker key | Stone draws |
|---|---|---:|
|Scored|j_scary_face|1|
|Scored|j_smiley|1|
|Scored|j_scholar|1|
|Scored|j_walkie_talkie|2|
|Scored|j_even_steven|2|
|Scored|j_odd_todd|3|
|Scored|j_fibonacci|5|
|Held|j_baron|1|
|Held|j_shoot_the_moon|1|

All other53-key individual probes draw0. Debuffed Jokers draw0 in both contexts. Scored card debuff is an **outer** guard; held cards have no corresponding blanket skip: native Baron/Moon query `get_id` even on a debuffed held Stone. Raised Fist inspects `base.id` and enhancement, so it draws0. Suit predicates draw0. Supported before/main/after/end-round effects have no additional Stone `get_id` branches in their inspected native calculations; this last statement is source inspection, not an executed full phase loop.

For raw seed42, the first five integer draws are956084,9054,538647,434170,719753 (native Stone returns negatives). Fibonacci consumes all5. Odd Todd's native `<=10`, `>=0`, then Ace fallback consumes3, despite yielding no effect. A blanket Stone exclusion before these predicates preserves score but loses raw state.

## Why whole-APK raw parity is wider than scorer parity

1. **Cloud9 updates are frame-sensitive.** `card.lua:4129,4194–4198` recalculates its tally by invoking `get_id` on every playing card during every `Card:update` in RUN. The branch has no Joker-debuff guard. For2 Stone cards, native branch schedules0/1/2/5 updates consume0/2/4/10 raw draws, identically for active/debuffed Cloud9. The tally remains numerically correct while raw state differs.
2. **Selection previews consume RNG.** `cardarea.lua:164` calls `G.FUNCS.get_poker_hand_info(self.highlighted)` from `parse_highlighted`. Selecting/deselecting cards invokes recognition before the actual play; different UI selection histories therefore consume different raw Stone draws.
3. **Boss hooks consume RNG.** Mark's `stay_flipped` and Plant's `debuff_card` use `is_face(true)` (`blind.lua:614,630`), drawing even on debuffed Stone. These run at lifecycle boundaries outside the scorer.
4. **Keyed draws reseed raw state.** Native `pseudorandom` reseeds global `math.random`. Stone before a later Lucky/Glass keyed draw does not alter that keyed result; Stone after the last keyed draw changes final raw state. Mixed fixtures prove this ordering. With PIERROT1, glass roll0.31775181164720245; immediate next Stone ID−126638. Lucky getters then immediate Stone ID−812975. Stone first from raw seed42 is−956084.

Therefore a frame-independent engine cannot honestly promise full APK raw state equivalence without a specified update/UI scheduling contract. Do not silently introduce arbitrary per-action Cloud9 update counts and call them native parity. Raw scope must be documented alongside the action contract and persisted result provenance.

## Minimal implementation interface and acceptance plan

1. Retain a **single chronological APK RNG accumulator** inside a scored action. Expose internal `stoneId(card, phase)` (returns a fresh negative integer), keyed `roll(key, phase)` and immutable snapshots. Use existing `nextApkMathRandom`/`nextApkRandom`; no new random algorithm is necessary. Record raw before/after and per-phase provenance when state is consumed.
2. Recognition needs an optional rank-getter hook, not only options that skip Stone. Preserve the actual native getter loop and conditional evaluations for Stone-bearing hands. Ordinary rank grouping can keep its current cheap path. Do not let render-only hand previews mutate authoritative engine state implicitly; decide and document their contract first.
3. Career preplay calls, scored individual predicates and held Baron/Moon must advance that same accumulator in order, including failed predicates. Existing separate Lucky/Glass local forks and run.js's per-field overwrite cannot represent intervening Stone draws faithfully. Return one action-level RNG result; historical Lucky/Glass field summaries may remain diagnostic, not competing owners of raw state.
4. Score/save replay must use the same chronology, played/held order, boss-debuff snapshot and Joker order/debuff states. Legacy score results lacking required provenance need a migration or explicit unverified/blocked rule; do not manufacture old draws from current card arrangement.
5. Verify against native function fixtures first, then add **extracted actual scoring-loop** fixtures including Stone-only, boss hand rejection, Stone/Fibonacci, duplicate/reordered Jokers, held debuffed Baron/Moon, Stone before/after Lucky and after Glass. Check reload/replay and raw-state tampering. Native redraw/Mark/Plant/Heart/Bell behavior must be bounded/tested separately. Current function oracle does not close that acceptance gate.
6. №5 retrigger work adds further get_id queries (Hack4, Sock1) and repeated individual effects. It remains a later item; nothing in this research enables those Jokers.

Production files were not modified by this research. No build or application tests were claimed for it.


## Actual synchronous native scoring oracle (completed 2026-10-16)

`generate-stone-score-fixtures.py` executes the **unchanged original complete `G.FUNCS.evaluate_play` function body**, original `get_poker_hand_info`, `eval_card`, native Card getters/Joker functions, plus the original preplay sort and career loop extracted specifically from `play_cards_from_highlighted`. No JavaScript scorer is imported. It prepares deterministic Stone/Steel/Driver/Stencil/Swashbuckler tallies by executing their original update branches once before the measured interval; Cloud9 update is deliberately excluded. Native score-time `hands_left=0` represents the last hand after the preplay decrement (engine preplay input is one remaining hand).

```sh
python scripts/reference-rng/generate-stone-score-fixtures.py \
  --assets /workspace/scratch/2c556ddf4f1c/reference-apk/assets \
  --luajit /workspace/scratch/2c556ddf4f1c/toolchains/LuaJIT/src/luajit \
  --output scripts/reference-rng/stone-score-fixtures.json.gz
```

**354 cases**, each JIT on/off identical: all played sizes/Stone counts, all current 53 native Joker keys individually, reversed mixed Joker orders, duplicate Fibonacci and mixed positional Stone/Lucky/Glass permutations with Splash ensuring the Lucky/Glass cards actually score. Includes three raw seeds, three keyed run seeds, card/Joker/held debuffs, Four Fingers and whole-hand rejection. There are 36 cases with shattered Glass. Inputs are `playedSpecs`, `heldSpecs`, `jokers`, `options`; outputs contain recognized native hand, sorted played/scoring IDs, chips/mult/floor score, destroyed IDs, keyed streams, raw before/after words and chronological native integer/float draws. `evals` records actual context visitation; phase labels are diagnostic only. Played input specs are intentionally in reverse spatial order to verify original sorting.

UI/visual helpers are inert adapters. Events are queued **without executing their callbacks**; unlock/profile helpers are inert; no render frames, selection previews, or boss lifecycle effects run. The blind adapter only supplies explicit accepted/rejected-hand behavior and identity hand modification. Therefore this is an executed synchronous scoring/career chronology oracle, including final Glass roll and before/main/after contexts, **not complete APK event/render parity**. Money is recorded as requested pending additions, not native delayed balance settlement. Fixture score totals and raw draws are valid within this explicit contract. No claim is made that arbitrary UI histories end at the same raw state.

Both Stone fixture generators support deterministic gzip (`mtime=0`, built-in Python gzip); repeated native regeneration produced byte-identical `.json.gz` outputs. Numeric fixtures only are retained; no proprietary Lua source is copied into the repository. Parse with built-in Node `gunzipSync` followed by `JSON.parse`.
