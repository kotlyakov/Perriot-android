# Emperor / High Priestess — 13.10.2026

Эталон: загруженный Balatro 1.0.1n APK, assets/card.lua:1402–1415,1552–1554; assets/functions/button_callbacks.lua G.FUNCS.use_card; assets/functions/common_events.lua create_card/get_current_pool. Оригинальные assets не включены в продукт.

Обе принадлежащие карты применяются без целей. Создаются до двух обычных расходников: Emperor → Tarot, High Priestess → Planet. Ключи пулов Tarotemp<ante> / Planetpri<ante>, native resampling, Showman/duplicates, bans/softlocks и fallback используют существующий проверенный APK session. Soul/Black Hole не выпадают, поскольку soulable не передаётся. Каждый результат занимает область до выбора следующего, препятствуя повторению без Showman. Действующий creator остаётся used_jokers до растворения, поэтому исходная context identity не удаляется при выборе пула.

На карту: выбор через pseudoseed/math.random, три constructor math draws, start_materialize juice и used_tarot juice. Материализация использует Card:juice_up, который в APK расходует math.random и при reduced_motion. Pricing учитывает скидки/inflation/Astronomer через общий код. Profile discovery и прочие native lifecycle/sound RNG остаются общим открытым этапом.

Карта убирается из owned area до создания, но её Negative слот исчезает позднее при Card:remove/remove_from_deck. Negative Emperor/High Priestess/Fool поэтому законно оставляют одну карту сверх окончательной вместимости. Сохранения больше не используют вместимость как условие допустимости инвентаря: сохраняется структурная проверка, уникальность, типы и защитный предел 10000 карт. Новая покупка по-прежнему проверяет реальную вместимость; продажа/использование доступны для выхода из переполнения. Это исправление точности, не изменение баланса.

Legacy run без APK context явно блокирует генерацию при наличии места, вместо подмены алгоритма. Debuff и отсутствие места расходуют карту/usage без создания и RNG. Коллизии детерминированных ID отклоняются до мутации.

Проверки: tests/core/generated-tarots.test.js, исправленная negative регрессия tests/core/fool-tarot.test.js и tests/ui/generated-tarots-check.mjs. 415 core PASS; независимый QA выявил Negative-slot дефект, исправленный RED→GREEN. Браузер и Android подтверждаются только результатом Actions.

Новые ID основаны на монотонной revision, а не рекурсивном source ID: цепочки созданий не превышают лимит сохранения 120 символов. Коллизии проверяются также с предложениями магазина. Длинный source ID покрыт RED→GREEN регрессией.
