import {JOKER_IDENTITIES} from '../content/joker-identities.js';
import {P,I,R,B,G,S,V,T,O,Y,L,K,group as g,path as p,rect as r,circle as c,ellipse as e,line as l,text as t,hatch as h,rays,spark,star,suit,card,cards,coin,chips,token,flame,crown,face,portrait,mask,palm,basket,arrow,arrowHead,ground,seal,tarot,box,press,gear,banana,die,person,price,crownBroken} from './joker-art-primitives.js';
// Each numbered plate is composed individually, revised after the user asked for more colour and fewer playing-card pictures.
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

// 001 — A blazing carnival multiplication sign, with hot orange bevels and a turquoise pedestal.
add('j_joker',c(59,65,38,V)+rays(59,65,39,10,Y)+p('M30 39L59 66L87 38L99 51L72 78L94 101L81 113L59 91L36 114L23 101L46 78L19 51Z',O)+p('M31 43L59 71L87 43L92 50L65 78L87 101L81 106L59 84L36 107L30 101L52 78L25 51Z',R)+p('M31 47L55 72M73 93L81 101','none',Y,3)+flame(36,40,.59)+spark(27,29,.38,Y)+r(29,118,61,7,T,2)+c(96,33,3,K)+c(20,91,3,B));
// 002 — A faceted sun-hot diamond held over the open jaws of a turquoise forge.
add('j_greedy_joker',p('M19 100L27 81H91L100 100V119H19Z',V)+p('M29 101Q59 83 90 101V119H29Z',I)+flame(59,96,.9)+flame(59,58,1.25)+p('M59 28L83 60L59 93L35 60Z',Y)+p('M59 28L59 93L35 60Z',O)+p('M59 28L70 60L59 93L48 60Z',G)+p('M36 60H82M59 31L48 60L59 90L70 60Z','none',P,1.5)+p('M39 71L24 78L75 119M79 71L94 78L45 119','none',T,6)+c(59,97,5,S)+spark(25,43,.4,K)+spark(95,37,.32,Y));
// 003 — A vivid heart pumps across a blue instrument wave, with gold valves and pink vessels.
add('j_lusty_joker',p('M45 43L40 27L50 24L56 42M65 42L68 25L80 30L71 48',K)+c(28,45,9,T)+c(91,94,12,V)+suit('h',59,73,2.65,R)+p('M25 54Q32 36 47 45M76 49Q86 50 88 60','none',K,5)+p('M15 78H35L43 64L51 94L62 49L71 80L79 70H104','none',Y,5)+p('M17 78H35L43 64L51 94L62 49L71 80L79 70H102','none',I,1.2)+e(59,118,30,5,B)+p('M43 105L48 110M70 105L65 112','none',P,1.5)+rays(90,37,8,6,Y));
// 004 — A luminous spearhead above red and violet silk pennants, hammered sparks flying.
add('j_wrathful_joker',p('M49 74L39 98L17 109L30 81Z',K)+p('M66 72L79 88L101 87L88 110L70 96Z',V)+p('M54 67H64L65 119H53Z',O)+p('M59 25L80 61L70 77L59 69L48 77L38 61Z',B)+p('M59 25L59 69L48 77L38 61Z',T)+p('M59 30V65M59 44L71 60M59 53L48 65','none',P,2)+r(48,76,22,8,Y,2)+[91,101,111].map(y=>l(54,y,64,y,I,1.3)).join('')+spark(25,43,.5,Y)+spark(94,49,.4,O)+spark(88,72,.22,K)+e(59,123,27,3,V));
// 005 — A lush clover tree grows blue and pink seed pods from a violet ceramic pot.
add('j_gluttenous_joker',p('M39 96H80L75 121H44Z',V)+p('M43 101H76M48 111H72','none',K,3)+p('M59 99V59M59 80Q30 77 23 54M59 77Q82 73 95 49','none',I,4)+suit('c',59,56,1.9,L)+p('M26 61Q9 45 25 35Q44 41 26 61Z',T)+p('M92 54Q76 35 94 29Q111 40 92 54Z',K)+p('M57 35Q42 21 57 20Q72 22 57 35Z',Y)+p('M28 54L25 42M94 47L95 36M59 56V80','none',P,2)+c(42,88,5,O)+c(82,91,5,B)+e(60,124,31,3,T));
// 006 — Two matching fire spirits leap out of a blue brazier and clasp hands.
add('j_jolly',p('M25 98H94L84 118H35Z',B)+p('M35 106H83','none',T,4)+p('M38 98L26 79Q15 58 32 45L39 26L45 49Q65 65 49 92Z',R)+p('M78 98L65 79Q55 58 72 45L79 26L85 49Q105 65 89 92Z',O)+p('M36 79Q27 67 39 53Q53 68 44 80Z',Y)+p('M76 79Q67 67 79 53Q93 68 84 80Z',Y)+c(35,68,2,I)+c(44,68,2,I)+c(75,68,2,I)+c(84,68,2,I)+p('M34 75Q39 79 45 74M74 75Q79 79 85 74M48 85Q59 94 69 84','none',I,2)+spark(59,43,.37,K)+c(20,101,4,V)+c(99,113,4,T));
// 007 — Three cheerful flames burn in an ornate violet three-armed candelabrum.
add('j_zany',p('M59 74V111M31 87Q59 103 87 87M31 87V74M87 87V74','none',V,8)+p('M59 77V111M33 88Q59 100 85 88','none',K,2)+r(42,111,34,9,B,3)+e(59,122,28,4,T)+[[30,55,.68],[59,42,.8],[88,55,.68]].map(([x,y,s])=>g(x,y,s,p('M0 -25C-4 -10 -24 1 -17 17Q0 37 18 17C27 2 7 -8 0 -25Z',O)+p('M0 -11Q-16 7 0 22Q16 7 0 -11Z',Y)+c(-5,6,2,I)+c(5,6,2,I)+p('M-4 13Q0 17 5 12','none',R,2))).join('')+spark(18,32,.3,K)+spark(101,87,.3,Y));
// 008 — Two pairs of theatre masks sing across one flowing vermilion ribbon.
add('j_mad',p('M17 29Q58 20 101 29V37Q59 28 17 38Z',Y)+g(33,52,.67,mask(0,0,1,T),-9)+g(81,52,.67,mask(0,0,1,T),9)+g(33,92,.62,mask(0,0,1,K),-9)+g(81,92,.62,mask(0,0,1,K),9)+p('M14 110Q55 102 103 111L98 120Q54 112 20 123Z',R)+p('M24 115Q58 107 94 115','none',Y,2)+p('M52 112L46 124L59 119L72 124L69 112Z',V)+c(60,114,5,O)+p('M18 80L13 78V66L22 63V75M98 84V74L106 71V81','none',B,2));
// 009 — An orange racing locomotive rockets up five blue and turquoise steps.
add('j_crazy',[0,1,2,3,4].map(i=>r(15+i*17,103-i*13,18,19+i*13,[B,T,V,K,L][i],1)+t(24+i*17,116-i*13,i+2,10,P)).join('')+g(60,63,1,p('M-26 -8H8L17 5H30V22H-26Z',O)+r(-12,-27,24,24,R,2)+r(-7,-22,14,14,Y,1)+r(18,-23,8,25,V,1)+c(-12,23,8,I)+c(18,23,8,I)+c(-12,23,3,S)+c(18,23,3,S),-34)+p('M71 30Q83 16 98 29Q103 37 94 39Q76 41 71 30Z',K)+p('M19 79L35 69M16 91L33 81','none',Y,3)+spark(94,53,.3,Y));
// 010 — Five hearts join a golden starburst, surrounded by a blue ribbon of unity.
add('j_droll',p('M25 38Q59 20 94 42L103 85Q60 121 16 86Z',B)+star(59,71,1.72,Y)+star(59,71,1.38,O)+[[59,45],[83,64],[74,93],[44,93],[35,64]].map(([x,y],i)=>suit('h',x,y,.64,[K,R,K,R,K][i])).join('')+c(59,71,12,T)+p('M52 71L58 77L67 64','none',P,3)+p('M21 104Q59 118 100 103L94 119Q59 130 27 118Z',V)+p('M29 110Q59 121 92 110','none',K,2));
// 011 — Two jewel-blue owls guard a shared reserve of chips beneath a gold moon.
add('j_sly',c(59,40,16,Y)+[[36,72],[80,72]].map(([x,y],i)=>g(x,y,1,p('M-17 -25L-7 -19L7 -19L17 -25L18 14Q0 34 -18 14Z',i?T:B)+p('M-15 -10Q0 -21 15 -10V7Q0 21 -15 7Z',S)+c(-7,-1,6,P)+c(7,-1,6,P)+c(-7,-1,2,I)+c(7,-1,2,I)+p('M-4 7L0 13L4 7Z',O)+p('M-14 14L-8 20M14 14L8 20','none',V,2))).join('')+chips(36,117,3,.83)+chips(80,117,3,.83)+p('M24 106L43 106M71 106H91','none',K,4)+star(21,37,.25,K)+star(98,38,.26,O));
// 012 — Three cobalt treasure jars emerge from a pink and gold chest.
add('j_wily',p('M18 80L20 44Q59 22 99 44L101 80Z',K)+p('M24 76L26 47Q59 31 93 47L95 76Z',V)+[32,59,86].map((x,i)=>g(x,64,.83,p('M-8 -20H8V-11Q21 3 14 18Q0 29 -14 18Q-21 3 -8 -11Z',[B,T,B][i])+r(-9,-24,18,6,Y,1)+suit('d',0,5,.42,Y)+p('M-11 -3Q-16 10 -8 16','none',P,1.4))).join('')+r(18,83,83,34,O,3)+r(23,88,73,24,G,1)+chips(37,103,2,.65)+chips(82,103,2,.65)+r(52,89,15,25,V,2)+c(59,100,3,Y)+e(59,123,42,3,B));
// 013 — Paired blue and turquoise towers share a double treasury and red pennants.
add('j_clever',p('M19 61V43H28V33H37V43H45V61Z',K)+p('M70 61V43H79V33H88V43H97V61Z',O)+r(22,61,20,49,B,1)+r(74,61,20,49,T,1)+p('M22 74H42M22 88H42M74 74H94M74 88H94','none',P,1.3)+p('M25 61V49H39V61M77 61V49H91V61',V)+p('M32 33V23L47 27L32 31M84 33V23L99 27L84 31',R)+chips(34,120,5,.8)+chips(85,120,5,.8)+p('M42 105Q59 93 74 105','none',Y,6)+coin(59,101,.8));
// 014 — A bright ascending stone stair winds around a river of blue chips.
add('j_devious',p('M16 114Q35 79 53 86Q76 97 103 59V123H16Z',T)+p('M18 113Q40 86 57 98Q79 109 102 83','none',B,5)+[0,1,2,3,4].map(i=>r(17+i*18,94-i*13,18,18,[O,Y,K,V,L][i],1)+t(26+i*18,107-i*13,i+2,11,I)+chips(25+i*18,121,1+i,.48)).join('')+p('M17 83Q57 56 88 31','none',P,2)+star(95,27,.35,Y)+rays(95,27,11,6,O));
// 015 — A blue rosette blooms with five turquoise clover heads and satin violet ribbons.
add('j_crafty',p('M39 92L29 123L48 116L58 125L67 93M66 94L76 124L86 113L103 116L85 86',V)+p('M40 98L34 117M82 99L96 111','none',K,2)+seal(59,66,1.45,B)+c(59,66,29,T)+[[59,43],[80,59],[73,83],[45,83],[37,59]].map(([x,y],i)=>suit('c',x,y,.65,i%2?Y:L)).join('')+c(59,65,9,K)+c(59,65,4,Y)+rays(59,65,42,10,O));
// 016 — A small half-masked performer casts a giant violet jester silhouette.
add('j_half',p('M21 106L22 58L13 33L36 43L52 24L70 47L94 40L90 66L103 106Z',V)+p('M31 58L39 80M86 59L80 79','none',K,3)+c(57,72,19,I)+p('M42 73Q58 91 76 72','none',T,3)+p('M37 119L44 93H75L83 119Z',O)+p('M44 92L35 76L49 82L59 68L69 82L83 76L75 94Z',Y)+mask(59,96,.53,P)+p('M45 114L51 108L59 116L68 107L76 114','none',R,3)+e(59,123,34,3,B));
// 017 — A painter's punched stencil hovers over two vividly colored empty picture spaces.
add('j_stencil',g(35,74,.94,r(-21,-35,42,70,O,2)+r(-16,-30,32,60,T,1)+rays(0,0,10,8,Y)+c(0,0,4,B),-10)+g(82,76,.94,r(-21,-35,42,70,K,2)+r(-16,-30,32,60,V,1)+rays(0,0,10,8,S)+c(0,0,4,O),9)+p('M23 31L35 23H85L96 34L78 48H43Z',Y)+p('M40 32L46 28H56L50 38ZM65 28H76L83 34L70 39Z',B)+p('M20 115Q59 108 102 116','none',I,2)+p('M93 103L105 113L99 120L87 110Z',L));
// 018 — Four separated magician's fingers balance colored rings and a tiny golden star.
add('j_four_fingers',c(30,49,12,'none',K,5)+c(59,34,11,'none',Y,5)+c(86,46,12,'none',T,5)+p('M39 116L39 98Q25 84 25 74V61Q25 54 31 59L42 76V53Q42 45 48 50L51 74V47Q52 39 58 44L61 72L64 51Q67 44 71 49L70 86Q83 82 87 89Q90 95 78 100L72 116Z',S)+p('M43 82Q56 85 66 79M44 96Q55 91 69 96','none',V,2)+r(37,110,38,11,B,1)+c(46,116,3,Y)+star(90,84,.55,O)+spark(17,85,.3,K));
// 019 — A white-faced mime in a striped blue suit mirrors a small pink mask with a gloved hand.
add('j_mime',p('M18 119L27 85L52 79L76 90L85 120Z',B)+p('M26 91L71 99M23 101L75 110M20 111L80 119','none',S,5)+p('M27 83L40 95L52 81Z',R)+g(40,57,1.05,mask(0,0,1,P),-10)+p('M21 41Q22 23 42 25Q61 26 62 39Z',I)+r(18,38,48,7,V,2)+g(87,65,.62,mask(0,0,1,K),13)+p('M61 48Q85 28 99 47','none',Y,2)+palm(82,95,.86)+p('M60 113L66 97L73 104L71 118Z',V)+c(18,72,4,T));
// 020 — A golden coin descends below zero into a bright purple vault, beside a turquoise gauge.
add('j_credit_card',r(18,26,21,89,T,2)+[38,50,62,74,86,98,110].map(y=>l(20,y,31,y,I,1)).join('')+r(46,84,57,34,V,4)+r(52,91,45,21,K,2)+c(76,102,7,Y)+p('M75 28V69M68 61L75 70L82 61','none',B,5)+l(14,63,104,63,R,3)+t(49,58,'0',16,R)+coin(75,79,1.4)+p('M60 39V49M90 44V55','none',Y,2)+e(60,123,44,3,B));
// 021 — A ceremonial dagger draws red energy from a cracked purple crown into a golden one.
add('j_ceremonial',p('M15 105L24 91H97L106 105V119H15Z',V)+p('M20 108H101','none',K,3)+crown(31,91,.95,Y)+g(85,91,.8,crownBroken(0,0,1),10)+p('M78 31H91V44L84 75L78 44Z',S)+p('M84 35V66','none',P,2)+r(73,40,23,6,O,1)+r(80,22,9,18,B,2)+p('M81 100Q57 120 36 102M44 101L35 102L38 111','none',R,4)+flame(30,66,.5)+spark(57,67,.42,Y)+c(103,60,4,T));
// 022 — A red silk banner flies above a turquoise and violet reserve drum.
add('j_banner',p('M20 30L27 118M99 30L91 118','none',I,4)+p('M21 37Q59 21 98 37L91 74Q59 60 28 75Z',R)+p('M28 42Q59 32 91 42L87 63Q59 55 32 65Z',O)+[37,59,81].map(x=>token(x,49,.68,Y)).join('')+p('M31 75L26 85L39 80M88 73L94 83L81 79',K)+e(59,112,34,10,V)+r(26,93,66,18,B,1)+e(59,92,33,9,T)+chips(36,103,3,.8)+chips(61,110,5,.9)+chips(86,103,3,.8)+c(20,28,5,Y)+c(99,28,5,Y));
// 023 — A violet mountain rises behind a pink dawn, with an empty pilgrim's basket below.
add('j_mystic_summit',c(77,41,18,Y)+p('M12 87L37 43L56 67L77 27L107 88Z',V)+p('M30 57L37 43L47 58L39 55L35 61Z',S)+p('M62 49L77 27L93 53L82 47L77 56L72 46Z',P)+p('M13 84Q56 70 106 84L106 120H13Z',T)+p('M18 94Q56 81 100 94','none',B,4)+basket(59,99,.97)+p('M42 84Q59 56 76 84','none',O,4)+p('M49 88Q59 85 69 88','none',P,2)+p('M23 109L30 102L34 115M88 105L94 99L98 114',L));
// 024 — A blue-aproned mason carves a vivid turquoise bust from a slab of lavender stone.
add('j_marble',p('M58 39L99 33L103 111L57 118Z',V)+p('M63 44L95 39L97 108L63 113Z',S)+p('M69 102Q70 83 77 82L78 73Q66 62 76 53Q88 49 91 60Q92 69 85 75V82Q96 88 96 102Z',T)+p('M75 62H80M86 62H90M80 71Q84 73 87 69','none',I,1.5)+face(30,54,.62,'J',O)+p('M19 73L43 70L46 99H20Z',B)+p('M28 100L20 117M38 99L44 117M42 73L51 60','none',I,4)+p('M50 61L61 73','none',Y,4)+p('M44 54L51 42L62 48L55 59Z',O)+spark(65,75,.3,K)+p('M62 118L69 122L74 116M90 116L96 120L102 116',Y));
// 025 — Five quiet blue bells surround a sixth gold bell exploding with pink light.
add('j_loyalty_card',p('M21 38Q59 24 98 38L94 108Q58 122 24 108Z',V)+p('M27 43Q59 34 91 43','none',K,3)+[[36,59],[59,52],[82,59],[36,88],[59,93]].map(([x,y])=>g(x,y,.55,p('M-12 10L-8 2V-8Q0 -20 8 -8V2L12 10Z',B)+e(0,10,12,4,T)+c(0,15,3,Y))).join('')+rays(86,96,16,9,K)+g(84,92,.8,p('M-12 10L-8 2V-8Q0 -20 8 -8V2L12 10Z',Y)+e(0,10,12,4,O)+c(0,15,3,R))+p('M22 118Q59 130 99 117','none',B,3));
// 026 — An eight-ball opens to reveal a pink genie of stars instead of another playing card.
add('j_8_ball',p('M49 69C30 51 67 45 52 31Q83 30 78 50Q76 62 63 71Z',K)+p('M58 65Q50 53 64 49Q77 45 67 36','none',S,3)+star(72,31,.55,Y)+star(38,39,.28,T)+c(57,89,29,I)+p('M31 75Q57 90 83 75','none',V,6)+p('M35 73Q57 81 79 72','none',P,2)+c(56,92,15,S)+t(56,100,'8',24,B)+p('M34 94Q34 105 45 111','none',T,3)+e(58,123,35,3,V)+spark(95,57,.4,O));
// 027 — A colorful stack of loose wooden printing blocks tumbles out of a blue ink tray.
add('j_misprint',p('M16 102L102 104L97 123H21Z',B)+p('M23 111H96','none',T,3)+Array.from({length:24},(_,n)=>{const x=24+(n%5)*17,y=36+Math.floor(n/5)*16;return g(x,y,1,r(-7,-8,14,15,[O,Y,K,T,V][n%5],1)+t(0,4,n,9,n%5===4?P:I),[-12,6,-5,14,-8][n%5]);}).join('')+p('M17 84L13 79M103 36L108 30','none',R,2));
// 028 — The last masked performer is echoed across a vivid violet sea at orange sunset.
add('j_dusk',c(59,59,34,O)+p('M26 55H92M26 64H92M31 73H88','none',Y,3)+p('M12 87Q57 80 106 87V124H12Z',V)+p('M17 96Q60 89 102 97M26 108H89M38 117H80','none',K,2)+g(42,75,.8,mask(0,0,1,P),-9)+p('M22 107L30 91H52L59 108Z',B)+g(82,104,.5,mask(0,0,1,T),11)+p('M68 120L75 115H88L95 121Z',B)+p('M57 98Q66 104 72 101','none',Y,2)+star(98,31,.25,P));
// 029 — A tiny yellow strongman raises an enormous violet weight with a red clenched fist emblem.
add('j_raised_fist',p('M42 40V31Q59 15 77 31V40M48 40V32Q59 23 71 32V40','none',I,6)+p('M31 40H86L97 77H21Z',V)+p('M29 70H88','none',K,3)+t(59,66,'50',21,Y)+p('M51 86L65 83L72 102L62 110L46 103Z',O)+c(57,85,7,P)+p('M47 93L34 80V75M68 93L82 80V75M51 104L40 118M64 106L76 118','none',B,5)+p('M44 116H34M73 117H83','none',I,4)+p('M24 94L18 87M92 91L99 85','none',R,2)+e(59,124,34,3,T));
// 030 — A bright striped market stall houses a reroll drum with a playful zero-priced tag.
add('j_chaos',p('M20 50L31 28H88L99 50Z',R)+[0,1,2,3].map(i=>p(`M${31+i*15} 28H${39+i*15}L${46+i*15} 50H${30+i*15}Z`,Y)).join('')+p('M20 50H99V60Q88 69 79 60Q69 69 59 60Q49 69 40 60Q29 69 20 60Z',T)+r(26,68,66,43,V,2)+r(33,74,51,27,K,2)+p('M39 93Q43 77 58 82Q69 88 75 80M43 87L39 94L48 94','none',Y,4)+p('M92 82H102V71','none',B,5)+c(102,68,5,O)+price(64,114,'0',1.05)+c(21,118,4,T)+c(95,119,4,Y));
// 031 — A nautilus shell carries the Fibonacci sequence along its expanding colorful chambers.
add('j_fibonacci',p('M103 114H38Q13 114 13 85V51Q13 23 43 23H74Q104 23 104 52V76Q104 98 81 98H56Q35 98 35 78V60Q35 44 53 44H67Q84 44 84 62V71Q84 82 73 82H62Q52 82 52 72V65Q52 58 61 58Q70 58 70 66Q70 73 64 73',O,I,3)+p('M17 85V54Q17 28 44 28H73Q98 28 99 52V74Q99 92 81 92H56Q41 92 41 78V61Q41 50 54 50H67Q78 50 78 62V71Q78 76 72 76H62Q58 76 58 71V65Q58 62 62 62','none',Y,5)+[[27,103,'1'],[22,51,'2'],[73,31,'3'],[96,80,'5'],[47,87,'8']].map(([x,y,n],i)=>c(x,y,10,[K,T,V,B,L][i])+t(x,y+4,n,12,i===2?P:I)).join('')+p('M31 115L18 122M45 116L36 124M63 115L58 125','none',V,2));
// 032 — Orange molten metal pours from a turquoise furnace into an enormous blue gear.
add('j_steel_joker',r(20,30,77,40,V,3)+r(26,36,65,28,T,2)+r(42,42,35,21,I,1)+flame(59,58,.58)+p('M48 64Q49 83 63 87L70 97','none',O,8)+p('M50 65Q53 81 66 86','none',Y,3)+g(65,99,.75,gear(0,0,1))+c(65,101,11,B)+c(65,101,5,Y)+p('M21 64L17 83H39L35 65Z',K)+p('M86 69L102 80L96 89L81 77Z',S)+spark(24,103,.39,Y)+spark(93,106,.3,R)+p('M29 122H100','none',I,2));
// 033 — Three expressive royal theatre masks float above blue gallery drapery.
add('j_scary_face',p('M15 24H104V42L86 33L77 48L59 35L40 48L32 33L15 42Z',V)+p('M16 25L22 119L35 113L30 37M103 26L97 119L84 113L88 36Z',K)+g(29,77,.67,mask(0,0,1,T),-12)+g(59,60,.88,mask(0,0,1,P))+g(91,77,.67,mask(0,0,1,O),12)+crown(59,30,.68,Y)+p('M17 114Q59 103 103 114V122H17Z',B)+p('M27 116H91','none',T,2)+c(58,93,4,R));
// 034 — Four differently colored jester puppets orbit a pink central spark.
add('j_abstract',c(59,72,36,B)+c(59,72,29,V)+p('M29 72Q29 40 59 40Q90 40 90 72Q90 104 59 104Q29 104 29 72','none',Y,2)+face(28,71,.62,'J',T)+face(89,71,.62,'J',O)+g(59,43,.55,face(0,0,1,'J',K),180)+face(59,104,.55,'J',L)+spark(59,72,.95,K)+spark(59,72,.43,Y)+p('M17 30L22 35M97 110L102 115','none',T,2));
// 035 — An hourglass slowly transforms blue reserve tokens into a golden shower of coins.
add('j_delayed_grat',r(34,25,51,7,V,2)+r(34,112,51,8,V,2)+p('M40 32Q38 52 54 69Q37 87 40 112H79Q82 87 66 69Q82 52 79 32Z',S)+p('M44 43H75Q72 57 60 65Q48 57 44 43Z',T)+p('M60 73Q51 98 44 108H75Q67 99 60 73Z',Y)+p('M60 64V91','none',O,2)+token(23,55,.7,B)+token(24,89,.62,T)+coin(95,57,.72)+coin(95,87,.9)+coin(83,114,.7)+p('M17 37L25 31M93 32L100 38','none',K,2)+e(59,125,35,2,B));
// 036 — A violet tabletop mirror doubles a small row of brightly colored clockwork birds.
add('j_hack',p('M35 115L42 93H76L84 115','none',V,6)+e(60,57,40,32,O)+e(60,57,34,27,B)+p('M33 41L43 34M74 78L88 67','none',S,2)+[0,1,2,3].map(i=>g(34+i*17,61,.55,c(0,0,9,[Y,K,T,L][i])+p('M8 -3L17 1L8 5Z',O)+c(2,-3,2,I)+p('M-7 -1L-15 -8L-12 5Z',V)+p('M-3 8V15M3 8V15','none',I,2))).join('')+[0,1,2,3].map(i=>g(27+i*22,107,.72,c(0,0,9,[Y,K,T,L][i])+p('M8 -3L17 1L8 5Z',O)+c(2,-3,2,I)+p('M-7 -1L-15 -8L-12 5Z',V)+p('M-3 8V15M3 8V15','none',I,2))).join('')+p('M16 121H103','none',I,2));
// 037 — A puppet-maker's colorful everyday objects acquire smiling royal masks.
add('j_pareidolia',p('M21 28H99M31 28V45M61 28V37M91 28V45','none',V,3)+g(29,82,.85,p('M-14 -9L-10 -22H10L14 -9V29H-14Z',T)+p('M-9 15H9','none',B,3),-10)+g(61,78,.95,p('M-13 -14Q0 -28 13 -14L18 25H-18Z',O)+p('M-10 12H10','none',R,3))+g(92,83,.8,p('M-13 -23H13V26H-13Z',K)+p('M-8 8H8','none',V,3),12)+mask(29,57,.62,P)+mask(61,48,.68,Y)+mask(92,57,.62,S)+crown(61,29,.4,Y)+p('M19 120H103','none',B,3));
// 038 — A huge ripe banana with a glowing fuse lies on a pink carnival platter.
add('j_gros_michel',e(59,114,43,9,V)+e(59,111,37,6,K)+g(59,77,1.3,p('M-24 -24C-28 7 -11 32 10 27C26 23 33 4 28 -14L22 -18C22 1 12 15 0 9C-12 4 -16 -6 -17 -24Z',Y)+p('M-19 -18C-21 9 -7 26 9 22C20 20 26 8 26 -6','none',O,3)+p('M-24 -24L-24 -29L-17 -29L-17 -24',L)+p('M-12 3Q-4 15 6 15','none',P,2),-18)+p('M19 54Q14 36 28 29Q35 28 34 23','none',I,3)+spark(34,25,.4,R)+p('M45 39Q58 28 48 32Q41 27 51 23','none',T,2)+c(94,43,5,B)+star(97,83,.25,O));
// 039 — Five numbered lava embers bubble out of a pink and violet volcanic furnace.
add('j_even_steven',p('M18 121L29 73L47 62H72L92 79L103 121Z',V)+p('M33 82L43 65H76L88 84L75 94L82 114H37L45 96Z',K)+flame(59,63,1.27)+[[30,84,'2'],[58,68,'4'],[87,84,'6'],[43,107,'8'],[77,107,'10']].map(([x,y,n],i)=>p(`M${x-12} ${y-9}L${x+5} ${y-13}L${x+13} ${y+1}L${x+4} ${y+12}L${x-12} ${y+8}Z`,i%2?R:O)+t(x,y+5,n,14,Y)).join('')+spark(21,37,.28,T)+spark(98,36,.35,Y));
// 040 — Five odd-numbered blue stacks glow like small towers beneath a pink crescent moon.
add('j_odd_todd',c(77,37,18,K)+c(85,31,15,V,V,1)+star(27,29,.27,Y)+star(98,66,.24,T)+[[25,66,'A',2],[58,49,'3',3],[91,67,'5',2],[41,108,'7',4],[78,108,'9',4]].map(([x,y,n,k])=>chips(x,y,k,.87)+e(x,y-k*4.35,10,5,T)+t(x,y-k*4.35+3,n,9,I)+p(`M${x-8} ${y+5}H${x+8}`,'none',Y,2)).join('')+p('M16 122Q58 114 103 122','none',B,3));
// 041 — A blue scholar owl reads a gold-edged book with a pink quill and glowing insight.
add('j_scholar',p('M34 77L33 39L46 46Q59 38 72 46L85 39L84 77Z',B)+p('M40 48Q59 37 79 48V66Q60 87 40 66Z',T)+c(49,57,10,P)+c(70,57,10,P)+c(49,57,5,V)+c(70,57,5,V)+p('M55 68L60 75L65 68Z',O)+p('M14 84Q37 73 59 87Q81 73 104 84V116Q80 106 59 121Q37 106 14 116Z',Y)+p('M20 84Q40 79 59 91Q79 79 98 84V109Q78 101 59 115Q40 102 20 110Z',P)+p('M59 91V115M27 94L49 99M27 102L49 107M70 99L91 94M70 107L91 102','none',V,1.3)+p('M92 80Q87 52 102 36Q110 53 97 76Z',K)+p('M95 85L102 42','none',I,1.5)+spark(22,40,.42,O));
// 042 — A smiling merchant sends a violet envelope over two large gold coins.
add('j_business',p('M21 93L31 67H61L74 94Z',T)+face(46,54,.72,'K',O)+p('M32 71L46 82L58 70M46 82V93','none',V,2)+g(77,82,.9,r(-24,-17,48,34,V,3)+p('M-23 -15L0 4L23 -15',K)+p('M-23 15L-5 0M23 15L5 0','none',S,1.5),-12)+coin(38,110,1.15)+coin(79,110,1.15)+p('M18 35H28M23 30V40M91 40L98 33','none',Y,2)+p('M17 123H103','none',B,3));
// 043 — Two orbiting suns feed an expanding red and gold supernova through violet space.
add('j_supernova',p('M23 107Q11 68 40 40Q78 8 102 57Q117 95 78 113Q38 130 23 107Z',V)+p('M26 99Q57 113 88 86Q113 53 81 34Q51 21 29 58','none',T,2)+c(31,94,9,O)+c(48,88,9,O)+c(31,94,4,Y)+c(48,88,4,Y)+c(27,65,6,K)+c(39,58,6,K)+p('M38 83Q46 68 59 63M42 50Q50 47 61 48','none',Y,2)+star(79,49,1.35,R)+star(79,49,.85,O)+spark(79,49,.55,Y)+rays(79,49,29,8,K)+c(90,108,4,B));
// 044 — A turquoise bus carries three colorful human passengers past a crown-marked stop.
add('j_ride_the_bus',r(13,49,80,49,T,7)+r(19,55,68,26,Y,2)+[30,53,76].map((x,i)=>c(x,65,6,P)+p(`M${x-8} 80V75Q${x} 67 ${x+8} 75V80Z`,[V,R,B][i])+p(`M${x-6} 61Q${x} 54 ${x+6} 61Z`,[K,O,V][i])).join('')+p('M15 86H92M42 50V97M66 50V97','none',B,2)+r(19,87,13,5,O,1)+c(30,101,9,I)+c(30,101,4,S)+c(76,101,9,I)+c(76,101,4,S)+p('M102 47V115','none',V,3)+c(102,39,10,K)+crown(102,39,.42,Y)+p('M20 115H87','none',O,3)+p('M16 32L28 32M12 40H23','none',Y,2));
// 045 — A tiny astronaut ascends blue and pink celestial steps toward a gold star.
add('j_space',p('M15 113H43V92H70V71H100V122H15Z',B)+p('M17 113H42M45 92H69M72 72H100','none',T,4)+p('M43 92V112H69V93M71 73V121H99V73',V)+g(49,70,.76,c(0,-21,11,P)+c(1,-21,7,T)+r(-10,-8,21,29,S,5)+r(-7,-4,15,9,K,1)+p('M-8 16L-18 26M7 17L16 5M-8 -3L-23 -7M9 -4L19 -18','none',P,7)+p('M-12 27L-22 26M15 5L25 7','none',I,4))+star(91,35,.68,Y)+rays(91,35,18,6,O)+star(23,37,.3,K)+p('M18 59Q30 47 38 49','none',L,2));
// 046 — A silver egg bank rests in a purple velvet nest as colorful coins fall through its slot.
add('j_egg',e(59,113,40,10,V)+p('M22 109Q59 96 97 110L87 121H32Z',K)+p('M59 32C32 33 23 78 29 99C35 124 82 124 90 99C98 77 81 33 59 32Z',S)+p('M59 35C42 51 37 84 43 106Q53 117 65 113C50 92 56 56 69 37Z',T)+p('M42 69Q35 88 41 101','none',P,3)+p('M48 49L68 46','none',V,5)+p('M49 48L67 45','none',I,1.5)+coin(28,39,.68)+coin(93,61,.68)+coin(23,93,.6)+p('M91 29Q78 20 65 36M71 29L64 37L73 37','none',O,3)+spark(96,99,.3,Y));
// 047 — A purple burglar hooks three gold keys while a closed blue basket guards the discarded haul.
add('j_burglar',p('M15 31L20 88L32 82L29 31Z',V)+p('M18 33L22 78','none',K,2)+g(46,66,.85,p('M-14 -11Q-11 -30 5 -25Q21 -21 18 -5L9 6L-12 4Z',V)+c(1,-10,12,P)+p('M-10 -14Q1 -21 13 -14L11 -6H-8Z',I)+c(-3,-12,2,P)+c(6,-12,2,P)+p('M-10 3L13 2L20 29H-18Z',B)+p('M-9 9L-25 23M12 10L27 1','none',T,6))+[67,80,94].map((x,i)=>g(x,41+i*9,.6,c(0,0,7,'none',Y,4)+p('M0 7V27H8M0 20H8','none',O,4))).join('')+p('M67 71L93 56','none',I,3)+basket(87,103,.8,true)+p('M74 88L99 114M99 88L75 114','none',R,3)+coin(28,111,.65));
// 048 — A bright-framed chalkboard illustrates black suit constellations with colored chalk and a hand.
add('j_blackboard',r(15,26,89,86,O,3)+r(21,32,77,73,I,1)+suit('s',40,56,1,T)+suit('c',77,62,1,L)+p('M29 82L42 74L58 85L84 77','none',K,2)+c(29,82,3,Y)+c(42,74,3,Y)+c(58,85,3,Y)+c(84,77,3,Y)+p('M29 39H45M29 43H37M65 42H88','none',P,1.2)+palm(56,92,.87)+p('M35 114L29 123M85 114L91 123','none',V,4)+r(25,106,15,4,B,1)+r(77,107,15,4,K,1)+star(93,42,.2,Y));
// 049 — A red-suited runner leaps over an orange ascending track with turquoise speed trails.
add('j_runner',p('M13 114L99 51L105 64L24 122Z',O)+p('M18 114L101 57','none',Y,3)+[0,1,2,3,4].map(i=>p(`M${24+i*17} ${109-i*12}L${32+i*17} ${103-i*12}`,'none',V,3)+t(29+i*17,118-i*12,i+2,8,I)).join('')+person(60,60,1.15,'run',R)+p('M54 43L66 50L60 64L47 58Z',K)+p('M27 60L40 57M18 70L37 67M23 80L38 75','none',T,4)+p('M72 34L83 30','none',B,3)+star(96,30,.35,Y)+c(22,35,5,V));
// 050 — A turquoise, pink and purple ice cream melts over a gold crosshatched cone.
add('j_ice_cream',e(59,118,35,7,T)+e(67,118,19,4,K)+p('M35 67H83L59 115Z',Y)+p('M43 82L65 103M49 72L74 93M75 79L50 101M70 71L45 93','none',O,2)+p('M29 62Q23 42 42 38Q45 20 63 27Q84 22 87 41Q102 48 88 66L81 84Q76 91 74 76L72 65L62 66L60 94Q55 101 52 89L50 67L38 68L35 79Q29 83 29 62Z',T)+e(44,46,17,14,K)+e(70,44,18,15,V)+p('M31 55Q59 70 89 54L87 64Q58 76 31 64Z',B)+p('M35 43L39 45M51 38L55 41M68 35L72 38M80 47L84 45','none',Y,2.3)+p('M90 94V101M30 101V106','none',K,4)+c(61,27,4,R));

const midFlower=(x,y,s=1,color=K)=>g(x,y,s,[0,72,144,216,288].map(a=>g(0,0,1,e(0,-10,7,12,color),a)).join('')+c(0,0,7,Y));
const midGoblet=(x,y,s=1,color=V)=>g(x,y,s,p('M-14 -24H14L12 -4Q0 9 -12 -4Z',color)+p('M0 3V20M-13 22H13','none',G,4)+e(0,-24,14,4,Y));
// 051 — A jewel-coloured double helix grows two identical living flowers.
add('j_dna',p('M35 27C92 42 24 63 82 79C101 92 54 103 74 117M81 27C25 42 94 63 37 79C16 92 65 103 44 117','none',T,6)+[37,50,65,80,97].map((y,i)=>l(i%2?42:35,y,i%2?76:83,y,K,3)).join('')+midFlower(30,105,.66,O)+midFlower(91,105,.66,O)+c(59,28,8,Y)+spark(21,51,.35,V));
// 052 — A broad workshop vat catches five vividly different falling paint streams.
add('j_splash',[[23,37,R],[41,30,Y],[59,40,T],[77,29,K],[95,37,V]].map(([x,y,col])=>p(`M${x} ${y}Q${x-8} ${y+11} ${x} ${y+17}Q${x+8} ${y+11} ${x} ${y}Z`,col)+l(x,y+20,x,75,col,3)).join('')+p('M18 77H100L88 113H30Z',B)+e(59,77,41,10,T)+p('M29 91Q59 105 90 91','none',Y,4)+c(59,104,5,K)+p('M31 119H87','none',I,3));
// 053 — A blue jester sweeps the remaining chips into an overflowing velvet sack.
add('j_blue_joker',p('M25 70L34 52L68 52L79 75Q101 117 55 120Q15 119 25 70Z',B)+p('M32 54L27 34L46 43L57 28L66 46L81 38L69 56Z',T)+p('M31 68Q50 76 73 65','none',Y,5)+p('M43 84Q56 78 67 87M43 100Q56 108 69 98','none',P,2)+chips(86,105,5,.75)+chips(24,112,2,.55)+coin(84,41,.8)+star(53,94,.38,K));
// 054 — An enormous sixth eye opens in a swirling violet gateway.
add('j_sixth_sense',e(59,73,43,46,V)+e(59,73,34,38,B)+p('M24 73Q59 31 94 73Q59 114 24 73Z',T)+e(59,73,17,24,Y)+e(59,73,7,18,I)+c(63,63,4,P)+[29,42,59,76,89].map((x,i)=>c(x,28+(i%2)*7,3,K)).join('')+t(59,119,'VI',13,Y)+p('M21 49L29 53M90 48L98 44','none',O,3));
// 055 — Bright inhabited planets wind round a warm sun in three intersecting orbits.
add('j_constellation',e(59,74,44,17,'none',T,2)+g(59,74,1,e(0,0,43,18,'none',K,2),55)+g(59,74,1,e(0,0,43,18,'none',Y,2),-55)+c(59,74,16,O)+c(55,69,5,Y)+c(27,61,10,B)+c(87,93,12,V)+e(87,93,17,4,'none',P,1.5)+c(78,37,8,L)+star(28,108,.35,K)+star(93,29,.28,Y));
// 056 — A glowing sword emerges from a water trough beneath a blacksmith's hammer.
add('j_hiker',p('M25 100L33 119H88L97 99Z',B)+e(60,99,36,8,T)+p('M55 93L43 44L52 30L67 89Z',O)+p('M50 43L61 87','none',Y,3)+p('M42 90L75 84','none',G,6)+p('M60 90L64 112','none',V,7)+g(84,47,1,r(-19,-9,38,18,S,2)+r(-3,8,6,36,G,1),-31)+spark(48,51,.6,Y)+p('M23 81Q14 66 27 59M92 85Q107 71 95 60','none',P,2));
// 057 — Three theatrical masks retire into a red velvet chest and leave gold behind.
add('j_faceless',g(29,48,.64,mask(0,0,1,K),-19)+mask(59,42,.7,Y)+g(89,48,.64,mask(0,0,1,T),19)+p('M18 79Q59 67 100 79V111Q59 124 18 111Z',V)+p('M20 79Q58 94 99 79L95 91Q57 107 24 91Z',R)+r(50,95,18,15,G,2)+coin(24,116,.7)+coin(94,116,.7)+p('M25 69L34 79M86 68L78 79','none',Y,2));
// 058 — A flamboyant crimson plant outgrows its turquoise pot while shears prune a branch.
add('j_green_joker',p('M59 102Q72 74 55 35','none',L,6)+p('M60 70Q26 74 23 50Q50 37 60 70Z',R)+p('M64 56Q68 25 93 30Q94 54 64 56Z',K)+p('M62 90Q91 64 101 83Q87 101 62 90Z',O)+midFlower(54,35,.58,Y)+p('M38 103H81L74 122H45Z',T)+p('M24 86L43 103M26 102L47 83','none',S,4)+c(21,82,6,'none',I,2)+c(21,106,6,'none',I,2));
// 059 — A single ace marks the entrance to a winding jewel road through mountains.
add('j_superposition',p('M13 111L36 50L53 88L80 27L106 111Z',V)+p('M36 50L26 76L38 71L45 80M80 27L67 58L81 49L91 59Z',T)+p('M22 121Q91 103 59 81Q42 65 83 43','none',G,14)+p('M24 121Q90 103 59 81Q42 65 83 43','none',Y,3)+card(28,91,'A','h',.78,-17)+star(85,35,.48,K));
// 060 — A colourful cook's order hangs above two steaming dishes and four coins.
add('j_todo_list',r(28,24,62,51,T,3)+r(45,20,28,9,O,2)+p('M39 40L44 45L52 35M39 57L44 62L52 52','none',Y,3)+l(60,40,78,40,P,3)+l(60,57,78,57,P,3)+e(35,93,22,7,G)+e(83,93,22,7,G)+p('M15 90Q35 54 55 90ZM63 90Q83 54 103 90Z',V)+c(35,66,3,K)+c(83,66,3,K)+[26,49,73,96].map(x=>coin(x,114,.75)).join(''));
// 061 — A huge yellow banana wears teal steel armour with pink rivets.
add('j_cavendish',banana(56,72,1.32,-13)+p('M22 42C12 83 40 118 71 107C93 101 103 78 94 49','none',T,8)+p('M22 42C12 83 40 118 71 107C93 101 103 78 94 49','none',I,1.5)+p('M22 62L35 59M29 91L42 83M58 108L57 94M86 93L75 84M96 63L84 64','none',V,8)+[[22,62],[29,91],[58,108],[86,93],[96,63]].map(([x,y])=>c(x,y,3,K)).join('')+spark(83,32,.4,Y)+ground(123));
// 062 — Two acrobats repeat the same leaping pose across a vivid circus seal.
add('j_card_sharp',seal(59,73,1.6,V)+person(42,68,.75,'leap',O)+person(78,83,.75,'leap',K)+p('M26 101Q62 123 94 98','none',T,5)+p('M25 47Q42 29 65 39M59 33L67 39L59 44','none',Y,3)+spark(83,36,.4,R)+p('M46 118H81','none',I,2));
// 063 — A scarlet refusal seal presses a giant cross onto a closed violet gift box.
add('j_red_card',p('M22 63L59 48L97 63V108L59 123L22 108Z',V)+p('M22 63L59 78L97 63M59 78V123','none',I,2)+r(52,53,13,64,T,1)+p('M18 62L56 44L100 60L96 72L59 89L19 74Z',O)+c(59,78,23,R)+l(46,65,72,91,Y,7)+l(72,65,46,91,Y,7)+spark(93,35,.35,K));
// 064 — A ravenous magenta creature swallows a glowing golden sun.
add('j_madness',p('M19 74C10 28 58 20 79 44L99 50L78 68L102 88L79 110C47 131 18 105 19 74Z',K)+p('M29 65Q52 44 81 52L66 73L83 98Q48 106 29 86Z',V)+p('M33 62L42 76L48 55L55 73L63 52L69 67M36 91L44 77L50 97L58 82L65 99L71 86',P)+c(38,43,8,T)+c(40,42,3,I)+c(93,73,13,O)+rays(93,73,14,6,Y)+p('M18 40L13 28M27 33L24 22','none',B,3));
// 065 — Four brightly dressed musicians play around a blue drum.
add('j_square',face(28,47,.66,'J',K)+face(89,47,.66,'J',T)+face(28,98,.66,'J',O)+face(89,98,.66,'J',L)+e(59,78,22,17,B)+p('M37 78V96Q59 114 81 96V78',B)+e(59,78,22,8,T)+p('M40 83L48 101L57 85L67 102L77 83','none',Y,2)+p('M36 61L52 73M81 61L66 73','none',G,4));
// 066 — A spectral violet hand rises between five coloured candles in a ritual ring.
add('j_seance',e(59,98,43,20,V)+e(59,98,35,14,'none',K,2)+p('M45 98V66Q38 52 43 48L53 62V39Q57 32 61 39L62 62L66 42Q71 36 74 42L72 69L81 61Q89 61 85 69L72 92L69 104Z',T)+[[24,79,Y],[36,48,K],[83,47,O],[97,81,L],[59,112,B]].map(([x,y,col])=>r(x-4,y,8,16,col,1)+p(`M${x} ${y-3}Q${x-8} ${y-9} ${x} ${y-17}Q${x+8} ${y-9} ${x} ${y-3}Z`,Y)).join('')+star(59,82,.3,P));
// 067 — A travelling fairground puppet booth welcomes two new jesters.
add('j_riff_raff',p('M15 46L59 24L103 46Z',K)+p('M19 46H99V113H19Z',T)+p('M26 52H92V102H26Z',V)+p('M26 52H47L40 87L26 92ZM92 52H72L78 87L92 92Z',R)+face(43,80,.75,'J',O)+face(76,80,.75,'J',L)+r(14,106,90,15,G,2)+star(59,39,.35,Y)+p('M30 121V125M89 121V125','none',I,3));
// 068 — A velvet-cloaked vampire collects luminous tribute in a golden goblet.
add('j_vampire',p('M20 117L30 63L17 40L47 51L59 42L71 51L101 40L87 65L99 117Z',V)+p('M30 63L59 94L87 65L77 119H40Z',R)+p('M44 35Q59 22 75 35L72 59L59 70L46 59Z',T)+p('M47 43L53 47M65 47L71 43','none',I,3)+p('M51 55L55 65L58 55M62 55L65 65L69 55',P)+midGoblet(60,94,.72,O)+coin(24,78,.7)+coin(96,78,.7)+p('M27 88Q38 99 49 94M93 88Q82 99 71 94','none',Y,3));
// 069 — A teal-cloaked climber leaps over missing orange stair treads.
add('j_shortcut',p('M16 121V103H37V82H57V61H78V40H101V122Z',V)+p('M16 103H37M37 82H57M57 61H78M78 40H101','none',O,6)+person(61,51,1.03,'leap',T)+p('M20 75Q23 32 50 32','none',Y,3)+p('M43 26L51 32L43 38','none',Y,3)+p('M30 111L39 102M61 91L69 82M83 70L91 61','none',K,3)+star(94,25,.3,L));
// 070 — A living teal silhouette gains violet and pink layers inside a projector beam.
add('j_hologram',p('M21 111L39 39H76L100 111Z',B)+p('M32 109V80Q32 64 48 60Q31 36 49 26Q66 21 72 38Q78 51 64 60Q81 64 81 80V109Z',V)+p('M42 109V80Q42 64 58 60Q41 36 59 26Q76 21 82 38Q88 51 74 60Q91 64 91 80V109Z',K)+p('M47 109V81Q47 69 59 65Q45 43 60 35Q73 31 77 43Q81 54 70 65Q84 69 84 81V109Z',T)+e(59,113,41,9,O)+r(40,114,38,10,V,3)+p('M48 48H77M50 56H77M49 91H81','none',P,1.3));
// 071 — A weary traveller shelters one last coin beneath a glowing fortune lantern.
add('j_vagabond',p('M24 117L32 62Q27 31 50 29Q74 28 74 57L94 117Z',V)+p('M35 52Q54 39 69 55L64 76L44 78Z',O)+p('M46 59L49 59M59 59L62 59M48 68H59','none',I,2)+p('M31 82L49 97L77 82','none',T,12)+coin(58,94,.84)+p('M83 115V46','none',G,4)+r(73,34,22,28,K,3)+star(84,48,.32,Y)+p('M77 34L84 26L91 34','none',I,2)+ground(124));
// 072 — A living crowned king guards a luminous reserve behind scarlet theatre curtains.
add('j_baron',r(15,28,88,84,V,1)+p('M15 28H42Q44 58 27 72L32 111H15ZM103 28H78Q75 56 91 72L86 111H103Z',R)+p('M43 106L38 69L48 57H70L81 72L77 106Z',T)+e(59,48,13,17,O)+crown(59,31,.8,Y)+p('M53 47H56M64 47H67M54 57Q59 60 65 56','none',I,1.5)+p('M17 114H102L108 124H10Z',G)+chips(30,108,3,.65)+coin(88,99,.9)+p('M50 77L59 87L69 76','none',K,4));
// 073 — A smiling nine-shaped cloud waters a small golden rent house.
add('j_cloud_9',p('M18 53Q10 33 31 31Q37 17 53 29Q67 18 79 30Q104 23 103 46Q109 65 84 65H31Q15 67 18 53Z',T)+t(60,54,'9',31,V)+p('M35 66V83M59 66V79M83 66V83','none',K,3)+p('M25 93L59 72L94 93V120H25Z',O)+p('M19 93L59 68L100 93','none',V,6)+r(50,98,18,22,B,1)+r(31,99,12,12,Y,1)+r(76,99,12,12,Y,1)+coin(18,115,.65)+coin(101,115,.65));
// 074 — A pink-and-teal rocket rises beyond a staircase made of broken crowns.
add('j_rocket',p('M14 121H36V103H59V85H82V67H104','none',V,7)+crownBroken(26,113,.55)+crownBroken(49,95,.55)+crownBroken(72,77,.55)+g(81,48,.83,p('M0 -27Q-20 -8 -14 19H14Q20 -8 0 -27Z',T)+p('M-14 4L-26 24L-12 18M14 4L26 24L12 18',K)+c(0,-3,8,B)+c(0,-3,4,S)+p('M-9 20L0 47L9 20Z',O)+p('M-4 21L0 37L4 21Z',Y)+p('M-7 -17L0 -23L7 -17','none',P,1),24)+star(30,39,.45,Y));
// 075 — Brilliant new blossoms climb a violet obelisk carved with old gestures.
add('j_obelisk',p('M39 119L45 40L59 22L74 40L81 119Z',V)+p('M59 23V118L80 118L73 40Z',B)+p('M49 50L59 57L69 49M47 79L58 87L72 78','none',T,3)+p('M23 120Q27 90 48 78Q88 63 92 28','none',L,4)+midFlower(29,106,.55,K)+midFlower(45,82,.6,O)+midFlower(80,60,.55,Y)+midFlower(91,31,.48,K)+p('M21 124H91','none',I,2));
// 076 — A sweeping painter's brush gilds a turquoise ceremonial mask.
add('j_midas_mask',g(47,75,1.5,mask(0,0,1,T),-12)+p('M53 40Q79 48 72 82L56 113L51 78Z',G)+p('M55 55L64 61M52 86L61 86','none',Y,2)+g(86,51,.9,p('M-4 -27H4V8H-4Z',V)+p('M-9 8H9L12 27Q0 33 -12 27Z',G)+p('M-8 15L-9 26M0 15V29M8 15L9 26','none',O,2),34)+p('M83 83Q89 93 83 98Q77 94 83 83Z',Y)+coin(89,115,.85)+spark(24,32,.36,K));
// 077 — A proud blue masked wrestler trades a coin to silence the boss's crown.
add('j_luchador',p('M21 120L26 80L40 69H70L88 84L99 120Z',T)+p('M36 73Q22 49 35 32Q53 20 70 34Q82 50 67 76Z',B)+p('M35 35L50 47L66 34L70 59L53 75L34 59Z',R)+p('M33 44L47 49L40 56L32 52ZM57 49L71 43L73 51L64 56Z',Y)+p('M46 63H59','none',I,3)+p('M26 92L43 104L74 94','none',V,10)+coin(75,94,1)+crownBroken(91,42,.65)+l(80,28,103,50,K,4));
// 078 — A large orange camera frames the first painted jester portrait in its lens.
add('j_photograph',r(15,47,88,61,O,5)+r(28,34,27,16,K,3)+r(22,52,14,9,Y,1)+c(65,77,25,V)+c(65,77,19,T)+face(65,77,.55,'J',Y)+p('M45 65V59H51M79 59H86V66M86 89V96H79M51 96H45V89','none',P,2)+p('M32 110L23 124M85 110L96 124','none',B,5)+p('M16 39L11 30M24 33V24','none',Y,3));
// 079 — A painted shopkeeper raises the price of an extravagant ribboned gift.
add('j_gift',p('M25 75H95V115H25Z',K)+p('M20 67H100V82H20Z',V)+r(52,67,13,48,Y,1)+p('M58 67Q19 64 32 45Q47 31 58 67Q68 27 87 43Q103 65 58 67Z',T)+price(86,98,'3',.9)+face(30,40,.62,'J',O)+p('M75 36V23M69 29L75 22L81 29','none',R,3)+coin(24,118,.65));
// 080 — A five-leaf fan plant loses two coloured leaves from its golden planter.
add('j_turtle_bean',p('M58 111V66M58 79L31 63M58 72L45 39M59 72L69 35M62 81L89 55','none',L,4)+p('M31 68Q9 62 18 38Q42 39 31 68Z',T)+p('M45 48Q24 33 44 24Q65 30 45 48Z',L)+p('M67 47Q53 25 77 23Q90 41 67 47Z',Y)+p('M88 68Q77 50 99 46Q110 62 88 68Z',O)+p('M84 103Q69 86 91 80Q109 95 84 103Z',K)+p('M38 106H79L72 123H45Z',V)+p('M91 110L88 116M77 75L73 80','none',I,1.5));
// 081 — Scarlet gardening shears open space in a lush multicoloured hedge.
add('j_erosion',p('M16 116V66Q14 46 31 50Q37 26 54 46Q74 27 84 48Q107 48 101 70V116Z',L)+p('M20 81Q39 60 49 84M69 73Q88 55 99 75','none',T,9)+p('M54 118Q47 85 62 55L80 50Q68 83 78 118Z',Y)+g(52,76,.9,p('M-9 8L22 -24M8 8L-17 -24','none',S,5)+c(-12,17,10,R)+c(12,17,10,K)+c(-12,17,5,'none',P,1.5)+c(12,17,5,'none',P,1.5)+c(0,6,4,G),20)+p('M87 30L94 25M93 39L103 38','none',O,3));
// 082 — Two royal guests relax in upholstered violet chairs with golden tips below.
add('j_reserved_parking',p('M15 87V48Q15 37 28 37H40Q53 37 53 48V87M65 87V48Q65 37 78 37H91Q104 37 104 48V87',V)+face(34,65,.72,'Q',K)+face(85,65,.72,'K',T)+r(15,86,38,15,K,4)+r(65,86,39,15,T,4)+p('M20 103V118M48 103V118M70 103V118M99 103V118','none',G,4)+coin(34,113,.78)+coin(85,113,.78)+p('M21 29L29 24M91 29L99 24','none',Y,2));
// 083 — A turquoise postman's envelope opens around banknotes and a bright rank seal.
add('j_mail',g(59,74,1,r(-24,-39,58,41,L,2)+r(-29,-33,58,41,T,2)+r(-33,-27,58,41,Y,2)+c(-4,-7,11,O)+t(-4,-2,'$',15,V)+p('M-42 -4H42V42H-42Z',K)+p('M-42 -4L0 24L42 -4M-42 42L-14 14M42 42L14 14','none',V,2)+seal(15,25,.48,R)+t(15,30,'7',13,Y),-7)+p('M22 123H98','none',I,2)+spark(90,31,.33,O));
// 084 — Five gold coins bloom into a larger moon-shaped nest egg.
add('j_to_the_moon',c(61,65,37,V)+c(72,54,28,B)+p('M39 35Q15 69 46 101Q70 118 91 93Q58 108 43 85Q24 62 39 35Z',Y)+[[43,47],[65,42],[28,68],[52,71],[73,66]].map(([x,y])=>coin(x,y,.68)).join('')+coin(93,108,1.1)+p('M60 99Q74 115 83 109M77 104L85 109L78 114','none',T,3)+star(94,28,.35,K)+star(21,111,.3,O));
// 085 — A grinning pink spirit and a blue flower burst from a striped gift packet.
add('j_hallucination',p('M23 75L59 62L96 75V111L59 123L23 111Z',O)+p('M23 75L59 89L96 75M59 89V123','none',V,2)+p('M23 75L13 56L45 48L59 62M96 75L105 56L73 48L59 62Z',T)+p('M39 71V48Q37 24 59 26Q82 26 81 48V72L72 65L65 75L57 65L47 74Z',K)+e(51,45,3,5,I)+e(68,45,3,5,I)+p('M50 57Q59 65 69 55','none',Y,3)+midFlower(90,36,.55,B)+star(25,29,.4,Y));
// 086 — A veteran fortune teller reads a luminous crystal sphere over a tower of books.
add('j_fortune_teller',r(24,108,72,12,V,2)+r(19,95,72,12,K,2)+r(29,82,72,12,T,2)+p('M31 109H82M26 97H79M36 84H90','none',Y,1)+c(60,55,27,B)+c(60,55,21,T)+p('M47 44Q58 32 70 44M44 56Q60 78 78 52','none',P,2)+star(61,53,.5,K)+p('M39 79H80L73 87H46Z',G)+p('M21 67L32 71M89 68L101 64','none',O,3)+star(93,28,.33,Y));
// 087 — A six-armed circus juggler balances five bright balls and one small ace.
add('j_juggler',face(59,64,1,'J',V)+p('M47 84L27 67L16 73M71 84L91 66L103 72M46 91L27 90L16 100M72 91L91 91L102 100M46 99L32 113M72 99L87 113','none',T,6)+[[22,43,K],[44,29,Y],[71,29,O],[94,43,L],[20,117,B]].map(([x,y,col])=>c(x,y,8,col)).join('')+card(96,115,'A','h',.4,14)+p('M47 104L41 122M71 104L77 122','none',V,6));
// 088 — An exuberant tavern jug holds a spare blue token above a red discard basket.
add('j_drunkard',p('M29 62H72V108Q53 124 29 108Z',O)+e(51,62,23,8,Y)+p('M73 70Q99 65 96 88Q94 103 74 101','none',V,9)+p('M77 77Q89 74 87 88Q86 93 77 94','none',T,3)+token(53,40,1.12,B)+p('M37 88L43 92L54 77M60 102L66 107L72 96','none',P,3)+p('M22 32L17 25M88 39L99 33','none',K,3)+ground(124));
// 089 — A miner's violet rock face yields giant turquoise crystals and golden sparks.
add('j_stone',p('M15 120L18 69L40 45L82 50L104 83L100 120Z',V)+p('M19 70L43 83L63 55L81 82L101 83M43 83L35 120M81 82L88 120','none',B,3)+p('M29 104L27 78L39 65L51 86L45 110Z',T)+p('M63 112L59 87L73 72L83 95L77 115Z',L)+p('M86 28L51 77','none',O,6)+p('M63 29Q87 20 103 52L88 41L76 40Z',S)+spark(51,76,.4,Y)+chips(91,116,2,.6));
// 090 — Four bright coins tumble from a red payroll envelope onto a turquoise desk.
add('j_golden',p('M18 71H99V114H18Z',K)+p('M18 71L59 96L99 71M18 114L46 88M99 114L72 88','none',V,2)+seal(59,97,.48,R)+p('M53 97L58 102L66 91','none',Y,2)+[[25,49],[48,36],[73,38],[94,54]].map(([x,y])=>coin(x,y,.9)).join('')+r(13,118,92,7,T,2)+p('M22 61L27 67M88 64L84 71','none',O,2));
// 091 — A giant golden lucky cat grows in a field of pink and blue flowers.
add('j_lucky_cat',p('M36 113Q28 92 39 74L37 41L51 49Q61 43 74 49L88 40L85 75Q98 94 85 114Z',G)+p('M40 76Q20 64 22 86L27 99L41 99M84 85L93 66L103 74L96 101L84 107',Y)+p('M43 59L50 55M74 55L81 59M48 67L53 70M69 70L74 67M56 76L61 80L66 76M51 85Q61 93 72 85','none',I,2)+p('M50 99H73','none',V,5)+r(35,112,52,11,R,3)+midFlower(23,112,.42,K)+midFlower(99,113,.42,B)+c(61,57,4,T));
// 092 — Three colourful uncommon jesters bind their hands over one shared ribbon.
add('j_baseball',face(29,64,.88,'J',T)+face(59,49,.95,'J',K)+face(89,64,.88,'J',O)+p('M16 90Q39 109 59 88Q81 109 103 90L101 108Q79 123 59 105Q37 123 18 108Z',V)+p('M22 100Q40 112 59 97Q80 113 97 100','none',Y,3)+p('M36 80L57 88L81 79','none',T,6)+spark(59,115,.4,R));
// 093 — A broad purple bull with two gold horns carries a safe full of blue chips.
add('j_bull',r(36,24,58,43,T,3)+r(42,30,46,30,B,2)+c(65,45,10,Y)+p('M65 37V53M57 45H73','none',V,2)+p('M25 76Q46 62 76 75L89 92L80 113H69L67 95H45L41 113H29L32 92L17 85Z',V)+p('M20 75L31 69L39 80L32 93L20 89L14 81Z',K)+p('M21 76Q9 72 12 58Q15 66 24 68ZM31 74Q44 68 40 55Q36 64 28 66Z',Y)+c(23,80,2,I)+p('M76 78L96 87L98 100','none',O,4)+chips(93,114,3,.62)+coin(56,116,.65));
// 094 — A scarlet soda can produces two different oversized reward medals.
add('j_diet_cola',p('M18 43Q34 50 50 43V99Q34 109 18 99Z',R)+e(34,43,17,6,S)+e(34,99,16,5,R)+e(34,43,7,2,I)+p('M23 61Q34 73 45 61M23 79Q34 91 45 79','none',Y,3)+seal(85,44,.72,V)+star(85,44,.45,T)+seal(85,91,.72,K)+crown(85,90,.65,Y)+p('M55 67H69M63 61L70 67L63 73','none',O,3)+r(14,116,91,7,T,2));
// 095 — One red gemstone enters a market scale and three gold coins balance it.
add('j_trading',p('M59 35V114M35 119H83M20 57H98','none',V,5)+c(59,44,10,T)+p('M23 58L13 86H44L35 58M83 58L74 95H105L95 58','none',O,2)+p('M13 86Q28 104 44 86Z',K)+p('M74 95Q89 113 105 95Z',B)+p('M19 76L28 54L37 76L28 87Z',R)+p('M28 58V82','none',Y,2)+coin(81,85,.6)+coin(91,83,.6)+coin(99,87,.6)+star(88,29,.32,L));
// 096 — A violet hand-cranked wheel glows with warm sparks after repeated turns.
add('j_flash',r(22,38,64,77,T,4)+c(54,75,28,V)+c(54,75,21,K)+[0,60,120,180,240,300].map(a=>g(54,75,1,p('M0 -4V-20','none',Y,4),a)).join('')+c(54,75,8,O)+p('M85 77H98V53','none',R,6)+c(98,48,7,O)+p('M89 31Q104 25 108 42M93 24Q112 20 114 39','none',Y,2)+flame(98,32,.3)+r(17,116,77,8,B,2));
// 097 — A towering striped tub holds colourful buttered popcorn under a cinema glow.
add('j_popcorn',p('M26 57H93L82 120H38Z',K)+p('M34 58L45 119M50 58L55 120M68 58L66 120M85 58L76 120','none',R,8)+p('M27 58H92M38 120H82','none',I,2)+[[34,51],[51,43],[68,49],[85,48],[43,31],[65,29],[84,29]].map(([x,y],i)=>p(`M${x-7} ${y}Q${x-10} ${y-8} ${x-3} ${y-8}Q${x+2} ${y-17} ${x+6} ${y-8}Q${x+15} ${y-6} ${x+7} ${y+2}Z`,i%2?Y:P)).join('')+star(60,91,.6,T)+p('M15 77L21 81M98 76L105 72','none',V,3));
// 098 — Two lively squirrels add matching acorns to a brick-built autumn store.
add('j_trousers',p('M15 94H104V121H15Z',R)+p('M16 107H103M40 94V107M76 94V107M27 107V121M59 107V121M91 107V121','none',V,2)+p('M19 76Q6 49 25 37Q47 32 40 57L31 63L42 73L42 93H24Z',O)+p('M100 76Q111 49 92 37Q70 32 77 57L87 63L76 73L76 93H95Z',K)+c(30,59,8,Y)+c(88,59,8,Y)+c(31,57,2,I)+c(87,57,2,I)+p('M37 80Q48 70 56 85M81 80Q70 70 62 85','none',T,5)+e(51,86,7,9,G)+e(67,86,7,9,G)+p('M43 82H59M59 82H75','none',V,3));
// 099 — A luminous diamond sits in an ancient turquoise ring guarded by pink vines.
add('j_ancient',c(59,73,43,T)+c(59,73,29,V)+p('M59 30V44M89 42L78 53M102 73H88M89 104L78 93M59 116V102M29 104L40 93M16 73H30M29 42L40 53','none',B,3)+suit('d',59,73,1.5,Y)+p('M59 54V91L47 73Z',O)+p('M19 116Q15 88 29 83M97 116Q103 89 89 82','none',L,4)+midFlower(23,99,.4,K)+midFlower(94,99,.4,K)+spark(90,29,.3,R));
// 100 — A vivid blue ramen bowl spills a single golden stream beside pink chopsticks.
add('j_ramen',e(56,70,40,13,P)+p('M17 70Q21 112 56 113Q91 112 96 70Z',B)+e(56,70,36,10,O)+p('M28 68Q39 58 48 69Q59 81 68 67Q76 58 86 68M29 74Q42 62 52 75Q62 82 80 70','none',Y,2)+p('M36 61L68 25M48 64L83 29','none',K,3)+p('M85 80Q106 83 99 99L94 113','none',Y,4)+e(93,119,13,4,O)+p('M25 89Q56 117 88 89','none',T,4)+c(47,73,7,P)+c(47,73,3,Y)+p('M67 68L76 64M72 77L82 74','none',L,3)+p('M23 50Q17 42 25 34M41 49Q34 39 42 31','none',S,2));

// 101 — Turquoise field radio, scarlet shoulder strap and a bright four/ten dial.
add('j_walkie_talkie',p('M23 47Q7 71 23 108M93 49Q108 75 93 108','none',R,7)+r(23,39,72,78,T,7)+r(30,46,58,24,V,3)+[52,58,64].map(y=>l(36,y,82,y,S,1.7)).join('')+p('M34 38V23M43 38V28','none',Y,5)+c(42,91,14,O)+c(77,91,14,K)+c(42,91,10,Y)+c(77,91,10,P)+t(42,97,'4',18,I)+t(77,96,'10',14,I)+r(40,109,39,8,V,2)+p('M98 31Q105 36 98 42M102 25Q115 36 102 49','none',Y,2));
// 102 — A blue soda siphon bursts into ten sparkling, multicoloured bubbles.
add('j_selzer',p('M28 54Q18 62 18 82V111Q18 120 40 120Q62 120 62 111V82Q62 62 51 54V40H28Z',T)+r(25,33,29,10,V,2)+p('M40 33V24H66L75 37H57V45H49','none',O,5)+p('M60 43Q79 42 86 56','none',S,3)+p('M27 70V104Q27 111 33 111','none',P,3)+r(42,72,12,33,B,3)+[79,90,100,81,99,75,91,103,74,91].map((x,i)=>c(x,[64,70,60,82,87,99,107,103,114,119][i],i%3+3,[Y,K,S,O][i%4],I,1)).join('')+p('M31 65H38M31 72H36M31 79H36M31 86H36M31 93H38M31 100H36M31 107H36','none',Y,1));
// 103 — Cobalt fortress, violet masonry, red banners and a gold drawbridge.
add('j_castle',p('M18 120V59H14V38H24V48H34V38H44V59H39V79H79V59H74V38H84V48H94V38H104V59H99V120Z',B)+r(40,77,38,43,V,1)+p('M49 120V98Q59 82 69 98V120Z',I)+p('M48 120H71L83 126H36Z',O)+r(24,68,8,16,T,4)+r(84,68,8,16,T,4)+p('M29 37V23L49 28L29 33M89 37V23L104 28L89 33',R)+p('M19 95H37M19 109H37M80 95H98M80 109H98M44 85H53M65 85H74','none',S,1.4)+c(59,58,13,Y)+suit('s',59,58,.6,V));
// 104 — Two smiling courtiers lean over a red wax seal, in different bright robes.
add('j_smiley',p('M16 112L20 76Q34 62 48 77L54 112Z',K)+p('M65 112L70 75Q86 62 99 77L103 112Z',B)+c(35,55,16,P)+c(84,55,16,P)+crown(35,32,.82,Y)+crown(84,32,.82,O)+p('M22 47Q35 34 47 47M71 47Q84 34 97 47',V)+p('M28 53H31M39 53H42M77 53H80M88 53H91','none',I,2.2)+p('M28 61Q35 70 43 60M77 60Q84 69 91 60','none',R,2.5)+p('M31 82L47 96M87 82L72 96','none',P,7)+r(45,94,29,8,O,2)+seal(59,113,.47,R)+spark(59,73,.37,Y)+p('M21 92L26 95M96 91L92 96','none',T,3));
// 105 — A brilliant campfire consumes a red sale ribbon and wooden price signs.
add('j_campfire',p('M20 111L91 94M26 94L98 113','none',O,10)+p('M22 109L91 93M27 93L97 112','none',I,1.4)+g(29,67,.86,p('M-10 23V-19H17V1H-10',Y)+t(3,-4,'$',18,V),-19)+g(92,69,.7,p('M-10 23V-20H15V1H-10',K)+t(2,-4,'$',18,I),18)+flame(59,77,1.55)+p('M50 86Q36 69 53 50Q50 72 64 73Q77 74 64 98Z',Y)+p('M28 35L23 26M84 32L89 23M59 32V24','none',R,3)+spark(31,45,.27,T)+spark(88,45,.29,V));
// 106 — Orange cash register with rainbow keys and four tumbling gold coins.
add('j_ticket',p('M21 112V66L34 56H86L100 69V112Z',O)+r(30,38,58,25,V,3)+r(36,43,46,15,Y,1)+t(59,55,'4',13,I)+r(30,69,50,25,P,2)+Array.from({length:8},(_,i)=>r(35+(i%4)*10,73+Math.floor(i/4)*10,7,7,[R,T,K,B][i%4],1,I,1)).join('')+r(84,71,10,27,B,2)+r(26,101,69,12,V,2)+r(51,105,19,4,Y,1)+[24,47,72,96].map((x,i)=>coin(x,119-i%2*4,.78)).join('')+p('M91 40L102 34L103 55L94 61',Y)+spark(22,38,.3,K));
// 107 — Cheerful skeletal ringmaster keeps the turquoise rescue gauge at one quarter.
add('j_mr_bones',p('M22 72L13 110H52L44 72Z',V)+p('M29 72L34 105L40 72',K)+c(34,51,17,P)+e(28,49,4,5,I)+e(40,49,4,5,I)+p('M33 55L30 61H37Z',O)+r(25,64,18,8,P,2)+p('M30 64V71M36 64V71M28 82H42M30 91H39','none',I,1.3)+p('M24 82L15 70L18 60M43 82L60 75','none',P,5)+p('M26 110L22 121M42 110L48 121','none',Y,5)+p('M55 84A26 26 0 1 1 101 84','none',B,10)+p('M55 84A26 26 0 0 1 55 58','none',L,10)+p('M78 69L57 58','none',R,4)+c(78,69,5,Y)+t(81,101,'¼',25,Y)+p('M16 33Q34 19 53 33L47 39H20Z',T)+r(25,22,19,12,T,2));
// 108 — A coral-suited acrobat leaps through a golden circus hoop trailing ribbons.
add('j_acrobat',e(77,70,24,42,'none',O,8)+e(77,70,18,36,'none',Y,2)+p('M73 113V123M62 124H92','none',V,5)+p('M15 47Q31 53 43 45M14 66Q31 73 43 60M16 84Q31 89 45 77','none',T,4)+g(56,66,1.05,p('M-12 -8L4 -14L14 0L-5 8Z',K)+c(19,-7,7,P)+p('M-7 -4L-25 -13L-34 -5M7 -8L22 -26L34 -22M-8 6L-20 21L-34 20M0 7L10 22L23 18','none',B,6)+p('M-9 -6L7 2','none',Y,3),33)+star(25,34,.36,Y)+star(99,110,.24,K));
// 109 — Comedy and tragedy performers emerge together from a purple theatre.
add('j_sock_and_buskin',r(14,27,90,95,V,3)+p('M14 27H47Q47 58 29 69L38 116H14ZM104 27H74Q74 58 91 69L82 116H104Z',R)+p('M22 35V57M96 35V57','none',O,3)+p('M32 108Q31 84 43 79L56 84L60 113Z',T)+p('M58 113L61 84L76 78Q89 86 86 111Z',K)+mask(45,61,.7,Y)+g(73,62,.69,p('M-17 -20Q0 -24 17 -20L15 7Q9 23 0 24Q-12 20 -15 7Z',S)+p('M-11 -6L-4 -4M5 -4L12 -6M-7 13Q0 20 8 12','none',I,2))+r(13,115,92,9,O,1)+[23,43,63,83,99].map(x=>c(x,120,2,Y,I,.7)).join(''));
// 110 — A flamboyant pirate and three companions share a treasure bowl.
add('j_swashbuckler',p('M22 91Q17 69 34 62L45 70L48 102Z',T)+p('M72 100L76 69L89 63Q103 73 98 92Z',V)+c(34,48,12,P)+c(87,49,12,P)+p('M20 45L34 32L49 45Z',R)+p('M73 44L87 31L102 44Z',K)+p('M36 50H42M79 50H84','none',I,3)+p('M38 82L53 90M79 82L65 90','none',P,6)+p('M28 91H91Q86 113 59 114Q31 109 28 91Z',O)+e(59,91,32,8,Y)+coin(46,88,.62)+coin(68,89,.7)+c(58,49,16,P)+p('M35 41Q59 16 82 41L67 46H47Z',B)+p('M49 47L56 49M63 49H69','none',I,2)+p('M53 58Q60 63 67 57','none',R,2)+p('M50 66H68L75 85H43Z',R));
// 111 — Colourful street musician fans eight ribbons from the neck of a lute.
add('j_troubadour',p('M19 51Q29 22 49 40Q63 18 76 38Q98 24 101 54Q87 44 78 57Q65 44 54 59Q39 46 19 51Z',K)+p('M23 48Q33 32 45 43M57 43Q66 31 76 43M81 44Q91 33 98 44','none',Y,4)+c(57,56,14,P)+p('M43 52Q55 32 73 50Z',V)+p('M46 73L69 72L84 111L35 116Z',T)+p('M37 87L25 100M76 83L90 72','none',P,6)+e(67,100,20,24,O)+c(65,101,6,I)+p('M73 91L94 61L99 65L80 98Z',Y)+p('M57 89L79 113M52 94L74 118','none',P,1)+p('M44 113L38 124M73 118L81 124','none',V,6)+p('M19 77V62L30 59V74M19 77Q13 73 13 79Q16 85 19 77M30 74Q24 71 24 77Q27 82 30 74',Y));
// 112 — Monumental red hand stamp leaves a cobalt rosette on a curled certificate.
add('j_certificate',p('M21 79Q60 69 95 80L99 117Q62 125 22 116L19 110L25 104L20 98Z',Y)+p('M28 90H68M29 97H64M29 104H52','none',O,2)+seal(78,105,.58,B)+p('M68 116L64 125L77 121L85 126L87 116',K)+p('M39 68V56Q25 42 42 30Q58 20 75 30Q93 42 79 56V68Z',R)+r(30,66,59,14,V,3)+r(35,79,48,6,O,1)+p('M45 37Q58 31 71 38','none',P,3)+spark(97,53,.35,T)+spark(20,60,.3,K));
// 113 — Two paint tubes pour scarlet and midnight blue into a vivid double spiral.
add('j_smeared',g(30,43,1,p('M-10 -17H10L13 14L8 23H-8L-13 14Z',R)+r(-10,-21,20,7,Y,1)+r(-7,-10,14,12,P,1)+suit('h',0,-4,.34,R),-30)+g(88,43,1,p('M-10 -17H10L13 14L8 23H-8L-13 14Z',B)+r(-10,-21,20,7,T,1)+r(-7,-10,14,12,P,1)+suit('c',0,-4,.34,V),30)+p('M36 63Q73 56 92 79Q111 104 79 116Q52 125 31 111Q12 98 24 83Q39 63 64 84Q78 98 60 103','none',R,12)+p('M83 63Q45 58 28 80Q9 104 41 116Q67 124 88 109Q105 95 92 82Q76 67 54 84Q40 99 58 103','none',B,10)+c(58,103,7,K)+spark(59,54,.35,Y));
// 114 — A scarlet road curls around two violet mountains beneath a sunrise.
add('j_throwback',c(80,41,20,Y)+p('M14 78L39 35L63 78Z',V)+p('M52 102L84 58L105 100Z',B)+p('M33 46L39 35L46 48L40 45Z',S)+p('M77 68L84 58L91 72L84 68Z',T)+p('M18 122Q62 120 53 97Q46 78 24 81Q8 63 23 30M54 97Q56 70 80 75Q106 80 101 34','none',R,12)+p('M18 122Q62 120 53 97Q46 78 24 81M54 97Q56 70 80 75Q106 80 101 34','none',Y,1.6)+p('M21 109L28 100L32 110ZM93 100L97 90L104 102Z',L)+spark(100,29,.27,K));
// 115 — A brass stamp prints three vivid scarlet hands across a blue workshop floor.
add('j_hanging_chad',p('M18 53Q15 33 33 29Q51 26 51 44L47 61H22Z',O)+p('M19 56L50 62L48 73L17 67Z',V)+p('M24 36Q34 31 42 39','none',Y,3)+g(47,82,.6,p('M-12 19V1L-16 -6Q-18 -12 -13 -11L-7 -5V-19Q-5 -25 -2 -19V-4L2 -23Q5 -26 6 -20L5 -3L10 -18Q14 -20 14 -14L11 5L15 3Q21 4 17 10L7 20Z',R),-23)+g(70,99,.62,p('M-12 19V1L-16 -6Q-18 -12 -13 -11L-7 -5V-19Q-5 -25 -2 -19V-4L2 -23Q5 -26 6 -20L5 -3L10 -18Q14 -20 14 -14L11 5L15 3Q21 4 17 10L7 20Z',K),-23)+g(94,112,.55,p('M-12 19V1L-16 -6Q-18 -12 -13 -11L-7 -5V-19Q-5 -25 -2 -19V-4L2 -23Q5 -26 6 -20L5 -3L10 -18Q14 -20 14 -14L11 5L15 3Q21 4 17 10L7 20Z',O),-23)+p('M39 52Q72 38 92 62','none',T,4)+spark(84,42,.4,Y));
// 116 — Enormous coral diamond breaks into pink facets and gold coins.
add('j_rough_gem',p('M27 42L45 25H76L94 43L61 90Z',K)+p('M27 42H94L76 25L70 43L61 90L48 43L45 25',R)+p('M29 42L48 43L61 90M48 43L59 26L70 43H92','none',Y,2)+p('M33 84L23 95L40 100ZM72 93L85 105L92 87Z',V)+coin(24,117,.9)+coin(56,110,1.1)+coin(91,119,.87)+spark(18,57,.27,T)+spark(103,65,.3,Y)+p('M46 96L43 102M76 111L72 117','none',O,2));
// 117 — Emerald geode splits around a luminous pink heart with a golden right half.
add('j_bloodstone',p('M20 49L40 28L77 26L100 48L103 90L80 117L39 121L16 93Z',T)+p('M28 55L45 38L74 37L91 54L91 87L72 107L43 109L28 87Z',V)+suit('h',59,73,2.05,K)+p('M60 56Q69 40 80 50Q102 67 60 101Z',Y)+p('M59 27L54 42L61 57L56 71L63 86L58 103L64 120','none',I,2.5)+p('M23 65L31 60M87 43L94 52M24 98L37 110M84 108L95 94','none',L,3)+spark(78,68,.38,O));
// 118 — Purple spade-headed pickaxe opens turquoise ground full of cobalt treasure.
add('j_arrowhead',p('M13 99L34 90L53 98L78 87L105 99V124H13Z',T)+p('M13 111H105V124H13Z',V)+p('M20 108L30 104L38 110M80 106L88 101L100 106','none',Y,3)+chips(42,119,3,.8)+chips(80,118,3,.8)+p('M47 101L78 45','none',O,8)+g(76,44,1.15,suit('s',0,0,1.5,V)+p('M0 -17V12L-9 3M0 6L9 0','none',K,2),26)+p('M33 94L21 87M53 89L61 82M51 104L61 112','none',Y,3)+spark(46,96,.4,Y));
// 119 — Dark amethyst onyx exposes a green club and exactly seven crimson sunrays.
add('j_onyx_agate',rays(59,73,43,7,R)+p('M24 53L44 31L78 32L97 53L98 89L77 112L42 113L21 88Z',V)+p('M24 53L45 45L44 31M45 45L76 44L78 32M76 44L88 69L98 89M88 69L76 99L77 112M76 99L43 100L42 113M43 100L32 75L21 88',B)+p('M45 45L76 44L88 69L76 99L43 100L32 75Z',I)+suit('c',59,72,1.75,L)+p('M48 55L42 64M79 81L73 92','none',T,2)+c(59,75,5,Y));
// 120 — Broken cyan glass grows into a multicoloured crystal garden.
add('j_glass',p('M15 115L30 103L42 111L59 103L79 112L99 100L105 120Z',V)+p('M24 110L20 64L33 44L45 64L42 115L34 122Z',T)+p('M44 115L46 54L59 31L73 55L70 119L58 125Z',K)+p('M72 115L77 43L92 23L104 46L98 117L86 125Z',B)+p('M33 45L32 118M21 64L33 72L45 64M59 32V121M47 55L59 65L72 55M92 24L87 122M78 44L91 55L104 46','none',S,2)+p('M14 85L24 91L16 99ZM69 34L77 27L73 44ZM49 98L41 91L44 107Z',Y)+spark(24,34,.28,O));
// 121 — A circus printing drum releases three identical bright red toy birds.
add('j_ring_master',r(17,29,85,37,V,5)+r(25,36,69,20,T,2)+p('M29 43H91M29 50H91','none',S,2)+c(28,65,9,O)+c(91,65,9,O)+p('M28 65H91','none',I,5)+[30,59,89].map((x,i)=>g(x,95+i%2*10,.7,p('M-14 10Q-22 -3 -10 -10L-1 -9Q0 -22 12 -18Q22 -13 15 -4L24 1L14 5Q8 24 -9 20L-22 24Z',R)+p('M-12 5Q-2 -5 9 2Q6 14 -12 5Z',K)+p('M16 -9L25 -5L17 -2Z',Y)+c(10,-11,2,I)+p('M-6 20V27M4 20V27','none',O,2))).join('')+p('M18 124H102','none',T,4)+spark(59,25,.26,Y));
// 122 — Four lush petals carry the suits as organic shapes above a scarlet flowerpot.
add('j_flower_pot',p('M59 106V63M58 91Q34 69 22 86Q32 103 58 99M60 89Q82 68 99 85Q85 101 60 98',L)+p('M59 63Q35 47 44 29Q59 13 73 29Q83 45 59 63Z',K)+p('M59 63Q77 35 95 45Q113 61 96 76Q78 86 59 63Z',O)+p('M59 63Q83 81 73 98Q57 110 44 96Q35 80 59 63Z',B)+p('M59 63Q39 86 22 74Q6 57 23 43Q41 34 59 63Z',V)+suit('h',59,36,.65,R)+suit('d',89,59,.65,Y)+suit('s',59,88,.65,S)+suit('c',28,59,.6,T)+c(59,63,11,Y)+p('M39 106H80L74 124H45Z',R)+r(36,103,47,7,O,1)+p('M48 111L51 120','none',P,2));
// 123 — A blueprint robot reaches toward its living gold counterpart.
add('j_blueprint',r(13,29,45,91,B,2)+p('M19 36H52M19 113H52M19 36V113M52 36V113M20 55H52M20 75H52M20 95H52M30 36V113M42 36V113','none',T,.7)+r(25,51,20,21,'none',3,S,2)+c(31,60,2,S)+c(40,60,2,S)+p('M30 68H40M35 73V91M23 82H48M35 91L26 105M35 91L44 105','none',S,2.5)+r(72,46,28,28,Y,5)+c(80,58,3,V)+c(92,58,3,V)+p('M79 67H93','none',R,3)+p('M73 77H99L104 103H69Z',O)+p('M75 103L71 120M96 103L102 120M74 84L61 74','none',T,6)+p('M58 61H68M63 56L70 61L63 66','none',K,3)+c(86,87,6,K));
// 124 — A tiny pink sprout labelled two grows into a towering cobalt beanstalk.
add('j_wee',p('M19 121Q59 113 103 121Z',V)+p('M61 118Q42 91 63 73Q78 57 66 32','none',L,9)+p('M61 99Q38 104 29 85Q47 75 61 99M57 80Q77 84 91 65Q72 54 57 80M68 57Q43 60 36 39Q57 34 68 57',T)+chips(72,118,15,.78)+c(25,109,11,K)+t(25,115,'2',17,Y)+p('M18 97L16 90M32 96L36 91','none',Y,2)+spark(66,29,.4,Y)+p('M82 43L89 31M34 66L24 58','none',O,2));
// 125 — A gleeful juggler struggles to hold three enormous coloured circus balls.
add('j_merry_andy',c(27,45,16,T)+c(60,35,17,K)+c(93,49,16,O)+star(27,45,.36,Y)+star(60,35,.4,Y)+star(93,49,.36,Y)+c(59,75,14,P)+p('M43 67L49 48L59 57L72 48L76 67Z',V)+c(59,77,4,R)+p('M50 83Q59 92 68 82','none',R,2)+p('M43 94L75 94L84 120H34Z',B)+p('M43 100L24 77L21 63M75 99L94 81L96 67','none',L,7)+p('M47 96L59 109L70 95',Y)+c(59,115,3,K)+p('M26 109L18 114M94 106L104 112','none',R,2));
// 126 — Two bright dice tumble through a golden horseshoe with multicoloured sparks.
add('j_oops',p('M24 42Q10 92 32 112Q59 137 87 111Q109 87 94 42L76 47Q87 81 76 96Q59 112 43 95Q32 80 43 47Z',O)+p('M29 49Q19 86 35 105M87 49Q99 86 83 105','none',Y,3)+[57,74,91].map(y=>c(27,y,2.4,V)).join('')+[57,74,91].map(y=>c(91,y,2.4,V)).join('')+g(43,60,.93,r(-17,-17,34,34,K,5)+[[-9,-9],[9,-9],[-9,0],[9,0],[-9,9],[9,9]].map(([x,y])=>c(x,y,2.2,Y,I,.5)).join(''),-19)+g(77,75,.96,r(-17,-17,34,34,T,5)+[[-9,-9],[9,-9],[-9,0],[9,0],[-9,9],[9,9]].map(([x,y])=>c(x,y,2.2,B,I,.5)).join(''),19)+spark(58,29,.35,Y)+spark(16,113,.26,K)+spark(102,116,.26,L));
// 127 — A crowned lucky idol wears a heart bullseye pierced by a single arrow.
add('j_idol',p('M34 119L30 75Q31 50 59 48Q87 51 88 75L84 119Z',V)+p('M41 117V87H77V117Z',B)+c(59,73,25,O)+c(59,73,18,Y)+c(59,73,11,R)+suit('h',59,73,.6,P)+crown(59,39,1,Y)+p('M42 104H76M46 112H71','none',T,3)+p('M101 36L66 67','none',I,3)+p('M100 36L104 25L108 31L101 42Z',K)+p('M66 63L63 70L71 67Z',S)+p('M34 54L24 46M85 54L97 47','none',Y,2));
// 128 — A green club spirit and a coral heart spirit shake hands across an oval mirror.
add('j_seeing_double',e(59,72,41,49,V)+e(59,72,35,43,T)+p('M30 100L40 80H49L53 116H23Z',L)+p('M70 116L72 79H83L97 101L100 116Z',K)+suit('c',39,56,1.08,L)+suit('h',80,57,1.07,R)+p('M36 82L50 91L59 86L69 92L83 81','none',P,7)+p('M51 91L57 98L64 96L70 91L63 86L59 88L56 84Z',Y)+p('M32 36L28 48M90 94L85 107','none',S,3)+c(59,124,5,O)+p('M41 124H77','none',O,4));
// 129 — A cobalt bull with gold horns charges a bright matador's scarlet cape.
add('j_matador',p('M16 78Q18 61 41 64L57 78L50 103H40L39 88H29L25 105H15L19 86Z',B)+p('M41 65L55 54L70 59L73 74L59 83L49 76Z',V)+p('M56 57Q43 43 51 39L61 52M66 58Q83 44 82 53L73 65','none',Y,5)+c(62,66,2.5,P)+p('M63 76L72 75','none',K,2)+p('M75 42Q96 34 103 56L96 77Q106 98 85 113L69 87L76 66L67 50Z',R)+p('M82 47L93 53L84 70M78 86L89 102','none',K,3)+c(90,31,7,P)+p('M81 36L88 46L100 39L97 33Z',O)+coin(100,94,.55)+coin(98,119,.6)+coin(69,118,.65)+p('M14 120H58','none',L,3));
// 130 — Three young court travellers carry colourful packs along a winding scarlet road.
add('j_hit_the_road',p('M15 124Q10 96 52 81Q91 65 82 26H99Q114 77 64 97Q40 108 45 124Z',R)+p('M30 124Q22 100 59 89Q105 72 91 27','none',Y,2)+g(33,83,.9,c(0,-19,8,P)+p('M-10 -11H8L13 14H-13Z',T)+p('M-9 -25L-11 -34L0 -30L9 -35L12 -23Z',V)+r(-18,-10,11,22,K,3)+p('M-7 13L-13 34M5 13L14 31','none',I,4))+g(71,59,.7,c(0,-19,8,P)+p('M-10 -11H8L13 14H-13Z',O)+p('M-9 -25L-11 -34L0 -30L9 -35L12 -23Z',B)+r(-18,-10,11,22,L,3)+p('M-7 13L-13 34M5 13L14 31','none',I,4))+g(88,35,.43,c(0,-19,8,P)+p('M-10 -11H8L13 14H-13Z',K)+p('M-9 -25L-11 -34L0 -30L9 -35L12 -23Z',V)+p('M-7 13L-13 34M5 13L14 31','none',I,4))+p('M17 65L25 61M17 72L29 68','none',T,3));
// 131 — Two brightly coloured singing bells ring between oversized tuning forks.
add('j_duo',p('M18 35V70Q18 82 29 82Q40 82 40 70V35M29 82V118M78 35V70Q78 82 89 82Q100 82 100 70V35M89 82V118','none',T,6)+p('M37 76Q40 49 49 50Q61 49 63 76Z',K)+p('M59 76Q62 49 73 50Q84 49 87 76Z',O)+e(50,76,14,5,Y)+e(73,76,14,5,Y)+c(50,83,5,V)+c(73,83,5,V)+p('M47 47Q50 40 53 47M70 47Q73 40 76 47','none',Y,3)+p('M46 97Q61 109 78 97M45 105Q62 117 79 105','none',R,3)+p('M12 43V62M106 43V62','none',Y,2)+star(61,29,.3,L));
// 132 — Three jewel-bright birds sing from the corners of a scarlet triangular perch.
add('j_trio',p('M59 34L99 110H18Z','none',R,8)+p('M59 42L91 104H27Z','none',Y,2)+[[59,41,K],[28,101,T],[91,101,O]].map(([x,y,col],i)=>g(x,y,.67,p('M-13 4Q-21 -9 -11 -17Q1 -25 12 -14L16 -6L25 -2L15 3Q11 19 -7 20L-23 24L-16 9Z',col)+p('M-12 2Q-2 -8 10 -2Q4 12 -12 2Z',V)+p('M16 -7L25 -2L16 2Z',Y)+c(8,-13,2,I)+p('M-5 19V26M4 18V26','none',I,2))).join('')+spark(59,84,.55,Y)+p('M48 75Q59 64 71 75','none',T,2));
// 133 — Four huge colourful chess rooks form a square around a ruby wax crest.
add('j_family',seal(59,75,1.55,R)+[[35,48,T],[82,48,K],[35,100,O],[82,100,B]].map(([x,y,col])=>g(x,y,.65,p('M-17 -22H-9V-14H-3V-22H4V-14H10V-22H18V-4H11L8 16H16V23H-16V16H-8L-11 -4H-17Z',col)+p('M-9 -3H10M-8 16H8','none',Y,2))).join('')+crown(59,75,.7,Y)+spark(59,31,.3,L)+p('M15 74H25M94 74H104','none',Y,3));
// 134 — Five vivid train carriages climb a working mechanical chain track.
add('j_order',gear(30,99,.65)+gear(88,99,.65)+p('M28 80H90Q109 99 90 117H28Q8 99 28 80Z','none',V,7)+p('M28 80H90Q109 99 90 117H28Q8 99 28 80Z','none',Y,2)+[19,37,55,73,91].map((x,i)=>g(x,61-i*5,.85,r(-9,-14,18,23,[R,O,Y,L,T][i],2)+r(-6,-10,12,9,B,1,I,1)+c(-5,12,3,V)+c(5,12,3,V)+t(0,6,i+2,8,I))).join('')+p('M15 78L101 53','none',I,3)+p('M27 120H92','none',T,3)+spark(31,32,.35,K));
// 135 — Five cobalt mushrooms form a living circle over rippling crimson resonance.
add('j_tribe',e(59,98,45,23,'none',R,4)+e(59,98,34,16,'none',K,3)+e(59,98,23,10,'none',O,2)+[[25,70,.8],[43,48,.85],[67,42,.95],[91,65,.82],[59,89,1]].map(([x,y,s])=>g(x,y,s,p('M-6 4H6L10 29H-10Z',T)+p('M-22 4Q-18 -24 0 -24Q20 -23 23 4Z',B)+c(-10,-4,4,S)+c(6,-12,5,V)+c(14,-2,3,Y)+p('M-18 5H18','none',I,2))).join('')+spark(20,31,.28,Y)+spark(99,34,.3,K));
// 136 — A magenta stunt rider balances a giant stack of chips on a small unicycle.
add('j_stuntman',c(56,111,13,V)+c(56,111,9,T)+p('M56 99V92M46 94H67','none',Y,5)+p('M45 83L33 96L48 103L57 91L66 101L77 93','none',O,6)+p('M42 70L62 67L70 86L49 91Z',K)+c(52,57,9,P)+p('M42 55Q46 39 61 49L64 55Z',B)+p('M46 70L31 65L30 49M62 71L78 63L82 49','none',T,6)+chips(59,43,4,1.2)+p('M20 125H93','none',I,3)+star(93,91,.35,Y)+p('M21 93L30 90M87 65L99 60','none',R,3));
// 137 — A transparent turquoise phantom steps out of a clock at the second chime.
add('j_invisible',c(36,51,25,V)+c(36,51,20,Y)+p('M36 51V35M36 51L48 57','none',I,3)+c(36,27,3,R)+c(60,51,3,R)+p('M17 51H21M36 67V71','none',O,2)+p('M55 114V79Q52 65 64 56Q78 47 91 59Q102 67 99 82L104 112L94 107L84 116L75 108L65 119Z',T)+p('M67 79Q69 70 74 75M84 75Q90 70 92 78','none',V,3)+e(79,91,5,7,B)+p('M65 65Q70 56 78 58M61 94V105','none',S,3)+p('M19 94Q23 111 42 109','none',K,4)+spark(45,121,.3,O));
// 138 — A flamboyant jester confronts his full-size turquoise mirror double.
add('j_brainstorm',e(85,75,21,43,V)+e(85,75,16,37,T)+g(85,78,.6,p('M-17 33L-13 2H12L18 33Z',B)+c(0,-10,12,S)+p('M-14 -15L-17 -32L0 -24L13 -32L15 -15Z',V)+c(-5,-10,2,I)+c(5,-10,2,I))+p('M18 116L22 75L47 72L59 116Z',K)+c(35,57,16,P)+p('M18 48L15 27L34 39L50 25L53 47Z',R)+c(15,27,4,Y)+c(50,25,4,Y)+p('M29 56H32M39 56H43M29 64Q36 72 44 63','none',I,2)+p('M46 82L63 80L69 70','none',O,7)+p('M35 78L40 110L25 105Z',Y)+p('M85 29Q59 17 34 29','none',O,3)+spark(62,30,.27,L));
// 139 — Silver-and-orange satellite harvests gold against three jewel-coloured planets.
add('j_satellite',c(25,41,14,K)+p('M17 31Q28 37 34 48','none',R,3)+c(93,40,14,V)+e(93,40,20,5,'none',Y,2)+c(26,111,10,L)+g(64,76,.92,r(-11,-15,22,31,O,3)+r(-37,-12,23,25,B,1)+r(15,-12,23,25,B,1)+p('M-31 -12V13M-23 -12V13M21 -12V13M29 -12V13M-37 0H-14M15 0H38','none',T,1.2)+p('M0 -15V-27M-8 -29Q0 -18 8 -29','none',S,3)+c(0,1,7,Y),-18)+coin(44,50,.55)+coin(87,96,.6)+coin(48,116,.55)+p('M36 45L42 48M92 56L82 64M34 107L44 101','none',Y,2)+star(56,29,.25,S));
// 140 — Two splendid queens deliberate beneath a moon around a round gold table.
add('j_shoot_the_moon',p('M17 94L20 63Q30 52 43 63L48 94Z',K)+p('M71 94L75 63Q88 52 99 63L103 94Z',V)+c(33,46,13,P)+c(87,46,13,P)+crown(33,27,.72,Y)+crown(87,27,.72,O)+p('M22 40Q32 28 44 41M76 40Q88 29 98 41',B)+p('M27 47H30M37 47H40M81 47H84M90 47H93','none',I,1.8)+p('M31 69L48 82M89 69L73 82','none',P,6)+e(59,91,43,14,O)+e(59,87,43,13,Y)+p('M26 99L22 121M93 99L99 121','none',V,5)+p('M43 88L55 94L48 102M77 88L64 95L72 103','none',R,3)+c(59,49,12,T)+p('M63 38Q47 48 64 59Q42 58 47 43Q52 36 63 38Z',Y));
// 141 — A vivid licence badge carries a tiny driver and sixteen jewel-like endorsements.
add('j_drivers_license',g(59,77,1,r(-45,-39,90,78,T,6)+r(-39,-32,25,39,V,3)+c(-26,-18,7,P)+p('M-36 1L-33 -8H-20L-16 1Z',K)+p('M-33 -24L-27 -30L-19 -25',Y)+l(-38,17,-16,17,B,3)+l(-38,24,-20,24,B,2)+Array.from({length:16},(_,i)=>{const x=-5+(i%4)*12,y=-28+Math.floor(i/4)*15;return p(`M${x} ${y-5}L${x+5} ${y}L${x} ${y+5}L${x-5} ${y}Z`,[Y,O,K,L][i%4],I,1)}).join('')+r(-8,30,45,7,B,1),-8)+p('M48 33V24H72V32','none',O,5)+spark(102,32,.3,Y));
// 142 — A violet seer raises a glowing orb before gold gates, without a tarot card.
add('j_cartomancer',p('M16 119V40L59 24L103 40V119Z',B)+p('M16 40L37 48V117L16 111ZM103 40L82 48V117L103 111Z',O)+p('M22 50L31 53V104L22 101ZM97 50L88 53V104L97 101Z','none',Y,2)+p('M35 119L42 75L60 64L78 76L86 119Z',V)+p('M41 76L59 42L79 76Z',K)+c(59,74,11,P)+p('M51 74H55M63 74H67','none',I,2)+p('M47 92L37 91M71 92L82 91','none',P,6)+c(59,102,17,T)+c(59,102,11,B)+star(59,101,.42,Y)+spark(59,30,.27,Y));
// 143 — A celestial gift box opens beneath bright planets and a shower of golden stars.
add('j_astronomer',c(27,41,15,T)+e(27,41,22,5,'none',Y,2)+c(89,39,16,K)+p('M82 26Q71 40 84 52','none',O,4)+p('M28 82L60 70L92 82L89 115L59 126L31 115Z',V)+p('M59 93V125M29 82L59 93L91 82','none',I,2)+p('M52 75V123M64 76V122','none',Y,5)+p('M28 81L17 63L48 51L59 71ZM92 81L104 63L73 51L60 71Z',B)+p('M59 70Q42 59 47 47Q61 45 59 70Q60 47 73 47Q80 58 59 70',Y)+star(59,38,.32,Y)+star(27,103,.27,L)+star(96,96,.28,T)+price(91,67,'0',.7));
// 144 — A phoenix rises from discarded paper ashes, leaving a glowing new lesson.
add('j_burnt',p('M20 120L33 109L52 115L71 108L98 121Z',V)+p('M29 104L20 91L35 98L31 82L45 91L46 73L59 85L75 70L73 91L95 77L84 102Z',O)+p('M56 107Q30 82 18 54Q40 56 55 73Q54 47 70 40Q86 34 91 49L102 53L88 59Q73 56 72 77Q88 64 103 67Q98 92 70 110Z',R)+p('M24 60Q41 68 55 86M97 73Q83 84 70 92','none',Y,4)+p('M57 109L48 123L61 117L74 124L68 108Z',K)+c(81,47,2,Y)+p('M88 47L102 53L89 56Z',Y)+spark(36,37,.37,T)+spark(59,29,.26,Y));
// 145 — Five gold coins feed twin colourful bellows that blow two red sparks.
add('j_bootstraps',[[24,38],[59,28],[94,38],[40,58],[78,58]].map(([x,y])=>coin(x,y,.8)).join('')+p('M24 49L38 76H80L94 49M59 39V76','none',O,5)+p('M28 79L42 73L59 87L76 73L92 79L82 102H36Z',V)+p('M38 80L48 100M48 78L58 101M61 80L70 101M72 78L81 96','none',K,4)+p('M39 98L27 108M79 98L91 108','none',T,6)+spark(26,113,.62,R)+spark(92,113,.62,R)+p('M47 87H72','none',Y,2));
// 146 — A scarlet court spectre rises from broken gold crowns in violet flame.
add('j_caino',p('M19 118Q7 91 29 63Q22 87 41 88Q33 58 52 34Q49 64 69 69Q87 57 88 35Q109 67 90 101L103 119Z',V)+p('M34 112L40 78L50 70L68 70L80 81L85 111L64 103L60 122L52 105Z',R)+p('M46 72L49 54Q39 43 46 32Q57 19 70 31Q80 42 70 54L73 71Z',K)+p('M45 34L48 22L58 28L70 22L74 35Z',Y)+p('M49 42L55 45M64 45L70 41M53 52Q59 57 66 51','none',I,2)+p('M48 79L59 93L72 79L60 106Z',O)+crownBroken(27,116,.7)+crownBroken(89,116,.7)+spark(23,54,.36,T)+spark(101,55,.3,Y));
// 147 — A king and queen, fully embodied in ruby and cobalt robes, share twin suns.
add('j_triboulet',p('M15 122L20 79L42 69L57 84L60 122Z',B)+p('M60 122L64 84L79 69L101 79L105 122Z',K)+c(36,59,16,P)+c(82,59,16,P)+p('M20 50Q32 35 49 48L48 58L40 52L27 58Z',V)+p('M66 55Q66 39 82 41Q99 41 99 61L89 53L78 56Z',R)+crown(36,31,.92,Y)+crown(82,31,.92,O)+p('M30 60H33M39 60H42M76 60H79M87 60H90','none',I,2)+p('M27 78L37 98L48 78M70 80L81 101L92 79',Y)+p('M24 96L49 106M72 108L96 95','none',T,4)+p('M48 94L58 102L70 93','none',P,6)+rays(36,38,15,7,O)+rays(82,38,15,7,Y));
// 148 — A grinning skull jester holds the bright twenty-third mechanical counter.
add('j_yorick',p('M19 118L23 82L44 70L74 70L98 82L103 118Z',V)+p('M25 85L39 93L29 113M94 85L80 94L89 114','none',K,9)+c(59,51,21,P)+e(51,48,5,6,I)+e(68,48,5,6,I)+p('M59 53L54 61H64Z',O)+r(47,66,25,7,Y,2)+p('M53 66V72M60 66V72M67 66V72','none',I,1.4)+p('M36 41L29 23L48 29L60 21L72 30L91 24L82 43Z',R)+c(29,23,4,Y)+c(91,24,4,Y)+r(32,87,55,30,T,4)+r(38,92,43,20,I,2)+t(59,109,'23',21,Y)+p('M23 110L34 106M94 110L84 106','none',P,7));
// 149 — A turquoise jester breaks the boss's scarlet lock and casts down its crown.
add('j_chicot',p('M18 121L23 84L39 73L59 85L65 121Z',T)+c(40,59,16,P)+p('M22 51L18 29L39 40L57 25L60 50Z',V)+c(18,29,4,Y)+c(57,25,4,Y)+p('M32 58H36M43 58H47M33 67Q40 74 48 65','none',I,2)+p('M36 79L43 104L52 83',K)+p('M56 89L69 74M25 92L16 98','none',O,7)+p('M74 73V51Q75 34 89 34Q104 35 103 51V61','none',R,7)+p('M66 74L75 66L83 73L88 68L103 79L99 103L75 107L64 94Z',R)+p('M85 69L80 83L88 89L82 106','none',Y,4)+c(89,86,4,I)+g(89,118,.68,crown(0,0,1,Y),19)+spark(66,56,.4,Y));
// 150 — A lilac alchemist conjures a self-standing midnight twin from a turquoise flask.
add('j_perkeo',p('M65 118L68 76L87 67L103 80L107 118Z',V)+c(86,55,16,B)+p('M70 47L67 25L86 36L101 23L104 47Z',I)+c(80,55,2,T)+c(91,55,2,T)+p('M80 63Q86 68 93 62','none',T,2)+p('M16 121L20 82L37 71L54 82L61 121Z',K)+c(37,59,15,P)+p('M21 50L17 30L36 40L54 26L57 50Z',V)+c(17,30,4,Y)+c(54,26,4,Y)+p('M30 58H33M40 58H44M30 65Q37 71 45 64','none',I,2)+p('M23 91L35 103M52 90L64 93','none',O,7)+p('M54 93L60 81V70H71V81L80 97Q76 110 65 110Q53 108 54 93Z',T)+p('M57 94Q68 88 77 96L75 104H60Z',L)+star(66,93,.25,Y)+p('M66 67Q52 57 63 48Q75 39 83 45','none',T,3)+spark(68,35,.3,Y));

const escapeXml=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
export function jokerArtworkSvg(id){
  if(!Object.hasOwn(JOKER_SCENES,id))return null;
  const identity=JOKER_IDENTITIES[id],scene=JOKER_SCENES[id];
  const [sky,floor]=GROUNDS[JOKER_BACKDROPS[id]];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118 138" data-joker-id="${escapeXml(id)}" aria-hidden="true"><title>${escapeXml(identity.name)}</title><rect x="1" y="1" width="116" height="136" rx="5" fill="${sky}" stroke="${I}" stroke-width="2"/><path d="M5 120Q54 107 113 120V131Q113 133 110 133H8Q5 133 5 130Z" fill="${floor}"/><rect x="5" y="5" width="108" height="128" rx="3" fill="none" stroke="${P}" stroke-width="1"/><rect x="44" y="5" width="30" height="13" rx="5" fill="${P}"/>${t(59,14,String(identity.number).padStart(3,'0'),8,I)}<g stroke-linecap="round" stroke-linejoin="round">${scene}</g></svg>`;
}
