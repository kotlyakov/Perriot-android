# Remaining native pack generation (item 8b)

Source: supplied APK 1.0.1n Lua functions. The implementation retains the full catalogue and uses the existing conditional shop selection session, including rarity pools, lock/ban/gate flags, native `UNAVAILABLE` resampling, duplicate suppression, Showman, and pricing. Original source/assets are not retained in the repository.

| Kind | Native identities | Normal size | Jumbo/Mega size | Mega choices |
|---|---:|---:|---:|---:|
| Standard | 8 | 3 | 5 | 2 |
| Buffoon | 4 | 2 | 4 | 2 |
| Spectral | 4 | 2 | 4 | 2 |

Other packs allow one choice. `getRemainingBoosterConfig` exposes `{size, choices, kind}`. Standard offers retain the actual `c_base`/`m_*` identity and native front key; `enhancement` uses the normalized gameplay value (`bonus`, `stone`, etc.). Editions use `base`, `foil`, `holographic`, `polychrome`; seals use lowercase names. Buffoon offers retain ordinary Joker fields and may also be negative, eternal, perishable, or rental.

Standard chooses Enhanced when `stdset<ante>` exceeds 0.6, otherwise Base, then samples `frontsta<ante>`. Edition uses `standard_edition<ante>`, with modifier 2 and no negative outcome; native edition-rate multipliers remain effective. Seal chance is 20%, followed by equal Purple/Gold/Blue/Red quarters. Buffoon uses the full ordinary Joker rarity pools with append `buf`, `packetper<ante>`, optional `packssjr<ante>`, and `edibuf<ante>`. Spectral uses append `spe` and the two sequential `soul_Spectral<ante>` polls: a Black Hole hit can replace a Soul hit. Banning Soul suppresses both rare polls. Rare and ordinary generated identities immediately enter the used-name set.

## Independent numerical oracle

`generate-booster-fixtures.py` extracts and executes the supplied original `get_current_pool`, `create_card`, `poll_edition`, `Card:set_ability`, `Card:set_cost`, sticker setters, and entire `Card:open` pack loop in native LuaJIT. The JavaScript implementation is never imported into fixture generation. Only numerical outcomes, identities, and source hashes are retained in `tests/fixtures/booster-native.json.gz`.

The fixture contains 4,242 cases: 101 seeds (BOOST1–BOOST100 plus BOOST244), three kinds, two sizes, and seven contexts (base, owned, Showman, banned, stake modifiers, all-eternal, exhausted pools). It compares exact offers/prices, every keyed stream, and four subsequent raw `math.random` draws. JIT/interpreter results match. Coverage includes all eight enhancements, four seals, all five editions across applicable kinds, Soul/Black Hole, all sticker types, and To Do List. Buffoon fixtures select 99 distinct Jokers; the generator uses the full 150-entry native catalogue rather than a reduced supported-effect list.

The synchronous boundary includes three constructor rotation/x/y draws and one `start_materialize` juice draw per card, including reduced motion. Queued edition/seal animation callbacks, rendering, audio, profile statistics, and later events are deliberately excluded. As with the previous pack oracles, this establishes selection/construction parity, not full frame/event RNG parity.

To Do List's native hand list is built with Lua `pairs`; table hash traversal changes across native processes. The oracle adapter therefore supplies the explicit context `visibleHandOrder` (the existing shop default) when traversing `G.GAME.hands`. The source ability function and its selection/draws remain unchanged. Constructor sprite setup is omitted; centre-name registration, ability initialization, pricing, and its three raw draws remain.

Reproduce with the supplied private assets and pinned runtime:

```sh
python scripts/reference-rng/generate-booster-fixtures.py \
  --assets /path/to/private/assets \
  --luajit /path/to/pinned/LuaJIT/src/luajit \
  --output /tmp/booster-native.json.gz
cmp /tmp/booster-native.json.gz tests/fixtures/booster-native.json.gz
node --test tests/core/booster-generation.test.js
```

Pinned LuaJIT commit: `43d0a19158ceabaa51b0462c1ebc97612b420a2e`. SHA-256 of the deterministic compressed fixture: `c91d38a1f52648d5981b4ab02a7d419c5c329fe1ca5718f1cd6faac45e094e49`. Source SHA-256 values are embedded in fixture metadata.
