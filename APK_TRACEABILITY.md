# APK Traceability Matrix

| Rule | APK source | Symbol/context | Status |
|---|---|---|---|
| SHOP-001 default main slots=2 | assets/game.lua | GAME.shop.joker_max | confirmed |
| SHOP-002 base reroll=$5 | assets/game.lua | base_reroll_cost/current_round | confirmed |
| SHOP-003 reroll +$1 each normal use | assets/functions/common_events.lua | calculate_reroll_cost | confirmed |
| SHOP-004 free reroll costs $0 | assets/functions/common_events.lua | calculate_reroll_cost | confirmed |
| SHOP-005 reroll replaces main shop cards only | assets/functions/button_callbacks.lua | reroll_shop | confirmed |
| SHOP-006 default type weights 20/4/4/0/0 | assets/game.lua + UI_definitions.lua | rates/create_card_for_shop | confirmed |
| SHOP-007 one voucher area | assets/game.lua | update_shop | confirmed |
| SHOP-008 two booster slots | assets/game.lua | update_shop loop 1..2 | confirmed |
| SHOP-009 first booster Buffoon | assets/functions/common_events.lua | get_pack | confirmed |
| SHOP-010 restore shop without regeneration | assets/game.lua | load_shop_* in update_shop | confirmed |
| BLIND-001 Small payout=$3 | assets/game.lua | bl_small | confirmed |
| BLIND-002 Big payout=$4 | assets/game.lua | bl_big | confirmed |
| SHOP-011 affordability respects bankrupt_at | assets/functions/button_callbacks.lua | can_buy/can_redeem/can_open/can_reroll | confirmed |
| SHOP-012 edition/inflation/discount price formula | assets/card.lua | Card:set_cost | confirmed |
| SHOP-013 sell=max(1,floor(cost/2))+extra_value | assets/card.lua | Card:set_cost | confirmed |
| SHOP-014 Eternal cannot be sold | assets/card.lua | Card:can_sell_card | confirmed |
| SHOP-015 purchase checks inventory capacity separately | assets/functions/button_callbacks.lua | check_for_buy_space/buy_from_shop | confirmed |
| SHOP-016 buying triggers buying_card contexts | assets/functions/button_callbacks.lua | buy_from_shop | confirmed |
| SHOP-017 inflation increments after qualifying purchase | assets/functions/button_callbacks.lua | buy_from_shop | confirmed |
| SHOP-018 free reroll does not advance paid tier | assets/functions/button_callbacks.lua + common_events.lua | reroll_shop/calculate_reroll_cost | confirmed |
| SHOP-019 leaving shop triggers ending_shop then BLIND_SELECT | assets/functions/button_callbacks.lua | toggle_shop | confirmed |
| SHOP-020 opened booster slot becomes USED | assets/functions/button_callbacks.lua | use_card Booster branch | confirmed |
| SHOP-021 redeemed voucher clears current voucher and applies run effect | assets/card.lua | Card:redeem | confirmed |
