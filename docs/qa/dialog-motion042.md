# Общая анимация окон042

Все вызовы openDialog используют один выезд снизу за360ms с ease-out. Individual translate не заменяет transform центрирования/масштаба колоды. Reducedmotion пропускает анимацию. Старое движение отменяется перед новым открытием и при закрытии.

Регрессия tests/ui/dialog-motion-check.mjs до изменения упала «Dialog has no entry animation». После изменения прошла1536×709,915×412,568×320,360×800: старт ниже видимого viewport, конец внутри, Escape очищает анимации, reducedmotion без движения.

Основной исполнитель отдельно запустил:91coretests, общий browser (включая offlineHTML), deckreference6viewports с ожиданием завершения анимации, mobile7viewports, scoreflow2viewports, base-hold3modes, HUD4viewports. Все прошли. HUD подтверждает прозрачный промежуток над×, blue/red pixels, рост высоты до61.79 для10^500, целочисленные кадры. LargePNG визуально просмотрен: плавный общий контур и неодинаковые узкие поднимающиеся струи, вместо одинаковых вложенных языков.

Физическое Androidустройство не использовалось. Независимые дополнительные сценарии окон описаны в dialog042-review.md.

Независимый сценарий выявилqueuedclose race, воспроизведён на4размерах: в одномevaluate options.click→Back→deck.click оставлялКолоду безclass/анимации. Исправленguardifdialog.open в queuedclosehandler и синхронная отмена приBack; root rerun dialog-review042 прошёл все4размера.
