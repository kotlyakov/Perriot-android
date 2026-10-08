# Карта загруженного APK

Проверено 2026-10-08 UTC. Исходник проверки — пользовательский `project_sources/15-Balatro_1.0.1n_0.4_25_noPairip.apk`, SHA-256 `6236dc68a312d04295839cfbfd2699d4751877bdf162c3a4ce425481d28397bd`. Статический доступ: Python zipfile, UTF-8 Lua, Android aapt dump badging. APK не запускался и не модифицировался. Название `noPairip` само по себе не подтверждает состав/подлинность модификаций.

## Три разных номера

| Данные | Подтверждение | Значение / смысл |
|---|---|---|
| Android package | AndroidManifest.xml через aapt | `com.playstack.balatro.android`; versionName `0.4`, versionCode `25`; minSdk23, targetSdk34; arm64-v8a и armeabi-v7a |
| Игровая Lua версия | `assets/globals.lua:1–3`, VERSION | `1.0.1n-FULL [M]` — фактическое объявление игрового ядра этого файла |
| SDK служебный info | `assets/info.txt:1–7` | Singular12.5.6, build_date2024-06-30; это не Balatro game version |

Ни номерAndroid1.9 из прежнего задания, ни прежняя wiki1.0.1o-FULL не являются номером данного APK. Источник правил ветки APK — конкретный хеш. Различия n↔o пока не инвентаризированы; этот анализ не доказывает официальную подпись/происхождение или отсутствие изменений в перепакованном APK.

## Внутренняя карта

49 Lua-файлов: 15 localization, 16 engine, 6 functions, 12 верхнего уровня. Оригинальные извлечённые Lua остаются вне репозитория; документация содержит собственные выводы и координаты доказательств, без переноса исходников/ресурсов.

| APK path | Роль / входы для следующего анализа |
|---|---|
| `assets/globals.lua` | Версия и enum state |
| `assets/game.lua` | Каталоги, начальное состояние, start_run, update_shop, update_round_eval |
| `assets/functions/state_events.lua` | end_round, evaluate_round, new_round, движение между зонами, scoring |
| `assets/functions/button_callbacks.lua` | cash_out, toggle_shop, select_blind, reroll_shop, buy/use/redeem |
| `assets/functions/common_events.lua` | add_round_eval_row, calculate_reroll_cost, get_pack, create_card, pools |
| `assets/functions/UI_definitions.lua` | shop areas, create_card_for_shop, controls/disabled |
| `assets/functions/misc_functions.lua` | get_starting_params, pseudoseed/pseudorandom и другие helpers |
| `assets/card.lua` | set_cost, dollar bonuses, ending_shop, rental, modifiers, effects |
| `assets/cardarea.lua` | shuffle и card-area ограничения |
| `assets/back.lua`, `blind.lua`, `tag.lua`, `challenges.lua` | Колоды, блайнды, теги, challenges |
| `assets/localization/*.lua` | 15 локализаций; читать для ключей/трассировки, не переносить тексты/арт в игровой продукт |
| `assets/engine/*.lua` | Event queue, UI/controller/serialization; нужны для exact timing/RNG parity |
| `assets/resources/` | Оригинальные graphics/fonts/sounds/shaders; в проект не переносились |

## Уже пригодные результаты

[Cashout и lifecycle](apk-findings/cashout-lifecycle.md) закрывают прежние гипотезы snapshot/startup/shuffle на **этом APK**, не на неизвестномAndroid1.9.
[Магазин и экономика](apk-findings/shop-economy.md) независимо сверяют соседние документы `neighbor-artifacts/Balatro/APK_REFERENCE_SPEC.md` и `APK_TRACEABILITY.md`; повторный полный каталог не создавался. Их shop выводы совпали с прочитанными путями. Новый материал — координаты, coupon sell ordering, точная граница cashout и независимые будущие TDD-кейсы.

Очередь: экспорт каталогов с исходными entity keys и verified parameters; full pool eligibility/unlocks; RNG call-order; Booster selection/return; event-queue edge cases; runtime exact APK. Не считать 49 читаемых Lua доказательством полноты воспроизведения игры.
