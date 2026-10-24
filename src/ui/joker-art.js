import {JOKER_IDENTITIES} from '../content/joker-identities.js';
import {P,I,R,B,G,S,V,T,O,Y,L,K,group as g,path as p,rect as r,circle as c,ellipse as e,line as l,text as t,hatch as h,rays,spark,star,suit,card,cards,coin,chips,token,flame,crown,face,portrait,mask,palm,basket,arrow,arrowHead,ground,seal,tarot,box,press,gear,banana,die,person,price,crownBroken} from './joker-art-primitives.js';
// Each numbered plate is composed individually, simplified to one memorable subject after the full-face outlined-name request.
export const JOKER_SCENES={};
const add=(id,scene)=>{
  const number=Object.keys(JOKER_SCENES).length+1;
  if(JOKER_IDENTITIES[id]?.number!==number) throw new Error(`Joker plate order: ${id}, expected ${number}`);
  if(typeof scene!=='string'||scene.length<120||/undefined|NaN|Infinity/.test(scene)) throw new Error(`Invalid joker engraving: ${id}`);
  if(Object.values(JOKER_SCENES).includes(scene)) throw new Error(`Repeated joker engraving: ${id}`);
  JOKER_SCENES[id]=scene;
};

// Colour grounds are selected for each subject, never from a hash or game RNG.
const GROUNDS={
 sky:['#9dcff4','#79b4e7'],mint:['#8ddcce','#61c6b7'],rose:['#f4aed2','#e28ab8'],
 lilac:['#c4a5ef','#a283d7'],gold:['#f5d47a','#e4b54e'],leaf:['#bddd81','#98bd5e'],
 peach:['#ffb77e','#ef995b'],coral:['#ff9f99','#ed7e7c'],ice:['#c3e6ed','#91cedb'],
 night:['#6e72b2','#565b96'],sea:['#76c4cf','#51a5b8'],sand:['#f3c68e','#dbac71']
};
export const JOKER_BACKDROPS={
  j_joker:'sky', // 001 Искра
  j_greedy_joker:'mint', // 002 Алмазный жар
  j_lusty_joker:'lilac', // 003 Сердцебиение
  j_wrathful_joker:'ice', // 004 Остриё
  j_gluttenous_joker:'gold', // 005 Трилистник
  j_jolly:'night', // 006 Парный огонь
  j_zany:'lilac', // 007 Тройной огонь
  j_mad:'mint', // 008 Двойной дуэт
  j_crazy:'sky', // 009 Разгон
  j_droll:'peach', // 010 Единство
  j_sly:'rose', // 011 Парный запас
  j_wily:'leaf', // 012 Тройной запас
  j_clever:'sand', // 013 Два вклада
  j_devious:'sky', // 014 Лестница
  j_crafty:'coral', // 015 Одна масть
  j_half:'lilac', // 016 Малая сила
  j_stencil:'gold', // 017 Вакансия
  j_four_fingers:'sea', // 018 Четвёрка
  j_mime:'rose', // 019 Тихое эхо
  j_credit_card:'ice', // 020 В долг
  j_ceremonial:'lilac', // 021 Жертва справа
  j_banner:'sky', // 022 Резерв
  j_mystic_summit:'mint', // 023 Без отходов
  j_marble:'peach', // 024 Каменщик
  j_loyalty_card:'night', // 025 Шестой удар
  j_8_ball:'sea', // 026 Восьмое знамение
  j_misprint:'ice', // 027 Разброс
  j_dusk:'lilac', // 028 Последнее эхо
  j_raised_fist:'rose', // 029 Младший козырь
  j_chaos:'mint', // 030 За счёт заведения
  j_fibonacci:'coral', // 031 Спираль
  j_steel_joker:'ice', // 032 Стальной сплав
  j_scary_face:'peach', // 033 Галерея
  j_abstract:'sky', // 034 Компания
  j_delayed_grat:'leaf', // 035 Бережливость
  j_hack:'lilac', // 036 Малый повтор
  j_pareidolia:'gold', // 037 Маскарад
  j_gros_michel:'lilac', // 038 Спелый риск
  j_even_steven:'sea', // 039 Чётный жар
  j_odd_todd:'peach', // 040 Нечётный запас
  j_scholar:'leaf', // 041 Тузоведение
  j_business:'lilac', // 042 Гонорар
  j_supernova:'mint', // 043 Практика
  j_ride_the_bus:'coral', // 044 Без свиты
  j_space:'night', // 045 Звёздный шанс
  j_egg:'rose', // 046 Копилка
  j_burglar:'gold', // 047 Обмен ходов
  j_blackboard:'leaf', // 048 Чёрная рука
  j_runner:'ice', // 049 Пробег
  j_ice_cream:'lilac', // 050 Таяние
  j_dna:'lilac', // 051 Клон
  j_splash:'rose', // 052 Все в дело
  j_blue_joker:'gold', // 053 Остаток
  j_sixth_sense:'mint', // 054 Шестой портал
  j_constellation:'night', // 055 Орбиты
  j_hiker:'sky', // 056 Закалка
  j_faceless:'coral', // 057 Смена двора
  j_green_joker:'peach', // 058 Темп
  j_superposition:'leaf', // 059 Тузовый путь
  j_todo_list:'ice', // 060 Заказ
  j_cavendish:'rose', // 061 Крепкий сорт
  j_card_sharp:'mint', // 062 Знакомый приём
  j_red_card:'ice', // 063 Отказ
  j_madness:'lilac', // 064 Пожиратель
  j_square:'gold', // 065 Квартет
  j_seance:'night', // 066 Ритуал
  j_riff_raff:'peach', // 067 Пополнение
  j_vampire:'coral', // 068 Сбор дани
  j_shortcut:'sky', // 069 Через ступень
  j_hologram:'mint', // 070 Приращение
  j_vagabond:'ice', // 071 Последний грош
  j_baron:'lilac', // 072 Королевский резерв
  j_cloud_9:'sky', // 073 Девятная рента
  j_rocket:'night', // 074 Карьерный рост
  j_obelisk:'peach', // 075 Новый приём
  j_midas_mask:'mint', // 076 Позолота
  j_luchador:'gold', // 077 Откуп
  j_photograph:'rose', // 078 Первый портрет
  j_gift:'lilac', // 079 Наценка
  j_turtle_bean:'coral', // 080 Увядающий веер
  j_erosion:'peach', // 081 Прореживание
  j_reserved_parking:'sky', // 082 Знатные гости
  j_mail:'leaf', // 083 Выкуп ранга
  j_to_the_moon:'mint', // 084 Проценты
  j_hallucination:'lilac', // 085 Сюрприз внутри
  j_fortune_teller:'night', // 086 Опыт гадателя
  j_juggler:'sea', // 087 Шестая карта
  j_drunkard:'rose', // 088 Запасной сброс
  j_stone:'ice', // 089 Каменоломня
  j_golden:'lilac', // 090 Жалованье
  j_lucky_cat:'gold', // 091 Удача в рост
  j_baseball:'coral', // 092 Необычный союз
  j_bull:'sea', // 093 Капитал
  j_diet_cola:'rose', // 094 Удвоитель наград
  j_trading:'mint', // 095 Одиночный выкуп
  j_flash:'lilac', // 096 Перекрут
  j_popcorn:'leaf', // 097 Порция
  j_trousers:'sky', // 098 Парное накопление
  j_ancient:'gold', // 099 Избранная масть
  j_ramen:'peach', // 100 Не расплескать
  j_walkie_talkie:'leaf', // 101 Четыре-десять
  j_selzer:'lilac', // 102 Десять повторов
  j_castle:'ice', // 103 Сбор масти
  j_smiley:'mint', // 104 Одобрение двора
  j_campfire:'night', // 105 Распродажа
  j_ticket:'sky', // 106 Золотая касса
  j_mr_bones:'coral', // 107 Четверть шанса
  j_acrobat:'mint', // 108 Финальный рывок
  j_sock_and_buskin:'lilac', // 109 Выход на бис
  j_swashbuckler:'gold', // 110 Доля команды
  j_troubadour:'rose', // 111 Широкий выбор
  j_certificate:'ice', // 112 Штемпель
  j_smeared:'coral', // 113 Два цвета
  j_throwback:'leaf', // 114 Обход
  j_hanging_chad:'lilac', // 115 Тройной отпечаток
  j_rough_gem:'mint', // 116 Алмазная выручка
  j_bloodstone:'ice', // 117 Сердечный риск
  j_arrowhead:'gold', // 118 Пиковый клад
  j_onyx_agate:'rose', // 119 Семилистник
  j_glass:'sky', // 120 Осколочный рост
  j_ring_master:'coral', // 121 Повторный тираж
  j_flower_pot:'lilac', // 122 Четыре масти
  j_blueprint:'peach', // 123 Копия справа
  j_wee:'sky', // 124 Двойка в рост
  j_merry_andy:'mint', // 125 Перебор
  j_oops:'rose', // 126 Двойной шанс
  j_idol:'leaf', // 127 Точное попадание
  j_seeing_double:'gold', // 128 Трефовый союз
  j_matador:'ice', // 129 Плата за помеху
  j_hit_the_road:'night', // 130 Проводы валетов
  j_duo:'lilac', // 131 Парный резонанс
  j_trio:'mint', // 132 Тройной резонанс
  j_family:'coral', // 133 Каре силы
  j_order:'gold', // 134 Цепная тяга
  j_tribe:'sky', // 135 Мастевой резонанс
  j_stuntman:'rose', // 136 Узкий размах
  j_invisible:'night', // 137 Отложенный двойник
  j_brainstorm:'peach', // 138 Копия первого
  j_satellite:'lilac', // 139 Планетная рента
  j_shoot_the_moon:'mint', // 140 Королевский совет
  j_drivers_license:'sky', // 141 Шестнадцать улучшений
  j_cartomancer:'night', // 142 Предвестник
  j_astronomer:'lilac', // 143 Небесный подарок
  j_burnt:'coral', // 144 Урок сброса
  j_bootstraps:'leaf', // 145 Пять к двум
  j_caino:'sea', // 146 Падение двора
  j_triboulet:'rose', // 147 Двойная корона
  j_yorick:'gold', // 148 Двадцать третий
  j_chicot:'mint', // 149 Безвластие
  j_perkeo:'lilac', // 150 Теневая копия
};


const simpleFirstHead=(x,y,s=1,color=V)=>g(x,y,s,p('M-15 3V-17L-7 -12L0 -23L8 -12L16 -19L14 3Z',color)+p('M-13 0Q0 -8 13 0V12Q0 29 -13 12Z',P)+p('M-7 7H-3M4 7H8M-5 16Q0 20 6 15','none',I,1.8));
// 001 — One red multiplier cut into a blazing spark.
add('j_joker',p('M58 27L68 49L93 41L83 64L103 79L79 86L80 109L58 97L38 111L36 87L15 78L35 63L26 42L48 49Z',O)+p('M42 50L59 67L77 49L86 58L68 76L86 94L77 103L59 85L41 103L32 94L50 76L33 59Z',R)+p('M43 57L59 74L77 56','none',Y,3));
// 002 — One faceted hot diamond carries its own red flame silhouette.
add('j_greedy_joker',p('M59 28Q87 50 90 74Q91 100 59 112Q28 99 29 74Q31 51 59 28Z',R)+p('M59 37L83 73L59 105L35 73Z',Y)+p('M59 37L59 105L35 73Z',O)+p('M35 73H83M59 38L48 73L59 104L70 73Z','none',P,2));
// 003 — One large beating heart with a pulse cut through it.
add('j_lusty_joker',suit('h',59,71,2.6,R)+p('M24 78H41L47 65L54 92L64 49L73 78H94','none',Y,5)+p('M29 48Q36 38 45 43','none',K,4));
// 004 — One bright spade-tipped spear.
add('j_wrathful_joker',p('M54 72H64V112H54Z',O)+p('M59 28L82 62L70 78L59 70L48 78L36 62Z',B)+p('M59 28L59 70L48 78L36 62Z',T)+p('M59 35V63','none',P,2.5)+r(48,76,22,7,Y,1));
// 005 — One three-leaf clover; the three lobes carry different green inks.
add('j_gluttenous_joker',p('M57 81L53 111H65L62 79Z',T)+p('M55 74C28 99 11 72 25 57C31 50 42 54 47 58C30 31 56 18 67 35C72 41 69 53 67 59C87 37 107 60 95 78C87 90 72 83 64 75Z',L)+p('M48 60Q27 52 26 69Q31 82 49 71Z',T)+p('M62 61Q83 48 91 63Q95 79 68 71Z',B)+p('M58 42V67','none',Y,3));
// 006 — A twin flame: the pair is the whole image.
add('j_jolly',p('M22 110V97H96V110Z',B)+g(39,70,1.05,p('M0 -38C-8 -18 -22 -9 -20 10Q-16 34 0 30Q22 27 20 7C18 -10 8 -21 0 -38Z',R)+p('M0 -9Q-11 7 -6 19Q0 32 9 14Q11 6 0 -9Z',Y))+g(79,70,1.05,p('M0 -38C-8 -18 -22 -9 -20 10Q-16 34 0 30Q22 27 20 7C18 -10 8 -21 0 -38Z',O)+p('M0 -9Q-11 7 -6 19Q0 32 9 14Q11 6 0 -9Z',Y)));
// 007 — A single three-armed burner supports three matching flames.
add('j_zany',p('M59 111V64M30 86Q59 103 88 86M30 86V63M88 86V63','none',V,6)+[[30,56],[59,41],[88,56]].map(([x,y])=>g(x,y,.65,p('M0 -24Q-22 4 -14 17Q0 35 14 17Q22 3 0 -24Z',R)+p('M0 -2Q-9 12 0 19Q9 12 0 -2Z',Y))).join(''));
// 008 — Four masks form two tightly joined duets, without surrounding decoration.
add('j_mad',g(40,52,.78,mask(0,0,1,T),-12)+g(76,52,.78,mask(0,0,1,T),12)+g(40,89,.78,mask(0,0,1,K),-12)+g(76,89,.78,mask(0,0,1,K),12)+p('M26 73H91','none',Y,3));
// 009 — One accelerating stair-arrow rises through five successive steps.
add('j_crazy',p('M18 109V93H34V78H50V63H66V48H82V34H99V109Z',O)+p('M18 109V93H34V78H50V63H66V48H82V34H99','none',Y,4)+p('M32 101Q55 100 82 58L73 59L91 43L92 67L85 62Q62 106 32 106Z',R)+p('M27 95H30M43 80H46M59 65H62','none',V,3));
// 010 — Five identical hearts are united in one wreath.
add('j_droll',c(59,73,31,'none',B,8)+[[59,38],[88,61],[77,96],[41,96],[30,61]].map(([x,y])=>suit('h',x,y,.9,R)).join('')+c(59,73,10,Y));
// 011 — Two matching chip reserves share one enclosing tie.
add('j_sly',chips(38,103,6,1)+chips(80,103,6,1)+p('M21 94Q59 115 97 94','none',T,5));
// 012 — One three-column reserve of blue chips.
add('j_wily',chips(30,105,6,.85)+chips(59,105,9,.95)+chips(88,105,6,.85));
// 013 — Two deposits, each visibly stamped with a pair.
add('j_clever',g(36,76,1,p('M-19 -29H19V28H-19Z',B)+e(0,-29,19,6,T)+p('M-9 -10H-2V8H-9ZM4 -10H11V8H4Z',Y)+p('M-15 23H15','none',P,2))+g(83,76,1,p('M-19 -29H19V28H-19Z',B)+e(0,-29,19,6,T)+p('M-9 -10H-2V8H-9ZM4 -10H11V8H4Z',Y)+p('M-15 23H15','none',P,2)));
// 014 — A single unmistakable staircase of five blue treads.
add('j_devious',p('M18 111V95H34V79H50V63H66V47H82V31H100V111Z',B)+p('M18 95H34V79H50V63H66V47H82V31H100','none',T,5)+[2,3,4,5,6].map((n,i)=>t(26+i*16,108-i*16,n,10,Y)).join(''));
// 015 — One blue wax seal carries the same club five times.
add('j_crafty',seal(59,73,1.35,B)+[[59,48],[81,65],[73,92],[45,92],[37,65]].map(([x,y])=>suit('c',x,y,.52,T)).join('')+c(59,73,6,Y));
// 016 — A little jester throws one enormous multiplier-shaped shadow.
add('j_half',p('M26 31L59 60L91 31L104 46L74 75L101 102L87 112L59 86L33 113L18 100L45 75L14 46Z',V)+simpleFirstHead(59,79,.85,Y)+p('M40 99L59 89L78 99V113H40Z',O));
// 017 — A single vacant chair is the entire subject.
add('j_stencil',r(31,30,56,54,V,10)+r(40,39,38,35,T,6)+p('M28 83H90V96H28Z',Y)+p('M34 95L29 113M84 95L89 113','none',I,5)+p('M45 54H73','none',P,3));
// 018 — One glove raises exactly four fingers.
add('j_four_fingers',p('M38 112V93Q25 89 22 76Q20 67 27 66L39 77V45Q39 36 46 40L50 69V31Q51 23 58 28L61 69V42Q63 34 70 39L72 82L73 112Z',T)+p('M47 83Q57 78 68 84','none',P,3)+r(38,103,35,10,B,1));
// 019 — One mime mask is echoed by a pale contour directly behind it.
add('j_mime',g(73,68,1.05,p('M-19 -20Q0 -27 19 -20L16 7Q11 23 0 27Q-11 23 -16 7Z','none',V,4))+mask(48,70,1.45,P)+p('M27 43Q48 27 69 42','none',B,5));
// 020 — One open purse has fallen twenty below zero.
add('j_credit_card',r(22,51,76,58,V,8)+p('M22 63L36 37H84L98 63Z',T)+p('M34 38Q59 24 84 38','none',Y,5)+r(54,71,44,23,K,5)+t(76,87,'−20',14,I)+c(91,82,2,Y));
// 021 — A dagger on the right sacrifices a small crown into the growing left crown.
add('j_ceremonial',crown(38,86,1.25,Y)+p('M79 30H89V55L84 82L79 55Z',S)+p('M75 51H94','none',V,6)+p('M83 86Q68 111 46 101','none',R,5)+p('M79 31H89V43H79Z',O));
// 022 — One folded reserve banner carries a stack of blue chips.
add('j_banner',p('M28 33H90V109L59 92L28 109Z',T)+p('M34 40H84V97L59 83L34 97Z',B)+chips(59,79,5,1.2)+p('M21 32H97','none',Y,6));
// 023 — An empty discard basket is marked with a large red zero.
add('j_mystic_summit',p('M27 53L36 108H82L91 53Z',T)+e(59,53,32,9,P)+p('M39 64L45 97M79 64L73 97','none',B,3)+t(59,94,'0',29,R));
// 024 — A stone block and its mason's hammer are the only objects.
add('j_marble',p('M26 60L73 48L87 99L39 111L26 60Z',S)+p('M39 67L68 60L77 91L46 99Z',T)+p('M39 67L46 99M39 67L68 60','none',P,3)+g(79,47,.95,r(-18,-9,36,18,B,2)+r(-3,9,6,43,O,1),-30));
// 025 — A single sixth-stroke bell glows from its clapper.
add('j_loyalty_card',p('M28 88Q40 77 38 58Q38 34 59 34Q80 34 80 58Q78 77 90 88L86 96H32Z',V)+p('M33 88H85','none',K,5)+c(59,101,10,Y)+p('M53 34V27H65V34Z',B)+t(59,71,'VI',23,Y));
// 026 — An eight-ball opens a single star-shaped omen.
add('j_8_ball',c(59,75,37,I)+c(59,76,20,P)+t(59,87,'8',31,B)+p('M33 45L53 50L59 28L67 49L85 43','none',V,6)+star(59,34,.5,Y));
// 027 — One variable printing dial spans zero to twenty-three.
add('j_misprint',c(59,72,39,V)+c(59,72,29,T)+p('M59 71L82 47','none',O,7)+c(59,72,7,Y)+t(38,87,'0',18,P)+t(78,91,'23',18,Y));
// 028 — A sunset-coloured theatre mask leaves a smaller final echo.
add('j_dusk',mask(48,69,1.35,O)+mask(80,87,.7,V)+p('M25 54H69M24 61H72','none',Y,3));
// 029 — A tiny low-ranked jester lifts one heavy weight.
add('j_raised_fist',p('M36 51H82L91 79H27Z',V)+p('M47 51V41Q59 28 72 41V51','none',I,6)+t(59,70,'50',19,Y)+c(59,90,6,P)+p('M59 97V108M56 99L40 82M62 99L78 82M59 106L45 112M59 106L73 112','none',B,4)+p('M52 84L59 78L66 84Z',R));
// 030 — One shop reroll drum is clearly free.
add('j_chaos',r(26,53,66,53,V,5)+p('M22 51L33 32H86L97 51Z',T)+r(35,64,48,25,K,3)+p('M45 77Q57 63 70 77L72 70M70 77L62 76','none',Y,3)+t(59,103,'0',14,Y)+p('M92 76H100V63','none',I,4));
// 031 — A single spiral shell carries the five Fibonacci ranks.
add('j_fibonacci',p('M99 108H43Q19 108 19 84V53Q19 30 43 30H75Q99 30 99 54V77Q99 97 80 97H56Q38 97 38 79V61Q38 47 53 47H68Q83 47 83 62V73Q83 82 74 82H63Q55 82 55 73V65Q55 60 62 60Q70 60 70 67Q70 74 65 74','none',O,10)+p('M98 108H43Q19 108 19 84','none',R,3)+t(29,84,'A',12,I)+t(34,43,'2',12,I)+t(86,48,'3',12,I)+t(86,90,'5',12,I)+t(46,78,'8',12,I));
// 032 — One steel gear has a hot orange forge core.
add('j_steel_joker',gear(59,70,1.35)+c(59,74,15,O)+c(59,74,8,Y));
// 033 — Three court masks are the entire gallery.
add('j_scary_face',mask(31,79,.76,T)+mask(59,59,1,Y)+mask(88,79,.76,K)+p('M46 35L50 25L59 31L68 25L72 35Z',B));
// 034 — A close group of three jesters forms one company.
add('j_abstract',simpleFirstHead(31,76,.9,T)+simpleFirstHead(87,76,.9,O)+simpleFirstHead(59,52,1.05,V)+p('M21 102Q59 85 97 102V112H21Z',R));
// 035 — One hourglass conserves golden coin-shaped sand.
add('j_delayed_grat',p('M33 31H85V44Q84 58 65 71Q84 85 85 99V111H33V99Q34 85 53 71Q34 58 33 44Z',T)+p('M39 40H79L59 63Z',Y)+p('M39 105Q59 78 79 105Z',G)+p('M31 31H87M31 111H87','none',V,7)+p('M59 64V80','none',Y,2));
// 036 — One returning toy boomerang bears the small repeated ranks.
add('j_hack',p('M22 43L59 68L94 34L104 45L61 96L16 55Z',B)+p('M24 47L59 77L97 40','none',T,5)+t(30,57,'2',11,Y)+t(48,72,'3',11,Y)+t(72,69,'4',11,Y)+t(88,51,'5',11,Y));
// 037 — One coroneted masquerade mask turns every face royal.
add('j_pareidolia',mask(59,77,1.5,K)+p('M31 45L28 28L45 37L59 23L73 37L90 28L87 45Z',Y)+p('M47 65Q59 57 71 65','none',V,4));
// 038 — A single ripe banana carries a fuse at its stem.
add('j_gros_michel',g(59,73,1.25,p('M-24 -24C-28 7 -11 32 10 27C26 23 33 4 28 -14L22 -18C22 1 12 15 0 9C-12 4 -16 -6 -17 -24Z',Y)+p('M-19 -18C-21 9 -7 26 9 22C20 20 26 8 26 -6','none',O,3)+p('M-24 -24L-24 -29L-17 -29L-17 -24',L),-12)+p('M24 42Q17 27 33 26','none',I,3)+p('M33 26L38 20L37 31L44 34L33 35L27 41L28 31L24 27Z',R));
// 039 — One red furnace flame is stamped with even ranks.
add('j_even_steven',p('M60 27C65 49 95 53 96 79Q97 111 59 112Q21 109 22 79Q24 60 38 47L39 70L60 27Z',R)+p('M59 59Q81 83 72 102H46Q35 86 59 59Z',O)+t(59,75,'2·4',17,Y)+t(59,99,'6·8·10',13,Y));
// 040 — One blue reserve stack is engraved with odd ranks.
add('j_odd_todd',p('M24 40H94V100Q59 116 24 100Z',B)+e(59,40,35,10,T)+p('M24 59Q59 75 94 59M24 80Q59 96 94 80','none',P,2)+t(59,64,'A·3·5',14,Y)+t(59,96,'7·9',16,Y));
// 041 — One open ace textbook beneath an attentive owl face.
add('j_scholar',p('M25 69Q43 60 59 69Q75 60 93 69V108Q75 101 59 109Q43 101 25 108Z',P)+p('M59 69V109','none',V,3)+t(43,94,'A',24,B)+t(77,94,'A',24,R)+p('M31 57L25 29L43 36Q59 28 75 36L93 29L87 57Q59 81 31 57Z',T)+c(46,48,10,Y)+c(73,48,10,Y)+c(46,48,4,I)+c(73,48,4,I)+p('M55 59L59 65L64 59Z',O));
// 042 — One payment envelope is sealed for the royal court.
add('j_business',r(22,52,74,53,V,4)+p('M22 53L59 79L96 53M22 105L48 77M96 105L70 77','none',K,3)+c(59,78,14,Y)+crown(59,76,.6,O));
// 043 — One wound practice wheel gains another turn around its multiplier core.
add('j_supernova',p('M96 75Q96 33 59 33Q22 33 22 75Q22 109 56 109Q86 109 86 79Q86 53 62 53Q40 53 40 75Q40 94 57 94','none',V,9)+p('M50 64L68 82M68 64L50 82','none',R,6)+c(59,73,2,Y));
// 044 — One empty city bus carries no courtly passengers.
add('j_ride_the_bus',r(22,37,74,65,T,8)+r(31,46,56,30,B,3)+p('M34 50H84V71H34Z',P)+p('M48 46V76M69 46V76','none',T,3)+c(38,105,8,I)+c(80,105,8,I)+p('M28 90H40M78 90H90','none',Y,5));
// 045 — One four-corner star die offers a rising lucky face.
add('j_space',g(59,71,1.2,r(-27,-29,54,58,V,6)+star(0,0,.75,Y)+p('M0 10V-13M-7 -6L0 -14L7 -6','none',B,3)+c(-19,-20,3,T)+c(19,-20,3,T)+c(-19,20,3,T)+c(19,20,3,O),-12));
// 046 — One egg-shaped money box retains a clearly visible coin slot.
add('j_egg',p('M59 29C37 30 23 66 29 90Q34 111 59 111Q84 111 90 90C96 66 81 29 59 29Z',S)+p('M45 48H74','none',I,6)+p('M45 45H74','none',T,2)+p('M38 67Q33 83 41 94','none',P,3)+p('M50 88L59 79L68 88L59 97Z',G));
// 047 — A single three-finger glove trades away its discard allowance.
add('j_burglar',p('M35 111V82L24 70Q19 62 26 60L39 70V41Q39 34 46 36L49 65V30Q50 23 57 27L59 64L63 37Q65 29 71 33L69 76L80 64Q89 56 92 63L78 88L72 111Z',T)+r(35,101,37,11,B,1)+t(54,96,'0',19,Y));
// 048 — One dark glove carries only the two black suits.
add('j_blackboard',p('M35 111V85L22 72Q18 66 24 61L38 69V41Q39 34 45 37L49 66V30Q50 23 56 27L59 65L62 34Q64 28 70 31L69 70L77 47Q80 40 85 45L80 82L72 96V111Z',I)+suit('s',49,81,.65,T)+suit('c',69,88,.65,L)+p('M38 106H70','none',V,4));
// 049 — One running figure is bound to its rising chip-blue track.
add('j_runner',p('M21 108Q59 105 98 55','none',B,9)+person(61,64,1.2,'run',R)+p('M55 50L67 56L59 69L47 63Z',K)+p('M89 58L100 49L99 67','none',T,4));
// 050 — One melting ice cream, with the drip attached to the scoop.
add('j_ice_cream',p('M36 71H82L59 112Z',Y)+p('M43 83L65 103M72 82L51 102','none',O,2)+p('M29 66Q22 47 42 42Q45 26 62 32Q82 27 87 45Q102 51 88 70H75L73 92Q69 102 65 90L63 71L49 71L46 83Q39 89 38 72Z',T)+p('M31 62Q59 77 88 62','none',V,5)+p('M39 48Q48 39 57 43','none',K,5));

// 051 — One double-headed sprout: the new head is an exact living copy.
add('j_dna',p('M59 111V78M59 86L35 67M59 86L83 67','none',T,7)+p('M35 68Q13 56 27 35Q49 30 49 51Q49 63 35 68Z',K)+p('M83 68Q61 56 75 35Q97 30 97 51Q97 63 83 68Z',K)+p('M29 48L39 43M77 48L87 43','none',P,3)+p('M51 106H67','none',Y,5));
// 052 — A single open five-fingered hand puts every coloured finger into play.
add('j_splash',p('M36 109L32 91L21 74Q18 66 25 64L39 76V43Q40 35 46 40L48 68V33Q51 26 56 33L57 66V32Q61 25 66 32L67 67V41Q71 34 76 41L77 84Q89 73 96 79Q100 85 83 98L76 110Z',T)+p('M43 45V68M53 36V66','none',K,5)+p('M63 36V66M73 45V69','none',Y,5)+p('M45 87Q59 80 75 86','none',P,3));
// 053 — A blue drawstring sack stores the remaining blue chips as one compact reserve.
add('j_blue_joker',p('M39 49L33 33H85L79 49Q99 72 94 96Q91 113 59 113Q28 113 24 96Q20 73 39 49Z',B)+p('M36 46H82','none',Y,7)+p('M47 67H71L77 89H41Z',T)+e(59,68,12,4,P)+p('M46 77H72M44 85H74','none',I,2));
// 054 — One spectral eye opens in a violet portal marked by the sixth numeral.
add('j_sixth_sense',e(59,70,36,43,V)+p('M24 70Q59 33 94 70Q59 106 24 70Z',T)+e(59,70,13,23,Y)+e(59,70,5,17,I)+c(63,61,3,P)+t(59,110,'VI',13,K));
// 055 — A single bright planet gains a clear ascending orbit.
add('j_constellation',c(58,71,25,V)+p('M38 57Q57 40 77 58M36 77Q57 94 79 78','none',K,6)+g(59,71,1,e(0,0,42,14,'none',Y,4),-29)+p('M94 44L96 57L84 53',T)+c(49,60,5,P));
// 056 — One tempered sword changes from hot orange to permanent blue steel.
add('j_hiker',p('M59 28L76 47L64 87H54L42 47Z',B)+p('M59 28L59 87H54L42 47Z',O)+p('M59 36V77','none',P,3)+p('M39 87H79','none',Y,7)+r(54,89,11,23,V,2));
// 057 — Three retiring court masks form one stack, with a single payment seal.
add('j_faceless',g(34,66,.84,mask(0,0,1,T),-19)+g(84,66,.84,mask(0,0,1,K),19)+mask(59,65,1.12,Y)+c(59,105,12,G)+t(59,110,'5',15,V));
// 058 — A metronome shows the forward gain and backward loss of tempo.
add('j_green_joker',p('M37 108L47 31H71L82 108Z',V)+p('M45 98L52 42H66L73 98Z',T)+p('M59 99L80 51','none',Y,5)+r(68,63,15,10,K,2)+p('M51 62H62M56 57V67M50 82H63','none',P,2.5));
// 059 — A single golden road takes the form of an ace's A.
add('j_superposition',p('M23 111L50 32H68L96 111H78L59 53L40 111Z',G)+p('M39 86H80L85 101H34Z',Y)+p('M53 40L33 105M65 40L86 105','none',P,2)+suit('s',59,70,.65,V));
// 060 — One clipped order form combines the requested hand and its four-dollar payment.
add('j_todo_list',r(29,31,61,80,T,4)+r(44,26,31,12,O,3)+p('M40 52L46 58L55 46M40 72L46 78L55 66','none',Y,4)+p('M64 52H79M64 73H79','none',P,3)+t(60,102,'$4',18,V));
// 061 — A single strong banana is held together by two forged braces.
add('j_cavendish',g(58,70,1.32,banana(0,0,1,-8))+p('M32 72L48 64M58 103L58 86','none',T,9)+p('M32 72L48 64M58 103L58 86','none',I,2)+p('M68 84L78 78','none',P,3));
// 062 — A returning three-lobed boomerang repeats a familiar winning move.
add('j_card_sharp',p('M28 42Q59 23 91 42L81 58Q60 46 39 59L59 87L80 64L94 76Q80 100 59 114L24 65Q17 53 28 42Z',V)+p('M32 46Q60 32 85 46M31 63L58 101L87 75','none',T,5)+t(59,53,'3',16,Y));
// 063 — One unopened packet bears a bold refusal cross.
add('j_red_card',p('M26 38L59 29L92 38V104L59 113L26 104Z',V)+p('M26 38L59 48L92 38M59 48V112','none',T,4)+c(59,74,24,R)+p('M45 60L73 88M73 60L45 88','none',Y,7));
// 064 — A single hungry creature bites a small jester-shaped morsel.
add('j_madness',p('M24 71Q16 32 52 28Q77 26 89 47L66 69L93 92Q76 116 51 111Q20 107 24 71Z',K)+p('M33 58L43 72L49 51L56 69L64 49M36 93L44 78L52 101L60 82L67 101',P)+c(42,44,8,T)+c(44,43,3,I)+p('M82 64L87 54L94 62L101 56L100 77L83 78Z',Y));
// 065 — Four blue chips lock into one square-shaped quartet.
add('j_square',r(25,34,68,75,T,8)+[[43,56],[75,56],[43,88],[75,88]].map(([x,y])=>c(x,y,13,B)+c(x,y,8,'none',Y,2)).join('')+p('M59 41V102M32 72H86','none',V,3));
// 066 — A single spectral candle has a hand-shaped blue flame.
add('j_seance',r(44,75,31,37,V,3)+e(59,75,15,5,K)+p('M49 74Q34 59 39 51L47 56V37Q51 30 55 37V51L58 31Q63 26 65 33L64 52L70 39Q76 35 77 42L72 63Q70 75 60 78Z',T)+p('M51 64L58 57L65 63','none',Y,3)+l(59,78,59,88,P,2));
// 067 — Two new jesters emerge together from a shared open collar.
add('j_riff_raff',p('M24 88Q59 72 94 88L83 112H35Z',V)+p('M30 91L44 99L59 87L74 99L88 91','none',Y,4)+g(40,62,1.2,face(0,0,1,'J',T))+g(79,62,1.2,face(0,0,1,'J',O)));
// 068 — A single vampire mask collects a golden drop between its fangs.
add('j_vampire',p('M28 40L45 46L59 31L73 46L91 40L82 82L59 110L36 82Z',V)+p('M44 42Q59 29 75 42L70 67L59 79L48 67Z',T)+p('M46 50L53 54M65 54L72 50','none',I,3)+p('M49 62L54 75L58 62M62 62L67 75L71 62',P)+p('M59 81Q43 99 59 105Q75 99 59 81Z',G));
// 069 — One leaping figure takes a shortcut across a missing stair.
add('j_shortcut',p('M22 110V90H45V70H68V48H94V111Z',V)+p('M22 90H45M68 48H94','none',O,6)+person(59,59,1.08,'leap',T)+p('M30 65Q39 43 54 41','none',Y,4));
// 070 — One growing silhouette gains a new coloured outer layer.
add('j_hologram',p('M28 111V82Q28 63 43 59Q26 31 49 27Q71 25 71 46Q71 54 65 60Q84 64 84 82V111Z',V)+p('M40 111V83Q40 69 54 64Q40 42 56 37Q73 32 75 49Q77 58 68 64Q89 68 89 83V111Z',K)+p('M49 110V85Q49 74 61 70Q49 50 63 45Q77 42 79 55Q80 62 73 69Q96 74 96 87V111Z',T)+p('M59 88H79M69 78V99','none',Y,3));
// 071 — A single hand offers its last remaining coin.
add('j_vagabond',p('M24 88L37 77L45 81L39 68Q36 61 43 60L60 75L84 67Q94 64 96 71L83 83L93 80Q102 82 94 90L75 103H45L31 113Z',V)+p('M44 87L59 91L77 81','none',T,4)+coin(59,51,1.5)+p('M27 89L41 108','none',K,5));
// 072 — One reserved king keeps his power behind a closed royal cloak.
add('j_baron',p('M27 111L35 72L47 62H71L83 73L91 111Z',V)+p('M37 76L59 111L81 76',T)+e(59,51,17,21,O)+crown(59,31,1.05,Y)+p('M50 50H54M65 50H69M53 62Q59 66 66 61','none',I,2)+p('M52 82L59 89L67 81','none',K,4));
// 073 — One ninth-rent coin descends from a compact nine-shaped cloud.
add('j_cloud_9',p('M29 68Q13 63 22 46Q18 29 38 31Q46 20 60 30Q80 21 88 39Q106 44 96 60Q93 71 76 69Z',T)+t(59,59,'9',30,V)+coin(59,94,1.5)+p('M59 73V77','none',K,4));
// 074 — One ascending rocket turns victories into a rising golden exhaust.
add('j_rocket',g(61,68,1,p('M0 -40Q-24 -16 -17 22H17Q24 -16 0 -40Z',T)+p('M-17 3L-30 27L-16 20M17 3L30 27L16 20',V)+c(0,-10,11,B)+c(0,-10,6,P)+p('M-11 25L0 46L11 25Z',O)+p('M-5 25L0 39L5 25Z',Y),20));
// 075 — One old obelisk splits to reveal a new living shoot.
add('j_obelisk',p('M35 111L41 43L59 27L77 43L83 111Z',V)+p('M59 28V110H81L76 44Z',B)+p('M58 43L51 65L61 79L54 109','none',Y,3)+p('M59 83Q68 54 90 51Q93 71 67 79Z',L)+p('M58 103L74 73','none',T,4));
// 076 — One ceremonial mask changes cleanly from turquoise into gold.
add('j_midas_mask',mask(59,69,1.65,T)+p('M59 28Q91 23 90 41L85 81Q78 104 59 113Z',G)+p('M66 49Q76 43 83 49M68 59H77M59 61L56 80H61M59 94Q68 91 74 96','none',I,2.5)+p('M68 36L78 33','none',Y,3));
// 077 — A wrestlers' mask is offered for sale with one small price tag.
add('j_luchador',p('M31 40Q59 24 87 40L84 80L59 106L34 80Z',B)+p('M32 40L59 59L86 40L82 78L59 102L36 78Z',R)+p('M35 56L52 63L43 73L34 66ZM66 63L83 56L84 66L75 73Z',Y)+p('M49 85H69','none',I,4)+price(82,104,'$',.7));
// 078 — One camera frames its first royal face inside the lens.
add('j_photograph',r(22,45,75,58,O,6)+r(34,32,26,14,K,3)+r(29,52,13,8,Y,1)+c(67,74,23,V)+c(67,74,17,T)+g(67,73,.58,face(0,0,1,'Q',Y)));
// 079 — One price tag rises by one clear notch.
add('j_gift',g(58,69,1.3,p('M-26 -23H11L29 -5V24H-26Z',K)+c(15,-12,4,P)+p('M-13 13H8M-3 16V-9M-11 -2L-3 -10L5 -2','none',Y,4),-12));
// 080 — One five-leaf fan visibly loses its final leaf.
add('j_turtle_bean',p('M59 111L38 67M59 111L45 40M59 111V32M59 111L76 40M59 111L88 66','none',V,3)+p('M38 73Q12 66 23 43Q47 45 38 73Z',T)+p('M46 53Q23 37 43 24Q63 34 46 53Z',L)+p('M59 47Q42 28 59 23Q78 28 59 47Z',Y)+p('M74 54Q61 29 82 26Q99 45 74 54Z',O)+p('M86 91Q72 76 92 70Q109 83 86 91Z',K));
// 081 — One pair of shears makes a clean gap in a leafy strip.
add('j_erosion',p('M25 109V69Q15 45 34 38Q50 32 55 56L59 109Z',L)+p('M74 108Q61 76 79 47Q101 42 97 62L87 109Z',T)+g(60,64,1,p('M-10 12L15 -25M10 12L-16 -25','none',S,6)+c(-12,24,11,R)+c(12,24,11,K)+c(-12,24,5,P)+c(12,24,5,P)+c(0,8,4,Y),12));
// 082 — One royal reserved chair pays a single golden tip from beneath the seat.
add('j_reserved_parking',p('M29 83V44Q29 32 42 32H76Q90 32 90 44V83Z',V)+crown(59,52,1.1,Y)+r(28,80,63,17,K,5)+p('M35 98V112M84 98V112','none',T,6)+coin(59,108,.95));
// 083 — One rank-stamped envelope holds a single banknote.
add('j_mail',g(59,70,1.1,r(-24,-35,48,45,T,3)+t(0,-8,'5',22,Y)+p('M-35 -11H35V37H-35Z',K)+p('M-35 -11L0 13L35 -11M-35 37L-11 8M35 37L11 8','none',V,2)+c(14,22,9,G)+t(14,26,'7',11,I),-7));
// 084 — A single golden coin is engraved with a large percent sign.
add('j_to_the_moon',c(59,70,37,G)+c(59,70,30,'none',Y,3)+p('M42 90L76 49','none',V,7)+c(45,54,8,T)+c(73,86,8,K)+c(45,54,3,P)+c(73,86,3,P));
// 085 — One unexpected spirit emerges from one opened packet.
add('j_hallucination',p('M27 74L59 62L92 74V101L59 112L27 101Z',O)+p('M27 74L59 86L92 74M59 86V112','none',V,2)+p('M38 79V49Q37 29 59 29Q81 29 80 49V80L69 71L59 80L49 71Z',K)+e(51,47,3,5,I)+e(68,47,3,5,I)+p('M50 60Q59 68 69 58','none',Y,3));
// 086 — One seasoned crystal ball keeps a ring of accumulated reading marks.
add('j_fortune_teller',c(59,64,31,B)+c(59,64,24,T)+p('M42 44Q57 34 74 47','none',P,3)+p('M37 86L59 71L81 86L76 106H42Z',V)+p('M47 95V102M55 95V102M63 95V102M71 95V102','none',Y,2)+star(59,60,.55,K));
// 087 — One six-fingered glove makes room for the extra card without showing cards.
add('j_juggler',p('M37 110L34 90L23 75Q20 68 27 65L39 75V47Q40 40 45 44L48 68V34Q51 28 56 34L57 66V31Q61 25 65 31L66 66V36Q71 29 75 36L76 70V46Q81 39 85 46L84 88L76 110Z',T)+p('M45 84Q59 77 75 84','none',K,4)+p('M45 103H74','none',Y,5));
// 088 — One red discard basket carries its spare-use badge.
add('j_drunkard',p('M28 49L36 111H82L91 49Z',R)+e(59,49,32,9,V)+p('M41 62L46 98M59 62V100M78 62L73 98','none',K,4)+c(59,78,17,B)+t(59,84,'+1',16,Y));
// 089 — One rock block reveals its blue chip-bearing core.
add('j_stone',p('M24 107L18 63L37 34L77 29L97 54L93 108Z',V)+p('M20 63L46 76L77 31M46 76L43 108M78 58L94 55','none',B,4)+p('M53 92L48 63L62 46L78 65L73 94Z',T)+p('M61 53V86','none',Y,3));
// 090 — One salary envelope bears its four-dollar payday.
add('j_golden',p('M24 48H94V101H24Z',K)+p('M24 48L59 76L94 48M24 101L48 67M94 101L70 67','none',V,3)+c(59,78,18,G)+t(59,85,'$4',19,I));
// 091 — One lucky cat raises its lucky paw as its fortune grows.
add('j_lucky_cat',p('M36 107Q26 86 39 68L37 34L53 44Q61 39 73 44L88 33L85 69Q99 85 87 108Z',G)+p('M38 78Q15 63 22 91L29 101H43M82 80L92 58L101 65L94 98L82 105',Y)+p('M45 55L52 51M73 51L80 55M54 66L61 72L68 66M50 81Q61 90 74 80','none',I,2)+p('M48 98H75','none',V,6)+c(61,55,4,T));
// 092 — A joined pair of uncommon jesters strengthens a shared collar.
add('j_baseball',g(39,63,1.15,face(0,0,1,'J',T))+g(80,63,1.15,face(0,0,1,'J',K))+p('M24 92Q59 113 95 92L89 109Q59 121 30 109Z',V)+p('M31 101Q58 114 88 101','none',Y,4));
// 093 — A single capital bull carries its wealth as a golden brow mark.
add('j_bull',p('M29 51Q59 28 89 51L82 86L67 110H49L35 87Z',V)+p('M31 59Q12 55 18 31Q22 44 39 43ZM80 44Q98 42 101 29Q110 53 87 61Z',Y)+p('M39 63L48 68M72 68L81 63','none',I,4)+e(59,91,18,11,K)+p('M50 90V94M67 90V94','none',I,3)+c(59,50,10,T)+t(59,56,'$',16,P));
// 094 — A joined double reward tag clearly duplicates the same prize.
add('j_diet_cola',g(44,72,1.15,p('M-21 -28H12L24 -13V28H-21Z',V)+c(12,-13,3,P)+star(0,5,.55,Y),-10)+g(75,72,1.15,p('M-21 -28H12L24 -13V28H-21Z',K)+c(12,-13,3,P)+star(0,5,.55,Y),10));
// 095 — One hand trades a single golden three-dollar coin.
add('j_trading',p('M24 90L39 78L49 83L43 69Q41 62 48 62L64 77L85 70Q94 68 96 75L82 88L92 84Q101 85 94 93L76 105H44L32 113Z',T)+p('M46 90L60 94L78 84','none',V,4)+c(59,48,18,G)+t(59,55,'3',23,I)+p('M28 93L42 109','none',K,5));
// 096 — A single bright reroll crank feeds its own multiplier wheel.
add('j_flash',c(54,70,33,V)+c(54,70,25,T)+p('M54 45V95M29 70H79','none',Y,5)+c(54,70,10,O)+p('M86 74H96V43','none',R,7)+c(96,38,8,K)+p('M44 66L54 57L64 66M54 59V81','none',P,2));
// 097 — One compact popcorn portion visibly has less left to eat.
add('j_popcorn',p('M29 55H90L80 111H39Z',K)+p('M37 55L46 111M53 55L58 111M70 55L69 111M83 55L76 111','none',R,6)+p('M30 55Q23 42 35 39Q34 26 47 32Q57 18 65 33Q81 22 84 38Q99 40 89 55Z',Y)+p('M36 43Q44 37 50 44M61 40Q70 33 78 41','none',P,3));
// 098 — One pair of trousers keeps two matching savings in its pockets.
add('j_trousers',p('M31 32H88L84 109H63L59 72L55 109H34Z',V)+p('M32 47H87M59 47V70','none',T,4)+p('M35 51L42 70L53 64M65 64L77 70L84 51','none',K,5)+coin(43,61,.88)+coin(75,61,.88)+r(52,33,14,11,Y,2));
// 099 — One chosen suit wears a small golden crown, with no surrounding ornaments.
add('j_ancient',suit('d',59,73,2.5,T)+p('M59 38L59 108L42 73Z',B)+crown(59,32,1.05,Y)+p('M59 48L71 72L59 95L47 72Z','none',P,2));
// 100 — One ramen bowl carefully retains its noodles as a single drop threatens to spill.
add('j_ramen',p('M22 65Q26 109 59 109Q91 108 96 65Z',B)+e(59,65,37,11,O)+p('M31 64Q42 52 51 64Q60 76 70 63Q80 53 87 63M32 70Q47 59 60 71Q72 79 86 67','none',Y,3)+p('M31 86Q59 103 87 86','none',T,4)+p('M95 71Q106 84 99 91Q92 86 95 71Z',Y));

const simpleLastFace=(x,y,s=1,robe=V,crownColor=Y)=>g(x,y,s,p('M-23 35L-19 3H19L23 35Z',robe)+c(0,-10,17,P)+crown(0,-32,.94,crownColor)+p('M-8 -12H-5M5 -12H8M-7 -2Q0 4 7 -2','none',I,2)+p('M-13 7L0 26L13 7',T));
const simpleLastFork=(x,y,s=1,color=T)=>g(x,y,s,p('M-12 -29V-2Q-12 13 0 13Q12 13 12 -2V-29M0 13V40','none',color,7)+p('M-10 -26V-7M10 -26V-7','none',P,1.5));
// 101 — One field radio: its two tuning knobs are the four and ten that earn points.
add('j_walkie_talkie',r(25,39,68,74,T,7)+p('M36 39V25','none',Y,6)+r(33,47,52,22,V,3)+p('M40 54H78M40 61H78','none',S,2)+c(44,91,13,O)+c(75,91,13,K)+t(44,97,'4',18,P)+t(75,96,'10',14,P)+r(44,109,30,5,B,1));
// 102 — One ten-dose siphon; a bold loop on the bottle marks repeated activation.
add('j_selzer',p('M36 48V39H72V48Q87 59 87 81V103Q87 113 59 113Q31 113 31 103V81Q31 60 36 48Z',T)+r(34,33,40,10,V,2)+p('M51 33V26H79L88 39H74','none',O,5)+r(41,64,36,36,B,7)+t(59,89,'10',22,P)+p('M45 101Q60 113 76 99M75 96L79 98L78 103','none',Y,3));
// 103 — One fortress with a suit-shaped collecting window.
add('j_castle',p('M22 110V45H17V31H29V41H40V31H51V45H45V65H73V45H67V31H78V41H89V31H101V45H95V110Z',B)+r(45,65,28,45,V,1)+p('M50 110V91Q59 77 68 91V110Z',I)+c(59,61,15,Y)+suit('s',59,61,.73,T)+p('M24 75H41M77 91H93','none',S,2));
// 104 — A single smiling courtier gives approval; the five is an embroidered reward.
add('j_smiley',simpleLastFace(59,76,1.04,K,Y)+p('M49 72Q59 85 70 72','none',R,3)+c(59,100,9,B)+t(59,104,'5',12,P));
// 105 — One sale tag is burning: selling feeds the multiplier fire.
add('j_campfire',g(59,73,1,p('M-25 -33H13L30 -16V32H-25Z',Y)+c(14,-18,4,V)+t(-3,4,'$',28,I)+p('M-28 35Q-36 14 -20 1Q-24 19 -11 14L1 -2Q0 18 12 14Q28 8 25 -5Q43 22 25 39Z',R)+p('M-10 36Q-17 23 -5 15Q-6 25 4 23L11 15Q20 30 9 37Z',O)));
// 106 — One gold cash register; the display is the four-dollar gold-card payout.
add('j_ticket',r(25,59,68,48,O,5)+r(33,33,52,26,V,3)+r(39,39,40,15,Y,1)+t(59,51,'4',16,I)+r(33,68,52,22,T,2)+p('M42 70V87M53 70V87M65 70V87M76 70V87','none',P,3)+r(35,98,48,7,B,1));
// 107 — A life-saving skull whose right eye contains a visibly filled quarter.
add('j_mr_bones',p('M37 89Q24 78 27 58Q31 30 59 30Q88 30 91 58Q94 78 81 89V107H37Z',P)+c(44,63,9,I)+c(74,63,10,V)+p('M74 63V53A10 10 0 0 1 84 63Z',T)+p('M59 74L53 85H65Z',O)+r(43,91,32,16,Y,3)+p('M51 93V105M59 93V105M67 93V105','none',I,2)+p('M42 40Q58 32 75 40','none',R,3));
// 108 — One acrobat commits to a final leap; three is stitched on the leotard.
add('j_acrobat',g(59,69,1,p('M-20 24L-4 7L8 16L23 4','none',B,6)+p('M-4 -12L9 -3L2 13L-13 5Z',K)+c(4,-24,8,P)+p('M-7 -10L-26 -19L-29 -32M8 -5L25 -20L31 -13','none',T,6)+p('M-16 27L-30 29M23 4L30 10','none',O,5)+t(-2,5,'3',10,Y),-25));
// 109 — A pair of matching theatre masks forms an encore, without extra stage props.
add('j_sock_and_buskin',g(74,67,1.17,mask(0,0,1,V),12)+g(45,80,1.25,mask(0,0,1,Y,true),-12));
// 110 — A shared treasure bowl, held from both sides: the team's value becomes one share.
add('j_swashbuckler',p('M22 61L34 47L47 58L40 73M96 61L84 47L71 58L78 73',P)+p('M27 71Q59 60 91 71L84 102Q59 115 34 102Z',O)+e(59,70,32,10,Y)+coin(48,66,.8)+coin(69,65,.8)+p('M36 86Q59 96 82 86','none',V,5));
// 111 — One broad concertina fan opens extra choices; its two wide wings do the work.
add('j_troubadour',p('M59 111L17 53Q30 27 59 43Q88 27 101 53Z',K)+p('M59 111L34 43Q45 34 59 43Q74 34 84 43Z',Y)+p('M59 111L48 41Q59 36 70 41Z',T)+p('M59 111L17 53M59 111L34 43M59 111V42M59 111L84 43M59 111L101 53','none',V,3)+c(59,108,6,O));
// 112 — One stamp lands on its own seal: the added card arrives already stamped.
add('j_certificate',p('M42 65V53Q28 43 41 32Q59 18 78 32Q91 43 76 53V65Z',R)+r(32,64,54,15,V,3)+p('M27 80H91L96 101H22Z',Y)+seal(59,99,.42,B)+p('M37 88H80','none',O,3));
// 113 — One broad paintbrush unites two inks, each half containing its matching suit pair.
add('j_smeared',p('M49 71L52 110H67L70 71Z',V)+r(40,61,38,13,Y,1)+p('M24 28H59V61H40Z',R)+p('M59 28H94L78 61H59Z',B)+suit('h',40,42,.36,P)+suit('d',48,53,.31,P)+suit('s',74,41,.34,P)+suit('c',68,53,.3,P));
// 114 — One flowing route goes around a single blocking mountain.
add('j_throwback',p('M40 87L60 44L80 87Z',V)+p('M59 45L51 64L61 60L69 65Z',S)+p('M24 110Q86 112 94 81Q107 33 77 29Q34 18 23 49','none',R,11)+p('M24 110Q86 112 94 81Q107 33 77 29Q34 18 23 49','none',Y,2)+p('M17 42L23 51L32 44',O));
// 115 — One rubber stamp leaves three impressions of the same first hand.
add('j_hanging_chad',g(42,48,1,p('M-12 13V1Q-24 -7 -14 -17Q0 -29 14 -17Q24 -7 12 1V13Z',O)+r(-22,12,44,12,V,1),-18)+[0,1,2].map(i=>g(40+i*18,78+i*12,.63,p('M-16 20V-6Q-15 -13 -9 -7L-3 0V-14Q-2 -20 3 -15L7 0L12 -8Q18 -13 18 -4V12L8 23Z',[T,K,Y][i]))).join(''));
// 116 — A single faceted diamond carries an inset gold coin: diamonds pay money.
add('j_rough_gem',p('M34 35H84L103 61L59 111L15 61Z',K)+p('M34 35L44 61L59 111L74 61L84 35M15 61H103M44 61L59 35L74 61','none',Y,2)+coin(59,67,1.05)+p('M21 61L43 62M76 62H97','none',P,2));
// 117 — One ruby heart holds a coin-toss division: a heart's multiplier is a chance.
add('j_bloodstone',suit('h',59,73,2.9,K)+p('M59 39L59 105L42 86L34 60Z',R)+p('M59 43L80 57L59 103L39 58Z','none',P,2)+c(59,69,12,V)+p('M59 57A12 12 0 0 1 59 81Z',Y)+p('M59 58V80','none',I,1.5));
// 118 — One spade-shaped treasure shovel uncovers a blue chip.
add('j_arrowhead',p('M54 77H64V109H54Z',O)+suit('s',59,60,2,V)+p('M59 29V68L45 58','none',P,2)+chips(59,105,2,1.05)+p('M50 84H68','none',Y,4));
// 119 — One seven-leaf clover, with exactly seven leaves on the same stem.
add('j_onyx_agate',p('M59 74V111M59 93L46 83','none',T,5)+[0,1,2,3,4,5,6].map(i=>g(59,63,1,e(0,-21,9,17,i%2?L:T),i*360/7)).join('')+c(59,63,11,Y)+t(59,68,'7',14,V));
// 120 — One cracked glass arrow grows upwards, fed by its own fractured base.
add('j_glass',p('M59 28L88 57H73L79 110H38L45 57H30Z',B)+p('M59 28V103L46 84L63 75L49 63L67 51','none',S,2.5)+p('M38 110L48 94L60 106L70 94L79 110Z',K)+p('M48 95L48 109M70 95L66 110','none',Y,2));
// 121 — One double-headed printing roller repeats the same face twice.
add('j_ring_master',r(26,39,67,53,V,9)+r(33,45,53,41,T,6)+[47,72].map(x=>g(x,65,.62,mask(0,0,1,Y))).join('')+p('M28 65H20V99H58V113','none',O,6)+r(48,104,20,10,R,3));
// 122 — A single four-petal flower bears the four different suits.
add('j_flower_pot',p('M59 79V111M59 98L39 88M59 98L79 88','none',T,4)+[[59,41,R,'h'],[82,64,Y,'d'],[59,87,S,'s'],[36,64,L,'c']].map(([x,y,col,s])=>c(x,y,19,col)+suit(s,x,y,.6,s==='h'?P:V)).join('')+c(59,64,12,O));
// 123 — One blueprint panel's right hand casts a matching solid hand to its left.
add('j_blueprint',r(24,29,70,83,B,3)+p('M59 30V111M26 72H92','none',T,1)+g(74,67,.72,p('M-12 25V-8Q-11 -15 -6 -10L0 -1V-24Q1 -31 6 -24V-1L12 -10Q18 -14 18 -6V11L9 25Z',Y))+g(42,69,.72,p('M-12 25V-8Q-11 -15 -6 -10L0 -1V-24Q1 -31 6 -24V-1L12 -10Q18 -14 18 -6V11L9 25Z','none',P,2))+p('M67 98H43L49 92M43 98L49 104','none',K,3));
// 124 — A single two-shaped shoot grows its blue chip-shaped leaves.
add('j_wee',p('M30 47Q40 22 65 29Q93 35 83 58Q77 71 49 91L37 106H89','none',B,12)+p('M35 44Q43 27 62 31','none',P,2)+p('M73 65Q73 45 94 44Q96 63 73 65Z',L)+p('M48 91Q29 93 23 76Q43 69 48 91Z',T)+p('M36 105H89','none',V,4));
// 125 — One oversized jester glove folds three fingers into the discard basket shape.
add('j_merry_andy',p('M34 108V82L22 63Q19 56 25 53L40 65V37Q41 29 47 35L51 61V30Q53 23 59 30L61 61L66 36Q70 29 75 35L73 65L83 52Q89 48 93 54L88 82L75 108Z',T)+p('M42 79Q59 69 78 79','none',V,3)+r(33,100,43,12,K,2)+t(56,91,'3',18,Y));
// 126 — One loaded die: two golden pips stand out against the blue possibilities.
add('j_oops',g(59,70,1.5,r(-23,-23,46,46,V,6)+c(-10,-10,5,Y)+c(10,10,5,Y)+c(10,-10,4,B)+c(-10,10,4,B)+p('M-15 -18H11M18 -12V12','none',P,2),-16));
// 127 — A single dart meets the exact centre of a heart target.
add('j_idol',c(56,73,35,V)+c(56,73,27,Y)+c(56,73,19,R)+suit('h',56,73,.75,P)+p('M92 36L61 68','none',I,4)+p('M89 40L92 27L102 32L99 44Z',T)+p('M64 64L58 73L67 69Z',O));
// 128 — One interlocking emblem joins a club with another suit.
add('j_seeing_double',suit('c',43,66,1.7,T)+suit('h',77,74,1.8,K)+p('M44 76L61 91L78 77','none',Y,6)+p('M44 76L61 91L78 77','none',I,1.4));
// 129 — One matador cape is paid for the bull's obstruction; eight is sewn into the cloth.
add('j_matador',p('M31 32L49 27L83 42L96 91L66 112L38 94L27 54Z',R)+p('M44 39L67 93L84 88','none',K,6)+p('M35 57L20 49L15 59L27 73L39 71Z',V)+p('M20 49L17 37Q24 42 28 51','none',Y,3)+t(69,80,'8',23,Y));
// 130 — One departing jester with a suitcase embodies discarded valets.
add('j_hit_the_road',g(59,70,1.05,c(0,-21,12,P)+p('M-14 -28L-18 -43L0 -36L15 -43L17 -27Z',V)+p('M-14 -4H10L17 25L-11 28Z',R)+p('M-8 26L-17 42M9 26L22 38M-11 4L-25 15','none',I,5)+p('M8 3L23 12','none',T,5)+r(17,11,23,24,O,3)+p('M23 11V5H34V11','none',Y,3)));
// 131 — Two equal tuning forks join one base: the pair resonates together.
add('j_duo',simpleLastFork(40,64,.82,T)+simpleLastFork(78,64,.82,V)+p('M40 97H78','none',O,7));
// 132 — A three-bell cluster on one common handle signals the triple resonance.
add('j_trio',p('M59 29V46M28 54Q59 30 90 54','none',V,6)+[[29,72,.85,T],[59,66,1,K],[89,72,.85,O]].map(([x,y,s,col])=>g(x,y,s,p('M-14 9Q-10 1 -10 -13Q0 -27 10 -13Q10 1 14 9Z',col)+e(0,9,14,4,Y)+c(0,17,4,V))).join(''));
// 133 — One four-towered fortress, a solid square of strength.
add('j_family',p('M27 35H43V48H75V35H91V51H80V82H91V100H75V88H43V100H27V82H38V51H27Z',R)+r(42,49,34,37,V,1)+[[32,43],[86,43],[32,91],[86,91]].map(([x,y])=>g(x,y,.72,p('M-13 -12H-5V-3H5V-12H13V3H9V17H-9V3H-13Z',Y))).join('')+p('M50 59H68V77H50Z',T));
// 134 — Five coloured chain links pull in one uninterrupted straight run.
add('j_order',g(54,72,.88,[0,1,2,3,4].map(i=>r(-44+i*18,-15,29,30,[R,O,Y,T,V][i],12,I,3)+r(-37+i*18,-8,15,16,'none',6,P,1)).join(''),-22));
// 135 — Five matching clubs grow from a single resonance stem.
add('j_tribe',p('M59 105V69M59 83L26 57M59 74L42 42M59 74L76 42M59 83L93 57','none',V,4)+[[26,57],[42,40],[59,33],[76,40],[93,57]].map(([x,y])=>suit('c',x,y,.73,T)).join('')+p('M46 103H72','none',Y,5));
// 136 — One compact performer supports a disproportionately large chip stack.
add('j_stuntman',g(59,69,.86,g(-59,-64,1,c(59,103,11,V)+c(59,103,7,T)+p('M59 92V80M47 80H69','none',Y,4)+p('M45 69L36 83L51 89L60 79L72 86','none',O,5)+p('M45 58L64 55L70 73L49 78Z',K)+c(55,48,8,P)+p('M47 60L33 53L34 42M63 60L80 52L81 41','none',T,5)+chips(59,37,3,1.25))));
// 137 — One ghost wears a clock on its body: its twin is delayed for two rounds.
add('j_invisible',p('M29 110V59Q26 31 58 29Q90 27 89 59V110L78 102L67 112L56 103L44 112Z',T)+p('M40 51Q45 43 50 50M67 50Q72 43 78 51','none',V,3)+c(59,78,19,Y)+p('M59 78V64M59 78L70 84','none',I,3)+t(59,102,'2',13,B));
// 138 — One folding mirror repeats the leftmost face to its right.
add('j_brainstorm',p('M20 38L58 29V105L20 112ZM58 29L98 38V112L58 105Z',V)+p('M25 43L53 36V99L25 104ZM64 36L92 43V104L64 99Z',T)+g(40,68,.62,mask(0,0,1,Y))+g(78,68,.62,mask(0,0,1,S))+p('M82 101H35L43 94M35 101L43 108','none',O,3));
// 139 — A single ringed planet is a gold rent coin.
add('j_satellite',c(59,70,30,V)+p('M45 43Q29 65 48 94','none',K,5)+e(59,70,45,12,'none',Y,7)+e(59,70,45,12,'none',I,1.5)+coin(59,69,1.35));
// 140 — One thoughtful queen keeps thirteen in reserve on her brooch.
add('j_shoot_the_moon',simpleLastFace(59,72,1.05,K,Y)+p('M44 80L55 65L66 69','none',P,7)+c(59,101,10,V)+t(59,106,'13',12,Y));
// 141 — One licence badge needs sixteen endorsements; the threshold is clear at a glance.
add('j_drivers_license',g(59,74,1,r(-42,-36,84,72,T,6)+r(-35,-28,24,36,V,3)+c(-23,-15,7,P)+p('M-32 4L-30 -4H-17L-14 4Z',K)+t(18,7,'16',29,Y)+p('M-32 20H30M-32 27H14','none',B,3),-7));
// 142 — One hooded seer presents the omen before the blind begins.
add('j_cartomancer',p('M27 111L35 62L59 28L83 62L91 111Z',V)+p('M40 61L59 36L78 61Z',K)+c(59,63,12,P)+p('M51 63H55M63 63H67','none',I,2)+p('M39 86L47 94M79 86L71 94','none',P,7)+c(59,96,17,T)+star(59,96,.48,Y));
// 143 — One gift's lid is a ringed planet: celestial goods cost nothing.
add('j_astronomer',p('M29 67L59 57L89 67V104L59 114L29 104Z',V)+p('M59 77V113M29 67L59 77L89 67','none',I,2)+p('M52 60V110M66 61V111','none',Y,4)+c(59,45,21,T)+e(59,45,34,7,'none',O,5)+t(59,94,'0',22,P));
// 144 — One rising phoenix, with a folded-paper wing, turns a discard into a lesson.
add('j_burnt',p('M30 106L43 82Q23 73 19 49Q45 55 54 69Q54 35 74 33Q91 31 92 45L101 49L88 55Q74 53 71 76Q84 64 99 65Q95 88 70 98L73 112L60 104L47 112L50 99Z',R)+p('M25 56L50 82L41 62L55 75M92 71L71 88L83 84','none',Y,3)+p('M54 103L60 87L66 104Z',K)+c(83,42,2,I));
// 145 — One abacus converts each five gold beads into two red multiplier beads.
add('j_bootstraps',r(19,38,80,65,V,4)+p('M24 56H94M24 85H94','none',Y,3)+[31,45,59,73,87].map(x=>e(x,56,5,10,O)).join('')+e(48,85,8,12,R)+e(72,85,8,12,K)+p('M20 104H98','none',T,6));
// 146 — One fallen court mask wears its own broken crown; no separate trophies.
add('j_caino',g(59,68,.91,g(-59,-70,1,p('M32 50Q59 38 86 50L82 91Q75 110 59 117Q43 110 36 91Z',K)+g(59,41,1.35,crownBroken(0,0,1))+p('M43 70L50 75M68 75L75 69M47 98Q59 88 71 98M59 72L55 86H62','none',I,2.5)+p('M37 54L43 59','none',R,3))));
// 147 — The king and queen are one close royal pair, their two crowns unmistakable.
add('j_triboulet',simpleLastFace(39,75,.88,B,Y)+simpleLastFace(79,75,.88,K,O)+p('M42 104Q59 95 77 104','none',T,7));
// 148 — One jester skull has the twenty-three counter engraved into its forehead.
add('j_yorick',p('M36 94Q22 85 24 63Q24 35 59 35Q94 35 94 63Q97 83 82 94V111H36Z',P)+p('M30 45L24 27L45 33L59 23L74 33L95 27L88 45Z',R)+t(59,57,'23',17,V)+e(44,73,7,9,I)+e(74,73,7,9,I)+p('M59 79L52 91H66Z',O)+r(42,97,34,12,Y,2)+p('M50 98V108M59 98V108M68 98V108','none',I,2));
// 149 — One broken boss crown: authority itself is disabled.
add('j_chicot',g(59,75,1.8,p('M-22 -16L-16 15H-3L-6 6L-1 -1L-5 -13L-13 -7Z',V)+p('M3 16H17L23 -15L12 -7L8 -18L5 -6L8 3L3 8Z',T)+p('M-16 15H-3M3 16H17','none',Y,5)));
// 150 — A single bright flask casts an identical dark flask: the negative consumable twin.
add('j_perkeo',g(72,69,1.12,p('M-8 -28H8V-13L23 16Q22 33 0 33Q-22 33 -23 16L-8 -13Z',I)+p('M-15 13Q0 6 15 13L17 23Q0 34 -17 23Z',V))+g(45,76,1.12,p('M-8 -28H8V-13L23 16Q22 33 0 33Q-22 33 -23 16L-8 -13Z',T)+p('M-15 13Q0 6 15 13L17 23Q0 34 -17 23Z',L)+p('M-11 -5L-16 11','none',P,3)+r(-11,-30,22,6,Y,1)));

const escapeXml=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
export function jokerArtworkSvg(id){
  if(!Object.hasOwn(JOKER_SCENES,id))return null;
  const identity=JOKER_IDENTITIES[id],scene=JOKER_SCENES[id];
  const [background]=GROUNDS[JOKER_BACKDROPS[id]];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118 158" preserveAspectRatio="none" data-joker-id="${escapeXml(id)}" aria-hidden="true"><title>${escapeXml(identity.name)}</title><rect width="118" height="158" fill="${background}"/><g stroke-linecap="round" stroke-linejoin="round">${scene}</g></svg>`;
}
