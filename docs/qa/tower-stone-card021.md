# Tower / Stone Card 0.4.21/code34 verification

Scope: The Tower (`c_tower`) and Stone Card (`m_stone`) against the extracted 1.0.1n APK Lua traces, without original graphics, audio or music.

## Reference contract

- `assets/game.lua`: Tower has `mod_conv = 'm_stone'`, one target; Stone has a +50 chips bonus.
- `assets/card.lua`: Stone keeps its physical base card identity but returns no usable rank or suit, awards the Stone bonus without printed-rank chips, and awards zero while debuffed.
- `assets/functions/state_events.lua`: every played Stone is added to the scoring hand exactly once and scoring cards retain physical left-to-right order; Splash does not duplicate it.
- Suit bosses and Plant ignore Stone's printed properties. Pillar may still debuff it by physical card identity. Mark does not conceal a printed face card after it becomes Stone.

## Implemented checks

- Tower targets exactly one current-hand card, atomically overwrites its enhancement and spends no RNG. A debuffed Tower is consumed and counted without conversion.
- Stone does not form ranks, straights or flushes and does not activate supported rank, face or suit Jokers. It always joins the scoring cards and adds +50 chips instead of base rank chips.
- All-Stone play remains High Card; Splash, boss debuff, sorting, deck statistics, shop enhancement identity, save/replay and strict Mark concealment validation are covered.
- The owned card has original slab artwork, no printed corners/pips, a +50 marker, Stone-specific accessible name and tooltip.

## Commands

- `node --test tests/core/tower-stone-card.test.js`
- `npm test`
- `UI_CHECK_SCRIPT=tests/ui/tower-stone-card-check.mjs node scripts/check-ui.mjs`
- Official `scripts/ci-browser.mjs` and Android CI provide Chromium, fresh Gradle compilation, signature, zip alignment and APK artifact checks.

This is an intermediate parity block, not the complete game. Pareidolia, Vampire/Midas, editions, seals and retriggers remain governed by their later feature blocks.
