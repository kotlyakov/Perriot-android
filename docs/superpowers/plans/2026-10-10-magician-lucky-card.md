# Magician and Lucky Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add APK-parity Magician targeting and deterministic Lucky Card scoring, money, RNG, persistence, and UI feedback.

**Architecture:** Extend the existing targeted-enhancement map with `c_magician → lucky`. `scoreHand` remains pure: it consumes a cloned saved RNG and returns score trace plus RNG-before/after metadata; `dispatch` commits the returned RNG and money. Lucky money is a typed trace event so save replay and UI animation preserve native per-card order.

**Tech Stack:** JavaScript ES modules, Node test runner, Playwright Chromium, Android WebView/Gradle.

**Spec:** APK `game.lua:535,656`, `card.lua:985–997,1069–1084`, `common_events.lua:595–620`, `state_events.lua:669–797`.

## Global Constraints

- One or two unique current-hand targets; overwrite the prior enhancement.
- Each scoring Lucky card rolls `lucky_mult` first (1/5 for +20 Mult), then `lucky_money` (1/15 for $20).
- Non-scoring and boss-debuffed cards do not roll or trigger.
- Preview must not mutate RNG; accepted play commits exactly the previewed draws.
- Legacy schema-v1 saves remain loadable; forged score/RNG metadata is rejected.
- No original artwork, audio, music, or Lua enters release assets.

## Review Focus

- Two Lucky cards must advance each keyed stream twice in scoring-card order.
- A failed Mult roll must not suppress the independent money roll.
- Splash makes an otherwise non-scoring Lucky kicker roll both effects.
- Boss/hand debuffs consume no Lucky RNG.
- Save replay must reject altered money events, roll outcomes, or RNG snapshots.

### Task 1: Core Lucky contract

**Files:** `tests/core/magician-lucky-card.test.js`, `src/core/consumables.js`, `src/core/hands.js`, `src/core/score.js`, `src/core/run.js`, `src/core/apk-shop-state.js`.

- [ ] Write failing tests for Magician targets/overwrite and Lucky roll order/outcomes/debuffs.
- [ ] Run the focused test and confirm RED for missing support.
- [ ] Implement minimal enhancement mapping, pure RNG scoring, money trace and run commit.
- [ ] Run focused and full core suites.

### Task 2: Persistence and UI

**Files:** `src/persistence/save.js`, `src/content/shop-display.js`, `src/ui/score-animation.js`, `web/styles.css`, `tests/ui/magician-lucky-card-check.mjs`, `scripts/ci-browser.mjs`.

- [ ] Add failing codec/forgery and browser interaction tests.
- [ ] Extend strict score encoding/replay and Lucky display/animation.
- [ ] Run all browser suites and standalone export.

### Task 3: Android verification and integration

**Files:** `package.json`, `android/app/build.gradle.kts`, `src/ui/app.js`, `docs/qa/`, `STATUS.md`.

- [ ] Bump to 0.4.17-preview/code30 and document scoped evidence/gaps.
- [ ] Publish a feature PR from the current `apk-reference` head.
- [ ] Require green Android CI including signature/zipalign and independent review.
- [ ] Merge and update STATUS with exact PR, commit, Actions and artifact identifiers.
