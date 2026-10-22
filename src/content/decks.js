// Native 1.0.1n back parameters; unlock admission is a separate profile concern.
export const DECKS={
 red:{name:'Красная колода',bonus:'+1',effect:'сброс',timing:'каждый раунд',discards:1},
 blue:{name:'Синяя колода',bonus:'+1',effect:'рука',timing:'каждый раунд',hands:1},
 yellow:{name:'Жёлтая колода',description:'Начните партию с дополнительными $10.',dollars:10},
 green:{name:'Зелёная колода',description:'В конце раунда: $2 за каждую оставшуюся руку и $1 за каждый оставшийся сброс. Без процентов.'},
 black:{name:'Чёрная колода',description:'+1 слот джокера. −1 рука каждый раунд.',hands:-1,jokerSlots:1},
 magic:{name:'Магическая колода',description:'Начните с билетом «Хрустальный шар» и двумя картами «Дурак».',vouchers:['v_crystal_ball'],consumables:['c_fool','c_fool']},
 nebula:{name:'Туманная колода',description:'Начните с билетом «Телескоп». −1 слот расходников.',vouchers:['v_telescope'],consumableSlots:-1},
 ghost:{name:'Призрачная колода',description:'Спектральные карты могут появляться в магазине. Начните с картой «Порча».',consumables:['c_hex']},
 abandoned:{name:'Заброшенная колода',description:'Начните с 40 картами: в колоде нет валетов, дам и королей.'},
 checkered:{name:'Клетчатая колода',description:'Начните с 26 пиками и 26 червями.'},
 zodiac:{name:'Зодиакальная колода',description:'Начните с билетами «Торговец Таро», «Торговец планетами» и «Избыток».',vouchers:['v_tarot_merchant','v_planet_merchant','v_overstock_norm']},
 painted:{name:'Расписная колода',description:'+2 к размеру руки. −1 слот джокера.',handSize:2,jokerSlots:-1},
 anaglyph:{name:'Анаглифная колода',description:'После победы над каждым боссом получите двойную награду: она копирует следующую награду за пропуск.'},
 plasma:{name:'Плазменная колода',description:'Перед итоговым подсчётом фишки и множитель уравниваются до среднего с округлением вниз. Цели блайндов удвоены.'},
 erratic:{name:'Хаотичная колода',description:'Все 52 начальные карты получают случайные достоинства и масти. Возможны повторы.'},
};
export const deckHands=id=>4+(DECKS[id]?.hands??0);
export const deckDiscards=id=>3+(DECKS[id]?.discards??0);
export const deckHandSize=id=>8+(DECKS[id]?.handSize??0);
export const deckBlindScale=id=>id==='plasma'?2:1;
