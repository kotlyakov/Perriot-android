# Shop pricing verification — 08.10.2026

Independent read-only reviewer checked actual assets/card.lua Card:set_cost from the reference APK. No concrete defects in the pure pricing substep; npm test109/109 PASS.

Order: inflation/edition → discounted rounded minimum → booster ante/tutorial → Astronomer → rental → sell value → shop coupon. Coupon does not lower the previously computed sale value. Affordability honors bankruptcy floor and zero-cost purchases.

Module is not yet connected to the shop UI. Catalogue/RNG/transaction/lifecycle integration remains open. Original Lua and graphics are not copied into the project.
