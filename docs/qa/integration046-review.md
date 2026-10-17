# Independent integration review: 0.4.6

Scope: read-only review of current `src/core/run.js`, `src/ui/app.js`, start/blind/post-round modules, strict codec, repository/backend and shop actions. Reviewer did not modify production files. No actual browser or Android interaction was performed in this review; the local browser is unavailable/corrupt. UI observations below are code inspection, not visual acceptance.

## Verified by executed tests

`npm test`: **138 tests, 138 passed, 0 failed**. The previously reported missing `blind-select.css` export dependency was present by this run, and export-preview test passed. Integrated APK deck tests match recorded native first-deal and replacement order for each pinned seed. Legacy tests continue to pass, including old save roundtrip, score trace validation and repository recovery/concurrent-write cases.

## Code-path assessment

- Default `createRun` leaves original counter32 deck/effects behavior and legacy state keys unchanged. Only `referenceRng:true` adds the original snapshot and canonical creation shuffle. New UI runs explicitly request this option and remain in pending blind selection until START_BLIND.
- Continue uses the already-loaded state and only removes the start screen and renders. It does not dispatch START_BLIND, recreate RNG, redraw the hand, or regenerate shop data. This applies to pending, playing, won and shop states.
- A new run when current state exists first opens confirmation. `startFresh` calls the repository reset before replacing in-memory state or clearing selection/menu. Validation/write failure therefore leaves the current run in memory; the repository preserves healthy current bytes when a slot write fails, as covered by existing tests. No automatic reset is offered for corrupt/unreadable saves.
- During play/discard animation, only prior surviving hand cards are rendered. Added cards are not rendered into hand until outgoing/closing animations finish; then actual draw IDs animate into sorted final positions. Busy post-round rendering retains the active hand until animation finishes.
- Shop dispatch delegates to the transactional helper, and strict save fields retain offers/prices/RNG without factory calls. UI shop remains an explicitly labeled placeholder. These tests do not establish complete shop pool generation or full original lifecycle parity.
- Codec retains continuous-score recomputation and exact legacy JSON behavior, validates decimal/hex/metadata shapes and cross-zone identity uniqueness, and uses the nonadvancing original RNG validator.

## Remaining risks, reported to lead

1. Static resilience risk: `perform` awaits Web Animations `finished` promises without `try/finally`. An animation rejection/cancellation could leave the session busy until reload. This is an existing pattern, not a reproduced runtime failure in this review.
2. API input hardening: `referenceRng` is tested by truthiness rather than requiring a boolean. UI passes a literal true, so normal UI operation is unaffected, but malformed direct API options are accepted.

No concrete data overwrite before confirmation, failed-write advancement, or shuffle-on-Continue defect was found. Actual remote browser/native build results must be reported separately by the lead.
