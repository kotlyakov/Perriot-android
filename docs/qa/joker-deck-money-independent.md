# Independent review — held, suit, deck and money Joker slice

Reviewed 2026-10-14 against local baseline `35b9870` (snapshot of upstream `043d8bb`) and supplied APK sources in `../reference-apk/assets`. This is a source/core review, not Android or browser acceptance. No production code changed by the reviewer.

## Confirmed behavior

- Baron and Shoot the Moon use remaining held Kings/Queens, exclude Stone and boss-debuffed cards, and preserve held-card/Joker order after Steel.
- Flower Pot and Seeing Double match the original two-pass ordinary/Wild suit assignment, suit priority, scoring-card restriction and their different debuff rules (`card.lua:3810–3876`).
- Stone/Steel/Driver's License count all owned playing cards, including boss-debuffed cards; Steel uses an exact fifth; Glass destruction occurs after independent evaluation and replay restores destroyed Glass (`card.lua:3925–3955,4182–4204`).
- Bull and Bootstraps evaluate currency after Tooth/Ox effects and Lucky's buffered income (`blind.lua:497–507,560–568`, `card.lua:1086–1087,3939–3945,4049–4053`).
- Russian descriptions distinguish held, played and scoring cards, enhancement versus edition, exact coefficients and money floor boundaries. Existing safe formatter is reused.

## Review findings and remediation

1. **Important, corrected:** coherent forged money context originally passed replay. Independent reproduction replaced a valid $10 Bull score with a replay at $100 while keeping actual money $10; loader accepted score 215. The revised committed-money validation rejects this reproduction, rather than merely checking whether the trace agrees with the supplied snapshot.
2. **Important, corrected:** version-1 saves produced and accepted by the actual baseline serializer/decoder with Blackboard, Banner, Acrobat or Mystic Summit were initially rejected due to newly required metadata. The revised loader accepts all four independently generated valid baseline fixtures. Legacy fallback still requires complete score/trace agreement; it does not promise recovery of saves already rejected by the baseline.
3. **Important, corrected:** Hook initially discarded held cards after scoring. Native `Blind:press_play` removes Hook cards before `evaluate_play` (`blind.lua:464–485`, `state_events.lua:509–535`). Independent reproduction playing a Two with two held Kings and Baron originally awarded both multipliers despite discarding both Kings. Current reproduction yields multiplier 1 and no held score steps. New Hook tests also check RNG order before Lucky.
4. **Important, corrected:** a coherent forged Blackboard snapshot originally named an owned Spade Ace still in the draw pile instead of the actual held red Three, replaced the trace/score consistently and passed decoding. Held-card lists also lacked a pre-PLAY capacity bound. The revised loader rejects both independently reproduced forgeries. The draw-pile exclusion remains valid through later DISCARD: this engine consumes the draw pile within a blind and does not recycle discarded cards into it; deck-mutating/inventory/shop actions clear the score. Capacity validation correctly exempts Serpent's increasing hand. Validation proves structural/score consistency, not authenticated action history.
5. **Corrected during concurrent work:** the new Celestial raw-RNG test initially failed with following draw `0.44395994139621187` instead of native `0.2098773323377312`. The unconditional synchronous materialization draw fixes it; selected suites now pass.

## Arcana and oracle scope

Reviewed the isolated generator against native `Card:open`, `create_card`, pool filtering and constructor/materialization sources. It preserves all eight booster identities, full Tarot/Spectral pools, Omen selection, duplicate suppression/Showman, special-card polls, native pool holes and resample keys, exhausted-pool fallback, four synchronous raw draws and immutable inputs. The source boundary excludes queued audio/animation draws and the generator remains unintegrated with pack actions, saves and effect handlers.

The 140 Arcana numerical fixtures are documented as a pinned LuaJIT source-function adapter, not a full APK playthrough. The 89 deterministic Joker cases explicitly disclose Lua54 compatibility-adapter execution and manually supplied tally refresh; they are not independent evidence of native `Card:update` or event timing. Celestial fixtures now contain source SHA-256 metadata and following raw draws, with a checked-in regeneration script. Arcana's extraction harness remains temporary, which limits future regeneration convenience; no gameplay defect identified from that limitation.

## Verification

- Stable selected suites: `node --test tests/core/hook-scoring-order.test.js tests/core/joker-deck-money.test.js tests/core/celestial-pack-generation.test.js tests/core/arcana-pack-generation.test.js tests/core/native-joker-oracle.test.js tests/core/joker-display-expanded.test.js` — **32/32 passed**.
- Independent coherent Bull forgery — **rejected** after remediation.
- Actual baseline save compatibility — **four/four accepted** after remediation.
- Independent Hook/Baron two-King reproduction — **corrected**.
- Final full suite: `npm test` — **456/456 passed**, zero failures. Log captured at `/tmp/pierrot-independent-final-test.log`.
- Independent coherent undrawn-held-card and overcapacity forgeries — **both rejected** after remediation.
- Browser/Android UI checks were not run by this reviewer.

## Verdict

No unresolved Critical or Important defect found in the final reviewed slice. Earlier findings above were independently reproduced before and after correction. Source/core review supports proceeding to CI and the separately owned browser/Android checks; it does not establish full game parity or enable Arcana lifecycle integration.
