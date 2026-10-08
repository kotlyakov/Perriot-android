import catalogue from './apk-shop-catalog.js';
import {supportsJoker,originalJokerKey} from './jokers.js';
const centres=new Map(catalogue.centres.map(c=>[c.key,c]));
const names={j_joker:'Джокер',j_jolly:'Весёлый джокер',j_zany:'Чудаковатый джокер',j_mad:'Безумный джокер',j_crazy:'Сумасшедший джокер',j_droll:'Забавный джокер',j_sly:'Хитрый джокер',j_wily:'Коварный джокер',j_clever:'Умный джокер',j_devious:'Лукавый джокер',j_crafty:'Изобретательный джокер',j_half:'Половинчатый джокер',j_splash:'Всплеск',j_abstract:'Абстрактный джокер',j_duo:'Дуэт',j_trio:'Трио',j_family:'Семейство',j_order:'Порядок',j_tribe:'Племя',j_greedy_joker:'Жадный джокер',j_lusty_joker:'Влюбчивый джокер',j_wrathful_joker:'Гневный джокер',j_gluttenous_joker:'Прожорливый джокер',j_scary_face:'Страшное лицо',j_even_steven:'Чётный Стивен',j_odd_todd:'Нечётный Тодд',j_scholar:'Учёный',j_fibonacci:'Фибоначчи',j_arrowhead:'Наконечник стрелы',j_onyx_agate:'Ониксовый агат',j_smiley:'Улыбка',j_walkie_talkie:'Рация'};
const descriptions={j_joker:'+4 к множителю.',j_half:'+20 к множителю, если сыграно не более 3 карт.',j_splash:'Каждая сыгранная карта участвует в подсчёте.',j_abstract:'+3 к множителю за каждого вашего джокера.',j_greedy_joker:'Засчитываемые бубны дают +3 к множителю.',j_lusty_joker:'Засчитываемые червы дают +3 к множителю.',j_wrathful_joker:'Засчитываемые пики дают +3 к множителю.',j_gluttenous_joker:'Засчитываемые трефы дают +3 к множителю.',j_scary_face:'Каждая засчитываемая фигурная карта даёт +30 очков.',j_even_steven:'Засчитываемые 2, 4, 6, 8 и 10 дают +4 к множителю.',j_odd_todd:'Засчитываемые тузы, 3, 5, 7 и 9 дают +31 очко.',j_scholar:'Каждый засчитываемый туз даёт +20 очков и +4 к множителю.',j_fibonacci:'Засчитываемые тузы, 2, 3, 5 и 8 дают +8 к множителю.',j_arrowhead:'Каждая засчитываемая пика даёт +50 очков.',j_onyx_agate:'Каждая засчитываемая трефа даёт +7 к множителю.',j_smiley:'Каждая засчитываемая фигурная карта даёт +5 к множителю.',j_walkie_talkie:'Засчитываемые 4 и 10 дают +10 очков и +4 к множителю.'};
for(const [keys,kind,label,amounts] of [
 [['j_jolly','j_zany','j_mad','j_crazy','j_droll'],'к множителю',['пару','тройку','две пары','стрит','флеш'],[8,12,10,12,10]],
 [['j_sly','j_wily','j_clever','j_devious','j_crafty'],'очков',['пару','тройку','две пары','стрит','флеш'],[50,100,80,100,80]],
 [['j_duo','j_trio','j_family','j_order','j_tribe'],'×',['пару','тройку','каре','стрит','флеш'],[2,3,4,3,2]],
])keys.forEach((key,i)=>descriptions[key]=kind==='×'?`×${amounts[i]} к множителю, если рука содержит ${label[i]}.`:`+${amounts[i]} ${kind}, если рука содержит ${label[i]}.`);
export function describeShopItem(offer){
 const key=originalJokerKey(offer.entityId),centre=centres.get(key);
 const base=descriptions[key]??'В этой предварительной версии доступен просмотр карты.';
 const edition={foil:'Фольга: +50 очков.',holographic:'Голография: +10 к множителю.',negative:'Негатив: дополнительное место для этого джокера.'}[offer.edition];
 return {name:names[key]??centre?.name??'Карта',description:base+(edition?' '+edition:''),canBuy:supportsJoker(offer)};
}
