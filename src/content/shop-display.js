import russianNames from './shop-names-ru.js';
import {EDITION_DESCRIPTIONS} from './card-modifier-display.js';
import {supportsJoker,originalJokerKey} from './jokers.js';
import {supportsConsumableEffect} from '../core/consumables.js';
const names={j_joker:'Джокер',j_jolly:'Весёлый джокер',j_zany:'Чудаковатый джокер',j_mad:'Безумный джокер',j_crazy:'Сумасшедший джокер',j_droll:'Забавный джокер',j_sly:'Хитрый джокер',j_wily:'Коварный джокер',j_clever:'Умный джокер',j_devious:'Лукавый джокер',j_crafty:'Изобретательный джокер',j_half:'Половинчатый джокер',j_splash:'Всплеск',j_abstract:'Абстрактный джокер',j_duo:'Дуэт',j_trio:'Трио',j_family:'Семейство',j_order:'Порядок',j_tribe:'Племя',j_greedy_joker:'Жадный джокер',j_lusty_joker:'Влюбчивый джокер',j_wrathful_joker:'Гневный джокер',j_gluttenous_joker:'Прожорливый джокер',j_scary_face:'Страшное лицо',j_even_steven:'Чётный Стивен',j_odd_todd:'Нечётный Тодд',j_scholar:'Учёный',j_fibonacci:'Фибоначчи',j_arrowhead:'Наконечник стрелы',j_onyx_agate:'Ониксовый агат',j_smiley:'Улыбка',j_walkie_talkie:'Рация'};
const descriptions={j_joker:'+4 к множителю.',j_half:'+20 к множителю, если сыграно не более 3 карт.',j_splash:'Каждая сыгранная карта участвует в подсчёте.',j_abstract:'+3 к множителю за каждого вашего джокера.',j_greedy_joker:'Засчитываемые бубны дают +3 к множителю.',j_lusty_joker:'Засчитываемые червы дают +3 к множителю.',j_wrathful_joker:'Засчитываемые пики дают +3 к множителю.',j_gluttenous_joker:'Засчитываемые трефы дают +3 к множителю.',j_scary_face:'Каждая засчитываемая фигурная карта даёт +30 очков.',j_even_steven:'Засчитываемые 2, 4, 6, 8 и 10 дают +4 к множителю.',j_odd_todd:'Засчитываемые тузы, 3, 5, 7 и 9 дают +31 очко.',j_scholar:'Каждый засчитываемый туз даёт +20 очков и +4 к множителю.',j_fibonacci:'Засчитываемые тузы, 2, 3, 5 и 8 дают +8 к множителю.',j_arrowhead:'Каждая засчитываемая пика даёт +50 очков.',j_onyx_agate:'Каждая засчитываемая трефа даёт +7 к множителю.',j_smiley:'Каждая засчитываемая фигурная карта даёт +5 к множителю.',j_walkie_talkie:'Засчитываемые 4 и 10 дают +10 очков и +4 к множителю.'};
// Held-card display rules verified in APK assets/card.lua:2882,3274–3348,3390;
// config amounts in assets/game.lua:390,400,446,519. Runtime support is unchanged.
Object.assign(descriptions,{
 j_baron:'Каждый король, оставшийся в руке, даёт ×1,5 к множителю.',
 j_shoot_the_moon:'Каждая дама, оставшаяся в руке, даёт +13 к множителю.',
 j_mime:'Повторно активирует эффекты карт в руке один раз.',
 j_raised_fist:'Добавляет к множителю удвоенное значение самой младшей карты в руке.',
});
for(const [keys,kind,label,amounts] of [
 [['j_jolly','j_zany','j_mad','j_crazy','j_droll'],'к множителю',['пару','тройку','две пары','стрит','флеш'],[8,12,10,12,10]],
 [['j_sly','j_wily','j_clever','j_devious','j_crafty'],'очков',['пару','тройку','две пары','стрит','флеш'],[50,100,80,100,80]],
 [['j_duo','j_trio','j_family','j_order','j_tribe'],'×',['пару','тройку','каре','стрит','флеш'],[2,3,4,3,2]],
])keys.forEach((key,i)=>descriptions[key]=kind==='×'?`×${amounts[i]} к множителю, если сыгранная рука содержит ${label[i]}.`:`+${amounts[i]} ${kind}, если сыгранная рука содержит ${label[i]}.`);
const planetHands={c_pluto:'Старшая карта',c_mercury:'Пара',c_uranus:'Две пары',c_venus:'Тройка',c_saturn:'Стрит',c_jupiter:'Флеш',c_earth:'Фулл-хаус',c_mars:'Каре',c_neptune:'Стрит-флеш',c_planet_x:'Пятёрка',c_ceres:'Флеш-хаус',c_eris:'Флеш-пятёрка'};
for(const [key,hand] of Object.entries(planetHands))descriptions[key]=`Повышает уровень комбинации «${hand}» на +1.`;
descriptions.c_black_hole='Повышает уровень всех 12 комбинаций на +1.';
descriptions.c_fool='Создаёт последнюю использованную карту Таро или Планеты, кроме Дурака.';
descriptions.c_hermit='Удваивает текущие деньги, но добавляет не более $20.';
descriptions.c_temperance='Даёт сумму стоимости продажи всех ваших джокеров, но не более $50.';
descriptions.c_empress='Усиливает до 2 выбранных карт: каждая даёт +4 к множителю при подсчёте.';
descriptions.c_heirophant='Усиливает до 2 выбранных карт: каждая даёт +30 очков при подсчёте.';
descriptions.c_magician='Усиливает до 2 выбранных карт: каждая получает независимые шансы 1 из 5 на +20 к множителю и 1 из 15 на $20 при подсчёте.';
descriptions.c_lovers='Усиливает 1 выбранную карту до Дикой: она считается картой любой масти.';
export function describeShopItem(offer){
 const key=originalJokerKey(offer.entityId);
 const base=descriptions[key]??'В этой предварительной версии доступен просмотр карты.';
 const edition=offer.edition==='negative'?`Негатив: дополнительное место для ${supportsJoker(offer)?'этого джокера':'этой расходной карты'}.`:EDITION_DESCRIPTIONS[offer.edition];
 return {name:names[key]??russianNames[key]??'Карта',description:base+(edition?' '+edition:''),canBuy:supportsJoker(offer)||supportsConsumableEffect(offer)};
}


