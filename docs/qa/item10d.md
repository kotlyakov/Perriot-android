# 10г — испытания, 0.4.46-preview/code59

## Scope and evidence

All20 challenge configurations were checked against locally extracted research-only native `assets/challenges.lua`, `game.lua`, `functions/state_events.lua`, `common_events.lua`, `misc_functions.lua`, `cardarea.lua`, `card.lua`. Original source and assets are not distributed.

Targeted checks cover neutral challenge deck counters, exact starting inventory/flags/vouchers/deck distributions; all pool restrictions; scoring chips cap, discard debt, X-ray draw stream, permanent scoring-card debuff and physical copies, pinned reorder, signed LuxuryTax; profile exclusion, five-deck access gate, distinct completions, strict save/replay and tamper rejection. Lifecycle tests drive all20 through play/cashout/shop/next with resume after every action. Typecast, Double or Nothing and X-ray were also driven through Ante5 with legal high-level lifecycle fixtures.

Independent review identified two Important issues: challenge initial voucher drawn before bans/starting grants; Inflation missing voucher and booster opens. Both were reproduced by failing checks and fixed. Corrected Inflation includes free tag packs. Tests/core/challenge-review.test.js now passes with the full suite.

Local full `npm test`:1641total,1639PASS,0FAIL,2expected optional private-source skips. Android offline assets, standalone export, XML/security config and diff-check PASS. Local Chromium absent, browser download archives truncated; no local browser success claimed.

## Platform gate

Browser/Android CI, actual screenshots, APK signature/alignment and offlineasset byte comparison are pending. Physical Android installation/runtime not checked. Full native frame/event RNG parity is excluded: custom challenge decks use existing immutable physical identity order, with correct distributions and deterministic replay.
