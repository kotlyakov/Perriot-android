# Original Balatro menu structure implementation plan

Goal: заменить отклонённую пользователем первую итерацию структурой оригинальных окон, сохраняя стиль B/Rubik. Поручение пользователя прямо разрешает реализацию и интерактивный показ, без APK. Основа: private APK UI_definitions.lua (artifacts/native-ui, не коммитить).
Architecture: существующие DOM-view и реальные game/profile callbacks; экранные размеры по содержимому вместо универсального1080×620. Отдельная двухколоночная коллекция категорий, самостоятельные разделы; run_setup с общим блоком колоды и стрелками по бокам, вертикальное options menu. Не добавлять зависимости и не копировать исходный Lua/чужие ресурсы в продукт.
Tech stack: существующие ES modules, HTML/CSS, Node+Chromium.

Global constraints: no APK/Gradle; preserve seed13031990/$100, locked gates/save semantics, own artwork and Rubik, visible back actions, no clipped content/no vertical scrolling; unimplemented settings clearly disabled. All touched screens must be inspectable in actual integrated app and direct inline preview.

Review focus: old saves/continued games; locked decks/stakes/challenges; long Russian descriptions; return navigation; touch landscape and large collection categories.

## Tasks
- [x] Task1 root: register rejected UI feedback under existing U20/21/26/27/29/30/31, retain planned remaining improvements; source-map native layouts and independent scope ownership.
- [x] Task2 setup agent: src/ui/start-screen.js and web/challenge-review.css ONLY; map run_setup_option5837+, run_setup5167+, challenges5068+/5377+ to actual structural hierarchy; deck stack+description+win column one selector with left/right arrows, stake block, seed toggle/input, large Play and separate fullwidth Back; Continue tab shows summary before action; main menu and challenge flow preserve callbacks and locks. Write own scoped check.
- [x] Task3 collection agent: src/ui/profile-screen.js and web/profile-review.css ONLY; native collection3609+ two columns with consumables grouped left; category screen WITHOUT sidebar/details column, correct category counts/layout from individual functions; selection tooltip floating; native profile select5209+ / high_scores surfaces, preserve history data. Write own scoped check.
- [x] Task4 root: src/ui/menu-windows.js, app.js, window-review.css; options vertical/order/context/seedcopy, settings rows, party hands row structure and real blind summary, content-specific dialog dimensions and separate back footer, end windows native summary/actions; preserve victory protection.
- [ ] Task5 integrate: new source-derived direct preview (no nested iframe/compression), actual controls callbacks; update tests and exporter; core tests, browser landscape/touch, inspect screenshots and independent reviewer. Save updated statuses/review branch. Do not merge before review or build APK.

Source map: UI_definitions.lua2317options,2373settings,2407settings_tab,2861win,2974game_over,3241run_info,3609collection,5167run_setup,5209profile,5837setup_option,6212generic options. Native dimensions are UI units; exact pixel equality is not claimed without running native renderer. Structure/relative placement derive from source; approved styling intentionally differs.

Review: исправлены2Important — отмена fromRun setup должна удалить стартовый экран и render() вернуть игру/победу; defeated_by выбирается по фактическому small/big/boss. Scoped re-review PASS. CI39981144143 ожидается.
