# Пьеро — актуальный принятый вариант 0.4.61

Выпущена **0.4.61-preview/code74**, пакет `ru.cardcascade.game.preview`, правила `mechanicsVersion:1`. Ветка `fix/enhancement-visuals`, PR50 открыт и не слит.

**Приёмка пользователя, 03.11.2026:** текущий вариант принят как актуальная база, общая оценка положительная. Замечание У-80: набор Арканы всё ещё притормаживает; нужно переделать его и изменить расположение карт. Сейчас замечание только записано, реализацию не начинать. Продолжение — в другом чате.

План с анализом, подзадачами и проверками: [mechanics-fixes.md](docs/superpowers/plans/2026-10-31-mechanics-fixes.md). Постоянный журнал: [mechanics-fix-progress.md](docs/qa/2026-10-31-mechanics-fix-progress.md). Пользовательский бэклог: [BACKLOG.md](BACKLOG.md). При продолжении сначала читать эти файлы; исторический аудит0.4.60 не задаёт текущий статус.

**Все13 пунктов АУ-01–АУ-13 выполнены технически.** Task0 совместимость —534e3de; АУ-01–12 —2fef8a8; АУ-13 —ce8cb14 (локальные коммиты). Опубликованный игровой source `7fd1e5c7617a68d6adc7b4998ed71b1d5c166053`; tested merge `4e805829b792102daca4b5752fa5ac851d51bb0d`; одинаковое дерево `16a412c51a59ec85fa840c4549b59ae68f09aac8`. Последующий markdown-only commit фиксирует выпуск и не меняет APK.

[CI41171424495](https://github.com/kotlyakov/Perriot-android/actions/runs/41171424495) SUCCESS: 1975 core PASS /0 FAIL /2 optional private-source skips;49 browser suites PASS; fresh Gradle, подпись v2 и zipalign16KB PASS. Матрицы150×28/8550расчётов,11436boss/modifierchecks,6233semanticchecks и41arithmeticcases PASS. Независимое ревью: подтверждённых Critical/Important нет.50000реальных сортировок дают2записи/18760байт; reload/RNG PASS.

APK: [Pierrot-0.4.61-preview.apk](https://chatgpt.com/library?file_id=libfile_e9f5c0853ff48191b57b163a2bf44db9&account_id=personal),1440034байта. SHA256 `8ecfdbc16c1d76dc02acbd1acc713be983fe270353af25b7b110f72a58e46316`. Все124offlineassets побайтно совпадают с подготовленными исходниками; manifest/code74, CRC и источник сборки проверены. Полный протокол: [mechanics-fixes-061.md](docs/qa/2026-10-31-mechanics-fixes-061.md).

**Сейчас: работа остановлена по указанию пользователя; ждать продолжения в другом чате.** Следующая согласованная тема — У-80 (плавность и новая компоновка Арканы). Общая пользовательская приёмка получена; это не заменяет инструментальные замеры. FPS, задержки диска и полная native n→o/frame-eventRNGparity здесь не проверены. Для ничьей Ox принят детерминированный канонический fallback; для истории сохранены2MiBstate/16MiBaccount бюджеты. Другие открытые задачи, включаяТ-01, остаются в BACKLOG.

Подпись CIdebug: `8a974a736e4d64b5af8254f0582529520479693977bde1363f0fbfd4a73ee8cd`; она отличается от0.4.60, обновление поверх прежней установки не поддерживается. **Старую игру с прогрессом не удалять.** Историческая0.4.60: [APK](https://chatgpt.com/library?file_id=libfile_8b6b8bf3ac5c81918f16882c16f5a2c9&account_id=personal).
