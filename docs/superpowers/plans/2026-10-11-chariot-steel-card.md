# Chariot and Steel Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement APK-faithful Chariot conversion and exact Steel Card effects for cards left in hand.

**Architecture:** Extend the existing targeted-enhancement Tarot map with Chariot. Keep scoring values as BigInt when integral and use the existing exact fraction primitives only while Steel makes Mult fractional; held-card effects become a distinct trace phase between scored cards and Joker editions/main effects. Extend the strict save codec and UI formatting to accept only normalized exact Mult fractions while the final chip score remains a floored BigInt.

**Tech Stack:** JavaScript ES modules, Node test runner, Playwright Chromium, Android WebView/Gradle.

**Spec:** `APK_REFERENCE_SPEC.md`; native reference `assets/game.lua` (`c_chariot`, `m_steel`), `assets/card.lua` (`get_chip_h_x_mult`), and `assets/functions/state_events.lua` (held-card activation order and final floor).

## Global Constraints

- Balatro APK 1.0.1n-FULL is the mechanics source of truth; release assets remain original to Pierrot.
- Chariot targets exactly one current hand card and atomically overwrites its enhancement with Steel.
- A debuffed Chariot is consumed and counted without changing the target.
- Each non-debuffed Steel card left in hand applies exact ×1.5 Mult, in current hand order.
- Played Steel cards do not apply their held effect; boss-debuffed held Steel cards do not apply it.
- Held-card effects occur after scored-card effects and before Joker edition/main effects.
- Floor only the final chips × Mult score; preserve exact fractional Mult in trace/save/UI.
- Mime, Red Seal held retriggers, Baron, Shoot the Moon, Raised Fist, and Gold Card remain outside this block.

## Review Focus

- A fractional Mult followed by an additive Joker effect must retain the half rather than floor early.
- Multiple Steel cards must compound exactly without floating-point drift.
- Forged or non-normalized fractional values in saved lastScore must be rejected.
- Hidden Steel cards must not expose a static marker before scoring, but—matching the APK held loop—still trigger at scoring time; boss-debuffed Steel must not trigger.
- Unsupported-card fixtures must move from Chariot to a genuinely unsupported Tarot.

---

### Task 1: Exact held-card scoring contract

**Files:**
- Modify: `src/core/score.js`
- Modify: `src/core/hands.js`
- Modify: `src/core/numbers.js`
- Test: `tests/core/chariot-steel-card.test.js`

**Interfaces:**
- Consumes: `fraction(n,d)`, `add(a,b)`, `multiply(a,b)`, `floor(value)`.
- Produces: score/trace Mult values as `bigint | {n: bigint, d: bigint}` and `phase: 'held_card'` Steel steps.

- [ ] Write tests for one/multiple Steel cards, played-vs-held behavior, boss debuff, hand order, held-before-Joker order, and exact final floor.
- [ ] Run `node --test tests/core/chariot-steel-card.test.js`; expect failures because Steel is unsupported.
- [ ] Implement normalized exact Mult operations and the held-card phase.
- [ ] Run the targeted test; expect PASS.

### Task 2: Chariot lifecycle and strict persistence

**Files:**
- Modify: `src/core/consumables.js`
- Modify: `src/core/apk-shop-state.js`
- Modify: `src/persistence/save.js`
- Modify: `src/content/shop-display.js`
- Modify: `tests/core/planet-integration.test.js`
- Test: `tests/core/chariot-steel-card.test.js`

**Interfaces:**
- Consumes: the exact score Mult union from Task 1.
- Produces: `c_chariot -> steel`, `steel -> m_steel`, strict fraction save codec, truthful Russian description.

- [ ] Add failing lifecycle/save tests for exact-one targeting, overwrite, debuffed consume, no RNG, shop identity, replay, and forged fraction rejection.
- [ ] Run the targeted test; expect failures for unsupported Chariot/codec.
- [ ] Implement the minimal map, identity, codec, and copy changes; move unsupported fixtures to Justice.
- [ ] Run `npm test`; expect all core tests PASS.

### Task 3: Browser interaction and presentation

**Files:**
- Modify: `src/ui/field.js`
- Modify: `src/ui/score-animation.js`
- Modify: `web/styles.css`
- Create: `tests/ui/chariot-steel-card-check.mjs`
- Modify: `scripts/ci-browser.mjs`
- Modify: `package.json`
- Modify: `android/app/build.gradle.kts`
- Create: `docs/qa/chariot-steel-card019.md`

**Interfaces:**
- Consumes: exact Mult union and `held_card` trace steps.
- Produces: Steel marker, exact decimal Mult display, browser use/reload/play coverage, version `0.4.19-preview`/code 32.

- [ ] Add a failing Chromium scenario for targeting Chariot, Steel marker/tooltip, save reload, playing another card, and exact ×1.5 display/trace.
- [ ] Run the scenario; expect failure before UI support.
- [ ] Implement fraction formatting/animation fallback, held-card source lookup, marker CSS, CI registration, version bump, and QA notes.
- [ ] Run the targeted browser scenario, full core suite, all official Chromium suites, asset preparation, and Gradle build checks; expect PASS.

