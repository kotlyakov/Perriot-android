# Native Endless numeric observations

Source-only research, 2026-10-15. Uploaded APK is authoritative; this document does not claim the pending Endless implementation is complete.

Executed extracted native `get_blind_amount` and `number_format` from `functions/misc_functions.lua:922–967`, and `STR_PACK`/`STR_UNPACK` from `engine/string_packer.lua:38–67`. Runtime: pinned LuaJIT2.1.1700008891, commit43d0a19158ceabaa51b0462c1ebc97612b420a2e; own adapter only supplies `G.GAME.modifiers.scaling=1`. No original source is included in the repository. This is function-level observation, not integrated gameplay or Android execution.

| Ante | Small native number | Display | Big display | Boss display | Vessel display |
|---|---|---|---|---|---|
| 8 | 50000 | 50,000 | 75,000 | 100,000 | 300,000 |
| 9 | 110000 | 110,000 | 165,000 | 220,000 | 660,000 |
| 16 | 8.6e20 | 8.600e20 | 1.290e21 | 1.720e21 | 5.160e21 |
| 32 | 2.7000000000000004e179 | 2.700e179 | 4.050e179 | 5.400e179 | 1.620e180 |
| 38 | 4.5000000000000002e288 | 4.500e288 | 6.750e288 | 9.000e288 | 2.700e289 |
| 39 | NaN | nan | nan | nan | nan |
| 40 | NaN | nan | nan | nan | nan |
| 1000 | NaN | nan | nan | nan | nan |

Each target uses native binary64 multiplication by1/1.5/2/6 before conversion; display rounding must not replace the stored integer. Native formatter switches at1e11, rounds to four significant figures, then emits three fractional places and exponent. High-Ante Vessel disable must divide the existing native6x target by3 (`blind.lua:394`), not substitute a fresh2x calculation: rounding can differ. Executed native difference cases occur at antes20/24/31/35/37. At20, division gives8.600000000000001e43 versus fresh2x=8.6e43; at24, division gives3.1999999999999996e77 versus fresh2x=3.2000000000000002e77. Add fixture coverage at these concrete boundaries.

For all nonfinite rows and multipliers, the actual runtime reports `0>=target`, `1e300>=target` and `0-target>=0` as false. Native completion compares subtraction against zero (`state_events.lua:96,1160`, `blind.lua:400`, `game.lua:3541`), so this target cannot be beaten by a finite score. Its visible target is `nan`, not infinity or a large finite substitute.

Native packing emits a bare undefined Lua global named `nan` as the chips value. Unpacking succeeds but the resulting table has no chips field (`type=nil`); the value is not durable. The same32-row probe covers8/9/16/32/38/39/40/1000 with all four multipliers, including the finite control rows. This native save corruption must remain a disclosed intentional compatibility difference if the implementation uses a durable tagged nonfinite target. No final ante cap or automatic victory follows from this observation.

Task6 owns executable tracked fixtures, the minimal representation, strict save/replay and comparison integration, source-accurate display, and actual continuation/browser checks. Existing arithmetic remains finite BigInt; these observations alone do not complete Task6.

## Task 6 implementation contract and executable evidence — 2026-10-15

`generate-showdown-fixtures.py` now executes the actual extracted formatter and pack/unpack functions, replacing its former formatter stub. Its tracked `numeric` section contains the 32 rows above, including actual success comparisons and packed/unpacked values; `format` adds four observations around the 1e11 notation threshold. `vesselDivision` executes native `Blind:disable` at Antes1–40. JIT-enabled and interpreter results agree, and a second regeneration matches the tracked JSON byte for byte. Existing Acorn event-order and Bell/Heart fixture sections remain unchanged. Only the extraction adapter and observations are committed, never the uploaded Lua source.

The runtime target contract is `bigint | NaN`: finite targets remain the exact integer represented by the native binary64 calculation, after the native Small/Big/Boss multiplication. Native division reconstructs that binary64 value before dividing, then stores its exact integer result; it does not divide the BigInt or recompute a fresh 2x target. In addition to the Ante20/24 examples above, the disabled/fresh-2x differences are Ante31 `1.9799999999999997e164` / `1.98e164`, Ante35 `5.6000000000000012e230` / `5.6000000000000004e230`, and Ante37 `5.3999999999999988e268` / `5.3999999999999995e268`.

Save schema1 retains decimal strings for finite targets and uses exactly `{"native":"NaN"}` for the nonfinite target. The decoder accepts this tag only for the native target owner and only when the computed expected target is NaN; wrong-ante, wrong finite target, malformed tags, Infinity, negatives, and nonfinite values in ordinary score/money fields are rejected. Target identity uses `Object.is`, and loss/playing validation uses `!(score >= target)` rather than `score < target`. Scoring and boss-disable success settlement use the same unordered comparison. Thus a finite score, including a very large one, cannot win or cash out a NaN target, and four unsuccessful plays still reach a durable game-over state. **Durable NaN reload intentionally corrects the native packer's dropped-chips save corruption.** No finite substitute or final Ante cap is introduced.

After a disabled Wall/Vessel cashout, active `bossState` is removed by the existing shop lifecycle. The completed round therefore carries optional `round.bossDisabled=true` only in Boss shop/pack states, retaining the existing lowered target and sufficient provenance to validate its exact native identity. Other bosses, phases, and false/nonboolean encodings are rejected. Leaving the shop replaces the round identity and removes this snapshot. This is an internal provenance field, not a native field-name match or a cryptographic action history.

Target presentation uses native comma grouping, four-significant-figure scientific notation from 1e11, and lowercase `nan` in blind selection, the field, payout, and loss text. Formatting does not replace stored BigInts. NaN targets produce finite zero flame height. Core regressions cover actual Ante8 acknowledgement→generated Ante9 shop→selection/start, Ante16 showdown without another notification, native RNG call order and resume equality, skips beyond round24, disabled target shop/pack/resume, and NaN loss timelines through Antes39/40/1000.

The final local core suite passes 967 tests with zero skips, including the optional private native cashout oracle. Browser coverage is extended but local execution is blocked by missing Chromium; Android assets/static configuration pass, while local compilation is blocked by missing javac. Independent review and the root's actual browser/Android CI remain required. This does not close full profile/unlock/stake progression, all setup/end-round Joker hooks, creation order beyond the supported deck model, or Android/device event-order parity.
