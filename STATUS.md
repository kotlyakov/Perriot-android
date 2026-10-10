# STATUS.md — Пьеро

10.10.2026. Активный этап П-05д, 0.4.17-preview/code30. Исходники: kotlyakov/Perriot-android. Маг и Lucky Card слиты через PR #14, merge d35fccf8ba6ef8f52b5187f8cd17fe462b0af8c8, Actions38018631174 SUCCESS. Не начинать этот блок повторно.

Planet/Black Hole: точные 12 комбинаций, собственные слоты/покупка, применение без RNG/discovery, run usage и строгие totals, lastTarotPlanet, legacy save, debuff расходует без повышения. Выбранная принадлежащая карта имеет «Использовать»; продажа вправо сохранена. Гонка общего test helper устранена отдельной RED→GREEN регрессией ожидания удаления меню.

Celestial packs: восемь identities; Normal 3/1, Jumbo 5/1, Mega 5/2; Telescope, Black Hole, bans, duplicates/Showman совпадают в 64 нативных fixture-сценариях по identity и keyed streams. OPEN/USE/SKIP оплачивает один раз, применяет карту сразу без consumable slot, сохраняет Mega choice и исходный shop, не тратит RNG при skip. Строгий save закрывает невозможные contents/cardinality и сохраняет next-ante context boss shop. Собственный экран выбора/пропуска и drag-to-open добавлены; официальный Chromium/Android/package полностью PASS.

Денежные Tarot: Отшельник и Умеренность имеют точные формулы APK, caps $20/$50, debuff consume/count без выплаты, Tarot usage/last key, покупку и русский UI. PR #11 слит в b61b2b52eeed1ae3d3bd759ad5c91e185c09bcc1 после Actions37957172138 SUCCESS. Не повторять этот блок.

Реализованы обычные боссы дальнейших анте: скрытие House/Wheel/Fish/Mark, Water/Needle, Wall, Eye/Mouth, Plant, Arm, Serpent, Tooth/Flint и Ox при однозначном snapshot. Переходы анте, настоящие цели, история и загрузка. 32 джокера/6 видов пропуска из предыдущего этапа сохранены. Полный пул28 боссов не сокращён.

Ранее независимое ревью обычных боссов завершено без оставшихся существенных замечаний: исправлены утечка скрытых карт через диалог колоды и неверное принятие null hiddenCardIds. Физический Android/пользовательская приёмка не выполнены.

Открыто: финальные боссы, победа/endless, равные максимумы любимой комбинации Ox (нативный LuaJIT pairs порядок различается между процессами), остальные118 джокеров, остальные усиления/издания/печати игральных карт, остальные16 Tarot/прочие Spectral, четыре других семейства наборов, ваучеры, оставшиеся теги, колоды/сложности/профили/испытания. Полная игра не готова. Анимация использования/повышения и buy-and-use, профиль/discovery расходников отдельно открыты. Следующий связанный шаг П-05 — одноцелевые усиления, начиная с Lovers/Wild и проверки распознавания мастей; Steel и held-card scoring выделять отдельно. Не повторять Дурака, Императрицу, Иерофанта или Мага.

Текущая проверенная промежуточная сборка: 0.4.17-preview/code30, Actions38018631174, artifact11657742588, ZIP SHA256 8a33ab28c39afd21c52c66c1da8ae646b08d74ca7319cb44bbfeb79d7a3218bf. Это не полная игра и не финальный APK.

Дурак: покупка и forced copy предыдущей Tarot/Planet, full/negative slots, debuff, история/usage, цены со скидкой/inflation и пять constructor/juice Math RNG draws. 320/320 core PASS, локальный browser mouse/touch/doubleclick/reload/writefail PASS; независимое QA выявило и помогло закрыть throw при неверном context. PR #12 слит, merge 0b4078f071f14ccf5f2c0c9bf44014f98adbbcd4. Проверенный head 0824c96a08161567a1eb23e83f9433a13accffcf, Actions37992249865 SUCCESS: 320 core, 23 official Chromium suites, fresh Gradle compile, APK signature/alignment и artifact PASS. Полный локальный browser также 23/23 PASS. Banned-key fallback, discovery и deferred sound RNG отдельно открыты.

Императрица/Иерофант: выбор 1–2 карт текущей руки, атомарная замена enhancement, точные +4 Mult/+30 chips только у засчитываемых карт, Splash/kicker и boss-debuff, строгий schema-v1 codec и derived enhancementIds. Русские описания и собственные визуальные метки добавлены. 328/328 core и все24 Chromium suites PASS локально и в Actions; fresh Gradle, offline assets, подпись/zipalign и APK artifact PASS. PR #13 слит в 892e56c51e29d8ebcfb9d071c6eb293af7aba5ef.


Маг/Lucky Card: выбор 1–2 карт и атомарная замена enhancement; у каждой засчитываемой не-debuffed Lucky карты точные независимые keyed APK-роллы 1/5 на +20 Mult и 1/15 на $20 в нативном порядке. Money/RNG применяются один раз, сохранения строго replay-проверяются; отдельные регрессии закрывают Eye/Mouth history, Hook/Wheel stream composition, Splash и подмену RNG metadata. 338/338 core, 25/25 Chromium suites, fresh Gradle, подпись/zipalign и APK artifact PASS. Независимое ревью завершено без Critical/Important замечаний. PR #14 слит в d35fccf8ba6ef8f52b5187f8cd17fe462b0af8c8.
