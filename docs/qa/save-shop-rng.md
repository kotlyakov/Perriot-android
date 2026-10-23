# Optional shop and original RNG save fields

The version-one codec preserves the exact legacy serialized bytes when none of the new optional fields are present. It now permits optional `shop` (including null after leaving), `bankruptAt`, `jokerSlots`, counter32 `rng.shop`, and the original arithmetic snapshot `rng.apk`.

Shop main/voucher/booster offers retain ID, entity ID, nonnegative integer purchase/sell price, and explicitly whitelisted edition/sticker metadata. Prices, paid reroll tier/base, credit floor and money use strict canonical decimal strings in JSON and BigInt in memory. Unknown properties, duplicate identities across all offer/owned/card zones, noncanonical numbers, out-of-range counts and oversized snapshots are rejected. Restoring offers does not invoke a factory or consume RNG.

Original RNG snapshots retain seed, seed hash, each keyed stream and all four 64-bit hexadecimal math state words. The seed must match the run and its hash must match the verified APK transformation. Stream values remain binary64 numbers matching the original 13-decimal normalization. JavaScript-reserved stream names remain ordinary own keys, matching the original module; no prototype assignment or inherited-key lookup is performed. Save validation never advances any stream. The prior last-score trace recomputation guard and phase invariants remain active.

New focused tests cover legacy byte compatibility, shop/credit/original RNG roundtrip and next-operation equality, persisted bought-card prices/stickers, invalid shapes/numbers/identities, and null shop. RED: the new fields initially failed with BigInt serialization errors (3 failing new tests, legacy passed). GREEN: all five focused tests pass; the full core suite passed 132/132 after adding the fifth test (the shared suite also gained an independent RNG test).

This does not generate the original shop pools, implement unsupported effects, or establish complete game/save parity. Offers are caller-supplied verified transaction data. The currently supported small-blind/ante phase restrictions remain unchanged.
