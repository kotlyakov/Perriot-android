# Targetless money Tarot cards

Reference: original APK 1.0.1n-FULL Lua inspected outside the repository. No original source or assets are included. This scoped block implements the two Tarot effects that need neither a playing-card target nor another content generator.

## Hermit

Catalogue `game.lua:543` stores `extra = 20`. `Card:can_use_consumeable` at `card.lua:1532–1534` permits it in every stable inventory phase. Use at `card.lua:1386–1393` adds `max(0, min(current dollars, 20))`: debt and zero pay nothing, $7 becomes $14, $20 becomes $40, and $31 becomes $51. It reads the balance after any purchase cost has already been paid.

## Temperance

Catalogue `game.lua:548` stores `extra = 50`. `Card:update` at `card.lua:4170–4177` sums the current stored sell cost of every owned Joker and caps the displayed/use value at $50. Use at `card.lua:1394–1401` pays that frozen current value. Empty Joker inventory pays zero; consumables are not included.

## Shared transaction rules

Both cards are targetless and consume no RNG. Native use records consumable usage before the debuff check (`card.lua:1092–1096`): a debuffed card is consumed and counted but has no money effect. Successful use increments Tarot, Tarot+Planet and all totals, updates the last Tarot/Planet key, removes exactly one owned instance and advances the action revision once. Invalid money, Joker sell values, stale actions, overflow and failed persistence reject atomically.

This does not claim the other 20 Tarot effects. Playing-card enhancements/conversions/removal, generated cards/Jokers and editions remain separate dependency blocks.
