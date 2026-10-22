# Item10b — eight cumulative stakes, 22.10.2026

All eight native stakes are selectable and saved. Red removes only Small blind reward; Green/Purple select the native target tables including Endless; Blue removes one base discard; Black/Orange/Gold enable Eternal/Perishable/Rental. Existing native shop/pack sticker polls remain unchanged. Perishable lasts five played rounds; Rental charges $3 per played round even on loss, after self-removal or while debuffed. Native per-owned-Joker end-round order precedes payout bonuses and interest. Copying retains current lifetime. Heart clearing preserves expired suppression; terminal Heart accepts all-debuffed inventory after expiry.

All stakes/decks remain explicitly preview-accessible until10c. Gold profile-based automatic Legendary starting-seed filtering belongs to10c; fixed seeded gameplay is unchanged. Challenges are10d. No new dependencies.

## Verification

Baseline1511PASS/0FAIL/2optional private-source skips. Local full suite1533PASS/0FAIL/2skips;22new tests PASS. Independent review and root rerun72passive/boss/payout/shop transitions PASS;4Ankh/Invisible live/expired copy cases PASS. New tests observed RED before implementation, then GREEN. CI39756907018 SUCCESS:1533corePASS/0FAIL/2optional skips,48Chromium suites desktop/touch, fresh Android compilation,apksigner andzipalign PASS. First CI39756138979:1533corePASS and new10b UI all4viewportsPASS. Existing showdown-selection test caught a terminal Heart badge regression; corrected to show boss suppression only during play, retain expiry outside play, and hide all suppression/stickers behind Acorn concealment. Old regression retained. Repeat CI39756907018 passed every retained regression. UI logic-only passes; physical Android and complete frame/event RNG parity are not claimed. Supplied native source was inspected; no new LuaJIT oracle execution is claimed.

Source d2323532a3810696af6cca76b7e179f2c396722c; tested synthetic merge1a4ccc10caa1eaef1acb8fef8c2d931003a741ad:0changed files.

## APK and visual acceptance

APK0.4.44-preview/code57. Artifact12417515349;79offline assets byte-equal locally generated assets, ZIP CRC valid. SHA256 `cd37a1fc6e4311190a43c3f92dfa3c21632fd227d9f4f29a4cbe61302bacf08f`.

Signer SHA256 `b9cb8ac0cb11f14128fe7f63546cb0d17f6680635071c7174ca1dd24c21c6e88`, differs from0.4.43 (`b1fb25e67aadf9407021e8f9746afed519c756242c189223edb6bc1b1e2155bb`). In-place update fails; deleting the old app destroys local progress. No deletion recommended or performed.

Final item10b-setup and item10b-stickers screenshots at1536/915 viewed. Setup is end-to-end; sticker screenshots render a controlled shop fixture over the prior blind-selection field, so only badge/tooltip appearance is their acceptance target. Automated UI checks also cover568×320 and360×800 controls, save/resume, badge text, expiry stamp and tooltip bounds. Screenshots retained as internal CI evidence only.

No reviewer findings remain deferred. Technical completion covers10b;10c and10d remain open. No physical-device or full frame/event RNG claim.
