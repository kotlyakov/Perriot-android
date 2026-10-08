# Независимое × alignment review 0.4.4

Продуктовый код QA не менялся. Самостоятельно выполнен одноразовый `node --input-type=module` browser сценарий: настоящий Chromium headless, preview server на PORT=0, viewport 1536×688, 915×412, 568×320 и portrait 412×915. Fonts ready ожидались до измерений. Команда завершилась **exit 0**.

Во всех четырёх размерах проверено:

- `(times.left+times.right)/2 == (chips.right+mult.left)/2`;
- times vertical center совпадает с центрами обоих score boxes;
- измеренные dx=0, dy=0 CSS px.

На 1536×688 target center=(291.5,390.5); × rectangle=[275,362,33,57]. Grid centering сохраняет этот прямоугольник после финального `padding-bottom:3px`, которым root исправил оптическое смещение Rubik glyph по вертикали.

Просмотрены настоящий `artifacts/times044-qa.png` и увеличенный HUD crop. Дополнительно Pillow измерил red glyph ink: inclusive raster bounds=(281,379,303,401), pixel-index center=(292,390). Отклонение до 0.5 px от математического центра относится к threshold/antialias rounding; заметного смещения в crop нет. До padding коррекции glyph был примерно на 1.5–2 px ниже. Финальная версия проходит geometric и visual проверку.

Открытых findings нет. Новый постоянный тест не добавлялся для этой малой правки. Android устройство/WebView и full parity этим review не проверены.
