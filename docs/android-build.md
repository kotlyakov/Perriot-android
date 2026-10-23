# Android-оболочка — промежуточная версия

07.10.2026. Создан один модуль Kotlin/WebView без AndroidX, NDK и runtime-сервера. Оболочка скомпилирована и debug APK собран; установка на устройстве ещё не проверена. Интерфейс и ядро подготавливаются командой `npm run android:assets` из корня: `index.html`, `web/**`, локальные модули `src/**` попадают в `android/app/src/main/assets/`. Оригинальные скриншоты туда не копируются. Приложение называется «Пьеро», пакет `ru.cardcascade.game`; версия `0.3.4-preview` обозначает неполную сборку, а не версию оригинала.

## Закреплённый стек

| Компонент | Версия |
| --- | --- |
| Android Gradle Plugin | 8.13.2 |
| Gradle | 8.13 |
| Kotlin plugin | 2.3.21 |
| JDK / JVM target | 17 |
| compileSdk / targetSdk | 36 / 36 |
| Build Tools | 35.0.0 |
| minSdk | 26 — решение проекта, не заявленная граница оригинала |

Версии AGP/Gradle/JDK/Build Tools проверены 07.10.2026 по [официальной таблице AGP8.13](https://developer.android.com/build/releases/agp-8-13-0-release-notes); она подтверждает Kotlin2.3. Kotlin2.3.21 существует в [истории выпусков Kotlin](https://kotlinlang.org/docs/releases.html). Минимальный AndroidAPI сам по себе не гарантирует современный WebView: ESmodules и BigInt требуют подходящей установленной версии WebView; на устройстве проверка ещё не выполнена.

## Сборка

1. Установить полный JDK17, AndroidSDK Platform36 и BuildTools35.0.0, принять лицензии. Задать `JAVA_HOME`/`ANDROID_HOME` или локальный `android/local.properties` с `sdk.dir`. Не добавлять локальные пути в архив исходников.
2. Из корня выполнить `npm run android:assets`.
3. Выполнить `android/build-debug.sh`; ожидаемый файл при успешной сборке: `android/app/build/outputs/apk/debug/app-debug.apk`.
4. Настоящий Gradle8.13 Wrapper и distributionSha256Sum включены. Первая сборка требует доступа к официальному дистрибутиву и GoogleMaven/MavenCentral; глобальная установка Gradle не нужна.

В этой сессии установлены JDK17/SDK36/BuildTools35.0.0, выполнены compileDebugKotlin и assembleDebug. Протокол и checksum: android-toolchain-attempt.md. versionCode7, debug-подпись; это проверочная промежуточная сборка. Устройство/эмулятор, WebView runtime и физическое прерывание AtomicFile ещё не проверены.

## Офлайн загрузка и граница доверия

Activity открывает `https://appassets.androidplatform.net/index.html`. Собственный `WebViewClient` отдаёт байты только через `AssetManager` для точного HTTPS-host, без порта/query/userinfo и с безопасными сегментами пути. JSmodules имеют `text/javascript`. Внешняя навигация и неизвестные расширения заблокированы; ответы CSP запрещают внешние scripts/connect, frames, objects и формы. `file://`/content доступ выключен; Manifest не запрашивает INTERNET или общий storage. Политика HTTPS-origin следует [Android Load in-app content](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content); реализация использует собственный interceptor вместо AndroidX WebViewAssetLoader.

Ориентация landscape, системные панели скрыты, системные вырезы исключены theme-настройкой. Жест пользователя может временно показать панели. Подстройку на больших экранах/API36 и фактические windowinsets ещё проверять на устройстве. Назад вызывает синхронный `window.cardGameBack()`: `true` означает закрытый верхний диалог; другое значение завершает Activity. `onPause` вызывает `window.cardGamePause()` если функция существует. Надёжность записи при остановке процесса обеспечивается сохранением JS сразу после действия; `onPause` — дополнительная попытка, а не гарантия доставки JS перед kill.

## Файловый мост

`window.CardStorage` предоставляет только следующие синхронные методы:

| Метод | Контракт |
| --- | --- |
| `read('current'|'backup')` | UTF8-текст; `''` только при отсутствии; ошибка чтения/пустой/слишком большой/повреждённыйUTF8 файл вызывает исключение |
| `writeCurrent(text)` | `true` после атомарной записи; `false` при ошибке |
| `writeBackup(text)` | То же для резервной копии |

Файлы находятся в приватном `filesDir/current.json` и `backup.json`. Нативный код проверяет 2MiB, корректный UTF8 и JSON-envelope `card-cascade-save`version1 до открытия записи. **Полную семантическую проверку GameState обязан выполнить JS `deserializeState` перед любым write.** Служебные envelope-проверки Kotlin не дублируют всю модель правил и не являются её заменой. JS оркестрирует удержание последней валидной версии и восстановление; Kotlin не принимает решение перезаписывать повреждённый slot и не создаёт новый забег автоматически.

Запись использует платформенный [AtomicFile](https://developer.android.com/reference/android/util/AtomicFile): startWrite → finishWrite / failWrite. Общая synchronized-блокировка сериализует оба slot. Это атомарность каждого файла, не двухфайловая транзакция; промежуток между backup и current проверяется recovery-сценариями JS. Реальный сбой питания/диск/full-storage ещё не проверен. Import/export picker в этот этап не входит.

## Проверки этой итерации

`python android/tools/check-config.py` проверяет XML, отсутствие разрешений, landscape, блокировки WebView/CSP и присутствие операций AtomicFile/лимитов. `sh -n android/build-debug.sh` проверяет синтаксис запуска. Это **статические проверки**, не компиляция Kotlin, не подтверждение runtime atomicity и не Android UI-тесты.

0.3.2: useWideViewPort/loadWithOverviewMode включены для viewport meta. Масштаб поля вычисляется из root client box, защищённого от расширения содержимым. Приложение переименовано в «Пьеро»; идентификатор пакета и save keys не менялись.

0.3.4: applicationId ru.cardcascade.game.preview, namespace ru.cardcascade.game. Отдельная установка вызвана утратой старого debugkeystore; новый signer не совместим с0.3.3. Не предлагать uninstall ради обновления. Старое приложение остаётся отдельно; новый signingcheckpoint сохраняется вне sourceZIP.
