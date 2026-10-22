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
