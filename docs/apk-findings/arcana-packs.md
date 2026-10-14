# Arcana booster generation

Reference: supplied Android APK 1.0.1n-FULL, inspected 2026-10-14. This module implements generation only. Opening, purchases, pack actions, target selection, effects, saves and visual timing are separate integration work.

## Identities and contract

| Native identities | Cards created | Choices |
| --- | ---: | ---: |
| `p_arcana_normal_1` through `_4` | 3 | 1 |
| `p_arcana_jumbo_1`, `_2` | 5 | 1 |
| `p_arcana_mega_1`, `_2` | 5 | 2 |

`src/core/arcana-pack-generation.js` exports:

- `supportsArcanaBooster(id)`: checks the actual catalogue identity and Arcana kind.
- `getArcanaBoosterConfig(id)`: returns `{size, choices}` or throws for another identity.
- `generateApkArcanaPack(rng, context, {boosterId, instancePrefix='arcana'})`: returns `{cards, rng}` without mutating either input. Context is the existing validated APK shop context. Generated instance IDs are `${instancePrefix}_${index+1}`. Cards use the existing `{id, entityId, originalKey, set, edition, cost, sellCost}` shop shape; editions are base.

The caller supplies the RNG at entry to the native pack-card generation callback. It must persist the returned RNG and complete card list atomically, retain the exact booster identity, and maintain the native used-centre set through the existing `ownedCentreIds` and `usedCentreIds`. Choice count comes from the exact booster config, independent of generation.

## Native selection order

The catalogue has all 22 ordinary Tarots and all 18 Spectrals (16 ordinary, Soul and Black Hole). No pool is reduced to currently implemented effects.

For each card, `Card:open` checks owned Omen Globe. When present, `pseudorandom('omen_globe') > 0.8` chooses Spectral with append `ar2`; otherwise it chooses Tarot with append `ar1`. Without Omen Globe this stream is untouched. Its key has no ante suffix.

`create_card` next applies the rare-card outer guard: a Soul ban suppresses the entire rare-card block. For Tarot, an unused Soul (or Showman) polls `soul_Tarot{ante} > 0.997`. For Omen Spectral, unused Soul and unused Black Hole each independently poll the same `soul_Spectral{ante}` stream, in that order. The second success replaces a first Soul success with Black Hole. A Black Hole ban does not suppress its poll: it rejects the resulting candidate and falls back to the ordinary Spectral pool. An already used special suppresses its own poll unless Showman is owned.

Ordinary selection preserves source pool positions: excluded entries become `UNAVAILABLE`; they are not removed. Selection uses `Tarotar1{ante}` or `Spectralar2{ante}`. A rejected index retries with `_resample2`, `_resample3`, etc., restarting that suffix counter for each card. Used, locked and banned centres, pool flags and enhancement gates follow the existing context contract. Soul and Black Hole are excluded from the ordinary Spectral pool. A completely exhausted Tarot pool falls back to Strength; an exhausted Spectral pool falls back to Incantation, even if that fallback itself is banned or used, as in the APK.

Construction marks all centres with the same name as used immediately, before the next card is selected. This suppresses owned, offered and earlier generated duplicates. Showman allows them. The pack loop finishes constructing and materializing the full ordered list before emplacing cards into the pack area.

## RNG boundary and evidence

`Card:init` consumes three raw `math.random()` draws for discard rotation/x/y. `Card:open` then explicitly calls `card:start_materialize`, whose synchronous `juice_up` consumes one additional raw draw. This APK's `Card:juice_up` does this even with reduced motion enabled. Thus generation consumes four raw draws after each accepted centre. Rare or pool selection reseeds native math RNG using its keyed stream; retry streams are preserved separately.

The boundary ends after synchronous materialization of each generated card. Queued audio events, particle updates, opening-booster juice/explosion, and any subsequent frame animation are outside this pure generator; those consume additional global math draws in the running game. The oracle is a conditional source-function harness, not a complete Android playthrough. FTP_LOCKED is false for the supplied full-content APK; its storefront/demo lock is outside the existing context contract.

`tests/fixtures/arcana-native.json` retains 140 numerical native outcomes consumed by `tests/core/arcana-pack-generation.test.js`, generated from seven seeds, two sizes and ten contexts. Coverage includes Omen Globe, owned specials, Showman, Soul and Black Hole bans, exhausted Tarot fallback, normal and rare seeds, exact accepted identities, complete keyed-stream state, and four following raw math draws. Native seeds `ARC291`, `ARC1746`, `ARC1618` exercise first-card Tarot Soul, Omen Soul and Omen Black Hole respectively. Other tests verify all eight configs, offered-centre suppression, invalid options, input immutability and reduced-motion draw equality.

The independently executed runtime is LuaJIT 2.1.1700008891, pinned upstream source commit `43d0a19158ceabaa51b0462c1ebc97612b420a2e`, matching the existing APK RNG numerical implementation. Session execution:

```
python scripts/reference-rng/generate-arcana-fixtures.py --assets ../reference-apk/assets --luajit /path/to/pinned/luajit --output tests/fixtures/arcana-native.json
node --test tests/core/arcana-pack-generation.test.js
```

The durable regeneration script reads the supplied extracted `game.lua` centre table, `common_events.lua` pool/create functions, and `misc_functions.lua` seed/random helpers. It executes those functions and the entire original `Card:open` pack-generation loop unchanged, choosing its Arcana branch via the native booster name, with a minimal rendering-free adapter: centre-name registration, three constructor draws and one synchronous materialization draw. It resets native math RNG to 17, uses ante 2, builds sorted pools from actual native centres, and outputs only identities, keyed states and subsequent raw values. The checked-in fixture contains numerical results and source hashes only; original Lua and assets remain outside the repository. All 140 regenerated cases were compared against the previous inline outcomes and are identical for accepted identities, complete keyed streams and all four following raw draws.

Source locations: `game.lua:666–673`; `card.lua:1694–1783`, `Card:init`, `Card:set_ability`, `Card:start_materialize`, `Card:juice_up`; `common_events.lua:get_current_pool`, `create_card`. `state_events.lua` contains no alternative Arcana card selector.

## Corrected Celestial materialization RNG gap

The same pack-loop materialization applies to Celestial. The previous `generateApkCelestialPack` constructed each card with only the three constructor draws and omitted the fourth synchronous materialization draw. It preserved selected identities/keyed streams in existing fixtures while leaving the raw math RNG wrong. The function now calls one unconditional raw draw after each constructed card; the generic session and other callers are unchanged.

A separate native oracle at ante 2, seed `AAAAAAA1`, native math seed 17, with hidden hands played once, generates `c_saturn,c_ceres,c_pluto`. The native following raw values are `0.2098773323377312`, `0.24701253781767796`, `0.8379228624136967`, `0.7671012138845594`. The previous generator instead returned first following value `0.44395994139621187`. The focused regression in `tests/core/celestial-pack-generation.test.js` was executed RED against that incorrect value and then passed after the correction. The 64 Celestial fixtures were genuinely regenerated through the original complete pack loop, now retain four following raw values, and carry source SHA-256 metadata. Reproduce with:

```
python scripts/reference-rng/generate-celestial-fixtures.py --assets ../reference-apk/assets --luajit /path/to/pinned/luajit --output tests/fixtures/celestial-native.json
```

## Prerequisites remaining

All generated Tarots and Omen Spectrals must have their exact use/effect handlers before opening Arcana is enabled. In particular, Soul's legendary-Joker creation and ordinary Spectral effects must not be replaced by a smaller generation pool. Native playing-card draw order, target selection and lifecycle remain integration responsibilities. Profile discovery and frame/audio RNG accounting also remain outside this module.
