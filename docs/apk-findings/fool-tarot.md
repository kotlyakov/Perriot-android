# Fool owned Tarot copy

Reference APK 1.0.1n-FULL inspected in scratch only; original Lua/art/audio is excluded from repository and release.

Card:can_use_consumeable (card.lua:1555) allows an owned Fool when the previous Tarot/Planet exists and is not Fool. Owned usage removes the source before its delayed effect. Card:remove_from_deck removes the negative slot bonus; card.lua:1374–1384 only creates when remaining consumables fit. Full ordinary inventory frees its own slot; full negative-expanded inventory can consume without producing a copy. Debuff consumes/counts without creation.

create_card with forced previous key ignores duplicate ownership, unlock and Planet softlocks; it creates a fresh base edition with native Card:set_cost quotation (inflation, discount, Astronomer; minimum sell value1). Banned forced key instead requires combined Tarot_Planet fallback ordering: deliberately unavailable in this scoped block, not silently approximated.

Usage/history follows common_events and misc_functions native ordering: the copy reads the prior key, after which history becomes c_fool. Generated copy does not count as another use. Deterministic instance IDs and collision checks prevent duplicating/replacing unrelated instances. No keyed selection or edition RNG is consumed on a permitted forced key. Three Card constructor draws plus materialize juice plus used-Fool juice advance five raw Math RNG steps for both reduced-motion settings. Independent QA ran native create_card/set_cost/juice_up adapters from byte-verified source. Native deferred materialization sound draws and their event/throttle timing are not modeled here; full original visual RNG parity remains open. Legacy states without APK RNG retain their own RNG.

Tests cover atomic rejection, missing/Fool history, normal and negative capacity, previous unsupported Tarot, lock/softlock, pricing, Astronomer quotation, debuff, collision, context corruption, purchase, use and save reload. UI checks desktop/mouse and mobile/touch, disabled state, copied Planet use, double clicks and failed durable writes. Physical Android checks and user acceptance remain separate.
