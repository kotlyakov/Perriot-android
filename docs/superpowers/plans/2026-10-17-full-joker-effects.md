# Уточнение пользователя18.10.2026 — только №7а

Сделать43 эффекта из оставшихся86, собрать APK и доложить; остальные43 и Judgement —№7б. Список7а: `src/content/jokers.js` ITEM7_JOKERS. Поддерживаемый каталог107/150, scope regression закрывает преждевременное включение7б.

- [x] Денежные/пассивные/накопительные эффекты7а.
- [x] Интеграция ядра и строгих сохранений, независимое ревью и RED→GREEN исправления.
- [x] Локальные1190tests/1184PASS/6future skips;43×28boss matrix;2000native fixture reproducibility.
- [x]42Chromium suites и freshAndroid CI39111229954 SUCCESS.
- [x] APK0.4.38/code51 проверен и сохранён для передачи, итоговые статусы обновлены.

Исходный полный план ниже сохранён как контекст №7б, а не инструкция автоматически выполнить его сейчас.

# Item 7 — remaining Joker effects and Judgement

> **For agentic workers:** execute the established numbered plan using parallel domain owners and an independent final reviewer.

**Goal:** implement the remaining 86 native Joker effects and Judgement without changing accepted UI or starting item 8.
**Architecture:** extend existing deterministic scoring/reducer transactions, native keyed RNG, inventory hooks and strict save replay. Keep unsupported dependencies explicitly closed until implemented and tested.
**Tech stack:** existing ES modules, node:test, Chromium and Android wrapper; no new runtime dependencies.
**Spec:** AGENTS.md, ROADMAP.md numbered table, docs/apk-findings/item6-effect-contexts.md, docs/apk-findings/remaining-joker-source-index.md, original uploaded APK source.

## Global constraints
- Original uploaded APK overrides wiki; no copied artwork/source in application assets.
- Preserve existing 64 effects, accepted geometry/input, frozen cashout and revision atomicity.
- Each mutable effect must survive save/reload with validated exact state.
- No claimed full-game/frame RNG parity; profile/unlocks remain item 10.

## Tasks
- [x] Check current apk-reference and baseline: 1049 pass, 1 expected private-source skip.
- [ ] Source-derived contracts for all 86 keys and native contextual dependencies.
- [ ] Scoring owner: before/card/held/main effects and exact fractional state.
- [ ] Lifecycle owner: blind/discard/destruction/endround counters and passive capacities.
- [ ] Economy owner: shop/sale/consumable creation/cashout and Judgement.
- [ ] Lead: integrate exports, support gates, save schema/replay, native generator and UI descriptions.
- [ ] Independent native fixtures and whole-diff review; fix regressions.
- [ ] Full core/browser/Android checks, APK signature/alignment, merge only green CI, update status/backlog and report.

## Review focus
No-op support declarations; Blueprint mutation guards; probability multipliers; dynamic round target resets; removed-object provenance; negative inventory capacity; native callback ordering; atomic unsupported actions; cashout earned context after sale; save tampering and pure previews.
