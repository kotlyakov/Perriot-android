# Независимое card visual review 0.3.3, 07.10.2026

QA владел только `tests/ui/card-visual-check.mjs` и этим отчётом. Продуктовый код не изменён проверяющим. Проверены vector pip/corner/face artwork, карточки при блокировке, deck count, pixel font и play animation нового проекта.

## Реальные проверки

Создан и выполнен настоящий Chromium regression:

```bash
CHROMIUM_PATH=/workspace/scratch/669d7c37bc9d/toolchains/browser/chrome-linux/headless_shell UI_CHECK_SCRIPT=tests/ui/card-visual-check.mjs node scripts/check-ui.mjs
```

Финальный запуск: **exit 0**, `Card visual checks passed`. Browser contexts: 1536×688/DPR1 и mobile 915×412/DPR3.5 (`isMobile`, `hasTouch`). В каждом проверены все **52 rank/suit сочетания**, реальная геометрия SVG/viewBox, число pips для 2–10 и Ace, два corner SVG и face artwork для J/Q/K. SVG/art bounds проходят, число знаков соответствует rank. Обе конфигурации также проверили:

- Tiny5 FontFace действительно loaded; CSS UI использует `Pierrot Pixel`, включая кириллический текст. В отдельном offline context font загружается из экспортированного portable HTML без сети.
- Deck counter находится на **5 logical px ниже нижнего края 12 px shadow**, а не поверх колоды; одинаковая величина после mobile scaling.
- Пять reverse-selected карт реально летят в отдельную центральную строку, logical top=232 и center x=885. Во время flight измерено видимое изменение y более 5 CSS px.
- Запись нового state существует до завершения flight/scoring; два синхронных play activation уменьшают руки и revision ровно на один.
- Во время busy оставшаяся рука disabled, но её paper background `rgb(240,229,200)`, filter=none, opacity=1. Тот же внешний вид отдельно подтверждён для disabled финальной game_over руки.
- После animation все clones удалены; оставшаяся рука снова доступна. Stage целиком внутри desktop/mobile viewport; pageerror отсутствовали.
- Центральный визуальный порядок совпадает с порядком ядра и persisted discardPile, даже при обратном порядке касаний.

Дополнительная проверка локального TTF через FontTools `getBestCmap()` подтвердила наличие всех кириллических символов строки `Пьеро Достоинство Масть Играть руку Сброс Параметры`, а не только успешную загрузку font-file. Native `.ttf -> font/ttf` MIME entry также прочитан статически.

## Найденный и исправленный дефект

**Important / P2, CLOSED / VERIFIED:** первоначальный `src/ui/app.js:34` передавал `preparePlayedCards(ids)`, то есть порядок касаний Set, тогда как scoring/discard использует порядок `state.hand`.

**Реальный RED:** выбрать indices [4,3,2,1,0], затем play. Центральная строка показывала [7♣,7♥,8♠,10♠,J♣], а ядро/сохранённый discardPile — [J♣,10♠,8♠,7♥,7♣]. Regression завершился exit 1 с `Played visual order differs from scoring hand order`. Вычисленные очки не повреждались, но видимый порядок не соответствовал реально исполняемой руке.

**Исправление root:** `preparePlayedCards(state.hand.filter(id=>ids.includes(id)))` до замены state. После исправления тот же regression самостоятельно выполнен для desktop и mobile: обе центральные строки совпадают с ожидаемым hand order; финальный запуск полностью GREEN. Новых findings в проверенных сценариях нет.

## Визуальный просмотр и ограничения

Реальный screenshot `artifacts/played-preview.png` (1536×688) сохранён во время score, когда центральные clones уже прилетели. Проверяющий открыл изображение: пять карт расположены в центральной строке без клиппинга, нижняя рука остаётся кремовой, vector corner/pips видны, deck counter отделён от нижней тени. UI использует пиксельный кириллический шрифт.

Это реальная browser проверка и screenshot preview, не проверка установленного Android APK/WebView или конкретного устройства. Все 52 artwork bounds проверялись через настоящий SVG layout, но не как pixel parity к оригинальным рисункам. Full-game/catalog parity и полное соответствие референсу не заявляются. Core suite и Android build проверяются root/Android исполнителем отдельно; здесь их результат не приписывается QA.
