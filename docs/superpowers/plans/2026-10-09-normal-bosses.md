# Обычные боссы и продолжение анте

> **For agentic workers:** Use superpowers:executing-plans. Approved continuation of ROADMAP П-04; independent helper/UI work is delegated under AGENTS.md.

**Goal:** Implement all 23 ordinary boss effects and progress through antes 2–7, preserving deterministic saves and existing gestures.

**Architecture:** Existing dispatch remains the transaction boundary. Boss helpers/scoring, lifecycle/persistence, and hidden-card presentation are changed separately and integrated before CI.

**Tech Stack:** Existing JavaScript ESM/BigInt, Node tests, Playwright, Android WebView/Gradle.

**Spec:** ROADMAP.md П-04; uploaded APK assets/blind.lua and functions/state_events.lua; docs/apk-findings/expanded-boss-effects.md.

## Constraints
- Original artwork/audio/source does not enter application assets.
- Keep full boss selection pool; unsupported showdown effects remain explicitly unavailable.
- Save before animation; reject invalid actions without mutating input.
- Keep current 32 joker effects, own typography and right-side sale.

## Review focus
- Hidden cards must not disclose rank/suit or score preview before play.
- Eye/Mouth scoring history survives reload and score validation.
- Arm level decrement happens once before scoring, never in read-only preview.
- Serpent draws exactly three after actions, including hands exceeding normal size.
- Boss targets use actual multipliers; Water/Needle counters reset next round.

### Task 1: Helpers and scoring
- [ ] Add failing tests for normal-boss eligibility, Plant, Eye/Mouth, Flint.
- [ ] Implement src/core/boss-effects.js and src/core/score.js from reference.
- [ ] Verify focused tests and record reference/integration contracts.

### Task 2: Lifecycle and saves
- [ ] Add tests/core/normal-boss-lifecycle.test.js: all eligible bosses, hidden draws, counters, Arm/Ox/Tooth, history/reload, ante transition, atomic failures.
- [ ] Confirm missing-feature failures.
- [ ] Update run.js, blind-progression.js, shop.js, skip-blind.js and persistence/save.js; retain legacy first-ante saves.
- [ ] Verify core suite.

### Task 3: Hidden UI and Android verification
- [ ] Test hidden cards in browser, preserving selection/drag and preventing tooltip/preview leakage.
- [ ] Update field.js/styles.css, reveal played backs in app/play-animation, accurate UI availability/copy.
- [ ] Run browser suite; inspect snapshots.
- [ ] Save source branch and PR, run Android CI, inspect signature/alignment reports.
- [ ] Update STATUS/ROADMAP/backlog with exact coverage and remaining mechanics.
