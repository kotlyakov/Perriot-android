# Независимый browser runtime review, 07.10.2026

База этапа: `e56a881`, текущие незакоммиченные изменения нового проекта. Проверены изменения `src/ui/field.js`, preview server и orchestration script; продуктовый код не менялся. Старый проект 0.18 не использовался.

## Выполненные проверки

Независимо запущено из корня проекта:

```bash
CHROMIUM_PATH=/workspace/scratch/669d7c37bc9d/toolchains/browser/chrome-linux/headless_shell node scripts/check-ui.mjs
node --test tests/core/*.test.js
```

Первая команда завершилась exit 0 и сообщением `Browser checks passed`. Использовался настоящий Chromium headless, а не DOM mock. Script экспортировал portable HTML, поднял loopback server с динамическим портом и запустил браузер в том же execution network namespace. Вторая команда: **86 tests, 86 pass, 0 fail**.

Browser assertions подтвердили:

- Выбор максимум пяти карт, сохранение выбранных ID при сортировке, реальные play/discard counters.
- Touch tap выбирает один раз; второй tap отменяет выбор. Два последовательных Space activation сохраняют keyboard focus через повторный render и переключают выбор.
- Mouse drag меняет реальный порядок сохранённой руки, увеличивает revision один раз, не расходует ход; reload возвращает тот же порядок.
- Два синхронных play activation во время busy расходуют одну руку и один revision.
- Reload восстанавливает счёт/счётчики; повреждённый current предлагает backup; оба повреждённых слота сохраняются без автосоздания забега.
- Искусственная Storage quota error оставляет прежнюю запись и отображённые счёт/число рук; появляется сообщение ошибки.
- На 568×320, 915×412 и 1280×720 проверенные нижние кнопки/колода остаются внутри viewport. На 1536×688 крайние видимые x-bounds веера укладываются в ручную оценку референса ±5 px.
- Экспортированный HTML работает с browser context offline, сохраняет ход и продолжает его после reload.

Просмотрен реально полученный `artifacts/field-preview.png` (1536×688). Нижняя презентационная полоса отсутствует; sort находится между play/discard; HUD, веер и колода видны. Снимок сделан на fixture с референсными показателями, не является доказательством полного совпадения оригинальной игры. Browser test не нашёл pageerror в основном и portable contexts; touch context проверяется functional assertions.

## Finding

### Low / P3 — обход preview allowlist внутри корня проекта

**Статус: CLOSED / VERIFIED** после исправления canonical allowlist. Описание и таблица ниже фиксируют первоначальное воспроизведение.

**Место:** `scripts/preview.mjs:10–12`.

Prefix `/src/` или `/web/` проверяется до filesystem normalization. После `resolve()` проверяется только корень проекта. Encoded slash позволяет путь, начинающийся с разрешённого prefix, после normalization направить в другие каталоги проекта.

**Независимый runtime repro:** поднят тот же `scripts/preview.mjs` на PORT=0; HTTP requests отправлены через `node:http.get({path})` без дополнительной клиентской нормализации.

| Request path | Получено |
| --- | --- |
| `/` | 200, text/html |
| `/src/ui/field.js` | 200, text/javascript |
| `/web/styles.css` | 200, text/css |
| `/AGENTS.md` | 404 |
| `/src/..%2fAGENTS.md` | 200, полный AGENTS.md |
| `/web/..%2fdocs/design.md` | 200, полный design.md |
| `/src/..%2f..%2fAGENTS.md` | 404 |
| `/src/%ZZ` | 404 |

**Влияние:** allowlist исходников/assets обходится, из preview можно прочитать другие файлы репозитория. За пределы корня проекта выйти не удалось; server слушает только 127.0.0.1. APK/native origin routing этим finding не затронуты. Серьёзность ограниченная, но проверка prefix должна соответствовать реальному canonical path.

**Исправление:** после resolve проверять, что file находится строго в canonical `root/src/` или `root/web/` (с separator boundary), либо отвергать dot-segments до resolve. Корень `/` уже отдельно направляется в web/index.html. Проверить encoded slash, encoded dot-segments и malformed encoding.

**Независимая повторная проверка:** прочитано изменение server: resolved file теперь сравнивается с `resolve(root,dir)+sep` для web/src. `node --test tests/core/preview.test.js` выполнен самостоятельно: 1/1 pass. Дополнительно повторены прямые `node:http.get({path})` requests к заново поднятому PORT=0 server: `/src/..%2fAGENTS.md` и `/web/..%2fdocs/design.md` теперь 404; `/AGENTS.md`, выход за корень и malformed `%ZZ` также 404. `/`, настоящий module и stylesheet по-прежнему 200. Нормализованные пути, остающиеся внутри разрешённых web/src, продолжают работать. Finding закрыт; новых findings в этом ограниченном повторном review нет. UI и APK assets этим изменением не затронуты, browser suite повторно не запускался.

## Границы приёмки

Chromium runtime blocker предыдущего review теперь снят для этого окружения. Это browser preview acceptance выбранных сценариев, не установка APK на устройство и не Android touch/lifecycle/filesystem acceptance. Native build выполняется отдельно. Размеры/геометрия остаются ручной промежуточной реконструкцией; полный parity, каталог и весь игровой цикл не заявляются завершёнными.
