# Независимое review mobile scaling 0.3.2, 07.10.2026

Проверены текущие изменения нового проекта: `src/ui/layout.js`, root sizing в `web/styles.css`, подключение mobile check script и переименование в «Пьеро». Продуктовый код не изменён. Старый проект 0.18 не использовался.

## Runtime evidence

Независимо выполнено из корня проекта:

```bash
CHROMIUM_PATH=/workspace/scratch/669d7c37bc9d/toolchains/browser/chrome-linux/headless_shell UI_CHECK_SCRIPT=tests/ui/mobile-layout-check.mjs node scripts/check-ui.mjs
```

Команда завершилась **exit 0**, `Mobile layout checks passed`. Настоящий Chromium headless запускался с `isMobile:true`, `hasTouch:true` и соответствующим DPR. Проверены семь viewport/DPR и перестановка width/height каждого из них:

| Viewport CSS px | DPR | Реальный stage width × height CSS px | stage x / y |
| --- | ---: | --- | --- |
| 915×412 | 3.5 | 915×409.84375 | 0 / 1.078125 |
| 568×320 | 2 | 568×254.416656 | 0 / 32.78125 |
| 360×800 | 3 | 360×161.25 | 0 / 319.375 |
| 1280×720 | 1 | 1280×573.333313 | 0 / 73.328125 |
| 1024×600 | 2 | 1024×458.666687 | 0 / 70.65625 |
| 412×915 | 3.5 | 412×184.541626 | 0 / 365.21875 |
| 2400×1080 | 1 | 2400×1075 | 0 / 2.5 |

Во всех исходных случаях inner/client/visual dimensions соответствовали заданному viewport; stage не выходил за его границы. После swap проверены fit и одинаковый коэффициент масштаба по обеим осям. Реальные touch tap и sort сохраняли один выбранный ID.

Дополнительно выполнен независимый `node --input-type=module` сценарий: поднят настоящий preview server на PORT=0, создан Chromium mobile context для 915×412/DPR3.5, 360×800/DPR3, 568×320/DPR2. Для исходного размера и его swap проверены центрирование (`2*x+width`, `2*y+height` с погрешностью 0.1 CSS px), отношение сторон 1536/688 и полное попадание play/discard/sort/deck/options/run_info в viewport. Во всех шести состояниях assertions прошли. После swap реальные touch tap → discard и tap → play уменьшили соответствующие счётчики ровно на один; открытие Options работало. Pageerror отсутствовали во всех трёх context. Сценарий завершился **exit 0**, `Independent mobile centering/aspect/action taps/rename passed`.

## Review результата

Новых findings в проверенном масштабе и rename нет. `resize()` теперь использует root `clientWidth/clientHeight`, независимые от переполнения unscaled stage; CSS задаёт html/body 100% размер и скрывает overflow. Uniform min-scale сохраняет пропорции, а положительные отступы центрируют letterbox. Root ResizeObserver и window/visualViewport resize обновляют расчёт после изменения viewport; initial resize выполняется до первого render руки. Это устраняет воспроизведённый mobile overflow feedback при 915×412/DPR3.5: текущая независимая проверка получила stage 915 px вместо 1536 px.

Rename подтверждён runtime: document title — `Пьеро — игровой прототип`, Options содержит `Пьеро · прототип 0.3.2`. Статически Android manifest label, подготовленные Android assets index/app и portable HTML также содержат «Пьеро». Package identity сохранён; название не меняет формат сохранений.

## Границы доказательства

Проверка выполнена в desktop Chromium mobile emulation, не на Android устройстве и не внутри установленного APK/WebView. Физические вырезы, системные панели и конкретный пользовательский телефон не проверены. В портретных размерах letterbox делает поле небольшим, но сохраняет fit/aspect; целевая ориентация приложения landscape. Full parity и полный игровой цикл не заявляются. APK build/install результат относится к отдельной Android проверке.
