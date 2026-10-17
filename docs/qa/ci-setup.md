# GitHub Actions: свежая Android-сборка и проверки

08.10.2026. Конфигурация для исходников ветки `apk-reference` в `kotlyakov/Perriot-android`. Она не заменяет сохранённый APK 0.4.5 и не изменяет его версию. Историческая ветка 0.4.5 и основная ветка управляются Lead; этот workflow не выполняет push, merge или публикацию Release.

## Что запускается

`.github/workflows/android.yml` срабатывает на push любой ветки, pull request и ручной `workflow_dispatch`. Один job `ubuntu-24.04` последовательно выполняет:

1. `npm test` — все тесты `tests/core/*.test.js`.
2. Установку **Playwright 1.62.1** вне checkout, в `$RUNNER_TEMP/pierrot-browser`, и соответствующего Chromium с системными зависимостями. Проект не имеет npm-зависимостей/lockfile; `npm ci` для корневого проекта поэтому не используется.
3. `node scripts/ci-browser.mjs` — существующие browser, score-flow, card-visual, mobile-layout, deck-reference, typography, hand-gap, cashout-flow и cashout-review045 checks. Каждый check получает отдельный локальный сервер через существующий `scripts/check-ui.mjs`; ошибка прекращает job. Launcher связывает старые runtime-specific imports с обычным установленным Playwright: Codex runtime в CI не требуется.
4. Установку **Temurin JDK 17**, SDK Platform **36**, Build Tools **35.0.0**, подготовку assets и статическую проверку Android XML/конфигурации.
5. **Свежую компиляцию Kotlin/Android**: из `android/` выполняется `bash ./gradlew :app:clean :app:assembleDebug --no-daemon --no-build-cache --rerun-tasks --stacktrace`. Wrapper и его SHA256 взяты из исходников (**Gradle 8.13**). APK не создаётся repack старой сборки. `bash` нужен, потому что gradlew в текущих исходниках не имеет executable bit.
6. Проверку подписи `apksigner verify --verbose --print-certs`, SHA256 и загрузку только APK/публичного отчёта сертификата/метаданных/checksum. APK выдаётся только после успеха предыдущих обязательных шагов.

APK скачивается из **Actions → выбранный успешный run → Artifacts**. В имени присутствуют тип подписи, run ID и attempt. `build.txt` связывает файл с commit SHA. PNG диагностика браузера сохраняется отдельно даже при ошибке теста; отсутствие PNG не считается успехом теста. Срок хранения APK — 30 дней, снимков — 14 дней.

## Подпись

Без секретов workflow работает полностью и выпускает **`ci-debug-no-update-guarantee`**. Debug key создаётся на CI runner; APK с тем же application ID нельзя считать совместимым обновлением установленного preview 0.4.5. Не предлагать удаление установленной игры ради такой сборки. Lead может подписать свежий CI APK прежним приватным preview key отдельным официальным `apksigner`.

Необязательный путь для доверенных push/manual runs: четыре repository secrets — `PREVIEW_KEYSTORE_BASE64`, `PREVIEW_KEYSTORE_PASSWORD`, `PREVIEW_KEY_ALIAS`, `PREVIEW_KEY_PASSWORD`. Они должны описывать существующий сохранённый preview key; новый ключ workflow не генерирует. Если задан только неполный набор, сборка завершается ошибкой. На **всех pull_request** этот путь отключён.

Ключ декодируется только в `$RUNNER_TEMP/pierrot-preview.keystore` с ограниченными правами и удаляется через EXIT trap. Он не входит в исходники, assets, кеши или uploads. Пароли передаются `apksigner` через environment и не печатаются. Успешная preview-подпись обязана совпасть с известным certificate SHA256:

`5ff24a25ecf6b43e6ae02ee44c2568fcffd335f9a2c9222dd1892168e8d40d8e`

Иначе job падает; автоматического fallback на другую подпись нет. Метка **`preview-stable-signature`** подтверждает сертификат, но сама по себе не доказывает установку/обновление на устройстве. Workflow сохраняет package/version из checkout и не повышает versionCode.

## Локальная проверка этой конфигурации

- YAML прочитан PyYAML BaseLoader; проверены события и `contents: read`; все `run` blocks проходят `bash -n`.
- `node --check scripts/ci-browser.mjs` — успешно.
- `npm test` — **100/100** успешно.
- `python3 android/tools/check-config.py` — успешно; это статическая проверка, не компиляция.
- Browser launcher реально запущен: default Chromium cache отсутствует; сохранённый локальный `headless_shell` аварийно завершается с `Data pack file corruption`. Полный browser pass здесь не заявлен. CI устанавливает matching Chromium самостоятельно.
- JDK/SDK для полной Gradle-компиляции в этой сессии локально не установлены. Signing branches локально не прогонялись. Успех удалённого GitHub run, APK или установка на Android появятся только после отдельного фактического запуска.

## Официальные источники

Проверены 08.10.2026: [checkout v7](https://github.com/actions/checkout), [setup-node v7](https://github.com/actions/setup-node), [setup-java v6](https://github.com/actions/setup-java), [upload-artifact v7](https://github.com/actions/upload-artifact), [setup-android v4](https://github.com/android-actions/setup-android). Workflow использует major tags из README этих проектов; runner — GitHub-hosted Ubuntu.

[Playwright CI](https://playwright.dev/docs/ci), [Chromium installation](https://playwright.dev/docs/browsers), [Playwright 1.62.1 release](https://github.com/microsoft/playwright/releases/tag/v1.62.1), [Android apksigner](https://developer.android.com/tools/apksigner).
