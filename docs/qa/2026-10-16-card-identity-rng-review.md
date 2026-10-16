# Item 4 independent review — 2026-10-16

Verdict: **no remaining Critical or Important findings in the reviewed change**. This is a review of the current uncommitted item 4 implementation, not approval of whole-game completeness or whole-APK raw RNG parity. No production files were edited by the reviewer.

## Reviewed boundaries

- Physical identity allocation, immutable creation order, monotonic issuance and destroyed identities; original-card legacy ordering; generated Glass snapshots; Death, shuffle, Hook and Bell consumers.
- Stone recognition getter chronology, career queries, supported scored/held Joker predicates, shared Lucky/Glass accumulator and action provenance.
- Persistence replay, precise action endpoint and subsequent Heart/Bell/Wheel transitions, later discards, Hook restoration and legacy action-less score replay.

## Findings resolved during review

1. **Important — Hook career ordering.** Initial implementation performed Hook's keyed choice before Stone's career query. Original `state_events.lua` performs career queries before `blind:press_play`; Hook's reseed must occur between career and recognition. The implementation now performs this order and records Hook's historical held/discard context. Independent numeric replay confirmed career → Hook reseed → eight one-Stone recognition draws and the exact final RNG state, followed by successful serialization/reload.
2. **Important — rejected Stone hand after Hanged Man could not save.** With Psychic, destroying one held card and then playing one Stone produced a legitimate rejected hand whose `scoringPilesBefore` omitted the consumed shortfall epoch. Strict replay then expected a full hand and rejected the save. The rejected-hand branch now retains the same shortfall facts as ordinary scoring. The reviewer independently repeated both one-card and two-card Hanged destruction → Psychic rejection → reload → discard → reload; all passed after the fix.

## Independent executed evidence

- Fresh targeted run: **84 tests passed, zero failed, zero skipped**. Files: `playing-card-identity`, `stone-action-rng`, `showdown-heart`, `showdown-bell-acorn`, `wheel-polychrome`, `justice-glass-card`, `normal-boss-lifecycle`, and `expanded-boss-effects` core test suites.
- Regenerated **354 native synchronous scoring cases** using the private original sources and LuaJIT, with JIT on/off equality enforced by the generator. The independently generated JSON matched the decompressed repository fixture byte-for-byte.
- Independent Hook endpoint and one/two-card Hanged/Psychic scripts described above passed.
- `git diff --check` passed.
- The lead separately reports a fresh full run of **983 passed, zero skipped** with the required LuaJIT oracle enabled; that full-run result is attributed to the lead, not to this reviewer.

## Limits that must remain visible

The verified RNG contract is synchronous authoritative play/score chronology. Render-only selection previews and frame/update scheduling are excluded; Cloud9 updates and broader Mark/Plant lifecycle raw RNG are not established by these fixtures. The native oracle does not execute queued event callbacks or a whole installed APK. Hook's specific boundary is additionally checked by source chronology and an independent numeric replay, not by the synchronous scoring oracle itself.

Action-less legacy scores retain the previous no-Stone-draw replay contract. They do not reconstruct missing historical raw provenance. No new retrigger Jokers, content generators, seals or other item 5/6 content are enabled by this review.

Browser/Android CI and physical-device verification are separate release gates and were not executed by this reviewer.
