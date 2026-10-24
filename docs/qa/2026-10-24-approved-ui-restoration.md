# Восстановление утверждённого UI — 24.10.2026

Ветка: feat/menu-motion, исходная база origin/feat/ui-windows-review. Утраченный локальный commit04694ae не найден; его Git-объект, полное дерево и прежняя история не объявляются восстановленными.

Источник — сохранённый полный реестр recovered-approved-ui.md и полные HTML-показы pierrot-settings-paper-full.html / pierrot-home-motion-review.html. Реестр и паспорта сохранены в docs/approved-ui. Десять исходных файлов home-v1/settings-v1 побайтно совпадают с прежними SHA256SUMS: layout, обе CSS главной, start-screen.js, settings-paper.js, window-motion.js, game-speed.js, menu-windows.js, window-review.css, build-settings-review.mjs. Полные функции home/menu извлечены из сохранённого HTML с восстановлением import/export; совпавший SHA подтверждает итог. Rubik.ttf в web/fonts также совпадает; архив не дублирует шрифт.

Рабочее приложение использует точные снимки главной, настроек и motion. Новая интеграция: движения dialog с отменой устаревшего закрытия; общий gameDuration для карточных полётов, подсчёта, HUD, магазина и cashout, независимо от core/RNG/audio и окон настроек. Android WebView отключает DOM storage: через существующий CardStorage добавлен отдельный малый AtomicFile game-speed с белым списком0.5/1/2/4 и явной ошибкой записи. Состояние скорости меняется лишь после успешной записи. Профильный ввод/сохранение ограничены10символами согласно отдельно сохранённому требованию; старые сохранения не удаляются. Генератор общего показа использует реальные новые модули.

Проверки:

- npm test:1663tests,1661PASS,0FAIL,2expected optional private-source skips. Финальный повтор после лимита имени — тот же полный прогон.
- Целевые native-menu-layout/game-speed/settings-motion/profile-store:13/13PASS. Проверены недопустимые/повреждённые значения скорости, отказ записи, native bridge без DOM storage, звук0%, последовательность выхода/входа бумажных вкладок, быстрый выбор последней вкладки, масштаб движения и отмена устаревшего закрытия, атомарное имя.
- node scripts/build-native-menu-review.mjs и node scripts/build-settings-review.mjs:PASS; последняя дополнительно компилирует синтаксис показа. node --check изменённых JS и git diff --check:PASS.
- tests/ui/approved-ui-restore-check.mjs подготовлен для1536/915/568, mouse/touch/reduced-motion, сохранения скорости, настроек и первого розыгрыша. Локальный запуск остановился ДО тестов: Chromium отсутствует. Playwright install chromium завершился ошибкой «End of central directory record signature not found» после повреждённых загрузок. Браузерный PASS и визуальная проверка этой интеграции не заявляются. Логи scratch: /tmp/restored-ui-core-final.log и /tmp/restored-ui-browser.log.
- APK, Gradle/физический Android, CI и слияние не запускались в этом восстановлении.

Пользователь отдельно поручил сохранить восстановление в GitHub и затем продолжать джокеров. Это новое разрешение на push; прежние оговорки в архивном реестре сохранены как историческое свидетельство, а не текущий запрет. Внутренние окна профиля/коллекции/новой партии и игровое поле не получают дополнительной пользовательской приёмки от восстановления home/settings.
