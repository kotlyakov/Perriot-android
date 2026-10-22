22.10.2026 — 10в реализован локально в feat/item10c-profile, source f749660273e0d8a817cde5aa8d059971d213c25d. Полный core1602PASS/0FAIL/2private skips,69profile checksPASS,200native Gold fixturesPASS. Browser/Android/APK ещё не проверены. Push в публичный kotlyakov/Perriot-android отклонён auto-review: требуется прямое разрешение пользователя на публичную запись. Последний выпущенный APK0.4.44; кандидат0.4.45/code58 не собран. 10г не начат. Подробнее STATUS.md и docs/qa/item10c.md.

22.10.2026 — 10б завершён технически: все8накопительных ставок,3кривые целей/Endless,Red/Blue и Eternal/Perishable/Rental с исходным порядком конца раунда. APK0.4.44-preview/code57. Source d2323532a3810696af6cca76b7e179f2c396722c; tested merge1a4ccc10caa1eaef1acb8fef8c2d931003a741ad:0файловых различий. CI39756907018 SUCCESS:1533corePASS/0FAIL/2private-source skips,48Chromium suites,freshAndroid/signature/alignment PASS. Все79offlineassets побайтно равны исходникам; desktop/touch снимки просмотрены. Независимое ревью: оставшихся Critical/Important нет;72passive/boss/payout/shop перехода и4Ankh/Invisible copy PASS. SHA256 cd37a1fc6e4311190a43c3f92dfa3c21632fd227d9f4f29a4cbe61302bacf08f;artifact12417515349. Следующий10в:профиль/разблокировки/коллекция/статистика, включая Gold profile-based automatic Legendary seed filtering;10г:испытания. №10 целиком открыт. Физический Android и fullframe/event RNG parity не заявлены. Отчёт docs/qa/item10b.md.

22.10.2026 — 10а завершён технически: все15колод, их стартовые/постоянные эффекты, выбор и сохранения. APK0.4.43-preview/code56. Source d3518d1ec74521936908291002f7b580b46eb215; tested merge071ac9ac7c78c055d25dfb2ed972a8ce24b79a41:0файловых различий. CI39727016489 SUCCESS:1511corePASS/0FAIL/2private-source skips,47Chromium suites,freshAndroid/signature/alignment PASS. 75offlineassets побайтно равны исходникам; новые desktop/touch снимки просмотрены. Независимое ревью: подтверждённых Critical/Important нет;35disable edges+2Green earned-disable+Abandoned Erosion PASS. APK SHA256 ed6a784d598372e03c0b8eb28091c4e09d08f574af3e3d69d8f8ce0db1c12314;artifact12403338565. Следующий10б:8сложностей;10в:профиль/разблокировки/коллекция/статистика;10г:испытания. Физический Android и fullframe/event RNG parity не заявлены. Отчёт docs/qa/item10a.md.

22.10.2026 — пользователь разделил №10 на четыре части: 10а колоды, 10б сложности, 10в профиль/разблокировки, 10г испытания. Реализуется только10а. Все15колод и их эффекты, выбор, сохранения подготовлены;30целевых тестов, включая15×28боссов, PASS. Финальные независимое ревью, browser/Android CI и проверка APK ещё требуются. Последний выпущенный APK0.4.42; кандидат0.4.43/code56. 10а пока не объявлен завершённым.

№9 | некритическое, высокий | Все32ваучера/24тега | Исходные эффекты, UI, save/replay и провереннаяAPK | технически выполнено22.10.2026; пользовательская приёмка отдельно | 0.4.42 / PR38

19.10.2026 — №8а завершён технически: все8наборовТаро,22Таро+редкаяДуша, целевая рука, Mega, owned-use и save/replay. APK0.4.40-preview/code53. Source e74b71a46fa5789b3f6336b780b4a75355828c0a; tested merge994f8a437a8b2c29d9cdf387251cf099e31e554e:0файловых различий. CI39270148693 SUCCESS:1369corePASS/2private-source skips,44Chromium suites, freshAndroid/signature/alignment PASS. Локально1372/1372PASS0skip с private native sources;714nativeSoulcases+140Arcanafixtures. Независимое ревью: stale consumed Hanged epoch исправлен RED→GREEN, повторная проверка обоих путей PASS, открытых Critical/Important нет. APKartifact12195183891 SHA256e4436be780452a482286250c6d226eef2272e85e068341147ff03a8a9cac95d7;69offlineassets byteequal; desktop/mobile screenshots просмотрены. Debug-подпись отличается от0.4.39: поверх неё не обновится, удаление стирает локальный прогресс. Физический Android, профиль/discovery и полная frame/event RNG parity не заявлены. №8б не начат; ждать выбора пользователя. Отчёт docs/qa/item8a.md.

19.10.2026 — выбран №8а: наборы Таро. База №7б слита PR35/d4b3792; ветка feat/item8a-arcana, кандидат0.4.40/code53. Реализованы8Arcana identities,22Таро+редкаяДуша, целевая рука, Mega/owned-use, сохранение, Hallucination-before-generation и714nativeSoulfixtures. Независимое ревью нашло stale consumed Hanged epoch: RED→GREEN. Локальные целевые проверки пройдены; финальный core/browser/Android CI иAPK ещё требуются. №8а не объявлен завершённым; №8б не начат. Подробности docs/qa/item8a.md.

# Текущий этап — №7б

- [x] Восстановить43 оставшихся эффекта и «Суд».
- [x] Нативные fixtures1004+2000 и43×28boss matrix.
- [x] Исправить потерю creationOrdinal counter в score→reducer (RED→GREEN).
- [x] Исправить blind-start order/reservations (5регрессий,3RED→GREEN).
- [x] Финальный полный core-прогон после исправлений.
- [x] 43браузерных набора desktop/touch.
- [x] Fresh Android build, подпись, alignment, APK asset equality.
- [x] Итог ревью и передача0.4.39APK.

№8 не начинать без выбора пользователя.

PR35 готов к слиянию, не слит. APK0.4.39 передан. Физическое устройство и общая frame/event RNG parity не входят в закрытый механический срез.
