# Independent scored retrigger review — 2026-10-16

Reviewed the dirty implementation over `42013cdaad167772f15b16075bb7a1abea71789c` on `feat/scored-retrigger-jokers`. Read-only product review; no production edits, release, or publication. Scope: Dusk, Hack, Sock and Buskin, Hanging Chad, their native oracle, ordered score trace, persistence and animation. The plan, source findings and SDD progress ledger were read.

## Findings

**No Critical or Important defect reproduced.**

Minor evidence hardening: `generate-scored-retrigger-fixtures.py` records private input file hashes but does not assert a pinned hash or explicit extraction segment hashes before execution. Its source anchors and Lua compilation detect missing/broken extraction, but a different compatible source could generate new expectations without failing. The oracle test also does not assert the fixture's source metadata. This did not invalidate this review's result: the supplied original assets regenerated the committed gzip byte for byte, and the extracted original bodies were independently inspected. Consider a pinned-input assertion and source-metadata assertions before future fixture regeneration.

Minor test wording: the Leaf sale regression still says “current53” although its assertion and tested iteration now cover 57.

## Independent verification

- Ran `node --test tests/core/scored-retrigger*.test.js tests/core/showdown-heart.test.js tests/core/showdown-bell-acorn.test.js tests/core/showdown-leaf-vessel.test.js tests/core/magician-lucky-card.test.js tests/core/justice-glass-card.test.js tests/core/save.test.js`: **111 passed, 0 failed, 0 skipped**.
- Regenerated `/tmp/retrigger-review.json.gz` using the supplied private assets and pinned LuaJIT. The generator executes both JIT and interpreter and asserts equal output. `cmp` against `scripts/reference-rng/scored-retrigger-fixtures.json.gz` succeeded. All 687 comparisons ran in the targeted tests.
- Inspected native `state_events.lua` extraction: original `get_poker_hand_info` and entire `evaluate_play` body (the extraction continues to the next `draw_from_play_to_discard` definition), original `eval_card`, original Card methods/ability initialization, native recognition, original career face pass and positional sort. The scorer loops were not rewritten into fixture arithmetic. No JS scorer imports generate expectations.
- Independently exercised 132 additional valid before-save → accepted play → after-save cases over 22 bosses, with six Lucky/Glass/Stone rotations and last/earlier hand boundaries. All 132 accepted resulting states reloaded. Initial exploratory Serpent/Ox fixtures at ante3 were refused before play, so those refused setups are not counted as verified cases or defects.

## Correctness inspected

The queue is built once per active scoring card in owned Joker order; Chad contributes two extra entries and retains the original first scoring identity even when that card is debuffed. Dusk uses pre-play handsRemaining=1. Each queue entry reevaluates own effects and scored individual Joker effects; held, independent, Joker editions, counters, and destruction remain outside the queue. Stone Hack queries consume four raw draws and Sock one, guarded by both source and playing-card debuff boundaries. Lucky rerolls each pass and Glass rolls once per active scoring card.

New APK repeater actions carry chronological actionRng before/after evidence even without Stone. Hook is resolved once at the scorer boundary. Replay compares the complete ordered marker/numeric trace and RNG evidence, reconstructs score-time Heart flags, and authenticates later Bell/Heart/Wheel endpoints. Marker fields are exact and nonnumeric. Lucky row count is bounded by trace length and then checked against exact recomputation; repeated row IDs are supported. Legacy effects RNG shares Lucky → Glass chronology only for new repeater content, preserving the previous content's legacy replay path.

Static UI inspection confirms `repository.save(result.state)` precedes scoring animation; state is assigned before marker animation; the existing busy guard covers control entry points. The explicit score_repeat branch runs before numeric handling and cannot change the HUD. Source IDs identify both playing card and Joker. Normal catalogue admission uses the unchanged native lock context; no general career unlock implementation is claimed.

## Limits

This review does not claim a local browser pass. The registered browser suite and CI browser/Android checks remain root integration gates. The native fixture intentionally does not execute deferred Event callbacks, full frame updates, previews, unlock progression or boss lifecycle adapters; it proves synchronous scoring/getter chronology for its admitted cases, not complete APK gameplay.

Inherited safety limits remain 2 MiB serialized payload, 10,000 trace events and 2,000 action draw records. No gameplay/trace truncation was introduced. Extreme negative inventory can reach these ceilings; default/negative expansion stress coverage is being added by the integrator. Unsupported Mime, seals, copy Jokers and general career unlock progression remain outside this slice.


## Lead follow-up after review

Oracle source hashes now pinned before any private extraction. An altered-source probe first exited0 (RED), then was rejected with explicit source hash mismatch (GREEN). Correct source regeneration still byte-identical. Metadata assertions cover the five pinned source hashes, four native keys, original evaluate_play/JIT-on-off method and excluded callbacks. Stale current53 title corrected to current57; no gameplay change.
