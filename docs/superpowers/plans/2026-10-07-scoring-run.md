# Подсчёт и действия забега — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Track tasks with checkboxes.

**Goal:** Связать обычную руку, подтверждённые эффекты и действие игрока с детерминированным состоянием и трассой.
**Architecture:** Чистые ES modules. Каталог hand values и четыре явных эффекта; scoreHand не мутирует state. dispatch выполняет проверку до изменения и возвращает события; RNG только в ядре.
**Tech Stack:** JS / Node node:test; стандартные BigInt и structuredClone.
**Spec:** `../../design.md`, `../../contracts.md`, `../../rules/poker-hands.md`, `../../rules/scoring-sequence.md`, `../../rules/run-and-economy.md`.

## Global Constraints

- Прежние31 тестов остаются зелёными; старый код не используется.
- Все12 базовых значений/приростов из таблицы Poker Hands; выбранная комбинация не зависит от уровня/очков.
- Только Base playing cards и Joker/Sly/Clever/Splash; неподдержанный эффект/модификатор явно отвергать.
- Joker +4 Mult; Sly +50 Chips содержит пару, включая тройку/каре; Clever +80 при двух разных парах, не каре; Splash включает все played в scoring.
- Целочисленная ветвь, без guessed fractional rounding/interest.
- Новое состояние сериализуемо через явную схему; UI события не участвуют в расчёте.

## Review Focus

1. Повтор одного expectedRevision не повторяет розыгрыш или расход сброса — Task2.
2. Неизвестный joker/modifier не даёт частичный score — Task1/2.
3. При высокой Pair level не переопределять лучшую руку — Task1.
4. Остаток колоды не reshuffle в середине блайнда — Task2.
5. Save/reload возвращает BigInt и тот же RNG/порядок; malformed save отвергается — Task3.

### Task 1: уровни, chips и четыре эффекта

**Files:** `src/content/hands.js`, `src/content/jokers.js`, `src/core/score.js`, `tests/core/score.test.js`.
**Interfaces:** hand catalog значения chips,mult,chipGain,multGain; joker supported IDs; `scoreHand(state,playedCards)` согласно contracts.md. `state.handLevels`/jokers от Task2.

- [x] Написать 14 hand/level vectors (16,52,84,135,220,280,260,260,672,1208,1560,2142,3440,123); 4 эффекта и отсутствие триггера; порядок trace и refusal unsupported.
- [x] Запустить `node --test tests/core/score.test.js`, увидеть отсутствующий модуль.
- [x] Реализовать каталог и scoreHand, все значения BigInt; scoring IDs сохраняют played order.
- [x] `npm test` зелёный, коммит; отметить здесь результат.

### Task 2: состояние и действия

**Files:** `src/core/run.js`, `tests/core/run.test.js`.
**Interfaces:** `createRun(seed,options)->GameState`; `dispatch(state,action)->{state,events,error}` по contracts.md, scoreHand Task1, RNG прежнего модуля.

- [x] Написать tests: deck52 уникальных id/rank/suit; red4hands4discards и blue5hands3discards; START_BLIND выдаёт8 из52; повторseed даёт ту же очередь.
- [x] Проверить PLAY/DISCARD1..5, scoring с кикерами, добор остатка, round_won при score==target, game_over при0hands и score<target, отказ чужогоID/duplicates/6карточек/устаревшейrevision/невернойphase без изменения состояния.
- [x] Запустить `node --test tests/core/run.test.js`, RED отсутствие модуля.
- [x] Реализовать Fisher-Yates только игровым deck RNG, draw до handSize, атомарные действия и события. Старт money — явный аргумент; следующий blind/payout пока не выдумывать.
- [x] `npm test`, GREEN, коммит.

### Task 3: схема сохранения

**Files:** `src/persistence/save.js`, `tests/core/save.test.js`.
**Interfaces:** `serializeState(state)->string`, `deserializeState(text)->GameState`; validate все поля контракта и не преобразовывать посторонние строки в BigInt.

- [x] Написать roundtrip и последующее PLAY/replay: state/events/RNG совпадают; invalid decimal, version, duplicate/missing IDs, invalid phase/RNG отклоняются.
- [x] RED `node --test tests/core/save.test.js`; реализовать прямую схему без JSON magic replacer.
- [x] `npm test`, GREEN; атомарный физический write и backup не заявлять реализованным.

## Ledger

07.10.2026: база31/31 подтверждена в этом worktree. Task1→Task2: handLevels+jokers и ScoreResult одинаковы с contracts.md. Task2→Task3: поля GameState/schemaVersion и BigInt записываются явно. Открытые lifecycle параметры Research проверяет параллельно; включать только после документального подтверждения. Пользователь «Продолжай» уже разрешил исполнение, новый круг согласования не нужен.

Task1 complete: RED отсутствует score.js, GREEN весь suite51/51. Task2 complete: RED отсутствует run.js, GREEN61/61. Task3 complete: RED отсутствует save.js, GREEN66/66. Коммит71b58db.

Независимый QA66/66: четыре важных ошибки. Коррекция выполнена одним проходом: четыре regression tests RED (seed/metadata, held modifier, phase/draw, impossible trace); guards+семантическая сверка trace, полный suite71/71 GREEN. Добавлен также повторный DISCARD. Физический write/backup/Android и остальные эффекты не проверялись.

Ruling: held>handSize не отвергается — явно предусмотрено RULE-RUN-003 и кадром8/7; цена неверной трактовки — влияние будущих расходников и расширенных рук, требуется их проверка позже.
Ruling: max counters соответствуют только Red/Blue без modifiers — текущий каталог не содержит изменяющих counters эффектов; цена — схема требует расширения при добавлении такого контента.
Ruling: startup balance пока явно передаётся, payout отсутствует — Research оставил4 и interest snapshot вторичными candidate; цена — нет полного перехода в магазин до закрытия источников.
Ruling: стартовый Fisher-Yates — внутренний алгоритм этого проекта, PRNG parity оригинала не заявляется; reset на последующий blind остаётся неподтверждённым.

При само-проверке: все задачи и интерфейсы покрыты указанным срезом. Level catalog используется, но применение планет ещё не реализовано. Отсутствует UI/SDK/APK. Дальнейшая задача полного этапа2 остаётся в ROADMAP.md.
