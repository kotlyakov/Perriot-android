# 10г — испытания, 0.4.46-preview/code59

## Scope and evidence

All20 challenge configurations were checked against locally extracted research-only native `assets/challenges.lua`, `game.lua`, `functions/state_events.lua`, `common_events.lua`, `misc_functions.lua`, `cardarea.lua`, `card.lua`. Original source and assets are not distributed.

Targeted checks cover neutral challenge deck counters, exact starting inventory/flags/vouchers/deck distributions; all pool restrictions; scoring chips cap, discard debt, X-ray draw stream, permanent scoring-card debuff and physical copies, pinned reorder, signed LuxuryTax; profile exclusion, five-deck access gate, distinct completions, strict save/replay and tamper rejection. Lifecycle tests drive all20 through play/cashout/shop/next with resume after every action. Typecast, Double or Nothing and X-ray were also driven through Ante5 with legal high-level lifecycle fixtures.

Independent review identified two Important issues: challenge initial voucher drawn before bans/starting grants; Inflation missing voucher and booster opens. Both were reproduced by failing checks and fixed. Corrected Inflation includes free tag packs. Tests/core/challenge-review.test.js now passes with the full suite.

Local full `npm test`:1642total,1640PASS,0FAIL,2expected optional private-source skips. Android offline assets, standalone export, XML/security config and diff-check PASS. Local Chromium absent, browser download archives truncated; no local browser success claimed.

## Platform gate

Browser/Android CI, actual screenshots, APK signature/alignment and offlineasset byte comparison are pending. Physical Android installation/runtime not checked. Full native frame/event RNG parity is excluded: custom challenge decks use existing immutable physical identity order, with correct distributions and deterministic replay.

## Final platform verification — 23.10.2026

Actions39906363695 SUCCESS. Source d2b6c2d9a36f79b9160b2b41b2d1fff7cb873fad, tested merge86efcbaadb71c45c8689a26ae46970e709e636d9, tree73fbc5766d052457e77f3f61a6427dc16a619d0b equals the local tested tree. Core1642total/1640PASS/0FAIL/2optional skips; all50Chromium suites; fresh Android compile; v2 signature and16KB alignment PASS. Browser log confirms both restored-state suites first, then all48 retained/new suites. Profile/selection desktop+touch screenshots reviewed; no UI changes after those captures.

Additional native edge fixes: replacing enhancement ability clears permanent debuff (including same enhancement); Rich get Richer uses post-Tooth/Ox money. Both RED→GREEN and full core regression PASS. Browser recovery enters the restored run before dragging; old shop/blind fixtures compare deserialized game states rather than equating a legacy raw save with the new profile envelope. Write-failure tests still compare unchanged complete storage bytes.

APK artifact12481375576; Pierrot-0.4.46-preview.apk;1302612bytes; SHA256661893699d8695a7a7816d2745d6afe4f5aa828a39eac80b00b9de22610cbedb. CRC PASS and all90offline assets byteequal. Signer certificate SHA256a48864e760c54ccec508e6cb44fc32976265e42feeabcfefae9d60f66b815794. CI debug signing does not guarantee installation over older builds; no uninstall or physical-device installation performed. PR42 ready, not merged. Earlier pending sections above describe checkpoints, superseded by this result.
