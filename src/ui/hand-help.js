import {HANDS} from '../content/hands.js';
import {HAND_NAMES} from '../content/hand-names.js';
import {handRecognitionOptions} from '../content/jokers.js';
const examples={
 high_card:[[14,'spades'],[10,'hearts'],[8,'clubs'],[5,'diamonds'],[2,'spades']],
 pair:[[9,'hearts'],[9,'spades'],[12,'diamonds'],[4,'clubs'],[2,'spades']],
 two_pair:[[9,'hearts'],[9,'spades'],[4,'diamonds'],[4,'clubs'],[2,'spades']],
 three_of_a_kind:[[9,'hearts'],[9,'spades'],[9,'diamonds'],[4,'clubs'],[2,'spades']],
 straight:[[2,'hearts'],[3,'spades'],[4,'diamonds'],[5,'clubs'],[6,'spades']],
 flush:[[2,'hearts'],[5,'hearts'],[8,'hearts'],[11,'hearts'],[13,'hearts']],
 full_house:[[9,'hearts'],[9,'spades'],[9,'diamonds'],[13,'clubs'],[13,'spades']],
 four_of_a_kind:[[9,'hearts'],[9,'spades'],[9,'diamonds'],[9,'clubs'],[2,'spades']],
 straight_flush:[[2,'hearts'],[3,'hearts'],[4,'hearts'],[5,'hearts'],[6,'hearts']],
 five_of_a_kind:[[9,'hearts'],[9,'spades'],[9,'diamonds'],[9,'clubs'],[9,'spades']],
 flush_house:[[9,'hearts'],[9,'hearts'],[9,'hearts'],[13,'hearts'],[13,'hearts']],
 flush_five:[[9,'hearts'],[9,'hearts'],[9,'hearts'],[9,'hearts'],[9,'hearts']]
};
const descriptions={high_card:'Если нет более сильной комбинации, засчитывается старшая карта.',pair:'Две карты одного достоинства.',two_pair:'Две пары карт разных достоинств.',three_of_a_kind:'Три карты одного достоинства.',straight:'Пять карт последовательных достоинств. Туз может быть перед 2 или после короля, но не между ними.',flush:'Пять карт одной масти.',full_house:'Три карты одного достоинства и две карты другого достоинства.',four_of_a_kind:'Четыре карты одного достоинства.',straight_flush:'Стрит и флеш в одной сыгранной руке.',five_of_a_kind:'Пять карт одного достоинства. Нужны дополнительные копии карт.',flush_house:'Фулл-хаус и флеш в одной сыгранной руке. Нужны дополнительные копии карт.',flush_five:'Пять карт одного достоинства и одной масти. Нужны дополнительные копии карт.'};
/** Read-only help: examples always use ordinary cards; modifiers are explicit. */
export function handHelp(id,state={}){
 const hand=HANDS[id];if(!hand)throw new RangeError('Unknown hand');
 const level=state.handLevels?.[id]??1,{fourFingers,shortcut}=handRecognitionOptions(state.jokers??[]);
 let description=descriptions[id];
 if(fourFingers&&['straight','flush','straight_flush','flush_house'].includes(id))description+=' «Четыре пальца»: для стрита и флеша достаточно 4 карт. Для стрита-флеша эти наборы могут различаться.';
 if(shortcut&&['straight','straight_flush'].includes(id))description+=' «Короткий путь»: между соседними картами стрита можно пропустить один ранг.';
 if(['flush','straight_flush','flush_house','flush_five'].includes(id))description+=' Дикая карта считается любой мастью, пока не ослаблена. «Размытый джокер» объединяет масти одного цвета, пока не ослаблен.';
 description+=' Каменные карты не образуют комбинации по достоинству или масти; их фишки всё равно засчитываются. Пример ниже — обычные карты, без эффектов.';
 return {id,name:HAND_NAMES[id],level,chips:hand.chips+hand.chipGain*(level-1),mult:hand.mult+hand.multGain*(level-1),description,cards:examples[id].map(([rank,suit],i)=>({id:'help-'+i,rank,suit}))};
}
export function createHandHelp(id,state){
 const h=handHelp(id,state),root=document.createElement('aside');root.className='hand-help';root.id='run_hand_help';root.setAttribute('aria-live','polite');
 const add=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;n.textContent=text;root.append(n);return n;};
 add('h3','hand-help-name',h.name);add('p','hand-help-description',h.description);
 const cards=add('div','hand-help-cards',''),symbols={spades:'♠',hearts:'♥',clubs:'♣',diamonds:'♦'};
 for(const c of h.cards){const card=document.createElement('span');card.className='hand-help-card';card.dataset.red=String(['hearts','diamonds'].includes(c.suit));card.textContent=({11:'J',12:'Q',13:'K',14:'A'}[c.rank]??c.rank)+' '+symbols[c.suit];cards.append(card);}
 add('p','hand-help-score',`Уровень ${h.level} · ${h.chips} фишек × ${h.mult} множ. · без фишек карт и эффектов`);return root;
}
