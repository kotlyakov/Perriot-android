// Challenge run configuration facts, based on Balatro 1.0.1 challenge rules.
// Independent data catalog: gameplay enforcement and profile persistence are
// implemented separately. Do not treat a listed challenge as playable yet.
// Reference: https://teemo.dev/game-design/balatro/systems/decks-stakes-and-vouchers-reference/
export const CHALLENGES=Object.freeze([
  {
    "number": 1,
    "id": "omelette",
    "name": "The Omelette",
    "startingJokers": [
      {
        "id": "j_egg"
      },
      {
        "id": "j_egg"
      },
      {
        "id": "j_egg"
      },
      {
        "id": "j_egg"
      },
      {
        "id": "j_egg"
      }
    ],
    "modifiers": {
      "noReward": true,
      "noHandMoney": true,
      "noInterest": true
    },
    "bannedCentreIds": [
      "v_seed_money",
      "v_money_tree",
      "j_to_the_moon",
      "j_rocket",
      "j_golden",
      "j_satellite"
    ]
  },
  {
    "number": 2,
    "id": "fifteen_minute_city",
    "name": "15 Minute City",
    "deckPattern": "double_faces",
    "startingJokers": [
      {
        "id": "j_ride_the_bus",
        "eternal": true
      },
      {
        "id": "j_shortcut",
        "eternal": true
      }
    ]
  },
  {
    "number": 3,
    "id": "rich_get_richer",
    "name": "Rich get Richer",
    "money": 100,
    "modifiers": {
      "chipsDollarCap": true
    },
    "startingVouchers": [
      "v_seed_money",
      "v_money_tree"
    ]
  },
  {
    "number": 4,
    "id": "knife_edge",
    "name": "On a Knife's Edge",
    "startingJokers": [
      {
        "id": "j_ceremonial",
        "eternal": true,
        "pinned": true
      }
    ]
  },
  {
    "number": 5,
    "id": "xray_vision",
    "name": "X-ray Vision",
    "modifiers": {
      "flippedCards": 4
    }
  },
  {
    "number": 6,
    "id": "mad_world",
    "name": "Mad World",
    "deckPattern": "ranks_2_to_9",
    "modifiers": {
      "noHandMoney": true,
      "noInterest": true
    },
    "startingJokers": [
      {
        "id": "j_pareidolia",
        "eternal": true,
        "negative": true
      },
      {
        "id": "j_business",
        "eternal": true
      }
    ],
    "bannedBossIds": [
      "bl_plant"
    ]
  },
  {
    "number": 7,
    "id": "luxury_tax",
    "name": "Luxury Tax",
    "handSize": 10,
    "modifiers": {
      "minusHandSizePerDollars": 5
    }
  },
  {
    "number": 8,
    "id": "non_perishable",
    "name": "Non-Perishable",
    "modifiers": {
      "allEternal": true
    },
    "bannedCentreIds": [
      "j_gros_michel",
      "j_cavendish",
      "j_ice_cream",
      "j_turtle_bean",
      "j_ramen",
      "j_diet_cola",
      "j_selzer",
      "j_popcorn",
      "j_mr_bones",
      "j_invisible",
      "j_luchador"
    ],
    "bannedBossIds": [
      "bl_final_leaf"
    ]
  },
  {
    "number": 9,
    "id": "medusa",
    "name": "Medusa",
    "deckPattern": "face_stone",
    "startingJokers": [
      {
        "id": "j_marble",
        "eternal": true
      }
    ]
  },
  {
    "number": 10,
    "id": "double_or_nothing",
    "name": "Double or Nothing",
    "deckPattern": "red_seals",
    "modifiers": {
      "debuffPlayedCards": true
    }
  },
  {
    "number": 11,
    "id": "typecast",
    "name": "Typecast",
    "modifiers": {
      "eternalAfterAnte": 4,
      "zeroJokerSlotsAfterAnte": 4
    },
    "bannedBossIds": [
      "bl_final_leaf"
    ]
  },
  {
    "number": 12,
    "id": "inflation",
    "name": "Inflation",
    "modifiers": {
      "inflationPerPurchase": 1
    },
    "startingJokers": [
      {
        "id": "j_credit_card"
      }
    ],
    "bannedCentreIds": [
      "v_clearance_sale",
      "v_liquidation"
    ]
  },
  {
    "number": 13,
    "id": "bram_poker",
    "name": "Bram Poker",
    "modifiers": {
      "noShopJokers": true
    },
    "startingJokers": [
      {
        "id": "j_vampire",
        "eternal": true
      }
    ],
    "startingVouchers": [
      "v_magic_trick",
      "v_illusion"
    ],
    "startingConsumables": [
      "c_emperor",
      "c_empress"
    ]
  },
  {
    "number": 14,
    "id": "fragile",
    "name": "Fragile",
    "deckPattern": "glass",
    "startingJokers": [
      {
        "id": "j_oops",
        "eternal": true,
        "negative": true
      },
      {
        "id": "j_oops",
        "eternal": true,
        "negative": true
      }
    ],
    "bannedCentreIds": [
      "j_marble",
      "j_vampire",
      "j_midas_mask",
      "j_certificate",
      "c_magician",
      "c_empress",
      "c_heirophant",
      "c_chariot",
      "c_devil",
      "c_tower",
      "c_lovers",
      "c_incantation",
      "c_grim",
      "c_familiar",
      "v_magic_trick",
      "v_illusion"
    ],
    "bannedTagIds": [
      "tag_standard"
    ],
    "bannedBoosterFamilies": [
      "standard"
    ]
  },
  {
    "number": 15,
    "id": "monolith",
    "name": "Monolith",
    "startingJokers": [
      {
        "id": "j_obelisk",
        "eternal": true
      },
      {
        "id": "j_marble",
        "eternal": true,
        "negative": true
      }
    ]
  },
  {
    "number": 16,
    "id": "blast_off",
    "name": "Blast Off",
    "hands": 2,
    "discards": 2,
    "jokerSlots": 4,
    "startingJokers": [
      {
        "id": "j_constellation",
        "eternal": true
      },
      {
        "id": "j_rocket",
        "eternal": true
      }
    ],
    "startingVouchers": [
      "v_planet_merchant",
      "v_planet_tycoon"
    ],
    "bannedCentreIds": [
      "v_grabber",
      "v_nacho_tong",
      "j_burglar"
    ]
  },
  {
    "number": 17,
    "id": "five_card_draw",
    "name": "Five-Card Draw",
    "discards": 6,
    "handSize": 5,
    "jokerSlots": 7,
    "startingJokers": [
      {
        "id": "j_card_sharp"
      },
      {
        "id": "j_joker"
      }
    ],
    "bannedCentreIds": [
      "j_juggler",
      "j_troubadour",
      "j_turtle_bean"
    ]
  },
  {
    "number": 18,
    "id": "golden_needle",
    "name": "Golden Needle",
    "money": 10,
    "hands": 1,
    "discards": 6,
    "modifiers": {
      "discardCost": 1
    },
    "startingJokers": [
      {
        "id": "j_credit_card"
      }
    ],
    "bannedCentreIds": [
      "j_burglar",
      "v_grabber",
      "v_nacho_tong"
    ]
  },
  {
    "number": 19,
    "id": "cruelty",
    "name": "Cruelty",
    "jokerSlots": 3,
    "modifiers": {
      "noSmallReward": true,
      "noBigReward": true
    }
  },
  {
    "number": 20,
    "id": "jokerless",
    "name": "Jokerless",
    "jokerSlots": 0,
    "modifiers": {
      "noShopJokers": true
    },
    "bannedCentreIds": [
      "c_judgement",
      "c_wraith",
      "c_soul",
      "v_antimatter"
    ],
    "bannedTagIds": [
      "tag_uncommon",
      "tag_rare",
      "tag_negative",
      "tag_foil",
      "tag_holo",
      "tag_polychrome",
      "tag_buffoon",
      "tag_top_up"
    ],
    "bannedBossIds": [
      "bl_final_heart",
      "bl_final_leaf",
      "bl_final_acorn"
    ],
    "bannedBoosterFamilies": [
      "buffoon"
    ]
  }
].map(row=>Object.freeze(row)));
export const CHALLENGE_BY_ID=Object.freeze(Object.fromEntries(CHALLENGES.map(row=>[row.id,row])));
export const challengeModeUnlocked=profile=>Object.values(profile?.deckWins??{}).filter(wins=>Array.isArray(wins)&&wins.some(n=>Number.isSafeInteger(n)&&n>0)).length>=5;
// The first five are available after opening challenge mode; each distinct
// completed challenge opens one more, irrespective of completion order.
export const challengeUnlocked=(profile,id)=>challengeModeUnlocked(profile)&&Object.hasOwn(CHALLENGE_BY_ID,id)&&CHALLENGE_BY_ID[id].number<=5+new Set(profile?.completedChallenges??[]).size;
export const challengeStartingMoney=challenge=>BigInt(challenge.money??4);
