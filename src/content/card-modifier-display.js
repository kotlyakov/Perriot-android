// Description metadata only: these do not enable modifiers in the scoring engine.
// Verified APK assets/game.lua:649–662 and assets/card.lua:1034–1074,2245–2272.
export const EDITION_DESCRIPTIONS=Object.freeze({
 foil:'Фольга: +50 очков.',
 holographic:'Голография: +10 к множителю.',
 polychrome:'Полихромия: ×1,5 к множителю.',
});
export const ENHANCEMENT_DESCRIPTIONS=Object.freeze({
 bonus:'Бонусная карта: +30 очков.',
 mult:'Карта множителя: +4 к множителю.',
 wild:'Дикая карта: считается картой любой масти.',
 glass:'Стеклянная карта: ×2 к множителю. Шанс разрушения — 1 из 4.',
 steel:'Стальная карта: ×1,5 к множителю, пока карта остаётся в руке.',
 stone:'Каменная карта: +50 очков, без ранга и масти.',
 gold:'Золотая карта: $3, если карта остаётся в руке в конце раунда.',
 lucky:'Счастливая карта: шанс 1 из 5 дать +20 к множителю и шанс 1 из 15 дать $20.',
});
export const SEAL_DESCRIPTIONS=Object.freeze({
 red:'Красная печать: повторно активирует карту один раз.',
 gold:'Золотая печать: $3, когда карта участвует в подсчёте.',
 blue:'Синяя печать: создаёт планету последней сыгранной комбинации, если карта остаётся в руке в конце раунда. Нужно свободное место.',
 purple:'Фиолетовая печать: создаёт карту Таро при сбросе. Нужно свободное место.',
});
export function describeCardModifiers(card){
 return [ENHANCEMENT_DESCRIPTIONS[card.enhancement],EDITION_DESCRIPTIONS[card.edition],SEAL_DESCRIPTIONS[card.seal]].filter(Boolean);
}
