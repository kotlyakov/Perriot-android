# Руки и фишки первого среза

Проверено 07.10.2026 через поисковый индекс Fandom; прямой доступ ограничен robots.txt. Текущая ревизия недоступна. База параметров wiki 1.0.1o-FULL; соответствие Android app 1.9 остаётся отдельным пробелом. Статус: `ready_baseline` означает проверенный факт для обычных карт без исключений; не означает реализацию.

Источники: [Poker Hands](https://balatrogame.fandom.com/wiki/Poker_Hands) (`turn12search0`), [Card Ranks](https://balatrogame.fandom.com/wiki/Card_Ranks) (`turn6search1`), [Chips](https://balatrogame.fandom.com/wiki/Chips) (`turn9search1`), [Planet Cards](https://balatrogame.fandom.com/wiki/Planet_Cards) (`turn11search0`).

| Rule ID | Условие → результат | Статус | Источник | Проверка |
|---|---|---|---|---|
| RULE-HAND-001 | Сыграны 1–5 карт; выбирается старшая допустимая комбинация независимо от уровня | ready_baseline | Poker Hands | Четыре K и 2 одной масти → каре, даже если Flush имеет больший уровень |
| RULE-HAND-002 | Засчитываются участвующие в выбранной руке карты; кикеры не дают фишек | ready_baseline | Poker Hands | 8,8,A → засчитываются только две 8 |
| RULE-HAND-003 | Туз может завершать A2345 или TJQKA; не замыкает QKA23 | ready_baseline | Poker Hands | A2345 → Straight; QKA23 → High Card |
| RULE-HAND-004 | Royal Flush использует уровень Straight Flush | ready_baseline | Poker Hands | Neptune повышает обе записи; самостоятельного уровня Royal нет |
| RULE-HAND-005 | Все уровни стартуют с 1; секретные руки раскрываются после розыгрыша | ready_baseline | Poker Hands | До/после Five of a Kind видимость различается |
| RULE-RANK-001 | A даёт 11; J/Q/K по 10; 2–10 дают номинал | ready_baseline | Card Ranks | Туз низкого стрита всё равно даёт 11 |
| RULE-SCORE-001 | Фишки руки плюс фишки засчитанных карт, затем умножение на Mult | ready_baseline_integer | Chips | A high → (5+11)×1=16 |

## Таблица рук

`priority` возрастает; таблица для обычного распознавания. Числа base берутся из Poker Hands, прирост из Planet Cards. `L` — текущий уровень: C=C1+(L−1)ΔC; M=M1+(L−1)ΔM (собственная формализация повторного повышения). Нельзя связывать приоритет с полученными очками.

| hand_id | priority | C1 | M1 | ΔC | ΔM | planet |
|---|---:|---:|---:|---:|---:|---|
| high_card | 1 | 5 | 1 | 10 | 1 | Pluto |
| pair | 2 | 10 | 2 | 15 | 1 | Mercury |
| two_pair | 3 | 20 | 2 | 20 | 1 | Uranus |
| three_of_a_kind | 4 | 30 | 3 | 20 | 2 | Venus |
| straight | 5 | 30 | 4 | 30 | 3 | Saturn |
| flush | 6 | 35 | 4 | 15 | 2 | Jupiter |
| full_house | 7 | 40 | 4 | 25 | 2 | Earth |
| four_of_a_kind | 8 | 60 | 7 | 30 | 3 | Mars |
| straight_flush | 9 | 100 | 8 | 40 | 4 | Neptune |
| five_of_a_kind | 10 | 120 | 12 | 35 | 3 | Planet X |
| flush_house | 11 | 140 | 14 | 40 | 4 | Ceres |
| flush_five | 12 | 160 | 16 | 50 | 3 | Eris |

RULE-LEVEL-001: применение планеты повышает связанный уровень на 1 с указанным приростом. RULE-LEVEL-002: Planet X/Ceres/Eris не доступны в обычном магазине до розыгрыша соответствующей руки в этом забеге. Проверка: Pair L2=25×3 до карт; новый забег опять L1. Источник Planet Cards.

Распознавание без модификаторов: группы одного ранга дают Pair/Three/Four/Five; Two Pair требует двух различных рангов; Full House — группы 3+2 различных рангов. Flush — пять одной масти; Straight — пять последовательных рангов. Сочетания Flush+Straight/Full House/Five дают соответствующие старшие руки. RULE-HAND-006, источник Poker Hands. Засчитываемый набор: группа/две группы для пар и каре; пять для остальных; единственная старшая карта для High Card.

## Независимые примеры (выведены исследователем из правил)

Все карты Base; нет джокеров/debuff; уровень 1. Разные масти, кроме помеченных ♠. Индексы scoring — позиции, нумерация с 1.

| test_id | played | hand | scoring | C | M | score |
|---|---|---|---|---:|---:|---:|
| TEST-HAND-001 | A,10,8,6,3 | high_card | 1 | 16 | 1 | 16 |
| TEST-HAND-002 | 8,8,A | pair | 1,2 | 26 | 2 | 52 |
| TEST-HAND-003 | 7,7,4,4,A | two_pair | 1,2,3,4 | 42 | 2 | 84 |
| TEST-HAND-004 | 5,5,5,K | three_of_a_kind | 1,2,3 | 45 | 3 | 135 |
| TEST-HAND-005 | A,2,3,4,5 | straight | 1,2,3,4,5 | 55 | 4 | 220 |
| TEST-HAND-006 | 6,7,8,9,10 | straight | 1,2,3,4,5 | 70 | 4 | 280 |
| TEST-HAND-007 | 2♠,4♠,6♠,8♠,10♠ | flush | 1,2,3,4,5 | 65 | 4 | 260 |
| TEST-HAND-008 | 7,7,7,2,2 | full_house | 1,2,3,4,5 | 65 | 4 | 260 |
| TEST-HAND-009 | 9,9,9,9,2 | four_of_a_kind | 1,2,3,4 | 96 | 7 | 672 |
| TEST-HAND-010 | A♠,K♠,Q♠,J♠,10♠ | straight_flush (Royal label) | 1,2,3,4,5 | 151 | 8 | 1208 |
| TEST-HAND-011 | 2,2,2,2,2 | five_of_a_kind | 1,2,3,4,5 | 130 | 12 | 1560 |
| TEST-HAND-012 | 3♠,3♠,3♠,2♠,2♠ | flush_house | 1,2,3,4,5 | 153 | 14 | 2142 |
| TEST-HAND-013 | A♠,A♠,A♠,A♠,A♠ | flush_five | 1,2,3,4,5 | 215 | 16 | 3440 |
| TEST-LEVEL-001 | 8,8,A; Pair L2 | pair | 1,2 | 41 | 3 | 123 |

## Границы

Stone и Splash добавляют засчитываемые карты; это отдельно от определения комбинации. Wild, Four Fingers, Shortcut, Smeared Joker, debuff и все-Stone руки требуют профильной спецификации. Не применять упрощённое «пять одинаковых мастей» к Four Fingers. Округление дробного итогового score, изменение уровня The Arm, особый учёт Royal у The Ox и выбор scoring cards при изменённом распознавании не закрыты этой таблицей.
