# Targeted Enhancement Tarots Plan

**Goal:** Implement APK-parity gameplay for The Empress and The Hierophant, including one-or-two-card targeting, Mult/Bonus persistence, and scoring.

**Scope:** Playing-card `enhancement` values `mult` and `bonus`; `c_empress` and the native-compatible `c_heirophant` key. Editions, seals, retriggers, per-card permanent bonuses, and arbitrary stored debuff flags remain separate follow-up blocks.

1. Add failing core tests for target validation, atomic conversion/overwrite, usage history, score order, non-scoring cards, and save/load.
2. Extend the playing-card contract and save codec with optional `enhancement: base|mult|bonus`.
3. Add targeted consumable validation/application and modifier score steps.
4. Route the current hand selection into the owned-consumable UI and cover use/persistence in Chromium.
5. Run the full core/browser/export suites, build Android, publish a feature PR, and require green Android CI before merge.
