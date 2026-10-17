# Независимая проверка cashout 0.4.5

Дата: 07.10.2026. Роль QA по AGENTS.md §3. Проверены `src/core/cashout.js`, ветка CASH_OUT в `src/core/run.js`, codec/repository/backend сохранений, `src/ui/post-round.js`, интеграция в `app.js`, cashout CSS и контракт `docs/rules/cashout.md`. Production-файлы проверяющий не изменял.

Область: первая обычная выплата Small Blind для Red/Blue и сохранённый вход в явно промежуточный экран магазина. Каталог, предложения, покупки, reroll, следующий blind и финансовые модификаторы здесь не заявляются.

## Результат

Открытых P0/P1/P2 в проверенном срезе не найдено. Собственный браузерный прогон завершился с `review045 observations: []`; `npm test` — 100/100.

По раннему чтению кода найден P2: pending cashout показывал остаток draw pile вместо полного deck52/52, указанного в целевом референсе и cashout.md. Lead исправил через `roundDeckView` — проекцию только для UI. После исправления независимо подтверждены deck52/52 и 52 доступных карт в deck dialog. Сохранение по-прежнему содержит настоящие partitions (44 draw, 3 held, 5 discard после выбранной победной руки), не меняется от открытия deck dialog и не расходует RNG. CASH_OUT собирает карты уже в committed shop state. Finding закрыт.

## Независимые сценарии

`tests/ui/cashout-review045-check.mjs` загружает только исходное состояние `playing`, а затем выбирает карты и нажимает настоящую кнопку PLAY_HAND. Готовый `round_won` fixture для проверки победного перехода не используется.

| Сценарий | Проверенный результат |
|---|---|
| Реальный Royal Flush 10/J/Q/K/A hearts | PLAY_HAND даёт score1208, списывает одну руку, revision1→2, сохраняет round_won до завершения анимации |
| Баланс24, после победы 3 unused hands | Quote3+3+4=10; wallet остаётся24 до кнопки; interest берётся от24, а не после reward |
| Анимация победы | Cashout появляется после завершения score/flight; transient played/dealing/pop удалены; score1208 сохранён, Chips×Mult=0×0 |
| Перезагрузка во время победной анимации | Возвращает unpaid pending cashout; wallet24, payout10; ранней выплаты нет |
| Перезагрузка pending | Полностью сохраняет state и ожидающую выплату |
| Тройное немедленное нажатие cashout | Только одна выплата: shop, wallet34, revision2→3; карты/jokers/RNG не переписаны ради анимации |
| Перезагрузка shop | Shop остаётся сохранённым, wallet34, cashout отсутствует, повторной выплаты нет |
| Ошибка записи backup / current, отдельно | Старое round_won сохранение и wallet24 остаются; shop не открывается; ошибка показана; после восстановления записи повтор платит ровно один раз |
| Новый забег из pending и из shop | Post-round панель удаляется, игровая рука/управление возвращаются, wallet4 |
| Pending deck dialog | Все52 карты доступны в проекции; открытие/закрытие не меняет сохранение |
| Layout1536×688, 915×412, 568×320, 360×800 | Settled панели pending и shop находятся в viewport; игровые hand/play/blind title скрыты на pending |
| Reduced motion568×320 и360×800 | Post-round WAAPI animation отсутствует; win/cashout/reload/error/retry работают |

Во всех четырёх основных browser случаях массив pageerror пуст. Панель shop явно содержит текст о промежуточной сборке и ещё не реализованных покупках/reroll/следующем blind. Core suite отдельно проверяет debt/interest cap/huge BigInt, Blue unused hands, stale/repeated action, отказ некорректного shop save и прежние version1 saves.

## Воспроизведение

```sh
npm test
CHROMIUM_PATH=/workspace/scratch/669d7c37bc9d/toolchains/browser/chrome-linux/headless_shell UI_CHECK_SCRIPT=tests/ui/cashout-review045-check.mjs node scripts/check-ui.mjs
```

Тест ожидает `PREVIEW_URL` от штатного supervisor `scripts/check-ui.mjs`; optional `QA_SCREENSHOT` задаёт путь transient PNG. PNG1536×688 реально просмотрен: pending payout10/wallet24, очищенный blind/hand, нулевые Chips×Mult, строки reward/hands/interest и deck52/52 без перекрытий.

Это browser/source QA первого cashout среза. Физический Android WebView/AtomicFile runtime и динамическая pixel parity с оригиналом этим прогоном не проверены.
