# Прогресс — план docs/superpowers/plans/2026-10-31-mechanics-fixes.md

Выпущено: **0.4.60/code73**, игровой source1f1cf3a9; последний audit commit remote c1f7b948 / local0e95f6d.
Рабочий кандидат: **0.4.61/code74**, ещё не собран. Версия исправленных правил: mechanicsVersion1. Task0 и все АУ-01–13 исправлены в коде; общий core1975PASS/0FAIL/2expectedprivate skips. Ни один пункт ещё не проверен в новой APK.
Активно: **Финальная CI/сборка0.4.61**, владелец — ведущий. Независимое ревью и локальный browser/matrix завершены; общая CI и APK ещё ожидаются.

| Задача | ID | Код | Регрессии | Коммит | APK |
|---|---|---|---|---|---|
| Task0 | совместимость | Выполнено в коде | 5 новых тестов; full1923PASS/0FAIL/2skip | 534e3de | Нет |
| Task1 | АУ-01 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-ox.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Нет |
| Task2 | АУ-02 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-consumables.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Нет |
| Task3 | АУ-03 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-consumables.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Нет |
| Task4 | АУ-04 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-consumables.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Нет |
| Task5 | АУ-05 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-jokers.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Нет |
| Task6 | АУ-06 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-discard.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Нет |
| Task7 | АУ-07 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-boss-draw.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Нет |
| Task8 | АУ-08 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-boss-draw.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Нет |
| Task9 | АУ-09 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-jokers.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Нет |
| Task10 | АУ-10 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-profile.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Нет |
| Task11 | АУ-11 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-profile.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Нет |
| Task12 | АУ-12 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-profile.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Нет |
| Task13 | АУ-13 | Код исправлен; интеграция ядра PASS | 6 регрессий,22neighbors,50000actualsorts/save/reload | ce8cb14 | Нет |

## Решения и доказательства

- Ruling: пользователь прямо поручил автономно составить план и начать; повторное согласование плана не требуется.
- Ruling: сохраняем существующую feature-ветку и checkout; он чистый, отдельный от main, текущий PR не сливаем. Параллельные владельцы файлов не пересекаются.
- Ruling: один marker mechanicsVersion1 отделяет новые правила от исторического replay; отдельная версия APK не подменяет версию правила.
- Ruling: ничья Ox разрешается первым максимумом в каноническом порядке APK_HAND_NAMES. Это переносимый детерминированный fallback; точный неизвестный Lua pairs порядок не обещается. Цена выбора — при ничьей может отличаться конкретная комбинация, но не будет тупика/случайного изменения после reload.
- Ruling: лимит АУ-13 устраняется сжатием чистой сортировки и сохранением byte budgets, без доверия произвольному checkpoint. Если проверка эквивалентности обнаружит эффект сортировки, изменить решение в этом журнале до реализации.

- Task0: complete, commit534e3de, RED→GREEN5tests, full1923PASS/0FAIL/2skip. Legacy0.4.60 Death/Wheel/Bones/Purple/sort fixtures byte-identical.
- Task1–12: code integrated, commit2fef8a8, full1971total/1969PASS/0FAIL/2optional private skips. Отдельные RED/GREEN logs находятся artifacts/mechanics-fixes; версия APK не изменилась.
- Ruling: ранняя Task7–8 fixture имела отсутствующий originalKey и устаревший journal после ручной подготовки. Исправлен только fixture; затем временно отключён новый helper и проверен корректный RED4/7 по скрытию/RNG, восстановлен helper и GREEN24/24 соседей. Проверки save не ослаблялись.

- Task13: complete in code, commitce8cb14; RED5fail/1pass→GREEN6/6, neighbors22/22. Старая история10000ходов читается и продолжается;50000реальныхсортировок→2записижурнала/18760байт, RNG/деньги неизменны, reloadPASS.
- Final review: независимое whole-branch ревью (review_mechanics061), подтверждённых Critical/Important нет; проверен actual persistence diff, первоначально пропущенный в упаковке diff-файла.
- Final local core:1977total/1975PASS/0FAIL/2expectedoptional private-source skips. Переход теста persistence-performance с actions[50] на поиск реальной SET_SORT записи сохраняет проверку tampering после сжатия.
- Local browser: mechanics-fixes-061 PASS,6сценариев — Death/ошибкаsave/retry, Wheel23$, PurpleTrading, AnkhMark, HouseImmolate, Ox skip/start/reload. Тест ждёт принятой revision, а не только enabled DOM; расходники используются утверждённым drag, tooltip не обходится программным click.
- Matrices:150×28/8550scoresPASS;11436boss/modifiers/deck/stake/tagchecksPASS;6233semanticchecksPASS;41fixedarithmeticPASS. Эталонные приватные регенерации в этой среде недоступны (2skip), физический Android ещё не проверен.
- Release preparation: package0.4.61/code74,49CIbrowser suites (добавлен новый набор); offlineassets/check-configPASS. APK ещё не выпущен.
