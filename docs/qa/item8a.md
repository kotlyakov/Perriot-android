# Item 8a — Arcana packs

Approved by user 19 October 2026: implement Tarot packs only, then report and APK. Base: merged item7b PR35, d4b3792. Branch feat/item8a-arcana, candidate 0.4.40-preview/code53.

## Implemented scope

All eight Arcana identities: normal 3/1, jumbo 5/1, mega 5/2. Existing independent 140-case generator is reused without narrowing pools: all22 Tarots plus rare Soul. Soul supports all five legendary Jokers and existing native edition/duplicate/banned/locked/fallback rules. Omen Globe remains atomically blocked until item8b Spectral effects; no replacement pool.

Open charges exactly once, resolves Hallucination before delayed generation, persists cards/RNG and draws actual deck-tail targets without shuffle. Use applies immediately, with actual inventory slot capacity for pack generators. Mega preserves hand, effects and second choice through reload. Owned consumables can be used without spending pack choices. Return prepends reversed hand (native hand-to-deck order), preserving existing deck tail. Red Card receives skip once. Sort/reorder work for target hand; gameplay actions stay unavailable. Hanged Man notifies Canio/Glass, records permanent destruction without round shortfall, including a prior round's already consumed shortfall.

Existing pack screen reused with Russian Tarot title and visible target hand, using approved card visuals. Card capability controls use action. Persistence errors leave prior durable state and visible screen unchanged.

## Source evidence

Original APK extracted outside repository. card.lua:1694–1786 open/generation,1786/2339 Hallucination timing; game.lua:3720 and state_events.lua:376 hand draw; button_callbacks.lua:2365 use/choices,2693 and state_events.lua:1142 return; cardarea.lua:35/66 prepend/removal. Pool usage card.lua:352/4833. Soul specifics: docs/apk-findings/soul.md.

714 native Soul fixtures (102seeds×7contexts) compare exact identity, edition, eternal flag, keyed streams and following raw draws; all five legends, fallback and all five editions. Harness invokes original get_current_pool/create_card/poll_edition with explicit rendering-free constructor/juice adapter. Fixture regeneration byte-identical. Original Lua/art/APK are excluded from release.

## Review and verification

Initial nine Arcana lifecycle tests failed unsupported open (RED), then passed after implementation. Added all22Tarot+Soul use, actual slot, native return order, Red Card, full/short/empty deck, owned use and context suppression regressions. Independent review found an Important stale consumed Hanged shortfall epoch across round→pack destruction. Reproduced RED; obsolete consumed epoch removed on subsequent pack destruction, GREEN. No other confirmed Critical/Important findings reported; final re-review passed through both pack and owned-consumable paths.

Final validation: local1372/1372 corePASS0skip with both private source oracles; CI39270148693 SUCCESS at source e74b71a46fa5789b3f6336b780b4a75355828c0a, tested merge994f8a437a8b2c29d9cdf387251cf099e31e554e (0file differences). CI1369PASS/2expected private-source skips;44Chromium suites PASS; freshGradle, officialapksigner/16KBalignment PASS. Screenshot desktopMega reload, mobile915×412, target/use and persistence failure inspected. All69offline APKassets byte-match source. APK0.4.40-preview/code53, artifact12195183891, SHA256e4436be780452a482286250c6d226eef2272e85e068341147ff03a8a9cac95d7. Debug certificate801998e5656bb9aa68f0ea0e9bbab0d206cf3a9bdea01f79183519121d3022cf differs from0.4.39; in-place update unavailable, uninstall erases local progress. Physical Android not checked. Full event/frame/audio RNG parity and profile discovery/unlocks are outside this slice; native frame-dependent opening animation is outside the generator boundary. Existing ability to skip an empty-hand pack is retained to avoid a native progress trap. Item8b not started.

First CI39269776807 failed on incorrect isVisible assertion for zero-sized #hand container despite successful target interactions. Regression now checks actual interactive card surfaces, viewport bounds and hit testing on desktop/mobile; full repeat39270148693 passed. Soul tooltip was separately fixed RED→GREEN to describe legendary creation.
