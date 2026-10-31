# Пьеро — исправление механик после аудита 0.4.60

Текущий план: docs/superpowers/plans/2026-10-31-mechanics-fixes.md. Постоянный журнал: docs/qa/2026-10-31-mechanics-fix-progress.md. Сначала читать эти три файла, затем только активную задачу.

Выпущена **0.4.60/code73**; рабочий кандидат **0.4.61/code74 пока не собран**. Игровой source1f1cf3a9, audit remote c1f7b948388bd30c19d1d41dc375720c0d54cea2 (local0e95f6d). Ветка fix/enhancement-visuals, PR50 не слит.

Все13пунктов исправлены в коде. Task0 marker/совместимость —534e3de; АУ-01–12 —2fef8a8; АУ-13 —ce8cb144f8ef9554120470b752dcfe3de90a2ba1. Общий core1977total/1975PASS/0FAIL/2expectedprivate skips. Независимое ревью без подтверждённых Critical/Important; новый UI-набор6сценариев и механические матрицы PASS. Stress50000actualsorts→2journalentries/18760bytes,reload/RNGPASS.

**Сейчас: финальная CI и fresh Android0.4.61/code74.** Кандидат подготовлен (package/versionCode изменены), локальныеofflineassets/check-configPASS; новая APK ещё не выпущена. Не считать прежнюю0.4.60 исправленной. Опубликованный checkpoint9af42e2 содержал первые12исправлений; финальный source будет указан после публикации/сертификации. Точные задачи, проверки, решения и коммиты — в progress.

Аудит/примеры: docs/qa/2026-10-31-mechanics-audit-060.md. АУ-01–13 открыты в BACKLOG.md. Исторические изменения аренды/хранения расходников сохраняются; старые replay читаются без изменения семантики, новые действия явно включают mechanicsVersion1.

Последняя APK: [0.4.60](https://chatgpt.com/library?file_id=libfile_8b6b8bf3ac5c81918f16882c16f5a2c9&account_id=personal). Её CI41086569329 SUCCESS,121assetсовпадает; физическая Android-приёмка открыта. Подпись отличается от0.4.59, старую игру с прогрессом не удалять. Проверки текущих исправлений фиксировать отдельно от этой прежней сертификации.
