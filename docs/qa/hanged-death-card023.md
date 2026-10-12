# Hanged Man / Death 0.4.23-preview / code36 verification

Scope: the original Hanged Man (`c_hanged_man`) and Death (`c_death`) Tarot effects using project-owned presentation assets.

## Implemented checks

- Hanged Man accepts exactly one or two distinct current-hand cards, removes them from the physical deck without replacement, preserves RNG and filters identity-based blind state.
- Save/reload binds the temporary short hand to the newest entries in a Hanged-specific destruction ledger; neither debuffed use nor Glass destruction can forge that provenance, and a fully recorded 52-card generic destruction ledger permits the native empty-deck endpoint.
- The shortened hand, reduced deck and honestly reached empty deck survive strict save/reload. The shortfall marker must equal the actual missing hand cards; forged underfilled hands remain rejected.
- Death accepts exactly two distinct current-hand cards and resolves left/right from visual hand order, not click/action order.
- Death preserves the left physical identity and native creation-order shuffle key while copying the right rank, suit and exact supported enhancement state, including removal of an old enhancement when the source is base.
- Mark face-down membership remains stable across a face-to-pip Death conversion for an actually concealed original face identity; arbitrary visible pip identities remain invalid.
- Debuffed consumables are consumed and counted without changing playing cards. Both effects spend no gameplay RNG.
- Russian descriptions and the existing owned-consumable UI expose only implemented behavior.

## Verification

- `node --test tests/core/hanged-death-card.test.js`: 13/13 PASS.
- `npm test`: 397/397 PASS.
- `tests/ui/hanged-death-card-check.mjs`: registered in `scripts/ci-browser.mjs`; covers two-card destruction, deck count, short-hand reload, reversed Death click order and transformed-card reload.
- Local Chromium is unavailable in this workspace because the Playwright browser executable is not installed. Official GitHub Actions installs Chromium and is the required browser/Android/signature/zipalign gate.

This remains an intermediate parity block, not the complete game. Hanged removal-trigger Joker reactions and Death copying editions, seals and permanent fields are deferred until those general systems are implemented.
