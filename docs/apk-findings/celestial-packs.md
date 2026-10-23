# Celestial pack generation and lifecycle

Scope: original APK 1.0.1n-FULL behaviour for the eight Celestial booster identities. Temporary oracle code executed extracted catalogue/runtime functions outside the repository; no original Lua, art, sound or music is included. The checked fixture contains 64 cases: four seeds, normal size 3 and jumbo/mega size 5, each across base, Telescope, bans, owned/offered duplicates, Showman and Black Hole conditions.

## Generation

- Normal packs generate three cards and allow one choice. Jumbo generates five and allows one. Mega generates five and allows two.
- Ordinary cards use the keyed `Planetpl1{ante}` stream and exclude cards already owned, offered or generated earlier in the same pack. Showman (`j_ring_master`) permits duplicates.
- Black Hole uses the strict keyed poll `soul_Planet{ante} > 0.997`. The poll still occurs when Black Hole is banned; only the resulting candidate is rejected. This ordering is covered by the saved keyed-stream fixture.
- Telescope forces the first card to the most-played currently visible hand. Native priority for ties is Flush Five, Flush House, Five of a Kind, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, Pair, High Card. With all counts zero, selection falls back to the ordinary pool.
- A forced Telescope candidate bypasses the soul poll. If that Planet is banned, generation falls back to the ordinary pool.
- Instance IDs are deterministic and each accepted generated identity immediately participates in duplicate suppression.

`tests/fixtures/celestial-native.json` stores only expected identities and keyed RNG states, not original source or assets. `tests/core/celestial-pack-generation.test.js` verifies every case and the following state boundary.

## Lifecycle

Opening is an atomic shop action: validate the exact offered booster, affordability and phase; remove that offer and charge once; generate the complete pack; then persist phase `pack`. The underlying shop remains unchanged. A generated card is applied immediately and never occupies a consumable slot. Mega packs persist their remaining choice and cards across reload.

Skipping returns to the same shop with no refund, no additional RNG and no regenerated offers. Any invalid/stale action or persistence failure leaves money, RNG, pack, shop and effects unchanged. The save codec strictly validates the pack source, generated card identities, unique IDs, choice count and phase coupling.

The current executable boundary is Celestial only: all twelve Planets and Black Hole. Arcana, Spectral, Standard and Buffoon opening remain unavailable rather than receiving substitute behaviour. Profile discovery, unlocks and original animation timing remain separate work.
