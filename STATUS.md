# Пьеро0.4.62 — релиз для RuStore

03.11.2026 пользователь принял игру как релиз и поручил финальныйpush, иконкуAPK и подготовку данныхRuStore. Ветка release/rustore-0.4.62, репозиторий kotlyakov/Perriot-android. Релизная версия0.4.62/code76, package ru.cardcascade.game.preview. Предыдущая0.4.62-preview/code75 сохраняется отдельно.

**Проверенный игровой source:** 36fce8ac492ec8b34112ed4173cfb2741901d0ed, tree03db06c7701a91fd1b778310abba690a35b06a40. Последующие изменения — магазинные материалы/документация/подписание/проверка тега, игровыеassets не меняются. Тегv0.4.62 создаётся только после успешного CI правильного workflow и проверки подписанногоAPK.

**Итог:** собственная иконкаПьеро, пятьdensityPNG+adaptiveforeground иroundIcon; release variant, debuggablefalse, WebViewdebugfalse;0разрешений Android. Игровой код и утверждённыеАрканы не менялись.

**CI41633037201 SUCCESS:**1975corePASS/0FAIL/2optionalprivate skips;13browser suites;4реальныхstorecaptures1920×1080; freshGradlecleanassembleRelease послеcore/browser. Nativevariant иpermissions провереныaapt, unsignedalignedAPK подписан официальнымapksigner постояннымRSA4096PKCS12 внеGit. Localverify v2/v3/zipalign16KB, manifest76/0.4.62,124assetsbyteequal,6icons pixel-equal,ZIPCRC PASS. SHA256APK 30f264627779e0c1e93aca68f079eb2e83549cfbd26cc19a37ef35a18f56ec73; размер1420129байт. Публичный сертификатSHA256 8871b8800eb3a5b3bfe5bae099c916418899796f7f12e6c899aa73d241e3620d; CN=Pierrot Release,OU=Games; неAndroidDebug.

**Постоянный ключ:** приватная резервнаякопия сохранена отдельно как Pierrot-release-signing-PRIVATE.zip. ВGit и RuStoreкомплекте только публичныйPEM. Не генерировать новыйключдляследующихверсий; увеличиватьversionCode. Previewподписи несовместимы, старуюигрусданными не удалять. Физическаяустановка/FPSздесь не проверялись. Androidподтверждениеустановкиисточника неуправляетсяизAPK; игра сама не запрашиваетразрешения.

**Магазинныйкомплект:** rustore/README.md,metadata.json,short/full-description,release-notes,data-safety,privacy-policy,icon512. Screenshots генерируются scripts/capture-rustore.mjs; поставляются вPierrot-0.4.62-RuStore.zip сAPK/верификацией/контрольнымисуммами. Без приватногоключа. Возраст12+/Страх и ценаfree — предложениядляподтвержденияиздателем; контакты — публичныйтрекерGitHub, вымышленныхданныхнет.

**Ревью:** Criticalнет; gateпринималлюбойуспешныйworkflow — исправлено: проверяютсяpath/status/repo/branch/source/conclusion иpinnedcert. Реальныйshellgate: validPASS;wrongworkflow/running/wrongsource/wrongrepoотклоняются. Минорныезамечания: добавленыявнаяпроверкаv3 ираскрытиечтениябуферапо«Вставить».

ВRuStoreне загружено инамодерациюнеотправлено. Следующее: проверкапользователемнаустройстве, подтверждениеполейизREADME иотдельноепоручениенаотправку. Остальнойбэклогсохраняется.

[APKрелиза](https://chatgpt.com/library?file_id=libfile_c2c9d457ff348191a88514c9e8746163&account_id=personal) · [КомплектRuStore](https://chatgpt.com/library?file_id=libfile_6def33cc1bac8191bbb4d97e8ad00ee9&account_id=personal).

Финальнаяфиксация: тег v0.4.62 →36fce8ac492ec8b34112ed4173cfb2741901d0ed подтверждёнGitHubAPI; tag-gateCI41634662089SUCCESS. Метаданные/комплектопубликованывrelease/rustore-0.4.62 на4bc822edea5775f766bb653f5e2fc0c18e08c41d; последующаястрокастатусанеменяетрелиз.
