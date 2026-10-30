# Пьеро — 0.4.60/code73: открытие набора Таро

Исходники: kotlyakov/Perriot-android, ветка `fix/enhancement-visuals`, source1f1cf3a9fbcce445ee3b248c572d886f333259f1. Tested PR merge101db37b39f3c50159666314a9f691a40c3baba3 имеет то же дерево904bc926cefbce1a8c3ccbde9bbef9e812cd92c3. PR50 не слит; итоговая документация отдельным [skip ci].

У-79 выполнен технически: одно построение руки, сохранение раскрытых узлов набора при снятии busy; раскрытие, раздача и деньги одновременно после успешного сохранения; полёт через transform с прежней геометрией и длительностью. RED→GREEN: удаляемые hand16→0/pack10→0, layout-анимации полётов16→0. В одном сопоставимом Chromium CPU×4 замере полный тестовый drag-to-ready2188→1659ms; телефонный FPS и общее снижение Layout time этим не доказаны.

CI41086569329 SUCCESS: 1920 total /1918 core PASS /0 FAIL /2 ожидаемых optional private-source skips; все48 browser suites; fresh Gradle Android, apksigner v2/zipalign16KB PASS. Шесть дополнительных целевых browser-наборов и независимые Mega/Charm/Ethereal сценарии PASS, подтверждённых Critical/Important нет. Отказ сохранения не раскрывает набор и позволяет повторить действие после восстановления хранилища. Протокол: docs/qa/2026-10-30-pack-opening-060.md. Старые standalone Arcana/Remaining-pack сценарии имеют неактуальные ожидания (Т-01), не объявлены прошедшими и не входят текущую CI-матрицу.

[Pierrot-0.4.60-preview.apk](https://chatgpt.com/library?file_id=libfile_8b6b8bf3ac5c81918f16882c16f5a2c9&account_id=personal), 1 437 350 байт. SHA2564cc409b49f10dbdbb70098bdf36d30c3cd5a0729109f2c6e27190b0163d86ac0; artifact12992451582. Все121 offline assets побайтно равны исходникам; CRC ZIP/APK и manifest(package ru.cardcascade.game.preview/code73/name0.4.60-preview) проверены.

Тестовый сертификат4be04d7ef244672186906bae7ca2d157142a95a557b0b451d786d9c52d15f656 отличается от0.4.59; обновление поверх неё не пройдёт. Не предлагать удалять старую игру с локальными сохранениями.

Следующий шаг — пользовательская проверка открытия Таро на телефоне. Физический Android/WebView/FPS/диск не измерены; native bridge/AtomicFile остаётся синхронным, отсутствие всех фризов не заявлено. Другие исторические пункты бэклога и native frame/event RNG parity этим исправлением не закрываются.
