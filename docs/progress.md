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
