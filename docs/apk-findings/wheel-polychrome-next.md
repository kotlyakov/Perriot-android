# Реализованный контракт: Wheel / Polychrome

Нативный контракт независимо исследован из APK 13.10.2026. Wheel требует Joker без edition, не требует целей. Шанс строго wheel_of_fortune < probabilities.normal/4. Успех: nextApkRandom(key), nextApkSeed(key) + bounded Math draw выбора Joker в порядке persistent sort_id; nextApkRandom(key) edition: >.85 polychrome, >.5 holographic, >0 foil, ==0 base. Затем два raw juice draws при edition, один при base. Неуспех: один прямой raw juice draw; attention particles добавляют frame-dependent Math draws, поэтому их нельзя выдавать за точный стабильный action RNG без timing contract. Debuffed Wheel не делает эффект/RNG.

Реализация 0.4.26 хранит монотонный `creationOrdinal` для новых джокеров в момент создания предложения. Перестановка и порядок покупки его не меняют. Старое сохранение с несколькими подходящими джокерами без однозначного порядка не угадывается: Wheel временно недоступно; один подходящий legacy-джокер безопасен. Полихромия применяется после собственного независимого эффекта джокера точной дробью 3/2; итоговый score округляется только после полного подсчёта.

Основной prerequisite: owned Jokers не имеют persistent creation order. Перестановка слотов не должна менять выбранную identity при одинаковом RNG. Нужны schema + legacy стратегия, а не замена sort_id текущим порядком.

Polychrome: supportsJoker разрешает edition для уже реализованных центров; точное multiply_mult {n:3n,d:2n} после independent и Joker-on-Joker эффектов, перед следующим Joker. Playing-card editions остаются отдельным блоком. Пересчитать cost/sellCost через quoteShopCard (foil +2, holo +3, poly +5), контекст inflation/discount, extra_value/rental по зависимости.

Проверить success границу .25, edition 0/.5/.85, ровно один eligible (draw всё равно), reorder/creation order, no eligible, debuff, exact fractions/Steel/Glass, pricing, save/reload/replay и atomicity. Oops! All 6s, debuffed Joker, rental/perishable и Joker-on-Joker требуют полного зависимого контракта.
