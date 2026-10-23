# Lovers and Wild Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `c_lovers` and `m_wild` with APK-compatible one-card targeting and suit semantics across hand recognition, suit bosses, suit Jokers, UI and saves.

**Architecture:** Add one pure suit predicate as the sole definition of Wild behavior. Hand recognition receives an optional debuff predicate; boss and Joker code reuse the same suit predicate. Extend the existing targeted-enhancement Tarot path without adding a second inventory flow.

**Tech Stack:** JavaScript ES modules, Node test runner, Playwright browser checks, Android WebView/Gradle CI.

**Spec:** `STATUS.md` П-05д plus APK 1.0.1n sources: `game.lua` (`c_lovers`, `m_wild`), `card.lua` (`Card:is_suit`), `blind.lua` (`Blind:debuff_card`), `misc_functions.lua` (`get_flush`).

## Global Constraints

- Lovers targets exactly one distinct card currently in hand and overwrites its enhancement with Wild.
- Wild counts as every suit when active; it retains rank chips and has no direct chip/Mult bonus.
- Every suit boss debuffs Wild through bypass-debuff suit matching.
- A debuffed Wild loses universal-suit behavior during flush recognition but still retains its printed base suit.
- Saves remain schema-v1 compatible and APK shop enhancement identities remain derived from actual cards.
- Existing approved UI, drag-to-sell behavior and proprietary assets remain unchanged.

## Review Focus

- A single Wild completes a flush for any four cards of one suit.
- Multiple Wild cards and Wild-based straight/flush compound hands preserve played-card order.
- Suit Jokers trigger from active Wild but never from a boss-debuffed Wild scoring card.
- Every suit boss debuffs Wild regardless of its printed suit, while normal cards keep current behavior.
- Lovers rejects zero or two targets atomically and save reload preserves the converted card.

---

### Task 1: Shared suit semantics and recognition

**Files:**
- Create: `src/core/card-suits.js`
- Modify: `src/core/hands.js`, `src/core/boss-effects.js`, `src/content/jokers.js`, `src/core/score.js`
- Test: `tests/core/lovers-wild-card.test.js`

**Interfaces:**
- Produces: `isCardSuit(card, suit, options)` where options are `debuffed`, `bypassDebuff`, and `flushCalc` booleans.
- Produces: `evaluateHand(cards, {isCardDebuffed} = {})` with the existing return contract.

- [ ] Write RED tests for Wild flush recognition, base-suit fallback when debuffed, all four suit bosses, and scored/independent suit Jokers.
- [ ] Run `node --test tests/core/lovers-wild-card.test.js` and confirm missing Wild support failures.
- [ ] Implement the pure suit predicate and route recognition/boss/Joker checks through it.
- [ ] Run the focused test and existing hand/boss/Joker suites to GREEN.

### Task 2: Lovers use, persistence and UI

**Files:**
- Modify: `src/core/consumables.js`, `src/core/apk-shop-state.js`, `src/persistence/save.js`, `src/content/shop-display.js`, `web/styles.css`, `src/ui/app.js`, `android/app/build.gradle.kts`, `package.json`
- Test: `tests/core/lovers-wild-card.test.js`, `tests/core/planet-integration.test.js`, `tests/ui/planet-consumables-check.mjs`
- Create: `tests/ui/lovers-wild-card-check.mjs`, `docs/qa/lovers-wild-card018.md`

**Interfaces:**
- Extends the existing `USE_CONSUMABLE` action and `card_enhanced` event with enhancement `wild`.

- [ ] Write RED tests for exactly one target, overwrite/immutability, derived `m_wild`, strict codec, reload and truthful Russian copy.
- [ ] Implement the minimal Lovers entry and Wild codec/display support.
- [ ] Add a browser RED→GREEN scenario covering selection, use, visual marker, scoring and reload.
- [ ] Bump to `0.4.18-preview` / code 31 and record scoped QA gaps.

### Task 3: Verification and integration

**Files:**
- Modify after CI: `STATUS.md`, `docs/qa/lovers-wild-card018.md`

- [ ] Run all core tests, all browser suites, preview export and `git diff --check`.
- [ ] Request independent review focused on suit/debuff interactions and save compatibility.
- [ ] Publish a feature branch and PR against fresh `apk-reference`.
- [ ] Require successful Android CI, verified APK packaging, and artifact upload before squash merge.
- [ ] Update STATUS with exact PR, merge, Actions, artifact and digest evidence.

## Self-review

- Scope is one Tarot/enhancement pair and its required shared suit contract; Steel/held-card scoring remains separate.
- All native branches that differ for Wild (flush calculation, ordinary suit check, bypass-debuff boss check) have explicit tests.
- No new RNG, schema version, dependency, asset or architecture is introduced.
