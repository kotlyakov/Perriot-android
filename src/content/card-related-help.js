import catalogue from './apk-shop-catalog.js';
import {ENHANCEMENT_DESCRIPTIONS,EDITION_DESCRIPTIONS,SEAL_DESCRIPTIONS} from './card-modifier-display.js';
import {HAND_NAMES} from './hand-names.js';
import {HANDS} from './hands.js';
import {originalJokerKey,handRecognitionOptions} from './jokers.js';

// Explicit semantic links, checked against the existing consumable and joker rules.
// These describe an effect's subject/result, never properties attached to this card.
const enhancements={c_empress:'mult',c_heirophant:'bonus',c_magician:'lucky',c_lovers:'wild',c_chariot:'steel',c_justice:'glass',c_tower:'stone',c_devil:'gold'};
const jokerEnhancements={j_steel_joker:'steel',j_stone:'stone',j_marble:'stone',j_glass:'glass',j_lucky_cat:'lucky',j_ticket:'gold',j_midas_mask:'gold',j_flower_pot:'wild',j_seeing_double:'wild'};
const seals={c_talisman:'gold',c_deja_vu:'red',c_trance:'blue',c_medium:'purple'};
const handIds={'High Card':'high_card',Pair:'pair','Two Pair':'two_pair','Three of a Kind':'three_of_a_kind',Straight:'straight',Flush:'flush','Full House':'full_house','Four of a Kind':'four_of_a_kind','Straight Flush':'straight_flush','Five of a Kind':'five_of_a_kind','Flush House':'flush_house','Flush Five':'flush_five'};
const planetHands=new Map(catalogue.centres.filter(c=>c.set==='Planet').map(c=>[c.key,handIds[c.handType]]));
const jokerHands={j_jolly:'pair',j_sly:'pair',j_duo:'pair',j_zany:'three_of_a_kind',j_wily:'three_of_a_kind',j_trio:'three_of_a_kind',j_mad:'two_pair',j_clever:'two_pair',j_trousers:'two_pair',j_crazy:'straight',j_devious:'straight',j_order:'straight',j_runner:'straight',j_superposition:'straight',j_seance:'straight_flush',j_droll:'flush',j_crafty:'flush',j_tribe:'flush',j_family:'four_of_a_kind'};
const handRequirements={high_card:'Если нет более сильной комбинации, засчитывается старшая карта.',pair:'Две карты одного достоинства.',two_pair:'Две пары разных достоинств.',three_of_a_kind:'Три карты одного достоинства.',straight:'Пять последовательных достоинств. Туз бывает перед двойкой или после короля.',flush:'Пять карт одной масти.',full_house:'Тройка и пара другого достоинства.',four_of_a_kind:'Четыре карты одного достоинства.',straight_flush:'Пять последовательных достоинств одной масти.',five_of_a_kind:'Пять карт одного достоинства; нужны дополнительные копии карт.',flush_house:'Тройка и пара другого достоинства, все одной масти.',flush_five:'Пять карт одного достоинства и одной масти.'};
const split=description=>{const colon=description.indexOf(':');return {name:description.slice(0,colon),description:description.slice(colon+1).trim()};};
export function cardRelatedHelp(card={},options={}){
 if(options.concealed)return [];
 const key=originalJokerKey(card.entityId),result=[];
 const addProperty=(kind,id,label,source)=>{
  if(card[kind]===id)return;
  const entry=split(source[id]);result.push({id:kind+'-'+id,kind,material:id,title:label+': '+entry.name,description:entry.description});
 };
 if(enhancements[key])addProperty('enhancement',enhancements[key],'Создаёт',ENHANCEMENT_DESCRIPTIONS);
 if(jokerEnhancements[key])addProperty('enhancement',jokerEnhancements[key],['j_marble','j_midas_mask'].includes(key)?'Создаёт':'Связано',ENHANCEMENT_DESCRIPTIONS);
 if(seals[key])addProperty('seal',seals[key],'Добавляет',SEAL_DESCRIPTIONS);
 if(['c_aura','c_wheel_of_fortune'].includes(key))for(const edition of ['foil','holographic','polychrome'])addProperty('edition',edition,'Может добавить',EDITION_DESCRIPTIONS);
 if(key==='c_hex')addProperty('edition','polychrome','Добавляет',EDITION_DESCRIPTIONS);
 if(['c_ectoplasm','j_perkeo'].includes(key))result.push({id:'edition-negative',kind:'edition',material:'negative',title:key==='j_perkeo'?'Создаёт: Негативная расходная карта':'Добавляет: Негативный джокер',description:key==='j_perkeo'?'+1 место расходной карты.':'+1 место джокера.'});
 if(['j_vampire','j_drivers_license','c_familiar','c_grim','c_incantation'].includes(key))result.push({id:'enhanced-card',kind:'concept',title:'Связано: Усиленная карта',description:'Карта с одним улучшением: бонусная, множителя, дикая, стеклянная, стальная, каменная, золотая или счастливая. Издания и печати — отдельные свойства.'});
 if(['c_hex','c_ankh','j_ceremonial','j_madness'].includes(key)&&!card.eternal)result.push({id:'status-eternal',kind:'status',title:'Связано: Вечная',description:'Такого джокера нельзя продать или уничтожить.'});
 const handId=planetHands.get(key)??jokerHands[key];
 if(handId){
  const h=HANDS[handId],level=options.state?.handLevels?.[handId]??1;
  const recognition=handRecognitionOptions(options.state?.jokers??[]);
  let requirements='Обычное правило: '+handRequirements[handId];
  if(recognition.fourFingers&&['straight','flush','straight_flush'].includes(handId))requirements+=' «Четыре пальца»: для стрита и флеша достаточно 4 карт.';
  if(recognition.shortcut&&['straight','straight_flush'].includes(handId))requirements+=' «Короткий путь»: можно пропускать один ранг между соседними картами.';
  result.push({id:'hand-'+handId,kind:'hand',title:'Комбинация: '+HAND_NAMES[handId],description:requirements+` Уровень ${level}: ${h.chips+h.chipGain*(level-1)} фишек, базовый множитель ${h.mult+h.multGain*(level-1)}, без фишек карт. За уровень: +${h.chipGain} фишек и +${h.multGain} к множителю.`});
 }
 return result;
}
