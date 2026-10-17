# Поле и Android-оболочка — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task. Android выполняется отдельным исполнителем по AGENTS.md §3.

**Goal:** Дать playable preview одного уже реализованного Small Blind, офлайн Android shell и безопасное продолжение.
**Architecture:** ES modules ядра работают без изменений формата в браузере и WebView. UI отображает состояние; действия проходят dispatch и сохраняются до показа. Два проверенных слота current/backup; браузер localStorage, Android AtomicFile через мост.
**Tech Stack:** JS/HTML/CSS без runtime dependencies, Kotlin/WebView, node:test, Playwright установленного runtime.
**Spec:** docs/design.md, docs/ui/reference-normal.md, docs/ui/geometry.json, docs/art/art-bible.md.

## Global Constraints
- Новый проект, Android landscape, русский; стиль B. Только свои игровые assets.
- Базовый кадр1536×688, координаты из geometry.json. Uniform scale/letterbox — промежуточный алгоритм, точное соответствие другим аспектам ещё открыто.
- Не добавлять постоянную нижнюю панель. Достоинство/Масть между Играть руку/Сброс.
- Один блайнд; нет выплаты/магазина/новых правил. Начальные $4 — explicit preview fixture, не закрытие source gap.
- Не называть оболочку собранным APK без сборки; toolchain установлен; установка на устройстве ещё не проверена.

## Review Focus
- Выбор >5 и повторное касание во время расчёта не расходуют второй ход.
- Сортировка/drag сохраняют выбор, порядок влияет на реальный dispatch и продолжение.
- Повреждённый current предлагает backup; оба corrupt не перезаписываются автоматически.
- Сбой записи не отображает успешно выполненное действие; существующая запись остаётся доступна.
- На 568×320,915×412,1280×720 поле целиком видно, кнопки достижимы и оси не растянуты.

### Task 1: Порядок и repository
Files: src/core/run.js, src/persistence/repository.js, tests/core/reorder.test.js, tests/core/repository.test.js.
Interfaces: REORDER_HAND с cardIds точной перестановки и expectedRevision. createRepository({read(slot),write(slot,text)}) → load(), save(state), restoreBackup(), reset(state). Writes throw on failure; optional native boolean adapted at boundary.
- [x] RED: реальный reorder не теряет карты/RNG/выбор; invalid/stale immutable. Corrupt load/failed save/concurrent replacement tests.
- [x] Implement exact permutation action, validated serialization and current/backup writes.
- [x] GREEN: node --test.

### Task 2: Поле
Files: web/index.html, web/styles.css, src/ui/{app,field,layout}.js; scripts/preview.mjs, scripts/prepare-android.mjs; tests/ui/browser-check.mjs.
Interfaces: field consumes GameState; app dispatches with current revision; cardGameBack closes dialog. UI selected IDs transient, persisted order belongs to state.
- [x] Browser RED scenarios: selecting6 leaves5; sort retains selection; play/discard updates counters once; reload restores; backup prompt prevents overwrite.
- [x] Implement layout/hitboxes/cards/drag, HUD, trace animation gated, actual run/parameters dialogs explicitly intermediate.
- [x] Browser GREEN + resize geometry + screenshot; inspect screenshot.

### Task 3: Android и передача
Files: android/**, docs/android-build.md, ROADMAP.md, README.md, docs/progress.md, docs/qa/field-android.md.
- [x] Native origin-only asset serving, fullscreen landscape, current/backup AtomicFile storage, Back callback; prepare assets copies own code only.
- [x] Review independently, tests and static package checks; build if toolchain permits, otherwise document exact blocker.
- [x] Update roadmap/status, zip version0.3.1 and persist same artifact identities; show preview PNG and source archive.

## Фактическая передача
86 Node-tests и реальный browser suite проходят, независимо повторены reviewer. Touch double toggle, keyboard focus, fan bounds и preview server исправлены RED→GREEN. Автономный HTML проверен offline, live screenshot просмотрен. Настоящий Wrapper, JDK/SDK и compileDebugKotlin/assembleDebug успешны. Android установка/device lifecycle и полная pixel parity ещё не приняты. Сохранение/передача окончательных артефактов отмечаются после фактического завершения.

Финальная передача0.3.1: Wrapper assembleDebug exit0; APK904973 байт, SHA256 b0eadb58db93c91b771c2d6e82c02c56729002ce862ee1d624145542a3d3b27a. Подпись v2, min26/target36,16 assets совпадают по байтам, no INTERNET/JPEG. Источники и роадмап сохраняются вместе с APK; установка остаётся открытой.
