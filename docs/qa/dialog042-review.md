# Независимое review диалогов 0.4.2

QA владел только `tests/ui/dialog-review042-check.mjs` и этим отчётом. Продуктовый код проверяющим не менялся.

## Runtime verification

Независимо выполнено в настоящем Chromium:

```bash
CHROMIUM_PATH=/workspace/scratch/669d7c37bc9d/toolchains/browser/chrome-linux/headless_shell UI_CHECK_SCRIPT=tests/ui/dialog-review042-check.mjs node scripts/check-ui.mjs
```

Финальный результат: **exit 0**, `Dialog 0.4.2 checks passed`. Проверены 1536×688, 915×412, 568×320 и portrait 412×915. Последние три context использовали mobile/touch emulation. Во всех четырёх проверены:

- Колода, Настройки, Партия и подтверждение Нового забега имеют одну 360 ms entry animation. Первый реальный animation frame начинается ниже viewport (top = height+16, с погрешностью округления).
- После завершения все dialog bounds внутри viewport, горизонтальное центрирование сохранено, ширина/высота не меняются во время входа. Individual translate не повреждает существующий deck scale/transform и не оставляет конечный offset.
- Замена уже открытых Настроек Колодой оставляет одну свежую animation.
- `window.cardGameBack()` возвращает true при закрытии диалога и false без открытого диалога; animation и deck class очищаются. Escape закрывает обычные диалоги, в том числе во время входа.
- Reduced motion пропускает вход для всех четырёх меню, включая подтверждение Нового забега.
- Быстрое close/reopen в одной JS turn сохраняет новую Колоду, её CSS class, одну новую entry animation и исходную конечную геометрию.
- Pageerror отсутствовали во всех context.

Примеры финальных размеров Колоды:

| Viewport | Width × height CSS px | Top CSS px |
| --- | --- | ---: |
| 1536×688 | 1057.7151×630.7476 | 14.0637 |
| 915×412 | 633.3992×377.7151 | 8.4237 |
| 568×320 | 403.0729×240.3646 | 34.2708 |
| 412×915 | 292.3698×174.3490 | 366.2943 |

## Finding: queued close event — CLOSED / VERIFIED

**Important / P2**, первоначальный `src/ui/app.js` close event handler. `dialog.close()` ставит close event в очередь; если открыть новый диалог до доставки события, старый handler отменял уже новую animation и удалял её `deck-dialog` class.

**Независимый RED:** в одной `page.evaluate()` вызвать `options.click(); window.cardGameBack(); deck.click();`, затем через 40 ms исследовать dialog. На всех четырёх viewport получено `{open:true, title:'Колода', deck:false, animations:0}`. Regression завершился exit 1: `Queued close damaged reopened deck dialog`. Влияние: новая Колода отображается с неправильной обычной dialog geometry, её вход отменён.

**Root fix:** синхронная отмена motion в closeDialog и игнорирование старого close event, когда dialog уже снова open. Тот же сценарий после исправления независимо даёт `{open:true, title:'Колода', deck:true, animations:1}` на всех четырёх viewport. После завершения entry ширина/высота reopened deck совпадают с обычным открытием. **RED→GREEN подтверждён.** Открытых findings в проверенном scope нет.

## Краткое статическое flame review

После сообщения о freeze прочитан финальный `src/ui/flame.js`. Log-height положительного превышения ограничен 62; draw использует отдельные clipped fire beds высотой 62 px и оставляет промежуток у ×. RAF chain не запускается повторно при running=true, прекращается при height=0; reduced motion рисует один фиксированный кадр. Новых статических findings не найдено. Это чтение кода, не дополнительная независимая визуальная оценка пламени; её выполнял root.

## Границы доказательства

Это desktop Chromium и mobile emulation. Android Back **JS hook** проверен, но физическая кнопка/gesture Back в установленном APK, устройство, WebView lifecycle и native build этим review не проверены. Recovery dialog с намеренно запрещённым cancel не включён в сценарии обычных меню. Full-game и pixel parity не заявляются; проверены вход, конечная геометрия и закрытие текущих диалогов.
