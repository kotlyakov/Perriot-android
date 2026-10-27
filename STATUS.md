# Пьеро — кандидат 0.4.57/code70

27.10.2026. Репозиторий kotlyakov/Perriot-android, ветка fix/enhancement-visuals. Последний выданный APK0.4.56/code69 остаётся доступен по прежней ссылке;0.4.57сейчас проходит заключительные проверки. PR50не слит, слияние не выполнялось.

Пользователь подтвердил расположение У-57 и целое слово «Применить», затем поручил автономно закончить текущий пакет бэклога. Новых согласований для этого пакета не требуется.

## Сделано в кандидате

У-55/60: shorttap без подсказки, hold350мс; pack selection не пересоздаёт hand/pack/owned; materials раз за кадр; no-op resize; flame останавливается в фоне. У-56: просторнее новая партия, исправлены Continue stake/seed. У-57: утверждённые buy/sell/use зоны, drag pack и атомарная покупка с применением, без кнопок под картами. У-51а/б: изображения билетов/наград из коллекции. У-58:32описания наборов. У-40а: Wheel tooltip без пустого хвоста. У-59: исправлен replay whitelist blindId, полный инвентарь не блокирует pack, конкретные короткие notices, продажа/повтор/skip. У-61: цветные use/open эффекты. У-62: без рамок, насыщенная бумага.

Подробности и измерения: docs/qa/2026-10-27-feedback-057.md. Геометрия расположения утверждена ранее; реализация проверена drag/touch на1536/915/568.

## Проверки и следующий шаг

Локальное ядро1870PASS/0FAIL/2optional skips. RED→GREEN для replay SKIP_BLINDblindId и покупки с применением. Независимое ревью без Critical/Important; найденное замечание pointerup исправлено. Новые action-zones, pack-selection-performance, setup-spacing-performance, enhancement-visual-feedback проходят; полный browser прогон выполняется. Android assets и XML/security PASS; fresh native compilation и итоговыйCI ещё ожидаются. APK0.4.57до их завершения не выдавать.

Следующий шаг: завершить browser/CI, fresh Android/signature/alignment, сравнить assetsAPK с tested source, сохранить APK и обновить здесь точные коммит/CI/хеш. Затем короткий итог пользователю. Физический Android/FPS, субъективная плавность и полная native frame/event RNG parity не объявлены проверенными.

## Прежняя выданная версия

[Pierrot-0.4.56-preview.apk](https://chatgpt.com/library?file_id=libfile_43355656cd3c8191bf86e9e4590f24fd&account_id=personal),1426789байт, SHA256df82e39d9258601a0676a63f6ba0d81bf93eca52c74895e7d4cffa81fc61b58f. Sourcefaf2befc, tested merge9e84c5ae, CI40360431210SUCCESS. Debug-сертификат9c6345e7cdb41651f0c13eeb3f399ad158b8ec73f52e29d3878d438ba8ac9df0; стабильная подпись для обновления поверх него не подтверждена. Не рекомендовать удаление приложения с прогрессом.
