# Android toolchain и фактическая сборка

07.10.2026. Пользователь разрешил продолжить подготовку Android-сборки. Runtime-пакеты размещены в `/workspace/scratch/669d7c37bc9d/toolchains`, отдельно от исходников и исходногоZIP. Эмулятор не загружался. Сетевые запросы шли через заданный средой proxy; его ограничения не обходились. Диагностика конкретных URL не означает доступность или недоступность всей сети.

## Полученные компоненты и происхождение

| Пакет | Официальный URL / метаданные | Проверка |
| --- | --- | --- |
| Microsoft OpenJDK 17.0.20.1 Linux x64 | `https://aka.ms/download-jdk/microsoft-jdk-17-linux-x64.tar.gz`; конкретная версия и checksum-link — [MicrosoftLearn](https://learn.microsoft.com/en-us/java/openjdk/download) | 191782188 байт; SHA256 `d00e5b04e9726b63d915706c7049e5297c9f40239ce8a12fcc68b7267fa91ad2` совпал с `https://aka.ms/download-jdk/microsoft-jdk-17.0.20.1-linux-x64.tar.gz.sha256sum.txt` |
| Gradle 8.13 | `https://services.gradle.org/distributions/gradle-8.13-bin.zip`, checksum `https://downloads.gradle.org/distributions/gradle-8.13-bin.zip.sha256` | 136983045 байт; SHA256 `20f1b1176237254a6fc204d8434196fa11a4cfb387567519c61556e8710aed78` совпал |
| Google Command-Line Tools 19.0 | `https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip`; [GoogleSDKrepository](https://dl.google.com/android/repository/repository2-1.xml) | 164760899 байт; SHA1 `5fdcc763663eefb86a5b8879697aa6088b041e70` совпал с официальным XML; локальныйSHA256 `7ec965280a073311c339e571cd5de778b9975026cfcbe79f2b1cdcb1e15317ee` |
| Android SDK Platform 36 revision 2 | Установка через sdkmanager 19; XML содержит `platform-36_r02.zip` и SHA1 `2c1a80dd4d9f7d0e6dd336ec603d9b5c55a6f576` | Установленное `source.properties`: ApiLevel 36, Revision 2 |
| Android Build Tools 35.0.0 | Установка через sdkmanager 19; XML содержит `build-tools_r35_linux.zip` и SHA1 `2cfaa0bbb2336e9ec18ed3ecea84fa2e2af607bc` | Установленное `source.properties`: Revision 35.0.0 |
| Android Platform Tools 37.0.1 | Автоматическая установка AGP при сборке после SDK-лицензии | Метаданные SDKrepository: `platform-tools_r37.0.1-linux.zip`, SHA1 `477254aa5f903c15cf51001717bdf347fb6b53e0` |

Checksums JDK/Gradle/CMDTools отдельно посчитаны по реально скачанным архивам до распаковки. Platform/Build/PlatformTools установлены официальным sdkmanager/AGP; приведённые SHA1 — метаданные Google, не отдельный повторный хеш архивов после удаления временных файлов installer.

`java -version` и `javac -version` подтвердили17.0.20.1. `sdkmanager --version` подтвердил19.0. Gradle `--version` подтвердил8.13; его встроенный Kotlin 2.0.21 относится к GradleDSL, а plugin проекта закреплён2.3.21. Проект использует AGP 8.13.2, compile/targetSDK36 и JDK 17.

OracleJDK HEAD возвращал HTTP 200 с195 байт `text/html`, что не является архивом; он не распаковывался. AdoptiumAPI metadata возвращал403; зеркало Microsoft работало. Официальные GoogleMavenAGP и MavenCentralKotlin endpoints ответили200 с подходящими типами и использованы Gradle. Непригодные URL не повторялись бесконечно.

## Установка и исправление SDK layout

SDKmanager19 получил proxy-host/port из уже заданного `HTTPS_PROXY`; Java доверял предоставленному средой `CODEX_PROXY_CERT`, импортированному только в scratchJDK. Никакие proxy credentials, сертификаты или локальные системные пути не включены в исходники Android. `sdkmanager --licenses` завершился0; `sdkmanager 'platforms;android-36' 'build-tools;35.0.0'` завершился0.

После установки в `platforms/android-36/` оказались вложенные `android-36/` с полноценным API36 и небольшой дополнительный `android-15/`. Перед сборкой фактически проверено `AndroidVersion.ApiLevel=36`, затем содержимое вложенного `android-36/` перемещено на ожидаемый SDK-корень `platforms/android-36/`, без замены файлов платформой другогоAPI. Это коррекция локальной структуры установки, не правка AndroidAPI, jar или продуктовых исходников.

## Настоящий GradleWrapper

Wrapper создан установленным проверенным Gradle 8.13 командой `wrapper --gradle-version 8.13 --distribution-type bin --gradle-distribution-sha256-sum <официальныйSHA256>` в отдельном scratch-проекте. Задача завершилась `BUILD SUCCESSFUL`. Созданные `gradlew`, `gradlew.bat`, jar и properties перенесены в `android/`. Это настоящий Wrapper, а не скрипт-имитация. Его jar имеет локальныйSHA256 `81a82aaea5abcc8ff68b3dfcb58b3c3c429378efd98e7433460610fecd7ae45f` и происхождение из проверенного Gradle-дистрибутива; properties закрепляет checksum дистрибутива.

## Повторная сборка

На машине с JDK 17 и SDK 36 / Build Tools 35:

```sh
export JAVA_HOME=/path/to/jdk17
export ANDROID_HOME=/path/to/android-sdk
export PATH="$JAVA_HOME/bin:$PATH"
npm run android:assets
android/build-debug.sh --no-daemon
```

`android/build-debug.sh` использует настоящий Wrapper. Первое скачивание Gradle/dependencies требует доступа к официальным репозиториям; установленное приложение работает офлайн. Если корпоративная сеть требует proxy, его конфигурация и CA устанавливаются локально согласно этой сети, а не фиксируются в исходниках. `android/local.properties` допустим только локально и не входит в архив.

Сборочные логи текущей среды находятся в scratch `toolchains/probes/`; исходный archive не содержит toolchain, Gradlecache, debugkeystore или зависимости. DebugAPK подписывается локальным debugkey и предназначен для промежуточной проверки; для публичного релиза нужна отдельная release-signing задача.

## Результат

Первая команда `gradle --no-daemon -p android :app:assembleDebug` завершилась exit 0, `BUILD SUCCESSFUL in 2m 48s`, 35 задач выполнены. Kotlin-код действительно скомпилирован; `:app:packageDebug` и `:app:assembleDebug` выполнены. Исправления Kotlin для компиляции не потребовались. Это была первая промежуточная компиляция; итог финального rebuild с обновлёнными UI assets фиксируется после его завершения. Установка и запуск на Android пока не проверены.

### Финальный rebuild 0.3.1-preview

После обновления UI label и повторного `scripts/prepare-android.mjs` выполнен `android/build-debug.sh --no-daemon` через настоящий Wrapper. Первый Wrapper-launch остановился до выполнения project tasks из-за timeout10s при скачивании Gradle. Использован уже скачанный официальный ZIP с повторно подтверждённым SHA256: он помещён в штатный scratchWrappercache, после чего сам Wrapper проверил checksum, распаковал Gradle и выполнил сборку. `.ok` или другие признаки успешной установки не подделывались. `networkTimeout` в wrapperproperties поднят до60000ms для дальнейших запусков.

Финальная команда завершилась **exit0, `BUILD SUCCESSFUL in 20s`**, 35 задач:9 выполнены,26 up-to-date. APK пересобран с актуальными assets и `versionCode=4`, `versionName=0.3.1-preview`.

| Проверка | Фактический результат |
| --- | --- |
| `apksigner verify --verbose` | Успех; APK SignatureSchemev2,1 signer |
| `aapt dump badging` | `ru.cardcascade.game`; versionCode4 /0.3.1-preview; minSdk26; target/compileSdk36; label «Карточный каскад» |
| `aapt dump permissions` | Только package; разрешения INTERNET/storage отсутствуют |
| APKZIP `testzip` | Нет повреждённых entries |
| Сравнение assets | Все16 файлов APK byte-identical текущему `android/app/src/main/assets/`; нет лишних или пропущенных файлов |
| Исключение референсов | Нет JPG/JPEG, screenshot или references-файлов в APKassets |
| Размер | 904973байт |
| SHA256 | `b0eadb58db93c91b771c2d6e82c02c56729002ce862ee1d624145542a3d3b27a` |
| Передаваемая копия | `/workspace/scratch/669d7c37bc9d/card-cascade-0.3.1-preview.apk` |

Нативная компиляция и APK packaging теперь проверены фактически. Подпись debug, APK является промежуточной игрой одного блайнда; эта проверка не означает полный каталог/магазин/последующие блайнды. Установка на Android-устройство, AndroidWebView runtime, системныйНазад, nativeAtomicFile при остановке процесса и Androidgesture/insets ещё не проверены. Браузерные тесты проводит Lead отдельно и не подменяют испытание установленного APK.

### Исправление viewport и название «Пьеро»: 0.3.2-preview

Пользователь сообщил, что поле Android выходит за экран, и выбрал название «Пьеро». В Activity явно включены `useWideViewPort=true` и `loadWithOverviewMode=true` перед загрузкой. Согласно [официальному WebSettings API](https://developer.android.com/reference/android/webkit/WebSettings#setUseWideViewPort(boolean)), wideViewport включает поддержку HTML viewport meta; `width=device-width` задаёт CSS-ширину доступного устройства. [OverviewMode](https://developer.android.com/reference/android/webkit/WebSettings#setLoadWithOverviewMode(boolean)) даёт начальное вписывание широкого документа по ширине. Отсутствие флагов само по себе не считается доказанным единственным источником ошибки: Lead отдельно воспроизвёл oversized `innerWidth` из-за overflow поля и исправил CSS/clientbox расчёт масштаба.

Application label теперь «Пьеро»; `versionCode=5`, `versionName=0.3.2-preview`. ApplicationID/namespace `ru.cardcascade.game`, origin и CardStorage/private save paths сохранены. Полная валидация/формат save и ядро в этой Android-задаче не изменялись. Staticcheck сначала воспроизвёл отсутствие требуемой viewport-настройки (RED), затем прошёл после исправления (GREEN); дополнительно проверяет название и прежний packageID.

После сигнала Lead о подготовке новых assets выполнен настоящий `android/build-debug.sh --no-daemon`: **exit0, `BUILD SUCCESSFUL in 19s`**, 35 задач:12 executed,23 up-to-date; `compileDebugKotlin` реально выполнен для изменённой Activity.

| Проверка | Результат 0.3.2 |
| --- | --- |
| Подпись | `apksigner verify --verbose --print-certs` прошёл; SHA256 сертификата совпал с переданной APK0.3.1-preview |
| Package/version/label | `aapt dump badging`: ru.cardcascade.game; code5/0.3.2-preview; «Пьеро» |
| API | minSdk26, target/compileSdk36 |
| Разрешения | BinaryManifest не содержит uses-permission |
| APKZIP | `testzip` чист; все16 assets byte-identical актуальному generatedfolder, index содержит «Пьеро» |
| Референсы | Нет JPG/JPEG, screenshot/references-файлов в assets |
| Размер | 905197байт |
| SHA256 APK | `87ad3675186414ba82d1d3c2665ff2d66b00fdf5a7cf12d9c15d359330659bde` |
| Передаваемая копия | `/workspace/scratch/669d7c37bc9d/pierrot-0.3.2-preview.apk` |

Прежний packageID, возрастающий versionCode и совпадающий signer позволяют обновление поверх0.3.1 с сохранением приватных данных. Фактическая установка обновления и визуальное поведение AndroidWebView на телефоне ещё не проверены в этой среде; не подменять их browser emulation или успешной компиляцией.

### Карточная графика и offline pixelfont: 0.3.3-preview

Запрос пользователя об иллюстрациях/пипсах, шрифте, счётчике колоды и анимации реализован UI-разработчиком; Android-оболочка сохраняет прежние packageID, viewport и файловое хранилище. В этой задаче получен Tiny5 Regular с кириллицей из официального Google Fonts и полной SIL OFL1.1-копией: см. `docs/art/font-provenance.md`. В HTTPS-interceptor добавлен MIME `font/ttf`; внешний font/CDN не требуется. VersionCode6, versionName0.3.3-preview.

Первая компиляция с font завершилась успешно23s, но не передавалась: независимый QA затем исправил визуальный порядок сыгранных карт. После нового сигнала Lead и повторной подготовки assets выполнен финальный Wrapper rebuild: **exit0, `BUILD SUCCESSFUL in 8s`**,35 задач:3 executed,32 up-to-date. Native `compileDebugKotlin` с изменённым MIME был фактически выполнен в предыдущей23s компиляции; финальный rebuild перепаковал свежие UI assets.

| Проверка | Результат 0.3.3 |
| --- | --- |
| Подпись | apksignerverify успешен; сертификат совпадает с0.3.2-preview |
| Package/version/label | ru.cardcascade.game; code6/0.3.3-preview; «Пьеро» |
| API и разрешения | minSdk26, target/compileSdk36; uses-permission отсутствуют |
| APKZIP | testzip чист; все20 assets byte-identical актуальной generatedfolder |
| Font/license | TTF и OFL внутри `assets/web/fonts/` совпадают байт-в-байт с полученными первичными исходниками |
| UI freshness | Включены актуальные `preparePlayedCards` и новые card-art/play-animation modules; source-to-APK сравнение включает последний QA orderfix |
| Референсы | Нет JPG/JPEG, screenshot/references-файлов в assets |
| Размер | 966038байт |
| SHA256 APK | `3f9f56015d2c1979c1fef02fd80fa1c3e491eb44619bf6317d758877a7bbceb2` |
| Передаваемая копия | `/workspace/scratch/669d7c37bc9d/pierrot-0.3.3-preview.apk` |

Runtime на установленном Android по-прежнему не проверен здесь; браузерная визуальная проверка проводится Lead/QA отдельно. Промежуточный APK содержит один блайнд, не полный каталог оригинальной игры.

### Восстановление среды и отдельная тестовая установка: подготовка0.3.4

При возвращении к исходникам0.3.3 обнаружено отсутствие прежнего toolchain и `/root/.android/debug.keystore`. Предыдущий APK0.3.3 из `current-release/` проверен apksigner: сертификатSHA256 `21c94e7019190c09855c602a921db795d30f4eb5953945bc9610519a21a4454e`. Приватного ключа нет; этот публичный сертификат в APK не позволяет восстановить утраченный signingkey. Поэтому совместимость обновления с0.3.3 не заявляется.

Lead выбрал безопасную отдельную тестовую установку: **applicationId `ru.cardcascade.game.preview`**, namespace и Kotlinclasses `ru.cardcascade.game`, label «Пьеро», versionCode7/versionName0.3.4-preview. Это другой приватный sandbox и отдельный новый тестовый забег; установленная прежняя `ru.cardcascade.game` и её файлы не удаляются и не перезаписываются. Последующие тестовые APK используют стабильный previewpackage и сохранённый signingcheckpoint. Смена packageID зафиксирована явно вследствие потери ключа; она не является автоматической миграцией состояния.

Официальные архивы JDK17.0.20.1/Gradle8.13/CMDTools19 получены повторно с теми же закреплёнными SHA256 из таблицы выше. После обнаружения неполных файлов повторное получение выполнялось в выделенный `toolchains/android-shell/`: временное `.download` → flush/fsync → hashcheck → atomicrename. Причина появления partial-файлов не доказана; второй владелец не установлен, обход сетевых ограничений не выполнялся. Перед распаковкой SHA256 повторно проверены. Runtime теперь находится только в `toolchains/android-shell/`; java/javac17.0.20.1 и SDKPlatform36/BuildTools35 подтверждены фактическими файлами. SDKmanager licenses/install завершились0; при необходимости повторена документированная коррекция вложенного API36-каталога.

Chromium1187 headless восстановлен с официального PlaywrightMicrosoft mirror `https://playwright.download.prss.microsoft.com/dbazure/download/playwright/builds/chromium/1187/chromium-headless-shell-linux.zip`:109363841байт, SHA256 `97842c43d49627e893e1498f61554fdfe0223d35daf247e4bedee11e79509b8e`, ziptest чист. Бинарник `toolchains/browser/chrome-linux/headless_shell` сообщает Chromium140.0.7339.16. Это инструмент браузерного QA, не игровой ресурс и не AndroidWebView/эмулятор.

После PythonZIP-restoration исполняемые флаги `android/gradlew` и `android/build-debug.sh` отсутствовали; `chmod+x` восстановлен. ИсточникZIP с сохранёнными UNIXattributes при нормальной распаковке может восстанавливать permissions автоматически; в других средах перед запуском выполнить `chmod +x android/gradlew android/build-debug.sh`.

Новый debugsigningkey будет создан Android Gradle Plugin при разрешённой сборке и сохранён отдельным приватным checkpoint `pierrot-preview-signing.keystore` с mode600. Его нет в sourceZIP и APK; APK содержит только необходимые данные публичной подписи. Для будущей сборки preview с той же подписью сначала восстановить checkpoint в стандартный local debugkeystore (`~/.android/debug.keystore`) и ограничить permissions600. Пароль/содержимое ключа не выводятся. Сохранение checkpoint отдельно выполняет Lead; исходная копия в scratch сама по себе не обеспечивает долговечность.

Итог сборки0.3.4 и новый fingerprint будут записаны после обновления assets и фактического assembleDebug. Подготовка среды и Gradlehelp не являются заявлением о готовом APK.


### Фактическая сборка и проверка0.3.4-preview

Официальный Wrapper выполнил `android/build-debug.sh --no-daemon`: первая компиляция завершилась exit0; после окончательного prepareAndroid, QA discard-opacity fix и исправления ширины чисел повторный запуск завершился **exit0, BUILD SUCCESSFUL in11s**,35 задач:3 executed,32 up-to-date. Проверка самих APK assets подтвердила, что окончательный исправленный источник уже вошёл в пакет: это подтверждается bytecomparison, а не только Gradle status. Log: scratch `toolchains/probes/pierrot-0.3.4-final-build.log`.

| Проверка | Результат0.3.4 |
| --- | --- |
| Подпись | apksigner verify успешен; публичный SHA256 нового signer `5ff24a25ecf6b43e6ae02ee44c2568fcffd335f9a2c9222dd1892168e8d40d8e` |
| Private checkpoint | `pierrot-preview-signing.keystore`, mode0600; publiccert совпадает с APK. Lead сохраняет отдельно; не включать в исходники/публичную передачу |
| Package/version/label | `ru.cardcascade.game.preview`; code7/0.3.4-preview; «Пьеро» |
| Activity | BinaryManifest launchable `ru.cardcascade.game.MainActivity`; namespace остаётся прежним |
| API / permissions | minSdk26, target/compileSDK36; uses-permission отсутствуют, INTERNET нет |
| ZIP и freshness | testzip чист; все27 assets совпадают ключами и байтами с актуальным generatedfolder |
| Последние QA fixes | `src/ui/play-animation.js`: начальный discard keyframe opacity1; `field.js`: font-size по parent box и compact e для >10digits, `app.js`: formatter roundscore |
| Fonts / licenses | Tiny5 и оба Numbers TTF, OFL и Numbers-LICENSE включены офлайн |
| Референсы | JPG/JPEG, screenshot/references assets отсутствуют |
| APK размер | 1748129байт |
| APK SHA256 | `4716dd408cd35e50c35545b8f3466ccb61c37bfa823f7d05777c8746d7e1f871` |
| APK копия | `/workspace/scratch/669d7c37bc9d/pierrot-0.3.4-preview.apk` |

Новая подпись отличается от0.3.3; обновление старой `ru.cardcascade.game` этим APK невозможно. Другой applicationId обеспечивает отдельную тестовую установку без удаления прежней игры и без изменения её приватных сохранений. Автоматической миграции сохранений между ID нет. Для последующих preview updates нужны неизменный previewID, больший versionCode и сохранённый отдельный signingcheckpoint. Установка, WebView/native bridge и runtime на реальном Android здесь ещё не проверены; браузерные QA не заменяют устройство.

### Фактическая сборка0.3.5-preview: экран колоды по референсу

После восстановления scratch окружения официальные JDK17.0.20.1, Gradle8.13, CMDTools19 и Chromium1187 вновь скачаны по URL выше. SHA256 каждого архива совпал с закреплённым; SDKmanager установил API36 revision2, BuildTools35 и PlatformTools. Debugkey восстановлен из отдельно сохранённого checkpoint: mode0600, публичный SHA256 `5ff24a25ecf6b43e6ae02ee44c2568fcffd335f9a2c9222dd1892168e8d40d8e`. Его приватные данные не включены в исходники или передаваемый APK.

Подготовка среды сначала выявила отсутствие executable permission у JDK `lib/jspawnhelper`; executable bit восстановлен только в локальном toolchain. Gradle proxy был передан явными `-Dhttp(s).proxyHost/Port` из текущего окружения; пробный JAVA_TOOL_OPTIONS сам по себе не обеспечил dependency resolution. Затем настоящий Wrapper `help` завершился BUILD SUCCESSFUL79s, зависимости получены из официальных Google/MavenCentral repositories. Эти локальные установки не изменяют продуктовую конфигурацию.

После сигнала Lead об окончательном UI и очистке класса модального окна при Escape выполнена свежая `npm run android:assets`, затем `android/build-debug.sh --no-daemon`: **exit0, BUILD SUCCESSFUL in1m2s**, все35 задач executed, Kotlin compilation/packageDebug/assembleDebug фактически выполнены. Лог: scratch `toolchains/probes/pierrot-0.3.5-final-build.log`.

| Проверка | Результат0.3.5 |
| --- | --- |
| Подпись | apksigner verify успешен, schemev2; SHA256 signer совпадает с0.3.4 |
| Package/version/label | `ru.cardcascade.game.preview`; versionCode8/0.3.5-preview; «Пьеро» |
| Activity/API | `ru.cardcascade.game.MainActivity`; minSdk26, target/compileSDK36 |
| Разрешения | uses-permission отсутствуют, INTERNET/storage нет |
| ZIP/assets | testzip чист; все27 файлов assets byte-identical актуальной generatedfolder |
| Референсы | JPG/JPEG/screenshot/reference файлы отсутствуют в APKassets |
| Размер APK | 1747225байт |
| SHA256 APK | `c26274649d07db0597fbb01606e741e7a8d0c3bf77108175ba5d6db397b9dd96` |
| Передаваемая копия | `/workspace/scratch/669d7c37bc9d/pierrot-0.3.5-preview.apk` |

Одинаковые package/signature и увеличенный versionCode обеспечивают совместимость Android-обновления0.3.4-preview без удаления её приватного состояния. Это не обновление старой0.3.3 (`ru.cardcascade.game`). Установка на Android-устройство и реальный WebView runtime здесь не проверены; браузерный QA Lead/независимого агента проверяется отдельно. Промежуточный APK по-прежнему содержит один блайнд.

### Фактическая сборка0.3.6-preview: Rubik во всём интерфейсе

После утверждения пользователем Rubik Lead заменил старые шрифты и подтвердил готовность UI после browser/coreQA. Перед сборкой повторно проверен ранее восстановленный debugkey: mode0600, fingerprint совпадает с0.3.4/0.3.5. VersionCode увеличен до9, versionName0.3.6-preview; package unchanged `ru.cardcascade.game.preview`.

Выполнена свежая `npm run android:assets` (скрипт полностью удаляет прежнее generatedassetdirectory перед копированием), затем настоящий Wrapper `android/build-debug.sh --no-daemon`: **exit0, BUILD SUCCESSFUL in12s**,35 задач:9 executed/26up-to-date. UI assets/Manifest/resources/package пересобраны; Kotlin source unchanged, compileDebugKotlin up-to-date. Лог: scratch `toolchains/probes/pierrot-0.3.6-final-build.log`.

| Проверка | Результат0.3.6 |
| --- | --- |
| Подпись | apksigner verify успешен; signerSHA256 `5ff24a25ecf6b43e6ae02ee44c2568fcffd335f9a2c9222dd1892168e8d40d8e`, совпадает с0.3.4/0.3.5 |
| Package/version/label | `ru.cardcascade.game.preview`; code9/0.3.6-preview; «Пьеро» |
| Activity/API | `ru.cardcascade.game.MainActivity`; minSdk26, target/compileSDK36 |
| Разрешения | uses-permission отсутствуют, INTERNET/storage нет |
| ZIP/freshness | testzip чист; все24 assets совпадают ключами и байтами с актуальной generatedfolder |
| Font cleanup | В APKfontdirectory только `Rubik.ttf` и `OFL.txt`; Tiny5/Numbers/старые licenses отсутствуют |
| Референсы | JPG/JPEG/PNG assets отсутствуют; собственные SVG/card markup остаются |
| Размер APK | 1073438байт |
| SHA256 APK | `093d4cd3199849a0746469278464ba59c6f2be60fde646c5fae1471fcd81740a` |
| Передаваемая копия | `/workspace/scratch/669d7c37bc9d/pierrot-0.3.6-preview.apk` |

Package/signature не менялись: обеспечена совместимость обновления0.3.4/0.3.5-preview. Установка и WebView на реальном Android здесь не проверены. Браузерные проверки выполняет Lead независимо; нативная компиляция/packaging не доказывают device runtime.

### Фактическая сборка0.3.7-preview: добор после подсчёта

После окончательного сигнала Lead о готовности UI и независимого QA выполнен свежий prepareAndroid, затем настоящий Wrapper `android/build-debug.sh --no-daemon`: **exit0, BUILD SUCCESSFUL in12s**,35 задач:9 executed/26up-to-date. UI assets/Manifest/resources/package пересобраны; Kotlin code unchanged. Лог: scratch `toolchains/probes/pierrot-0.3.7-final-build.log`.

Перед сборкой проверен сохранённый debugkey; новый не создавался. ApplicationId `ru.cardcascade.game.preview` и SHA256 signer `5ff24a25ecf6b43e6ae02ee44c2568fcffd335f9a2c9222dd1892168e8d40d8e` совпадают с0.3.4–0.3.6. VersionCode10/versionName0.3.7-preview; label «Пьеро».

| Проверка | Результат0.3.7 |
| --- | --- |
| Подпись | apksigner verify успешен, schemev2, тот же signer |
| Activity/API | `ru.cardcascade.game.MainActivity`; minSdk26, target/compileSDK36 |
| Разрешения | uses-permission отсутствуют, INTERNET/storage нет |
| ZIP/freshness | testzip чист; все25 assets совпадают ключами и байтами с актуальной generatedfolder |
| Новый content | `src/content/decks.js` присутствует в APK; актуальные app/play-animation включены bytecomparison |
| Fonts | Только `Rubik.ttf` и `OFL.txt`; Tiny5/Numbers отсутствуют |
| Референсы | JPG/JPEG/PNG assets отсутствуют |
| Размер APK | 1074131байт |
| SHA256 APK | `1aab727e4132e33743d8b9f92ace87503dabaaa9f59f4c9b8fe781e74fe82c45` |
| Передаваемая копия | `/workspace/scratch/669d7c37bc9d/pierrot-0.3.7-preview.apk` |

Совместимость обновленияpreview0.3.4–0.3.6 обеспечена одинаковыми package/signature и увеличенным versionCode. Установка на физическом Android и WebView runtime здесь не проверялись; browserQA проводится Lead отдельно. Packaging сам по себе не является проверкой поведения на устройстве.

### Фактическая сборка0.3.8-preview: выравнивание HUD и подписи кнопок

После готовности исходников Lead выполнены свежий prepareAndroid и настоящий Wrapper `android/build-debug.sh --no-daemon`: **exit0, BUILD SUCCESSFUL in15s**,35 задач:9 executed/26up-to-date. В UI assets присутствуют новые подписи «Партия» и «Настройки», выравнивание blue/right и red/left и обновлённая геометрия кнопки options. Проверкаassets bytecomparison покрывает все актуальные UI файлы. Лог: scratch `toolchains/probes/pierrot-0.3.8-final-build.log`.

| Проверка | Результат0.3.8 |
| --- | --- |
| Подпись | apksigner verify успешен; signerSHA256 `5ff24a25ecf6b43e6ae02ee44c2568fcffd335f9a2c9222dd1892168e8d40d8e`, совпадает с0.3.4–0.3.7 |
| Package/version/label | `ru.cardcascade.game.preview`; code11/0.3.8-preview; «Пьеро» |
| Activity/API | `ru.cardcascade.game.MainActivity`; minSdk26, target/compileSDK36 |
| Разрешения | uses-permission отсутствуют, INTERNET/storage нет |
| ZIP/freshness | testzip чист; все25 assets совпадают ключами и байтами с актуальной generatedfolder |
| Fonts/references | Только Rubik.ttf/OFL.txt; JPG/JPEG/PNG assets отсутствуют |
| Размер APK | 1074211байт |
| SHA256 APK | `020c30268912401340fe93249432a10d8df40cc2014b7cc5a018402eb7838cdb` |
| Передаваемая копия | `/workspace/scratch/669d7c37bc9d/pierrot-0.3.8-preview.apk` |

Одинаковые package/signature и больший versionCode сохраняют Androidupdate compatibility сpreview0.3.4–0.3.7. Изменения UI проверяет Lead в браузере отдельно. На физическом Android и реальном WebView сборка здесь не запускалась.

### Фактическая сборка0.3.9-preview: подсказки и жесты карт

После сигнала GO Lead о стабильных productionUI sources выполнены свежий prepareAndroid и настоящий Wrapper `android/build-debug.sh --no-daemon`: Первый build прошёл за13s; после независимого QA исправления selectedlift в live insertion повторно выполнены свежий prepareAndroid и Wrapper: **exit0, BUILD SUCCESSFUL in8s**,35 задач:3 executed/32up-to-date. UI assets/package перепакованы. Лог итоговой пересборки: scratch `toolchains/probes/pierrot-0.3.9-final-build.log`.

Package/signingkey не менялись. Версии package.json, Androidconfig и UI badge согласованы0.3.9; versionCode12. APK проверен отдельно: **25 assets byte-identical generatedfolder и всем текущим src/web files**, включая field tooltip/liveinsertion, score-animation liftScoringCards. Это подтверждение актуальности кода, не заявление о runtime QA.

| Проверка | Результат0.3.9 |
| --- | --- |
| Подпись | apksigner verify успешен; signerSHA256 `5ff24a25ecf6b43e6ae02ee44c2568fcffd335f9a2c9222dd1892168e8d40d8e`, прежний previewkey |
| Package/version/label | `ru.cardcascade.game.preview`; code12/0.3.9-preview; «Пьеро» |
| Activity/API | `ru.cardcascade.game.MainActivity`; minSdk26, target/compileSDK36 |
| Разрешения | uses-permission отсутствуют, INTERNET/storage нет |
| ZIP/assets | testzip чист; 25 файлов актуальны |
| Fonts/references | Только Rubik.ttf/OFL.txt; JPG/JPEG/PNG assets отсутствуют |
| Размер APK | 1078658байт |
| SHA256 APK | `44cd6286c35b11b963bd3150bd7bae3a522a75947074271f827af9326ddef2fa` |
| Передаваемая копия | `/workspace/scratch/669d7c37bc9d/pierrot-0.3.9-preview.apk` |

Одинаковые package/signature и больший versionCode сохраняют совместимость обновленияpreview0.3.4–0.3.8. UI QA выполняется Lead отдельно; на физическом Android/WebView эта сборка здесь не запускалась. Library saving выполняет Lead, агент сборки его не производил.

### Фактическая сборка0.4.0-preview: integer HUD и пламя

После сигнала GO Lead по окончательным UI sources выполнены свежий prepareAndroid и настоящий Wrapper `android/build-debug.sh --no-daemon`: Первый build прошёл15s; после QA исправления clamp RAFprogress0..1 выполнен повторный prepareAndroid/Wrapper: **exit0, BUILD SUCCESSFUL in8s**,35 задач:3 executed/32up-to-date. Лог: scratch `toolchains/probes/pierrot-0.4.0-final-build.log`. Package.json, Androidversion и UI badge согласованы0.4.0; versionCode13.

APK проверен отдельно от Gradle: testzip чист, **26 assets byte-identical generatedfolder и всем актуальным src/web files**, включая numeric RAF animation module, финальный flame.js и CSS widths. Rubik.ttf/OFL.txt — единственные fontfiles. Это подтверждение актуальности упакованного кода; browser/runtime QA выполняется отдельно Lead.

| Проверка | Результат0.4.0 |
| --- | --- |
| Подпись | apksigner verify успешен; signerSHA256 `5ff24a25ecf6b43e6ae02ee44c2568fcffd335f9a2c9222dd1892168e8d40d8e`, неизменный previewkey |
| Package/version/label | `ru.cardcascade.game.preview`; code13/0.4.0-preview; «Пьеро» |
| Activity/API | `ru.cardcascade.game.MainActivity`; minSdk26, target/compileSDK36 |
| Разрешения | uses-permission отсутствуют, INTERNET/storage нет |
| ZIP/assets | testzip чист; 26 актуальных файлов |
| Размер APK | 1078255байт |
| SHA256 APK | `33518785e482df2629cd58fded269bd9a67861c5b7787568dd756d947dffb21e` |
| Передаваемая копия | `/workspace/scratch/669d7c37bc9d/pierrot-0.4.0-preview.apk` |

Package/signature не менялись, code увеличен: обновлениеpreview0.3.4–0.3.9 совместимо. На физическом Android/WebView эта сборка здесь не запускалась. Сохранение пользовательских артефактов выполняет Lead; агент сборки Library не использовал.

### Фактическая упаковка0.4.1-preview: обновление UI assets без нативной перекомпиляции

После повторного сброса scratch Lead восстановил исходники0.4.0, проверенный APK0.4.0 и отдельно сохранённый signingkey. Изменения0.4.1 касаются только JavaScript/CSS/UI; Kotlin/native/resources не менялись. Чтобы не загружать полный SDK/Gradle повторно, по решению Lead использован проверяемый repack прежнего APK. **Gradle для этой итоговой сборки0.4.1 не запускался; новая нативная компиляция не заявляется.**

Официальные GoogleBuildTools35 (`https://dl.google.com/android/repository/build-tools_r35_linux.zip`) получены и SHA1 `2cfaa0bbb2336e9ec18ed3ecea84fa2e2af607bc` проверен до распаковки. Использованы настоящие aapt/zipalign/apksigner на системном OpenJDK17.0.20. Chromium1187 восстановлен отдельно по указанному ранее официальному URL/SHA256 для browserQA; он не входит в APK.

Входной APK0.4.0 имеет подтверждённый SHA256 `33518785e482df2629cd58fded269bd9a67861c5b7787568dd756d947dffb21e`. Выполнен свежий `npm run android:assets`, удаляющий старый generatedfolder. ZIP entriesassets полностью заменены актуальным деревом. AndroidManifest.xml изменён на уровне бинарного AXML: versionCode typed attribute с resourceID0x0101021b изменён13→14; versionName stringattribute0x0101021c и соответствующая same-length stringpoolстрока изменены0.4.0-preview→0.4.1-preview. Остальные manifestfields не правились. Старые META-INF signatureentries исключены; официальный zipalign выровнялAPK4байта, затем apksigner подписал прежним приватным checkpoint. Пароль/ключ не включены в продуктовые исходники.

| Проверка | Результат0.4.1 |
| --- | --- |
| Подпись | apksigner verify успешен; signerSHA256 `5ff24a25ecf6b43e6ae02ee44c2568fcffd335f9a2c9222dd1892168e8d40d8e`, прежний previewkey |
| Manifest через aapt | `ru.cardcascade.game.preview`; code14/0.4.1-preview; label «Пьеро» |
| Activity/API | `ru.cardcascade.game.MainActivity`; minSdk26, target/compileSDK36 |
| Разрешения | uses-permission отсутствуют, INTERNET/storage нет |
| ZIP/assets | testzip чист; все26assets byte-identical generatedfolder и актуальным src/web |
| Нативная часть | Все12 non-assets/non-signatureentries кроме изменённогоManifest byte-identical APK0.4.0; DEX/resources сохранены |
| Fonts | Rubik.ttf/OFL.txt — единственныеfontfiles |
| Alignment | `zipalign -c -p 4` успешен после подписи |
| Размер APK | 973826байт |
| SHA256 APK | `c985f79a04aca303565d2e10180a8087dae3f995869d9c250a8702e435b02f9d` |
| Передаваемая копия | `/workspace/scratch/669d7c37bc9d/pierrot-0.4.1-preview.apk` |

Размер отличается отGradleAPK вследствие ZIPперепаковки/сжатия, не удаления ресурсов приложения: nativeentry bytecomparison и полноеassetcomparison пройдены. Package/signature сохранены, versionCode увеличен — обновление прежнихpreview совместимо. На физическом Android/WebView APK здесь не запускался; browserQA выполняет Lead отдельно. Будущие Kotlin/ресурсные изменения требуют полноценной Gradleкомпиляции, repack годится лишь для текущего UI-only изменения.

### Фактическая упаковка0.4.2-preview: modal layering и пламя

После GO Lead и последнего QAfix queuedclose выполнены свежие `npm run android:assets` и `npm run preview:export`. Финальный app.js с синхроннымcancel и guard `if(dialog.open)return` совпадает байт-в-байт с APK; предыдущая intermediateподпись1cad… не передаётся. Применён тот же UI-only repack с официальными BuildTools35; **Gradle/nativeкомпиляция0.4.2 не выполнялись**. Входной APK0.4.1 SHA256 `c985f79a04aca303565d2e10180a8087dae3f995869d9c250a8702e435b02f9d` проверен. Всеassets заменены, typedAXMLversionCode14→15/versionName0.4.1-preview→0.4.2-preview обновлены по resourceID, прежняя подпись удалена и пересоздана сохранённымpreviewkey через официальныйapksigner послеzipalign.

| Проверка | Результат0.4.2 |
| --- | --- |
| Подпись | apksigner verify успешен; signerSHA256 `5ff24a25ecf6b43e6ae02ee44c2568fcffd335f9a2c9222dd1892168e8d40d8e`, неизменный previewkey |
| Manifest через aapt | `ru.cardcascade.game.preview`; code15/0.4.2-preview; label «Пьеро» |
| Activity/API/permissions | `ru.cardcascade.game.MainActivity`; minSdk26, target/compileSDK36; uses-permission отсутствуют |
| ZIP/assets | testzip чист; все26assets byte-identical generatedfolder и текущим src/web, включая финальныеappmodal/flamechanges |
| Нативная часть | Все12 non-assets/non-signatureentries кроме изменённогоManifest byte-identical APK0.4.1; DEX/resources неизменны |
| Fonts/alignment | Только Rubik.ttf/OFL.txt; `zipalign -c -p 4` успешен после подписи |
| Размер APK | 973826байт |
| SHA256 APK | `79df65acc5cb9da0de8a555681ef830d4e1c26fc3e4010ec39fbdb77bf201c37` |
| Передаваемая копия | `/workspace/scratch/669d7c37bc9d/pierrot-0.4.2-preview.apk` |

Package/signature сохранены, versionCode увеличен, previewupdate compatibility сохраняется. Здесь APK не запускался на физическом Android/WebView; browserQA выполняют Lead/QAагент отдельно. Нативные изменения требуют последующей полноценной Gradleкомпиляции. Library saving этот агент не выполнял.

### Фактическая упаковка0.4.3-preview: устранение цветового шва огня

После GO Lead и окончательного QAfix source-atop blend корней y45→58 выполнены свежие `npm run android:assets` и `npm run preview:export`, затем UI-only repack официальными BuildTools35. **Gradle/nativeкомпиляция0.4.3 не выполнялись.** Входной финальный APK0.4.2 SHA256 `79df65acc5cb9da0de8a555681ef830d4e1c26fc3e4010ec39fbdb77bf201c37` подтверждён. Всеassets заменены актуальными src/web; typedAXML versionCode15→16 и versionName0.4.2-preview→0.4.3-preview изменены по resourceID/stringpool. Подпись обновлена сохранённымpreviewkey после zipalign.

| Проверка | Результат0.4.3 |
| --- | --- |
| Подпись | apksigner verify успешен; signerSHA256 `5ff24a25ecf6b43e6ae02ee44c2568fcffd335f9a2c9222dd1892168e8d40d8e`, прежний previewkey |
| Manifest через aapt | `ru.cardcascade.game.preview`; code16/0.4.3-preview; label «Пьеро» |
| Activity/API/permissions | `ru.cardcascade.game.MainActivity`; minSdk26, target/compileSDK36; uses-permission отсутствуют |
| ZIP/assets | testzip чист; 26assets byte-identical generatedfolder и текущим src/web, включая финальные flame gradients/colors/opacity |
| Нативная часть | 12non-assets/non-signatureentries кроме versionManifest byte-identical APK0.4.2; DEX/resources неизменны |
| Fonts/alignment | Только Rubik.ttf/OFL.txt; `zipalign -c -p 4` успешен после подписи |
| Размер APK | 973826байт |
| SHA256 APK | `9a79392420fd533f36712d8f73c8518cce1cb55b10483ead30b64e23a9da8261` |
| Передаваемая копия | `/workspace/scratch/669d7c37bc9d/pierrot-0.4.3-preview.apk` |

Package/signature не менялись, versionCode увеличен. На физическом Android/WebView сборка здесь не запускалась; browserQA выполняются Lead/QAагентом отдельно. Перепаковка допустима для текущего UI-only изменения; новые Kotlin/resources требуют Gradleкомпиляции. Librarysaving агент сборки не выполнял.

### Фактическая упаковка0.4.4-preview: центрирование × в HUD

После GO Lead по стабильным layout/CSS sources выполнены свежие `npm run android:assets` и `npm run preview:export`, затем UI-only repack официальными BuildTools35. **Gradle/nativeкомпиляция0.4.4 не выполнялись.** Входной финальный APK0.4.3 SHA256 `9a79392420fd533f36712d8f73c8518cce1cb55b10483ead30b64e23a9da8261` подтверждён. Всеassets заменены актуальными src/web; typedAXML code16→17/name0.4.3-preview→0.4.4-preview изменены по resourceID/stringpool. APK выровнен и подписан сохранённымpreviewkey.

| Проверка | Результат0.4.4 |
| --- | --- |
| Подпись | apksigner verify успешен; signerSHA256 `5ff24a25ecf6b43e6ae02ee44c2568fcffd335f9a2c9222dd1892168e8d40d8e`, прежний previewkey |
| Manifest через aapt | `ru.cardcascade.game.preview`; code17/0.4.4-preview; label «Пьеро» |
| Activity/API/permissions | `ru.cardcascade.game.MainActivity`; minSdk26, target/compileSDK36; uses-permission отсутствуют |
| ZIP/assets | testzip чист; все26assets byte-identical generatedfolder и текущим src/web, включая layouttimes `[275,362,33,57]` и gridcenter CSS |
| Нативная часть | Все12 non-assets/non-signatureentries кроме versionManifest byte-identical APK0.4.3; DEX/resources неизменны |
| Fonts/alignment | Только Rubik.ttf/OFL.txt; `zipalign -c -p 4` успешен после подписи |
| Размер APK | 973826байт |
| SHA256 APK | `f8e9fa3a97212eb518a4c8548d14e6877443c80a1b55c637332178b7fb20e1a8` |
| Передаваемая копия | `/workspace/scratch/669d7c37bc9d/pierrot-0.4.4-preview.apk` |

Package/signature сохранены, versionCode увеличен. Физический Android/WebView здесь не запускался, browserQA выполняют Lead/QAагент отдельно. Для будущих Kotlin/resources изменений требуется полноценная Gradleкомпиляция. Librarysaving агент сборки не выполнял.
