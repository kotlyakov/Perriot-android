# Передача №7б — 19.10.2026

19.10.2026 — №7б реализован и проверен в ветке feat/item7b-full-jokers (PR35 готов, ещё не слит). Оставшиеся43эффекта доводят каталог до150/150; «Суд» включён. Локально1347/1347PASS0skip с private native oracles; нативные1004+2000fixtures воспроизводимы,43×28boss matrix PASS. Независимое ревью:2Important исправлены RED→GREEN, открытых подтверждённых Critical/Important нет. CI39257300580 SUCCESS:1344corePASS/2expected private skips,43Chromium suites, freshAndroid, signature/alignment PASS. APK0.4.39-preview/code52 SHA2568a712dad7716cce62606d0e6e6a247824f16f74d9ce9629b8187a7fe4c55090a; artifact12189601454;69offlineassets byteequal. Source cdaef9f04366179d0da4c36e498536d18d3d0180, tested merge7d833ea80f7655009aefc3498408ad2f5f1165d2:0file differences. Debug-сертификат отличается от0.4.38: обновление поверх неё не пройдёт; удаление приложения стирает локальный прогресс. Физический Android и полная frame/event RNG parity не заявлены. №8 не начат, ждать выбора пользователя. Подробности docs/qa/item7b.md.

Репозиторий https://github.com/kotlyakov/Perriot-android .
Актуальный код находится в feat/item7b-full-jokers, PR35; apk-reference пока предыдущий релиз.
Прочитать AGENTS.md, STATUS.md, BACKLOG.md, ROADMAP.md и docs/qa/item7b.md.
Следующий этап только по выбору пользователя. Не повторять уже завершённый7б.
Исходные APK Lua assets не включать в репозиторий/сборку.
