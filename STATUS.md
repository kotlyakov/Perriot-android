# STATUS.md — Пьеро

10.10.2026. Активный этап П-05г, 0.4.15-preview/code28. Исходники: kotlyakov/Perriot-android. Planet/Black Hole слит через PR #9, merge 4505f985e8e17f3e42b5e3cbb2249508834c1db1, Actions37952596110 SUCCESS. Celestial packs слит через PR #10, merge 7659f677c4c1d8c8842afa994e4c521a22c6bfe5, Actions37954651235 полностью SUCCESS. Не начинать эти блоки повторно.

Planet/Black Hole: точные 12 комбинаций, собственные слоты/покупка, применение без RNG/discovery, run usage и строгие totals, lastTarotPlanet, legacy save, debuff расходует без повышения. Выбранная принадлежащая карта имеет «Использовать»; продажа вправо сохранена. Гонка общего test helper устранена отдельной RED→GREEN регрессией ожидания удаления меню.

Celestial packs: восемь identities; Normal 3/1, Jumbo 5/1, Mega 5/2; Telescope, Black Hole, bans, duplicates/Showman совпадают в 64 нативных fixture-сценариях по identity и keyed streams. OPEN/USE/SKIP оплачивает один раз, применяет карту сразу без consumable slot, сохраняет Mega choice и исходный shop, не тратит RNG при skip. Строгий save закрывает невозможные contents/cardinality и сохраняет next-ante context boss shop. Собственный экран выбора/пропуска и drag-to-open добавлены; официальный Chromium/Android/package полностью PASS.

Денежные Tarot: Отшельник и Умеренность имеют точные формулы APK, caps $20/$50, debuff consume/count без выплаты, Tarot usage/last key, покупку и русский UI. PR #11 слит в b61b2b52eeed1ae3d3bd759ad5c91e185c09bcc1 после Actions37957172138 SUCCESS. Не повторять этот блок.

Реализованы обычные боссы дальнейших анте: скрытие House/Wheel/Fish/Mark, Water/Needle, Wall, Eye/Mouth, Plant, Arm, Serpent, Tooth/Flint и Ox при однозначном snapshot. Переходы анте, настоящие цели, история и загрузка. 32 джокера/6 видов пропуска из предыдущего этапа сохранены. Полный пул28 боссов не сокращён.

Ранее независимое ревью обычных боссов завершено без оставшихся существенных замечаний: исправлены утечка скрытых карт через диалог колоды и неверное принятие null hiddenCardIds. Физический Android/пользовательская приёмка не выполнены.

Открыто: финальные боссы, победа/endless, равные максимумы любимой комбинации Ox (нативный LuaJIT pairs порядок различается между процессами), остальные118 джокеров, карты/модификаторы, остальные19 Tarot/прочие Spectral, четыре других семейства наборов, ваучеры, оставшиеся теги, колоды/сложности/профили/испытания. Полная игра не готова. Анимация использования/повышения и buy-and-use, профиль/discovery расходников отдельно открыты. Следующий шаг — пройти CI/слить Дурака, затем targeted Tarot и модификаторы карт.

Предыдущая проверенная сборка: 0.4.10-preview/code23, Actions37917139497, SHA256 b2d34b7c97fd6b808695fcfa50214d66ab5bb74bd7f4c899cfc1f5cc38e24d31. Нового готового APK пока нет.

Дурак: покупка и forced copy предыдущей Tarot/Planet, full/negative slots, debuff, история/usage, цены со скидкой/inflation и пять constructor/juice Math RNG draws. 320/320 core PASS, локальный browser mouse/touch/doubleclick/reload/writefail PASS; независимое QA выявило и помогло закрыть throw при неверном context. Ветка feat/fool-tarot-015; официальный CI/Android ожидается, не считать слитым. Banned-key fallback, discovery и deferred sound RNG отдельно открыты.
