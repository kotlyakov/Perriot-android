# STATUS.md — Пьеро

11.10.2026. Активный этап П-05д, 0.4.18-preview/code31. Исходники: kotlyakov/Perriot-android. Lovers и Wild Card слиты через PR #15, merge ec37fb3eab34d60575ea0ef3bc9a130905629a3a, Actions38111568610 SUCCESS. Не начинать этот блок повторно.

Planet/Black Hole: точные 12 комбинаций, собственные слоты/покупка, применение без RNG/discovery, run usage и строгие totals, lastTarotPlanet, legacy save, debuff расходует без повышения. Выбранная принадлежащая карта имеет «Использовать»; продажа вправо сохранена. Гонка общего test helper устранена отдельной RED→GREEN регрессией ожидания удаления меню.

Celestial packs: восемь identities; Normal 3/1, Jumbo 5/1, Mega 5/2; Telescope, Black Hole, bans, duplicates/Showman совпадают в 64 нативных fixture-сценариях по identity и keyed streams. OPEN/USE/SKIP оплачивает один раз, применяет карту сразу без consumable slot, сохраняет Mega choice и исходный shop, не тратит RNG при skip. Строгий save закрывает невозможные contents/cardinality и сохраняет next-ante context boss shop. Собственный экран выбора/пропуска и drag-to-open добавлены; официальный Chromium/Android/package полностью PASS.

Денежные Tarot: Отшельник и Умеренность имеют точные формулы APK, caps $20/$50, debuff consume/count без выплаты, Tarot usage/last key, покупку и русский UI. PR #11 слит в b61b2b52eeed1ae3d3bd759ad5c91e185c09bcc1 после Actions37957172138 SUCCESS. Не повторять этот блок.

Реализованы обычные боссы дальнейших анте: скрытие House/Wheel/Fish/Mark, Water/Needle, Wall, Eye/Mouth, Plant, Arm, Serpent, Tooth/Flint и Ox при однозначном snapshot. Переходы анте, настоящие цели, история и загрузка. 32 джокера/6 видов пропуска из предыдущего этапа сохранены. Полный пул28 боссов не сокращён.

Ранее независимое ревью обычных боссов завершено без оставшихся существенных замечаний: исправлены утечка скрытых карт через диалог колоды и неверное принятие null hiddenCardIds. Физический Android/пользовательская приёмка не выполнены.

Открыто: финальные боссы, победа/endless, равные максимумы любимой комбинации Ox (нативный LuaJIT pairs порядок различается между процессами), остальные118 джокеров, остальные усиления/издания/печати игральных карт, остальные15 Tarot/прочие Spectral, четыре других семейства наборов, ваучеры, оставшиеся теги, колоды/сложности/профили/испытания. Полная игра не готова. Анимация использования/повышения и buy-and-use, профиль/discovery расходников отдельно открыты. Следующий связанный шаг П-05 — Chariot/Steel и held-card scoring как отдельный блок. Не повторять Дурака, Императрицу, Иерофанта, Мага или Lovers.

Текущая проверенная промежуточная сборка: 0.4.18-preview/code31, Actions38111568610, artifact11691682853, ZIP SHA256 b86776df0d8e4d4a2900ae6a4c07f888e913adff4ae9d410e152da2719ec5e71. Это не полная игра и не финальный APK.

Дурак: покупка и forced copy предыдущей Tarot/Planet, full/negative slots, debuff, история/usage, цены со скидкой/inflation и пять constructor/juice Math RNG draws. 320/320 core PASS, локальный browser mouse/touch/doubleclick/reload/writefail PASS; независимое QA выявило и помогло закрыть throw при неверном context. PR #12 слит, merge 0b4078f071f14ccf5f2c0c9bf44014f98adbbcd4. Проверенный head 0824c96a08161567a1eb23e83f9433a13accffcf, Actions37992249865 SUCCESS: 320 core, 23 official Chromium suites, fresh Gradle compile, APK signature/alignment и artifact PASS. Полный локальный browser также 23/23 PASS. Banned-key fallback, discovery и deferred sound RNG отдельно открыты.

Императрица/Иерофант: выбор 1–2 карт текущей руки, атомарная замена enhancement, точные +4 Mult/+30 chips только у засчитываемых карт, Splash/kicker и boss-debuff, строгий schema-v1 codec и derived enhancementIds. Русские описания и собственные визуальные метки добавлены. 328/328 core и все24 Chromium suites PASS локально и в Actions; fresh Gradle, offline assets, подпись/zipalign и APK artifact PASS. PR #13 слит в 892e56c51e29d8ebcfb9d071c6eb293af7aba5ef.


Маг/Lucky Card: выбор 1–2 карт и атомарная замена enhancement; у каждой засчитываемой не-debuffed Lucky карты точные независимые keyed APK-роллы 1/5 на +20 Mult и 1/15 на $20 в нативном порядке. Money/RNG применяются один раз, сохранения строго replay-проверяются; отдельные регрессии закрывают Eye/Mouth history, Hook/Wheel stream composition, Splash и подмену RNG metadata. 338/338 core, 25/25 Chromium suites, fresh Gradle, подпись/zipalign и APK artifact PASS. Независимое ревью завершено без Critical/Important замечаний. PR #14 слит в d35fccf8ba6ef8f52b5187f8cd17fe462b0af8c8.

Lovers/Wild Card: Lovers усиливает ровно одну карту; активная Wild считается любой мастью для флешей и мастевых джокеров. Все мастевые боссы ослабляют Wild независимо от печатной масти; ослабленная Wild сохраняет только базовую масть для распознавания и не даёт card effects. Добавлены строгие save/shop identities, отсутствие RNG, визуальная метка без утечки у скрытых карт. Независимое ревью закрыло три Important замечания; повторное ревью без Critical/Important. 349/349 core, 26/26 Chromium suites, fresh Gradle, apksigner, zipalign и APK artifact PASS. PR #15 слит в ec37fb3eab34d60575ea0ef3bc9a130905629a3a.
