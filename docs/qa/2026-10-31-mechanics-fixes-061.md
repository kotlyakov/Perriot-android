# Исправления механик 0.4.61/code74 — проверка кандидата

План: docs/superpowers/plans/2026-10-31-mechanics-fixes.md. Прогресс: docs/qa/2026-10-31-mechanics-fix-progress.md. Аудит0.4.60 остаётся историческим документом; текущие статусы — в этих файлах и BACKLOG.md.

## Изменения

Исправлены все АУ-01–АУ-13. Новые игры имеют mechanicsVersion1; старые записи replay исполняются исторически, первый принятый новый ход записывает переход. Неизвестные версии и отклонённые ходы не мигрируют состояние. Пять0.4.60fixtures (Death/Wheel/Bones/Purple/sort) читаются/пишутся побайтно без изменения.

- Ox: при ничьей канонический первый максимум вместо null; старый null восстанавливается при переходе. Точный неизвестный Lua pairs порядок не обещается.
- Death: permaBonus копируется, включая отсутствие/ноль. Wheel сохраняет extraValue в продаже; active/debuffed Showman правильно выбирает Arcana pool.
- Bones: после первого спасения следующие сохраняются. Purple seal идёт после pre_discard и до individual discard/destruction, без удвоения от Blueprint; Hook сохраняет прежний путь.
- Общий boss draw helper применяется к refill и hand-size grant; House зависит от счётчиков, Mark/Pareidolia и Wheel/Oops учитываются; disabled не прячет/не поллит.
- Bus просматривает все scoring cards, сохраняя Stone raw RNG; legacy .some путь остаётся только у старого replay.
- Profile: JQKA+Four Fingers unlock, Matador сравнивает фактический reset allowance, Small/Big сбрасывают boss streak. Уже открытые карты и исторические рекорды не отзываются.
- Replay: соседние чистые SET_SORT сжимаются в repeat macro с первым expectedRevision и последнимmode. Macro исполняет один sort и проверенный скачокrevision; metadata-переходы/реальные игровые действия не удаляются. Public repeat запрещён. Artificial10000cap снят;2MiBstate/16MiBaccount бюджеты и canonical replay comparison сохранены. Не обещается бесконечный размер истории разных игровых действий.

## Доказательства

Core:1977total/1975PASS/0FAIL/2optional private-source skips. Новые regressionfiles tests/core/mechanics-version и mechanics-061-*. Каждый ID имеет RED→GREEN; ошибочная ранняя boss-draw fixture исправлена и затем повторно проверен настоящий RED4→GREEN, проверки codec не ослаблялись. После сжатия исправлена только устаревшая привязка tamper-теста к actions[50], смысл проверки сохранён.

Actual stress:50000последовательных публичных сортировок,revision50001,2записижурнала,18760байт,state reloadPASS,RNG/деньгинеизменны. Отдельно старый10000-action journal принимается, продолжается и уплотняется; invalidrepeat/type/overflow/revision/money/extraCounttamperingreject.

Независимое whole-branch review: подтверждённых Critical/Important нет. Проверялся и persistence codec, отсутствовавший в первой упаковке diff; actual source включён в ревью.

Local browser915×412:6сценариев PASS — Death+25/отказsave/повтор; Wheel Egg23$; Purple+Trading; Ankh+Mark скрытаяноваяJ; House+Immolate5скрытых; Ox tie→skip→start→reload. В сценариях используются реальные контролы и утверждённый drag, ожидание сохранённойrevision.

Матрицы:150джокеров×28боссов=4200пар/8550расчётовPASS;11436boss/modifier/deck/stake/tagchecksPASS;6233семантическихпроверкиPASS;41фиксированнаяарифметическаясценаPASS. Это не полный нативный oracle всех комбинаций/порядков.

Offlineassets/check-configPASS. Финальная CI, fresh Gradle, проверка APK/подписи и публикация ещё ожидаются. Физический Android/FPS/диск и полнаяn→o/frame-eventRNGparity не проверены.
