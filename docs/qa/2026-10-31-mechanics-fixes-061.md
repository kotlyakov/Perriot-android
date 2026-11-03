# Исправления механик 0.4.61/code74 — итоговая техническая проверка

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

## Выпуск

[CI41171424495](https://github.com/kotlyakov/Perriot-android/actions/runs/41171424495) SUCCESS:1975corePASS/0FAIL/2optional skips;49browser suites PASS; fresh Gradle clean/assembleDebug без build cache. Source `7fd1e5c7617a68d6adc7b4998ed71b1d5c166053`, tested merge `4e805829b792102daca4b5752fa5ac851d51bb0d`, одинаковое дерево `16a412c51a59ec85fa840c4549b59ae68f09aac8`. Последующий documentation-only commit не меняет игровой source.

Артефакт13030624466, ZIP SHA256 `244a163d63596f2956eac86638ad4947fcb9318023cd3b01e03c702ffb5ad386` проверен. APK1440034байта, SHA256 `8ecfdbc16c1d76dc02acbd1acc713be983fe270353af25b7b110f72a58e46316`; ZIP/APK CRC PASS. Manifest: ru.cardcascade.game.preview, versionName0.4.61-preview, versionCode74. Все124assets побайтно совпадают с подготовленнымsource, лишних нет. build.txt указывает testedmerge/run. Подписьv2 и zipalign16KB проверены CI; отчёты сверены при скачивании.

[Скачать Pierrot-0.4.61-preview.apk](https://chatgpt.com/library?file_id=libfile_e9f5c0853ff48191b57b163a2bf44db9&account_id=personal). Сертификат CIdebug `8a974a736e4d64b5af8254f0582529520479693977bde1363f0fbfd4a73ee8cd` отличается от0.4.60; обновление поверх неё невозможно. Старую игру с прогрессом не удалять.

Физический Android/FPS/диск и полнаяn→o/frame-eventRNGparity не проверены. Все13пунктов выполнены технически; пользовательская приёмка остаётся открытой.
