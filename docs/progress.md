26.10.2026 — исправление У-50/51/52поотклонению0.4.52. fix/collection-restore, кандидат0.4.53/code66,1852corePASS/2skip, новыеконтрактныеUIнаборыPASS; CI40307012731SUCCESS,28browser,freshAndroid; APK0.4.53/code66 сохранён. Source d26eee51, PR49 открыт.117offlineassets/index/CRC/signature/alignmentPASS; подпись другая, поверх0.4.52необновляется. Документы: STATUS.md и QA2026-10-26-collection-restoration.md.

26.10.2026 — автономная доводка0.4.52/code65 вfeat/autonomous-polish. Завершено: source94489a8, CI40274302617SUCCESS,1845corePASS/2skip,23browser,freshAndroid; APK0.4.52/code65 сохранён. PR48 открыт, не слит. Полный актуальный статус — STATUS.md, QA2026-10-26-autonomous-polish.md. Ранее утверждённое оформление сохранено; физическийAndroid не заявлен.

25.10.2026 — первый набор150джокеров утверждён, бэклог сверен. Проверочная0.4.49-preview/code62 собрана и сохранена; source581cd7f, CI40177154678SUCCESS (core/UI/freshAndroid). Утверждённые паспорта — docs/approved-ui/, готовыйAPK/проверки — docs/qa/2026-10-25-preview-049.md. Текущий шаг — пользовательская проверкаAPK. Прежние запретыAPK/ожидание художественной приёмки первого набора ниже — история; новые редизайн/слияние не поручены.

25.10.2026 — по указанию пользователя восстановлен первый вариант150джокеров из960e5e3: простые сюжеты с картами/фишками, отдельное поле названия. Активные application paths совпадают с960e5e3; standalone653867байт побайтно равен первому показу.150SVG хешей совпали, свежие XML/sharp150PASS, bundle150equal, core1815PASS/0FAIL/2optional skips. Новый CI40164023164 SUCCESS на78612f0:1815corePASS/0FAIL/2skips; восстановленныйUI и150джокеров на3игровых разрешениях, standalone320/390/736 и4изданияPASS.49PNG artifact12588040325; ключевые первые страницы просмотрены. Код опубликован, local/remote trees совпадают. Поздние варианты сохранены в Git, непоказанная проба подписей — references/design-history/. Отчёт docs/qa/2026-10-25-joker-first-restore.md.

24.10.2026 — итерация3 джокеров: цветность одобрена; все150 рисунков упрощены, название с окантовкой поверх единой полной лицевой стороны, текстовой полосы нет. Локально1815core PASS/0FAIL/2optional skips;154targeted PASS после финальных графических правок;150XML/sharp и все5 листов просмотрены. Независимое review без Critical/Important. Финальный CI40121855610 SUCCESS на802e71f:1815core PASS/0FAIL/2skips; все150 full-face артов/надписей/целых слов в игре на3разрешениях, все150shop названий, standalone320/390/736 и4издания PASS.49PNG artifact12571009095; финальные узкие страницы просмотрены. Код опубликован, local/remote trees совпадают. Приёмка рисунков/layout открыта; APK/слияния нет. Отчёт docs/qa/2026-10-24-joker-full-face.md.

24.10.2026 — цветная переработка150/150джокеров по отзыву пользователя. Новая12цветная палитра,12пар цветных фонов, предметные/персонажные сюжеты; прямых карточных примитивов168→2. Локально1815corePASS/0FAIL/2optional skips;154targetedPASS;150XML/sharp и все5листов просмотрены,4пересечения с номерами исправлены. Экспорты и Android assets проверены. CI40119564082 SUCCESS на8ee77a0:1815corePASS/0FAIL/2skips, все150джокеров в игре на3разрешениях и отдельный показ320/390/736PASS;49PNG artifact12570680317, ключевые снимки просмотрены. Исходники опубликованы, local/remote trees совпадают. Независимое integration review: Critical/Important нет. Приёмка рисунков открыта; APK/слияния нет. Отчёт docs/qa/2026-10-24-joker-colour-revision.md.


24.10.2026 — У-41/42/43 технически проверены: единые ‹ номер › и свайпы/анимация всех коллекций; содержимое профкнопки внутри рамки. CI40070737533 SUCCESS на source6aaebfd:1657corePASS/0FAIL/2optional skips,7ChromiumнаборовPASS,82PNGartifact12551152399; ключевые снимки просмотрены. У-40 (оформление подсказки) и У-44 (игровое окно) ОТКРЫТЫ, пользователем не приняты. Отчёты docs/qa/2026-10-24-collection-paging.md и2026-10-24-game-window-feedback.md. APK/слияния нет.


23.10.2026 — У-39 завершён технически: все существующие карточные подсказки рядом с нажатой картой, без кнопок закрытия, скрытие следующим нажатием; исправлен сенсорный click-through. CI40017085886 SUCCESS на sourcea6c5446:1657corePASS/0FAIL/2optional skips,6ChromiumнаборовPASS, включая mouse/touch1536/915/568.76PNGartifact12528992254, ключевые снимки просмотрены. Отчёт docs/qa/card-tooltip-review.md. APK/слияния нет, пользовательская приёмка открыта.


23.10.2026 — третья итерация меню проверена: CI39991137187 SUCCESS на source44f767d,1655corePASS/0FAIL/2optional skips,4целевыхChromiumнабораPASS,34PNGartifact12517658680. Нижние строки профиля915 исправлены и просмотрены. Актуальная таблица docs/qa/player-menu-revision.md; У-33–У-38/Г-01–Г-06 в BACKLOG.md. Пользовательская приёмка открыта, APK/слияния нет.


23.10.2026 — третья итерация по прямым замечаниям пользователя: один Профиль игрока с сохраняемым именем/процентами; прямые настройки; удалены статистика/настройка рисунков колоды/дубликат коллекции из опций; обновлены карточки коллекции и цвета типов. Все требования У-33–У-38/Г-01–Г-06 в BACKLOG.md. Новые находки Д-01/Д-03 исправлены, Д-02 открыт; docs/qa/2026-10-23-additional-menu-audit.md. Core1655PASS/0FAIL/2optional skips; DOM коллекции PASS. Browser-проверка текущей итерации ещё ожидается; прежний CI не подтверждает эти изменения. Без APK/слияния.


23.10.2026 — повторный аудит по замечанию пользователя: подтверждены 25 расхождений продукта и 5 дефектов интерактивного показа. Соответствие оригиналу не принято; прежний PASS проверял переходы/границы, а не полноту интерфейса. Отчёт docs/qa/menu-discrepancies-second-review.md. Геометрия требует парных снимков. APK не собирать, ветку не сливать.

23.10.2026 — пользователь отверг первую компоновку, поручил все окна по оригиналу. Выполнена структурная сверка private UI_definitions.lua и повторная реализация setup/collection/profile/options/settings/party/end. Источник/пределы docs/qa/native-menu-structure.md; план docs/superpowers/plans/2026-10-23-native-menu-layout.md. Core1654PASS/0FAIL/2optional skips; NodeDOM PASS; Chromium native-setup/native-windows/прямое превью PASS, CI39983951420 SUCCESS (source de2b5796f95bf0c4f08b0f3078842cc273a8be4e). Ключевые desktop/touch снимки просмотрены;32PNGartifact12515635060. Исправлены оба найденных ревью Important. Новое прямое превью scripts/build-native-menu-review.mjs. Приёмка открыта, APK не собирать. Актуальные детали STATUS.md.

23.10.2026 — по поручению пользователя все 32 визуальных расхождения перенесены в корневой BACKLOG.md: ID, приоритет, критерий, статус, источник. Начата первая итерация окон/меню в feat/ui-windows-review, PR45. Меню опций, вкладки настроек/партии, общая рамка/масштаб/нижние действия, страницы испытаний/коллекции/профиля. Core1651PASS/0FAIL/2optional skips; Chromium3целевых suites PASS, включая вложенное интерактивное превью (CI39952151364 SUCCESS); Android job SKIPPED. Независимое исходное ревью без подтверждённых Critical/Important. Интерактивное превью использует те же модули с временным хранилищем и seed13031990. Визуальная приёмка открыта; точные размеры отдельных окон, итоговые окна и полный регрессионный UI-прогон остаются задачами. APK/Gradle не запускались. Продолжать по STATUS.md, BACKLOG.md и docs/plans/ui-windows-review.md.

23.10.2026 — дополнен UI-аудит по замечанию пользователя: У-20–У-32 (13пунктов), всего32расхождения. Размеры/масштабирование окон, структура меню, scroll вместо страниц, нижние действия и рамки. Подтверждения и пределы измерений: docs/qa/visual-comparison-048.md. Исправления ещё не выполнялись; версия0.4.48.

23.10.2026 — по прямому решению пользователя прежний план1–12 закрыт. Начат отдельный этап улучшения результата0.4.48. Это не подменяет физическую/пользовательскую приёмку или полную native frame/event RNG parity; прежние ограничения сохранены как известные. Первое поручение: визуальное сравнение, без реализации. Отчёт docs/qa/visual-comparison-048.md.

23.10.2026 — PR43 иPR44 слиты; apk-reference ba4aa0a. Временный сид13031990 реализован, APK0.4.48/code61. CI39942228727 SUCCESS:1650corePASS/2optional skips,52Chromium suites,freshAndroid/signature/alignment PASS;92offlineassets byteequal. Проверочный режим готов; №12 остаётся открытым до физической/пользовательской приёмки. Подробности STATUS.md и docs/qa/item12.md.

Ниже — предыдущие записи и исторические ограничения.

22.10.2026 — 10в реализован локально в feat/item10c-profile, source f749660273e0d8a817cde5aa8d059971d213c25d. Полный core1602PASS/0FAIL/2private skips,69profile checksPASS,200native Gold fixturesPASS. Browser/Android/APK ещё не проверены. Push в публичный kotlyakov/Perriot-android отклонён auto-review: требуется прямое разрешение пользователя на публичную запись. Последний выпущенный APK0.4.44; кандидат0.4.45/code58 не собран. 10г не начат. Подробнее STATUS.md и docs/qa/item10c.md.

22.10.2026 — 10а завершён технически: все15колод, их стартовые/постоянные эффекты, выбор и сохранения. APK0.4.43-preview/code56. Source d3518d1ec74521936908291002f7b580b46eb215; tested merge071ac9ac7c78c055d25dfb2ed972a8ce24b79a41:0файловых различий. CI39727016489 SUCCESS:1511corePASS/0FAIL/2private-source skips,47Chromium suites,freshAndroid/signature/alignment PASS. 75offlineassets побайтно равны исходникам; новые desktop/touch снимки просмотрены. Независимое ревью: подтверждённых Critical/Important нет;35disable edges+2Green earned-disable+Abandoned Erosion PASS. APK SHA256 ed6a784d598372e03c0b8eb28091c4e09d08f574af3e3d69d8f8ce0db1c12314;artifact12403338565. Следующий10б:8сложностей;10в:профиль/разблокировки/коллекция/статистика;10г:испытания. Физический Android и fullframe/event RNG parity не заявлены. Отчёт docs/qa/item10a.md.

22.10.2026 — №9 завершён технически: 32 эффекта ваучеров и 24 тега, горизонтальные билеты З-04, строгие сохранения. APK0.4.42-preview/code55. Source2317cf7d4f190fc2b16fee349d36b903fc1603a6; tested merge60ed0bef7e779f6e0dec1445116db46c1c212aa1, деревья равны9d2addb7a7d0640841550ea7bcb1ad89a5e0d57c. CI39722417792 SUCCESS:1481corePASS/0FAIL/2private-source skips,46Chromium suites, freshAndroid/signature/alignment PASS. 74offlineassets APK побайтно равны исходникам; снимки desktop/mobile просмотрены. Независимое ревью: открытых подтверждённых Critical/Important нет. APKartifact12402291153, SHA2561b26cf24e593e96327371b46db9e18cb156863eb71663ed845e8dd4354d36095. Debug-подпись без гарантии обновления поверх старой версии; удаление приложения стирает прогресс. Физический Android и полная frame/event RNG parity не заявлены. Профиль/разблокировки отдельно в№10; ждать выбора пользователя. Отчёт docs/qa/item9.md.

Актуальный результат и следующий шаг указаны выше. Старые ограничения №9 ниже отменены прямым поручением пользователя.

20.10.2026 — №8б в работе по выбору пользователя. Реализованы Standard/Buffoon/Spectral packs и оставшиеся11Spectral effects; native generator4242cases и Spectral796cases. Сейчас интеграция строгих сохранений, затем полный core/browser/Android CI и APK. Это промежуточный checkpoint, не релиз; последний APK0.4.40. №9 не начинать.

19.10.2026 — №8а завершён технически: все8наборовТаро,22Таро+редкаяДуша, целевая рука, Mega, owned-use и save/replay. APK0.4.40-preview/code53. Source e74b71a46fa5789b3f6336b780b4a75355828c0a; tested merge994f8a437a8b2c29d9cdf387251cf099e31e554e:0файловых различий. CI39270148693 SUCCESS:1369corePASS/2private-source skips,44Chromium suites, freshAndroid/signature/alignment PASS. Локально1372/1372PASS0skip с private native sources;714nativeSoulcases+140Arcanafixtures. Независимое ревью: stale consumed Hanged epoch исправлен RED→GREEN, повторная проверка обоих путей PASS, открытых Critical/Important нет. APKartifact12195183891 SHA256e4436be780452a482286250c6d226eef2272e85e068341147ff03a8a9cac95d7;69offlineassets byteequal; desktop/mobile screenshots просмотрены. Debug-подпись отличается от0.4.39: поверх неё не обновится, удаление стирает локальный прогресс. Физический Android, профиль/discovery и полная frame/event RNG parity не заявлены. №8б не начат; ждать выбора пользователя. Отчёт docs/qa/item8a.md.

19.10.2026 — №7б, промежуточный этап: «Суд» и сохранения. Пользователь разрешил продолжить вторую половину18.10 и подтвердил19.10; прежнее ожидание выбора №7б снято. Восстановлена незавершённая ветка feat/item7b-full-jokers. Исправлено сохранение при оставшихся расходниках (activeCentreIds); RED→GREEN и100 seed save/use/resume проверены. Исправлены7 сбоев Water/Needle/Serpent с Chicot/Luchador и пассивами: корректная accepted revision, фактические Needle counters, Serpent origin после начальной тасовки/добора. Полный npm test:1229total/1225PASS/0FAIL/4skip (3 отложенные scoring-регрессии7б + private native oracle). Offline assets preparation и git diff --check PASS. Каталог150 включён в рабочей ветке, но полный эффектный/нативный аудит43 новых джокеров ещё не завершён. Этот checkpoint НЕ релиз и НЕ завершение №7б; APK0.4.38 остаётся последним выпущенным. Browser/Android CI и новая сборка не запускались; слияния нет. Следующий шаг: оставшиеся scoring-регрессии, дополнительные Serpent edge cases, нативные fixtures/review, затем browser/Android/APK. Подробности docs/qa/item7b-checkpoint1.md.

18.10.2026 — №7а завершён:43 новых джокера,107/150 эффектов. APK0.4.38-preview/code51 проверен и передан пользователю. CI39111229954 SUCCESS:1183corePASS/7skip(6отложенных7б+1private native-source),42Chromium suites, freshAndroid, apksigner/zipalign PASS. Локально1184PASS/6future skips;2000native fixture reproducibility и43×28boss matrix PASS. Независимое ревью: выявленные Important исправлены RED→GREEN; открытых подтверждённых Critical/Important нет. PR34 merged в apk-reference:deff0b24519e2798ce4c47cdf0086c7604fcb6a9; source:0f5d3474d7524d7602b9b1c6caf63acf358a837f; tested merge:64c122855ee9e770c3e0069ab70cebe663806b98; compare source/tested/actual merge:0 файловых различий. APKartifact12130907863, SHA256:0d4348c1624b2496ec95227ad49a0bb5f2e5e5590a05003ca7cca5d956f9c595;69offlineassets побайтно равны проверенному коду. Debug-сертификат отличается от0.4.37: обновление поверх неё невозможно, удаление стирает локальный прогресс. Физический Android и полная frame/event RNG parity не заявлены. №7б (остальные43 и Judgement) закрыт до явного выбора пользователя; №8 не начат. Подробности docs/qa/item7a.md.

## Предыдущие записи

18.10.2026 — №7а: первая половина, 43 новых джокера (107/150). Код и локальные проверки завершены; выпуск пока ожидает браузерный и Android CI. Остальные43 и Judgement закрыты до №7б; №8 не начат. Локально1190 тестов:1184PASS,0FAIL,6 явно отложенных тестов №7б; приватный native oracle выполнен. Воспроизводимость2000 source-derived fixture cases PASS; матрица43×28 боссов start/play/save PASS. Исправлены Rocket/Egg BigInt save, Turtle authenticated replay, Chaos refill, Heart passive hand size, Needle+Burglar retained grants, Arm+Space permanent level. Независимое ревью выявленных Critical/Important не оставило. Физический Android и полная RNG/frame parity не заявлены. Подробности:docs/qa/item7a.md.

17.10.2026: №6 завершён в согласованном механическом срезе.4печати/3издания игральных карт, heldповторы, контекстное копирование, физическое создание/копирование и срок жизни. Mime/Pareidolia/Blueprint/Brainstorm/Seltzer/DNA/Marble:64/150 эффектов; Aura+4sealSpectral support. Локально1051/1051PASS0skip с private native sources;1122score+228lifecycle original-function fixtures/JIT equality/reproducibility PASS. Независимое ревью55targeted+140reducer scenarios, no open Critical/Important; DNAanimationanchor fixed RED→GREEN. Все28боссов play/save/discard PASS. CI39022615162 SUCCESS:1049corePASS/1expected private-source skip,41Chromium suites, freshAndroid/signature/alignment PASS. PR33 merged:eca29a843547bea4d7ed4bbd03fcf4ff79278a37; source:ba28d842756574e8c2d472e9d48b818a2cee75ca; tested merge:cd336c3fecb131756f2e561a605bd6a5fc477029; исходники сравнились без файловых различий. APK0.4.37-preview/code50 SHA256:f97b91f9a7c06d3f8d9542c65ea05ab1a24776ab422e63e91cebd4609474b682; artifact:12097204307; debug-подпись без гарантии обновления. APK offline assets побайтно совпали с локальным HEAD. Полные86оставшихся Joker effects/Judgement в№7; остальные packs/Spectral в№8; native unlock/profile в№10. Полная frame/event RNG parity и физический Android не заявлены. Следующий предложен№7; ждать выбора пользователя.

## Предыдущие записи

16.10.2026: №5 завершён. Dusk, Hack, Sock and Buskin, Hanging Chad:57/150 эффектов. Локально1004/1004PASS0skip; native687cases/JIT equality/reproducibility PASS; независимое ревью no Critical/Important,111targeted+132boss scenarios PASS. CI38859217381 SUCCESS:1002corePASS/1expected private-source skip,40Chromium suites, fresh Android, signature/alignment PASS. PR32 merged в apk-reference:add946da62523e629372d090a2fecd6d55cf3acf; source:38b7e6b73041b2f67bbd4ef4a9d4fcf7d4c96ecf; tested synthetic merge:026b8b913f443281cceb8686345af30ada0f02e0. Source/tested/merge сравнились без файловых различий. APK0.4.36-preview/code49 SHA256:c8b1ccc7e5607a33e529c8c0a81504b28745fff5c26bbd8bf7222900e6184d07; artifact:12028078840, debug-подпись без гарантии обновления. Маркеры повторов не меняют числа; Lucky переоценивается каждый проход, Glass разрушается один раз; strict RNG/save replay. Default native locks сохранены; полный профиль/разблокировки в№10. Общая покадровая/event RNG parity и физический Android не заявлены. Следующий предложен№6; ждать выбора пользователя.

## Предыдущие записи

16.10.2026: №4 завершён в игровом ядре: физические ID/order новых копий, legacy52, синхронная Stone/Lucky/Glass RNG chronology и strict replay. PR31 слит в apk-reference: d95975988b7c92f0b1c2e2e9c7afad1d4c8f12a5; source417e30351ae9bf76389e12f22d20e1c85cba2368. Локально984/984PASS0skip с private native oracles; CI38853367669 SUCCESS:983total/982PASS/1expected private-source skip,39Chromium suites, fresh Android, signature/alignment. APK0.4.35-preview/code48:15b14f90a8432f1d443106e4a8187a3e69b8ce0952efa2b88073b94f0792c8f2, debug-подпись, без гарантии обновления. CI synthetic merge c469ed0b105a28d36b3d86fb24271488926b2e06 и actual merge/source сравнились без файловых различий. Общая покадровая/event RNG parity (Cloud9, previews, Mark/Plant setup) остаётся в П-RNG-STONE и финальной матрице, не заявляется закрытой.53/150 джокеров, физический Android не проверен. Следующим предложен№5; ждать выбора пользователя.

## Предыдущие записи

16.10.2026: пользователь выбрал №4 — RNG Stone и физическая идентичность карт. Работа продолжается в feat/card-identity-rng. Identity foundation реализована и прошла независимые целевые проверки; общий Stone action RNG и strict replay/save ещё в работе. Native phase oracle1407cases и creation-order oracle3seeds подготовлены. №4 не завершён, №5 не начинать без выбора пользователя.

# Текущий результат — 15.10.2026

№3 завершён 15.10.2026: typography race и справочные надписи исправлены; PR29 слит в apk-reference (e8319950daee34a3cd304e057e7fe68337b893e7). PR CI38775578432 и post-merge CI38777249132 SUCCESS: 966 core PASS/1 private-oracle skip,38 Chromium suites, fresh Android, apksigner и zipalign PASS. Полный локальный прогон:967 PASS/0skip. APK artifact11994353537, SHA256 cadf68db3ec92dcdfcdec3a9a894e1134626c3fd76ea159fcc8c335c28666202, debug без гарантии обновления. Выборочная визуальная QA15PNG пройдена. Физическое устройство/установка не проверены. Полная игра не готова:53/150 джокеров. Предложен№4; ждать выбора пользователя.

## Предыдущие этапы

# Выбранный пункт15.10.2026

№2 завершён: независимое итоговое ревью83a2a4f..1555314, source28cdbf93,42 code/test/config blobs совпали. No Critical/Important found;104/104 целевых тестов PASS0skip, native fixtures byte-identical (JIT/interpreter equal). Отчёт docs/qa/2026-10-15-showdown-final-review.md. Runtime не менялся. Предложен№3; исправление typography/справочного текста и интеграцию не начинать до выбора.

15.10: №1 завершён — П-04-VICTORY-CI-034 исправлен и проверен. Escape перехватывается до native close request; повторные Escape/Back после ошибки primary/backup записи сохраняют видимый retry и неизменное сохранение. Успешное подтверждение записано до beforetoggle/close; тест ждёт реальное queued close. Source28cdbf935dc50525b9505ec4d63424a6b39f363d соответствует локальному1555314 по изменённым blob SHA. Локально967/967PASS0skip; CI38761923466 core966PASS/1private-oracle skip, victory-endless desktop/mobile PASS. Независимые scoped review и re-review PASS. Общий CI позднее FAIL в typography-check.mjs:12/18 (null.getBoundingClientRect), Android пропущен; это отдельный блокер№3, не исправляется в№1. №2 source-review завершён отдельной проверкой выше. Следующий предложен№3, ждать выбора пользователя; PR29 остаётся draft, слияния нет. Полная игра не готова,53/150 джокеров.

Проверка: https://github.com/kotlyakov/Perriot-android/actions/runs/38761923466


## Очередь по номерам — 15.10.2026

| № | Этап | Сделано | Осталось / блоки |
|---|---|---|---|
| 1 | Сбой повтора сохранения победы | Завершён:967 локальных PASS, независимое ревью, actual Chromium desktop/mobile PASS | Пользовательская приёмка отдельно |
| 2 | Итоговое ревью всей ветки | Завершено: no Critical/Important found;104 целевых PASS0skip, native fixture reproducibility PASS | Платформенные/визуальные проверки остаются в№3; это не полный релиз |
| 3 | Проверка и интеграция0.4.34 | Завершено: PR29 merged; оба CI SUCCESS;38 Chromium suites, Android/signature/alignment PASS; APK готов | Физический Android и установка остаются в№12; следующий предложен№4 |
| 4 | RNG и идентичность карт | Завершено для игрового ядра:984localPASS,354native scoring cases,39Chromium, Android, PR31 merged | Покадровая/event parity оригинала отдельно остаётся открытой в П-RNG-STONE/финальной приёмке |
| 5 | Четыре scored-retrigger Joker | Завершено:4эффекта;1004localPASS,687native cases, review,40Chromium, Android, PR32 merged | Полный профиль/разблокировки отдельно в№10; следующий предложен№6 |
| 6 | Остальные механизмы эффектов | Завершено:4печати/3издания,7Jokerconsumers,1051localPASS, native1122+228,41Chromium, Android, PR33 merged | Полные потребители событий/остальные86Jokers в№7; fullframe RNG и физическая приёмка открыты |
| 7 | Полный каталог Joker и Judgement | Завершено технически:150/150 эффектов и «Суд», PR35 | Пользовательская приёмка/финальная матрица отдельно |
| 8 | Расходники и паки | 8а/8б завершены технически: все семейства,22Таро,18Spectral | Полная приёмка отдельно |
| 9 | Ваучеры и теги | Завершено технически:32ваучера/24тега,0.4.42 | Полная приёмка отдельно |
| 10 | Колоды, сложности, профиль, испытания | 10а–10г завершены:15колод/8ставок/профили/20испытаний;PR42 слит | Физическая/пользовательская приёмка отдельно |
| 11 | Финальные UX, графика и звук | Завершено технически: музыка/звуки/настройки, покрытия/UX,51browser suites,0.4.47 | PR43 готов; субъективная приёмка звука и З-03 отдельно |
| 12 | Полная приёмка и финальный APK | Автоматическая приёмка PASS:1650core/52browser/Android; проверочный APK0.4.48 передан | Открыты физический Android, пользовательская приёмка и полная frame/event RNG parity |

Полная игра не готова. Следующий номер выбирает пользователь; автоматическое продолжение запрещено.

# Предыдущий блокер15.10.2026 — история

0.4.34 source опубликован275cadbc, PR29draft. Локально967/967PASS0skip. CI38714363200: corePASS, browserFAIL — victory_retry невидима после сценария ошибки сохранения/ESC/Back; причинаUI/тест пока не определена. Android этап пропущен, новыйAPK не получен. Финальное whole-branch ревью остановлено лимитом модели. Следующий порядок: воспроизведение/исправление→scoped review→38browser+Android+визуальнаяQA→завершитьwholebranchreview→интеграция. Далее Stone/RNG и план scored-retrigger.

# Showdown — 15.10.2026

Bell/Acorn, Heart и Leaf/Vessel прошли независимые ревью; 944 локальных теста PASS с исполненным нативным оракулом. Source checkpointcd40efc в draft PR29 прошёл Actions38688716888:37 Chromium/offline-наборов, fresh Android, подпись/alignment PASS. APK11951311260, debug без гарантии обновления; физическое устройство не проверено. Победа прошла scoped ревью; Endless4faa624 локально967/967PASS, native fixture reproducibility PASS, независимые task/scoped ревью пройдены;38-suite браузер+Android и whole-branch review впереди.53/150 джокеров, полная игра не готова. Источник числового поведения высокого Endless записан в docs/apk-findings/endless-numeric-observations.md, реализацию/проверку он не заменяет. Детали и артефакты — STATUS.md.

# П-05а — планеты и Чёрная дыра, 09.10.2026

Точное повышение 12 комбинаций, атомарное использование и покупка в отдельные слоты, нативные счётчики, совместимые сохранения. Debuff расходует карту/учитывает использование без эффекта. Локальные проверки и независимое ревью выполнены; отдельная ветка feat/planet-consumables-012 зависит от boss PR #8. Android CI и итоговый результат записывать в STATUS. Остальные расходники, наборы, профиль и анимация использования остаются открыты.

# П-04г — обычные боссы, 09.10.2026

Реализованы эффекты 22 безусловно доступных обычных боссов; Буйвол поддержан при однозначном сохранённом выборе комбинации. Полный пул 28 сохранён. Переходы анте 2–7 и выбор анте8, правильные множители Wall/Needle, скрытые карты, Serpent, Eye/Mouth, Arm/Ox/Tooth/Flint и совместимые сохранения. Финальные боссы, победа/endless и полный П-04 открыты. При равных частотах выбор Ox зависит от хеш-порядка таблицы нативного LuaJIT; null блокирует только вход в Ox, не выплату остальных боссов.

Независимое ревью завершено: исправлены утечка скрытых карт в просмотре колоды и принятие null вместо списка скрытых карт. Автопроверка/CI в работе; конкретные результаты фиксируются в STATUS.md. Пользовательская приёмка и физический Android отдельно. Следующий связанный блок — расходники и наборы.

# Текущий отзыв 09.10.2026

Текущий пакет: З-14/З-16 — семантические подсказки и терминология; З-15 — числа джокеров вниз; З-17 — перестановка и продажа принадлежащих карт вправо; З-18 — схлопывание/раскрытие при перебросе; З-01 — шесть исполнимых наград за пропуск. Ядро 248/248, все 17 браузерных наборов и APK PASS (Actions 37917139497/37917143879). PR #7 слит, код f767575; срез после слияния bca7cdd, документация отдельно. З-14–З-18 технически выполнены, пользовательская приёмка отдельно; З-01 частично (6/24). Подробнее STATUS.md и docs/qa/card-feedback010.md. Остальные 18 наград и модифицированные игральные карты не объявлять реализованными. Полные пулы 24 тегов/28 боссов сохраняются. П-04в сохраняется.

## П-04в — переход ко второму анте, 09.10.2026

Некритическое · высокий. Реализованы выход из магазина после первого босса, малый/большой блайнды второго анте (800/1200), раунды 4/5, сохранение следующих выборов и продолжение старого магазина. П-04 целиком не закрыт; босс второго анте пока заблокирован, полный пул не сокращён. Проверка: 232/232 тестов ядра локально; Actions 37900640686 SUCCESS: 16 браузерных наборов и свежий APK; PR #6 слит в apk-reference. Снимок второго анте просмотрен, пользовательская приёмка отдельно. Детали — STATUS.md и docs/qa/second-ante-transition.md. Следующий блок — эффекты боссов второго анте.

# Текущая передача — 09.10.2026, боссы первого анте

Продолжение П-04: восемь боссов первого анте реализованы, после большого магазин ведёт к сохранённому боссу, победа — в магазин ante2. Следующий анте пока отключён. Полные пулы 28 боссов/24 тегов не сокращены; прежние 32 эффекта джокеров и обычные карты.

Проверенный код/CI/слияние и APK: актуальный STATUS.md. 228 тестов ядра; независимый Hook oracle — 135 операций оригинальных функций под LuaJIT. Ревью P2 с неканоничным ID исправлено атомарной защитой и тестом. Первый UI-прогон обнаружил ошибку ожидания disabled play после очистки выбора, исправлено ожидание сортировки. Новый сценарий проверяет анимацию Hook, выплату и контекст ante2. Детали: docs/qa/first-ante-bosses.md.

Следующая задача: состояния следующего анте и остальные боссы, затем реальные атомарные пропуски/эффекты тегов с зависимостями. Старые сохранения без истории не дополнять выдуманными картами. Физический Android и пользовательская приёмка движения З-03/нового UI остаются открытыми.

---

# Текущая передача — 09.10.2026

Поручение: одна задача. З-03 реализована: затухающая пружинная траектория вдоль смещения жеста, амплитуда зависит от расстояния, возврат 720 мс заканчивается точно на месте. Отмена/новый жест/перерисовка используют прежнюю очистку, reduced motion возвращает сразу. Экономика и формат сохранений не менялись.

База: apk-reference 198f6673d92d2336b59e10fc7daea8a24180980d; отдельная ветка fix/z03-card-inertia. main отстаёт на 31 коммит, поэтому PR адресован действующей рабочей ветке, чтобы не смешивать задачу с интеграцией всех прошлых этапов.

Проверки: исходная база 199/199, новый тест траектории RED до реализации, полный набор после правки 200/200 PASS. Новый браузерный набор включён в CI: пять направлений/дистанций, перелёт/затухание, точный финиш, неизменность сохранения и новый жест. Локальный Chromium отсутствует; загрузка возвращает повреждённый архив. Actions 37883744456 SUCCESS: 200 тестов ядра, 13 браузерных наборов, свежая Android-компиляция и проверка подписи/выравнивания. Снимки движения просмотрены. PR #3 слит в apk-reference (c0bdd12), проверенный код 1ec10cf. APK с новой CI debug-подписью не является обновлением прежнего APK; доступен автономный браузерный предпросмотр. Физический Android не проверен. Пользовательская приёмка движения обязательна; З-03 пока не закрыта.

Следующий шаг после этой задачи: полный цикл П-04 и награды З-01 по зависимостям.

---

# Текущий срез — 08.10.2026, 0.4.9-preview

Пользователь принял З-02/06/07: немедленные подсказки, русские названия всех 266 товаров и увеличенные боковые кнопки. З-03 переоткрыто 08.10.2026: подрагивание 0.4.9 не принято. Нужно инерционное торможение с пролётом исходной точки и затухающими движениями вдоль направления полёта; включить в ближайшую доработку анимаций магазина. Подробности: docs/backlog.md и docs/qa/shop-feedback049.md.

199 тестов ядра, все 12 браузерных наборов и свежая компиляция Android прошли в Actions 37817609389. Исходный коммит ec498d7685760e13847babc0b8c8f1d375320faa. Код версии 22, пакет ru.cardcascade.game.preview. Проверены 43 ресурса и 56 элементов содержимого APK, выравнивание и прежняя подпись. SHA256 переданного APK: fbb6863bd58bb602989731831efee59a22664df412a3bdcbacd68fa2d23d690c. Запуск на телефоне не выполнен.

Остаются З-03 (инерционное торможение), З-01 (все 24 награды пропуска и зависимости), З-04/05 (билеты/коробочки вместе с эффектами ваучеров и открытием наборов), З-08 (колоды, сложности, профиль). Полнота клона не объявлена: доступны 32 эффекта джокеров; боссы, ваучеры и наборы ещё недоступны.

Правило разработки обновлено: все замечания к каждой версии сначала сохранять в бэклог, сортировать на критические/некритические, затем корректировать план. Подтверждённых открытых критических замечаний сейчас нет. На этой стадии изменена только документация; анимация и APK 0.4.9 не менялись.

## Предыдущие срезы

# Исторический срез — 07.10.2026, 0.4.5-preview

ROADMAP21 — основной план. База UI0.4.4 утверждена. Новый результат: награда за малый блайнд и сохранённый вход в магазин; quote3+remaininghands+interest floor(balanceBefore/5),cap5. CASH_OUT оплачивает один раз и собирает колоду, не расходует RNG, очищает lastScore. Save1 сохраняет совместимость. При ошибке записи UI/кошелёк остаются в unpaidstate.

Root core100/100; UIcashout4viewports/reload/duplicate/writefail, browser/offline, scoreflow2, mobile7, deck6. Независимый QA: docs/qa/cashout045-review.md (реальная победа, interruption, retry, newrun). APK0.4.5/code18:28ресурсов проверены rootbytecomparison. SHA256b9a1c434fc5b97351d7b45199ca6b8b0bd504758d2546e58ac79079bccbdcf8b. Репаковка утверждённой оболочки044; свежая Gradleкомпиляция и физическоеAndroid/WebView не проверены.

Следующее: спецификация полного магазина — пулы, цены, генерация/RNG, покупки/продажи/reroll и паки; затем выбор следующего блайнда. Shopсейчас явно обозначенный вход, каталога нет. Источники1.9↔1.0.1oи открытые исключения не объявлены закрытыми. Не включать референсы/приватный ключ вZIP/APK.

## Исторический журнал

# Передача — 07.10.2026, срез0.3.8-preview

ROADMAP.md редакция8. Новый проект/Android/стильB/сортировка/выполнение уже разрешены. Старый0.18 не использован. Читать ROADMAP первым.

Поле одного малого блайнда работает в реальном Chromium: выбор5, сортировка/drag через REORDER_HAND, dispatch, блокировка повторного подсчёта, HUD, save/reload/recovery. Процедурные карты/фон собственные. Геометрия1536×688 вручную, uniform letterbox — промежуточное решение. Верхние слоты пустые, детали/параметры/колода — промежуточные диалоги.

86 Node-tests проходят, независимо повторены reviewer. Реальный browser suite проходит: mouse/touch/keyboard/drag, repeated play, failed write, corrupt slots, resize568×320/915×412/1280×720, standalone HTML offline. Исправлены preview root trailing slash, двойное touch переключение, потеря keyboard focus и выход веера за измеренные bounds. Canonical preview allowlist traversal закрыт тестом RED200→GREEN404. Live screenshot artifacts/field-preview.png проверен визуально; это снимок проверочной saved-state fixture, не случайной стартовой раздачи.

Android toolchain установлен из официальных источников, настоящий Gradle8.13 Wrapper включён. Kotlin компилируется и assembleDebug успешен. Финальная версия0.4.1-preview/versionCode14, пакет ru.cardcascade.game.preview. Протокол, checksum и команды: docs/android-toolchain-attempt.md. APK ZIP/assets/подпись/Manifest проверяются при передаче. Установка, WebView на устройстве, native lifecycle и AtomicFile при физическом прерывании НЕ проверены.

Далее: проверка APK на Android; правила cashout/interest snapshot/reset/shuffle, затем награда→магазин→следующий блайнд. До postround изменений уровней/джокеров расширить historical scoring context SaveData1. Полный каталог, modifiers/retriggers, режимы, RNG seed parity и связь1.9/1.0.1o остаются открытыми. Начальные деньги4 — explicit preview fixture, не закрытый source gap. Corrupt both сохраняются, export/repair UI пока нет.

Пользователь сообщил реальный oversized экран0.3.1. Mobile Chromium reproducer:915×412/DPR3.5 innerWidth1536 при client/visual915, stage1536. Fix: clientWidth/clientHeight, html/body100% overflowhidden, ResizeObserver и visualViewport resize; Android wideviewport/overview. Семь mobile viewport с taps/sort/rotation проходят. Desktop браузер предыдущей проверки не воспроизводил Android mobile-layout расширение; это ограничение старой приёмки теперь закрыто browser regression. Название «Пьеро»; стабильные packageID/storage сохранены. Отчёт QA: mobile-scaling-review.md.

0.3.3: ownSVG/card-art.js заменяет зависимые от шрифта suit glyphs; ranks/counts test. play-animation.js клонирует выбранные карты после успешного сохранения, flies center232, holds through score, removes; busy gate не даёт повторную трату. CSS disabledcards не recolor. Deckcount top656 нижеdeck639/shadow647. FontTiny5 Cyrillic OFFLINE; source/OFL: art/font-provenance.md. Browser selectors руки теперь #hand .playing-card, чтобы не смешивать played layer с картами в руке.

Visual QA87/core+52cards desktop/52mobile: bounds/pip count/font loaded/deck shadow gap5px/flightcenter/cleanup/no grey/one cost/order green. QA обнаружил порядок clones по taps, исправлено RED→GREEN сохранением hand order. Screenshot actualplayed-preview.png просмотрен. Полная исходная animation timing/parity ещё не утверждена; это рабочий выход карт в центр по пользовательской правке.

0.3.4: после отката transientworkspace к0.3.0 восстановлен актуальный0.3.3 из сохранённого sourceZIP; инструменты восстановлены по checksum. Старый debugkeystore не был сохранён, его нет; packageID testinstall ru.cardcascade.game.preview предотвращает удаление старой игры ru.cardcascade.game, новый прогресс отдельный. Новый signingcheckpoint должен сохраняться отдельно от sourceZIP.

SET_SORT(mode rank/suit) — одно persisted действие, sortMode optional compatible SaveData1, oldsaveбезполявалиден; rank default новыхrun. Draw applies mode, ручной reorder сохраняет выбранный mode. Reject не меняет RNG/counters. Deck grid строится из state.cards (не всегда52), dimmed не-drawpile, содержит artworks. В присланных12 JPG нет открытого deckview/flame, точная visualparity этихсостояний открыта.

Play trace идёт по sourceId в порядке ядра, bluechip/redmult labels; bold/shake multiplication renderer tested synthetic, core пока имеет лишь4simplejokers и noXmultcontent — не считать новыйrender полнымeffectcatalog. HUD integerBigInt + animatedchange, regular DejaVu локально сlicense. Flame logsBigInt safely, height asymptotically<62, canvasclip274×68 insidecalc, textabove. Outgoingdiscard→incomingdraw и score→incomingdraw, savebeforeanimation/busygate unchanged. Снимки actualUI находятся artifacts/; тесты фикстур не исходная игра.

Финальный numeric-fit: showNumbers использует parent box width,3070 помещается; >10digits compactinteger notation (точныйBigInt сохранён). Flowregression90core/desktopmobile без открытыхfindings. Сохранённые снимки deck-flow, score-flow, discard-flow, flame-preview — настоящие browser fixtures. Keystore checkpoint pierrot-preview-signing.keystore сохраняется отдельно; его отсутствие при будущей сборке нельзя заменять новой подписью молча.

### 0.3.5 — просмотр колоды по1000029731.png

Скриншот получен от пользователя, геометрия окна и зон повторена; ресурс оригинала не включён в игру. Две вкладки, статистика текущей оставшейся/полной колоды, собственные картинки в четырёх рядах с перекрытием и приглушением, широкая Назад. Исправлен возврат из Escape: параметры не наследуют оформление колоды. Шесть deck-view размеров прошли,91core tests, полные browser/card/mobile/scoreflow regression. Сохранённый signingcheckpoint034 восстановлен;035 сохраняет package/signature и обновляет034. Реальный Androidruntime пока не проверен. Продолжаем lifecycle→cashout→shop по основному роадмапу.

###036 — утверждённая типографика

Rubik variable300–900 заменяет всеTiny5/Numbers. Одна family на каждом экране/картах/scorepopup. Fontweight400прибавление,800умножение. Старые fonts удалены, OFL заменён лицензиейRubik. Iconsмастей/фигур/рубашки собственныеSVG; декоративные символы не требуют другихшрифтов. Размеры букв под прежнюю геометрию. Полныйofflineexport и Androidassets должны включать толькоRubik.ttf/OFL.txt. Package/key сохраняются для обновления035; полный каталог и lifecycle по-прежнемуне реализованы.

###037 — момент сортировки/компактная рука

Пользователь утвердил экран колоды, имя/эффект выведены из DECKSmetadata поdeckId и в RunInfo. UI больше не занимает невидимые места новыхdrawcards во время played/discard/score: сначалаrender({...state,hand:remainingOldOrder}) и compact240ms, послеscore/finish renderfinalsortedhand + incomingflight330ms/stagger50 + движениеsurvivors. Save/dispatch прежние, одно списание/ревизия, ядро не менялось. НезависимыйQA rank/suit,manual,emptydraw,won,nodraw,reducedmotion, точноеравенствоstateсdispatch. Во время kill/pause сохраняется итогдействия, не промежуточнаяdisplayhand.

###038 — выравнивание HUD

Синийcounterjustifyend, красныйjustifystart, внутреннийpadding8px. Optionsx165 совпадаетRunInfo; подписи/диалоги Партия/Настройки. UnifiedRubik14px/700 для обеих кнопок. Проверка реальныхграниц чисел/кнопок пятиразмеров, включая500digitvalueformatter. Геометрия остального поля не менялась.

039: подсказка при pointerdown, передвижение card за пальцем и animated live insertion соседей. Порядок сохраняется только на drop, pointercancel восстанавливает прежние позиции. Подсчёт: scoringCardIds подняты на28px за200ms после центра, затем попапы по трассе. Core91; browser/scoreflow/hand-gap/card-gesture suites проходят. Независимый QA — docs/qa/card-gesture-review.md. Реальный Androidruntime не проверен.

040: integerBigInt numeric RAF interpolation; cancel/reducedmotion; counterdelta pop800blue/red; equalaction163×85/sort89×42 buttons and centeroptions padding0. Flame splitblue/red, broadvarying tongues andhot tips, height62 ceiling/loggrowth. QA выявил rarefirstframe RAFtimestamp<start: clamp progress0..1 исправляет отрицательный временный счёт без влияния на ядро. Протокол: docs/qa/hud040-review.md, flame040.md. Реальное Androidустройство не проверено.

041: база trace[0].after в предпросмотре; transientscoringPreview сохраняет её при полёте. Hold350ms, shorttap select, longhold inspectonly; releasepersist, blankdismiss, dragawaitmovementthenclose. Среда очищалась дважды до сохранения041: восстановлена040, повторены и перепроверены изменения. FinalAPK041 repack040native unchanged with26currentassets/versionattrs14, stablepreviewkey. Метод/actualchecks docs/android-toolchain-attempt.md; QA docs/qa/base-hold-review.md. PhysicalAndroidnotchecked.

042: общая entryanimation360ms из-за нижней границы viewport; отдельный translate сохраняет decktransform/scale. Отмена приreopen/close, reducedmotionskip. Queuedclose race пойман независимымQA и закрыт guardifopen/synccancel. Органическое пламя: общий асимметричный контур, мягкие слои и независимые узкие струи, logarithmicBigInt/max62/gap× сохранены. Root91core/browser/deck6/mobile7/scoreflow/base-hold/HUD4/dialog4 и независимые4menus×4viewports прошли. APK042/code15 — repacknative041 с новойUI, прежнийключ; device непроверен.

043: устранён цветовой шов пламени/scorebox. Основание использует#039fea/#f24b3d и непрозрачный наружный слой; яркие внутренние слои/струи затухают перед соединением. HUD4viewports/core91/общийbrowser прошли; визуально проверены обаPNG. APK043/code16 — UIassets/version update native042 с прежней подписью, rootbytecheck26assets/CRC PASS. ФизическийAndroid не проверен.

ПиксельныйQA043 нашёл остаточныеbrightrootpixels короткихwisps. Финально общийsource-atop gradienty45→58 соединяет всёнарисованноепламя с точнымcolorbox, сохраняетalpha/silhouette и×gap; APKперепакованпослеfix.

044: ×layout275/362/33/57, gridcentre+3pxbottompaddingдляоптическойсерединыRubik. Root4viewportsrectdx/dy0; pixelinkcentre291.5/390, центрпромежутка291.5/390.5 (растр0.5px).

## Передача08.10.2026
Пункты1–3 завершены. Сохранены045 и044, отдельная apk-reference. Actions37762538941 успешен:100core,9browser,freshnativecompile. Доставленный APK68113e6be5984a0979536b22dbde8bc281eaba86840eeaf29814dcfb643966be подписан прежним certificate5ff24a25ecf6b43e6ae02ee44c2568fcffd335f9a2c9222dd1892168e8d40d8e, CRC/alignment/28assets verified.
Пункт4.1: quoteShopCard/canAfford по Card:set_cost;109tests locallyPASS. Это подготовка экономики, ещё не магазин в UI. Следующий: catalogue+RNG/lifecycletrace, далее transaction state/UI. Полныйклон/runtimeparity не заявлены.

Shop research checkpoint:266 catalogue metadata entries extracted and validated for uniqueIDs and required name/cost/order; own source-location CSV. RNG call order mapped (Illusion eager poll, unkeyed first Buffoon). Exact original RNG runtime not yet validated; counter32 replay must not be used to claim original seeded parity.

Повторный CI37763832665/f6d06ec SUCCESS:109core,9browser,freshnativecompile,CIalignment/signature. Обновлённый пользовательский APK SHA2569d1efc8e0bb8a244b73a5af9b15b41e2edb48537ad35105a31535d45c60a99d3,29assets/signature/CRC/alignment PASS. См.docs/qa/actions-2026-10-08.md.


## Результат 0.4.6 — 08.10.2026

Добавлены главное меню, выбор красной или синей колоды, сид из восьми символов и первоначальный выбор малого блайнда. Открытие меню не записывает сохранение; продолжение не перемешивает руку. Замена существующей партии требует подтверждения до записи. Старые сохранения 0.4.5 продолжают прежний RNG, новые партии используют проверенную реализацию по APK.

Проверены 156 численных значений RNG, три полные последовательности колоды и шесть условных сценариев магазина. Исследование магазина использует полные исходные пулы. Операции и codec магазина готовы как основа, но его интерфейс пока остаётся сценой 0.4.5. Полный пункт 4 не завершён.

Actions 37769833942 и 37769840756 успешны на исходном коммите b51dda97332efc270ccb7185cbb7e14d4d22bdc8: 138 тестов ядра, десять наборов браузерных сценариев, свежая Android-компиляция. Root просмотрел итоговые скриншоты. Цвет синей рубашки исправлен и проверен.

APK 0.4.6, code 19, подписан прежним сертификатом. SHA256: 7d46e38a240bea0a830fe4fa399c53d31a0f0b2b48933758c98cfb0e39914e64. CRC, выравнивание, подпись и совпадение всех 36 ресурсов проверены. Проверка на физическом Android-устройстве впереди. Подробный отчёт: docs/qa/actions046.md.

Следующая задача: полная генерация магазина с условиями профиля, эффекты товаров, интерфейс покупки/продажи/обновления, паки и ваучеры; затем следующие блайнды. Не возвращаться к реализации уже проверенного меню и не сокращать пул до четырёх поддержанных джокеров. Статические риски отмены анимаций и проверки типа referenceRng записаны в docs/qa/integration046-review.md; фактических регрессий в проверенном объёме не найдено.

## Shop producer checkpoint — 08.10.2026

Preserved 0.4.6 branch verified at73aefc0. Added own factual complete catalogue and pure conditional APK shop producer. Six original fixture cases match inventory, prices, editions, keyed streams and native RNG state. Independent review reproduced catalogue/fixtures and checked sparse Tarot rejection pools. Final root local test run155/155. Public inputs revalidate; overflow/invalid category probes reject. Actions37774584780 and37774590241 SUCCESS on2ae77f8:155core,10browser,freshnativecompile,CIAPKverification. See docs/qa/actions-shop-generator.md.

Current scope: producer foundation only; NOT yet called by runtime app/run or save codec. No new playable shop/APK claimed. UI geometry is measured in docs/ui/shop-apk-layout.md. Lifecycle source facts in docs/apk-findings/next-blind-lifecycle.md. Next: exact startup boss/voucher/tags and persistent actual selection context; cashout shop integration; complete effect handlers and UI, then next blinds. One agent hit service usage limit; its saved code was reviewed and root resumed verification, without losing files.


## Shop run/save integration — 08.10.2026

New runs opt into original conditional producer, select voucher before shuffle, track played hands and persist exact inventory/RNG/context. Cashout generates complete ordinary shop pools; reroll preserves voucher/booster areas. Legacy saves retain previous behavior. Independent review found malformed native inventory acceptance and unsavable next-ante transition; regression tests reproduced both, now fixed.169 core tests pass. New shop-state browser suite verifies cashout once, four viewports, exact saved inventory after reload and failed-write atomicity. Actions37777930878 and37777937355 SUCCESS:169 core tests,11 browser suites,fresh Android compile,APK signature/alignment checks. Task3 native effect handlers/transactions/UI and Task4 lifecycle are not implemented.

## Shop UI/effect slice in progress — 08.10.2026

Ruling: Task3 is implemented in tested content batches (32 stateless scoring Jokers first) while the complete original random pool remains intact. Remaining118, consumables, boosters/vouchers, retriggers and fractional editions remain explicit open requirements; no whole-task completion claimed. This preserves a verifiable intermediate release rather than approximate effects. Cost if wrong: supported content must be expanded/reverified; no removed scope.
Ruling: expose confirmed Small→shop→Big→shop ordinary ante1 progression now so purchases can be used in play; boss selection remains unavailable until its effects are verified. This overlaps the confirmed portion of Task4 without claiming whole lifecycle completion. Cost if wrong: lifecycle/RNG trace correction; current limits are explicit.
32 native scoring Jokers and foil/holographic/negative supported, native buy/sell/reroll UI connected. Full played IDs are now persisted to distinguish kickers/hand-size triggers during score replay validation. Independent original Card oracle906cases (supported branches >850),12 contains,39configs; not Android/full event-loop execution. Root198tests pass; browser/Android verification pending.
Fresh reviewer found malformed native buy metadata and playing-ID collision acceptance; root regression reproduced RED, strict precharge guard now GREEN with full suite. Earlier arithmetic test expectations corrected against nominal chips and native effect facts (Scholar pair134chips, Walkie Talkie4 scores95); production amounts unchanged.

UI verification note: first Actions37784772297/37784778924 failed on actual owned-Joker long press after reload, while prior11UI suites passed. Diagnostic run37785909499 recorded pointerdown target.shop-choice, not button. Root cause was class collision: owned card had shop-owned container class (pointer-events:none). Dedicated owned-card class fixes the source; real long-press regression remains required. No APK delivery based on failed run.

Second UI finding: long press now passed; reroll button stayed enabled with old price during awaited outgoing-card animation. State/payment were already committed once, but view readiness was incorrect. Controls now lock synchronously after successful persistence, before inventory exit, and unlock on final render. Actual buy/sell/reroll/reload/failure suite is rerun first, followed by all prior regression suites.

## Передача 0.4.7 — 08.10.2026

Actions37786436604/37786439701 SUCCESS на78fad1d728e68dda3b07c4b0ebe74cfe62ad59f2:198core,12UI suites,freshnativecompile. Реальные long-press/reroll регрессии исправлены и прошли. Root визуально просмотрел магазин на1536×688 и360×800 и видимость купленного джокера в большом блайнде. Stable APK0.4.7/code20 SHA25665f1458e38462116a610c7bb339326b21b7b1f383cdf5a12573942ba6ffdc9e5,42offlineassets/55payloadentries/CRC/alignment/signature verified. APK сохранён для скачивания. Device check pending. Полнота Task3/Task4 не заявлена;32/150 эффектов и обычный Small→Big подтверждены. Подробный отчёт docs/qa/actions047.md.


## Проверенные правки интерфейса 0.4.8 — 08.10.2026

Панели блайндов имеют одинаковые размеры; статусы21px; кнопка пропуска внутри границ. Нижние кнопки покупки удалены: покупка перетаскиванием в верхнюю зелёную область с ценой; цены над товарами и продажа купленного джокера сохранены. Отмена, отпускание вне зоны, недостаток денег/слотов и неподдержанный эффект не списывают деньги. Экономика и схема сохранения не меняются.

Actions37812813108 SUCCESS на f90446d94d921fe7a26afb71c24168fcf15ba34e (merge checkout99680e16e9e4202c606824bec678c2198abc3c85):198core/12browser/freshGradle. Перетаскивание мышью и реальными touch-событиями, отмена, ошибки записи, продолжение и геометрия на четырёх размерах проверены. Снимки shop-buy-zone, blind-selection046 и shop-568x320 просмотрены. APK0.4.8/code21:42offlineassets byteequal;55non-signature entries unchanged after signing;CRC/signature/16KB alignment PASS;certificate прежний. SHA256713e6bdd43d150188fbac4806e074142667612cc3cab5455031e8df3be1597c8. APK сохранён для скачивания. Физический Androidruntime не проверен; оставшийся контент полного переноса игры не меняется. Подробности docs/qa/actions048.md.


## Передача бэклога после 0.4.8

Пользователь поручил сначала собрать/отсортировать замечания, не исправлять всё сразу. `docs/backlog.md` — 9 открытых требований и 4 уже проверенные правки 0.4.8. Проверена текущая реализация, обнаружены английские запасные названия, удержание подсказки, мгновенный возврат и шрифт кнопок13px. Независимые аналитики исследовали24награды за пропуск и полное меню колоды по Lua оригинального APK; два исследованных файла сверены побайтно с APK. Нового запуска оригинала/телефона или сборки не заявляем. Следующий плановый блок — управление и русификация/читаемость, игровые награды за пропуск связаны с полным циклом и соответствующими обработчиками.

## Celestial pack block — 09.10.2026

Eight Celestial booster identities now share the exact Normal 3/1, Jumbo 5/1 and Mega 5/2 lifecycle. A 64-case native fixture covers Telescope, Black Hole, bans, owned/offered/generated duplicate suppression and Showman with exact keyed-stream states. Opening pays once, generated Planets/Black Hole apply immediately without a consumable slot, Mega choices and the underlying shop survive reload, and skipping neither refunds nor consumes RNG. Strict save/dispatch validation and a dedicated selection UI use only project artwork. Core has 301 passing tests; official browser/Android CI remains the release gate. Other pack families, profiles and source animation timing remain open.

## Targetless money Tarot block — 09.10.2026

Hermit and Temperance use exact APK money formulas, consume/count while debuffed without payout, preserve RNG and persist Tarot totals/last key. Native shop purchase and the existing owned-card use interaction are enabled only for these two Tarot identities. The other 20 remain explicitly unavailable. Core has 307 passing tests; official browser/Android CI remains the gate.




## Fool Tarot block — 10.10.2026

Resumed existing feat/fool-tarot-015 without discarding prior work. PR #11 is merged at b61b2b52eeed1ae3d3bd759ad5c91e185c09bcc1; Android Actions37957172138 SUCCESS. Fool copies the previous Tarot/Planet before last-key update, frees its slot, respects remaining capacity after negative removal, and uses native quotation. Five raw constructor/juice draws advance Math RNG for both motion modes; no keyed selection/edition draw. Legacy RNG remains unchanged. Banned forced-key fallback stays explicitly unavailable until combined Tarot_Planet pool ordering is verified. Full original deferred sound/visual RNG remains a parity gap. Independent QA found malformed context throw; regression RED→GREEN fixes it. 320/320 core, desktop/touch/double click/reload/failure-to-save UI PASS locally using research Chromium. Official CI and Android remain mandatory before merge. No original resources added. Next: complete CI/merge then targeted Tarot and playing-card modifiers.

Fool final gate: Actions37992249865 on 0824c96a08161567a1eb23e83f9433a13accffcf SUCCESS, all23 official UI suites, fresh Android compile/package/signature/alignment and artifact upload. PR #12 merged at 0b4078f071f14ccf5f2c0c9bf44014f98adbbcd4. Local full23 UI suites also PASS. No physical-device or full-game acceptance claimed. Next: targeted Tarot and playing-card modifiers; hands.js currently rejects enhancements and score.js rejects playing-card edition/seal/debuff, so implement those contracts before enabling target effects. The approved original art/audio exclusion remains unchanged.

## Devil / Gold Card block — 11.10.2026

Devil converts exactly one selected held card to Gold without RNG and preserves physical rank/suit identity. Eligible Gold Cards pay $3 in hand order only after a successful round, before interest; play/discard, Hook, game-over, boss-debuff, face-down, reload and double-payment boundaries are covered. The release remains intermediate: Mime and Red Seal retriggers are deferred with those still-unsupported general mechanics. Official Chromium/Android CI remains the merge gate.

## Hanged Man / Death deck-composition block — 12.10.2026

Hanged Man permanently removes one or two selected held cards without replacement or gameplay RNG. The shortened hand, reduced deck, current blind concealment and ante/Pillar identity ledgers persist safely. Death requires exactly two selected held cards and makes the visually left card copy the visually right card regardless of click order, while preserving its physical identity and native creation-order shuffle position. Current rank, suit and enhancement are copied; a base source removes the target enhancement. Debuffed consumables are consumed and counted without applying either effect.

The save codec records generic and Hanged-specific destruction ledgers and ties the current Hanged Man shortfall to the newest Hanged entries, so neither a debuffed use nor Glass destruction can authorize missing cards; the complete generic ledger permits an honestly reached empty deck. Serpent overdraw and post-win use retain their native pre-existing hand-size differences. Mark concealment remains attached to a transformed original face-card identity without accepting arbitrary hidden pips. Core has 397 passing tests. The dedicated Chromium scenario is registered in official CI; local execution is unavailable because this workspace has no Playwright browser binary. Android CI remains the release gate. Removal-trigger Jokers and Death copying future edition/seal/permanent fields remain deferred until those general mechanics exist.


## Продолжение 14.10.2026 — П-05н

База043d8bbe. Каталог53/150: эффекты денег/колоды/held, сохранённая история PR25–27, Four Fingers/Shortcut и Golden/Cloud. Критические Hook/score snapshot/frozen cashout исправлены; Blue согласованная подмена и Hanged shortfall покрыты. Генератор Arcana140 native cases подготовлен, Celestial materialize RNG исправлен. Core864 PASS после независимого QA. Первый срез951858b: Actions38558257199 SUCCESS, 35browser/freshAndroid/signature/alignment; новый0.4.33/code46 требует36browser/freshAndroid CI. Full seed/event RNG (Stone), retriggers, прочие97джокеров/Judgement, Arcana lifecycle и финальные боссы/победа/Endless остаются открытыми. Полная игра и физическая приёмка не заявляются.

## Проверка 0.4.33 и следующий этап — 14.10.2026

PR28 слит в f37712f после Actions 38565975326/38565984439 SUCCESS: 36 браузерных сценариев, fresh Android, подпись и alignment. История PR25–27 сохранена; Blue Joker/Swashbuckler интегрированы, каталог 53/150. 864 теста ядра PASS с приватным нативным оракулом; в CI этот необязательный тест пропускается. APK debug без гарантии обновления, физическое устройство не проверено.

Активная ветка feat/showdown-lifecycle, checkpoint 7d07564. Task 1: нативные callbacks и finite target helpers выполнены, проверки соответствия и качества завершены. Task 2: Leaf/Vessel в работе. План: docs/superpowers/plans/2026-10-14-showdown-lifecycle.md. Подготовка helpers не означает готовую победу/Endless. Остальные 97 джокеров, полные пулы и профиль остаются открытыми.

## 14.10.2026 — финальные боссы, source checkpoint

Leaf/Vessel и общий нативный disable реализованы и прошли независимое ревью после двух циклов исправлений. Проверены старые включённые боссы, сохранения после победы, исторический добор Serpent/Blue Joker, восстановление рук Needle и фиксированная выплата. 83 целевых и910 полных тестов PASS; нативная проверка Golden/Cloud9 исполнена на восстановленном pinned LuaJIT, без SKIP. Полная Android-приёмка этого этапа пока не выполнена.

Следующий блок — исправление автономного HTML-exporter: source-only CI38568496507/38568490947 упал на offline startup, собственное воспроизведение подтвердило рекурсивный обход циклических ES modules. После него продолжаются Heart, Bell/Acorn, победа и Endless; базовый каталог остаётся53/150. Ни новая финальная игра, ни APK-релиз этим checkpoint не заявляются.

Автономный exporter исправлен нативной import map со стабильными встроенными data-module identities. Регрессия stack overflow воспроизведена до изменения, циклический ESM и shared dependency identity проверены; 56 целевых и911 полных тестов PASS. Независимое ревью без замечаний,50 модулей/162 зависимостей и UTF-8 проверены. Реальный Chromium offline startup/reload и Android CI ожидаются; локальный браузер отсутствует. Далее Heart.

Checkpoint a9caf28 проверен CI38634841041/38634851227 SUCCESS:36 Chromium suites, настоящий portable HTML offline/reload, fresh Android, подпись/alignment. APK artifact11927439793 ZIPsha2560bd8f0b56925e5c8d7dcb04949f23470c2b2b90acdfd0048bbe186f74e88ec4c; preview debug, без гарантии обновления и без physical-device проверки. Heart в этот checkpoint не включён: локальное ревью требует исправить Glass→Heart raw RNG save validation. PR29 остаётся draft.

Heart завершён в core/save: initial/PLAY выбор по native creation order, DISCARD без poll, отключённое владение отдельно от магазина/эффектов, score-time replay и frozen bonuses. Ревью исправления Glass→Heart прошло: точный выбор и полный post-poll RNG проверяются при сохранении, no-poll controls сохранены. 62 целевых/929 полных тестов PASS,0skip; mixed Glass/Lucky независимо проверены. UI-представление и Ante8→9 ещё принадлежат Task4/6. Подготовлен фактический source index97 оставшихся Joker centres, без копирования исходного кода и без заявления новых эффектов.



## 23.10.2026 — 10г завершён

Все20испытаний, специальные правила, ограничения, профильный прогресс и сохранения выполнены. Actions39906363695 SUCCESS:1640corePASS/2optional skips,50Chromium suites,freshAndroid/APK PASS. APK0.4.46-preview/code59, PR42 готов (не слит). Актуальное состояние — STATUS.md; доказательства — docs/qa/item10d.md. Следующие пункты без выбора пользователя не начинать.

## 23.10.2026 — интеграция10г и начало11

PR42 объединён в7cbf568; 10а–10г технически выполнены. №11 выбран пользователем: собственные WebAudio музыка/эффекты, сохранённые отдельные регуляторы, lifecycle и читаемые отличия изданий. Ветка feat/item11-polish, PR43, кандидат0.4.47/code60. Core1646PASS/0FAIL/2optional skips; оба Important review воспроизведены и исправлены RED→GREEN. Финальный платформенный CI/визуальная проверка/APK ещё обязательны; №11 открыт. №12 не начинать автоматически.

23.10.2026 — №11 завершён технически: собственный звук/музыка, настройки/lifecycle, покрытия карт и UX. CI39937600861 SUCCESS:1646corePASS/0FAIL/2optional skips,51Chromium suites,freshAndroid/signature/alignment PASS. APK0.4.47/code60,91assets byte-identical. PR43 готов, пока не слит; подробности STATUS.md/docs/qa/item11.md. Физический Android и пользовательская приёмка отдельно. №12 не начинать без выбора.

23.10.2026 — №12 выбран: PR43 объединён вa3c74aad; временный проверочный сид13031990 реализован. Все15колод/8ставок/20испытаний/пулы/коллекция открыты/$100, обычный профиль сохранён. Core1650PASS/0FAIL/2optional skips, browser/AndroidCI ещё требуются. См.docs/plans/item12.md и docs/qa/item12.md.
