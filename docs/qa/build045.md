# APK0.4.5-preview — проверка упаковки

Сборочная роль после GO Lead выполнила fresh `npm run android:assets`/`npm run preview:export` и UI-only repack официальными BuildTools35. Gradle и новая native compilation не выполнялись. Это допустимо для текущих JS/CSS изменений cashout и shop-entry shell; nativeKotlin/resources неизменны.

Baseline APK0.4.4 подтверждён SHA256 `f8e9fa3a97212eb518a4c8548d14e6877443c80a1b55c637332178b7fb20e1a8`. Script `repack045.py` изменил typedAXMLversionCode17→18/name0.4.4-preview→0.4.5-preview по resourceID и заменил всеassets. После официальных zipalign/apksigner APK подписан сохранённымpreviewkey; приватный checkpoint не включён в исходники/APKassets.

| Проверка | Результат |
| --- | --- |
| apksigner | verify успешен; signerSHA256 `5ff24a25ecf6b43e6ae02ee44c2568fcffd335f9a2c9222dd1892168e8d40d8e`, прежнийkey |
| aapt Manifest | `ru.cardcascade.game.preview`, code18/name0.4.5-preview, label «Пьеро» |
| API/activity | minSdk26, target/compile36, `ru.cardcascade.game.MainActivity` |
| Permissions | uses-permission отсутствуют, INTERNET/storage нет |
| ZIP | testzip чист; zipalign -c -p4 успешен после подписи |
| Assets | Все28 файлов byte-identical generatedfolder и текущим src/web, включая post-round.js/cashout.js |
| Native | Все12 non-assets/non-signatureentries кроме versionManifest byte-identical baseline0.4.4 |
| Fonts | Только Rubik.ttf/OFL.txt |
| APK размер | 978067байт |
| SHA256 APK | `b9a1c434fc5b97351d7b45199ca6b8b0bd504758d2546e58ac79079bccbdcf8b` |
| Путь | `/workspace/scratch/669d7c37bc9d/pierrot-0.4.5-preview.apk` |

Пакет/подпись сохранены иversionCode увеличен; Androidupdate compatibility сpreview сохраняется. Runtime cashout/shop checks проводят Lead и независимыйQA отдельно; signing/packaging не доказывают поведение UI. На физическом Android/WebView APK здесь не запускался. Полный магазин и дальнейшие раунды не заявляются. Library/sourceZIP сохраняет Lead, сборочная роль не выполняла durable saving.
