# №7б — завершённый механический срез

19.10.2026. Source cdaef9f04366179d0da4c36e498536d18d3d0180, PR35 (готов, не слит).
Проверенный merge7d833ea80f7655009aefc3498408ad2f5f1165d2 побайтно равен source.

## Результат

43 оставшихся Joker effects и Judgement включены: каталог150/150.
Исправлены scoring transformations/RNG ordering, round target resets,
создание/слоты, выплаты, сохранение победной руки и authenticated replay.
Независимое ревью выявило2Important: потерю creationOrdinal counter при scoring
и blind-start ordering/reservations. Оба воспроизведены тестами RED→GREEN.
Открытых подтверждённых Critical/Important и отложенных Minor не зафиксировано.

## Проверки

- Полный локальный core:1347PASS/0FAIL/0skip с private original-source env.
- Native callbacks/target oracle:1004cases, byte-for-byte regeneration PASS.
- Прежний native oracle:2000cases, свежая regeneration byte-for-byte PASS.
- Новые43джокера ×28боссов:1204start/play/save scenarios PASS.
- Actions39257300580:SUCCESS;1344PASS/0FAIL/2private-source skips в CI.
- Все43Chromium suites PASS, включая desktop/touch/reload/double-action7б.
- Во время CI исправлены3устаревших browser expectations: Judgement/Vampire
  уже поддерживаются; victory acknowledgement теперь добавляется в replay journal.
  Эти изменения затрагивают только тесты. Предыдущие failed runs39255990918/39256564289
  не выдаются за успешные. Финальный успешный run проверяет актуальную версию.
- Fresh Gradle clean/assembleDebug без build cache:PASS.
- APK signature v2 и16KB zip alignment:PASS.
-69offlineasset files равны локально подготовленным побайтно; ZIP CRC PASS.
- Выборочная визуальная QA4снимков desktop/mobile7б:PASS.

## Сборка

Pierrot-0.4.39-preview.apk / versionCode52
Artifact12189601454, run39257300580.
SHA256:8a712dad7716cce62606d0e6e6a247824f16f74d9ce9629b8187a7fe4c55090a.
Debug certificate отличается от0.4.38: установка поверх неё невозможна.
Удаление прежнего приложения удаляет локальные сохранения.

## Границы

Native fixtures — callback/contract harness, не полная симуляция исходной игры.
Они не доказывают всю constructor/raw RNG и frame/event chronology.
Полный перебор цепочек150джокеров, физический Android и установка не проверены.
№8 не начат. Статусы полной игры/разблокировок не повышены этим этапом.
