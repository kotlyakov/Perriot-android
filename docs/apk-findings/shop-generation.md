# Full shop generation — conditional APK oracle, 2026-10-08

Reference APK SHA256 `6236dc68a312d04295839cfbfd2699d4751877bdf162c3a4ce425481d28397bd`; upstream LuaJIT2.1.1700008891 commit43d0a19158ceabaa51b0462c1ebc97612b420a2e. Full original game/Android has NOT been run.

## Catalogue and pool construction

`assets/game.lua:367-702` contains centre catalogue; `:739-765` applies profile meta; `:832-861` builds and sorts pools. An independent temporary Lua execution uses the whole original catalogue, not a reduced surrogate: **150 Jokers,22 Tarot,12 Planet,18 Spectral,32 Vouchers,32 Boosters**. Rarity-specific Joker pools are complete and sorted by original `order`. WIP, skip_pool, omit, FTP/demo and profile loading matter; full edition (`FTP_LOCKED=false`) clears demo flags before sorting.

Fresh profile explicitly means: start_locked boolean entities stay locked, no `meta.unlocked` overrides, discovered defaults follow start_discovered. A player's existing profile can change pool eligibility, so run seed alone is insufficient to establish inventory parity.

## Ordered main-card selection

`assets/functions/UI_definitions.lua:791-848`:

1. Forced tutorial shop overrides ordinary generation.
2. Tags may create/modify a forced card.
3. Advance key `cdt`+ante; draw type poll times sum of rates.
4. Ordered ranges are Joker, Tarot, Planet, Base/Enhanced, Spectral. Ordinary White/Red rates20,4,4,0,0.
5. Used Illusion voucher advances its type poll during range-table construction even when no playing card is picked.
6. Call `create_card(type, shop_jokers, nil,nil,nil,nil,nil,'sho')`.
7. Queue UI/tag changes; apply conditional playing-card Illusion edition polls.

`assets/functions/common_events.lua:2121-2203`:

- Soul/Black Hole override is only polled when soulable is truthy. Ordinary shop call passes nil, so it performs no Soul override polls.
- Joker rarity: key `rarity`+ante+`sho`; >0.95 rare, >0.7 uncommon, otherwise common.
- Get complete pool; sample using its key. Preserve `UNAVAILABLE` placeholders. Rejection starts at suffix `_resample2`, then3,4,etc, advancing each specific key.
- Main Joker key `Joker`+rarity+`sho`+ante. Tarot `Tarotsho`+ante; Planet `Planetsho`+ante.
- Playing Base/Enhanced additionally samples its front using key`frontsho`+ante.
- Card constructor sets ability and consumes three unkeyed random draws for discard rotation/x/y.
- Consumables materialize; their animation consumes a further unkeyed random choice when reduced_motion=false.
- Shop Joker **always** polls `etperpoll`+ante, even on White stake when Eternal/Perishable modifiers are disabled. Rental poll `ssjr`+ante occurs only when rental modifier is enabled.
- Joker edition key`edisho`+ante; checks Negative first (>1-0.003), then Polychrome (>1-0.006×edition_rate), Holo (>1-0.02×edition_rate), Foil (>1-0.04×edition_rate). Do not replace with independently weighted categorical rolls.
- `check_for_unlock({type='have_edition'})` is called. `assets/functions/common_events.lua:1185-1188` immediately returns for seeded runs; unseeded profile unlock side effects are outside these fixtures.

## Pool filters (keep original positions)

`assets/functions/common_events.lua:2002-2091`:

- Duplicate exclusion consults `used_jokers` unless an owned Showman exists. `Card:set_ability` marks centre-name matches used **at construction**, not only after purchase (`assets/card.lua:347-355`). Thus the second shop card already excludes the first shop card's centre.
- Locked (`unlocked==false`) entries are unavailable, except rarity4.
- Vouchers exclude previously used, require ALL prerequisite vouchers used, and exclude vouchers already in shop voucher area.
- Planets with softlock require the associated hand's played count>0. Ordinary nine hands are available; hidden hands depend on play history.
- Enhancement-gated Jokers require an actual playing card bearing that enhancement.
- Black Hole and Soul are excluded from ordinary pools.
- no_pool_flag, yes_pool_flag and banned_keys apply after set-specific eligibility.
- Empty valid pool uses original set fallback (e.g. Joker→j_joker, Tarot→c_strength, Planet→c_pluto, Voucher→v_blank). It is not permission to truncate a populated pool.

## Voucher and booster timing

`assets/game.lua:2375-2379` selects current_round.voucher at start_run, before round gameplay. It advances `Voucher`+ante, rejection suffixes as above. The first shop displays this stored centre; it does **not** reroll voucher at shop entry.

`assets/game.lua:3458-3510`: shop creates two main cards, then voucher, then two booster positions. Loading saved areas bypasses regeneration. used_packs prevents bought/opened pack slots returning. `get_pack('shop_pack')` uses the complete sorted Booster pool with original weights and banned filters. First pack forces Buffoon normal1/2 unless normal1 is banned or first_shop_buffoon is already true; specifically the source condition is **not first_shop_buffoon AND not banned normal1**. Later weighted pack key`shop_pack`+ante.

### Critical cosmetic random consumption

The forced first Buffoon variant uses unkeyed `math.random(1,2)`. Its preceding state is NOT an invented fresh PRNG state:

- Last main-card creation establishes a known latest keyed poll and native random state.
- Voucher Card:init consumes three global draws.
- Voucher start_materialize calls Moveable:juice_up, consuming one unkeyed random choice when reduced_motion=false (`assets/engine/moveable.lua:250-263`); true consumes none.
- get_pack then draws Buffoon variant.
- Original shop-generation loops execute inside one synchronous event callback. Rendering/audio events queued during that callback are not executed halfway through the loops. Immediate constructors/materialize calls still matter.

The oracle demonstrates same seed with reduced_motion switched can change first Buffoon variant. For AAAAAAA1: normal motion→normal1, reduced motion→normal2. For PIERROT1: normal motion→normal2, reduced motion→normal1. The numeric/global state is derived from original polls and enumerated immediate draws, not assumed from application launch.

## Reroll

`assets/functions/button_callbacks.lua:2950-2992` clears only main-shop cards; removal clears used-name flags when no matching owned Joker/consumable remains (`assets/card.lua:4828-4836`). Voucher and booster survive. Reroll creates each new main card and immediately calls juice_up. The next card's type poll reseeds keyed RNG, but unkeyed animation calls should still be retained if modeling complete global state. Default paid5 changes next price6; free-count handling is independently documented in shop-economy.md.

## Actual isolated oracle and honest limits

Files:

- `scripts/reference-rng/generate-shop-fixtures.py`
- `scripts/reference-rng/shop-fixtures.json`

Six cases: three seedsAAAAAAA1,PIERROT1,12345678 × reduced_motion false/true, with first shop and one no-purchase reroll. Own numerical output contains entity keys, editions, actual original price/sell calculation, full pool counts, mutable seed state and ordered native/keyed RNG trace. JIT-enabled and interpreter executions agree.

Executed original code (temporary outside repository): full centre catalogue literal, RNG, pseudorandom_element, EMPTY/copy_table/find_joker, get_current_pool/get_next_voucher/get_pack/poll_edition/create_card/create_card_for_shop, **Card:set_ability and Card:set_cost**. No original source/art/APK is committed.

Explicit adapters: Card:init display setup is replaced with actual set_ability, documented three random draws and original pricing. Rendering is skipped; sprite random-variant metadata is checked absent. set_edition stores result and recomputes cost; asynchronous events are queued but not run. Materialize/juice_up represents its immediate single native random choice; other visual state is omitted. Card removal replays only relevant used-name clearing. These adapters make this a **conditional selection oracle**, not full original game execution.

Minimal G inputs fixed for these cases: fresh profile unlock defaults, full edition, explicitly seeded run, White/Red, ante1, no tags/Jokers/consumables/used vouchers/bans/pool flags, edition_rate1, inflation0/discount0, tutorial_complete, plain base deck, first win using High Card only, nine ordinary hands visible/secret hands unplayed, empty shop areas, false first_shop_buffoon. This does not claim the user's existing profile has those inputs.

Reproduce:

```sh
python scripts/reference-rng/generate-shop-fixtures.py --apk /path/to/reference.apk --luajit /path/to/pinned/luajit --output /tmp/shop-fixtures.json
```

Remaining exact gates: real profile meta and actual hand/play history; tags and all shop-modifying Joker/voucher effects; prior purchases and duplicate ownership; later ante/voucher state; challenge/FTP/tutorial paths; asynchronous game integration and device trace. The full catalogue is present in this oracle, but effect completeness and full-game parity are not thereby established.
