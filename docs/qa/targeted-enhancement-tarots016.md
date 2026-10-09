# Targeted enhancement Tarots 0.4.16/code29 verification

Scope: The Empress (`c_empress`) and native-compatible The Hierophant key (`c_heirophant`), with Mult and Bonus playing-card enhancements.

- Native source contract: one or two highlighted hand cards; replacement, not stacking; `m_mult` adds +4 Mult and `m_bonus` adds +30 chips only when the card scores.
- Core: target count/identity validation, atomic overwrite, debuffed consumable behavior, scoring order, kicker/Splash behavior, boss-debuff suppression, legacy and enhanced save roundtrips, strict forged-context rejection.
- UI: current hand selection routes into owned Tarot use; disabled reason without targets; modifier badges and tooltips; use, overwrite and reload verified in Chromium.
- Full local verification: 328 core tests PASS and all 24 official Chromium suites PASS, including the new targeted Tarot suite.

Scoped gaps: other enhancement types, editions, seals, retriggers, permanent card bonuses, profile/discovery and native sound/event timing remain separate work. No original Lua, graphics, audio or music is included. This remains an intermediate preview, not the complete game.
