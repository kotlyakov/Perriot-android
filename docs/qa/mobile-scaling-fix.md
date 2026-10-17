# Пьеро0.3.2: причина и регрессия масштабирования

Пользователь сообщил, что установленная0.3.1 намного больше экрана. Прежние resize-проверки использовали desktop Chromium, поэтому mobile overflow не проверяли.

До изменения: mobile915×412, DPR3.5, viewport meta width=device-width, фиксированный stage1536×688. Браузер сообщил innerWidth1536/innerHeight692, хотя documentElement.clientWidth915/clientHeight412 и visualViewport915×412. resize вычислял scale1 и показывал stage1536×688. tests/ui/mobile-layout-check.mjs завершился exit1 (stage за пределами viewport).

После: доступная область берётся из documentElement client box; html/body100% и overflowhidden исключают расширение viewport содержимым. Window resize, root ResizeObserver и visualViewport resize пересчитывают масштаб/центр. При915×412 stage915×409.84375,y1.078125. Android useWideViewPort/loadWithOverviewMode учитывают meta viewport при initialload.

Проверены мобильные размеры915×412/DPR3.5,568×320/DPR2,360×800/DPR3,1280×720/DPR1,1024×600/DPR2,412×915/DPR3.5,2400×1080/DPR1 и перестановка width/height: fit, центрирование, единый масштаб, bounds кнопок, touchselect/sort. Mobilecheck exit0; desktop/full browser suite exit0; Node86/86. Независимый отчёт mobile-scaling-review.md.

Название label, webtitle, Options и текущая документация — «Пьеро». PackageID ru.cardcascade.game и storage names/schema сохранены для совместимого обновления. Не удалять приложение ради переименования.

Повторная установка и наблюдение на физическом телефоне остаются необходимы для device приёмки; её здесь не выполняли. Это исправление viewport, не завершение полного игрового контента.
