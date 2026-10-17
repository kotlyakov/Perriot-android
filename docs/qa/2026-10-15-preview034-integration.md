# Проверка и интеграция0.4.34-preview — пункт№3

Дата:15.10.2026. Статус: №3 завершён; PR29 слит, оба CI SUCCESS, APK проверен и выдан.

## Проверяемый срез

- Репозиторий kotlyakov/Perriot-android, PR29 в apk-reference.
- Source2d448326a1fc3f70d30d608e1baf410f150b61be, tree d053d5b8a0d6d83b81e3ccf4cae7ff508333f733; два изменённых blob совпали с локальнымa4f9c12d75fdad266741abbf24c93af3a55c0d78.
- База интеграции f37712f59d1e1a1aa8391acaaa44345fca5244e3.
- Итоговое ревью всей ветки завершено в№2: docs/qa/2026-10-15-showdown-final-review.md.

## Исправления и проверки

П-04-TYPOGRAPHY-CI-034: enterRun ожидает нажатие выбора блайнда, но START_BLIND рисует карты раньше окончания анимации. Нажатие deck при busy намеренно не открывает диалог. Тест теперь ожидает реальную готовность sort_rank, видимый диалог и завершение его анимации; проверки Rubik/границ сохранены, проверяются обе вкладки колоды. Force click, sleep, пропуск отсутствующих элементов и ослабление границ не добавлялись.

П-04-PREVIEW-COPY-034: исправлены две справочные строки поражения/настроек:0.4.34-preview,53/150 джокеров, доступны финальные боссы/победа/Endless; полный профиль и контент обозначены незавершёнными. Правила игры не менялись.

Независимое scoped review97eb032..a4f9c12: spec/quality PASS, без замечаний. Команды node --check для обоих файлов и diff --check PASS. Полный локальный LUAJIT_BIN=/workspace/scratch/2c556ddf4f1c/toolchains/LuaJIT/src/luajit npm test:967PASS,0FAIL,0SKIP, exit0. Повторный полный локальный прогон после добавления только screenshots не выполнялся.

## Платформенные этапы

CI: https://github.com/kotlyakov/Perriot-android/actions/runs/38775578432

PR CI38775578432/job116562220370 SUCCESS:967total,966PASS/1private-source skip,38actual Chromium suites, fresh Android compilation, signature/alignment/APK. Typography проверен1536×688,915×412,568×320,360×800,2400×1080. Browser artifact11993717551 ZIP SHA25658f000909888873be2e7e8f9c229a2057608e049e03266017ae24356393e528a, digest проверен при загрузке.

Визуально просмотрены15PNG: victory desktop/mobile, settings1536/915, Endless ante9/32/38/39/40 desktop/mobile и rubik-field. Новых обрезаний текста/кнопок и наложений в этих состояниях не найдено. Это выборочная визуальная проверка, не приёмка всего интерфейса и всех боссов.

PR29 слит в apk-reference: e8319950daee34a3cd304e057e7fe68337b893e7. Merge tree d053d5b8a0d6d83b81e3ccf4cae7ff508333f733 точно совпал с протестированным source tree. Post-merge push CI38777249132/job116567975333 SUCCESS: core966PASS/1private-source skip,38 Chromium suites, fresh Android, подпись и alignment. Итоговый artifact11994353537 ZIP SHA25679bebb37a7af109f1118f446d5beb4b2813b125331a59a64cb6cf7d5f3198f18 проверен при загрузке. APK SHA256 cadf68db3ec92dcdfcdec3a9a894e1134626c3fd76ea159fcc8c335c28666202 совпал с SHA256SUMS. Сертификат Android Debug SHA256254ca68fa285e15e01674b2fc42c1aea44bf519c4c580f4beba906b414fdc165; обновление поверх предыдущей сборки не гарантируется. APK сохранён как pierrot-0.4.34-preview.apk. Локально Chromium недоступен, повторная установка не предпринималась, VM не использовалась как замена реального браузера.

Физическое Android-устройство, установка/обновление и полный профиль/контент не проверены. Это промежуточная версия53/150, не финальная игра. №4 не начинать без выбора пользователя.
