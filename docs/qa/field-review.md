# Независимое review поля / Android, 07.10.2026

База: `e62c595`; проверены текущие незакоммиченные `src/core/run.js`, `src/persistence/repository.js`, `src/ui/**`, `web/**`, `android/**`. Продуктовый код не изменён. Прочитаны AGENTS.md, docs/design.md и план field-android. Охват: playable preview одного Small Blind; полнота игры и каталога не оценивается как завершённая.

## Findings

### Important / P1 — ошибка чтения одного слота блокирует исправный второй слот

**Место:** `src/persistence/repository.js:11–17`; native trigger: `android/app/src/main/java/ru/cardcascade/game/CardStorage.kt:34–40`.

`load()` читает оба слота внутри одного try. Если current не читается, backup вообще не исследуется. Если backup не читается, уже прочитанный исправный current также не возвращается. Native reader явно отказывает для нулевого файла, превышения 2 MiB и некорректного UTF-8. Это реальные варианты повреждения, для которых наличие исправной резервной записи должно давать восстановление.

**Воспроизведение:** использовать настоящие repository/codec, возвращать валидный сериализованный playing-state для backup, а `read('current')` заставить бросить ошибку чтения/декодирования. Получено `{status:'error'}`; журнал вызовов — только `['current']`. Обратный случай (исправный current и ошибка backup) также даёт `error`. Ни один write не выполняется.

**Влияние:** исправный забег недоступен; Android UI не предлагает восстановление и пользователь не может продолжить без внешнего вмешательства. Неразрушающее сохранение файлов соблюдается, доступность резервной записи — нет.

**Исправление:** обследовать слоты независимо, различать отсутствие, повреждение и ошибку чтения; исправный current должен работать независимо от backup. Исправный backup при повреждённом/нечитаемом current должен давать явное восстановление. Не превращать ошибку чтения обоих слотов в empty. Добавить тесты обеих асимметричных ошибок. Фактическую передачу native read-error через JavascriptInterface проверить отдельно на WebView; она не проверялась на устройстве.

### Important / P2 — восстановление перезаписывает новый current другого writer

**Место:** `src/persistence/repository.js:27–29`.

`save()` проверяет `observed`, но `restoreBackup()` пишет current без этой проверки. Согласие на восстановление повреждённой записи становится устаревшим, если другой writer уже исправил/заменил current.

**Воспроизведение:** current=`'corrupt'`, backup=валидный playing-state; `repo.load()` возвращает recovery. Затем другая вкладка записывает новый валидный current. Вызов `repo.restoreBackup()` безусловно заменяет его старым backup. Воспроизведено настоящим repository и codec; `newer current overwritten === true`.

**Влияние:** потеря нового забега/прогресса при подтверждении старого recovery dialog в другой вкладке. Обычная защита save от другого writer здесь не действует.

**Исправление:** перед restore проверять, что состояние current соответствует наблюдавшемуся при recovery; если оно изменилось, перечитать/предложить актуальное состояние, не перезаписывать. Случай read-error нуждается в явном контракте вместе с исправлением P1.

## Проверки и границы доказательств

- `node --test tests/core/*.test.js`: **79 tests, 79 pass, 0 fail**, запущено независимо.
- Отдельные воспроизведения двух ошибок repository выше выполнены Node, без изменения продуктового кода.
- Статически selection ограничен пятью ID; ядро отдельно отвергает больше пяти. REORDER_HAND требует точную перестановку, увеличивает revision и не расходует RNG/ход. Scoring и discard используют порядок `state.hand`, а не порядок касаний; codec сохраняет его. Проверки reorder проходят.
- PLAY_HAND устанавливает busy до dispatch/save и держит блокировку во время scoring animation. selected очищается после успешной записи; при ошибке сохранения state не заменяется. Реальные повторные pointer-события в браузере не проверены.
- Native shell обслуживает GET локального HTTPS origin, запрещает внешний origin/невалидные пути, file/content access; bridge ограничен read/write слотов. Устройство, Gradle APK build и фактические AtomicFile failure paths не проверены.
- Browser test **не выполнялся**: Chromium отсутствует; по переданному root blocker загрузка вернула HTML SiteUnavailable. Скриншот, реальные hitboxes, drag, масштабирование и Android lifecycle не прошли runtime приёмку.
- Layout использует ручные координаты 1536×688 и uniform scale. Пиксельная/полная parity не заявляется; style/card art и inferred slot regions остаются промежуточными.

**Первоначальный вывод:** требовалось исправление двух findings хранения перед закрытием review. Отсутствие нового каталога, магазина и прочих full-game механик соответствует явному охвату этого этапа.

## Повторное review исправлений

Проверены только изменённый `src/persistence/repository.js` и три новых теста в `tests/core/repository.test.js`. Первоначальные finding descriptions выше сохранены как история обнаружения, а не открытые дефекты текущего кода.

- **P1 закрыт на уровне repository.** Чтения независимы; внутренний sentinel различает read-error и отсутствующий слот. Повторная независимая проверка: unreadable current + valid backup → recovery, valid current + unreadable backup → current. В обоих load-сценариях записи отсутствуют. Unreadable current + empty/corrupt backup → error, автоматическая save запрещена, writes=0. Новый тест отдельно подтверждает явное успешное восстановление unreadable current из валидного backup.
- **P2 закрыт для воспроизведённого stale recovery.** restore повторно сверяет current с observed; другая валидная запись после recovery вызывает ошибку до write. Независимая проверка подтверждает сохранность и нового current, и backup. Новый тест покрывает этот случай.
- `node --test tests/core/*.test.js` повторно запущен независимо: **82 tests, 82 pass, 0 fail**.

Новых findings в этом ограниченном повторном review нет. Вывод относится к repository и тестируемому контракту backend: передача ошибок Kotlin JavascriptInterface в WebView, браузерный UI, скриншот/hitboxes, APK и native AtomicFile failures по-прежнему не прошли runtime проверку. Наличие этих исправлений не превращает ручную геометрию в принятую pixel parity.

## Финальная проверка backend boundary

Прочитаны новый `src/persistence/backend.js`, два теста `tests/core/backend.test.js` и подключение адаптера в начале `src/ui/app.js`. Native read принимает только string: undefined/null/non-string не превращается в отсутствующий слот. Native write принимает только `true`; false/undefined приводит к ошибке записи. Browser getItem(null) корректно обозначает отсутствующий слот; setItem errors не подавляются. App использует этот адаптер и не обращается к browser storage при наличии native bridge.

Два новых backend tests независимо выполнены: **2/2 pass**. Полный `node --test tests/core/*.test.js` после добавления адаптера: **84 tests, 84 pass, 0 fail**. Новых findings в проверенном boundary нет. Это проверка JS адаптера с fake I/O, не фактическая проверка Android bridge, UI или файловой системы устройства.
