# Spectral consumable effects (item 8b)

Source: original APK `assets/card.lua`, `Card:use_consumeable` and `Card:can_use_consumeable`, plus `functions/common_events.lua` constructors and `functions/misc_functions.lua` selection/shuffle helpers.

The eleven remaining effects route through `spectral-consumables.js`, alongside existing Aura, four seals, Black Hole and The Soul (18 total). The public `canUseConsumable` / `applyConsumableAction` interface serves owned and staged pack use. Capability queries do not mutate the source state; effect failures return the original state and no events.

| Effect | Native operation |
| --- | --- |
| Familiar | Destroy one random hand card; create 3 enhanced J/Q/K cards |
| Grim | Destroy one random hand card; create 2 enhanced Aces |
| Incantation | Destroy one random hand card; create 4 enhanced ranks 2–10 |
| Immolate | Shuffle physical hand order, destroy up to 5 cards, receive $20 |
| Cryptid | Create two physical copies of one selected card, retaining rank/suit/enhancement/edition/seal/permanent bonus |
| Sigil | Change every hand card to one random suit |
| Ouija | Change every hand card to one random rank; permanently lose one hand slot |
| Ectoplasm | Give a random editionless Joker Negative; lose `ectoMinus` hand slots; increment `ectoMinus` |
| Hex | Give a random editionless Joker Polychrome; destroy other non-Eternal Jokers |
| Ankh | Copy one random Joker; destroy other non-Eternal Jokers; strip Negative from the copy |
| Wraith | Generate a native Rare Joker using `wra` append and forced rarity .99; reset dollars to zero |

Hand-wide effects require more than one hand card in hand selection or a pack. Cryptid requires precisely one physical hand target. Ankh requires a Joker and effective Joker capacity greater than one; it retains the native ability to copy even when Eternal survivors cause overflow. Hex/Ectoplasm require an editionless Joker. Wraith requires free effective Joker capacity. Debuffed cards retain ordinary eligibility checks and count usage without applying their effect.

Physical creation uses `createPlayingCard`, preserves monotonically issued identities, and invokes Hologram creation callbacks. Destruction invokes native Caino/Glass callbacks, clears boss references, and records `spectralDestroyedCardIds`, independently of Hanged Man. Outside a pack it also records `spectralShortfallCardIds` and `spectralShortfallEpoch` for native hand draw/replay validation. Packs retain their own original draw metadata and creation events expose complete newly created card payloads.

Permanent costs accumulate in nonpositive `spectralHandSizeDelta`. `ectoMinus` starts at 1 and stays positive. `changeHandSize` preserves raw hand size debt while clamping displayed hand size at zero. Joker lifecycle capacity changes remain the shared action finalizer's responsibility.

RNG uses original effect keys and native element/shuffle selection. Playing-card element selection sorts immutable physical creation order; Joker choices sort immutable `creationOrdinal`, independent of displayed inventory position. Enhanced generation takes the entire native Enhanced pool except Stone. Wraith uses the shared native full-pool card generator; no handpicked replacement pool exists. Constructor and admitted juice calls advance the existing native math stream; animation/particle/audio frame behavior remains outside the repository's existing action RNG contract.

Verification: focused core tests cover all eleven effects, no-target/capacity restrictions, debuff, money, physical identity, modifier inheritance, Joker callbacks, Eternal/Negative, permanent hand costs, pack provenance, and atomic creation failure. Existing Aura/seal/Black Hole/Soul tests remain separate regressions. The independent original-function oracle checks 796 fixtures, including passive Joker removal/copy, native Rare full-pool fallback/editions, negative hand-size debt, and Ankh copying To Do List. That last case exposed and fixed constructor-versus-ability reseeding order (constructor 3 raw draws, then `to_do` selection, then materialization juice). Mark regressions also retain a generated card’s actual rank rather than mistaking its identity ordinal for rank. Full integration/QA status is tracked separately by item 8b.
