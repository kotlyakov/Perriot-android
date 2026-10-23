# Targeted enhancement Tarots 0.4.16/code29 verification

Source head: 9a9c709db5c3ea60e23bda699740a405c8b6d688. PR #13 merge: 892e56c51e29d8ebcfb9d071c6eb293af7aba5ef. Actions37997751499 SUCCESS; verified APK artifact11648606316, ZIP SHA256 d022eef9f1f94e0d030374a8961c444045f8dfdac88adf23b1d818e7b904aa58.

Scope: The Empress (`c_empress`) and native-compatible The Hierophant key (`c_heirophant`), with Mult and Bonus playing-card enhancements.

- Native source contract: one or two highlighted hand cards; replacement, not stacking; `m_mult` adds +4 Mult and `m_bonus` adds +30 chips only when the card scores.
- Core: target count/identity validation, atomic overwrite, debuffed consumable behavior, scoring order, kicker/Splash behavior, boss-debuff suppression, legacy and enhanced save roundtrips, strict forged-context rejection.
- UI: current hand selection routes into owned Tarot use; disabled reason without targets; modifier badges and tooltips; use, overwrite and reload verified in Chromium.
- Full local and CI verification: 328 core tests PASS and all 24 official Chromium suites PASS, including the new targeted Tarot suite. CI fresh Gradle compilation, offline-assets check, APK signature, zipalign and artifact upload PASS.

Scoped gaps: other enhancement types, editions, seals, retriggers, permanent card bonuses, profile/discovery and native sound/event timing remain separate work. No original Lua, graphics, audio or music is included. This remains an intermediate preview, not the complete game.
