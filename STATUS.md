# STATUS.md — Пьеро

10.10.2026. Активный этап П-05г, 0.4.16-preview/code29. Исходники: kotlyakov/Perriot-android. Императрица/Иерофант и Mult/Bonus слиты через PR #13, merge 892e56c51e29d8ebcfb9d071c6eb293af7aba5ef, Actions37997751499 SUCCESS. Не начинать этот блок повторно.

Planet/Black Hole: точные 12 комбинаций, собственные слоты/покупка, применение без RNG/discovery, run usage и строгие totals, lastTarotPlanet, legacy save, debuff расходует без повышения. Выбранная принадлежащая карта имеет «Использовать»; продажа вправо сохранена. Гонка общего test helper устранена отдельной RED→GREEN регрессией ожидания удаления меню.

Celestial packs: восемь identities; Normal 3/1, Jumbo 5/1, Mega 5/2; Telescope, Black Hole, bans, duplicates/Showman совпадают в 64 нативных fixture-сценариях по identity и keyed streams. OPEN/USE/SKIP оплачивает один раз, применяет карту сразу без consumable slot, сохраняет Mega choice и исходный shop, не тратит RNG при skip. Строгий save закрывает невозможные contents/cardinality и сохраняет next-ante context boss shop. Собственный экран выбора/пропуска и drag-to-open добавлены; официальный Chromium/Android/package полностью PASS.

Денежные Tarot: Отшельник и Умеренность имеют точные формулы APK, caps $20/$50, debuff consume/count без выплаты, Tarot usage/last key, покупку и русский UI. PR #11 слит в b61b2b52eeed1ae3d3bd759ad5c91e185c09bcc1 после Actions37957172138 SUCCESS. Не повторять этот блок.

Реализованы обычные боссы дальнейших анте: скрытие House/Wheel/Fish/Mark, Water/Needle, Wall, Eye/Mouth, Plant, Arm, Serpent, Tooth/Flint и Ox при однозначном snapshot. Переходы анте, настоящие цели, история и загрузка. 32 джокера/6 видов пропуска из предыдущего этапа сохранены. Полный пул28 боссов не сокращён.

Ранее независимое ревью обычных боссов завершено без оставшихся существенных замечаний: исправлены утечка скрытых карт через диалог колоды и неверное принятие null hiddenCardIds. Физический Android/пользовательская приёмка не выполнены.

Открыто: финальные боссы, победа/endless, равные максимумы любимой комбинации Ox (нативный LuaJIT pairs порядок различается между процессами), остальные118 джокеров, остальные усиления/издания/печати игральных карт, остальные17 Tarot/прочие Spectral, четыре других семейства наборов, ваучеры, оставшиеся теги, колоды/сложности/профили/испытания. Полная игра не готова. Анимация использования/повышения и buy-and-use, профиль/discovery расходников отдельно открыты. Следующий связанный шаг П-05 — Маг и Lucky Card на уже проверенном targeted-enhancement контракте, затем одноцелевые усиления. Не повторять Дурака, Императрицу или Иерофанта.

Текущая проверенная промежуточная сборка: 0.4.16-preview/code29, Actions37997751499, artifact11648606316, ZIP SHA256 d022eef9f1f94e0d030374a8961c444045f8dfdac88adf23b1d818e7b904aa58. Это не полная игра и не финальный APK.

Дурак: покупка и forced copy предыдущей Tarot/Planet, full/negative slots, debuff, история/usage, цены со скидкой/inflation и пять constructor/juice Math RNG draws. 320/320 core PASS, локальный browser mouse/touch/doubleclick/reload/writefail PASS; независимое QA выявило и помогло закрыть throw при неверном context. PR #12 слит, merge 0b4078f071f14ccf5f2c0c9bf44014f98adbbcd4. Проверенный head 0824c96a08161567a1eb23e83f9433a13accffcf, Actions37992249865 SUCCESS: 320 core, 23 official Chromium suites, fresh Gradle compile, APK signature/alignment и artifact PASS. Полный локальный browser также 23/23 PASS. Banned-key fallback, discovery и deferred sound RNG отдельно открыты.

Императрица/Иерофант: выбор 1–2 карт текущей руки, атомарная замена enhancement, точные +4 Mult/+30 chips только у засчитываемых карт, Splash/kicker и boss-debuff, строгий schema-v1 codec и derived enhancementIds. Русские описания и собственные визуальные метки добавлены. 328/328 core и все24 Chromium suites PASS локально и в Actions; fresh Gradle, offline assets, подпись/zipalign и APK artifact PASS. PR #13 слит в 892e56c51e29d8ebcfb9d071c6eb293af7aba5ef.
