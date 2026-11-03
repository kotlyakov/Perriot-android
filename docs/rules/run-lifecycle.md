> Изменение по прямому поручению пользователя, 28.10.2026: аренда удерживает $3 за каждого принадлежащего игроку арендного джокера в начале каждого действительно начатого раунда (`START_BLIND`), до эффектов начала блайнда. Ослабление, вечность и истёкший временный срок не отменяют аренду; баланс может стать отрицательным. Пропуск блайнда не является началом раунда. В конце раунда аренды нет; цена покупки арендного джокера остаётся $1. Прежние native-правила Rental ниже описывают исходник и не действуют для новых действий. Старые replay-переходы без `rentalTiming` проверяются по историческому правилу; первое новое действие записывает переход на `round_start`, сохраняя историю.

# Жизненный цикл забега: дополнительная проверка

Дата проверки: **07.10.2026 (UTC)**. Область: GAP-RULE-001..003 из `docs/rules-source-check.md`. Версия профилей wiki относится к ранее выбранной базе 1.0.1o-FULL; перенос на целевой Android app 1.9 ещё не доказан. Полного кода оригинала, новой партии Android и живой ревизии wiki в этой проверке нет.

`confirmed_profile` означает явно прочитанное профильное описание через поисковый индекс. `corroborated_candidate` означает вторичное описание с отдельной сверкой; оно не становится профильным правилом автоматически. `unresolved` не задаёт default. Ссылки, retrieval refs и фактический доступ приведены в `../research/lifecycle-source-check.md`.

## Правила

| Rule ID | Условие → результат | Статус / граница | Источники |
|---|---|---|---|
| RULE-LIFE-001 | Обычная начальная вместимость расходников=2; обычный расходник занимает1 слот; заполненная зона блокирует дополнительную генерацию/покупку для хранения | confirmed_profile, без Negative/ваучеров/особых колод | L01 |
| RULE-LIFE-002 | Обычные стартовые деньги=$4 | corroborated_candidate; прямое профильное или Android startup evidence не получено | L08; L09 косвенно подтверждает только Yellow+10, не базу4 |
| RULE-LIFE-003 | Обычный discard допускает одновременно5 карт | confirmed_profile_lower_bound: unlock требует5 Jacks одновременно. Не доказательство запрета6 | L04 |
| RULE-LIFE-004 | Один ручной discard выбирает1..5 карт, тратит ровно1 discard независимо от количества, не тратит hand | corroborated_candidate; профиль Merry Andy подтверждает +3 discard и до15 дополнительных просмотренных карт, но это косвенно. Верхний предел и списание независимо подтверждаются свидетельствами игроков, не целевой1.9 | L05; L10; L11 |
| RULE-LIFE-005 | После обычного play/discard добор из draw pile до handSize; если карт меньше необходимого, взять только остаток; при held≥handSize не брать ничего | confirmed_profile, без The Serpent. Не добавлять возврат отыгранных/сброшенных карт при таком доборе | L02 |
| RULE-LIFE-006 | Маленькая колода/много hands могут исчерпать карты и вызвать game over; Mr Bones это не предотвращает | confirmed_profile_fact, exact_terminal_predicate_unresolved: фраза «run out» не различает пустой draw pile при живой held hand и полное отсутствие играбельных карт | L03 |
| RULE-LIFE-007 | Перед каждым новым blind собрать актуальные surviving playing cards из всех зон и перемешать; сбросить локальные counters/score | unresolved: точная последовательность shuffle относительно blind-select эффектов не получена. Не утверждается reset постоянных улучшений/hand levels | Ни одного подходящего профильного подтверждения |
| RULE-LIFE-008 | Rental удерживает$3 за Joker в конце раунда до round payout; может уменьшить interest и ввести в долг | confirmed_profile, частичная граница endround→payout; полный межэффектный порядок не установлен | L06 |
| RULE-LIFE-009 | Деньги, заработанные Gold Card/Gold Seal до cashout, входят в interest balance | confirmed_profile_crosscheck: профиль To the Moon явно подтверждает влияние этих денег. Gold held даёт$3 endround, Gold Seal даёт$3 при scoring | L07; L12 |
| RULE-LIFE-010 | Interest считает balance после предшествующих денежных эффектов/Rental, до blind reward+unused hands+cashout Joker payouts; cashout tally лишь отображает строки, сумма поступает при Cash Out | corroborated_candidate, основной точный источник вторичный. L06/L07 согласуются, но не доказывают всю формулу/порядок | L08 |

Для candidate обычного cashout без модификаторов: `interest=min(5,max(0,floor(snapshot/5)))`; `payout=blindReward+unusedHands+interest`. Cap и unused-hand значение уже описаны в `run-and-economy.md`; настоящая проверка не повышает candidate snapshot до подтверждённого профильного контракта. Endround Gold и cashout Golden Joker нельзя объединять только по одинаковым словам «end of round».

## Независимые контрольные кейсы

Это вручную вычисленные векторы для будущих проверок; приложение и оригинал на них **не запускались**. `candidate_probe` — ожидаемый результат согласно проверяемой гипотезе, не наблюдение.

| Case ID | Исходное состояние / действие | Ожидание | Статус |
|---|---|---|---|
| CASE-LIFE-001 | capacity2; occupied1; добавить обычный расходник | occupied2 | confirmed_profile |
| CASE-LIFE-002 | capacity2; occupied2; генерировать третий обычный расходник | генерация для хранения блокирована, старые два остаются | confirmed_profile |
| CASE-LIFE-003 | held8; draw10; discard5 | held3 перед добором; затем held8, draw5 | confirmed5_allowed + RULE-LIFE-005; cost counters отдельно |
| CASE-LIFE-004 | held8; draw1; discard5 | held4, draw0; не возвращать ранее удалённые карты для добора | confirmed_profile |
| CASE-LIFE-005 | held3; draw0; hands2; target не достигнут | Не выводить автоматический проигрыш только из draw0: точная проверка terminal остаётся открытой | unresolved_boundary |
| CASE-LIFE-006 | Новый ordinary Red/White забег, без tutorial | Деньги4, capacity2, slots заняты0 | candidate_probe: деньги/пустота слотов требуют startup observation |
| CASE-LIFE-007 | balance4; Small reward3; unusedHands3; никаких effects | interest0, payout6, итог10 | candidate_probe; итог10 против11 различает snapshot до/после награды |
| CASE-LIFE-008 | balance5; Small reward3; unusedHands3; никаких effects | interest1, payout7, итог12 | candidate_probe |
| CASE-LIFE-009 | balance24; Small reward3; unusedHands3 | interest4, payout10, итог34 | candidate_probe; вычисление после награды ошибочно дастinterest5 |
| CASE-LIFE-010 | balance4 до endround;1 held Gold без debuff/retrigger; Small reward3; unusedHands3 | Gold+3→snapshot7; interest1; итог14 | candidate_probe общей последовательности; Gold amount и включение подтверждены |
| CASE-LIFE-011 | balance4;1 Golden Joker; Small reward3; unusedHands3 | snapshot4; interest0; payout10; итог14 | candidate_probe: если Joker учитывается заранее, получится15 |
| CASE-LIFE-012 | balance5;1 Rental; Small reward3; unusedHands3; никакого income | удержание3→balance2 до payout; candidate interest0; итог8 | Rental before payout подтверждён; итог candidate |
| CASE-LIFE-013 | Новый blind после round с draw0, held3, played/discarded; одна карта уничтожена навсегда | Проверить возврат surviving карт, отсутствие уничтоженной, полный обычный draw; сравнить card IDs между зонами | unresolved_probe; shuffle distribution/seed не утверждаются |
| CASE-LIFE-014 | held8; выбрать0/1/5/6; discards1 | candidate:0/6 отвергнуть без мутации;1/5 списать1 discard; hands не меняется | candidate_probe |

Для CASE-LIFE-007: snapshot до награды даёт итог10; snapshot после награды даёт11 (interest1), а после всех выплат также11. Для различения точного тайминга недостаточно одного итогового HUD: записывать balance до final hand, held effects, Rental, cashout строки и итог после кнопки.

## Что ещё нужно закрыть

GAP-RULE-001: capacity2 закрыта для обычной ветви; деньги4 и отсутствие initial consumables требуют обычного нового забега или профильного текста. Существующий снимок с балансом4 не доказывает startup.

GAP-RULE-002: Rental-before-payout и включение Gold доходов закрыты. Полный snapshot и моменты обновления wallet подтверждены пока вторично. Нужны пары CASE-LIFE-007/008/010/011/012, отдельно endround debuff, retrigger, отрицательный balance, Green и исключения.

GAP-RULE-003: обычный добор и допустимость discard5 закрыты. Верхний предел5 и cost1 имеют независимую общественную сверку; полный reset/shuffle, точный gameover predicate и порядок blind-select эффектов ещё открыты. Не реплицировать упомянутые wiki glitched Mr Bones/quick-swap случаи как норму.
