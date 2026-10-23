// Factual unlock thresholds from uploaded Balatro 1.0.1n game.lua. Own implementation.
export const PROFILE_UNLOCKS = {
  "j_dusk": {
    "type": "",
    "extra": "",
    "hidden": true
  },
  "j_ride_the_bus": {
    "type": "discard_custom"
  },
  "j_ticket": {
    "type": "hand_contents",
    "extra": "Gold"
  },
  "j_mr_bones": {
    "type": "c_losses",
    "extra": 5
  },
  "j_acrobat": {
    "type": "c_hands_played",
    "extra": 200
  },
  "j_sock_and_buskin": {
    "type": "c_face_cards_played",
    "extra": 300
  },
  "j_swashbuckler": {
    "type": "c_jokers_sold",
    "extra": 20
  },
  "j_troubadour": {
    "type": "round_win",
    "extra": 5
  },
  "j_certificate": {
    "type": "double_gold"
  },
  "j_smeared": {
    "type": "modify_deck",
    "extra": {
      "count": 3,
      "enhancement": "Wild Card",
      "e_key": "m_wild"
    }
  },
  "j_throwback": {
    "type": "continue_game"
  },
  "j_hanging_chad": {
    "type": "round_win",
    "extra": "High Card"
  },
  "j_rough_gem": {
    "type": "modify_deck",
    "extra": {
      "count": 30,
      "suit": "Diamonds"
    }
  },
  "j_bloodstone": {
    "type": "modify_deck",
    "extra": {
      "count": 30,
      "suit": "Hearts"
    }
  },
  "j_arrowhead": {
    "type": "modify_deck",
    "extra": {
      "count": 30,
      "suit": "Spades"
    }
  },
  "j_onyx_agate": {
    "type": "modify_deck",
    "extra": {
      "count": 30,
      "suit": "Clubs"
    }
  },
  "j_glass": {
    "type": "modify_deck",
    "extra": {
      "count": 5,
      "enhancement": "Glass Card",
      "e_key": "m_glass"
    }
  },
  "j_ring_master": {
    "type": "ante_up",
    "ante": 4
  },
  "j_flower_pot": {
    "type": "ante_up",
    "ante": 8
  },
  "j_blueprint": {
    "type": "win_custom"
  },
  "j_wee": {
    "type": "win",
    "n_rounds": 18
  },
  "j_merry_andy": {
    "type": "win",
    "n_rounds": 12
  },
  "j_oops": {
    "type": "chip_score",
    "chips": 10000
  },
  "j_idol": {
    "type": "chip_score",
    "chips": 1000000
  },
  "j_seeing_double": {
    "type": "hand_contents",
    "extra": "four 7 of Clubs"
  },
  "j_matador": {
    "type": "round_win"
  },
  "j_hit_the_road": {
    "type": "discard_custom"
  },
  "j_duo": {
    "type": "win_no_hand",
    "extra": "Pair"
  },
  "j_trio": {
    "type": "win_no_hand",
    "extra": "Three of a Kind"
  },
  "j_family": {
    "type": "win_no_hand",
    "extra": "Four of a Kind"
  },
  "j_order": {
    "type": "win_no_hand",
    "extra": "Straight"
  },
  "j_tribe": {
    "type": "win_no_hand",
    "extra": "Flush"
  },
  "j_stuntman": {
    "type": "chip_score",
    "chips": 100000000
  },
  "j_invisible": {
    "type": "win_custom"
  },
  "j_brainstorm": {
    "type": "discard_custom"
  },
  "j_satellite": {
    "type": "money",
    "extra": 400
  },
  "j_shoot_the_moon": {
    "type": "play_all_hearts"
  },
  "j_drivers_license": {
    "type": "modify_deck",
    "extra": {
      "count": 16,
      "tally": "total"
    }
  },
  "j_cartomancer": {
    "type": "discover_amount",
    "tarot_count": 22
  },
  "j_astronomer": {
    "type": "discover_amount",
    "planet_count": 12
  },
  "j_burnt": {
    "type": "c_cards_sold",
    "extra": 50
  },
  "j_bootstraps": {
    "type": "modify_jokers",
    "extra": {
      "polychrome": true,
      "count": 2
    }
  },
  "j_caino": {
    "type": "",
    "extra": "",
    "hidden": true
  },
  "j_triboulet": {
    "type": "",
    "extra": "",
    "hidden": true
  },
  "j_yorick": {
    "type": "",
    "extra": "",
    "hidden": true
  },
  "j_chicot": {
    "type": "",
    "extra": "",
    "hidden": true
  },
  "j_perkeo": {
    "type": "",
    "extra": "",
    "hidden": true
  },
  "v_overstock_plus": {
    "type": "c_shop_dollars_spent",
    "extra": 2500
  },
  "v_liquidation": {
    "type": "run_redeem",
    "extra": 10
  },
  "v_glow_up": {
    "type": "have_edition",
    "extra": 5
  },
  "v_reroll_glut": {
    "type": "c_shop_rerolls",
    "extra": 100
  },
  "v_omen_globe": {
    "type": "c_tarot_reading_used",
    "extra": 25
  },
  "v_observatory": {
    "type": "c_planetarium_used",
    "extra": 25
  },
  "v_nacho_tong": {
    "type": "c_cards_played",
    "extra": 2500
  },
  "v_recyclomancy": {
    "type": "c_cards_discarded",
    "extra": 2500
  },
  "v_tarot_tycoon": {
    "type": "c_tarots_bought",
    "extra": 50
  },
  "v_planet_tycoon": {
    "type": "c_planets_bought",
    "extra": 50
  },
  "v_money_tree": {
    "type": "interest_streak",
    "extra": 10
  },
  "v_antimatter": {
    "type": "blank_redeems",
    "extra": 10
  },
  "v_illusion": {
    "type": "c_playing_cards_bought",
    "extra": 20
  },
  "v_petroglyph": {
    "type": "ante_up",
    "ante": 12,
    "extra": 12
  },
  "v_retcon": {
    "type": "blind_discoveries",
    "extra": 25
  },
  "v_palette": {
    "type": "min_hand_size",
    "extra": 5
  },
  "b_blue": {
    "type": "discover_amount",
    "amount": 20
  },
  "b_yellow": {
    "type": "discover_amount",
    "amount": 50
  },
  "b_green": {
    "type": "discover_amount",
    "amount": 75
  },
  "b_black": {
    "type": "discover_amount",
    "amount": 100
  },
  "b_magic": {
    "type": "win_deck",
    "deck": "b_red"
  },
  "b_nebula": {
    "type": "win_deck",
    "deck": "b_blue"
  },
  "b_ghost": {
    "type": "win_deck",
    "deck": "b_yellow"
  },
  "b_abandoned": {
    "type": "win_deck",
    "deck": "b_green"
  },
  "b_checkered": {
    "type": "win_deck",
    "deck": "b_black"
  },
  "b_zodiac": {
    "type": "win_stake",
    "stake": 2
  },
  "b_painted": {
    "type": "win_stake",
    "stake": 3
  },
  "b_anaglyph": {
    "type": "win_stake",
    "stake": 4
  },
  "b_plasma": {
    "type": "win_stake",
    "stake": 5
  },
  "b_erratic": {
    "type": "win_stake",
    "stake": 7
  }
};
