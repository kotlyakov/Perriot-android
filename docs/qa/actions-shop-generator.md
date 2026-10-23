# Conditional shop producer — Actions checkpoint

Date: 2026-10-08. Tested source: `2ae77f8811eaac10074e8ac8eeb130936a882aa6`.

- Actions runs `37774584780` and `37774590241`: completed, success. Root fetched run metadata and decoded logs; both point to the exact tested source.
- Job `113302134659`: 155 core tests, 155 passed, zero failures.
- Ten browser suites passed: start-screen, browser, score-flow, card-visual, mobile-layout, deck-reference, typography, hand-gap, cashout-flow and cashout-review045. These exercise the existing application, not a new shop screen.
- Fresh native compilation: BUILD SUCCESSFUL in 1m58s. The workflow's APK signature/alignment verification and artifact upload completed successfully. This is the CI debug artifact, not a new stable-signed user release.
- Root reran all core tests locally: 155/155. Catalogue extraction from the private APK was byte-identical; native six-case fixture regeneration matched exactly.

Delivered code scope: complete factual selection pools and a pure conditional shop generator with 17 tests. Supported conditional first-shop/reroll offers, prices, editions, keyed state and native random state match all six fixtures. Public context validation and additional eligibility gates are covered.

The producer is not yet connected to run dispatch, save codec or the app shop renderer. The screen remains the 0.4.6 placeholder. Full effect handlers, purchases of all content, voucher redemption, pack opening, shop animation and following blinds remain open. No full-game parity or physical Android execution is claimed.

Working 0.4.6 checkpoint remains preserved at `legacy/v0.4.6-working`, source `73aefc017e2580817bd4efe4611f32022458f928`. No replacement user APK is delivered for this internal foundation-only change.
