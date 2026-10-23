# №7а —43 эффекта джокеров

18.10.2026. Выполняется только первая половина №7. Контракт оставшихся86 описан в `docs/apk-findings/item7-joker-contracts.md`, но включённый список задаёт `ITEM7_JOKERS` в `src/content/jokers.js`:43 новых,107 всего. Вторые43, Judgement, профиль/unlocks, №8 и физический Android в этот выпуск не входят. Оставшиеся helpers и source-derived unit contracts не означают доступность второй половины.

## Проверено локально

-1190 тестов:1184PASS,0FAIL,6 пропусков — транзакции второй половины (Wee,Lucky Cat,Midas/Vampire,3 Judgement). Приватный native cashout oracle выполнен с pinned LuaJIT.
-2000 независимых original-function fixtures воспроизведены; JSON побайтно равен после распаковки. Это проверка изолированных контрактов, не полная событийная RNG parity.
-43×28 боссов: старт, сохранение, розыгрыш, повторное сохранение.
-56 save cases:43 новых эффектов, рост, debuff, счётчики, payout, BigInt, подмена истории.
-RED→GREEN: Turtle replay, Chaos новый магазин, Heart размер руки, Needle+Burglar, Arm+Space.
-Android offline asset preparation, XML/security config и git diff-check PASS.

## Итоговая проверка и сборка

-CI39111229954 SUCCESS:1183PASS,0FAIL,7skip(6тестов7б+приватный native-source oracle).
-Все42Chromium suites PASS, включая новый mouse/touch Hiker/Green/Rocket, двойной PLAY и reload. Новые снимки1536×688 и915×412 визуально просмотрены.
-Fresh Gradle compile, apksigner verify и zipalign PASS.
-APK0.4.38-preview/code51, artifact12130907863, SHA256 `0d4348c1624b2496ec95227ad49a0bb5f2e5e5590a05003ca7cca5d956f9c595`.
-CRC и69offlineassets побайтно равны локальному проверенному дереву.
-Source `0f5d3474d7524d7602b9b1c6caf63acf358a837f`, tested synthetic merge `64c122855ee9e770c3e0069ab70cebe663806b98`, actual merge `deff0b24519e2798ce4c47cdf0086c7604fcb6a9` сравнились без файловых различий. PR34 слит в apk-reference.
-Debug-подпись `3f914b0a57aaf7df9d00c77276782d2d6c7b96ee6f9439c070ab0fe14c706239` отличается от0.4.37; поверх прежнего APK не устанавливается, удаление прежнего приложения удаляет локальный прогресс.
-Физическая установка не проверена.

Исходники, тесты и эти документы находятся в репозитории. Пользователю передан APK; №7б не включён.

## Решения

-Выбраны43 эффекта с общими денежными/пассивными/накопительными зависимостями; полный список хранится в коде и проверяется тестом scope.
-Не изменена принятая геометрия и управление.
-Расширенные счётчики имеют конечный предел10000, чтобы сохранить полученные бонусы после продажи источника; игровые розыгрыши дополнительно проверяются полным authenticated action replay.
-Отключение Serpent/Needle/Water с пассивами связано с недоступными Luchador/Chicot и требует приёмки во второй половине.

## Известные ограничения

-Полная игра ещё не закончена;107/150 эффектов.
-Нет проверки установки/работы на физическом Android.
-Профиль, discovery/unlocks и полная frame/event RNG parity остаются отдельными этапами.
