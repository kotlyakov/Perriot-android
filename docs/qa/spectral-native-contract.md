# Conditional native Spectral use oracle

`tests/fixtures/spectral-native.json.gz` contains 796 cases from the private APK source, with source SHA-256 pins. `scripts/reference-rng/generate-spectral-fixtures.py` imports no production JavaScript and retains no source Lua. LuaJIT JIT-on and JIT-off results must be identical before a fixture is written.

The harness executes the original complete `Card:can_use_consumeable` and `Card:use_consumeable` functions, the relevant original update-time eligibility blocks, `get_current_pool`, `create_card`, `copy_card`, `create_playing_card`, RNG functions, and card ability/base/edition setters. Constructor discard RNG and materialization/destruction synchronous prefixes are extracted from the source. Native `Card:juice_up` consumes one raw draw per admitted call.

Semantic Event callbacks drain in insertion order, including callbacks they append. Edition callbacks retain their native juice. Destruction schedules final physical removal after the enclosing callback, preserving traversal of the original area. No wall-clock waits or full native scheduler are simulated. Materialization/destruction particle callbacks, deferred sound RNG, rendering, profile/discovery writes, update-frame callbacks, Joker calculation reactions, and blind updates are excluded. The claim is conditional effect parity after these admitted callbacks, not full frame/event RNG parity.

| Coverage | Cases |
| --- | --- |
| All eleven remaining Spectrals | Familiar, Grim, Incantation, Cryptid, Sigil, Ouija, Immolate, Ankh, Hex, Ectoplasm, Wraith |
| Physical ordering | Hand display order differs from immutable native creation order; Joker display order is 3, 1, 2 |
| Playing-card boundaries | Empty/single/two/five/eight cards, all seven generated enhancements, decorated source cards, Cryptid selection, native destruction order |
| Joker boundaries | Empty/one/full slots, all Eternal, mixed Eternal/debuff/Negative, no editionless target, Ankh Negative copy strips edition |
| Money/hand limits | Wraith positive/zero/negative dollars, repeated Ectoplasm cost, negative real hand-size debt and clamped display limit |
| Wraith generation | 100 unlocked seeds cover all twenty rare identities; all five editions, all-banned fallback, forced Stuntman |
| Add/remove passives | 24 explicit cases run original native add/remove methods and compare applyConsumableAction followed by finishItem7Action before next-frame refill: Ankh/Hex with Juggler, Turtle Bean, Stuntman; Wraith Stuntman |
| Constructor reseeding | Eight Ankh/To Do List cases, with source hand fixed to Pair; constructor RNG precedes the temporary To Do poll, then materialization follows |

Each case stores the input, eligibility, ordered surviving/created/destroyed physical identities, card faces/modifiers, Joker editions/Eternal/debuff, limits, money, Ectoplasm count, keyed RNG streams, action draw trace, and four following raw LuaJIT draws. The JavaScript comparator checks the corresponding observable result and preserves input immutability. Twenty-four passive cases use an empty hand so positive capacity changes cannot schedule a refill; native area geometry, refill, and hand sorting are not part of this harness. Other cases isolate direct consumable effects and omit add/remove passives. Playing-card boss debuffs and Joker calculation reactions need their own integration coverage.

The fixtures exposed a real Ankh/To Do List chronology regression: advancing constructor draws after the To Do reseed produced incorrect following raw draws. The corrected order is constructor ×3, keyed To Do selection, materialization ×1.

Regenerate with the pinned private inputs:

```sh
python3 scripts/reference-rng/generate-spectral-fixtures.py --assets "$APK_ASSETS" --luajit "$LUAJIT" --output tests/fixtures/spectral-native.json.gz
node --test tests/core/spectral-native.test.js
```

Deterministic gzip uses mtime zero, allowing byte-for-byte regeneration checks.
