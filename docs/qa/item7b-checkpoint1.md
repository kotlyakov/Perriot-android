# №7б — checkpoint1,19.10.2026

Маленький этап: «Суд», сохранения расходников, исправление выявленных boss save regressions. Незавершённые заготовки43 новых эффектов сохранены вместе с исправлениями; полного завершения каталога этот checkpoint не заявляет.

## Изменения и доказательства

- activeCentreIds теперь принимает поддерживаемые категории реально активных карт; неизвестная identity по-прежнему отклоняется. Тест Judgement+Empress сначала упал на decodeApkShop:59, затем прошёл с сохранением/продолжением.
- Независимый review Judgement сверил локальный private reference: card.lua1416–1427/1559–1565, common_events.lua create_card/get_current_pool.100 фиксированных семян имеют равные исходы после загрузки; создание сохраняется, повтор не проходит, полный слот атомарно отказывает, Negative даёт слот, debuff не тратит RNG.
- disableBoss использует принятую revision вызывающей транзакции. Serpent origin фиксируется после initial shuffle/deal, включая последующие Burglar callbacks.14 boss save tests покрывают Water/Needle/Serpent, порядок Chicot/Burglar, пассивы, подмену origin.
- Leaf матрица150 теперь сохраняет реальный sale hook Diet Cola: Double tag+2 Math draws; остальные потоки не меняются. Это исправление ожидания теста по native source, не игрового эффекта.

## Выполненные команды

- npm test:1229total,1225PASS,0FAIL,4skip.3 skip — ещё отложенные Wee/Lucky Cat/Midas+Vampire;1 skip — private-source native oracle без env. Эти4 теста не выдаются за выполненные.
- node --test tests/core/showdown-leaf-vessel.test.js tests/core/item7b-scope.test.js tests/core/item7b-judgement.test.js tests/core/item7b-boss-disable.test.js:56PASS,0FAIL на первом объединённом срезе; затем добавлен ещё1 boss integrity test, вошедший в полный npm test.
- node scripts/prepare-android.mjs:PASS (подготовка ресурсов, не Gradle build).
- git diff --check:PASS.

## Остаток и ограничения

150 identity включены в рабочей ветке; это не доказательство полноты43 новых эффектов. Остались3 scoring-регрессии, source-derived fixtures и полный review. Serpent с пустой исходной колодой и Certificate требует отдельных проверок. Browser QA, Android build/signature, физическое устройство и полная frame/event RNG parity не проверены этим этапом. Нового APK/слияния нет; последняя выпущенная0.4.38 не менялась. №8 не начат.
