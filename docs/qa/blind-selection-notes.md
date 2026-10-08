# Выбор блайнда: промежуточный экран

Просмотрены загруженные оригинальные скриншоты 11 (`Screenshot_2026-09-08-10-55-16-04...jpg`) и 13 (`Screenshot_2026-09-08-10-59-01-35...jpg`). Они содержат обучающий overlay, но положения трёх панелей и элементов видны. Размеры2048×917 приведены к существующему игровому stage1536×688. Исследован оригинальный APK `UI_definitions.lua`: create_UIBox_blind_select1524, create_UIBox_blind_choice1592 — горизонтальные Small/Big/Boss, выбор сверху, имя/жетон/требование/награда, пропуск ниже.

Реализовано собственное оформление Rubik/печатная мастерская. Small x474 y209 w230 h460; Big x710 y230 w224 h439; Boss x943 y231 w202 h438. Начальное состояние оригинала в референсе11 служит основой. Prompt находится над левым HUD x155 y100 w274. Геометрия — ручная реконструкция видимых границ, не заявление пиксельного совпадения обучающего overlay.

Контракт: `renderBlindSelect(state,busy,onSelect)` и `removeBlindSelect()`. Отображение только при phase blind_selection. Small показывает state.round.target (сейчас300), награду$$$, вызывает onSelect без аргументов; интегратор dispatch START_BLIND. Busy отключает Small. В playing/round_won/shop overlay удаляется. Повторный render обновляет callback/target/busy без повторной анимации. CSS подключается интегратором через `/web/blind-select.css`.

HUD visibility принадлежит интегратору: blind_panel/title/token/target надо скрыть в blind_selection, чтобы показать prompt, и в won/shop; вернуть в playing. Hand/actions интегратор тоже скрывает до выбора. Модуль не изменяет ядро или сохранение.

Честные ограничения: Big/Boss disabled с «В разработке». Настоящее имя/эффект/жетон босса не выдуманы. Small skip disabled с aria-подписью «награды за пропуск ещё не реализованы». Полный цикл всех блайндов не заявляется.

Проверка: node --check src/ui/blind-select.js успешно; минимальный DOM-тест успешно проверил target300, callbackSmall, неактивныеBig/Boss, busyguard, отсутствие duplicateoverlay и teardown приplaying. Требуется настоящая браузерная проверка интегрированной сцены и масштабирования; минимальныйDOM её не заменяет.
