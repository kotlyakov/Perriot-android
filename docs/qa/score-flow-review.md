# Независимое score flow review 0.3.4, 07.10.2026

QA владел только `tests/ui/score-flow-check.mjs` и этим отчётом. Продуктовый код проверяющим не менялся. Проверены новые discard/draw, score pops, bounded flame, persistent sorting, centered artwork и illustrated deck нового проекта.

## Выполненная проверка

Создан и самостоятельно выполнен настоящий browser regression:

```bash
CHROMIUM_PATH=/workspace/scratch/669d7c37bc9d/toolchains/browser/chrome-linux/headless_shell UI_CHECK_SCRIPT=tests/ui/score-flow-check.mjs node scripts/check-ui.mjs
```

Финальный запуск: **exit 0**, `Score flow checks passed`. Chromium contexts: desktop 1536×688 и mobile emulation 915×412/DPR3.5, с реальными touch taps во втором случае. Runner экспортировал portable preview, поднял server и browser в одном execution network namespace.

Подтверждены следующие сценарии в обоих contexts:

- Выбор карты → sort Suit / Rank сохраняет выбранный ID. Sort mode хранится в реальном save. Два discard activation расходуют один discard/revision, не расходуют hand. После draw весь hand отсортирован независимо вычисленным comparator; reload сохраняет mode и порядок.
- Discard clone реально движется за верхнюю правую границу с opacity 1→0; новые карты до своей очереди hidden/dealing, затем имеют draw animation и появляются в руке. После завершения clones/dealing отсутствуют и input снова доступен. Save нового состояния существует уже во время исходящей анимации.
- Artwork всех восьми fixture cards, включая face card, горизонтально центрирован: отличие SVG/card center менее 0.6 CSS px на desktop и mobile.
- Реальная flush 2♥,4♥,6♥,8♥,10♥ даёт пять blue pops `+2,+4,+6,+8,+10` в правильном source order. Blue = `rgb(9,174,255)`. Порядок сопоставлен с настоящей persisted score trace. Повторный play во время busy расходует один hand/revision; финальный round score совпадает с save.
- HUD chips/mult наблюдались MutationObserver во время trace: все значения — целочисленные строки, без дробей или object labels. После score cleanup отсутствуют pops/clones/dealing.
- Illustrated deck имеет ровно реальные ID fixture: удалены две карты, показано **50** изображений, отсутствующие не дорисованы. Available count совпадает с drawPile; summary после двух discard показывает 40/50, hand 8, discard 2. SVG и реальные размеры присутствуют у всех карточек.
- Rendering-only synthetic `multiply_mult` 3→6 показывает `×2`, red=`rgb(255,85,73)`, bold 700. Fixture вызывает только UI helper; новый XMult effect в ядро не добавлен и полнота будущих эффектов этим не подтверждается.
- Flame height для score [0,300,301,3000,10^500] при target 300: [0,0,10.0125224,17.4285714,61.3803658]. Рост монотонен после threshold, все значения в [0,62]. Canvas внутри calculation panel; digits HUD остаются верхним hit-test элементом и используют `Pierrot Numbers`, пламя их не перекрывает.
- Pageerror отсутствуют в обоих contexts.

## Найденный и исправленный дефект

**Important / P2, CLOSED / VERIFIED — невидимый discard flight.** Первоначально `src/ui/play-animation.js:11` задавал from только left/top/transform. Затем target назначал underlying inline opacity=0. Неуказанная from opacity в WebAnimations также становилась 0: карточка имела активную motion animation, но оставалась полностью прозрачной.

Первый полный сценарий проверял motion/cleanup и проходил; независимый статический review обнаружил отсутствие opacity keyframe. Усиленный runtime assertion проверил видимость и дал **RED**, exit 1: `Discard flight is completely invisible`. Root добавил явный `opacity:1` в from. Повторный полный regression с этим assertion проходит desktop/mobile **GREEN**.

Чтобы измерять именно кадр движения, а не случайный почти прозрачный конец 280 ms flight после transport delay, regression теперь останавливает настоящую browser animation на 30 ms в той же JS turn после activation, проверяет computed opacity >0.05, затем возобновляет её. Desktop screenshot отдельно замораживает её на 70 ms. При исходном дефекте opacity равен 0 при любом из этих моментов; фиксация времени не маскирует дефект.

## Визуальный просмотр и границы

Созданы и открыты `artifacts/score-flow-preview.png`, `artifacts/deck-flow-preview.png` и `artifacts/discard-flow-preview.png`. На score screenshot видны blue pops, обычный числовой font, центрированные pips и cream cards. Deck screenshot показывает реальные 50 illustrations и корректно затемняет unavailable cards. Discard screenshot показывает уходящую полупрозрачную карту у верхнего правого края; это сохранённый кадр настоящей motion animation.

Открытых findings в проверенных сценариях нет. Проверка выполнена в Chromium, включая mobile emulation, **не на установленном Android APK/WebView и не на физическом устройстве**. Core suite и Android build проверяются отдельно; их результат здесь не приписывается QA. Bounded flame и synthetic ×2 не доказывают реализацию полного каталога или будущих дробных XMult effects. Полная pixel parity не заявляется.

## Дополнение финальной интеграции Lead

После визуального просмотра fixture flame-preview обнаружено обрезание4цифр3070 с новым шрифтом. showNumbers теперь считает размер от parent scorebox (span clientWidth не является шириной бокса); >10цифр компактное integer e notation, точные BigInt в state не меняются. Усиленная flow-regression проверяет3070 и число10^500: textbbox внутри parent и только целочисленные подписи, desktop/mobileGREEN. Финальная flame-preview.png просмотрена,3070 и304 помещаются. Browser smoke теперь ожидает конец busy перед проверкой итогового roundscore; во время трассы он намеренно показывает прежний итог.
