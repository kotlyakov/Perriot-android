# Item6 — effect mechanisms implementation

User selected6 after completed5. Existing isolated workspace, feat/effect-mechanisms; local baseline c72b42e has same files as remote04f329cc. User/repository authorize implementation and established PR→apk-reference integration without repeated approval. Original APK rules take priority. No new design/UX decisions or dependencies.

## Scope and architecture

Complete concrete shared mechanisms required by the next catalogue stage: all4seals,3playing editions, held repetitions, central face accessor, bounded context copying, mutable lifetime and atomic playing-card creation/copy. Seven factual Joker consumers Mime/Pareidolia/Blueprint/Brainstorm/Seltzer/DNA/Marble (64/150 total),4sealSpectrals and Aura provide real acquisition/use paths. Other86Joker effects, fullSpectral/Standard/Arcana packs, stickers/stakes/profile, loss-saving/skip/shop consumer effects remain their numbered catalogue stages. The exhaustive native context map is a forward contract, not fictitious no-op handlers.

Specs: docs/apk-findings/playing-card-editions-seals.md; item6-effect-contexts.md. Preserve own artwork, accepted input and geometry, revision atomicity, frozen cashout, boss and legacy save contracts. Synchronous native scoring and explicitly admitted effect callbacks are the oracle boundary; frame/visual event RNG remains open.

Use existing score loops and reducer transactions. jokerEffectContext returns source/target/copied; modifiers are not copied. Playing edition after own enhancement, before individualJokers; Red beforeJoker repeats. Held repeats discover only after a nonempty own/individual pass. Gold money once/pass, Glass destruction once/card. DNA before creation must participate in samehand held phase; Seltzer decrements once after, copied context cannot decrement. Marble before blind draw. Shared capacity reservation for Blue/Purple.

New mutable6 actions require strict effectReplay transaction journal: one validated preplay snapshot without recursive journal/lastScore plus ordered accepted subsequent actions while lastScore persists. Replay full deterministic reducers and compare entire encoded state, so removed Jokers, generated cards, endround creations and RNG cannot bypass historical checks. Existing saves remain on existing strictscore decoder. Journal limits inherit2MiB payload and10000actions; reject overflow atomically, no truncation. New6 scored history without journal is rejected.

## Files and owners

Root: score.js/run.js/save.js/cashout.js/apk-deck.js/boss-effects.js; newjoker-lifecycle.js/effect-replay.js; orchestration/config/status. Research1: card-effects.js/apk-shop.js/consumables.js and ownnewtests. Research2: joker-contexts.js/card-faces.js/contentjokers and ownnewtests. Native: independent original-loop and lifecycle generators/fixtures/tests. UI: field/play/deck/scoreanimation/shopdescriptions/CSS and ownnewtests. No shared concurrent file edits.

## Tasks

- [ ] 1 Original source specs, pinned independent scoring/lifecycle fixtures, pure context/face contracts. RED1122native cases thenGREEN; copied/debuff/cycle/Mime/edition/seal source order, Stone RNG.
- [ ] 2 Scored/held engine integration and numericMoney/edition/repetition timing. Runnative1122plus existing687; retain old53legacy behavior.
- [ ] 3 Creation/lifetime integration: DNA/Marble/Seltzer; PurpleHook/normaldiscard, Blue/Gold/Mime/Red winsettlement before interest quote; foursealSpectrals/Aura and Death copying. Nativecallbackfixture checks plus rejectedaction purity/slot boundaries.
- [ ] 4 Strict mutable replay journal and schema compatibility; roundtrip played/discarded/sorted/won/lost/bossdisable/acknowledged; tamper marker/source/count/cards/RNG/lifetime/journal stripping fails.
- [ ] 5 UI ownart/independent modifiers/neutral held markers and normal acquisitions, mouse/touch/reduced/normal/reload/busy. Register browser suite.
- [ ] 6 Wholebranch independentreview, appropriate fixesRED→GREEN, fullnativecore, browserCI, freshAndroid/signature/alignment, APKassetcompare, PRmerge, update table and propose7only.

## Review focus

Original functions must generate expected behavior independently ofJS; cover copied mutations vsnativeguards, held empty-result discovery, rawrankgetter multiplicity, endround reservations, DNA samehand held andphysicalids, Seltzerremoval source snapshots. Replay must reject unknownkeys/recursivehistory/nohistory/tamperedendpoints and preserve lateractions without paying twice. Unsupported consumercontent stays closed; no claimfullgame/frameparity.
