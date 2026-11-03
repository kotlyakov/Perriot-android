# Релиз0.4.62 и пакет RuStore

Поручение: пользователь принял0.4.62 как релиз, просит push, красивую Androidиконку и подготовку к загрузке вRuStore. Публикацию в самомRuStore не выполнять.

База f9131be, предыдущая проверенная сборка d9106e4/code75. Игровой код не меняется. Сохраняем package ru.cardcascade.game.preview, versionName0.4.62, увеличиваем versionCode76; прежняя previewподпись не может стать постоянной без приватного ключа.

- [x] Собственный AIicon: store512PNG, densityicons48..192, adaptiveicon с безопасными полями; manifesticon/roundIcon.
- [x] Release variant debuggablefalse;0uses-permission; WebViewdebuggingexplicitfalse. NativeCI assembleRelease/zipalignunsigned после1975core/13browser. Секретный постоянный RSA4096 PKCS12 хранится внеGit, резервнаякопия отдельно; вGit только публичныйPEM иSHA256.
- [x] Подписать официальный unsignedAPK официальным apksigner с постоянным ключом; verify v2/v3 иzipalign; проверитьmanifest76/release/debuggablefalse/icons/assets/CRC.
- [x] Реальные4screens1920×1080 из настоящих игровыхсостояний, включаябой/магазин/Арканы; тексты карточки, безопасностьданных, privacypolicy, release-notes, READMEдляконсоли. Заполнить только подтверждённые поля. Возраст и контентные маркировки — проект для подтверждения издателем.
- [x] Проверить медиа/комплект, сохранить APK+RuStoreZIP и отдельно приватную резервнуюкопию, push и неизменяемый релизныйтег. ВRuStore не отправлять без отдельного поручения.

Официальные требования сверены03.11.2026: rustore.ru/help/developers/publishing-and-verifying-apps/app-publication иrequirement-apps. Иконка512×512≤3МБ с полнымфоном; минимум3скриншота, рекомендуемые16:9; описание80/4000знаков; debugmode/cert не длямагазина. Androidподтверждение sideloadизисточника нельзя убратьизAPK; приложение само не запрашивает системных разрешений.

CI41633037201SUCCESS. Подписьv2/v3,zipalign,manifest76/debugfalse/0permissions/124assets/6iconsPASS. Реальныйshellgateправильногоworkflowпроверенположительнои4отрицательнымисценариями. Ключприватносохранён, впубличныхматериалахнет. Механикинеменялись. ПубликациявRuStoreнепроизводилась.
