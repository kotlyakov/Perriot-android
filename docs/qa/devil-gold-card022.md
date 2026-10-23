# Devil / Gold Card 0.4.22/code35 verification

Scope: The Devil (`c_devil`) and Gold Card (`m_gold`) against the extracted Balatro 1.0.1n Lua, using only project-owned presentation assets.

## Reference contract

- `game.lua`: Devil has `mod_conv = 'm_gold'` and one target; Gold has `h_dollars = 3`.
- `card.lua`: conversion replaces the existing enhancement without changing the physical card identity, rank or suit. A debuffed Devil is consumed and recorded without converting its target.
- `functions/state_events.lua`: after a successful round, each eligible Gold Card still held pays $3 in physical hand order before round evaluation and interest. Played, discarded and boss-debuffed Gold Cards do not pay; facing down alone does not suppress the effect.

## Implemented checks

- Exact single-current-hand targeting, enhancement replacement, no RNG draw, Tarot usage/history, `m_gold` shop identity and strict save/reload.
- Normal rank/suit/scoring behavior for Gold, no mid-round or game-over payout, winning end-round payout, Hook forced discard exclusion, boss debuff and face-down boundaries.
- Gold money is persisted in `round_won` before cashout, contributes to interest, and cannot be paid twice after reload or repeated cashout.
- Own Gold styling, `$3` marker, accessible modifier description and Russian Devil copy.

## Commands

- `node --test tests/core/devil-gold-card.test.js`
- `npm test`
- `UI_CHECK_SCRIPT=tests/ui/devil-gold-card-check.mjs node scripts/check-ui.mjs`
- Official `scripts/ci-browser.mjs` and Android CI provide Chromium, fresh Gradle compilation, signature, zip alignment and APK artifact checks.

This is an intermediate parity block, not the complete game. Red Seal and Mime retriggers are native Gold interactions, but remain unavailable until those general seal/Joker mechanics are implemented and tested as their own dependency blocks.
