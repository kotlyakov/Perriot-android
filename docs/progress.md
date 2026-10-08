# Текущий срез — 07.10.2026, 0.4.5-preview

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
