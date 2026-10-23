# QA поля/Android — 07.10.2026, 0.3.1-preview

| Проверка | Результат |
| --- | --- |
| Node core | 86 pass, 0 fail; независимый повтор |
| Реальный Chromium140 headless | Mouse/touch/keyboard, выбор5, сортировка/drag, повторный play, save/reload, backup/recovery, failed write проходят |
| Resize | 568×320,915×412,1280×720: единый масштаб, действия доступны |
| Веер при1536×688 | left468.11/right1156.89/top388.58/bottom545.41; измеренный референс приблизительный, полная pixel parity не принята |
| Standalone HTML | Реальный браузер offline, play и reload/save проходят |
| Screenshot | artifacts/field-preview.png: live render проверочной fixture, просмотрен визуально |
| Preview server | Home/module200, encoded traversal404: RED→GREEN |
| Android | Kotlin compile/assembleDebug успешны; версия0.3.1-preview/versionCode4 |
| Native runtime/device | Не проверен: установка, insets, lifecycle и физический сбой записи |
| Полнота игры | Один малый блайнд; награда/магазин/следующие блайнды/полный контент ещё отсутствуют |

Независимый отчёт — browser-runtime-review.md; старый review0.3.0 — field-review.md. Протокол сборки — ../android-toolchain-attempt.md. Android bridge static checks не заменяют проверку на устройстве.
