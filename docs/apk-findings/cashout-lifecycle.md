# APK: выплата → магазин → следующий блайнд

Источник/дата/метод: APK SHA-256 из `../apk-map.md`, статическое чтение Lua 2026-10-08 UTC. Строки считаются по распакованным файлам, CRLF не удалялся перед подсчётом. Ниже `confirmed_static` — реально прочитанный путь, не runtime свидетельство.

## Контракт и доказательства

| Rule ID | Собственная формулировка | APK symbol / lines | Статус |
|---|---|---|---|
| APK-LIFE-001 | Обычная база: деньги4, hand8, discard3, hands4, reroll5, joker5, consumable2; start_run назначает starting dollars | `functions/misc_functions.lua:get_starting_params:1853–1865`; `game.lua:Game:start_run:2350–2356`, areas2438–2457 | confirmed_static; колода/stake/challenge далее модифицируют |
| APK-LIFE-002 | end_round обрабатывает каждого Joker в порядке owned list: end_of_round, затем rental, затем perishable. В выигранной/спасённой ветви held-card endround effects далее проходят до ROUND_EVAL | `functions/state_events.lua:end_round:99–109,192–258,276`; `card.lua:calculate_rental:2274–2277` | confirmed_static; event scheduling каждой ветви отдельно |
| APK-LIFE-003 | До ROUND_EVAL held возвращаются в discard, затем discard в deck; послеBoss ante повышается и выбирается новый voucher | `state_events.lua:end_round:258–285`; helpers1124–1148 | confirmed_static; уничтоженные карты уже исключены своим путём |
| APK-LIFE-004 | evaluate_round формирует отдельный payout: blind reward только score≥target, затем unused hands, optional unused discards, Joker dollar bonuses LTR, Tag eval, interest, bottom total | `state_events.lua:G.FUNCS.evaluate_round:1157–1230` | confirmed_static |
| APK-LIFE-005 | Interest=0 при balance<5 или no_interest. Иначе amount×min(floor(balance/5),cap/5), где base amount1, cap25 **в единицах balance**, максимальная обычная выплата5 | `state_events.lua:evaluate_round:1212–1223`; `game.lua:GAME init:2101–2102` | confirmed_static |
| APK-LIFE-006 | Blind reward, unused hands, cashout bonuses не начисляются в wallet перед interest. Golden Joker возвращает число для отдельного payout; debuffed Joker не возвращает бонус | `state_events.lua:evaluate_round:1193–1223`; `card.lua:calculate_dollar_bonus:1657–1681` | confirmed_static; snapshot — G.GAME.dollars после предшествующих endround effects |
| APK-LIFE-007 | Bottom row stores total в current_round.dollars; cash_out переводит эту сумму в wallet. В cash_out кнопка сразу деактивируется, deck shuffle имеет ключ cashout+ante, счётчики hands/discards подготовлены и состояние становится SHOP | `common_events.lua:add_round_eval_row:1090`; `button_callbacks.lua:G.FUNCS.cash_out:3007–3057` | confirmed_static; original UI guards не заменяют engine idempotence |
| APK-LIFE-008 | toggle_shop уведомляет owned Jokers ending_shop перед закрытием UI; затем BLIND_SELECT. Блайнд ещё не начат | `button_callbacks.lua:G.FUNCS.toggle_shop:2576–2606` | confirmed_static |
| APK-LIFE-009 | ending_shop у Perkeo выбирает расходник из owned area, копирует и делает Negative; работа ставится в event queue | `card.lua:Card:calculate_joker ending_shop:2415–2429` | confirmed_static; полный copy/slot integration требует отдельной трассы |
| APK-LIFE-010 | select_blind отдельно выбирает blind и вызывает new_round. new_round сбрасывает round counters/used_packs/reroll increase, подготавливает free rerolls от Chaos; set_blind предшествует setting_blind Jokers; затем DRAW_TO_HAND и shuffle nr+ante | `button_callbacks.lua:select_blind:2608–2649`; `state_events.lua:new_round:311–370` | confirmed_static |

## Что меняется относительно preview0.4.5

Прочитан `src/core/cashout.js:getCashout` текущего проекта. Его обычная Small/Red/Blue formula согласуется с APK для подтверждённой ветви: reward3, hands×1, floor(balance/5) cap5. **Численного mismatch этого среза не обнаружено**. Нельзя заявлять баг, только потому что APK internal cap=25: preview cap5 означает payout ceiling, единицы разные.

Расширение обязательно: Big/Boss/showdown rewards из blind catalog; сохранённый проигрыш через MrBones даёт reward0; no_extra_hand_money, money_per_hand/discard, no_interest, interest_amount/cap; Joker/Tag rows. Нынешние ограничения preview должны сниматься по отдельным подтверждённым контрактам, не одним fixed payout.

Рекомендуемый собственный engine contract: после завершённых endround effects сохранить `interestBalance`; построить неизменяемую ordered payout breakdown; не менять wallet при показе строки. `CollectCashout` начисляет ровноодин total и переводит в shop. `LeaveShop` завершает ending_shop effects до доступного выбора. `SelectBlind` выполняет new-round reset и blind hooks перед draw. Названия событий — решения реализации, не оригинальные enum.

## Независимые TDD-векторы следующего среза

Это вручную проверенная арифметика/ожидаемый контракт, не выполненные тесты приложения.

| Case ID | Fixture / действие | Ожидание |
|---|---|---|
| APK-TEST-LIFE-001 | money4; Small reward3; hands3; prepare payout | wallet4 остаётся; breakdown3+3+0=6; collect→10; duplicateCollect отвергнут |
| APK-TEST-LIFE-002 | money24; Big reward4; hands2 | interest4, total10, collect→34; НЕ35 |
| APK-TEST-LIFE-003 | money25; Boss reward5; hands0 | interest5, total10, final35 |
| APK-TEST-LIFE-004 | money24; Big4; hands2; Golden bonus4 | interest4, total14, final38; НЕ39 |
| APK-TEST-LIFE-005 | money4; Goldheld3 сработал доeval; Small3; hands3 | snapshot7; interest1; payout7; final14 |
| APK-TEST-LIFE-006 | money5; Rental3 доeval; Small3; hands3 | snapshot2; interest0; payout6; final8 |
| APK-TEST-LIFE-007 | money25; Small3; hands3; no_interest | interest0; total6; final31 |
| APK-TEST-LIFE-008 | money50; cap50; amount2; Big4; hands1 | interest20; total25; final75 |
| APK-TEST-LIFE-009 | score<target, saved fixture; money5; hands0 | reward0; interest1; total1; final6 |
| APK-TEST-LIFE-010 | LeaveShop с ordered JokersA,B | ending_shop A,B; затем BLIND_SELECT; round count не увеличен доSelectBlind |
| APK-TEST-LIFE-011 | round increase3, used_packsUSED; SelectBlind | new_round increase0/used_packs empty; setBlind→settingBlind hooks→shuffle→draw |

Точные PRNG результаты, асинхронный round-eval UI, конецAnte8/win overlay, event reentrancy и все card-exhaustion предикаты этим документом не сертифицированы. Не исполнялся оригинальный Lua и не переносились функции в production.
