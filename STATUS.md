# Пьеро — текущий статус

22.10.2026 — пользователь выбрал 10в. Реализованы профиль/разблокировки/коллекция/статистика и Gold Legendary seed filtering в feat/item10c-profile. Кандидат APK0.4.45-preview/code58; последний выпущенный APK0.4.44. 10в пока в финальной проверке, не объявлен завершённым.

Состояние: три независимых профиля, атомарный account+run envelope с совместимым state, legacy migration без исторических достижений, native unlock/discovery/usage/career/sticker rules, закрытые колоды/ставки, коллекция по12категориям и статистика. Независимые ревью исправления проверены регрессиями. Полный core1602PASS/0FAIL/2private-source skips (1604total);69целевых profile testsPASS. Gold prediction200native original-function casesPASS. Browser/freshAndroid CI и APK ещё требуются. Физический Android/fullframe RNG parity не проверены. Исходники kotlyakov/Perriot-android, интеграционная ветка apk-reference.

Локальный код f749660273e0d8a817cde5aa8d059971d213c25d, ветка feat/item10c-profile. Push дважды отклонён автоматической проверкой: remote публичный, нужно прямое разрешение пользователя на отправку изменений. Подтверждено GitHub API: владелец и подключённый пользователь kotlyakov; URL совпадает с проектом. Видимость не менялась. PR не создан (head ещё отсутствует на remote), CI и APK не запускались.

Следующий шаг: получить прямое разрешение на push в публичный kotlyakov/Perriot-android; затем browser/Android CI, просмотр снимков, проверка APK и PR. 10г (испытания) не начинать без выбора пользователя. План docs/plans/item10c.md; native sources/docs: docs/rules/profile.md.

## Предыдущий проверенный результат

# Пьеро — текущий статус

22.10.2026 — 10б завершён технически: все8накопительных ставок,3кривые целей/Endless,Red/Blue и Eternal/Perishable/Rental с исходным порядком конца раунда. APK0.4.44-preview/code57. Source d2323532a3810696af6cca76b7e179f2c396722c; tested merge1a4ccc10caa1eaef1acb8fef8c2d931003a741ad:0файловых различий. CI39756907018 SUCCESS:1533corePASS/0FAIL/2private-source skips,48Chromium suites,freshAndroid/signature/alignment PASS. Все79offlineassets побайтно равны исходникам; desktop/touch снимки просмотрены. Независимое ревью: оставшихся Critical/Important нет;72passive/boss/payout/shop перехода и4Ankh/Invisible copy PASS. SHA256 cd37a1fc6e4311190a43c3f92dfa3c21632fd227d9f4f29a4cbe61302bacf08f;artifact12417515349. Следующий10в:профиль/разблокировки/коллекция/статистика, включая Gold profile-based automatic Legendary seed filtering;10г:испытания. №10 целиком открыт. Физический Android и fullframe/event RNG parity не заявлены. Отчёт docs/qa/item10b.md.

Репозиторий kotlyakov/Perriot-android, интеграционная ветка apk-reference. PR40 слит в apk-reference: merge e468176d8296f66c8c77d55401bb90db29e6c1da. Рабочая ветка feat/item10b-stakes. Игровой код равен проверенному source выше.

10а:15колод — завершён. 10б:8сложностей — завершён. Далее10в:профиль/разблокировки/коллекция/статистика;10г:испытания. До10в все колоды и ставки доступны в явно помеченном предпросмотре. Gold подбор случайного стартового зерна с учётом профильных побед Legendary относится к10в.

Подпись этой CI-сборки отличается от0.4.43: установка поверх неё невозможна; удаление приложения стирает локальный прогресс. Удаление не рекомендуется и не выполнялось. Физическое устройство не проверялось.
