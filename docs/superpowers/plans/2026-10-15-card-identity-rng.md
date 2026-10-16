# Numbered item 4 — physical card identity and Stone RNG

User selected item 4; implement only this scope. Existing isolated workspace, native implementation with independent research/review. No additional content from items 5–6.

**Goal:** Preserve physical creation order across face changes, copies, destruction and reload; establish executable evidence for Stone RNG before admitting dependent effects.

**Architecture:** Retain original 52 IDs and their recoverable ASCII creation order. New physical copies use a reserved `card_created_<ordinal>` ID and explicit matching `creationOrdinal`, with a monotonic `nextPlayingCardOrdinal`. Death changes face fields only. Existing saved original cards need no byte rewrite; unknown legacy IDs without provable order reject. Shared identity ordering drives shuffle, Hook and Bell. The codec validates issued identities against active/destroyed cards and checks Glass snapshots consistently.

**Reference:** `docs/apk-findings/retrigger-jokers.md`; private native Card:init, copy_card and creation sites. Original assets remain outside the repository. No new dependencies, unchanged UI and supported catalogue53/150.

## Tasks

- [x] Independent native research: Stone getter chronology, actual phase fixtures and update-loop limitations. Do not claim whole-APK raw-state parity from isolated predicates.
- [x] RED/GREEN: physical identity allocator/order, saved copies and destruction, legacy52 and invalid identities. Files: `src/core/apk-deck.js`, `src/core/boss-effects.js`, `src/persistence/save.js`, new `tests/core/playing-card-identity.test.js`.
- [x] Shared helper supports new physical identity allocation only; creating cards through unimplemented content remains unavailable. Verify Death, Hook, Bell, Glass and subsequent shuffle/reload without enabling that content.
- [ ] Implement only RNG chronology justified by executable native evidence. If native frame-driven RNG prevents a defensible complete contract, record a concrete blocker and leave item4 open rather than invent call totals.
- [ ] Full core/native checks, independent review, source publication and platform CI for production changes. Update STATUS/ROADMAP/backlog/progress and numbered table truthfully. Item5 waits for user's selection.

## Review focus

No ID reuse after removal; no ordering inferred from display or changed faces; unknown legacy identity fails closed; historical Glass snapshots preserve identity; malformed identity counter cannot authorize gaps. Frame-driven Cloud9 updates cannot be passed off as deterministic action-level raw parity.


## Action contract established16.10

`play-score-v1` covers authoritative preplay career queries, Hook choice when applicable, native recognition getter chronology, admitted synchronous individual/held effects and Lucky/Glass rolls. It uses a single APK RNG accumulator and records before/after plus ordered draw provenance. Legacy scores without this record use legacy replay, never guessed historical draws. Existing render previews stay pure. Whole frame/event parity is explicitly still open in П-RNG-STONE; no arbitrary Cloud9/frame ticks or fake preview consumption are introduced.354 original scoring cases/3identityseeds reproduce independently. Native setup hooks Mark/Plant remain outside this synchronous contract.
