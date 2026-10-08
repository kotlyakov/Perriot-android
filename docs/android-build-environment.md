> Историческая диагностика до создания оболочки. В текущем срезе0.3.1 блокер сборки снят: установлен toolchain, включён настоящий Wrapper, compileDebugKotlin/assembleDebug успешны. Актуальный протокол — android-toolchain-attempt.md. Установка/устройство ещё не проверены. Нижеследующие отсутствие файлов/инструментов относятся только к первоначальному осмотру.

# Android: состояние среды сборки

Проверено 07.10.2026 в `/workspace/scratch/669d7c37bc9d/android-card-roguelike`. Это диагностика среды и следующий путь к сборке, не отчёт о готовом APK. Прочитаны `ROADMAP.md`, `docs/design.md` и `docs/contracts.md`. Установки, скачивания, изменения кода и сборка не выполнялись.

## Подтверждённые факты

| Проверка | Результат |
| --- | --- |
| `command -v java`; `java -version` | `/usr/bin/java`; OpenJDK Runtime **17.0.20**, build `17.0.20+8-1-24.04-Ubuntu` |
| `command -v javac` | Не найден; `/usr/lib/jvm/java-17-openjdk-amd64/bin/javac` также отсутствует. Полный JDK не подтверждён |
| `command -v gradle` | Не найден; `/opt/gradle` и стандартный каталог кеша Wrapper `$HOME/.gradle/wrapper/dists` отсутствуют |
| `command -v adb`, `sdkmanager`, `emulator`, `android` | Ни один инструмент не найден в PATH; их версии получить нельзя |
| Переменные `JAVA_HOME`, `ANDROID_HOME`, `ANDROID_SDK_ROOT` | Не заданы |
| Android SDK, стандартные пути | Не найдены `/opt/android-sdk`, `/opt/android-sdk-linux`, `/usr/local/lib/android/sdk`, `/usr/local/android-sdk`, `/usr/lib/android-sdk`, `/opt/android`, `$HOME/Android/Sdk`, `$HOME/android-sdk` |
| Android Studio, стандартные пути | `/opt/android-studio`, `/usr/local/android-studio` отсутствуют |
| Android-проект | Каталог `android/`, Manifest, Gradle build/settings и Wrapper не найдены |
| Интерфейс для упаковки | `src/ui/` отсутствует на момент проверки |
| Проверки JavaScript | `node --version`: **v24.19.0**; `package.json` задаёт `npm test` → `node --test`, минимум Node 22. Тесты в этой диагностике не запускались |

Поиск ограничен PATH, указанными стандартными путями и файлами этого проекта. Это не утверждение, что инструменты отсутствуют во всём filesystem. Устройство/USB и сеть репозиториев зависимостей не проверялись.

## Блокеры

1. Нет подтверждённого полного JDK, доступного Gradle Wrapper и SDK с платформой/Build Tools. Сейчас команду `./gradlew :app:assembleDebug` выполнить нельзя: отсутствует сам Android-проект.
2. Нет HTML/CSS-интерфейса для упаковки, Activity и файлового моста. Даже успешная сборка пустой оболочки ещё не даст играбельный APK.
3. Не определены минимальная версия Android и тестовое устройство; работа установленного WebView с JS modules и BigInt требует отдельной проверки. Без `adb` и устройства/эмулятора установка, жесты и lifecycle не проверены.
4. Загрузка зависимостей Google Maven/Maven Central и дистрибутива Gradle не проверена. Наличие браузерного доступа к документации не доказывает доступность этих репозиториев для сборки.

## Минимальный следующий путь

1. Подготовить среду сборки: полный **JDK 17**, Android SDK и принятие необходимых лицензий, затем проверить `java -version`, `javac -version` и установленные SDK-пакеты. Для начального каркаса есть документированная совместимая основа **AGP 8.13.2 + Gradle 8.13**, SDK Platform **36**, Build Tools **35.0.0**. Это предложение для будущей фиксации, сейчас версии не установлены. AGP 8.13 поддерживает до API 36.1; 8.13.2 поддерживает Kotlin 2.3. Точные Kotlin/AndroidX WebKit версии и `minSdk` закрепить при создании каркаса, без динамических зависимостей. Источник: [официальная таблица AGP 8.13](https://developer.android.com/build/releases/agp-8-13-0-release-notes).
2. Создать один модуль `android/app`: отдельные namespace/application ID, Manifest, Kotlin Activity с WebView, фиксированный Gradle Wrapper и контрольная сумма его дистрибутива. NDK и runtime-сервер этому пути не нужны. Wrapper запускает закреплённую Gradle-версию без обязательной глобальной установки: [Gradle Wrapper](https://docs.gradle.org/current/userguide/gradle_wrapper.html).
3. Упаковать локальный интерфейс и ES modules в assets. Загружать через `WebViewAssetLoader` по `https://appassets.androidplatform.net/assets/index.html`; блокировать произвольную навигацию. Android Developers рекомендует такой локальный HTTPS origin для JS/CSS и same-origin: [Load in-app content](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content). Мост — только сохранение/загрузка валидированного `SaveData` и системный выбор файла для импорта/экспорта; атомарная запись/backup пока не реализованы по контракту.
4. Из `android/` выполнить `./gradlew --version`, затем `./gradlew :app:assembleDebug`. Только после успешного завершения искать `app/build/outputs/apk/debug/app-debug.apk` и фиксировать фактические версии и checksum. Это проверка сборки, не установки.
5. На доступном устройстве или эмуляторе выполнить установку через `adb`, затем проверить локальную загрузку без сети, касания, Назад, паузу/возобновление, сохранение/восстановление и picker. Эмулятор/образ нужны для этого шага, а не для самой сборки APK.

Для provisioning использовать Android Studio SDK Manager или актуальный Android CLI. Официальная страница теперь помечает `sdkmanager` устаревшим и указывает `android sdk`; старый инструмент по-прежнему описан для Command-Line Tools. См. [SDK manager](https://developer.android.com/tools/sdkmanager). В этой среде не обнаружен ни один из них.

Сейчас доступны дальнейшая разработка и Node-проверки ядра/формата сохранений, проверка будущих assets и контрактов оболочки. Android-сборка и испытание приложения остаются невыполненными.
