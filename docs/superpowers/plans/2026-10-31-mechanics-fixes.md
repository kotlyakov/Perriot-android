# Исправление 13 несоответствий механик — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить АУ-01–АУ-13 из аудита, сохранить старые партии и однозначный учёт версии каждого исправления.

**Architecture:** Существующее JS-ядро и UI сохраняются. Для изменений replay-зависимых правил используется один маркер `mechanicsVersion:1` в новом состоянии и метаданных первого принятого действия старой партии; отсутствие маркера означает историческое поведение. Чистые profile-счётчики исправляются только на будущих событиях, без отзыва ранее открытого прогресса.

**Tech Stack:** ES modules, Node node:test, Playwright, существующий Kotlin/WebView/Gradle; новых зависимостей нет.

**Spec:** `docs/qa/2026-10-31-mechanics-audit-060.md` и `docs/qa/2026-10-31-mechanics-audit-060-findings.json`.

## Global Constraints

- Выпущенная версия остаётся **0.4.60/code73**, пока не проверен и не выдан новый APK. Рабочий кандидат — **0.4.61/code74**, `mechanicsVersion=1`; номер сборки повышается при релизной подготовке.
- Порядок/статус задач хранится в `docs/qa/2026-10-31-mechanics-fix-progress.md`; краткое активное состояние — STATUS.md; пользовательские задачи — BACKLOG.md. После каждого законченного шага фиксировать тест, результат и commit. Нельзя отмечать APK-проверку по одному core-тесту.
- Старые сохранения и исторические действия читаются по старым правилам. Первый принятый новый ход включает актуальные правила и записывает переход; отклонённый ход не мигрирует исходный объект.
- Аренда по$3 в начале раунда с отрицательным балансом и optional pack storage — утверждённые правила, не менять.
- Сохранение предшествует успешной анимации. Не ослаблять replay authenticity, CAS, проверки формы/лимитов и атомарность ради проходящего теста.
- Утверждённые графика/расположение/русские имена не меняются. Эталон — приложенный APK1.0.1n, полное n→o не обещается.
- Диагностики scripts/audit060-* первоначально утверждают ошибочный снимок: правильные ожидания переносить в новые tests/core/mechanics-061-*.test.js; исторические audit-артефакты не переписывать задним числом.
- Работа продолжается в существующей чистой feature-ветке fix/enhancement-visuals, вне main, без слияния PR. Публикация этой ветки уже разрешена пользователем.

## Review Focus

1. Старые replay с изменённым правилом не ломаются; неизвестный/поддельный маркер отклонён — Task0 и Task13.
2. Ослабленные/просроченные джокеры, full slots и no-space не создают деньги/карты дважды — Task2–6.
3. Скрытие и RNG добора зависят от состояния босса, а не только имени действия — Task7–9.
4. Смена sort/порядка/загрузка не меняет баланс, IDs, RNG и поздние эффекты — Task13.
5. Отказ сохранения/устаревшее действие сохраняет исходные байты; UI открывает только принятый результат — Task0 и финальная интеграция.

## Порядок и владельцы файлов

Task0 (версия правил/сохранения) → Task1 (Буйвол) → независимые группы Task2–4 (расходники), Task5–6/9 (джокеры), Task10–12 (профиль), Task7–8 (общий добор) → Task13 (журнал) → финальная интеграция.

Ведущий единолично редактирует run.js/save.js/boss-effects.js/hand-size.js/boss-draw.js и общую документацию. Независимые исполнители не меняют эти файлы, сообщают ведущему нужные точки интеграции. Перед запуском группы перечитать текущий файл, не перезаписывать чужие изменения. План/подзадачи могут выполняться параллельно только при непересекающихся файлах.

---

### Task0: Версия правил и совместимость

**Files:** Create `src/core/mechanics-version.js`; Modify `src/core/run.js`, `src/persistence/save.js`; Test `tests/core/mechanics-version.test.js`.

**Interfaces:** `usesCurrentMechanics(state)` возвращает state.mechanicsVersion===1. createRun пишет1. dispatch добавляет mechanicsVersion:1 только первому будущему действию legacy state; dispatchCore проверяет/снимает метаданные перед строгим reducer. replayEffectActions сам не повышает версию.

- [x] Сохранить немодифицированные0.4.60 fixtures по опасным путям (Death/Wheel/Purple/Bones/sort); baseline файл без нового маркера должен читаться/писаться побайтно.
- [x] RED: новый createRun содержит1; legacy replay не мигрирует при чтении; первый принятый ход пишет1 в state/action; rejected/stale не меняет state; invalid marker reject.
- [x] Run `node --test tests/core/mechanics-version.test.js`: ожидается RED до реализации.
- [x] Реализовать optional field и action whitelist без изменения остальных проверок.
- [x] GREEN: версия/legacy/cache cold read/byte equality/tampering; затем `npm test`,0FAIL, ожидаемые optional private skips отдельно.
- [x] Commit и запись в progress; после этой точки остальные задачи используют usesCurrentMechanics.

### Task1: АУ-01 — Буйвол: тупик при равенстве частот комбинаций

**Files:** Modify `src/core/boss-effects.js; src/core/run.js`; Test `tests/core/mechanics-061-ox.test.js`.

**Interfaces:** Использует Task0 `usesCurrentMechanics(state)` для replay-зависимых эффектов. Выход — исправленный обычный dispatch, неизменённые public action имена/формы; profile-задачи не меняют правила старого replay.

- [x] Разобрать исходное воспроизведение `scripts/audit060-bosses/ox-tie-probe.mjs` и контракт APK `functions/state_events.lua:148–155`; не принимать audit-assert wrong result за правильный regression.
- [x] RED: создать тест с правильным ожидаемым результатом: Должна оставаться конкретная наиболее частая комбинация; ничья не должна останавливать партию. Числовой пример: Seed OXTIE6: High Card=1, Pair=1; следующий босс bl_ox; SKIP_UNAVAILABLE / NEXT_BLIND_UNAVAILABLE / BOSS_UNAVAILABLE.
- [x] Run `node --test tests/core/mechanics-061-ox.test.js`. Ожидается FAIL именно на найденном несоответствии.
- [x] Реализовать минимально: Для новых правил выбирать первый максимум в каноническом порядке APK_HAND_NAMES; восстановить старый null при первом новом принятом действии. Не обещать воспроизведение неизвестного Lua pairs порядка.
- [x] GREEN и границы: OXTIE6: High Card1/Pair1 → определённая цель; skip Big и реальная игра Big→LEAVE_SHOP→START_BLIND доступны. Пустая история→high_card. Неничья сохраняет прежнюю цель; старый журнал читается без изменения.
- [x] Run `node --test tests/core/mechanics-061-ox.test.js`, затем затронутые соседние tests/core и `npm test` после интеграции группы. Ожидается0FAIL; legacy fixture/replay unchanged.
- [x] Commit и progress: указать ID, source commit, regression names/команду, статус `исправлено в коде` отдельно от `проверено в APK`.

### Task2: АУ-02 — Смерть не копирует постоянные фишки Походника

**Files:** Modify `src/core/consumables.js`; Test `tests/core/mechanics-061-consumables.test.js`.

**Interfaces:** Использует Task0 `usesCurrentMechanics(state)` для replay-зависимых эффектов. Выход — исправленный обычный dispatch, неизменённые public action имена/формы; profile-задачи не меняют правила старого replay.

- [x] Разобрать исходное воспроизведение `scripts/audit060-consumables/probe.mjs` и контракт APK `card.lua:1112–1118; functions/common_events.lua:2203–2208`; не принимать audit-assert wrong result за правильный regression.
- [x] RED: создать тест с правильным ожидаемым результатом: Точная копия должна получить постоянный бонус правой карты, включая ноль. Числовой пример: Левая0/правая25 → фактически0 вместо25; левая30/правая0 →30 вместо0.
- [x] Run `node --test tests/core/mechanics-061-consumables.test.js`. Ожидается FAIL именно на найденном несоответствии.
- [x] Реализовать минимально: При Death копировать permaBonus правой карты, удалять старое поле левой, если справа его нет. Старые replay сохраняют прежнюю семантику.
- [x] GREEN и границы: 0→25,30→0; repeated Hiker/Red/Chad score, edition/seal/enhancement и save/reload.
- [x] Run `node --test tests/core/mechanics-061-consumables.test.js`, затем затронутые соседние tests/core и `npm test` после интеграции группы. Ожидается0FAIL; legacy fixture/replay unchanged.
- [x] Commit и progress: указать ID, source commit, regression names/команду, статус `исправлено в коде` отдельно от `проверено в APK`.

### Task3: АУ-03 — Колесо Фортуны теряет накопленную стоимость продажи

**Files:** Modify `src/core/consumables.js`; Test `tests/core/mechanics-061-consumables.test.js`.

**Interfaces:** Использует Task0 `usesCurrentMechanics(state)` для replay-зависимых эффектов. Выход — исправленный обычный dispatch, неизменённые public action имена/формы; profile-задачи не меняют правила старого replay.

- [x] Разобрать исходное воспроизведение `scripts/audit060-consumables/probe.mjs` и контракт APK `card.lua:382,1487`; не принимать audit-assert wrong result за правильный regression.
- [x] RED: создать тест с правильным ожидаемым результатом: Надбавка Яйца/Подарочной карты должна сохраниться поверх стоимости издания. Числовой пример: WHEEL3: Яйцо с extraValue=$20 получает голографию; ожидается продажа$23, фактически$3.
- [x] Run `node --test tests/core/mechanics-061-consumables.test.js`. Ожидается FAIL именно на найденном несоответствии.
- [x] Реализовать минимально: При Wheel передавать extraValue в существующий расчёт продажи; не менять discount/free/rental правила.
- [x] GREEN и границы: WHEEL3 Egg extra20/holo:cost7,sell23; GiftCard, discounts, rental, неуспешное Wheel и Temperance, save/reload.
- [x] Run `node --test tests/core/mechanics-061-consumables.test.js`, затем затронутые соседние tests/core и `npm test` после интеграции группы. Ожидается0FAIL; legacy fixture/replay unchanged.
- [x] Commit и progress: указать ID, source commit, regression names/команду, статус `исправлено в коде` отдельно от `проверено в APK`.

### Task4: АУ-04 — Отключённый Шоумен разрешает повторы в Таро-наборе

**Files:** Modify `src/core/arcana-pack-generation.js; src/core/celestial-pack.js`; Test `tests/core/mechanics-061-consumables.test.js`.

**Interfaces:** Использует Task0 `usesCurrentMechanics(state)` для replay-зависимых эффектов. Выход — исправленный обычный dispatch, неизменённые public action имена/формы; profile-задачи не меняют правила старого replay.

- [x] Разобрать исходное воспроизведение `scripts/audit060-consumables/probe.mjs` и контракт APK `functions/common_events.lua:2026; functions/misc_functions.lua:906–917`; не принимать audit-assert wrong result за правильный regression.
- [x] RED: создать тест с правильным ожидаемым результатом: Отключённый эффект не должен менять пул набора. Числовой пример: ARCANA0, activeCentreIds=[]: Солнце / Дурак / Солнце.
- [x] Run `node --test tests/core/mechanics-061-consumables.test.js`. Ожидается FAIL именно на найденном несоответствии.
- [x] Реализовать минимально: В актуальном генераторе использовать activeCentreIds??ownedCentreIds. Добавить явную опцию legacyShowman для исторического core replay, без нового поля shop context.
- [x] GREEN и границы: ARCANA0 debuffed/expired Showman → без повтора; active Showman → разрешены повторы; normal/jumbo/mega, Soul и точный RNG, legacy replay.
- [x] Run `node --test tests/core/mechanics-061-consumables.test.js`, затем затронутые соседние tests/core и `npm test` после интеграции группы. Ожидается0FAIL; legacy fixture/replay unchanged.
- [x] Commit и progress: указать ID, source commit, regression names/команду, статус `исправлено в коде` отдельно от `проверено в APK`.

### Task5: АУ-05 — Одно спасение расходует двух Костлявых

**Files:** Modify `src/core/round-end-jokers.js; src/core/joker-item7-lifecycle.js`; Test `tests/core/mechanics-061-jokers.test.js`.

**Interfaces:** Использует Task0 `usesCurrentMechanics(state)` для replay-зависимых эффектов. Выход — исправленный обычный dispatch, неизменённые public action имена/формы; profile-задачи не меняют правила старого replay.

- [x] Разобрать исходное воспроизведение `scripts/audit060-jokers/probe.mjs` и контракт APK `functions/state_events.lua:99–109; card.lua:3050–3070`; не принимать audit-assert wrong result за правильный regression.
- [x] RED: создать тест с правильным ожидаемым результатом: После первого спасения второй должен получить game_over=false и остаться. Числовой пример: Два Костлявых; набрано75 при цели300. Ожидается один оставшийся, фактически0.
- [x] Run `node --test tests/core/mechanics-061-jokers.test.js`. Ожидается FAIL именно на найденном несоответствии.
- [x] Реализовать минимально: Для актуальных правил end-round идёт по исходным слотам и передаёт gameOver=false после первого спасения; legacy aggregate ветка остаётся для прежнего replay.
- [x] GREEN и границы: 2/3 Bones, ниже1/4/ровно1/4, debuff, perishable/rental/eternal, события удаления, следующие раунды и reload.
- [x] Run `node --test tests/core/mechanics-061-jokers.test.js`, затем затронутые соседние tests/core и `npm test` после интеграции группы. Ожидается0FAIL; legacy fixture/replay unchanged.
- [x] Commit и progress: указать ID, source commit, regression names/команду, статус `исправлено в коде` отдельно от `проверено в APK`.

### Task6: АУ-06 — Торговая карта подавляет Фиолетовую печать

**Files:** Modify `src/core/joker-item7-lifecycle.js; src/core/run.js`; Test `tests/core/mechanics-061-discard.test.js`.

**Interfaces:** Использует Task0 `usesCurrentMechanics(state)` для replay-зависимых эффектов. Выход — исправленный обычный dispatch, неизменённые public action имена/формы; profile-задачи не меняют правила старого replay.

- [x] Разобрать исходное воспроизведение `scripts/audit060-jokers/probe-purple-discard.mjs` и контракт APK `functions/state_events.lua:422–435; card.lua:2256–2270`; не принимать audit-assert wrong result за правильный regression.
- [x] RED: создать тест с правильным ожидаемым результатом: Сначала должна сработать печать, затем уничтожение джокером. Числовой пример: Есть свободное место: одиночная карта с Фиолетовой печатью + Торговая карта → $3 и уничтожение, но0 Таро вместо1.
- [x] Run `node --test tests/core/mechanics-061-discard.test.js`. Ожидается FAIL именно на найденном несоответствии.
- [x] Реализовать минимально: Добавить beforeCard callback в applyItem7Discard; после pre_discard и перед individual discard вызвать seal для каждой карты. Core включает callback только для актуальных правил; послеудаления seal остаётся только legacy.
- [x] GREEN и границы: Purple+Trading:1Tarot+$3+destroy; fullslots0Tarot, Blueprint не дублирует seal; noTrading/второйсброс; Hook1/2Purple; Burnt доseal, RNG/save/reload.
- [x] Run `node --test tests/core/mechanics-061-discard.test.js`, затем затронутые соседние tests/core и `npm test` после интеграции группы. Ожидается0FAIL; legacy fixture/replay unchanged.
- [x] Commit и progress: указать ID, source commit, regression names/команду, статус `исправлено в коде` отдельно от `проверено в APK`.

### Task7: АУ-07 — Дополнительный добор обходит Дом, Знак и Колесо

**Files:** Modify `src/core/boss-draw.js (create); src/core/hand-size.js; src/core/run.js`; Test `tests/core/mechanics-061-boss-draw.test.js`.

**Interfaces:** Использует Task0 `usesCurrentMechanics(state)` для replay-зависимых эффектов. Выход — исправленный обычный dispatch, неизменённые public action имена/формы; profile-задачи не меняют правила старого replay.

- [x] Разобрать исходное воспроизведение `scripts/audit060-bosses/concealment-probe.mjs` и контракт APK `blind.lua:607–620`; не принимать audit-assert wrong result за правильный regression.
- [x] RED: создать тест с правильным ожидаемым результатом: Каждая добранная карта должна проходить правила текущего босса независимо от причины добора. Числовой пример: Дом: новая10♦ открыта до первой игры/сброса; Знак: новыйJ♥ открыт; Колесо: stream до/после одинаков. Сохранения до/после валидны.
- [x] Run `node --test tests/core/mechanics-061-boss-draw.test.js`. Ожидается FAIL именно на найденном несоответствии.
- [x] Реализовать минимально: Выделить общий applyBossDrawVisibility(state,ids,action) без циклической зависимости boss-effects↔hand-size. Включить для актуальных правил у всех доборов; сохранить прежние вызовы legacy.
- [x] GREEN и границы: Ankh+Juggler подHouse/Mark/Wheel; Pareidolia/debuff/Chicot/Luchador; disabled не прячет/не расходует wheel; RNG poll накаждуюкарту; valid save/reload.
- [x] Run `node --test tests/core/mechanics-061-boss-draw.test.js`, затем затронутые соседние tests/core и `npm test` после интеграции группы. Ожидается0FAIL; legacy fixture/replay unchanged.
- [x] Commit и progress: указать ID, source commit, regression names/команду, статус `исправлено в коде` отдельно от `проверено в APK`.

### Task8: АУ-08 — Дом раскрывает замену полностью уничтоженной начальной руки

**Files:** Modify `src/core/boss-draw.js; src/core/run.js`; Test `tests/core/mechanics-061-boss-draw.test.js`.

**Interfaces:** Использует Task0 `usesCurrentMechanics(state)` для replay-зависимых эффектов. Выход — исправленный обычный dispatch, неизменённые public action имена/формы; profile-задачи не меняют правила старого replay.

- [x] Разобрать исходное воспроизведение `scripts/audit060-bosses/probe.mjs` и контракт APK `blind.lua:612–614; challenges.lua five_card_draw`; не принимать audit-assert wrong result за правильный regression.
- [x] RED: создать тест с правильным ожидаемым результатом: У Дома условие определяется hands_played=0 и discards_used=0, а не именем START_BLIND. Числовой пример: five_card_draw + Дом + Immolate до первого действия: добраны5, скрыто0 вместо5.
- [x] Run `node --test tests/core/mechanics-061-boss-draw.test.js`. Ожидается FAIL именно на найденном несоответствии.
- [x] Реализовать минимально: В общем актуальном helper House определяется handsPlayed==0 && discardsUsed==0. Сохранить Fish/Serpent порядок и legacy ветку.
- [x] GREEN и границы: five_card_draw/House/Immolate доигры:5новыхскрыты; послеигры/сбросанескрыты; пустаяколодабеззацикливания; normal/Spectral pack и reload.
- [x] Run `node --test tests/core/mechanics-061-boss-draw.test.js`, затем затронутые соседние tests/core и `npm test` после интеграции группы. Ожидается0FAIL; legacy fixture/replay unchanged.
- [x] Commit и progress: указать ID, source commit, regression names/команду, статус `исправлено в коде` отдельно от `проверено в APK`.

### Task9: АУ-09 — Автобусный тур пропускает случайный запрос Каменной карты

**Files:** Modify `src/core/joker-score-effects.js`; Test `tests/core/mechanics-061-jokers.test.js`.

**Interfaces:** Использует Task0 `usesCurrentMechanics(state)` для replay-зависимых эффектов. Выход — исправленный обычный dispatch, неизменённые public action имена/формы; profile-задачи не меняют правила старого replay.

- [x] Разобрать исходное воспроизведение `scripts/audit060-score/probe-ride-bus-stone.py` и контракт APK `card.lua:3528–3532,958–970`; не принимать audit-assert wrong result за правильный regression.
- [x] RED: создать тест с правильным ожидаемым результатом: Даже после найденной карты с лицом должна сохраняться нативная последовательность обращений к RNG. Числовой пример: [J♥, Каменная5♠]: исходный Lua делает1 Stone draw, JS0. Множитель в обоих случаях сбрасывается в0; немедленного отличия очков не доказано.
- [x] Run `node --test tests/core/mechanics-061-jokers.test.js`. Ожидается FAIL именно на найденном несоответствии.
- [x] Реализовать минимально: Для актуальных правил заменить ранний выход some полным обходом, сохранив итог faces и legacy путь.
- [x] GREEN и границы: [Jheart,Stone5spades]:1rawdraw иmult0; обратныйпорядок, multipleStone/Pareidolia/debuff, Blueprint, native oracle, save/replay.
- [x] Run `node --test tests/core/mechanics-061-jokers.test.js`, затем затронутые соседние tests/core и `npm test` после интеграции группы. Ожидается0FAIL; legacy fixture/replay unchanged.
- [x] Commit и progress: указать ID, source commit, regression names/команду, статус `исправлено в коде` отдельно от `проверено в APK`.

### Task10: АУ-10 — Мозговой штурм не разблокируется с Четырьмя пальцами

**Files:** Modify `src/core/profile.js`; Test `tests/core/mechanics-061-profile.test.js`.

**Interfaces:** Использует Task0 `usesCurrentMechanics(state)` для replay-зависимых эффектов. Выход — исправленный обычный dispatch, неизменённые public action имена/формы; profile-задачи не меняют правила старого replay.

- [x] Разобрать исходное воспроизведение `scripts/audit060-profile/probes.mjs` и контракт APK `functions/common_events.lua:1592–1601`; не принимать audit-assert wrong result за правильный regression.
- [x] RED: создать тест с правильным ожидаемым результатом: По исходному условию достаточно Straight Flush без ранга ниже10; с Четырьмя пальцами JQKA подходит. Числовой пример: Ожидается Brainstorm unlocked=true, фактическиfalse.
- [x] Run `node --test tests/core/mechanics-061-profile.test.js`. Ожидается FAIL именно на найденном несоответствии.
- [x] Реализовать минимально: Условие royal discard принимает min>=10 после действительного straight_flush; наличие Ten не обязательно.
- [x] GREEN и границы: JQKAодноймасти+FourFingers unlock; безFourFingersнет; низкийstraight_flushнет; ordinary/seeded/challenge guards.
- [x] Run `node --test tests/core/mechanics-061-profile.test.js`, затем затронутые соседние tests/core и `npm test` после интеграции группы. Ожидается0FAIL; legacy fixture/replay unchanged.
- [x] Commit и progress: указать ID, source commit, regression names/команду, статус `исправлено в коде` отдельно от `проверено в APK`.

### Task11: АУ-11 — Матадор ошибочно разблокируется на Воде

**Files:** Modify `src/core/profile.js`; Test `tests/core/mechanics-061-profile.test.js`.

**Interfaces:** Использует Task0 `usesCurrentMechanics(state)` для replay-зависимых эффектов. Выход — исправленный обычный dispatch, неизменённые public action имена/формы; profile-задачи не меняют правила старого replay.

- [x] Разобрать исходное воспроизведение `scripts/audit060-profile/probes.mjs` и контракт APK `functions/common_events.lua:1523–1528; blind.lua:179–181`; не принимать audit-assert wrong result за правильный regression.
- [x] RED: создать тест с правильным ожидаемым результатом: Для точного соответствия APK активная Вода не должна удовлетворять этому условию разблокировки. Числовой пример: Победа над Водой за одну руку, discardsUsed=0, discardsRemaining=0 → unlock=true вместоfalse.
- [x] Run `node --test tests/core/mechanics-061-profile.test.js`. Ожидается FAIL именно на найденном несоответствии.
- [x] Реализовать минимально: Сравнивать оставшиеся discards с исходным лимитом раунда с колодой/ставкой/voucher/passive; не только discardsUsed. Старые уже открытые карты не отзывать.
- [x] GREEN и границы: Wateractive→нетunlock,disabledWater→можно; Burglar/Blue/Red/стики/negative valid resources; no voluntary discard неэквивалент untouched allowance.
- [x] Run `node --test tests/core/mechanics-061-profile.test.js`, затем затронутые соседние tests/core и `npm test` после интеграции группы. Ожидается0FAIL; legacy fixture/replay unchanged.
- [x] Commit и progress: указать ID, source commit, regression names/команду, статус `исправлено в коде` отдельно от `проверено в APK`.

### Task12: АУ-12 — Рекорд серии боссов завышается

**Files:** Modify `src/core/profile.js`; Test `tests/core/mechanics-061-profile.test.js`.

**Interfaces:** Использует Task0 `usesCurrentMechanics(state)` для replay-зависимых эффектов. Выход — исправленный обычный dispatch, неизменённые public action имена/формы; profile-задачи не меняют правила старого replay.

- [x] Разобрать исходное воспроизведение `scripts/audit060-profile/probes.mjs` и контракт APK `functions/state_events.lua:158–160,340–346`; не принимать audit-assert wrong result за правильный regression.
- [x] RED: создать тест с правильным ожидаемым результатом: Обычный Small/Big прерывает серию; продолжение серии требует пропуска промежуточных блайндов. Числовой пример: Босс → Small → Big → Босс: ожидаемый лучший рекорд1, фактически2.
- [x] Run `node --test tests/core/mechanics-061-profile.test.js`. Ожидается FAIL именно на найденном несоответствии.
- [x] Реализовать минимально: При принятом round_started Small/Big обнулять run.bossStreak, не highScores record. Skip не сбрасывает.
- [x] GREEN и границы: Boss→Small→Big→Boss record1; Boss→skipSmall/Big→Boss record2; reload/idempotence/seeded/challenge и прежние рекорды.
- [x] Run `node --test tests/core/mechanics-061-profile.test.js`, затем затронутые соседние tests/core и `npm test` после интеграции группы. Ожидается0FAIL; legacy fixture/replay unchanged.
- [x] Commit и progress: указать ID, source commit, regression names/команду, статус `исправлено в коде` отдельно от `проверено в APK`.

### Task13: АУ-13 — Лимит истории блокирует длинную партию

**Files:** Modify `src/core/run.js; src/persistence/save.js`; Test `tests/core/mechanics-061-replay.test.js`.

**Interfaces:** Использует Task0 `usesCurrentMechanics(state)` для replay-зависимых эффектов. Выход — исправленный обычный dispatch, неизменённые public action имена/формы; profile-задачи не меняют правила старого replay.

- [ ] Разобрать исходное воспроизведение `scripts/audit060-profile/replay-cap.mjs` и контракт APK `functions/button_callbacks.lua:36–47 (сортировка без бюджета действий)`; не принимать audit-assert wrong result за правильный regression.
- [ ] RED: создать тест с правильным ожидаемым результатом: Длинная допустимая партия должна оставаться играбельной; внутренний лимит журнала не является игровой механикой. Числовой пример: Omelette: START_BLIND +9999 чередующихся сортировок; сохранение597442байта валидно, после загрузки следующий ход → INVALID_STATE: Effect history limit reached.
- [ ] Run `node --test tests/core/mechanics-061-replay.test.js`. Ожидается FAIL именно на найденном несоответствии.
- [ ] Реализовать минимально: Сжать соседние SET_SORT в проверяемую replay macro с repeat и первым expectedRevision/последнимmode; в replay один сорт+проверенный скачок revision. Repeat допустим только для чистой сортировки, без пропуска economy/RNG. Снять искусственный10000cap, сохранить строгий2MiBstate/16MiBaccount лимит и whitelist; не принимать произвольный checkpoint.
- [ ] GREEN и границы: 10001/50000 alternating sorts→действиеуспешно+smalljournal; save/reload; malformedrepeat/overflow/неSET_SORT/tamperedmoney/RNGreject; промежуточныеplay/discardнеудаляются; old10000journal читается и продолжается.
- [ ] Run `node --test tests/core/mechanics-061-replay.test.js`, затем затронутые соседние tests/core и `npm test` после интеграции группы. Ожидается0FAIL; legacy fixture/replay unchanged.
- [ ] Commit и progress: указать ID, source commit, regression names/команду, статус `исправлено в коде` отдельно от `проверено в APK`.

## Финальная интеграция и выпуск

- [ ] Перечитать все13 критериев BACKLOG: нет открытых шагов, маскируемых общим green suite.
- [ ] Исполнить full core, нативные oracle при наличии LuaJIT+APK; отдельно фиксировать private skips.
- [ ] Перезапустить матрицы150×28 и модификаторов с новыми правильными ожиданиями; старые audit wrong-result probes не использовать как release gate.
- [ ] Browser: Ox tie skip/play/reload, Death/Wheel inventory, Purple+Trading, Ankh/Immolate boss hiding, отказ сохранения, repeated input, pack/reorder и существующая CI-матрица.
- [ ] Независимое ревью с полным diff и review-focus; подтверждённые Critical/Important исправить с RED→GREEN.
- [ ] Обновить package/versionCode только для фактического кандидата0.4.61/code74; fresh Gradle, signature/alignment, manifest, CRC, всеofflineassetsbyteequal и источник CI.
- [ ] В progress/STATUS указать точный source/tested commit, CI, APK hash/link, signature-ограничение и непройденную физическую приёмку. Прежний APK остаётся последним выпущенным до этого момента.
- [ ] Publish разрешённой feature-ветки, без merge; выдать короткий результат и APK. Ни один статус `проверено в APK` не ставить до этого шага.
