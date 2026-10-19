# №7б — восстановление и финальная проверка, 19.10.2026

Восстановлены незакоммиченные изменения из предыдущей рабочей папки на базе330d64e.
Включены оставшиеся scoring-регрессии, нативные callback/target fixtures1004 cases,
матрица43×28боссов, строгие сохранения победной руки и выплаты.

Свежая проверка: npm test с NATIVE_APK_ASSETS/NATIVE_LUAJIT —1341tests,
1340PASS,0FAIL,1skip (cashout oracle требует отдельный LUAJIT_BIN).
Повтор с обеими переменными LuaJIT запущен отдельно.
Подготовка Android offline assets, XML/security check и git diff --check PASS.

Локального Chromium и Android SDK нет. Попытка установки Chromium получила
повреждённый архив. Полная браузерная проверка и fresh Android build должны
выполниться в Actions до объявления готовности. Независимое ревью запущено.
Этот checkpoint не объявляет №7б завершённым; №8 не начат.

## Независимое ревью и исправления

1. Score создавало расходники с ordinal, но reducer терял следующий ordinal.
   Два successive Vagabond plays могли дублировать ordinal и повредить загрузку.
   Новый интеграционный тест сначала упал2!=3, затем GREEN. Счётчик передаётся
   вместе с item7State. Полный прогон1342/1342PASS,0skip до второго исправления.
2. Blind-start разделял все удаления и все создания, теряя native callback order.
   Dagger→Riff full-capacity и Cartomancer/Marble→Madness воспроизведены RED;
   per-slot reservations и FIFO constructor queue исправляют3ошибки.
   Все5новых order tests GREEN. Исправлены2старых ожидания boss-save tests:
   native Dagger освобождает слот для Riff, итог5джокеров, не4.
