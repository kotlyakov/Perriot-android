# Item10a — 15 decks, 22.10.2026

## Result

Implemented all15 native decks, initial cards/slots/money/vouchers/consumables and persistent effects. Green replaces hand payouts, adds unused discards, removes interest and freezes earned quote. Plasma balances exact factors once after modifiers and doubles every blind target/preview. Anaglyph adds one Double upon a successful boss evaluation. Erratic samples full fronts with replacement and sorts before immutable physical identity assignment; Abandoned starts40 and Checkered changes suits without reassigning identities. Starting vouchers affect the initial selection pool and are not purchases or consumable uses.

The user divided item10 into four parts:10a decks,10b stakes,10c profile/unlocks/collection/statistics,10d challenges. Only10a is completed. All decks are intentionally available in a clearly labeled preview; unlock admission is10c. Legacy Red/Blue paths and native fixtures remain passing. Advanced decks use the existing full native game context.

## Verification

- Baseline1481PASS/0FAIL/2private-source skips.
- Test-first initial new deck rejection→all30 new tests PASS. UI balance label RED additive delta→GREEN balance. Blind-preview query RED missing→GREEN scaled previews.
- `npm test`:1511PASS,0FAIL,2optional private-source skips,1513total.
- New tests include15×28bosses start/play/discard/save, deterministic startup, initial resources/voucher exclusion, Ghost shop Spectral, Green frozen sale quote, forged saves and exact large Plasma factors.
- Independent whole-change review: no confirmed Critical/Important. Additional35boss disable edges,2Green earned Water/Needle disable edges,Abandoned Erosion baseline PASS; root reproduced the independent script.
- CI39727016489 SUCCESS, PR39:47Chromium suites desktop/touch, fresh native clean build,apksigner/zipalign PASS.
- Source d3518d1ec74521936908291002f7b580b46eb215 and tested synthetic merge071ac9ac7c78c055d25dfb2ed972a8ce24b79a41 compare with0changed files.
- Screenshots item10a-setup-1536,item10a-setup-915,item10a-green-cashout viewed. Green screenshot is a direct rendering fixture; its payout rows are the visual acceptance target, not an end-to-end screenshot of the underlying Black fixture.
- Downloaded APK zip CRC verified; all75offline assets exactly equal locally prepared source assets.

## APK

0.4.43-preview/code56. Artifact12403338565. SHA256 `ed6a784d598372e03c0b8eb28091c4e09d08f574af3e3d69d8f8ce0db1c12314`.

Signer SHA256 `b1fb25e67aadf9407021e8f9746afed519c756242c189223edb6bc1b1e2155bb`, differs from0.4.42 signer `fb4ba32abbe6a577949764f84349d2fce82224d454d477e162619f4e99f2bbdd`. In-place update over that APK will fail; deleting the prior installation destroys its local progress. No deletion is recommended or performed.

## Scope and limitations

No physical Android test or complete frame/event raw RNG parity claimed. Native LuaJIT was unavailable here; existing source-derived RNG fixtures remain green and the new deck chronology was checked against supplied native source. Omitted Abandoned base identities use the existing identity ledger without destruction callbacks. Profile/stat unlock accounting and stakes/challenges remain their own parts.

No reviewer findings deferred. No new architecture/dependencies or changes to native balance.
