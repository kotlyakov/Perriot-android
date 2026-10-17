# 0.4.5 — награда и вход в магазин

Основание: ROADMAP21 и разрешение «Поехали». Визуальная база0.4.4 утверждена. AGENTS.md§3 распределяет независимые задачи: Research — docs/rules/cashout.md; Engine — cashout/run/save/test; Lead — UI/integration; QA — независимые браузерные сценарии; Build — version/code18 и signedAPK. Это первый блок полного игрового цикла; каталог магазина не заменяется выдуманным сокращённым набором.

- [x] Зафиксировать источник04, выплаты/снимок баланса и геометрию.
- [x] RED→GREEN ядро: quote, once-only CASH_OUT, shop/save1/legacy/error guards.
- [x] RED→GREEN UI: payout, motion, no prematurecredit, duplicateclick, reload, writefail, fourlayouts.
- [x] Независимая проверка реальной победы/прерывания/нового забега.
- [x] Проверить подписанный APK18 и byte equality офлайн ресурсов.
- [x] Обновить ROADMAP/progress, сохранить ZIP/APK/HTML.

Приёмка: сумма3+H+min(5,max(0,B)/5) целочисленно; B до выплаты; деньги только после успешной записи CASH_OUT; повтор не платит. RNG не расходуется. round_won восстанавливает награду, shop восстанавливает вход; старые savesversion1 читаются. UIвне активного блайнда отображает всю колоду, при этом rawzones изменяются только при CASH_OUT. Вход магазина помечен промежуточным; покупок пока нет. Android/WebViewна устройстве отдельно не проверен.
