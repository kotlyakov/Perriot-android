# Hanged Man and Death — APK 1.0.1n contract

Verified against the extracted APK Lua under the private research workspace. No original Lua or media is shipped in the application.

## Hanged Man

- `game.lua:546`: `remove_card = true`, `max_highlighted = 2`; the missing minimum uses the native default of one.
- `card.lua:1524–1530, 1566–1570`: use requires one or two highlighted cards in the hand.
- `card.lua:1270–1292`: every selected card is removed from its area and the global playing-card collection. No gameplay pseudorandom call occurs and the hand is not refilled immediately.
- A debuffed consumable records usage and is consumed, but returns before applying the effect (`card.lua:1092–1096`).

## Death

- `game.lua:547`: `mod_conv = 'card'`, `min_highlighted = 2`, `max_highlighted = 2`.
- `card.lua:1102–1121`: the source is the selected card with the greatest physical `T.x`; every other selected card copies it. With two cards, the visual left becomes the visual right, independent of highlight order.
- `common_events.lua:2198–2222`: `copy_card` preserves the target object/playing-card identity and copies base, centre/ability, edition, seal and supported permanent properties. The current project schema represents base rank, suit and enhancement; later edition/seal/permanent support must extend the same copy operation.
- No gameplay RNG is advanced. Hidden/facing membership is not copied because it belongs to the target card's current area state.

## Project invariants

- Native shuffle order follows persistent creation identity, not a Death-modified rank or suit. `canonicalCards` therefore validates the current face but derives its canonical key from the immutable original card ID.
- Hanged Man filters destroyed identities from the hand, registry, hidden list and project ante/Pillar ledgers. Persistent generic and Hanged-specific destruction ledgers plus the current Hanged suffix distinguish native destruction and its temporary short hand from a debuffed use, Glass destruction or a corrupt save; the complete 52-card generic ledger also permits the native zero-card endpoint.
- Mark concealment stays attached to the same card ID even if Death changes a hidden face card into a pip.
