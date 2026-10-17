# Забег, блайнды и магазин: первый срез

Проверка 07.10.2026, поисковый индекс Fandom (robots.txt; живые ревизии не получены). `ready` ниже — допустимо реализовать указанную обычную ветвь. Это не сертификат Android app 1.9 и не полный каталог эффектов.

Источники: [Blinds and Antes](https://balatrogame.fandom.com/wiki/Blinds_and_Antes) B (`turn8search0`), [The Shop](https://balatrogame.fandom.com/wiki/The_Shop) S (`turn6search0`), [Red Deck](https://balatrogame.fandom.com/wiki/Red_Deck) R (`turn9search0`), [Blue Deck](https://balatrogame.fandom.com/wiki/Blue_Deck) U (`turn15search0`), [Delayed Gratification](https://balatrogame.fandom.com/wiki/Delayed_Gratification) D (`turn10search5`), [Hand Size](https://balatrogame.fandom.com/wiki/Hand_size) H (`turn10search0`), [To the Moon](https://balatrogame.fandom.com/wiki/To_the_Moon) M (`turn6search3`), [Jokers](https://balatrogame.fandom.com/wiki/Jokers) J (`turn14search2`).

## Параметры и переходы

| Rule ID | Условие → результат | Статус | Source | Проверка |
|---|---|---|---|---|
| RULE-RUN-001 | Обычный старт: 52 карты, 4 масти ×13 рангов; Red открыт и даёт +1 discard | ready | R | 52 разных пар rank/suit; Red increment=1 |
| RULE-RUN-002 | База hands=4; база discards=3 | ready (D — косвенное профильное описание) | U,D | Red White: 4 hands, 4 discards |
| RULE-RUN-003 | Hand size=8; после play/discard добрать до лимита из draw pile; недостаточный запас → взять остаток; при ≥лимита не добирать | ready_without_serpent | H | 6 held+1 draw → 7 held, без выдуманного reshuffle |
| RULE-RUN-004 | Обычная вместимость джокеров=5 | ready | J | Шестой Base не помещается; Negative отдельное правило |
| RULE-BLIND-001 | Последовательность Small → Big → Boss; первые два можно skip за Tag, Boss нельзя | ready | B | Skip Small ведёт к Big, не в магазин |
| RULE-BLIND-002 | Small=base×1, $3; Big=base×1.5, $4; типовой Boss=base×2, $5 | ready_ordinary | B | Ante1 цели 300/450/600 |
| RULE-BLIND-003 | Начало Ante1; после Boss переход ante+1; победа после финального Boss Ante8, далее можно Endless | ready | B | После победы Ante8 возможность закончить/продолжить |
| RULE-BLIND-004 | Суммарно достигнута цель → пройдено; не достигнута в доступные руки → проигрыш | ready | B | score=target проходит, target−1 с 0 hands проигрывает |
| RULE-PAYOUT-001 | Неиспользованная рука обычной колоды приносит $1 | ready_without_economy_modifiers | U | 3 remaining → $3 дополнительно |

RULE-ANTE-001: White base для Ante1–8: **300, 800, 2000, 5000, 11000, 20000, 35000, 50000** (B). TEST-ANTE-001: Ante8 Big=75000. Это значения полной версии, не старые демо 2800/7000 и т. п. Другие stakes и Endless требуют отдельной спецификации; округление atypical blind targets не утверждается этой строкой.

## Магазин

| Rule ID | Условие → результат | Статус | Source | Проверка |
|---|---|---|---|---|
| RULE-SHOP-001 | После победы доступен магазин: 2 random cards, 2 packs, 1 voucher; в первом магазине один Normal Buffoon гарантирован | ready_structure | S | Первые packs содержат Buffoon; пропуск не даёт магазина |
| RULE-SHOP-002 | Базовые веса card classes: Joker20, Tarot4, Planet4 | ready_class_weights | S | Использовать веса, не округлённые 71/14/14%; сущностные пулы пока неполны |
| RULE-SHOP-003 | Платный reroll начинается $5, далее +$1; новый магазин сбрасывает; заменяет random cards, оставляет packs/voucher | ready_without_free_reroll | S | Платежи 5,6; следующий shop5; купленный pack не восстановлен |
| RULE-SHOP-004 | Packs обновляются в следующем магазине; обычный voucher после Boss | ready | S | После Small→Big тот же unbought voucher |
| RULE-PRICE-001 | Обычная цена=max(1, roundHalfDown((base+edition)×discount)) | ready_ordinary | S | 3×0.5=1; 7×0.5=3; 9×0.75=7 |
| RULE-PRICE-002 | Обычная продажа=max(1,floor(пересчитанная_цена/2)) | ready_without_extra_sell_value | S | Base Joker $2 → $1; $3 → $1; новые discounts меняют sell |

Базы (S): Tarot/Planet $3, Spectral $4, Voucher $10; Normal/Jumbo/Mega pack $4/$6/$8; playing card $1 (магазин только при Magic Trick). Надбавки Foil/Holographic/Polychrome/Negative=$2/$3/$5/$5. Discount: Clearance .75, Liquidation .5. Минимум $1 **не** применяется поверх специальных free-цен Astronomer/Coupon; Rental и Egg/Gift Card — отдельные исключения.

Для неотрицательных рациональных цен roundHalfDown(x) математически равен ceil(x−0.5); это собственная формализация S, не JS Math.round. Тест: 8.5→8, 8.51→9.

## Проценты: подтверждённая часть и пробел

RULE-INTEREST-001 (`ready_cap`): стандартный cap=$5; mid-round Gold/Seal деньги учитываются для процентов (M). Формула $1 за полные $5 согласуется с M, но M прежде всего описывает добавку джокера. `candidate` базового payout: blindReward+remainingHands+min(5,max(0,floor(interestBalance/5))). **Момент снимка interestBalance относительно blindReward/remainingHands и end-round эффектов ещё не закрыт.** Не объявлять этот candidate подтверждённой общей реализацией.

Начальный баланс обычного забега, 2 consumable slots, точный максимум discarded cards/снижение счётчиков, полный reset/shuffle на новый blind, условия game-over при пустой колоде, тайминг end-round gold/стикеров и процентов требуют дополнительного источника либо наблюдения целевого Android 1.9. Не подставлять число из памяти. Для независимых core-тестов допустим явно переданный fixture balance/slots, не выдаваемый за оригинальный старт.
