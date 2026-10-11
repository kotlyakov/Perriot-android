# Lovers and Wild Card QA — 0.4.18-preview

## Scope

- `c_lovers` accepts exactly one distinct card currently in hand and replaces its enhancement with `m_wild`.
- Active Wild Cards count as every suit for flush-family recognition and all supported suit-triggered Jokers.
- Each suit boss identifies and debuffs every Wild Card regardless of its printed suit.
- A debuffed Wild Card loses the universal-suit property but retains its printed base suit for hand recognition; it awards no rank chips or card-triggered Joker effects.
- Save/reload strictly accepts `wild` and derives `m_wild` in the APK shop context.
- UI exposes the one-card target contract, truthful Russian copy and a distinct Wild marker.

## Native-reference contract

- `assets/game.lua`: Lovers has `mod_conv='m_wild'` and `max_highlighted=1`.
- `assets/card.lua`: active Wild passes every `is_suit` check; under a debuff it falls back to the printed suit during flush calculation.
- `assets/blind.lua`: suit bosses call suit recognition with debuff bypass, so any Wild Card is selected for debuff.
- The mechanic consumes no RNG.

## Automated verification

- Focused core: Lovers targeting and atomic rejection, overwrite, debuffed consumption, Wild hand recognition, suit bosses, suit Jokers, persistence and shop identity.
- Full local core regression: 349/349 tests passed with `npm test`.
- Standalone preview export and `git diff --check` passed.
- Browser coverage exercises zero/one/two selected targets, copy, Wild marker, derived context and reload.
- Independent review found and closed a stale browser-fixture context, hidden-card modifier leakage and duplicate saved enhancement identities; re-review has no remaining Critical or Important findings.

## Deliberately out of scope

- Other enhancement Tarots and modifiers, including Steel/held-card scoring.
- Retriggers, editions, seals and not-yet-supported Jokers.
- Profile discovery/collection progress and native audiovisual timing.

This is a tested preview increment, not a claim of full Balatro parity.
