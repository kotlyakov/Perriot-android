# Независимое flame root review 0.4.3

Продуктовый код QA не менялся. Проверены только flame/score-box join, малое и большое пламя и reduced motion.

## Реальная проверка

Самостоятельно выполнен `node --input-type=module` сценарий с настоящим Chromium (`/workspace/scratch/669d7c37bc9d/toolchains/browser/chrome-linux/headless_shell`) и preview server на PORT=0 в одном execution namespace. Viewport 1536×688; отдельные contexts `reducedMotion:reduce` и `no-preference`. Вызван настоящий `showFlame()` для 344/300 и 390035690/300, затем прочитан canvas row y=62 и сохранены composited browser screenshots. Команда завершилась exit 0; это сбор evidence, не assertion всей приёмки.

Открыты screenshots `artifacts/flame043-qa-small-reduced.png`, `flame043-qa-large-reduced.png`, animated варианты, а также root `hud-fire-small-preview.png` и `hud-fire-large-preview.png`. Отдельно просмотрен увеличенный crop `flame043-qa-small-root-crop.png`. Pixel samples PNG прочитаны Pillow; независимая проверка использует и canvas, и финальный compositor output.

CSS backgrounds подтверждены browser computed style: blue `rgb(3,159,234)`, red `rgb(242,75,61)`. Flame heights: 11.5007662 и 49.1826206. Основной outer fill действительно имеет эти цвета; большой участок крупных корней совпадает с коробками.

## Finding: residual bright roots

**Important / P2 — CLOSED / VERIFIED; описание первоначального RED.** `src/ui/flame.js`, `risingWisps()` и near-root hot-layer composition. Цвет outer был правильный, но короткие wisps сохраняли горячий цвет в строке непосредственно над коробками. Fade stop `.78` измеряется относительно собственной короткой высоты wisps и не обеспечивает фиксированные 10 px чистого outer root. Blur также размывал яркий материал к стыку.

**Детерминированное воспроизведение:** reduced motion, score=344n, target=300n, viewport1536×688. Canvas y=62 при полной opacity255: blue x62=[29,176,242] вместо [3,159,234]; red x162=[251,172,104] вместо [242,75,61]. В small case среди прочитанных непрозрачных root samples найдено 24 blue и 25 red samples с отличием больше двух каналовых уровней.

**Composited PNG:** red pixel (318,361)=[250,171,104], затем (318,362)=[243,80,61] и (318,363)=[242,75,61]. Blue (221,361)=[27,175,242] переходит в (221,362)=[3,159,234]. Это яркие локальные orange/cyan caps с резким окончанием у box top, видимые в crop, а не только допустимая 1-level canvas rounding. Большое пламя в основном совпадает с box, но часть wisps также оставляет локальные bright root samples.

**Влияние:** общая прежняя горизонтальная полоса убрана, но строгий запрос на отсутствие границы ещё не выполнен в местах горячих wisps, особенно при малом пламени и reduced motion.

**Предложение:** не допускать inner/hot/wisp painting в фиксированную near-root полосу, включая запас для blur, либо восстановить там чистый outer цвет внутри его реального contour. Проверить row62 и compositor y361 для малого и большого пламени; × gap сохранить прозрачным. Простое совпадение констант outer/CSS недостаточно для приёмки composited result.

## Исправление и независимый GREEN

Root добавил near-root recolouring после всех layers: `source-atop`, прозрачный outer gradient y45 → полностью непрозрачный y58; fillRect внутри clipped bed. Он перекрашивает только существующие flame pixels, сохраняет их alpha/силуэт и не создаёт прямоугольную платформу в прозрачной области.

Самостоятельно повторён настоящий Chromium сценарий для всех четырёх сочетаний small/large × reduced/animated, теперь с assertions: все sampled opaque y62 root pixels должны совпасть с RGB своего box (допуск до двух уровней для canvas rounding), × gap alpha должен быть 0. **Exit 0; фактически все opaque samples совпали точно, даже без допуска.**

Минимальная воспроизводимая проверка сохранена в `tests/ui/flame-root043-check.mjs` и самостоятельно запущена через штатный runner:

```bash
CHROMIUM_PATH=/workspace/scratch/669d7c37bc9d/toolchains/browser/chrome-linux/headless_shell UI_CHECK_SCRIPT=tests/ui/flame-root043-check.mjs node scripts/check-ui.mjs
```

Результат: **exit 0**, `Flame 0.4.3 root checks passed`; все четыре cases GREEN. Дополнительно test проверяет computed CSS colors, nonempty opaque samples, высоту <=62 и прозрачность × gap по всему canvas, не только по root row.

| Режим | Blue exact root samples | Red exact root samples | Mixed samples | × gap alpha sum |
| --- | ---: | ---: | ---: | ---: |
| Small, reduced | 73 | 74 | 0 | 0 |
| Large, reduced | 95 | 85 | 0 | 0 |
| Small, animated | 67 | 52 | 0 | 0 |
| Large, animated | 94 | 96 | 0 | 0 |

Animated counts зависят от формы текущего кадра; проверяются цвета всех непрозрачных samples, а не фиксированное количество.

Composited small/large PNG после fix: blue (220,361),(221,361) точно [3,159,234], red (318,361),(319,361),(320,361) точно [242,75,61]. В отдельных pixels y362 остаётся только ±1 rasterization rounding; яркого orange/cyan скачка нет. Обновлённые small crop и large reduced screenshot открыты визуально: прежние горячие caps у границы отсутствуют, корни сливаются с цветами boxes. **RED→GREEN подтверждён; открытых findings в этом targeted scope нет.**

## Границы

Это Chromium screenshot/pixel review, не установленный Android APK/WebView и не устройство. Исследуется соединение цветов текущего canvas с текущими CSS boxes; full pixel parity оригинальной игры не заявляется.
