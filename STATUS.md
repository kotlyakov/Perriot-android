# Пьеро — выпущена0.4.62-preview/code75

03.11.2026 — утверждённый пользователем экран Арканы внедрён в полную игру и выпущен после проверок. APK0.4.62 ожидает пользовательской проверки на телефоне;0.4.61 остаётся принятой базой.

Исходники: kotlyakov/Perriot-android, ветка fix/arcana-layout-062, PR51 открыт и не слит. Проверенный source d9106e42840c532c09c22cd20dcff213c1395c48, tree54d0370894bda3ae8db971fc8ef79f7ee6f50eb8. Локальный0a79be6 имеет то же дерево. Последующая документация не меняет игровой source. База124assets побайтно совпала с принятой061.

Результат: прямая рука y490 без наклонов, сортировка скрыта в целевых наборах; область Таро выровнена с зонами действий; счётчик и пропуск с отступами. В бою прежние веер/сортировка. Core/RNG/savecodec/native bridge не менялись. Предпросмотровые «Заново», фикстура и отключённая «Партия» не перенесены.

Паспорт: docs/approved-ui/approved/arcana-v1.md. План: docs/superpowers/plans/2026-11-03-arcana-062.md. Протокол: docs/qa/2026-11-03-arcana-062.md; сертификат/метрикиJSON рядом.

Проверки: CI41621530112 SUCCESS; fresh1975corePASS/0FAIL/2optionalprivate skips;13browser suitesPASS; Android начался после успешных core/browser и freshGradlecleanassembleDebugPASS. Оба packlifecycleтеста, savefailure/reload/take/use/skip/RNG, CPU×4 stress и late-runPASS.800выборов CI: p95≤6.5ms,max22.3ms,0карточныхудалений/0saveзаписей. Это Chromiumhandler latency, не AndroidFPS и не полный перебор всех возможных взаимодействий. Изолированное ревью: Critical/Importantнет.

[Скачать Pierrot-0.4.62-preview.apk](https://chatgpt.com/library?file_id=libfile_742ec5f1e3208191bdb0b6ab744a456b&account_id=personal)
APK1440082байта,SHA25677769af1d4c9f1e6163fae0fc989ad27ffa40a71fb05d341cf0641cf585cde78. Manifest75/0.4.62/package,ZIPCRC,124assetsbyteequal,officialCIapksigner v2/zipalign16KB PASS. Artifact13224345696,source/run в build.txt совпали.

Подпись CIdebug d9b1549be6c2f82e64315e60c5883669a98e65aaf0b4c43cf1942ac0cc6c183a отличается от061: поверх установленной061 APK не обновится. Старую игру с прогрессом не удалять. Физическая установка/AndroidFPS не проверялись.

У-80 технически выполнен; следующий шаг — проверка пользователем0.4.62. Другие открытые задачи сохранены в BACKLOG.md.
