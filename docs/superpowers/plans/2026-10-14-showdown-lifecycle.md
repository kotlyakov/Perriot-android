# Showdown Bosses, Victory and Endless Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execution is already authorized; root controls assignment and release. This research task writes the plan only while the 53-Joker slice stabilizes.

**Goal:** Make the five native showdown bosses playable and resumable, show the one-time Ante 8 victory before cashout, and continue into source-accurate Endless.

**Architecture:** Extend the existing immutable dispatch/revision/save-before-animation stack; do not introduce another rules engine or animation-time state mutation. Keep `round_won` as completed-round identity and gate its payout with a durable victory pending flag. Centralize native blind target calculation and share it across progression, boss targets and save validation.

**Tech Stack:** Existing ES modules, Node `node:test`, browser UI checks, Android WebView persistence; pinned LuaJIT 2.1.1700008891 for independent APK function oracles. No new dependencies.

**Spec:** `docs/apk-findings/showdown-win-lifecycle.md`; also read `AGENTS.md`, `APK_REFERENCE_SPEC.md`, `docs/apk-findings/rng-runtime.md`, current `docs/progress.md`.

## Global Constraints

- Uploaded APK source takes precedence over wiki; preserve approved own artwork and geometry.
- No approximate effects, geometric Endless target substitute, hidden final cap, or claim of complete native parity from isolated tests.
- Save authoritative state before animations; lock input during score/money/transition animation and pending victory.
- Joker/consumable sales use drag to the right-side sale zone; no sale button.
- User already approved development/design/platform. No repeated user approval questions. Do not publish or commit from this planning task.
- Stabilize the current 53-native-Joker and immutable cashout-snapshot slice before editing the files below; rerun its tests after every task.

## Review Focus

1. Reload immediately after winning or closing victory must not award profile wins, cashout money, or RNG twice (Task 5).
2. Heart changes the disabled identity after draw; lastScore save replay must use score-time identity, not the next-hand identity (Task 3).
3. Hidden Acorn identity must not leak through accessible names, tooltips, sale labels or drag ghosts (Task 4).
4. Forced Bell card cannot be omitted by direct dispatch, deselected by touch, lost on reload, or left dangling after destruction (Task 4).
5. Native high-Ante floating arithmetic and overflow must not corrupt storage or silently change the rules (Tasks 1 and 6).

## File map and state contract

| Files | Responsibility |
| --- | --- |
| `src/core/blind-progression.js`, `src/core/boss-effects.js`, `src/core/apk-blinds.js` | Shared ante base/target, showdown eligibility, deterministic boss-choice/shuffle helpers, disabled guard. |
| `src/core/run.js`, `src/core/inventory.js`, `src/core/shop.js`, `src/core/consumables.js` | Setup/draw/play/discard/sale lifecycle, forced-card reconciliation, disable action, victory acknowledgement and progression. |
| `src/core/score.js`, `src/content/jokers.js`, `src/core/joker-cashout.js`, `src/core/cashout.js` | Validate supported debuffed ownership separately from active effects, snapshot score/cashout provenance. |
| `src/persistence/save.js`, `src/core/apk-shop-state.js`, `src/core/apk-shop.js`, `src/core/apk-tags.js`, `src/core/skip-blind.js` | State invariants, migrations, all post-8 contextual limits. |
| `src/ui/app.js`, `src/ui/field.js`, `src/ui/shop-screen.js`, `src/ui/post-round.js`, `web/shop-screen.css`, `web/styles.css` | Forced-selection synchronization, hidden owned jokers, Heart appearance, own victory overlay and controls. Do not create a duplicate styling system. |
| New tests named in tasks, `scripts/reference-rng/generate-showdown-fixtures.py`, `scripts/reference-rng/showdown-fixtures.json` | Independently reproduce native output; runtime extraction only, never check original APK source into repo. |

Persist `winAnte:8`, `won:false`, `winNotified:false`, `winPending:false` in newly created runs; old saves absent these fields decode to defaults consistent with their supported pre-victory state. Boss-specific `bossState.disabled:boolean` defaults false; Bell `forcedCardId:string|null`; Heart `heartDebuffedJokerId:string|null`; Acorn `hiddenJokerIds:string[]`. IDs identify instances, not positions. For Heart persist `joker.debuffed:boolean` as actual current state and require consistency with the boss ID; same flag already informs recognition and cashout bonuses but currently fails ownership support validation. Score result `bossHistory.heartDebuffedJokerId` records the pre-score identity independently. Use native `prepped` timing through the draw action reason, not a new persistent timer.

Do not require owned debuffed joker identity to exist in a score snapshot after sale: inventory actions already clear `lastScore`. Sale/removal of the Heart target clears its live reference without immediately choosing another; discard still does not re-arm Heart. Derived Acorn hidden IDs must be removed on sale/destruction; later-created jokers are not automatically face-down because native setup flips only currently owned cards. Bell destruction clears the missing reference; only a native-equivalent draw hook repicks. No unsupported consumable should acquire guessed behavior.

### Task 1: Independent oracle and target contract

**Files:** Create `scripts/reference-rng/generate-showdown-fixtures.py`, `scripts/reference-rng/showdown-fixtures.json`, `tests/core/showdown-oracle.test.js`, `tests/core/endless-targets.test.js`; modify `src/core/blind-progression.js`, `src/core/boss-effects.js`.

**Interfaces:** Produce `nativeBlindTarget(ante,multiplier=1) -> bigint` in blind-progression, with `blindBase(ante) -> bigint` delegating multiplier1 and `bossTarget(state) -> bigint` delegating native boss multiplier (disabled Vessel uses2). All three share finite native Number calculation and multiply before BigInt conversion; shop/skip Big target uses nativeBlindTarget multiplier1.5. Produce `chooseBellCard(rng,cards) -> {cardId,rng}`, `chooseHeartJoker(rng,jokers) -> {jokerId,rng}`, `shuffleAcornJokers(rng,jokers) -> {jokerIds,rng}` in boss-effects; choice candidates use persistent canonical creation order. Do not return a invented random card for empty pools.

- [ ] Extract original `Blind:drawn_to_hand`, `press_play`, `disable`, RNG helpers and relevant setup callbacks to temporary files; supply explicit own adapters for `CardArea`, events, creation IDs and debuffs. Record callback order for setup: `set_blind` schedules Acorn, then `setting_blind` jokers, then `nr<ante>` deck shuffle (`state_events.lua:354-365`). Record named streams **and final global math state**; include 0/1/2/5 jokers, reversed display order, initial draw/play/discard, old disabled candidate exclusion, repeated reload-free draws and Acorn three shuffles.
- [ ] Write failing JS fixture assertions before implementing helpers. Acorn n<=1 consumes no aajk RNG; n>1 consumes three aajk seeds and n-1 raw draws per shuffle, re-sorting by creation ordinal each time. Bell/Heart consume one keyed integer for a one-element eligible pool; Heart zero jokers/discard consumes none. Use `nextApkSeed` plus native math helpers for shuffle, `nextApkRandom` for choice.
- [ ] Extract original `get_blind_amount` and fixture default scaling at every Ante 1–39, including 6x multiplication at each ante. Confirm exact native floating multiplication **before** conversion to BigInt; `BigInt(nativeNumber)` represents its rounded binary integer, while `BigInt(baseNumber)*6n` can differ above 2^53. Do not use safe-integer rejection for otherwise finite native integers.
- [ ] Implement and compare the native default formula (`misc_functions.lua:922-933`): floor `50000*(1.6+(0.75*(ante-8))^(1+0.2*(ante-8)))^(ante-8)`, then native modulo truncation to two significant digits. Preserve native Number rounding, not arbitrary-precision real math. Known pinned native outputs: 9=110000, 10=560000, 11=7200000, 12=300000000, 13=47000000000, 14=29000000000000, 15=77000000000000000, 16=8.6e20. Compare `%`, `log10` and exponentiation against all fixtures, not only these examples.
- [ ] Run `node --test tests/core/showdown-oracle.test.js tests/core/endless-targets.test.js`; require fixture parity. Native first non-finite base is **Ante 39 NaN**, executed on pinned LuaJIT during planning; finite target implementation alone does not complete overflow behavior. Task 6 owns this blocker.

### Task 2: Leaf and Vessel with disabled-state persistence

**Files:** Modify `src/core/boss-effects.js`, `src/core/run.js`, `src/core/inventory.js`, `src/core/shop.js`, `src/core/cashout.js`, `src/persistence/save.js`; create `tests/core/showdown-leaf-vessel.test.js`.

**Interfaces:** Extend existing `SUPPORTED_BOSSES`, `canEnterBoss`, `isBossCardDebuffed`, `bossTarget`; produce `disableBoss(state,events) -> void` on the already-cloned accepted state. Existing sale actions remain unchanged externally.

- [ ] Write failing tests: Ante 8 regular-final target 100000n, Vessel 300000n; all five final rewards 8n; Leaf debuffs rank/suit/Stone/Wild/enhancements and held Gold/Steel while preserving poker-hand base and active Joker effects. Four Fingers/Shortcut remain active unless their Joker is itself debuffed.
- [ ] Write failing sale tests: active Leaf plus supported Joker sale disables once, consumes no RNG, clears debuffs from playing cards, money increases only by sellCost; consumable sale, destruction and pre-blind sale do not disable newly entered Leaf; eternal Joker cannot be sold. Test both `SELL_OWNED_CARD` and any live legacy `SELL_JOKER` path, including stale/duplicate actions.
- [ ] Implement fresh boss `disabled:false`, guards on all card/hand/target effects, exact showdown admission despite `boss.min=10` metadata. Native eligibility is ante>=2 and ante%winAnte===0, not min metadata. `disableBoss` reduces Vessel target by three and clears all boss-specific presentation/selection/debuff state, restores ordinary card debuffs, then enters win/evaluation if accumulated score meets the new target (`blind.lua:397-412`). No new user-facing disable button; existing future boss-disable cards can call the same helper.
- [ ] Add save/decode invariants: disabled Vessel target 100000n at Ante 8 versus live 300000n, disabled Leaf remains disabled after reload, unknown boss fields rejected; failed actions preserve exact original state/RNG.
- [ ] Run task tests and `npm test`; check Leaf with scored Lucky/Glass effects consumes no enhancement RNG on debuffed cards.

### Task 3: Heart supports disabled ownership and score-time replay

**Files:** Modify `src/content/jokers.js`, `src/core/score.js`, `src/core/run.js`, `src/core/inventory.js`, `src/core/joker-cashout.js`, `src/core/cashout.js`, `src/persistence/save.js`; create `tests/core/showdown-heart.test.js`.

**Interfaces:** `supportsJoker` validates known inventory/modifiers including boolean debuffed; effect activation uses `!joker.debuffed`. `bossState.heartDebuffedJokerId` is current disabled identity; `lastScore.bossHistory.heartDebuffedJokerId` is score-time identity, null allowed.

- [ ] Write failing tests: 0 jokers=no poll, 1 repeats, 2 alternate, >2 cannot choose previously disabled candidate; creation order determines poll despite manual reorder; initial draw chooses; discard leaves choice/stream unchanged; play scores with current disabled identity, next draw chooses replacement. Candidate collection uses existing debuff flags **before** clearing all flags (`blind.lua:588-600`). Terminal win/loss without redraw consumes no next Heart choice.
- [ ] Write failing interaction tests for disabled Splash, Four Fingers, Shortcut, Baron, Stencil, Abstract, edition Mult/XMult, Golden and Cloud 9. Disabled jokers still occupy capacity and can be sold/reordered; disabled **other** jokers still count where native effects inspect inventory (e.g. Abstract/Stencil/Swashbuckler), so do not globally filter owned state to active jokers before all calculations.
- [ ] Implement active-effect gating at every scored/held/independent/edition/recognition/end-round loop. Permit owned Heart-debuffed cards to serialize and sell. Reconcile target sale/removal to null without premature random choice; retain the current chosen identity after reorder.
- [ ] Write and implement replay test: score with Joker A disabled, redraw disables B, serialize/deserialize preserves score trace and both states. Extend decodeScore's existing Eye/Mouth bossHistory handling to replay a cloned pre-score Joker debuff context. Reject references outside snapshot/live owned IDs and inconsistent current flags; sales clearing lastScore remain legal.
- [ ] Verify immutable `cashoutQuote.bonusContext`: capture while the Heart Joker is disabled; post-round cleanup or sale cannot retroactively add Golden/Cloud 9 payout or alter earnedRevision money provenance. Run task and full suite.

### Task 4: Bell forced selection and Acorn hidden inventory

**Files:** Modify `src/core/run.js`, `src/core/consumables.js`, `src/core/inventory.js`, `src/persistence/save.js`, `src/ui/app.js`, `src/ui/field.js`, `src/ui/shop-screen.js`, `web/shop-screen.css`; create `tests/core/showdown-bell-acorn.test.js`, `tests/ui/showdown-selection-check.mjs`.

**Interfaces:** Bell `bossState.forcedCardId` feeds UI selected Set and core play/discard acceptance. Acorn `hiddenJokerIds` feeds the owned Joker renderer only; underlying identity/effect/order stays authoritative.

- [ ] Write failing Bell tests: initial forced card persists on reload; direct PLAY/DISCARD omitting it rejected atomically; included choice accepted; both actions clear old flag and repick after next draw, even if old card remains held. Draw hook runs even when zero new cards drawn (`game.lua:3578-3584`). Test one-card pool, empty-hand native path separately (native has no empty-pool guard; do not invent fallback).
- [ ] Implement core forced inclusion, sync selected Set before every stable render/resume, block toggle removal, maintain five-card maximum, clear missing ID after supported destruction and repick only on native draw hook. Draw-dispatch uses action reason to arm Heart after PLAY, not DISCARD. Disable clears force and UI highlight lock.
- [ ] Write failing Acorn tests: initial existing jokers flip once, exactly three sorted shuffles; one card flips without RNG; new post-setup Joker remains visible; reorder/sale retains real order/identity; resume never reshuffles; defeat/disable turns faces front without restoring prior order. Save hidden IDs must be unique/live; sale removes them.
- [ ] Render an own card back and neutral accessible name; suppress hidden Joker tooltip/name/value and specific sale-price label; show `?` for hidden sale label as native `card.lua:384`. Ensure pointer/touch reorder and right-side sale still work with hidden identity. Do not change actual sellCost or allow public text leaks in drag ghosts. Heart disabled styling is independent of Acorn-facing state.
- [ ] Cover scored Glass plus Bell: surviving/shattered cards, continuing/terminal/no-new-draw cases, subsequent one/multiple DISCARD polls, round-trip and coherent target/named/raw-state tamper rejection. Bell also changes global RNG after Glass; preserve independent score-time history and authenticate actual later choice sequence instead of broadly exempting raw equality. Task3 already produces conditional `heartRngBefore` for Heart/Glass; preserve its contract.
- [ ] Browser integration also exercises actual Leaf Joker drag-sale clearing playing-card debuff markers with save/reload/frozen payout, and Heart disabled presentation. Suppress active-debuff styling after won-round cleanup while preserving the core earning flags until accepted cashout. Owned UI support uses `supportsJoker(...,{owned:true})`; default remains shop eligibility.
- [ ] Add this new browser suite to existing `scripts/ci-browser.mjs`; actual browser/Android CI is root-owned because local Chromium is absent. Minimal `boss-effects.js` admission/disable-owner edits are authorized despite the original file list. Native Acorn callback order is verified Task1: setting_blind callbacks, nr8 deck shuffle, then three aajk shuffles; preserve full raw RNG as well as streams.
- [ ] Run `UI_CHECK_SCRIPT=tests/ui/showdown-selection-check.mjs node scripts/check-ui.mjs` plus task/full core suites. Assert initial force, touch deselection refusal, direct dispatch rejection, reload, hidden accessible/text/tooltips/drag ghosts, reveal without order reset and save-before-animation.

### Task 5: One-time victory before cashout

**Files:** Modify `src/core/run.js`, `src/core/cashout.js`, `src/core/inventory.js`, `src/core/consumables.js`, `src/persistence/save.js`, `src/ui/app.js`, `src/ui/post-round.js`; create `tests/core/victory-endless.test.js`, `tests/ui/victory-endless-check.mjs`.

**Interfaces:** New `CONTINUE_ENDLESS` revision-guarded action accepted only when `phase==='round_won' && winPending`; clears pending once, returns event `endless_continued`, consumes no money/RNG. Completed round/cashoutQuote unchanged. No extra `game_won` phase.

- [ ] Write failing tests: successful Ante 8 Boss yields won=true, winNotified=true, winPending=true before CASH_OUT; small/big ante8 and regular bosses do not; no repeated victory at ante16; pending blocks payout/sales/consumables/gameplay. Capture existing cashoutQuote at successful round end exactly once, retaining defeated boss reward and Heart bonus suppression.
- [ ] Implement victory flags on the successful boss/evaluation transition; gate all actions before routed inventory/shop/consumable dispatch, then handle CONTINUE_ENDLESS. End-round held Gold and Joker payout provenance must be settled before victory. Keep completed round ante8 until existing cashout/shop progression installs ante9; native increments before overlay, but this is an internal state convention with identical displayed/resulting progression.
- [ ] Implement own unescapable victory overlay using existing dialog; prevent `closeDialog`, Escape and Android Back from bypassing pending; provide new run, main menu and Endless. New-run/menu calls use established repository behavior; neither awards cashout. Endless awaits repository save of accepted action before closing/animating, then exposes the same cashout screen. Resume reconstructs pending UI with no new award/RNG.
- [ ] Test new run/menu/Endless, duplicated acknowledgement/stale payout, reload before/after acknowledgement, storage-write failure with original state retained, cashout twice rejected, post-win later game_over keeps won true. Keep win-notification flags separate from pending acknowledgement.
- [ ] Run both task core/browser tests and `npm test`; profile wins/unlocks/stakes are **not currently an implemented profile subsystem**. Do not claim full native victory progression until that prerequisite is implemented. Native also sets won=true on a losing win-ante Boss (`state_events.lua:112-124`); track this apparent quirk as an explicit parity decision before final release, not a silently changed rule.

### Task 6: Endless progression and overflow completion gate

**Files:** Modify `src/core/blind-progression.js`, `src/core/boss-effects.js`, `src/core/shop.js`, `src/core/apk-blinds.js`, `src/core/apk-shop-state.js`, `src/core/apk-shop.js`, `src/core/apk-tags.js`, `src/core/skip-blind.js`, `src/persistence/save.js`, `src/ui/blind-select.js`; extend `tests/core/victory-endless.test.js`, `tests/core/endless-targets.test.js`, browser test.

**Interfaces:** Existing nextAnteBlinds selection remains selected once at boss cashout, orbital hands at next blind-selection entry; extend finite ante support rather than replacing progression. Keep default winAnte8 eligibility in boss selection and save validation; custom winAnte remains unsupported unless its full context is intentionally added.

- [ ] Write failing continuation tests: acknowledge Ante8 victory, cashout original $8/remaining-hands/frozen-interest/bonuses exactly once, shop context ante9, nextAnteBlinds.ante9, ordinary next boss; leave shop yields ante9 small target110000n. At ante16 use showdown and base native8.6e20, no second victory. Add skip paths and roundNumber>24 saves; remove all <=8 and <8 hard caps found by `rg` in both core and persistence.
- [ ] Preserve established cashout RNG sequence: voucher, cashout shuffle, tags small then big then boss, shop generation; orbitals only on blind-selection entry. Overlay acknowledgement is RNG-free. Test uninterrupted versus serialized/reloaded action sequence equals state, named streams, global RNG state and shop inventory.
- [ ] Implement finite oracle-verified Number target conversion for shared Small/Big/Boss target calculation, including native multiplying Big by1.5 and bosses by2/6 before conversion. Do not multiply already-converted BigInt if it changes native floating rounding. Extend save target comparison and numeric display to large finite values without Number truncation of stored BigInt.
- [ ] Add an explicit executable native observation at Ante39 and above: pinned native base is NaN (overflow then modulo). Current positive BigInt serialization cannot represent it; determine native result through blind comparisons, score formatting and save encoding before choosing a compatible tagged numeric representation. Test its load/replay and comparison semantics. A temporary finite-range rejection must be visibly recorded as an intermediate limitation; it does not complete this task and is not a new final game rule.
- [ ] Run fixture tests, full suite, victory browser tests and APK asset/build checks required by current project instructions. Update progress/parity/backlog only after implementations are verified; root owns release reporting and commit policy. Require independent source-focused review of Heart replay, unescapable pending victory and Acorn RNG callback order.

## Explicit completion prerequisites / risks

The five effects can be delivered as a correct intermediate Ante8 slice before complete Endless overflow work. Full native parity additionally requires: reliable integrated event ordering including setup-joker callbacks; persistent card creation order for added/duplicated playing cards beyond current plain52 support; native Stone unkeyed RNG consumption if integrated random parity depends on it; complete end-of-round Joker/rental/perishable/profile progression; native overflow presentation/save behavior and loss-at-win-ante quirk decision. These are concrete open requirements, not permission requests. No new UI or rule approximation should conceal them.

Self-review: spec sections map to Tasks1–6; every new field/helper/action is defined above; high-risk reload, hidden identity, direct selection omission, score-time Heart and high-ante inputs have owning tests. This plan intentionally schedules implementation after the current Joker slice stabilizes and does not alter product code.

### Task 7: Restore standalone preview for cyclic ES modules

**Files:** Modify `scripts/export-preview.mjs`; add a meaningful focused exporter regression test to existing core test discovery if needed; extend existing offline startup browser check only for a concrete uncovered case. Do not change gameplay to avoid legitimate ES module cycles.

**Evidence:** Source-only checkpoint45815fa CI38568496507/38568490947 fails offline startup `tests/ui/start-screen-check.mjs:72`, waiting for `#start_new`. Root independently executed the exporter's recursive module resolver and reproduced `RangeError: Maximum call stack size exceeded`. Native module graph now has boss-effects→blind-progression→boss-effects and boss-effects→cashout→boss-effects. Regular served browser startup passed earlier checks; native ESM supports these function-only cycles. Exporter caches URLs only after recursively resolving children.

- [ ] Reproduce the recursion failure before edits with a meaningful regression covering reachable cyclic modules.
- [ ] Resolve every exported module with stable identities before traversing imports; keep one self-contained offline HTML and existing CSS/font embedding, with no new runtime dependency or gameplay-rule changes. Choose the smallest reliable native-browser approach compatible with existing module syntax and Chromium CI.
- [ ] Verify regular export plus offline startup/save/reload, including current game graph and shared dependency identity. Do not weaken or skip the existing portable offline browser test. Source may not depend on a server, external package/CDN, or external asset.
- [ ] Run targeted/full core tests and exporter checks. Local Chromium binary is currently absent; report this explicit boundary. Root owns full browser/Android CI validation and source publication.

Execution order ruling: perform Task7 immediately after reviewed Task2 and before Task3, because it restores an existing release gate broken by legitimate new module relationships. Tasks3–6 continue afterward. This fixes an integration regression, not a scope substitute for final-game completion.

### Task 8: Avoid duplicate full Android CI for feature pushes

**File:** `.github/workflows/android.yml` only.

**Evidence:** every source checkpoint has two identical full Android/browser runs, one feature push and one pull_request (for example38638274403/38638281353). Existing main bootstrap workflow already identifies `main`; integration base is `apk-reference`. No billing allowance or balance is known; do not claim monetary savings.

- [ ] Change only the push trigger to `push: {branches: [main, apk-reference]}` using normal YAML block syntax. Preserve unrestricted `pull_request` and `workflow_dispatch` triggers. Preserve every job, check, permission, concurrency setting, timeout, artifact and build/signature step. Do not weaken tests, add event guards or delete the bootstrap workflow.
- [ ] Check the event matrix: main push runs, apk-reference push runs, feature push alone does not run the full Android workflow, feature PR opened/synchronized/reopened runs, manual dispatch runs. Feature branches without a PR can use manual dispatch. Record this workflow coverage decision.
- [ ] Validate YAML with available tooling and diff-check without adding dependencies or tests that just mirror this two-line configuration. Root will validate the next actual reviewed checkpoint: one full PR pipeline and all37 suites/build gates.

Execution ruling: implement while Task4 is under read-only review, before Task5; files and interfaces are independent, only one implementer active. Publish together with reviewed Task4 so already-verified old source is not rebuilt just for this metadata/configuration change.
