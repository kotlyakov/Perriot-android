# Границы порядка подсчёта

Проверка 07.10.2026: поисковый индекс Fandom. Основа [Guide: Activation Sequence](https://balatrogame.fandom.com/wiki/Guide%3A_Activation_Sequence) (`turn11search1`) — авторское руководство сообщества, а не окончательный первичный контракт. [Activation Type](https://balatrogame.fandom.com/wiki/Activation_Type) (`turn11search4`) предупреждает о рассинхронизации таблицы. Статус полной схемы: `provisional_profile_checks_required`.

RULE-ORDER-001: фазовые границы руководства: boss/pre-score → on-played → засчитываемые карты слева направо с повторами → held слева направо с повторами → independent jokers слева направо → Observatory consumables → Plasma balance. Собственная запись порядка; не универсальное решение всех эффектов.

RULE-ORDER-002: у scored-card внутри прохода: базовые chips (Bonus уже здесь), enhancement, Gold Seal, edition, on-scored jokers; затем дополнительные проходы. У held: Steel → on-held → повторные проходы. RULE-ORDER-003: у independent Joker: Foil/Holographic → основной independent эффект → Baseball Card → Polychrome. Повторы карты не повторяют весь independent этап. Эти две строки ещё требуют профильной проверки сложных обработчиков.

RULE-ORDER-004: порядок +Mult и ×Mult не коммутативен. Тестовые значения C=40,M=4: +4 затем ×2 →640; ×2 затем +4 →480. Это математические проверочные векторы, не обещание конкретного контентного пула.

## Профильные факты, готовые для небольшого среза

| Rule ID | Эффект / условия | Источник и ref | Статус | Независимый тест |
|---|---|---|---|---|
| RULE-JOKER-001 | Joker: Common, $2, independent +4 Mult, открыт со старта | [Joker](https://balatrogame.fandom.com/wiki/Joker), turn12search2 | ready_baseline | A high →16×5=80; +0 triggers при no play |
| RULE-JOKER-002 | Sly: Common, $3, independent +50 Chips если содержит Pair | [Sly Joker](https://balatrogame.fandom.com/wiki/Sly_Joker), turn12search1 | ready_baseline | 8,8 →76×2=152; три 5 →95×3=285; A high →16 |
| RULE-JOKER-003 | Clever: Common, $4, independent +80 Chips если содержит Two Pair; каре не содержит Two Pair | [Clever Joker](https://balatrogame.fandom.com/wiki/Clever_Joker), turn12search10 | ready_baseline | 7,7,4,4 →122×2=244; каре 9 →672 |
| RULE-JOKER-004 | Splash: Common, $3, passive, все played становятся scoring; дополнительные карты запускают modifiers/jokers | [Splash](https://balatrogame.fandom.com/wiki/Splash), turn12search6 | ready_baseline | 8,8,A: (10+16+11)×2=74; hand остаётся Pair |

Профильные страницы этих четырёх подтверждают стартовый доступ, совместимость Eternal/Perishable; Joker/Sly/Clever copyable, Splash passive не копируется. Полный Blueprint-контракт этим не установлен.

[Card Modifiers](https://balatrogame.fandom.com/wiki/Card_Modifiers) (`turn16search0`) подтверждает Bonus+30, Stone+50/no rank/suit, Mult+4, Glass×2 со случайным разрушением после scoring, Steel×1.5 held. Не включать Glass/Steel в целочисленный срез до закрытия округления; в документе poker-hands их нет.

## Обязательные ещё не закрытые точки

- Где и как фиксируются hand identity/scoring IDs относительно Vampire/Midas, Space Joker/The Arm; условия повторов и уничтожения не следуют из названия фаз.
- Когда округляется дробный итог C×M; оригинал использует floating point, проектный рациональный BigInt не автоматически эквивалентен.
- Полный порядок end-hand/end-round, Glass destruction, held Gold, Blue Seal, Rental/Perishable и payout.
- Несколько источников retrigger: как распределены контексты Blueprint/Brainstorm и state mutations; не разрешать бесконечные повторы общей рекурсией.
- Discard — отдельная операция; она не проходит scoring pipeline. Автоматический discard The Hook — отдельный подтверждаемый контекст.

Для первого deterministic ядра безопасная граница: Base playing cards + 12 уровневых hand IDs + четыре перечисленных простых джокера. Остальные эффекты отображаются как отсутствующий промежуточный контент; их нельзя тихо считать no-op в полноценном забеге.
