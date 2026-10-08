# APK catalogue verification — 08.10.2026

Independent reviewer parsed actual APK assets/game.lua P_CENTERS with table depth, strings and comment handling, then compared every field and source line in docs/apk-shop-catalog.csv.

266 records:150Joker/22Tarot/12Planet/18Spectral/32Voucher/32Booster. No mismatches, duplicates, extra or missing IDs. Compared name,set,order,cost,rarity,weight,kind,unlocked and source/line. Nested config cannot affect top-level extraction.

Metadata-only checkpoint: original effects, unlock logic and seeded generation are not implemented by this CSV.
