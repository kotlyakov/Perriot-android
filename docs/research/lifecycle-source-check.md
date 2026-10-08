# Источники run lifecycle

Проверка: **07.10.2026 UTC**. Прочитаны `docs/rules/run-and-economy.md` и `docs/rules-source-check.md`. Записаны только новая спецификация `docs/rules/run-lifecycle.md` и этот журнал; код, roadmap, общий каталог и прежние правила не менялись. Коммитов нет.

## Фактический доступ

Fandom профили прочитаны **через web search index**, результаты сообщают `Blocked by robots.txt`, crawl≈3 месяца назад. Это доступ к индексированному тексту, не живой странице и не её проверенной ревизии. Поиск давал тела статей, не только заголовки. Повторный `open` wiki Money/Interest/Discards/Gameplay_rules на migrated домене `balatrowiki.org/w/` → restricted URL (`turn22view0..3`). Ранее пути без `/w/` также не открылись. Не называть эти страницы прочитанными.

Вторичный teemo.dev успешно открыт обычным web open (HTML, строки). Его автор заявляет проверку по game data1.0.1o-FULL, но оригинальные game files нами не получены. Этот источник пригоден для гипотез и контроля; самоссылки teemo wiki не считаются независимой сверкой. Direct original/source execution и Android1.9 runtime отсутствуют.

## Реестр

Дата доступа для всех строк — 2026-10-07. `revision_verified=no` для всех wiki строк.

| ID | URL | Retrieval | Метод и полученный фрагмент | Применение / ограничение |
|---|---|---|---|---|
| L01 | https://balatrogame.fandom.com/wiki/Consumables | turn27search0 (повтор turn17search0) | search_index; body:initially2slots, each1, full blocks generation/buy | RULE-LIFE-001; не подтверждает стартовое содержимое обычной колоды |
| L02 | https://balatrogame.fandom.com/wiki/Hand_size | turn27search2 | search_index; body:beginningRound/play/discard draw, insufficient drawallremaining, Serpent exception | RULE-LIFE-005; не утверждает точное shuffle/reset |
| L03 | https://balatrogame.fandom.com/wiki/Burglar | turn27search1 | search_index; body:Hook/highhands/smalldeck may exhaust cards→instantgameover, MrBones cannotprevent | RULE-LIFE-006; не задаёт точный предикат draw0/held0 |
| L04 | https://balatrogame.fandom.com/wiki/Hit_the_Road | turn27search3 (выдан URL с query-параметрами) | search_index; infobox unlock:discard5Jacks atsametime | RULE-LIFE-003; только нижняя граница допустимого выбора |
| L05 | https://balatrogame.fandom.com/wiki/Merry_Andy | turn29search2 | search_index; body:+3discards, upto15more sifted cards; history1.0.0h removed carryovereffect | Косвенная сверка cap5; историю не превращать в exact reset contract |
| L06 | https://balatrogame.fandom.com/wiki/Stickers | turn24search2 | search_index; Rental$3 endeveryround,before roundpayout,may lowerinterest,may debt | RULE-LIFE-008; не доказывает всё внутри endround |
| L07 | https://balatrogame.fandom.com/wiki/To_the_Moon | turn29search6 / turn25search0 | search_index; body:GoldCard/GoldSeal income counts toward interest; defaultcap5 | RULE-LIFE-009; термин midround у Gold нельзя понимать как play-scoringtrigger |
| L08 | https://teemo.dev/game-design/balatro/systems/economy-money-interest-and-the-shop/ | turn26view0 | web_open_success; L43 initial4; L46 pre-cashout snapshot/button; L50Rental; L53Jokers; L57Gold | RULE-LIFE-002/010 candidate; **secondary**, не directgamefiles |
| L09 | https://balatrogame.fandom.com/wiki/Yellow_Deck | turn29search19 / turn23search5 | search_index; extra10 atstart | Не выводить baseline4 из +10 |
| L10 | https://steamcommunity.com/app/2379780/discussions/0/4408543929279783954/ | turn25search34 | search_index; player firsthand reports Jul9 2024:5cards cost1discard,sameas1card | Независимое community observation, version unspecified; не официальный контракт |
| L11 | https://www.reddit.com/r/balatro/comments/1d3mpl8 | turn25reddit52 | search_index; player reports 1..5selection for play/discard (May2024 эпоха по URL не нормализована в точную дату) | Corroboration, not targetAndroid1.9. Дата публикации инструмента относительная2.4years |
| L12 | https://balatrogame.fandom.com/wiki/Card_Modifiers | turn29search0 | search_index; GoldCard3 heldendround; GoldSeal3 scoring | RULE-LIFE-009 numbers; полный фазовый порядок не подтверждает |
| X01 | https://balatrogame.fandom.com/wiki/Gameplay_rules | turn26search3 / turn29search1 | search_index; explicitly0.9.0q-DEMO | **Excluded as normative** для fullgame lifecycle |
| X02 | https://balatrowiki.org/w/Money | turn22view0 | directopen restricted | Unread; нельзя ссылаться как на проверенный startup4 |
| X03 | https://balatrowiki.org/w/Interest | turn22view1 | directopen restricted | Unread; нельзя утверждать exact snapshot из этой страницы |
| X04 | https://balatrowiki.org/w/Discards | turn22view2 | directopen restricted | Unread; nofull profilecap/cost |

Дополнительно просмотрены поисковые результаты сторонних guides/модов/клонированных движков; они не добавлены как нормативные источники. Спецификация опирается на профильные страницы и ясно маркированные candidate. Независимое свидетельство игрока — первичное свидетельство опыта автора, но не разработчик и не проверка целевого билда.

## Разрешённый результат

Готовы профильные обычные правила capacity2, добора только остатка, допустимости выбора5, Rental-before-payout, Gold income влияет на interest. Есть подтверждённый факт возможности card-exhaustion loss, но точного условия для кода пока нет. Для $4, полного cap/cost discard, interest snapshot предоставлены проверяемые гипотезы и разграничивающие кейсы. Exact blind shuffle/reset остаётся без подходящего источника.

Новые CASE-LIFE — ручная арифметика/план проверки, не выполненные игровые тесты. Для проверки документов использованы уникальность definition IDs, наличие источников, диапазон кейсов и арифметика candidate без effects. Итоги команд сообщает исполнитель исследования; APK/Android/instrumented tests не запускались.
