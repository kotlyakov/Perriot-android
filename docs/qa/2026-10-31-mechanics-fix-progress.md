# Прогресс — план docs/superpowers/plans/2026-10-31-mechanics-fixes.md

Выпущено: **0.4.61-preview/code74**, mechanicsVersion1. Все АУ-01–АУ-13 исправлены и включены в проверенный APK. Source `7fd1e5c7617a68d6adc7b4998ed71b1d5c166053`; tested merge `4e805829b792102daca4b5752fa5ac851d51bb0d`; tree `16a412c51a59ec85fa840c4549b59ae68f09aac8`. CI41171424495 SUCCESS:1975corePASS/0FAIL/2optionalprivate skips,49browser suites,freshAndroid.
Активно: **физическая/пользовательская приёмка на Android**. Технический план завершён; новый код без отдельной задачи не менять. Другие открытые задачи находятся в BACKLOG.md. Полный сертификат: docs/qa/2026-10-31-mechanics-fixes-061.md.

| Задача | ID | Код | Регрессии | Коммит | APK |
|---|---|---|---|---|---|
| Task0 | совместимость | Выполнено в коде | 5 новых тестов; full1923PASS/0FAIL/2skip | 534e3de | Включено в APK061; физическая приёмка открыта |
| Task1 | АУ-01 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-ox.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Включено в APK061; физическая приёмка открыта |
| Task2 | АУ-02 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-consumables.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Включено в APK061; физическая приёмка открыта |
| Task3 | АУ-03 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-consumables.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Включено в APK061; физическая приёмка открыта |
| Task4 | АУ-04 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-consumables.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Включено в APK061; физическая приёмка открыта |
| Task5 | АУ-05 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-jokers.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Включено в APK061; физическая приёмка открыта |
| Task6 | АУ-06 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-discard.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Включено в APK061; физическая приёмка открыта |
| Task7 | АУ-07 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-boss-draw.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Включено в APK061; физическая приёмка открыта |
| Task8 | АУ-08 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-boss-draw.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Включено в APK061; физическая приёмка открыта |
| Task9 | АУ-09 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-jokers.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Включено в APK061; физическая приёмка открыта |
| Task10 | АУ-10 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-profile.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Включено в APK061; физическая приёмка открыта |
| Task11 | АУ-11 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-profile.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Включено в APK061; физическая приёмка открыта |
| Task12 | АУ-12 | Код исправлен; интеграция ядра PASS | tests/core/mechanics-061-profile.test.js; full1969PASS/0FAIL/2skip | 2fef8a8 | Включено в APK061; физическая приёмка открыта |
| Task13 | АУ-13 | Код исправлен; интеграция ядра PASS | 6 регрессий,22neighbors,50000actualsorts/save/reload | ce8cb14 | Включено в APK061; физическая приёмка открыта |

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
- Release complete:0.4.61/code74,CI41171424495SUCCESS,49browser suites,1975corePASS/2skip;124offlineassetsbyteequal,manifest/CRC/v2/alignmentPASS. [APK](https://chatgpt.com/library?file_id=libfile_e9f5c0853ff48191b57b163a2bf44db9&account_id=personal),SHA256 `8ecfdbc16c1d76dc02acbd1acc713be983fe270353af25b7b110f72a58e46316`,1440034байта. Физическая приёмка открыта; CIdebug подпись отличается от0.4.60, старую установку с прогрессом не удалять.
- Version mapping: local candidate7ae72afe ↔ remote source7fd1e5c7617a68d6adc7b4998ed71b1d5c166053, tree16a412c51a59ec85fa840c4549b59ae68f09aac8; tested merge4e805829b792102daca4b5752fa5ac851d51bb0d имеет то же дерево. Предыдущий remote checkpoint9af42e2/local1ad7429 соответствует только первым12исправлениям; это история, не последний выпуск.

03.11.2026: после возобновления повторно получен итог CI41171424495 SUCCESS от31.10; браузерный job124450006974 завершён SUCCESS, лог содержит49 UI suites. Сверены сохранённый APK и release-документы; завершена фиксация технического выпуска. Вложенные проектные STATUS/BACKLOG от09.10 являются старым снимком, текущую ветку не подменяют.
