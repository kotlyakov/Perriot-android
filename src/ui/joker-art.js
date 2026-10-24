import {JOKER_IDENTITIES} from '../content/joker-identities.js';
import {P,I,R,B,G,S,group as g,path as p,rect as r,circle as c,ellipse as e,line as l,text as t,hatch as h,rays,spark,star,suit,card,cards,coin,chips,token,flame,crown,face,portrait,mask,palm,basket,arrow,arrowHead,ground,seal,tarot,box,press,gear,banana,die,person,price,crownBroken} from './joker-art-primitives.js';
// Each numbered plate is composed individually, following its approved narrative.
export const JOKER_SCENES={};
const add=(id,scene)=>{
  const number=Object.keys(JOKER_SCENES).length+1;
  if(JOKER_IDENTITIES[id]?.number!==number) throw new Error(`Joker plate order: ${id}, expected ${number}`);
  if(typeof scene!=='string'||scene.length<120||/undefined|NaN|Infinity/.test(scene)) throw new Error(`Invalid joker engraving: ${id}`);
  if(Object.values(JOKER_SCENES).includes(scene)) throw new Error(`Repeated joker engraving: ${id}`);
  JOKER_SCENES[id]=scene;
};
// 001 — The source spark actually touches and ignites a cut-metal multiplier.
add('j_joker', rays(59,70,37,10,G)+p('M34 45L59 70L84 45L94 55L69 80L90 101L80 111L59 90L38 111L28 101L49 80L24 55Z',I)+p('M35 50L56 71M73 92L81 100','none',P,1.5)+flame(37,43,.55)+spark(30,33,.5)+ground());
// 002 — A glowing diamond is gripped at its waist by two hinged forge tongs.
add('j_greedy_joker', flame(58,57,1.05)+suit('d',59,63,1.6,G)+p('M59 43L70 63L59 82L48 63Z','none',P,1)+p('M40 66L22 73L73 116M78 66L96 73L45 116','none',S,6)+p('M40 66L22 73M78 66L96 73','none',I,2.4)+c(59,89,5,G)+p('M53 51L59 41L65 51','none',P,1.5)+ground());
// 003 — A single heart sits behind a continuous engraved ECG trace.
add('j_lusty_joker',rays(58,67,38,10,G)+suit('h',59,68,2.6,R)+p('M16 76H36L43 64L51 90L61 48L70 79L77 69H102','none',P,5)+p('M16 76H36L43 64L51 90L61 48L70 79L77 69H102','none',I,2)+h(38,95,36,8,8,R));
// 004 — A spade-shaped spear is visibly forged, with a bound shaft and struck sparks.
add('j_wrathful_joker',p('M54 77H64L66 116H52Z',G)+h(54,87,10,20,5)+suit('s',59,52,2.2,I)+p('M59 23V67L43 59M59 45L76 56','none',S,1.5)+spark(27,51,.45)+spark(91,44,.35)+l(28,76,19,83,R)+l(88,72,98,78,R)+ground());
// 005 — Three stems are attached to the three distinct club lobes.
add('j_gluttenous_joker',p('M58 113Q57 88 59 64M59 82Q38 79 27 57M60 80Q84 73 93 48','none',I,4)+suit('c',59,57,1.9,I)+p('M26 58Q12 42 27 36Q40 43 26 58M92 50Q79 31 95 30Q107 40 92 50M58 35Q43 19 58 18Q73 22 58 35',B)+p('M26 53L25 42M94 43L95 35M58 30V23','none',P,1)+ground());
// 006 — Identical pair, two clear upright card faces, over a shared fire.
add('j_jolly',flame(58,95,1.1)+card(42,57,'7','h',1,-9)+card(77,57,'7','h',1,9)+p('M30 98L42 92M76 96L88 104','none',I,3)+ground());
// 007 — A three-card fan, all eights, with a taller central flame behind it.
add('j_zany',flame(57,91,1.25)+card(31,57,'8','s',.86,-17)+card(59,46,'8','s',.93)+card(87,57,'8','s',.86,17)+p('M30 114L86 108M31 107L86 115','none',I,4));
// 008 — Two pairs, distinguished by rank, are physically wrapped by one red ribbon.
add('j_mad',cards(29,57,['7','7'],'s',.8,22)+cards(71,77,['Q','Q'],'h',.8,22)+p('M17 85Q57 62 103 85L98 98Q57 79 20 99Z',R)+p('M25 88Q62 73 94 89','none',P,1)+p('M53 86L43 105L57 100L67 109L69 87Z',R)+ground());
// 009 — Five successive numbered steps rise through a single furnace.
add('j_crazy',flame(60,91,1.3)+[2,3,4,5,6].map((n,i)=>r(15+i*17,99-i*13,18,19+i*13,S,1)+t(24+i*17,112-i*13,n,11)+h(18+i*17,117-i*13,12,i*13,3)).join('')+flame(24,83,.38)+flame(94,111,.43));
// 010 — Five hearts are set at the five points of a broad vermilion star.
add('j_droll',star(59,70,1.9,R)+[[59,49],[77,62],[70,85],[48,85],[41,62]].map(([x,y])=>suit('h',x,y,.48,P)).join('')+c(59,70,11,G)+p('M54 70L58 74L65 64','none',I,2));
// 011 — Tall blue reserve chips counterbalance the simple pair.
add('j_sly',card(36,61,'9','c',1,-8)+card(66,64,'9','c',1,5)+chips(79,107,5,1.1)+chips(38,112,2,.8)+ground());
// 012 — Three identical ranks sit in the open chest above visible blue chips.
add('j_wily',p('M21 75L17 49Q58 30 101 49L97 75Z',G)+p('M25 72L22 53Q58 39 96 53L92 72Z',I)+cards(33,57,['3','3','3'],'d',.75,26)+r(18,76,82,38,G,3)+chips(35,88,2,.7)+chips(60,88,3,.7)+chips(84,88,2,.7)+r(52,83,15,21,S,1)+c(59,94,3,I)+h(24,101,19,9,5)+ground());
// 013 — Two deposits form separate, balanced towers beneath their respective pairs.
add('j_clever',cards(29,49,['4','4'],'h',.72,23)+cards(68,67,['J','J'],'c',.72,23)+chips(40,112,5,1)+chips(84,112,3,1)+p('M17 79H60M61 92H104','none',I,1)+ground());
// 014 — Each consecutive rank is a tangible stair tread with chips underneath.
add('j_devious',[2,3,4,5,6].map((n,i)=>chips(22+i*18,114,1+i,.55)+card(22+i*18,94-i*12,n,'s',.6)).join('')+p('M15 101L24 91L41 79L59 67L77 55L95 43','none',G,1.3)+ground());
// 015 — A blue wax seal bears a five-club rosette.
add('j_crafty',p('M40 91L31 120L50 114L59 124L65 93M65 94L75 119L85 110L99 113L84 85',B)+seal(59,66,1.45,B)+[[59,41],[82,58],[74,84],[44,84],[36,58]].map(([x,y])=>suit('c',x,y,.62,P)).join('')+c(59,65,7,G));
// 016 — Three tiny cards cast a single oversized, sharply angled card-shaped shadow.
add('j_half',p('M24 103L15 31L75 20L101 103Z',I)+p('M28 40L34 90M38 37L44 85M49 34L56 88','none',S,1)+cards(41,98,['2','3','4'],'d',.65,19)+p('M25 117H102','none',I,1.3));
// 017 — Empty joker-sized picture frames contain radiating vacancies, no figures.
add('j_stencil',g(35,70,1,r(-21,-36,42,72,G)+r(-17,-32,34,64,P,1)+rays(0,0,9,8,R)+c(0,0,3,P),-9)+g(81,72,1,r(-21,-36,42,72,B)+r(-17,-32,34,64,P,1)+rays(0,0,9,8,G)+c(0,0,3,P),9)+ground());
// 018 — Four individually separated glove fingers support the card fan.
add('j_four_fingers',card(36,49,'5','s',.8,-24)+card(57,40,'6','s',.8,-5)+card(79,48,'7','s',.8,18)+p('M39 117L39 97Q25 82 25 73V63Q25 55 31 59L42 75V55Q42 47 48 50L51 73V50Q52 42 58 47L61 72L64 53Q67 46 71 51L70 85Q83 83 87 89Q90 94 78 99L72 117Z',P)+p('M43 82Q56 85 66 79M44 95Q55 90 69 95','none',I,1.3)+r(38,110,36,9,B,1));
// 019 — Main white mime mask, a pale mirrored mask, then actual cards in a hand.
add('j_mime',mask(43,45,.77)+g(81,64,.45,mask(0,0,1,S),12)+p('M62 43Q91 33 97 55M94 50L97 56L101 50','none',B,2)+cards(48,88,['K','Q'],'s',.68,23)+palm(59,99,1.15)+p('M18 109L31 120L40 112L28 101Z',I));
// 020 — A zero datum visibly divides the scale; the falling coin lies below it.
add('j_credit_card',r(19,27,20,88,S,1)+[37,49,61,73,85,97,109].map(y=>l(20,y,30,y,I,1)).join('')+l(16,61,100,61,R,2)+t(48,57,'0',13,R)+coin(75,93,1.4)+p('M75 30V66M69 60L75 68L81 60','none',I,2.5)+l(85,38,85,52,G,1)+l(65,43,65,53,G,1)+ground());
// 021 — Dagger hangs over the right-hand sacrifice; red energy travels left.
add('j_ceremonial',card(30,86,'K','h',1.1)+card(87,86,'4','s',1,-8)+p('M80 23H92V36L86 64L80 36Z',S)+r(76,31,20,5,G,1)+r(82,17,8,14,I,1)+p('M95 91L87 83L90 97L83 94','none',R,2)+p('M80 106Q53 127 36 108M42 107L34 106L35 114','none',R,3)+rays(30,84,26,7,G));
// 022 — Intact sealed discard tokens are tied above a blue reserve.
add('j_banner',p('M20 34L26 113M98 34L92 113','none',I,3)+p('M21 39Q59 27 97 39L91 66Q59 58 27 66Z',P)+[37,59,81].map(x=>token(x,48,.68,G)+p(`M${x-7} 42L${x+7} 54`,'none',R,2)).join('')+chips(37,109,4,.85)+chips(60,112,6,1)+chips(84,109,4,.85)+ground());
// 023 — Empty basket under a very literal red mountain summit.
add('j_mystic_summit',p('M15 71L56 25L102 71Z',R)+p('M42 42L56 25L71 43L61 39L55 46L50 39Z',P)+p('M24 69L50 49M73 50L93 69','none',I,1.2)+basket(59,96,1.15)+p('M48 83Q59 79 70 83','none',P,1)+ground());
// 024 — Mason, hammer, chisel, stone slab, and the newly carved card are separate objects.
add('j_marble',p('M54 43L99 36L103 108L57 115Z',S)+card(78,78,'A','s',1.05,0,S)+p('M58 54L61 62L57 67M98 90L94 96L99 103','none',I,1)+face(30,52,.6,'J',B)+p('M27 66L40 69L48 59M31 76L22 99L15 111M34 78L42 103L47 113','none',I,4)+p('M41 57L49 46M47 47L42 39L48 34L55 43Z',G)+p('M52 65L63 73','none',I,3)+spark(64,73,.25,G)+p('M90 115L99 119L94 122M62 117L68 120','none',I,2));
// 025 — Exactly six punch marks: five dark and a radiant sixth.
add('j_loyalty_card',g(59,73,1,r(-43,-31,86,62,P,4)+r(-38,-26,76,52,'none',2,I,.8)+l(-31,-16,21,-16,I,3)+l(-31,-10,5,-10,I,1.2)+[[-26,5],[-1,5],[24,5],[-26,20],[-1,20]].map(([x,y])=>c(x,y,6,I)+p(`M${x-3} ${y}L${x-1} ${y+3}L${x+4} ${y-3}`,'none',P,1.2)).join('')+rays(24,20,9,8,R)+c(24,20,6,G)+spark(24,20,.23,R),-7)+ground());
// 026 — Tarot emerges from the opened crown of an eight-ball.
add('j_8_ball',rays(61,54,29,8,G)+tarot(65,48,.9,12)+c(57,89,29,I)+p('M35 70Q57 80 80 68','none',S,1.5)+c(56,90,15,P)+t(56,97,'8',22)+p('M34 88Q33 102 45 108','none',S,2)+ground());
// 027 — All print numerals zero through twenty-three are scattered type blocks.
add('j_misprint',p('M20 105Q52 95 99 107L97 119H22Z',I)+Array.from({length:24},(_,n)=>{const x=24+(n%5)*17,y=31+Math.floor(n/5)*16;return g(x,y,1,r(-7,-8,14,15,n%3===0?R:P,1)+t(0,4,n,9,n%3===0?P:I),[-12,6,-5,14,-8][n%5]);}).join('')+p('M30 113H87','none',P,1));
// 028 — A setting sun silhouettes the final card and its second stamped impression.
add('j_dusk',c(58,63,34,R)+p('M19 77H101M24 83H97M31 89H90','none',P,2)+p('M14 96Q59 86 104 96V117H14Z',I)+g(80,91,.83,card(0,0,'A','s',1,0,S),14)+card(45,77,'A','s',1.1,-8)+p('M59 103L74 106M69 101L75 106L70 110','none',G,2));
// 029 — Tiny deuce card has braced limbs and holds a massive iron weight overhead.
add('j_raised_fist',p('M42 37V28Q59 11 77 28V37M48 36V29Q59 20 71 29V36','none',I,6)+p('M33 37H85L95 77H23Z',S)+t(59,63,'50',18)+h(29,64,22,10,6)+card(59,99,'2','h',.58)+p('M49 93L35 81L35 76M69 93L83 81L83 76M53 110L44 119M65 110L73 119','none',I,3)+ground());
// 030 — Physical shop reroll drum, crank and prominently zero-priced ticket.
add('j_chaos',p('M23 51L32 31H87L96 51Z',R)+p('M23 50H96V59Q86 67 78 59Q69 67 60 59Q50 67 42 59Q32 67 23 59Z',P)+r(26,66,65,44,G,2)+r(33,72,51,26,P,2)+p('M39 91Q43 75 58 80Q69 86 74 78M43 85L39 92L48 92','none',R,3)+p('M91 81H101V69','none',I,4)+c(101,67,4,R)+price(62,109,'0',1.1)+ground(120));

const escapeXml=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
export function jokerArtworkSvg(id){
  if(!Object.hasOwn(JOKER_SCENES,id)) return null;
  const scene=JOKER_SCENES[id];
  const identity=JOKER_IDENTITIES[id];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118 138" data-joker-id="${escapeXml(id)}" aria-hidden="true"><title>${escapeXml(identity.name)}</title><rect x="1" y="1" width="116" height="136" rx="5" fill="${P}" stroke="${I}" stroke-width="2"/><path d="M8 24V9H26M92 9H110V24M8 114V129H26M92 129H110V114" fill="none" stroke="${G}" stroke-width="1"/><path d="M31 9H45M73 9H87M31 129H87" fill="none" stroke="${I}" stroke-width=".7"/>${t(59,12,String(identity.number).padStart(3,'0'),7,I)}<g stroke-linecap="round" stroke-linejoin="round">${scene}</g></svg>`;
}
// 031 — The Fibonacci ranks sit on the successive turns of an engraved spiral.
add('j_fibonacci',p('M103 114H38Q13 114 13 85V51Q13 23 43 23H74Q104 23 104 52V76Q104 98 81 98H56Q35 98 35 78V60Q35 44 53 44H67Q84 44 84 62V71Q84 82 73 82H62Q52 82 52 72V65Q52 58 61 58Q70 58 70 66Q70 73 64 73','none',I,3)+[[27,104,'A'],[22,51,'2'],[74,31,'3'],[95,82,'5'],[47,87,'8']].map(([x,y,n])=>c(x,y,9,P)+t(x,y+4,n,12,R)).join('')+p('M17 83V65M42 27H57M99 53V63M39 64V76','none',G,1));
// 032 — Steel feed cards visibly melt at the furnace mouth into the large gear.
add('j_steel_joker',[30,53,76].map(x=>card(x,42,'7','s',.65,0,S)).join('')+p('M24 60L36 78H81L96 59Z',I)+flame(58,72,.6)+p('M40 78Q42 90 49 91M72 78Q73 91 64 93','none',S,5)+gear(59,97,.77)+p('M24 42H30M47 38H52M70 40H76','none',P,1));
// 033 — Three blue-framed court portraits form a genuine gallery, J, Q, K.
add('j_scary_face',portrait(28,76,.72,'J',B)+portrait(59,61,.9,'Q',B)+portrait(91,76,.72,'K',B)+p('M15 111H104','none',I,2)+h(22,114,76,4,15));
// 034 — Four distinct jester figures lean inward around the shared central spark.
add('j_abstract',p('M25 70Q25 30 59 30Q94 30 94 70Q94 111 59 111Q25 111 25 70','none',G,2)+face(29,68,.56,'J',B)+face(87,68,.56,'J',R)+g(59,37,.54,face(0,0,1,'J',G),180)+face(59,104,.54,'J',B)+spark(59,70,.9)+rays(59,70,23,8,G));
// 035 — A sequence of preserved discard tokens changes into minted currency.
add('j_delayed_grat',p('M21 86Q57 116 97 75','none',I,3)+arrowHead(98,75,-50,I)+token(28,54,1.1,B)+token(54,70,.8,B)+coin(75,91,1)+coin(96,101,.8)+p('M23 33L34 33L30 27M23 33V24','none',R,2)+p('M46 48L48 54M60 43L57 50','none',G,1.5)+ground());
// 036 — Four small ranks are actually repeated inside the oval tabletop mirror.
add('j_hack',p('M35 111L42 91H76L83 111','none',I,4)+e(60,58,40,33,G)+e(60,58,35,28,S)+cards(35,57,['2','3','4','5'],'s',.47,17)+p('M34 37L44 31M72 80L88 68','none',P,1.5)+cards(28,99,['2','3','4','5'],'s',.57,21)+ground(119));
// 037 — Numeric cards have court masks hanging over their upper halves.
add('j_pareidolia',card(29,81,'3','s',.83,-12)+card(60,75,'7','d',.9)+card(91,81,'9','c',.83,12)+face(28,53,.6,'J',G)+face(60,43,.65,'Q',R)+face(92,53,.6,'K',B)+p('M15 60Q10 43 20 34M103 60Q111 47 102 34','none',R,1.3)+ground());
// 038 — A ripe banana carries a short smoldering fuse at its stem.
add('j_gros_michel',banana(59,77,1.35,-18)+p('M19 54Q14 36 28 29Q35 28 34 22','none',I,3)+spark(34,24,.34,R)+p('M38 18Q48 17 43 11','none',S,1.2)+ground());
// 039 — Five separately engraved red embers carry the even ranks.
add('j_even_steven',flame(57,66,1.35)+[[31,82,'2'],[58,69,'4'],[86,83,'6'],[43,106,'8'],[76,105,'10']].map(([x,y,n])=>p(`M${x-13} ${y-9}L${x+6} ${y-13}L${x+14} ${y+1}L${x+4} ${y+12}L${x-13} ${y+8}Z`,R)+t(x,y+5,n,14,P)).join('')+ground(121));
// 040 — The five odd ranks each label a separate blue chip stack.
add('j_odd_todd',[[25,59,'A',2],[58,45,'3',3],[91,60,'5',2],[41,103,'7',4],[78,104,'9',4]].map(([x,y,n,k])=>chips(x,y,k,.88)+e(x,y-k*4.4,10,5,B)+t(x,y-k*4.4+3,n,9,P)).join('')+ground(120));
// 041 — An ace rests on an open book, between chip reserve and red insight.
add('j_scholar',p('M15 78Q37 68 59 80Q81 68 103 78V113Q80 105 59 118Q36 105 15 113Z',G)+p('M19 75Q39 65 59 78Q80 65 99 75V107Q79 99 59 112Q38 100 19 107Z',P)+p('M59 79V111M25 90L49 93M25 98L49 101M69 94L91 91M69 102L91 99','none',I,1.2)+card(58,56,'A','s',1,-8)+chips(26,110,3,.65)+spark(94,51,.55));
// 042 — A business card has its own court portrait and precisely two coins.
add('j_business',g(57,67,1,r(-41,-28,82,56,P,3)+r(-35,-22,29,42,B,1)+face(-20,-4,.6,'K',G)+l(2,-14,32,-14,I,3)+l(2,-6,26,-6,I,1.2)+l(2,2,31,2,I,1.2)+l(2,10,23,10,I,1.2),-8)+coin(43,107,1)+coin(78,105,1.2)+ground(121));
// 043 — Repeated pairs feed the same increasingly large stellar flare.
add('j_supernova',g(28,103,.48,cards(0,0,['7','7'],'h',1,24),-17)+g(38,75,.55,cards(0,0,['7','7'],'h',1,24),-9)+g(48,46,.62,cards(0,0,['7','7'],'h',1,24))+p('M69 96Q95 79 86 53','none',G,2)+star(83,39,1,R)+spark(84,39,.43,G)+rays(83,39,27,7,G));
// 044 — Three number-card passengers ride a bus while the crown waits at a stop.
add('j_ride_the_bus',r(15,54,77,46,G,7)+r(20,60,66,23,P,2)+cards(31,72,['2','5','8'],'s',.45,22)+p('M15 88H91M40 54V99M66 54V99','none',I,1.5)+c(31,102,9,I)+c(31,102,4,S)+c(77,102,9,I)+c(77,102,4,S)+p('M102 46V109M94 45H109','none',I,2)+crown(101,35,.43)+p('M94 109H108','none',R,3)+ground(119));
// 045 — A pair ascends from one celestial stair to the next.
add('j_space',p('M17 111H43V91H70V70H99V111Z',B)+p('M18 111H42M45 92H69M73 71H99','none',P,1)+card(35,80,'6','h',.67,-10)+card(65,55,'6','h',.67,8)+p('M40 53Q52 29 75 35M70 29L77 35L69 40','none',R,2.5)+star(94,32,.4,G)+star(24,37,.3,G)+spark(93,92,.27,P));
// 046 — The silver egg is a recognizable slotted bank surrounded by incoming coins.
add('j_egg',p('M59 30C32 31 23 76 29 97C35 122 82 122 90 97C98 75 81 31 59 30Z',S)+p('M43 66Q35 85 40 98','none',P,3)+p('M48 47L68 44','none',I,5)+p('M49 46L67 43','none',P,1)+coin(27,45,.7)+coin(96,63,.65)+coin(24,99,.75)+p('M93 33Q77 27 68 35M73 29L67 35L75 37','none',R,2)+ground(123));
// 047 — Three arriving cards above an open receiving palm, beside a shut discard basket.
add('j_burglar',cards(24,45,['3','4','5'],'s',.7,23)+p('M30 64L42 80M43 73L43 82L35 79','none',R,2)+palm(42,91,1.1)+basket(88,102,.76,true)+p('M77 80L99 104M98 80L77 104','none',R,2.5)+ground(122));
// 048 — Dark chalkboard, a cream hand, and only spade and club cards.
add('j_blackboard',r(16,25,87,85,G,2)+r(21,30,77,74,I,1)+cards(34,64,['A','8','K'],'s',.6,23)+suit('c',57,65,.35,I)+card(81,61,'6','c',.62,9)+palm(57,91,1.07)+p('M29 40H42M29 43H37M84 88L92 81','none',S,1)+p('M35 112L29 122M85 112L91 122','none',I,3));
// 049 — An athletic figure climbs a rising consecutive card track.
add('j_runner',p('M14 113L98 50','none',G,12)+[2,3,4,5,6].map((n,i)=>card(24+i*18,104-i*13,n,'s',.52,-52)).join('')+person(57,53,.88,'run',R)+p('M18 69L34 66M17 76L30 73M23 82L32 79','none',B,1.6));
// 050 — Blue chip scoops drip off a crosshatched cone into a spreading pool.
add('j_ice_cream',e(59,115,34,7,B)+p('M36 67H82L59 113Z',G)+p('M42 79L67 99M47 72L72 92M75 77L51 97M69 71L45 90','none',I,1)+p('M31 63Q24 43 43 39Q45 20 64 27Q83 23 86 42Q102 48 88 66L82 82Q77 88 75 75L73 66L63 67L61 92Q56 99 53 88L51 67L39 68L37 78Q31 82 31 63Z',B)+e(59,52,25,8,B)+p('M39 51Q58 42 78 50M42 58Q59 66 78 58','none',P,1.3)+p('M90 91V98M35 102V106','none',B,3));
// 051 — One incoming ace passes a double helix, then splits into two identical aces.
add('j_dna',card(29,39,'A','d',.8,-10)+p('M40 54C95 52 31 75 80 81C106 89 51 96 72 110M79 38C26 48 99 67 43 76C19 86 74 94 46 108','none',B,3)+[48,59,71,83,95].map((y,i)=>l(i%2?43:48,y,i%2?77:72,y,R,1.3)).join('')+card(39,103,'A','d',.72,-12)+card(82,102,'A','d',.72,12));
// 052 — Five separate cards fall together onto one scale pan.
add('j_splash',cards(23,41,['2','4','6','8','10'],'s',.56,18)+[23,41,59,77,95].map(x=>p(`M${x} 58V66M${x-3} 63L${x} 67L${x+3} 63`,'none',R,1.2)).join('')+p('M59 79V114M37 116H81M20 76H98M20 76L29 99H89L98 76Z',G)+p('M25 78L33 94H85L92 78','none',I,1.4)+c(59,76,6,S)+ground(124));
// 053 — An unplayed deck with layered paper edges emits a shower of blue chips.
add('j_blue_joker',p('M20 50L62 34L75 101L30 115L20 50Z',S)+p('M24 55L65 41M25 61L66 47M27 67L67 53M29 74L69 59','none',P,1)+card(47,68,'A','c',1.13,-13,B)+p('M70 48Q87 36 97 54','none',G,2)+chips(91,70,2,.65)+chips(85,97,3,.78)+chips(65,113,2,.65)+ground(124));
// 054 — One six dissolves through the blue, rippling spectral threshold.
add('j_sixth_sense',e(72,71,30,46,I)+e(72,71,23,39,B)+e(72,71,15,32,S)+e(72,71,8,25,P)+card(42,71,'6','s',1.15,-13)+[[61,43],[67,56],[65,72],[69,91],[58,103]].map(([x,y])=>r(x,y,4,5,B,0,I,.6)).join('')+rays(59,70,43,8,G));
// 055 — Distinct planetary bodies complete a drawn constellation.
add('j_constellation',p('M22 83L38 38L71 55L94 32M71 55L92 100L48 112L22 83','none',I,1.5)+c(38,38,9,B)+c(71,55,12,G)+e(71,55,20,5,'none',I,1.4)+c(22,83,6,S)+c(48,112,8,B)+c(92,100,10,R)+star(94,32,.4,G)+rays(94,32,15,6,G)+p('M78 30L88 29M83 24L89 28','none',R,2));
// 056 — A visibly chipped old card enters the press; a reinforced card exits.
add('j_hiker',press(58,66,1.28)+g(32,63,.65,p('M-13 -20H13V-4L8 0L13 5V20H-13V9L-9 6L-13 2Z',P)+t(-5,-8,'7',8)+suit('s',0,4,.45),-15)+card(83,98,'7','s',.83,9,S)+p('M73 82H94M73 114H94','none',G,3)+p('M41 103H65M60 98L66 103L60 108','none',R,2));
// 057 — Three court cards enter the discard basket and leave coins behind.
add('j_faceless',portrait(27,45,.57,'J')+portrait(57,43,.57,'Q')+portrait(87,46,.57,'K')+p('M29 65Q31 78 45 84M84 66Q80 78 69 84','none',R,2)+basket(57,97,1.08)+coin(24,112,.65)+coin(93,110,.8)+ground(123));
// 058 — A red shoot grows from a played card, and discard shears clip a branch.
add('j_green_joker',card(35,99,'4','s',.73,-9)+p('M55 115Q68 80 62 40M61 72Q40 70 39 54Q58 49 61 72M63 55Q82 53 84 35Q66 31 63 55',R)+p('M59 92L56 75M67 47L77 39','none',P,1)+p('M74 74L94 90M75 86L94 68','none',S,4)+c(72,72,6,'none',I,2)+c(72,89,6,'none',I,2)+token(95,106,.65,B)+p('M47 115H79','none',I,2));
// 059 — Ace-led stepping stones terminate at a larger tarot destination.
add('j_superposition',p('M20 112Q71 91 89 35','none',G,13)+[['A',22,103],['2',41,88],['3',58,74],['4',70,56],['5',79,38]].map(([n,x,y])=>card(x,y,n,'s',.58,20)).join('')+tarot(96,33,.65,13)+p('M22 121Q72 102 101 55','none',I,1.2));
// 060 — A clipped order sheet specifies a pair and is paid with four visible coins.
add('j_todo_list',r(25,24,69,87,P,2)+r(44,20,32,10,S,2)+l(38,44,79,44,I,3)+l(38,51,70,51,I,1)+cards(45,76,['8','8'],'h',.63,26)+p('M35 99L40 103L49 94','none',R,2)+[26,49,73,96].map(x=>coin(x,113,.75)).join(''));
// 061 — Protective forged bands and rivets brace the second banana variety.
add('j_cavendish',banana(56,72,1.3,-13)+p('M22 41C11 81 39 119 70 108C91 101 103 78 95 49','none',S,7)+p('M22 41C11 81 39 119 70 108C91 101 103 78 95 49','none',I,1.5)+p('M22 61L35 58M29 91L42 83M58 108L57 94M86 93L75 84M97 63L84 64','none',S,7)+[[22,61],[29,91],[58,108],[86,93],[97,63]].map(([x,y])=>c(x,y,2,I,I,.6)).join('')+ground(123));
// 062 — Two impressions of the same seven-pair are embedded in one red wax seal.
add('j_card_sharp',seal(59,71,1.65,R)+g(47,52,.7,cards(-12,0,['7','7'],'h',.8,24),-8)+g(70,88,.7,cards(-12,0,['7','7'],'h',.8,24),-8)+p('M27 72Q34 90 45 96M74 45Q88 49 92 64','none',P,1.4)+p('M49 65L65 75M59 73L66 76L65 68','none',G,2));
// 063 — Hinged packet closes beneath an unmistakable red refusal seal.
add('j_red_card',box(58,79,1.48,false)+p('M25 58L21 44L57 35L95 46L91 59','none',I,2)+p('M29 38Q45 21 66 29M60 22L68 29L60 34','none',R,2)+c(59,81,18,R)+c(59,81,12,'none',P,2)+l(50,72,68,90,P,3)+ground(124));
// 064 — A toothed red maw actually bites a card at its right edge.
add('j_madness',p('M17 72C15 29 58 23 78 48L98 52L80 70L101 86L78 103C50 128 19 106 17 72Z',R)+p('M32 67Q52 48 79 53L66 73L80 96Q50 104 32 83Z',I)+p('M35 63L43 76L49 57L55 72L63 54L67 66M38 89L43 77L50 96L57 81L64 98L69 85',P)+card(93,74,'3','s',.75,17)+p('M20 42L15 30M27 35L24 23','none',G,2));
// 065 — Four cards make the four actual sides of a square around a chip reserve.
add('j_square',p('M26 40H91V107H26Z','none',G,6)+card(59,39,'4','h',.65,90)+card(90,73,'4','h',.65)+card(59,107,'4','h',.65,90)+card(27,73,'4','h',.65)+chips(59,85,5,.8)+rays(59,70,14,8,G));
// 066 — Five consecutive hearts form a ritual ring around a blue candle.
add('j_seance',e(59,83,43,30,'none',I,1.2)+[['5',25,69,-40],['6',43,40,-18],['7',77,40,18],['8',96,70,40],['9',59,108,90]].map(([n,x,y,a])=>card(x,y,n,'h',.62,a)).join('')+r(52,66,14,31,B,2)+e(59,66,7,3,S)+p('M59 63C43 50 58 40 60 31C72 43 73 54 59 63Z',B)+p('M59 54L59 44','none',P,1.5)+p('M44 99H74','none',I,3));
// 067 — Two printed jester portraits emerge from the rollers, instead of generic ranks.
add('j_riff_raff',press(59,59,1.23)+r(22,68,75,17,G,2)+c(30,77,7,I)+c(88,77,7,I)+portrait(38,101,.62,'J',B)+portrait(79,101,.62,'J',B)+p('M48 33H70M59 27V39','none',R,2)+ground(124));
// 068 — The fangs draw luminous threads out of visibly enhanced card faces.
add('j_vampire',p('M19 41Q59 17 99 41L89 63L76 53L67 65L51 65L41 53L29 63Z',I)+p('M31 43L42 47L38 70Z',P)+p('M76 46L88 42L81 70Z',P)+card(33,97,'5','h',.9,-15,G)+card(82,97,'9','s',.9,15,S)+p('M35 80Q21 72 38 64M80 80Q95 72 81 64','none',G,3)+rays(32,95,25,6,G)+rays(82,95,25,6,G)+p('M47 42Q59 49 71 42','none',R,2));
// 069 — Broken steps are visibly jumped by a curved shortcut.
add('j_shortcut',p('M16 117H36V98H55V78H76V57H99','none',I,4)+card(26,103,'2','s',.55)+card(47,84,'4','s',.55)+card(68,64,'6','s',.55)+card(90,43,'8','s',.55)+p('M20 78Q28 33 69 37M62 30L71 37L62 42','none',R,3)+p('M38 106L43 100M59 87L64 81M80 66L85 60','none',S,1.2));
// 070 — Successive translucent figure contours are added by an incoming card.
add('j_hologram',p('M25 112V80Q25 65 42 61Q24 37 43 25Q60 18 67 37Q72 51 58 59Q80 61 80 80V112Z',B)+p('M37 112V80Q37 65 54 61Q36 37 55 25Q72 18 79 37Q84 51 70 59Q92 61 92 80V112Z','none',S,2)+p('M49 112V80Q49 65 66 61Q48 37 67 25Q84 18 91 37Q96 51 82 59Q104 61 104 80V112Z','none',I,2)+h(31,83,42,23,8,P)+card(29,93,'4','d',.75,-17)+p('M25 66Q18 51 33 43M28 38L35 43L29 48','none',R,2));
// 071 — A nearly empty palm holds only two coins as tarot descends toward it.
add('j_vagabond',palm(57,91,1.65)+coin(44,98,.65)+coin(65,92,.6)+tarot(70,44,1,10)+p('M52 36Q32 45 37 67M31 61L37 69L42 61','none',R,2)+p('M17 111L29 123L42 111L28 99Z',B));
// 072 — The reserve king stands behind theatre drapery and powers the lit stage.
add('j_baron',r(15,30,88,80,I,1)+p('M15 30H45Q44 52 25 67L30 104H15Z',R)+p('M103 30H91Q83 51 89 65L85 104H103Z',R)+portrait(43,72,.9,'K',G)+p('M58 83L88 78M60 91L90 92M58 99L86 105','none',G,2.5)+p('M17 113H103L109 122H10Z',G)+p('M21 37Q20 52 22 60M99 37L97 56','none',P,1));
// 073 — A deck's nines are connected by pipes to a coin receiver.
add('j_cloud_9',cards(27,47,['9','9','9'],'s',.72,24)+p('M27 63V80H80M51 63V80M75 63V80','none',S,4)+r(71,79,30,34,G,3)+r(78,84,16,5,I,1)+coin(86,103,.8)+p('M21 87H56V109H21Z',S)+p('M25 91H51M25 96H51M25 101H51','none',P,1)+ground(121));
// 074 — A riveted rocket climbs literal stairs built from defeated, cracked crowns.
add('j_rocket',p('M14 117H39V100H61V82H84V63H105','none',I,5)+crownBroken(27,109,.6)+crownBroken(51,91,.6)+crownBroken(75,73,.6)+g(82,42,.85,p('M0 -25Q-20 -6 -13 19H13Q20 -6 0 -25Z',S)+p('M-13 4L-25 22L-12 18M13 4L25 22L12 18',R)+c(0,-2,7,B)+p('M-7 20L0 40L7 20Z',R)+p('M-6 -16L0 -21L6 -16','none',P,1),26)+spark(38,43,.3,G));
// 075 — New card patterns grow like a vine around a weathered old obelisk.
add('j_obelisk',p('M46 114L50 37L59 23L69 37L76 114Z',S)+p('M59 24V113M51 47L59 52L67 46M50 80L58 86L70 79','none',I,1.2)+p('M21 114Q25 80 42 69Q80 58 91 32','none',R,3)+card(27,94,'2','h',.48,-16)+card(38,68,'3','c',.48,-20)+card(82,55,'4','d',.48,20)+card(94,31,'5','s',.48,23)+p('M27 123H88','none',I,3));
// 076 — A broad brush turns the first blue court portrait into gold.
add('j_midas_mask',portrait(30,79,.83,'Q',B)+portrait(85,79,.83,'K',G)+p('M20 54L41 104M73 52L95 103','none',G,5)+p('M64 23L78 31L59 63L48 57Z',I)+p('M48 57L59 63L51 80L36 70Z',G)+p('M40 71L47 59M46 75L53 63','none',I,1)+p('M62 103Q56 109 58 114M63 111L63 118','none',G,3)+ground(123));
// 077 — Wrestling mask on sale; the boss emblem dims behind the counter.
add('j_luchador',seal(86,45,.78,S)+crown(86,43,.7,S)+p('M72 30L100 60','none',I,3)+p('M28 82Q16 58 29 37Q44 23 58 39Q72 61 60 82Z',B)+p('M31 42L41 51L51 42L55 66L43 77L31 66Z',R)+p('M28 50L39 54L33 61L27 58ZM45 54L56 50L58 58L50 61Z',P)+p('M38 68H46','none',I,2)+r(15,86,88,13,G,1)+p('M21 100V119M97 100V119','none',I,4)+price(73,91,'$',.8));
// 078 — A camera viewfinder singles out the first court portrait, followed by two smaller courts.
add('j_photograph',r(15,47,68,51,I,4)+r(24,38,24,12,I,2)+c(49,72,22,S)+c(49,72,16,P)+face(49,72,.5,'J',G)+r(19,52,11,7,G,1)+p('M32 57V52H39M59 52H66V59M66 85V91H59M39 91H32V84','none',R,1.5)+portrait(88,67,.45,'Q',S)+portrait(99,95,.4,'K',S)+p('M35 104L26 120M63 104L73 120','none',I,3));
// 079 — A joker and a consumable both have raised price tags and one-step arrows.
add('j_gift',portrait(32,72,.85,'J',B)+tarot(84,72,.86,8)+price(35,110,'2',.82)+price(84,110,'3',.82)+p('M24 41V25M19 31L24 24L29 31M84 41V25M79 31L84 24L89 31','none',R,2.5)+p('M39 32H66M53 28V36','none',G,2));
// 080 — Exactly five extra card petals; the rightmost two visibly detach and fall.
add('j_turtle_bean',p('M59 111L59 75','none',I,4)+card(29,70,'2','c',.8,-45)+card(43,48,'3','c',.8,-22)+card(62,42,'4','c',.8)+card(82,54,'5','c',.8,25,S)+card(95,91,'6','c',.72,55,S)+p('M85 83L82 88M94 111L89 117M77 100L74 106','none',I,1)+p('M43 115Q58 106 75 115L70 124H47Z',G));
// 081 — Cards are removed from the deck by shears, letting red light escape the gap.
add('j_erosion',p('M22 54L62 45L72 111L32 120Z',S)+p('M26 61L64 51M27 67L65 57M28 74L66 64M29 82L67 72','none',P,1)+card(45,71,'6','s',1,-10)+card(88,47,'7','s',.7,25)+p('M63 78L84 97M64 97L83 76','none',S,5)+c(59,77,7,'none',I,2)+c(59,101,7,'none',I,2)+spark(76,65,.5)+p('M78 65L88 69M71 55L70 44','none',R,2));
// 082 — Two court cards sit inside upholstered reserved seats, with money beneath.
add('j_reserved_parking',p('M15 80V47Q15 39 24 39H43Q51 39 51 47V80M67 80V47Q67 39 76 39H96Q104 39 104 47V80',B)+portrait(33,62,.52,'Q',G)+portrait(85,62,.52,'K',G)+r(16,80,35,13,R,3)+r(68,80,35,13,R,3)+p('M20 95V111M47 95V111M72 95V111M99 95V111','none',I,3)+coin(33,111,.8)+coin(85,111,.8)+ground(124));
// 083 — An envelope carries a specific rank and an exposed packet of banknotes.
add('j_mail',g(59,70,1,r(-25,-35,56,40,B,1)+r(-29,-31,56,40,G,1)+r(-32,-26,56,40,P,1)+r(-28,-22,48,32,'none',1,I,1)+e(-4,-6,10,10,G)+t(-4,-1,'$',14)+p('M-42 -5H42V42H-42Z',P)+p('M-42 -5L0 23L42 -5M-42 42L-14 14M42 42L14 14','none',I,1.5)+price(15,25,'7',.9),-7)+ground(124));
// 084 — Exactly five source coins under a magnifier, plus a separate newborn coin.
add('j_to_the_moon',c(49,61,32,'none',I,5)+c(49,61,27,'none',S,1.5)+p('M72 84L96 112','none',I,11)+p('M74 86L94 109','none',G,3)+[[37,48],[61,48],[25,70],[48,72],[70,70]].map(([x,y])=>coin(x,y,.7)).join('')+coin(95,38,.85)+p('M77 43L83 40M84 35L88 37','none',R,2)+rays(95,38,12,6,G));
// 085 — A ghost-blue tarot card peeks out of the freshly opened packet.
add('j_hallucination',rays(60,54,34,8,G)+box(59,88,1.45,true)+tarot(61,53,1.13,-9)+p('M28 84Q30 71 37 77Q42 82 45 76M76 77Q84 87 91 75','none',S,2)+star(30,34,.23,B)+ground(126));
// 086 — Used tarot cards stack into a progressively taller vermilion tower.
add('j_fortune_teller',tarot(27,100,.72,-17)+p('M39 119V89H48V68H57V46H65V26H79V46H87V68H96V119Z',R)+p('M45 100H90M49 82H88M59 61H80M66 42H76','none',I,2)+[[53,105],[75,88],[67,65],[72,39]].map(([x,y])=>g(x,y,.4,tarot(0,0,1))).join('')+p('M43 112L47 108M86 112L90 108','none',P,1));
// 087 — Six actual cards fit into the palm's widened fan; the sixth is outlined red.
add('j_juggler',[[-38,-24],[-23,-15],[-8,-5],[8,5],[23,15],[38,24]].map(([dx,a],i)=>card(59+dx,60+Math.abs(dx)*.4,i+2,'s',.66,a,P)).join('')+p('M88 48L97 44L108 68L100 72','none',R,2)+palm(57,98,1.36)+p('M25 116L36 126L47 115L34 104Z',B));
// 088 — A single extra discard token hovers over an otherwise ordinary basket.
add('j_drunkard',basket(54,91,1.3)+token(84,38,1.14,B)+p('M80 57L71 69M70 61L70 70L79 68','none',R,2.5)+p('M28 42H44M36 34V50','none',G,3)+ground(124));
// 089 — Pickaxe strikes a vein of card-shaped stone; blue chips emerge from it.
add('j_stone',p('M16 115L19 68L40 50L80 52L103 82L101 114Z',S)+card(37,82,'4','s',.73,-17,S)+card(66,79,'8','c',.73,12,S)+p('M22 104L30 98L24 91M71 98L81 92L88 96','none',I,1.2)+p('M87 27L54 72','none',G,5)+p('M64 29Q85 21 101 51L88 40L78 38Z',S)+spark(57,70,.3,G)+chips(87,113,3,.8)+chips(58,117,2,.65));
// 090 — Four coins emerge from an envelope bearing the completed-round check seal.
add('j_golden',g(59,84,1,p('M-39 -10H39V31H-39Z',P)+p('M-39 -10L0 13L39 -10M-39 31L-14 5M39 31L14 5','none',I,1.5)+c(0,14,11,R)+p('M-6 14L-1 19L7 9','none',P,2),-7)+[[28,53],[48,42],[70,43],[91,54]].map(([x,y])=>coin(x,y,.9)).join('')+ground(124));
// 091 — A slotted lucky-cat bank grows in the beams from a lucky playing card.
add('j_lucky_cat',p('M46 108Q36 93 43 76L41 50L52 56Q61 51 70 56L81 49L79 75Q91 91 79 109Z',G)+p('M46 76Q26 66 28 84L31 96L43 98M81 86L90 72L98 80L90 102L80 106',G)+p('M49 67L54 69M67 69L72 67M57 75L60 78L64 75M52 84Q61 91 70 84','none',I,1.5)+p('M53 97H69','none',I,4)+r(45,107,35,12,R,2)+card(26,39,'7','h',.82,-14,G)+star(26,39,.26,P)+p('M41 46L48 52M31 58L42 66','none',G,3)+rays(64,76,38,7,G));
// 092 — Three uncommon jesters share one continuous power ribbon.
add('j_baseball',portrait(28,71,.75,'J',B)+portrait(59,55,.8,'J',B)+portrait(91,71,.75,'J',B)+p('M15 92Q36 109 58 91Q82 107 104 90L104 103Q82 120 58 105Q33 120 15 104Z',R)+p('M20 100Q39 111 58 99Q80 110 99 99','none',P,1.4)+spark(59,110,.4,G));
// 093 — A muscular bull supports the heavy safe that dispenses blue chips.
add('j_bull',r(31,24,63,47,S,3)+r(37,30,51,34,I,2)+c(62,47,12,S)+p('M62 37V57M52 47H72','none',I,2)+c(62,47,3,G)+p('M24 77Q43 61 73 76L84 91L77 109H67L65 94H44L40 110H28L31 91L17 85Z',G)+p('M20 75L29 70L37 79L31 91L20 88L15 81Z',G)+p('M21 76Q9 72 12 58Q15 66 24 68ZM30 74Q42 68 39 56Q35 63 28 66Z',P)+c(23,79,2,I)+p('M18 85L22 87','none',I,1.2)+p('M74 78L91 85L94 99','none',I,3)+chips(95,110,3,.67)+chips(56,116,2,.67)+ground(125));
// 094 — A cylindrical can on the counter transforms into a matched reward pair.
add('j_diet_cola',p('M20 46Q34 52 47 46V91Q34 100 20 91Z',R)+e(34,46,14,5,S)+e(34,91,14,5,R)+e(34,46,6,2,I)+p('M24 62Q34 72 43 62M24 76Q34 86 43 76','none',P,2)+p('M53 66H67M62 61L69 66L62 71','none',G,3)+token(85,46,.93,G)+token(85,86,.93,G)+r(15,107,88,9,I,1)+p('M24 116V124M95 116V124','none',I,3));
// 095 — Exactly one card feeds a toothed shredder; three coins are the proceeds.
add('j_trading',r(19,70,61,42,S,3)+r(24,74,51,8,I,1)+card(49,56,'5','h',.9,-4)+p('M26 87H73M27 93H72','none',I,1.5)+p('M29 100L33 120M38 100L41 122M47 100L49 120M56 100L58 123M65 100L68 119','none',P,4)+coin(96,61,.8)+coin(95,86,.8)+coin(94,111,.8));
// 096 — Rotating shop drum's handle glows red hot through several arc traces.
add('j_flash',r(18,43,65,62,G,4)+r(24,49,53,46,P,2)+p('M28 58H73M28 87H73','none',I,1.3)+p('M35 78Q42 61 57 68Q67 75 70 66M39 74L35 80L43 81','none',R,3)+p('M83 75H96V52','none',R,5)+c(96,49,6,R)+p('M87 37Q102 32 106 45M92 29Q110 26 111 44','none',G,1.8)+flame(96,37,.4)+p('M24 111H78','none',I,3)+ground(122));
// 097 — Popcorn tub with diminishing red portion divisions and a missing top segment.
add('j_popcorn',p('M29 57H90L81 116H38Z',P)+p('M37 58L44 113M51 58L54 115M67 58L66 115M82 58L77 113','none',R,6)+p('M29 57H90M38 116H81','none',I,2)+[[37,50],[51,43],[67,48],[82,49],[44,34],[65,31],[84,32]].map(([x,y],i)=>p(`M${x-7} ${y}Q${x-10} ${y-8} ${x-3} ${y-8}Q${x+2} ${y-17} ${x+6} ${y-8}Q${x+15} ${y-6} ${x+7} ${y+2}Z`,i>4?S:P)).join('')+p('M98 68H105M97 82H105M95 96H105M93 110H105','none',I,1.5)+p('M98 50H105','none',S,1)+ground(124));
// 098 — Two seven-pairs supply the new red bricks on a growing masonry wall.
add('j_trousers',cards(29,46,['7','7'],'s',.66,21)+cards(73,46,['9','9'],'h',.66,21)+p('M31 66L41 77M77 66L69 77','none',G,2)+r(17,81,85,37,R,1)+p('M18 93H101M18 105H101M39 81V93M73 81V93M28 93V105M58 93V105M88 93V105M42 105V118M74 105V118','none',I,2)+r(36,68,28,13,R,1)+h(22,111,14,4,4,P)+h(81,87,15,4,4,P));
// 099 — A luminous diamond is the sole suit in an ancient fitted stone ring.
add('j_ancient',c(59,73,43,S)+c(59,73,28,I)+p('M59 30V45M89 42L78 54M102 73H87M89 104L78 92M59 116V101M29 104L40 92M16 73H31M29 42L40 54','none',I,2)+p('M37 41L43 43M94 88L90 91M35 107L39 104','none',P,1.2)+rays(59,73,20,8,G)+suit('d',59,73,1.1,G)+p('M56 63L52 73L57 81','none',P,1));
// 100 — Noodle bowl is visibly leaking broth toward the discard cards.
add('j_ramen',e(56,70,40,13,P)+p('M17 70Q21 112 56 113Q91 112 96 70Z',B)+e(56,70,36,10,G)+p('M28 68Q39 58 48 69Q59 81 68 67Q76 58 86 68M29 74Q42 62 52 75Q62 82 80 70','none',P,2)+p('M39 62L71 26M49 65L84 31','none',I,2.5)+p('M87 77Q108 81 99 98L95 109','none',G,4)+e(94,116,13,4,G)+card(102,55,'3','s',.48,18)+p('M94 35L101 29','none',R,2));
// 101 — A real portable receiver has large separate four and ten tuning knobs.
add('j_walkie_talkie',r(24,38,70,76,B,5)+p('M32 38V20M39 38V25','none',I,4)+r(32,45,54,24,I,2)+p('M37 51H81M37 57H81M37 63H81','none',S,1.5)+c(42,91,13,G)+c(76,91,13,G)+t(42,97,'4',18)+t(76,96,'10',14)+p('M96 33Q106 40 96 47M102 27Q117 40 103 53','none',G,1.5)+r(42,109,34,9,I,1));
// 102 — Siphon with ten visible calibration ticks issues a double card imprint.
add('j_selzer',p('M29 60Q19 64 19 81V114Q38 124 57 114V81Q57 64 47 60V41H29Z',B)+r(25,34,25,10,S,1)+p('M37 34V25H65L72 37H57V44H49','none',I,4)+p('M62 41Q81 44 85 59','none',S,2)+Array.from({length:10},(_,i)=>l(24,68+i*4.5,i%5===0?35:31,68+i*4.5,P,1)).join('')+card(82,78,'8','s',.72,9)+card(92,103,'8','s',.72,9)+p('M75 63L80 68M89 58L89 65','none',B,2));
// 103 — Discarded spades become the masonry of a blue chip fortress.
add('j_castle',p('M23 116V65H15V48H25V57H34V48H44V65H36V82H82V65H74V48H84V57H93V48H103V65H95V116Z',B)+p('M51 116V96Q59 84 68 96V116Z',I)+p('M25 79H35M24 95H36M82 78H94M82 95H94M41 102H48M71 102H80','none',P,1)+card(38,32,'5','s',.56,-18)+card(65,39,'9','s',.56,13)+p('M39 46L33 55M67 53L76 62','none',G,2)+ground(124));
// 104 — Smiling court portraits operate two red seal stamps.
add('j_smiley',portrait(31,57,.8,'Q',G)+portrait(86,57,.8,'K',G)+p('M24 60Q31 68 38 60M79 60Q86 68 93 60','none',R,1.5)+p('M34 82L45 88M83 82L73 88','none',I,3)+p('M39 91V83Q45 75 51 83V91M67 91V83Q73 75 79 83V91',G)+r(35,91,20,7,R,1)+r(63,91,20,7,R,1)+seal(45,111,.4,R)+seal(76,111,.4,R)+ground(125));
// 105 — Sold cards bearing price tickets are consumed as campfire logs.
add('j_campfire',p('M25 109L91 96M28 96L91 112','none',I,8)+p('M28 108L89 96M30 96L87 110','none',G,3)+card(39,89,'6','s',.8,-57)+card(80,91,'9','h',.8,53)+price(28,68,'$',.65)+price(93,66,'$',.65)+flame(59,75,1.5)+p('M40 30L35 22M82 39L90 29','none',G,2)+ground(124));
// 106 — Gold card runs through a mechanical register; exactly four coins exit.
add('j_ticket',r(22,58,77,46,G,3)+r(28,43,48,19,I,2)+r(32,47,40,11,P,1)+t(52,56,'4',10)+r(30,70,28,17,S,1)+[35,44,53].map(x=>c(x,78,2,I)).join('')+r(64,69,25,8,I,1)+card(83,50,'A','d',.68,14,G)+p('M29 93H91','none',I,3)+[25,48,72,95].map(x=>coin(x,115,.76)).join(''));
// 107 — A jointed skeleton grips a gauge pointer fixed at its quarter mark.
add('j_mr_bones',p('M51 86A30 30 0 1 1 104 86','none',I,5)+p('M55 75A25 25 0 0 1 62 48','none',R,6)+p('M77 71L57 58','none',R,3)+c(77,71,4,G)+t(79,94,'¼',19)+p('M67 43L69 48M85 43L83 48M98 55L93 58M102 71H96','none',I,1.5)+c(30,43,12,P)+c(26,42,3,I)+c(35,42,3,I)+p('M27 49H34M30 55V89M20 62H40M22 70H38M24 77H36M30 85L19 105L20 120M30 85L41 104L39 119M22 61L13 77L24 88M39 61L51 62L57 58','none',I,3)+p('M25 53V58M30 54V59M35 53V58','none',I,1));
// 108 — The airborne acrobat makes a final horizontal leap through a red ring.
add('j_acrobat',e(76,66,23,38,'none',R,6)+e(76,66,18,33,'none',G,1)+g(57,65,.95,person(0,0,1,'leap',B),74)+p('M16 48L35 51M12 57L28 60M14 69L31 69','none',I,1.5)+p('M22 111H40M24 109V96M37 109V96','none',I,3)+p('M74 107V120M66 121H86','none',I,3));
// 109 — Court performers repeat their entrance through a real theatre curtain.
add('j_sock_and_buskin',r(15,29,88,87,I,1)+p('M15 29H45Q45 58 30 70L36 112H15Z',R)+p('M103 29H78Q75 58 89 70L83 112H103Z',R)+portrait(53,72,.78,'Q',G)+portrait(82,86,.61,'Q',G)+p('M23 44L23 60M96 43L96 61','none',P,1)+p('M42 104Q56 116 72 107M66 103L74 107L67 112','none',G,2)+r(14,116,91,8,G,1));
// 110 — Four teammates' price tickets feed value streams into a vermilion bowl.
add('j_swashbuckler',price(25,36,'2',.75)+price(59,29,'4',.75)+price(93,36,'3',.75)+price(95,64,'5',.75)+p('M25 45Q25 78 47 88M59 41V83M89 46Q89 76 71 88M88 71L78 85','none',G,2.5)+p('M27 87H91Q88 111 59 112Q31 109 27 87Z',R)+e(59,87,32,7,R)+p('M59 112V119M42 122H77','none',I,3)+spark(59,87,.4,G));
// 111 — Wide eight-card fan, with the spent play token crossed through below it.
add('j_troubadour',[-42,-30,-18,-6,6,18,30,42].map((dx,i)=>card(59+dx,54+Math.abs(dx)*.5,i+2,'s',.55,dx*.75)).join('')+token(59,106,1.15,G)+p('M43 90L76 122M74 91L44 121','none',R,4)+p('M22 105H33M86 105H98','none',I,1.2));
// 112 — The press issues a brand-new card carrying a stamped blue seal.
add('j_certificate',press(59,59,1.25)+card(66,101,'A','h',.96,8)+seal(69,107,.36,B)+p('M66 104L69 107L73 101','none',P,1)+p('M23 92H40M23 99H34','none',G,1.5)+rays(85,95,20,5,G));
// 113 — Two red suits flow together, while two dark suits share a second stream.
add('j_smeared',suit('h',29,40,.95,R)+suit('d',84,40,.95,R)+p('M29 53Q29 71 56 73Q83 72 84 54','none',R,9)+c(56,73,8,R)+suit('s',29,108,.9,I)+suit('c',85,108,.9,I)+p('M29 94Q29 80 56 79Q82 79 85 94','none',I,9)+p('M39 62L48 66M66 88L75 92','none',P,1.5)+p('M16 73H29M87 73H103','none',G,1));
// 114 — A winding red road bypasses two blind emblems, gathering energy as it goes.
add('j_throwback',seal(37,43,.72,S)+c(37,43,7,I)+seal(81,87,.72,S)+c(81,87,7,I)+p('M15 114Q50 118 49 92Q47 65 18 69Q9 42 24 24M49 92Q46 57 75 60Q107 62 101 30','none',R,10)+p('M15 114Q50 118 49 92Q47 65 18 69M49 92Q46 57 75 60Q107 62 101 30','none',P,1.2)+spark(101,28,.34,G)+p('M28 121L36 120M98 44L98 52','none',G,2));
// 115 — First ace leaves exactly three successively displaced impressions.
add('j_hanging_chad',card(29,47,'A','s',.9,-11)+p('M42 44Q59 38 69 51M63 45L70 52L62 55','none',R,2.5)+card(52,73,'A','s',.72,8,S)+card(72,91,'A','s',.72,8,S)+card(91,108,'A','s',.72,8,S)+p('M44 96L55 107M61 113L68 120','none',G,1.3));
// 116 — Faceted diamond fragments fall and change into real gold coins.
add('j_rough_gem',p('M31 35L58 21L86 35L76 65L59 82L40 65Z',R)+p('M31 35H86M45 28L44 36L59 82L73 36L69 28M44 36H73','none',P,1.1)+p('M43 75L34 89L46 92ZM64 87L72 94L77 84Z',R)+coin(27,110,.85)+coin(59,106,1)+coin(91,108,.9)+p('M26 79L24 89M94 75L93 86','none',G,2));
// 117 — The heart is embedded in a split stone; only its right half glows.
add('j_bloodstone',p('M21 48L45 26L82 29L101 57L94 105L65 121L29 109L16 78Z',S)+suit('h',58,72,2,R)+p('M59 51Q62 35 77 45Q103 56 59 96Z',G)+p('M59 29L55 43L61 55L56 67L62 81L57 98L64 120','none',I,2.2)+p('M28 60L31 77L25 88M91 64L86 78','none',I,1.2)+rays(77,69,18,6,G));
// 118 — Spade spearhead pries open the ground and exposes blue chip strata.
add('j_arrowhead',p('M16 95L39 87L49 96L70 90L103 97V119H16Z',S)+p('M20 107H98M21 115H98','none',I,1)+p('M58 98L64 114L74 120M39 89L36 101L28 105','none',I,2)+chips(47,116,3,.75)+chips(82,114,3,.8)+g(63,53,1,suit('s',0,0,1.8,I)+p('M0 -21V18M-8 0L0 7L9 0','none',S,1.2),22)+p('M54 74L44 87','none',G,5)+spark(44,87,.27,G));
// 119 — A club in an onyx nodule emits precisely seven red rays.
add('j_onyx_agate',rays(59,72,43,7,R)+p('M23 54L43 34L77 31L96 55L98 87L76 107L43 112L21 87Z',I)+p('M30 57L44 43L72 40M90 69V83L72 100','none',S,1.3)+suit('c',59,72,1.75,P)+p('M52 65L57 62','none',G,1.4));
// 120 — Broken transparent card shards collect into an ascending crystal cluster.
add('j_glass',g(29,100,.8,p('M-13 -20H13V0L2 -3L6 8L-13 20Z',S)+p('M-8 -15L-4 -5M9 -14L2 -4','none',P,1),-14)+p('M25 119L39 113L34 105ZM44 102L56 92L49 84Z',S)+p('M55 113L55 72L66 59L77 74V114L66 122ZM73 115L75 45L88 24L100 46L96 111L87 121Z',B)+p('M66 60V120M88 25L86 119M75 46L88 55L100 46M55 73L66 82L77 74','none',P,1.3)+p('M30 69L41 65L36 56Z',S)+rays(88,36,19,6,G));
// 121 — A printing form with visible rollers releases three identical cards.
add('j_ring_master',r(16,28,86,37,S,3)+r(24,36,70,21,I,1)+p('M28 42H88M28 49H88','none',S,1)+c(28,65,8,G)+c(90,65,8,G)+p('M27 65H90','none',I,3)+card(30,94,'Q','h',.8,-9)+card(60,97,'Q','h',.8)+card(90,94,'Q','h',.8,9)+p('M20 122H100','none',I,1.5));
// 122 — Four suit-bearing cards form individual petals of the potted flower.
add('j_flower_pot',p('M59 101V65M59 89Q44 77 31 90Q40 100 59 95M59 86Q76 73 87 83Q80 96 59 92',I)+card(59,34,'A','h',.62)+card(87,62,'A','d',.62,90)+card(59,87,'A','s',.62,180)+card(31,62,'A','c',.62,-90)+c(59,62,10,G)+p('M41 103H78L72 123H48Z',R)+r(38,100,43,6,R,1)+p('M49 108L51 117','none',P,1));
// 123 — A ruled blueprint copy points specifically at the joker on its right.
add('j_blueprint',r(14,30,47,82,B,2)+p('M20 36H55M20 105H55M20 36V105M55 36V105M20 53H55M20 70H55M20 87H55M31 36V105M43 36V105','none',P,.5)+g(37,72,.52,face(0,0,1,'J',B))+p('M22 43H27M22 43V48M48 96H53V101','none',P,1.5)+portrait(88,73,.82,'J',G)+p('M59 70H70M65 65L72 70L65 75','none',R,3)+ground(122));
// 124 — A tiny deuce at the foot of a towering blue-chip stack causes its growth.
add('j_wee',chips(77,114,16,1.1)+card(29,104,'2','s',.6,-12)+p('M38 96Q39 73 55 62M48 62L56 60L55 69','none',R,2.5)+rays(76,32,14,6,G)+p('M18 119H104','none',I,1.3));
// 125 — Exactly three additional discard tokens squeeze a compressed card fan.
add('j_merry_andy',[30,59,88].map(x=>token(x,40,.9,B)).join('')+p('M23 62L39 79M95 62L80 79M59 57V73','none',R,3)+p('M34 72L40 80L30 77M85 72L79 80L89 77','none',R,2)+card(46,98,'4','s',.8,-12)+card(59,96,'5','s',.8)+card(72,98,'6','s',.8,12)+p('M36 120H82','none',I,1.5));
// 126 — Two identical six-pip dice stand over two equal filled probability bands.
add('j_oops',die(35,56,1,-12)+die(83,56,1,12)+r(18,92,83,12,P,2)+r(18,110,83,12,P,2)+r(20,94,39,8,G,1,I,.7)+r(20,112,78,8,R,1,I,.7)+p('M61 87V124','none',I,1)+p('M47 82L53 76M71 82L65 76','none',G,1.5));
// 127 — A specific seven of hearts is pinned at the center of an archery target.
add('j_idol',c(59,70,43,R)+c(59,70,33,P)+c(59,70,23,B)+c(59,70,12,P)+card(59,70,'7','h',.75)+p('M101 29L68 62','none',I,3)+p('M101 29L104 20M101 29L110 27M101 29L100 20','none',G,2)+p('M65 60L63 67L70 65Z',I)+p('M37 114L29 125M82 114L89 125','none',I,3));
// 128 — Club and heart figures join hands across two mirrored panels.
add('j_seeing_double',r(16,31,40,86,S,3)+r(62,31,40,86,S,3)+r(20,35,32,78,P,1)+r(66,35,32,78,P,1)+suit('c',35,58,1,I)+suit('h',83,58,1,R)+p('M34 75L47 83L54 78L61 85L72 77L82 73','none',I,5)+p('M45 84L51 91L56 88L61 91L68 83L62 78L56 81L52 77Z',P)+p('M25 103L42 87M76 106L94 88','none',B,1)+p('M29 38L24 43M94 38L89 43','none',P,2));
// 129 — Crowned boss bull strikes the cape and shakes loose three gold coins.
add('j_matador',p('M18 70Q28 58 46 66L58 79L53 98H42L40 86H29L25 99H15L19 83Z',I)+p('M43 65L56 58L67 62L71 75L60 81L51 75Z',I)+p('M58 62Q49 48 57 48L63 57M65 62Q79 49 78 61L70 68','none',S,3)+c(63,68,2,P)+crown(49,54,.45,G)+p('M75 38Q97 31 101 54L92 75Q100 90 84 106L72 83L76 65L69 49Z',R)+p('M80 44L90 47L84 61M80 83L87 94','none',P,1.2)+coin(100,93,.6)+coin(91,115,.65)+coin(65,112,.65)+p('M13 120H106','none',I,1));
// 130 — Three departing jacks recede along a winding road and leave a red wake.
add('j_hit_the_road',p('M22 123Q13 94 55 82Q93 70 80 27H96Q114 80 65 96Q43 103 48 123Z',R)+p('M37 123Q24 98 59 89Q103 75 88 27','none',P,1.1)+portrait(38,99,.67,'J',G)+portrait(76,76,.53,'J',G)+portrait(87,44,.42,'J',G)+p('M17 77L27 74M18 84L27 81','none',I,1));
// 131 — A real matched pair stands between two resonating tuning forks.
add('j_duo',p('M18 38V71Q18 83 29 83Q40 83 40 71V38M29 84V118M78 38V71Q78 83 89 83Q100 83 100 71V38M89 84V118','none',S,5)+card(46,69,'8','h',.7,-5)+card(72,69,'8','h',.7,5)+p('M12 46V65M46 35V46M72 35V46M106 46V65','none',G,1.5)+p('M44 103Q59 114 74 103','none',R,2.5)+ground(124));
// 132 — Three identical ranks occupy the vertices of a luminous triangle.
add('j_trio',p('M59 34L96 104H22Z',R)+p('M59 46L84 97H34Z',P)+card(59,39,'9','s',.82)+card(27,99,'9','s',.82,-10)+card(91,99,'9','s',.82,10)+spark(59,80,.5,G)+rays(59,80,17,6,G));
// 133 — Four kings make a single powerful four-cornered red wax impression.
add('j_family',seal(59,73,1.65,R)+card(40,52,'K','h',.65,-10)+card(78,52,'K','s',.65,10)+card(40,94,'K','d',.65,10)+card(78,94,'K','c',.65,-10)+crown(59,74,.55,G)+p('M18 71H24M94 71H101','none',P,1.5));
// 134 — Five consecutive cards join a working gear-and-chain transmission.
add('j_order',gear(31,89,.6)+gear(88,89,.6)+p('M27 73H91Q110 90 91 107H27Q7 89 27 73Z','none',I,6)+p('M27 73H91Q110 90 91 107H27Q7 89 27 73Z','none',G,2)+cards(23,47,['2','3','4','5','6'],'s',.56,18)+p('M23 62V72M41 62V72M59 62V72M77 62V72M95 62V74','none',S,3)+h(30,106,54,5,10)+ground(123));
// 135 — Five clubs share a broad expanding shock wave instead of five separate seals.
add('j_tribe',e(59,88,46,26,'none',R,3)+e(59,88,37,19,'none',G,1.5)+e(59,88,26,12,'none',R,1.5)+[21,40,59,78,97].map((x,i)=>card(x,54+Math.abs(i-2)*7,'A','c',.63,(i-2)*8)).join('')+p('M19 118Q59 132 100 118','none',I,1)+spark(59,91,.35,R));
// 136 — A stunt performer balances a huge chip tower on a very small card fan.
add('j_stuntman',chips(63,74,10,1.1)+cards(48,85,['2','3','4'],'s',.5,14)+person(59,105,.57,'leap',R)+p('M44 96L44 86M76 96L76 86','none',I,3)+p('M29 122H88','none',I,1.5)+p('M37 40L28 43M90 39L99 43','none',G,1.5));
// 137 — Two marked clock hours precede the manifestation of a transparent card.
add('j_invisible',c(36,48,24,P)+p('M36 48L36 32M36 48L48 55','none',I,2)+c(36,25,3,R)+c(59,48,3,R)+p('M16 48H20M36 68V72M19 33L22 36','none',G,1.5)+p('M21 87Q30 110 54 103M47 98L55 103L48 109','none',R,2)+g(81,83,1,r(-16,-27,32,54,'none',2,I,2)+r(-12,-23,24,46,'none',1,S,.8)+p('M-10 -9L3 -22M-9 6L11 -14M-4 22L11 7','none',S,1)+suit('s',0,0,.55,B),9));
// 138 — The mirrored right-hand card links all the way back to the first, far-left joker.
add('j_brainstorm',portrait(28,72,.77,'J',G)+r(72,40,31,65,S,3)+r(76,44,23,57,B,1)+g(88,72,.47,face(0,0,1,'J',S))+p('M91 48L81 59M94 90L84 101','none',P,1.3)+p('M87 37V24H28V44M22 38L28 45L34 38','none',R,2.5)+p('M15 112H103','none',I,1)+p('M17 49V42H23','none',G,2));
// 139 — Metal satellite's collectors bring coins from three clearly different planets.
add('j_satellite',c(26,37,11,R)+c(92,38,12,B)+e(92,38,18,4,'none',I,1)+c(29,108,9,G)+g(64,75,.9,r(-11,-15,22,30,S,2)+r(-37,-12,22,24,B,1)+r(15,-12,22,24,B,1)+p('M-31 -12V12M-23 -12V12M21 -12V12M29 -12V12M-37 0H-15M15 0H37','none',P,.7)+p('M0 -15V-25M-7 -28Q0 -19 7 -28','none',I,2)+c(0,0,6,G),-14)+coin(45,50,.55)+coin(86,91,.55)+coin(49,110,.55)+p('M35 44L43 48M91 54L83 62M35 101L43 97','none',G,1.2));
// 140 — Two queens remain seated at the council table, sending red beams to the field.
add('j_shoot_the_moon',portrait(30,56,.73,'Q',B)+portrait(87,56,.73,'Q',B)+e(59,86,43,13,G)+p('M23 90L20 119M96 90L99 119','none',I,3)+r(39,103,41,20,P,1)+p('M35 79L45 105M58 78L59 105M82 79L73 105','none',R,2.5)+suit('h',59,113,.32,R)+p('M27 92Q57 101 90 91','none',P,1.1));
// 141 — The identity document contains exactly sixteen individually enhanced mini-cards.
add('j_drivers_license',r(12,31,94,80,P,4)+r(17,37,24,35,B,1)+face(29,53,.48,'J',G)+l(17,81,39,81,I,2)+l(17,87,36,87,I,1)+l(17,94,39,94,I,1)+Array.from({length:16},(_,i)=>{const x=48+(i%4)*14,y=38+Math.floor(i/4)*16;return r(x,y,10,14,i%2?S:G,1,I,.8)+p(`M${x+5} ${y+3}L${x+7} ${y+7}L${x+5} ${y+11}L${x+3} ${y+7}Z`,P,I,.5);}).join('')+r(45,106,53,9,B,1)+p('M51 110H91','none',P,1));
// 142 — Tarot appears before the enormous double doors of the blind swing open.
add('j_cartomancer',p('M17 113V38L59 22L101 38V113Z',I)+p('M18 37L43 46V116L18 110ZM100 37L75 46V116L100 110Z',G)+p('M23 45L37 50V104L23 101ZM95 45L81 50V104L95 101Z','none',I,1)+c(37,78,2,I)+c(81,78,2,I)+tarot(59,82,1.05)+rays(59,81,31,8,R)+ground(125));
// 143 — Free planets and a star-stamped celestial packet each carry zero-price tags.
add('j_astronomer',c(27,41,13,B)+e(27,41,20,4,'none',I,1)+c(86,39,15,R)+p('M80 26Q73 37 81 50','none',P,1)+box(59,84,1.1,false)+star(59,82,.4,B)+price(29,63,'0',.68)+price(91,62,'0',.68)+price(73,115,'0',.8)+star(56,29,.25,G)+ground(126));
// 144 — The first discarded pair enters a basket and leaves a more intricate impression.
add('j_burnt',cards(28,39,['7','7'],'s',.65,22)+basket(37,93,.94)+p('M32 55L33 69','none',R,2)+p('M51 101Q70 119 87 101M80 101L88 100L87 108','none',G,2.5)+seal(88,75,.72,R)+card(79,68,'7','s',.54,-9,G)+card(95,81,'7','s',.54,8,G)+rays(88,75,24,8,G)+ground(123));
// 145 — Five coins enter a manifold which powers exactly two red sparks.
add('j_bootstraps',[[24,38],[59,31],[94,38],[40,60],[78,60]].map(([x,y])=>coin(x,y,.8)).join('')+p('M24 49L40 80H78L94 49M59 41V80M40 70V80M78 70V80M47 80L37 96M71 80L81 96','none',I,2.5)+spark(36,105,.7,R)+spark(82,105,.7,R)+p('M48 85H69','none',G,1.5));
// 146 — Broken crowns lift a large rising figure made of red energy.
add('j_caino',crownBroken(28,109,.75)+crownBroken(59,116,.7)+crownBroken(90,109,.75)+p('M41 96L35 75L43 67L36 49L50 45Q43 22 59 21Q76 22 68 45L82 49L75 67L83 75L77 96L66 87L59 105L52 87Z',R)+p('M51 33L55 35M64 35L68 33M55 40Q59 43 64 40M49 55L59 65L70 55M59 66V88','none',P,1.3)+p('M27 91L33 79M87 78L93 91','none',G,2)+rays(59,55,34,7,G));
// 147 — King and queen each receive a separate radiant overhead crown.
add('j_triboulet',portrait(33,88,.88,'K',G)+portrait(85,88,.88,'Q',G)+crown(33,40,.9,G)+crown(85,40,.9,G)+rays(33,40,19,8,R)+rays(85,40,19,8,R)+p('M18 122Q58 114 101 122','none',R,2)+p('M58 73V105','none',G,1));
// 148 — Mechanical discard counter has a large illuminated 23, with card input and basket.
add('j_yorick',r(18,38,83,56,I,4)+r(25,45,69,38,G,2)+r(29,49,28,30,P,2)+r(62,49,28,30,P,2)+t(43,73,'2',28,R)+t(76,73,'3',28,R)+rays(59,64,43,8,G)+r(23,89,74,10,S,1)+card(31,29,'4','s',.48,-13)+p('M31 38V42','none',R,2)+basket(76,109,.6)+p('M24 109H45M24 114H42M24 119H39','none',I,2));
// 149 — The powerless boss crown lies beside a visibly broken prohibition seal.
add('j_chicot',g(36,101,.92,crown(0,0,1,G),-24)+p('M18 119H103','none',I,1.3)+p('M66 37L82 31L97 40L105 56L102 68L92 64L96 54L89 45L79 43L71 49Z',R)+p('M64 55L72 61L68 76L77 86L89 83L96 74L104 80L98 94L80 100L64 91L57 74Z',R)+p('M70 49L91 80','none',I,5)+p('M55 45L47 38M55 56L44 55M62 29L58 20','none',G,2));
// 150 — A consumable tarot projects a self-standing dark twin with its own feet and star.
add('j_perkeo',p('M50 111L76 116L100 105L103 41L73 28L61 44Z',I)+p('M72 35L95 46L94 101L75 110Z','none',S,1.2)+star(83,66,.37,S)+p('M75 94L82 81L91 96Z',S)+p('M77 115L73 123M94 110L101 118','none',I,4)+tarot(37,75,1.12,-12)+p('M46 109L65 116M49 99L66 107','none',S,1.5)+ground(126));
