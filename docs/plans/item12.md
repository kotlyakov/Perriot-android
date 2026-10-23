# №12 — приёмка и временный проверочный сид

Поручение 23.10.2026: слить готовые ветки, для точного сида 13031990 открыть контент и начать любую выбранную партию со $100, затем выполнить доступную финальную приёмку. PR43 слит в a3c74aad.

Решение: один точный seed-предикат; временный доступ вычисляется из seed без перезаписи открытий/побед профиля. Ввод сида немедленно снимает ограничения выбора колод/ставок/испытаний; удаление возвращает ограничения. Коллекция текущего проверочного забега раскрыта. Все игровые пулы разблокированы, но обычные правила появления, вместимости и запреты конкретного испытания сохранены. Любая колода и любое испытание начинаются ровно со $100 (включая Yellow и Luxury Tax). Seeded-партия не выдаёт обычные победы/разблокировки. Продолжение сохраняет деньги, RNG и доступ.

- [x] 1. RED→GREEN core: точный сид, все15колод/8ставок/20испытаний, полный контекст/коллекция, сохранение/продолжение, обычный профиль.
- [x] 2. UI: ввод/удаление сида, колода/ставка/испытания, $100, коллекция, reload, touch.
- [x] 3. Полный core/browser/Android CI, ревью изменений, проверка APK и матрицы приёмки.
- [x] 4. Передать preview APK и чек-лист пользователю. Физический Android/субъективная приёмка отдельно; не объявлять их выполненными.

Pre-flight: UI selection → newState → createRun → profile/save must all use the same seed. Challenges currently clear seed; preserve only the special seed. Challenge money and Luxury Tax must agree before hand-size calculation.

Task1 complete: new core regressions observed RED→GREEN; full1650PASS/2optional skips. Task2 implemented, full52browserCI still running. Android39942228727 SUCCESS; artifact12496193920,92assets byteequal,CRC/signature/alignment PASS. Independent review: no confirmed Critical/Important;140deck/stake/challenge starts+save PASS.

Tasks2–4: CI39942228727 SUCCESS,52browser/1650core/Android PASS,92assets byteequal,4screens reviewed. APK0.4.48 сохранён для передачи, PR44 mergedba4aa0a. Физический Android/ручной чек-лист остаются открытыми; временный сид удалять после приёмки пользователя отдельной правкой.
