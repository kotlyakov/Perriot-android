# Remaining native Joker source index

Source-only navigation aid, 2026-10-14. The runtime catalogue currently supports53/150; this index lists97 remaining centres. Native source is the uploaded APK; no original code is copied here. Centre locations are in `game.lua`; hook locations are literal name references in `card.lua`, not a complete dependency or behavior specification. Read the actual surrounding hook and independent source oracle before implementation. Some references initialize/display an ability rather than execute it. Other modules and key-based references are not covered by this index.

| Centre key | Native name | Centre line | Card methods / source lines |
|---|---|---:|---|
| j_mime | Mime | 390 | generate_UIBox_ability_table:755; calculate_joker:2882,3390 |
| j_credit_card | Credit Card | 391 | add_to_deck:593; remove_from_deck:655; generate_UIBox_ability_table:750 |
| j_ceremonial | Ceremonial Dagger | 392 | generate_UIBox_ability_table:764; calculate_joker:2564,3740 |
| j_marble | Marble Joker | 395 | generate_UIBox_ability_table:782; calculate_joker:2583 |
| j_loyalty_card | Loyalty Card | 396 | set_ability:330; generate_UIBox_ability_table:783; calculate_joker:3635 |
| j_8_ball | 8 Ball | 397 | generate_UIBox_ability_table:784; calculate_joker:3109 |
| j_misprint | Misprint | 398 | generate_UIBox_ability_table:766; calculate_joker:3703 |
| j_dusk | Dusk | 399 | generate_UIBox_ability_table:785; calculate_joker:3363 |
| j_chaos | Chaos the Clown | 401 | add_to_deck:601; remove_from_deck:658; generate_UIBox_ability_table:745 |
| j_delayed_grat | Delayed Gratification | 407 | generate_UIBox_ability_table:790; calculate_dollar_bonus:1677 |
| j_hack | Hack | 408 | generate_UIBox_ability_table:756; calculate_joker:3377 |
| j_pareidolia | Pareidolia | 409 | generate_UIBox_ability_table:757; is_face:968 |
| j_gros_michel | Gros Michel | 410 | generate_UIBox_ability_table:791; calculate_joker:3022,3040,4025 |
| j_business | Business Card | 414 | generate_UIBox_ability_table:795; calculate_joker:3178 |
| j_supernova | Supernova | 415 | generate_UIBox_ability_table:796; calculate_joker:3734 |
| j_ride_the_bus | Ride the Bus | 416 | generate_UIBox_ability_table:799; calculate_joker:3528,3995 |
| j_space | Space Joker | 417 | generate_UIBox_ability_table:746; calculate_joker:3423 |
| j_egg | Egg | 419 | generate_UIBox_ability_table:800; calculate_joker:2988 |
| j_burglar | Burglar | 420 | generate_UIBox_ability_table:801; calculate_joker:2525 |
| j_runner | Runner | 422 | generate_UIBox_ability_table:803; calculate_joker:3438,3911 |
| j_ice_cream | Ice Cream | 423 | generate_UIBox_ability_table:804; calculate_joker:3574,3918 |
| j_dna | DNA | 424 | generate_UIBox_ability_table:805; calculate_joker:2486,3504 |
| j_sixth_sense | Sixth Sense | 427 | generate_UIBox_ability_table:754; calculate_joker:2607 |
| j_constellation | Constellation | 428 | generate_UIBox_ability_table:807; calculate_joker:2730 |
| j_hiker | Hiker | 429 | generate_UIBox_ability_table:808; calculate_joker:3070 |
| j_faceless | Faceless Joker | 430 | generate_UIBox_ability_table:758; calculate_joker:2861 |
| j_green_joker | Green Joker | 431 | generate_UIBox_ability_table:749; calculate_joker:2849,3566,4013 |
| j_superposition | Superposition | 432 | generate_UIBox_ability_table:798; calculate_joker:3765 |
| j_todo_list | To Do List | 433 | set_ability:311; generate_UIBox_ability_table:809; calculate_joker:2978,3494 |
| j_cavendish | Cavendish | 435 | generate_UIBox_ability_table:848; calculate_joker:3022,3023,4031 |
| j_card_sharp | Card Sharp | 436 | generate_UIBox_ability_table:849; calculate_joker:4043 |
| j_red_card | Red Card | 437 | generate_UIBox_ability_table:850; calculate_joker:2445,4037 |
| j_madness | Madness | 438 | generate_UIBox_ability_table:851; calculate_joker:2506 |
| j_square | Square Joker | 439 | set_sprites:200; set_ability:248; generate_UIBox_ability_table:852; calculate_joker:3430,3904; load:4766 |
| j_seance | Seance | 440 | generate_UIBox_ability_table:853; calculate_joker:3790 |
| j_riff_raff | Riff-raff | 441 | generate_UIBox_ability_table:854; calculate_joker:2532 |
| j_vampire | Vampire | 442 | generate_UIBox_ability_table:855; calculate_joker:3468 |
| j_hologram | Hologram | 444 | generate_UIBox_ability_table:857; calculate_joker:2460; draw:4524 |
| j_vagabond | Vagabond | 445 | generate_UIBox_ability_table:858; calculate_joker:3746 |
| j_rocket | Rocket | 448 | generate_UIBox_ability_table:861; calculate_dollar_bonus:1666; calculate_joker:2899 |
| j_obelisk | Obelisk | 449 | generate_UIBox_ability_table:862; calculate_joker:3546 |
| j_midas_mask | Midas Mask | 451 | generate_UIBox_ability_table:863; calculate_joker:3446 |
| j_luchador | Luchador | 452 | generate_UIBox_ability_table:864; calculate_joker:2358 |
| j_photograph | Photograph | 453 | set_sprites:197; set_ability:243; generate_UIBox_ability_table:876; calculate_joker:3096; load:4763 |
| j_gift | Gift Card | 454 | generate_UIBox_ability_table:877; calculate_joker:2996 |
| j_turtle_bean | Turtle Bean | 455 | add_to_deck:605; remove_from_deck:662; generate_UIBox_ability_table:878; calculate_joker:2906 |
| j_erosion | Erosion | 456 | generate_UIBox_ability_table:879; calculate_joker:3897 |
| j_reserved_parking | Reserved Parking | 457 | generate_UIBox_ability_table:880; calculate_joker:3305 |
| j_mail | Mail-In Rebate | 458 | generate_UIBox_ability_table:881; calculate_joker:2828 |
| j_to_the_moon | To the Moon | 459 | add_to_deck:613; remove_from_deck:670; generate_UIBox_ability_table:882 |
| j_hallucination | Hallucination | 460 | generate_UIBox_ability_table:883; calculate_joker:2339 |
| j_fortune_teller | Fortune Teller | 461 | generate_UIBox_ability_table:743; calculate_joker:2725,4019 |
| j_juggler | Juggler | 462 | generate_UIBox_ability_table:760 |
| j_drunkard | Drunkard | 463 | generate_UIBox_ability_table:748 |
| j_lucky_cat | Lucky Cat | 467 | generate_UIBox_ability_table:884; calculate_joker:3079 |
| j_baseball | Baseball Card | 468 | generate_UIBox_ability_table:885; calculate_joker:3400 |
| j_diet_cola | Diet Cola | 470 | generate_UIBox_ability_table:887; calculate_joker:2364 |
| j_trading | Trading Card | 471 | generate_UIBox_ability_table:888; calculate_joker:2490,2805 |
| j_flash | Flash Card | 472 | generate_UIBox_ability_table:889; calculate_joker:2407,4001 |
| j_popcorn | Popcorn | 473 | generate_UIBox_ability_table:890; calculate_joker:2948,4007 |
| j_trousers | Spare Trousers | 474 | generate_UIBox_ability_table:797; calculate_joker:3415,3989 |
| j_ancient | Ancient Joker | 475 | generate_UIBox_ability_table:892; calculate_joker:3258 |
| j_ramen | Ramen | 476 | generate_UIBox_ability_table:891; calculate_joker:2760 |
| j_selzer | Seltzer | 478 | generate_UIBox_ability_table:894; calculate_joker:3370,3604 |
| j_castle | Castle | 479 | generate_UIBox_ability_table:895; calculate_joker:2817,3883 |
| j_campfire | Campfire | 481 | generate_UIBox_ability_table:897; calculate_joker:2399,2892 |
| j_ticket | Golden Ticket | 483 | generate_UIBox_ability_table:823; calculate_joker:3153 |
| j_mr_bones | Mr. Bones | 484 | generate_UIBox_ability_table:824; calculate_joker:3050 |
| j_sock_and_buskin | Sock and Buskin | 486 | generate_UIBox_ability_table:826; calculate_joker:3347 |
| j_troubadour | Troubadour | 488 | add_to_deck:623; remove_from_deck:680; generate_UIBox_ability_table:828 |
| j_certificate | Certificate | 489 | generate_UIBox_ability_table:829; calculate_joker:2466 |
| j_smeared | Smeared Joker | 490 | generate_UIBox_ability_table:810; is_suit:4075,4087 |
| j_throwback | Throwback | 491 | generate_UIBox_ability_table:830; calculate_joker:2432; update:4179 |
| j_hanging_chad | Hanging Chad | 492 | generate_UIBox_ability_table:831; calculate_joker:3355 |
| j_rough_gem | Rough Gem | 493 | generate_UIBox_ability_table:832; calculate_joker:3227 |
| j_bloodstone | Bloodstone | 494 | generate_UIBox_ability_table:833; calculate_joker:3250 |
| j_glass | Glass Joker | 497 | generate_UIBox_ability_table:836; calculate_joker:2650,2690,2712 |
| j_ring_master | Showman | 499 | generate_UIBox_ability_table:837 |
| j_blueprint | Blueprint | 501 | generate_UIBox_ability_table:811; calculate_joker:2307; update:4228,4232 |
| j_wee | Wee Joker | 502 | set_ability:253; generate_UIBox_ability_table:839; calculate_joker:3086,3876; load:4760 |
| j_merry_andy | Merry Andy | 503 | generate_UIBox_ability_table:840 |
| j_oops | Oops! All 6s | 504 | add_to_deck:608; remove_from_deck:665; generate_UIBox_ability_table:759 |
| j_idol | The Idol | 505 | generate_UIBox_ability_table:841; calculate_joker:3130 |
| j_matador | Matador | 507 | generate_UIBox_ability_table:843; calculate_joker:2739,3722 |
| j_hit_the_road | Hit the Road | 508 | generate_UIBox_ability_table:844; calculate_joker:2838,3014 |
| j_stuntman | Stuntman | 515 | add_to_deck:627; remove_from_deck:684; generate_UIBox_ability_table:898; calculate_joker:3716 |
| j_invisible | Invisible Joker | 516 | set_ability:308; generate_UIBox_ability_table:899; calculate_joker:2374,2937; draw:4447 |
| j_brainstorm | Brainstorm | 517 | generate_UIBox_ability_table:900; calculate_joker:2324; update:4228,4230 |
| j_satellite | Satellite | 518 | generate_UIBox_ability_table:909; calculate_dollar_bonus:1669 |
| j_cartomancer | Cartomancer | 521 | generate_UIBox_ability_table:820; calculate_joker:2548 |
| j_astronomer | Astronomer | 522 | set_cost:380; add_to_deck:616; remove_from_deck:673; generate_UIBox_ability_table:821 |
| j_burnt | Burnt Joker | 523 | generate_UIBox_ability_table:915; calculate_joker:2752 |
| j_caino | Caino | 525 | set_ability:324; generate_UIBox_ability_table:917; calculate_joker:2626,2676,4055 |
| j_triboulet | Triboulet | 526 | generate_UIBox_ability_table:918; calculate_joker:3265 |
| j_yorick | Yorick | 527 | set_ability:327; generate_UIBox_ability_table:919; calculate_joker:2791 |
| j_chicot | Chicot | 528 | add_to_deck:596; generate_UIBox_ability_table:920; calculate_joker:2495 |
| j_perkeo | Perkeo | 529 | generate_UIBox_ability_table:921; calculate_joker:2416 |
