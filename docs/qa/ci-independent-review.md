# Независимая проверка CI

Дата: 08.10.2026. Проверяющий: независимый QA-агент. Проверены текущие `.github/workflows/android.yml`, `scripts/ci-browser.mjs`, Android-конфигурация и описание CI. Это проверка конфигурации, не подтверждение успешного удалённого run.

## Фактически выполнено

- `npm test`: 100 тестов, 100 успешных, 0 ошибок.
- `node --check scripts/ci-browser.mjs`: успешно.
- YAML прочитан BaseLoader; каждый блок `run` проверен через `bash -n`: успешно.
- Все девять файлов из списка CI существуют. Имена: browser, score-flow, card-visual, mobile-layout, deck-reference, typography, hand-gap, cashout-flow, cashout-review045.
- `python3 android/tools/check-config.py`: успешно.
- Официальная таблица Kotlin подтверждает совместимость Kotlin 2.3.21 с Gradle 8.13 и AGP 8.13.2; jvmToolchain(17) согласован с Java target17.
- Официальные README подтверждают текущие major версии checkout v7, setup-node v7, setup-java v6, upload-artifact v7, setup-android v4. Официальная страница Playwright 1.62.1 доступна.

## Вывод по конфигурации

Критических ошибок статически не обнаружено. CI выполняет свежую Gradle-компиляцию после подготовки собственных offline assets; старый APK не служит входом сборки. Подготовка ресурсов копирует только `src/` и `web/`, без исходного APK и скриншотов референса. Wrapper содержит SHA256 дистрибутива. APK собирается по реальному пути `android/app/build/outputs/apk/debug/app-debug.apk`.

Playwright bridge корректен для обычной установки: resolve даёт `.../node_modules/playwright/index.js`, dirname(dirname(...)) даёт `node_modules`, что совместимо со старыми imports `CODEX_PRIMARY_RUNTIME_NODE_MODULES + /playwright`. Новые тесты получают полный путь через PLAYWRIGHT_MODULE.

Workflow имеет только contents: read, не публикует git-изменения. Секретная подпись выключена для pull_request. При неполном наборе секретов или несовпадении сертификата job завершается ошибкой; при отсутствии секретов APK явно маркируется как debug без гарантии обновления установленной 0.4.5. Приватный ключ не попадает в uploads.

## Открытые проверки и ограничения

1. Успешный GitHub Actions run и скачивание его APK должен подтвердить Lead по фактическому run. Здесь этого наблюдения нет.
2. Browser pass, fresh Gradle compilation, обе ветви подписания и установка на физическом Android этим агентом не выполнены. Статическая проверка не заменяет эти проверки.
3. Полный специализированный набор UI шире CI списка: card-gesture, base-hold-review, dialog-motion, dialog-review042, flame-root043, HUD animation и дополнительные review-тесты не перечислены в launcher. Broad browser проверяет часть взаимодействий, но нельзя называть этот job запуском всех UI-тестов. Рекомендуется расширять список при изменении соответствующих функций.
4. 30 минут — предел job, не доказательство достаточного времени для первой установки браузера/SDK и холодной Gradle-сборки. Если фактический run достигает timeout, повышать лимит по измеренному времени.

## Первичные источники

- https://github.com/actions/checkout
- https://github.com/actions/setup-node
- https://github.com/actions/setup-java
- https://github.com/actions/upload-artifact
- https://github.com/android-actions/setup-android
- https://github.com/microsoft/playwright/releases/tag/v1.62.1
- https://kotlinlang.org/docs/gradle-configure-project.html
