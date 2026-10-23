# Skip rewards — direct APK inspection

Source: uploaded `Balatro_1.0.1n_0.4_25_noPairip.apk`, extracted private Lua assets, inspected 2026-10-09. Original gameplay was not run for this change. These are own-prose findings, not copied Lua. Matching unit tests establish JavaScript state behavior; they do not establish complete native skip parity.

## Order and RNG

`functions/button_callbacks.lua:2835–2876` increments the lifetime skip counter before adding the selected tag, advances Small→Big or Big→Boss, sends owned Jokers their skip context, saves, applies immediate tags, then applies new-blind-choice tags. Skipping does not cash out, generate a shop, draw cards, shuffle a deck, or select replacement Small/Big tags.

`tag.lua:148–204` credits Speed using the already incremented skip total ×5; Garbage using lifetime unused discards; Handy using lifetime hands played; Economy using min(40, max(0, current dollars)); Orbital increases the already selected hand by three levels. None of those handlers polls RNG. `functions/state_events.lua:142` accumulates remaining discards at end round, and `:544–545` increments lifetime and current-round hand counters during hand execution.

Boss Tag invokes the ordinary boss reroll without its $10 charge (`tag.lua:281–299`; `functions/button_callbacks.lua:2895–2945`). It chooses once from the ordinary full boss pool using existing usage counts and the `boss` keyed stream. It does not reject and reroll an unsupported boss until a supported one appears. Rebuilding the Boss panel preserves the already stored orbital choice: `functions/UI_definitions.lua:1613–1622` polls `orbital` only if that ante/blind choice is missing.

The original full catalogue has 24 ordered tags (`game.lua:227–251`). Availability gates keep unavailable positions rather than shrinking the pool. This project preserves those entries and gates independently of executable reward support.

## Implemented boundary

`SKIP_BLIND` atomically grants Economy, Speed, Handy, Garbage, Orbital or a supported Boss reroll, increments its revision once and advances directly to the next blind-selection state. Persistent `runStats` stores exact hands played, unused discards and skips from new native runs. Old saves without those counters reject skip with an explicit explanation; guessed history is not substituted.

The original full catalogue remains selectable. Shop-Joker and edition rewards, Investment, Voucher, packs, Coupon, Double, Juggle, D6 and Top-up remain unavailable because their downstream lifecycle is absent. Unsupported rewards do not pay substitute money or silently consume the blind. Big skip also requires an executable first-ante boss; ante-2 Big→Boss is blocked. Boss reroll previews the one exact selection and rejects atomically if its effect is unavailable, preserving both RNG and usage counts.

This boundary relies on current owned Jokers having no skip contexts (the currently executable Joker catalogue). Wider Joker support will require applying their real skip contexts in source order. Additional persistent tag state and pack/consumable/shop hooks are required before those blocked rewards can become executable.
