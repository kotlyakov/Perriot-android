// Original letterpress illustrations for the remaining collection families.
// Each plate is keyed to a catalogue identity; geometry describes the named object.
// No source-game art, pseudo-random marks, or identity hashes are used.
const C={paper:'#eee1bd',light:'#fff4d7',ink:'#244c4c',teal:'#397f81',red:'#b65442',gold:'#b28a3c',blue:'#607e99',purple:'#7b657f',orange:'#b65d2d'};
const path=(d,fill='none',stroke=C.ink,w=3)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const circle=(x,y,r,fill='none',stroke=C.ink,w=3)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
const rect=(x,y,w,h,fill=C.paper,stroke=C.ink,r=2)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const text=(x,y,value,size=12,fill=C.ink)=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="${size}" fill="${fill}">${value}</text>`;
const g=(body,x=19,y=29,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;
const star=(x,y,r=10,fill=C.gold)=>path(`M${x} ${y-r}L${x+3} ${y-3}L${x+r} ${y}L${x+3} ${y+3}L${x} ${y+r}L${x-3} ${y+3}L${x-r} ${y}L${x-3} ${y-3}Z`,fill,fill,1);
const heart=path('M40 66C27 55 9 42 13 28C17 14 34 15 40 27C47 14 63 15 67 28C72 43 53 56 40 66Z',C.red);
const spade=path('M40 13C30 25 12 36 14 48C16 61 32 62 38 52L34 68H46L42 52C49 62 65 61 67 48C69 36 51 25 40 13Z',C.ink);
const diamond=path('M40 11L64 40L40 69L16 40Z',C.gold);
const club=circle(40,24,13,C.teal)+circle(25,43,14,C.teal)+circle(55,43,14,C.teal)+path('M36 44L33 68H47L43 44Z',C.teal);
const card=(x=20,y=12,fill=C.light)=>rect(x,y,40,57,fill)+text(x+9,y+15,'A',11)+g(spade,x+12,y+21,.22);
const coin=(x=40,y=42,r=23)=>circle(x,y,r,C.gold)+circle(x,y,r-5,'none',C.paper,2)+text(x,y+7,'$',25,C.paper);
const crown=path('M12 48L8 20L28 32L40 12L52 32L72 20L68 48Z',C.gold)+rect(14,50,52,13,C.red)+circle(8,18,3,C.gold)+circle(40,10,3,C.gold)+circle(72,18,3,C.gold);
const eye=path('M8 40Q40 8 72 40Q40 72 8 40Z',C.light)+circle(40,40,13,C.teal)+circle(40,40,5,C.ink);
const hand=path('M25 70V49L16 40Q12 31 20 33L29 39V15Q33 8 37 15V34V9Q41 2 45 10V34V13Q49 6 53 14V37V23Q58 17 61 25V49L54 70Z',C.paper);
const telescope=path('M11 31L53 15L62 40L20 55Z',C.teal)+path('M51 13L63 9L75 41L62 46Z',C.gold)+path('M43 46V58M43 58L22 73M43 58L64 73', 'none',C.ink,4)+circle(67,25,9,C.blue);
const globe=circle(40,35,25,C.blue)+path('M20 27L30 17L39 20L36 33L25 36L29 47L19 44M47 15L57 26L49 35L55 43L45 57L39 45L42 34Z',C.teal)+path('M13 12Q-1 44 23 62Q47 78 65 53M40 65V73M23 75H58');
const plant=path('M40 70V27M40 48Q15 50 16 28Q40 25 40 48M40 34Q40 13 65 14Q64 36 40 34','none',C.teal,5)+path('M22 61H58L52 76H28Z',C.gold);
const wand=path('M15 67L61 21','none',C.ink,10)+path('M53 29L65 17','none',C.paper,8)+star(21,18)+star(62,59,8)+star(43,7,5);
const brush=path('M26 47L56 9Q61 4 66 10L72 16Q75 21 70 25L39 58Z',C.gold)+path('M25 48L39 59Q34 76 8 73Q20 69 18 60Z',C.teal)+path('M32 39L47 51','none',C.ink,4);
const palette=path('M40 7C3 7 1 62 30 71Q49 77 51 61Q46 49 60 45Q82 37 69 19Q61 8 40 7Z',C.gold)+circle(51,51,8,C.paper)+circle(25,25,6,C.red)+circle(44,20,6,C.blue)+circle(61,30,5,C.teal)+circle(19,45,5,C.purple);
const die=path('M15 18L55 10L70 26V64L30 73L15 57Z',C.light)+path('M15 18L30 34L70 26M30 34V73')+circle(43,45,3,C.red)+circle(57,56,3,C.red)+circle(45,62,3,C.red)+circle(59,39,3,C.red)+circle(23,40,2,C.ink)+circle(22,56,2,C.ink);
const moon=path('M56 10C13 5 8 57 39 69Q57 76 70 58C33 68 19 28 56 10Z',C.gold)+star(60,25,8)+star(71,42,4);
const sun=circle(40,40,19,C.gold)+Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return path(`M${40+26*Math.cos(a)} ${40+26*Math.sin(a)}L${40+35*Math.cos(a)} ${40+35*Math.sin(a)}`,'none',C.gold,4);}).join('');
const ghost=path('M16 67V30C16 1 63 1 64 30V67L53 58L43 68L32 58L22 68Z',C.light)+circle(31,32,4,C.ink)+circle(49,32,4,C.ink)+path('M33 48Q40 56 48 48');
const jester=path('M15 35L10 12L30 24L42 5L51 25L72 13L65 39Z',C.red)+circle(11,11,4,C.gold)+circle(42,5,4,C.gold)+circle(72,13,4,C.gold)+path('M20 37L61 37L57 61L40 74L23 60Z',C.paper)+circle(30,47,3,C.ink)+circle(51,47,3,C.ink)+path('M30 58Q40 66 51 58','none',C.red,3);
const orbital=circle(40,40,14,C.gold)+`<ellipse cx="40" cy="40" rx="35" ry="14" fill="none" stroke="${C.ink}" stroke-width="3" transform="rotate(-30 40 40)"/>`+circle(66,22,6,C.teal)+star(18,14,5);
const ticket=rect(6,18,68,43,C.paper)+path('M58 18V61','none',C.ink,2)+star(31,40,13)+path('M63 28H68M63 37H68M63 46H68');
const arrows=path('M13 34A28 28 0 0 1 65 24M65 24L65 8M65 24L48 23M67 48A28 28 0 0 1 15 58M15 58L15 74M15 58L32 58','none',C.teal,6);
const scissors=circle(23,57,12,C.red)+circle(55,57,12,C.red)+path('M28 47L61 9M49 47L17 9','none',C.ink,5)+circle(39,35,4,C.gold);
const cube=path('M40 7L69 22V57L40 74L11 57V22Z',C.teal)+path('M11 22L40 39L69 22M40 39V74','none',C.paper,3);
const reel=circle(40,37,30,C.ink)+circle(40,37,7,C.paper)+[[-14,-14],[14,-14],[-14,14],[14,14]].map(([x,y])=>circle(40+x,37+y,8,C.paper)).join('')+path('M40 69H75','none',C.ink,5);
const shelf=rect(11,18,58,50,C.gold)+path('M11 43H69M29 20V42M48 20V42M26 45V65M53 45V65','none',C.paper,5)+path('M8 72H72','none',C.ink,4);
const basket=path('M10 30H70L61 67H19Z',C.gold)+path('M22 30L32 11M58 30L48 11M29 39V58M42 39V58M55 39V58','none',C.ink,4);
const waste=path('M22 23H59L55 70H27Z',C.teal)+path('M17 22H65M30 21V13H51V21M34 32V59M47 32V59','none',C.ink,4);
const crystal=circle(40,30,26,C.blue)+path('M16 57H64L70 71H10Z',C.gold)+star(37,28,14,C.paper)+star(55,16,5,C.paper);
const book=path('M8 18Q26 8 40 21Q55 8 72 18V66Q54 57 40 69Q24 57 8 66Z',C.paper)+path('M40 21V69M16 28L32 27M16 38L32 37M49 27H64M49 37H64');
const hieroglyph=rect(13,7,54,69,C.gold)+eye+path('M23 64H57M40 56V70','none',C.ink,3);
const glyph=rect(12,7,56,69,C.red)+path('M25 55L36 18L47 55M29 42H44M53 22V60M21 65H59','none',C.paper,5);
const bank=path('M8 28L40 8L72 28Z',C.gold)+path('M17 35V63M32 35V63M48 35V63M63 35V63','none',C.ink,7)+rect(9,66,62,9,C.gold)+text(40,26,'$',12,C.paper);
const moneyTree=plant+g(coin(25,25,12),0,0,1)+g(coin(59,35,12),0,0,1);
const hourglass=path('M19 9H61M19 71H61M23 11Q24 30 40 40Q24 50 23 69M57 11Q56 30 40 40Q56 50 57 69','none',C.ink,5)+path('M28 24H52L40 36ZM27 66L40 48L53 66Z',C.gold,C.gold);
const chips=circle(28,48,22,C.teal)+circle(28,48,15,'none',C.paper,3)+circle(51,28,22,C.red)+circle(51,28,15,'none',C.paper,3)+text(51,34,'+',20,C.paper);
const rose=path('M40 72V39M40 58Q16 60 18 44Q38 42 40 58M40 51Q64 54 63 38Q42 37 40 51','none',C.teal,4)+circle(40,24,16,C.red)+circle(29,22,10,C.red)+circle(51,22,10,C.red)+circle(40,13,10,C.red)+circle(40,26,7,C.gold);
const gem=path('M9 28L25 9H55L72 28L40 71Z',C.blue)+path('M9 28H72M25 9L28 28L40 71L53 28L55 9M28 28L40 9L53 28','none',C.paper,2);
const mask=path('M13 18Q40 33 67 18L63 55Q40 83 17 55Z',C.paper)+path('M22 37L34 41M47 41L59 37M29 57Q40 49 52 57','none',C.red,5);
const cardFan=Array.from({length:3},(_,i)=>`<g transform="rotate(${(i-1)*19} 40 69)">${card(21,11+i*2)}</g>`).join('');
const icons={heart,spade,diamond,club,card:card(),coin:coin(),crown,eye,hand,telescope,globe,plant,wand,brush,palette,die,moon,sun,ghost,jester,orbital,ticket,arrows,scissors,cube,reel,shelf,basket,waste,crystal,book,hieroglyph,glyph,bank,moneyTree,hourglass,chips,rose,gem,mask,cardFan};
const svg=(id,set,body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118 138" aria-hidden="true" data-collection-art="${id}" data-art-family="${set}">${body}</svg>`;

// The two voucher levels share their economic object, with an additional hand-drawn
// device for the upgraded benefit; this is a ticket plate, independent of shop DOM.
const vouchers={
 overstock_norm:['shelf','I'],overstock_plus:['shelf','II','basket'],clearance_sale:['basket','−25%'],liquidation:['basket','−50%','coin'],
 hone:['gem','II'],glow_up:['gem','IV','sun'],reroll_surplus:['arrows','−2'],reroll_glut:['arrows','−4','die'],
 crystal_ball:['crystal','I'],omen_globe:['crystal','II','ghost'],telescope:['telescope','I'],observatory:['telescope','II','orbital'],
 grabber:['hand','+1'],nacho_tong:['hand','+2','card'],wasteful:['waste','+1'],recyclomancy:['waste','+2','arrows'],
 tarot_merchant:['book','I'],tarot_tycoon:['book','II','crown'],planet_merchant:['globe','I'],planet_tycoon:['globe','II','orbital'],
 seed_money:['plant','$10'],money_tree:['moneyTree','$20'],blank:[null,'—'],antimatter:['cube','+1','star'],
 magic_trick:['wand','I'],illusion:['wand','II','cardFan'],hieroglyph:['hieroglyph','−1'],petroglyph:['glyph','−1'],
 directors_cut:['reel','I'],retcon:['reel','∞','scissors'],paint_brush:['brush','+1'],palette:['palette','+2'],
};
function voucherArt(id){const data=vouchers[id.slice(2)];if(!data)return null;const [icon,value,extra]=data;
 const body=path('M10 17H108V31Q98 31 98 41Q98 51 108 51V88Q98 88 98 98Q98 108 108 108V122H10V108Q20 108 20 98Q20 88 10 88V51Q20 51 20 41Q20 31 10 31Z',C.paper,C.ink,2)+path('M18 96H99','none',C.gold,2)+text(59,29,'ПЬЕРО · БИЛЕТ',8)+g(icon?icons[icon]:'',29,32,.75)+(extra?g(extra==='star'?star(40,40,24):icons[extra],69,59,.39):'')+text(59,115,value,15,C.red);
 return svg(id,'Voucher',body);
}
const packFamilies={
 arcana:{color:C.orange,title:'АРКАНА',images:['moon','sun','eye','book']},
 celestial:{color:C.blue,title:'КОСМОС',images:['orbital','globe','telescope','sun']},
 spectral:{color:C.teal,title:'ПРИЗРАК',images:['ghost','crystal']},
 standard:{color:C.red,title:'КАРТЫ',images:['cardFan','spade','heart','club']},
 buffoon:{color:C.gold,title:'ШУТЫ',images:['jester','mask']},
};
function boosterArt(id){const match=/^p_(arcana|celestial|spectral|standard|buffoon)_(normal|jumbo|mega)_([1-4])$/.exec(id);if(!match)return null;const [,family,tier,raw]=match,f=packFamilies[family],i=Number(raw)-1;
 if(i>=f.images.length||tier!=='normal'&&i>=(['spectral','buffoon'].includes(family)?1:2))return null;
 const image=icons[f.images[i]],size={normal:'НАБОР',jumbo:'БОЛЬШОЙ',mega:'МЕГА'}[tier];
 let body=path('M15 5H103L107 132H11Z',f.color)+path('M15 15H103M12 122H106','none',C.paper,3)+Array.from({length:11},(_,n)=>path(`M${20+n*7} 6V12M${17+n*8} 125V131`,'none',C.paper,1)).join('')+rect(20,24,78,83,C.paper,f.color,3);
 if(tier==='normal')body+=g(image,24,26,.86);
 if(tier==='jumbo')body+=g(icons[f.images[(i+1)%f.images.length]],22,27,.52)+g(image,38,46,.71)+path('M23 98H95','none',f.color,3);
 if(tier==='mega')body+=g(image,26,30,.8)+g(icons[f.images[(i+2)%f.images.length]],57,62,.44)+path('M20 27L27 34M98 27L91 34M20 104L27 97M98 104L91 97','none',C.gold,4)+star(24,79,6)+star(91,46,6);
 body+=text(59,23,f.title,8,C.paper)+rect(25,109,68,12,C.paper,C.paper,1)+text(59,118,size,9,f.color);
 return svg(id,'Booster',body);
}

const deckColors={red:'#b65442',blue:'#397f81',yellow:'#b28a3c',green:'#56846b',black:'#303a41',magic:'#7b657f',nebula:'#515d83',ghost:'#88948d',abandoned:'#82664c',checkered:'#a55255',zodiac:'#667098',painted:'#a66d86',anaglyph:'#468588',plasma:'#927196',erratic:'#93804e'};
function backArt(id){const key=id.slice(2),color=deckColors[key];if(!color)return null;
 let pattern=Array.from({length:14},(_,i)=>path(`M${-100+i*18} 7L${26+i*18} 132`,'none',C.paper,1)).join('');
 let center=g(key==='black'?spade.replaceAll(C.ink,C.paper):spade,35,42,.6);
 if(key==='checkered'){pattern=Array.from({length:7},(_,r)=>Array.from({length:5},(_,c)=>(r+c)%2?rect(11+c*20,10+r*18,20,18,C.paper,'none',0):'').join('')).join('');center=g(heart,35,42,.6);}
 if(key==='plasma'){pattern=Array.from({length:8},(_,i)=>`<ellipse cx="59" cy="69" rx="${7+i*7}" ry="${10+i*10}" fill="none" stroke="${C.paper}" stroke-width="2"/>`).join('');center='';}
 if(key==='painted'){pattern=path('M7 36L111 87V115L7 64Z',C.gold,'none')+path('M7 77L111 20V45L7 101Z',C.teal,'none')+path('M20 131L105 9','none',C.paper,5);center=g(brush,36,43,.6);}
 if(key==='anaglyph'){pattern=Array.from({length:8},(_,i)=>path(`M${-50+i*22} 8L${25+i*22} 130`,'none',i%2?C.red:C.blue,8)).join('');center=g(eye,35,43,.6);}
 if(key==='magic')center=g(wand,26,36,.8);
 if(key==='nebula')center=g(orbital,26,37,.8);
 if(key==='ghost')center=g(ghost,29,36,.75);
 if(key==='abandoned')center=g(path('M18 62V26L40 9L62 26V62Z',C.paper)+path('M32 62V42H48V62M15 18L11 8M64 18L70 8'),26,37,.8);
 if(key==='zodiac')center=g(sun,26,37,.8)+g(moon,47,62,.35);
 if(key==='erratic'){pattern=Array.from({length:5},(_,r)=>Array.from({length:4},(_,c)=>g([spade,heart,diamond,club][(r*3+c)%4],15+c*22,16+r*23,.24)).join('')).join('');center=g(spade,38,47,.37)+g(heart,55,65,.37);}
 return svg(id,'Back',rect(7,4,104,130,C.paper,C.ink,5)+rect(12,9,94,120,color,color,2)+`<svg x="13" y="10" width="92" height="118" viewBox="13 10 92 118">${pattern}</svg>`+rect(18,15,82,108,'none',C.paper,2)+circle(59,69,27,color,C.paper,2)+center);
}

const playingBase=(fill=C.light)=>rect(11,5,96,128,fill,C.ink,5)+text(24,25,'7',19)+g(heart,17,27,.16)+text(94,124,'7',19)+g(heart,88,99,.16);
const pips=(fill=C.red)=>[[42,31],[76,31],[42,63],[76,63],[42,95],[76,95],[59,47]].map(([x,y])=>`<g transform="translate(${x-8} ${y-8}) scale(.2)">${heart.replaceAll(C.red,fill)}</g>`).join('');
const enhancements={bonus:true,mult:true,wild:true,glass:true,steel:true,gold:true,lucky:true,
 stone:()=>rect(11,5,96,128,'#c6bd9f',C.ink,5)+path('M22 17L89 14L100 45L91 119L26 125L16 80Z','#928e7d')+path('M23 43L43 30L59 46L87 34M20 82L43 65L62 89L94 71M31 112L49 96L74 115','none','#d4cbb3',4)+circle(38,58,4,'#666f64')+circle(78,102,5,'#666f64'),
};
function enhancedArt(id){
 const key=id.slice(2);if(!enhancements[key])return null;
 if(key==='stone')return svg(id,'Enhanced',enhancements.stone());
 const paper={bonus:'#e4edf0',mult:'#f1dfd3',wild:'#f4eddb',glass:'#e4fbff',steel:'#4c5d70',gold:'#ddbb59',lucky:'#e5f0d7'}[key];
 const ink=key==='steel'?'#f1ead4':key==='glass'?'#276d83':C.ink;
 const orb=(x,y,r)=>`<g data-wild-symbol="true" transform="translate(${x} ${y}) scale(${r/11})"><circle r="11" fill="#d3d3c1"/><defs><clipPath id="wild-orb-circle"><circle r="11"/></clipPath></defs><g clip-path="url(#wild-orb-circle)"><g style="filter:blur(2.1px)"><circle cx="-4" cy="-4" r="6.5" fill="#283c53"/><circle cx="4" cy="-4" r="6.5" fill="#bb3034"/><circle cx="-4" cy="4" r="6.5" fill="#33835c"/><circle cx="4" cy="4" r="6.5" fill="#3b86b8"/></g></g></g>`;
 const ranks=`<g data-rank="top">${text(24,25,'7',19,C.ink)}${key==='wild'?orb(24,34,4.5):g(heart,17,27,.16)}</g><g data-rank="bottom">${text(94,124,'7',19,C.ink)}${key==='wild'?orb(94,101,4):g(heart,88,99,.16)}</g>`;
 let finish='',marks=pips(ink);
 if(key==='wild')marks=[[42,31],[76,31],[42,63],[76,63],[42,95],[76,95],[59,47]].map(([x,y])=>orb(x,y,9)).join('');
 if(key==='glass')finish=path('M32 13L84 122L102 86L69 13Z','#ffffff70','#82ccdd',1)+path('M31 84L60 18L83 106L57 123Z','#b3edf355','none')+path('M35 22L80 116M89 46L98 67','none','#fff',3);
 if(key==='steel')finish=Array.from({length:13},(_,i)=>path(`M34 ${15+i*8}L85 ${8+i*8}`,'none','#dbe4ed',.6)).join('')+[[36,19],[83,19],[36,119],[83,119]].map(([x,y])=>circle(x,y,2.3,'#d7e2e7','#293b4d',1)).join('');
 if(key==='gold')finish=path('M34 13L83 121L100 94L62 13Z','#f5df8c99','none');
 if(key==='lucky'){
  marks='';finish=`<g data-four-leaf-clover="true" transform="translate(59 65)"><path d="M0 2Q-30-3-25-24Q-8-34 0-10Q8-34 25-24Q30-3 0 2Q30 7 24 28Q7 35 0 12Q-7 35-24 28Q-30 7 0 2Z" fill="#3f824e" stroke="#234d38" stroke-width="2"/><path d="M0 5Q4 31 14 43M0 1L-17-18M0 1L17-18M0 5L-16 22M0 5L16 22" fill="none" stroke="#b7d38a" stroke-width="2.2"/></g>`+star(84,29,5,C.gold)+star(34,100,4,C.gold);
 }
 // All decoration stays in the body. Rank/suit corners are printed last on clear paper.
 const clip='enhancement-body-'+key;
 return svg(id,'Enhanced',`<g data-enhancement-art="${key}">${rect(11,5,96,128,paper,C.ink,5)}<defs><clipPath id="${clip}"><rect x="32" y="12" width="55" height="114" rx="4"/></clipPath></defs><g data-enhancement-body="true" clip-path="url(#${clip})">${finish}${marks}</g>${rect(15,10,17,34,C.light,'none')}${rect(86,96,17,34,C.light,'none')}${ranks}</g>`);
}
const editionColors={foil:['#78918c','#e5e2ba','#739797'],holo:['#b993a2','#7c9c9f','#d2ba80'],polychrome:['#b65442','#c6ad58','#397f81'],negative:['#273e46','#647a7b','#192b37']};
function editionArt(id){let key=id.slice(2);if(key==='base')return svg(id,'Edition',playingBase()+pips());if(key==='holographic')key='holo';const colors=editionColors[key];if(!colors)return null;const gid='collection-material-'+key;
 const gradient=`<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">${colors.map((c,i)=>`<stop offset="${i/2}" stop-color="${c}"/>`).join('')}</linearGradient></defs>`;
 let body=playingBase(`url(#${gid})`)+pips(key==='negative'?C.paper:C.ink);
 if(key==='foil')body+=Array.from({length:13},(_,i)=>path(`M14 ${20+i*8}L104 ${9+i*8}`,'none',C.paper,.7)).join('')+star(79,49,13,C.paper)+star(32,86,7,C.paper);
 if(key==='holo')body+=Array.from({length:7},(_,i)=>`<ellipse cx="59" cy="69" rx="${8+i*8}" ry="${15+i*10}" fill="none" stroke="${C.paper}" opacity=".35" stroke-width="3"/>`).join('');
 if(key==='polychrome')body+=path('M13 94L105 17M13 116L105 39M28 132L105 66','none',C.light,4)+star(79,55,12,C.light);
 if(key==='negative')body+=rect(17,11,84,116,'none',C.paper,2)+path('M23 69H95','none',C.paper,1)+g(spade.replaceAll(C.ink,C.paper),41,48,.45);
 return svg(id,'Edition',gradient+`<defs><clipPath id="${gid}-clip"><rect x="11" y="5" width="96" height="128" rx="5"/></clipPath></defs><g clip-path="url(#${gid}-clip)">${body}</g>`);
}
const sealColors={red:C.red,gold:C.gold,blue:C.blue,purple:C.purple};
function sealArt(id){const key=id.replace(/^seal_/,'').replace(/_seal$/,'').toLowerCase(),color=sealColors[key];if(!color)return null;
 const wax='M59 25C68 23 68 30 78 29C87 28 82 38 90 42C97 46 89 54 94 61C101 72 88 74 91 83C94 94 81 90 79 99C76 109 65 99 59 104C51 111 49 99 40 101C30 104 35 91 26 88C17 85 27 76 22 68C16 59 28 55 24 46C20 36 35 40 37 31C39 21 50 31 59 25Z';
 const symbol={red:arrows,gold:coin(),blue:orbital,purple:book}[key];
 return svg(id,'Seal',playingBase()+pips()+path('M38 90Q30 110 40 114Q48 115 47 98M75 90Q85 103 78 110Q68 114 69 97',color)+path(wax,color,C.ink,2)+circle(59,65,29,'none',C.paper,1.5)+circle(59,65,25,'none','#263e3d55',2)+g(symbol,39,45,.5)+path('M32 46Q35 38 44 36M80 84L75 91','none',C.paper,2));
}

const tags={
 uncommon:['rose',C.teal],rare:['gem',C.red],negative:['mask',C.ink],foil:['chips',C.blue],holo:['eye',C.purple],polychrome:['palette',C.gold],
 investment:['bank',C.gold],voucher:['ticket',C.teal],boss:['crown',C.red],standard:['cardFan',C.red],charm:['moon',C.purple],meteor:['orbital',C.blue],buffoon:['jester',C.gold],handy:['hand',C.teal],garbage:['waste',C.ink],ethereal:['ghost',C.blue],coupon:['scissors',C.gold],double:['ticket',C.red],juggle:['cardFan',C.purple],d_six:['die',C.red],top_up:['jester',C.teal],skip:['arrows',C.blue],orbital:['telescope',C.blue],economy:['coin',C.gold],
};
function tagArt(id){const key=id.slice(4),data=tags[key];if(!data)return null;const [icon,color]=data;
 let image=g(icons[icon],29,37,.75);
 if(key==='double')image=g(ticket,19,31,.7)+g(ticket,36,53,.7);
 if(key==='top_up')image=g(jester,18,36,.61)+g(jester,56,44,.57);
 if(key==='juggle')image=g(cardFan,28,49,.7)+circle(31,35,5,C.red)+circle(59,23,5,C.gold)+circle(87,35,5,C.teal);
 if(key==='negative')image=g(mask.replaceAll(C.paper,C.ink).replaceAll(C.red,C.paper),29,37,.75);
 if(key==='foil')image+=star(83,44,8,C.paper)+star(39,90,5,C.paper);
 if(key==='holo')image+=path('M32 99L89 34M40 105L96 43','none',C.gold,2);
 return svg(id,'Tag',path('M23 15H95L107 31V104L59 129L11 104V31Z',C.paper)+path('M20 33H98V99L59 120L20 99Z',color,color,2)+path('M25 38H93V95L59 111L25 95Z',C.paper,color,1)+circle(59,25,5,color)+image);
}
const blindIcons={
 small:coin(40,40,21),big:coin(40,40,29)+star(40,40,11,C.paper),
 hook:path('M50 10V47Q50 69 29 65Q10 61 17 42L28 48','none',C.ink,8)+circle(50,12,7,C.gold),
 ox:path('M23 27Q4 20 10 6Q13 22 29 16M56 27Q76 20 70 6Q68 22 51 16','none',C.ink,5)+path('M24 20H56L62 49L49 69H31L18 49Z',C.gold)+circle(28,37,3,C.ink)+circle(53,37,3,C.ink)+path('M31 56H49'),
 house:path('M8 34L40 7L72 34Z',C.red)+path('M16 34H65V71H16Z',C.gold)+rect(32,48,17,23,C.ink)+rect(21,39,9,10,C.paper),
 wall:Array.from({length:5},(_,r)=>Array.from({length:3},(_,c)=>rect(6+c*24+(r%2?9:0),9+r*13,r%2&&c===2?14:23,12,r%2?C.gold:C.paper,C.ink,0)).join('')).join(''),
 wheel:circle(40,40,30,C.gold)+circle(40,40,8,C.paper)+Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return path(`M${40+10*Math.cos(a)} ${40+10*Math.sin(a)}L${40+27*Math.cos(a)} ${40+27*Math.sin(a)}`,'none',C.ink,4);}).join(''),
 arm:hand+path('M21 70L10 76H54L58 70Z',C.red),club,
 fish:path('M13 40Q34 8 61 39L75 25V57L61 43Q35 72 13 40Z',C.teal)+circle(27,35,3,C.paper)+path('M46 24L39 40L48 57M11 22L4 16'),
 psychic:eye+star(40,7,5,C.gold)+path('M17 60L11 68M63 60L69 68','none',C.gold,3),goad:spade,
 water:path('M40 6C28 26 12 40 18 57C25 80 59 80 64 57C69 40 52 25 40 6Z',C.blue)+path('M27 51Q27 63 40 64','none',C.paper,4),
 window:rect(18,8,44,64,C.blue)+path('M40 9V71M19 39H61','none',C.paper,4)+g(diamond,28,27,.3),
 manacle:circle(19,40,15,C.gold)+circle(61,40,15,C.gold)+path('M30 40H50M10 29L5 20M70 29L75 20','none',C.ink,5),eye,
 mouth:path('M6 39Q22 24 40 29Q58 24 74 39Q53 73 40 71Q22 71 6 39Z',C.red)+path('M9 39Q40 48 70 39L60 54H20Z',C.ink)+path('M18 40L23 49L30 43L38 52L46 43L55 49L62 40Z',C.paper),
 plant:rose,
 serpent:path('M19 66Q6 48 24 44L55 44Q74 40 62 26Q55 19 37 25Q21 32 21 17Q21 7 41 8','none',C.teal,12)+path('M40 3L54 8L41 18Z',C.gold)+circle(45,8,2,C.ink)+path('M56 8L65 3M61 5L65 9','none',C.red,2),
 pillar:rect(17,10,46,12,C.gold)+rect(22,24,36,43,C.paper)+path('M30 28V64M40 28V64M50 28V64','none',C.ink,3)+rect(16,68,48,9,C.gold),
 needle:path('M65 7L19 70','none',C.ink,4)+path('M55 17L61 9','none',C.paper,2)+path('M59 16Q21 6 9 30Q1 49 28 57','none',C.red,2),head:heart,
 tooth:path('M20 9Q30 5 40 12Q52 3 63 13Q72 30 58 52L52 73L43 53L35 73L26 52Q9 28 20 9Z',C.paper)+path('M27 18Q35 23 42 19','none',C.gold,3),
 flint:path('M20 20L48 8L66 33L54 69L18 61L8 40Z','#7a857a')+path('M20 20L31 39L48 8M31 39L54 69M31 39L66 33','none',C.paper,2)+star(69,59,8,C.gold),
 mark:mask+path('M23 16L56 68','none',C.red,5),
 final_acorn:path('M24 35H58V48Q59 65 40 73Q21 65 24 48Z',C.gold)+path('M17 36Q19 15 41 17Q62 17 66 36Z',C.ink)+path('M40 17L45 6','none',C.ink,5)+path('M24 28H58M31 21L38 35M46 20L53 35','none',C.paper,2),
 final_leaf:path('M66 8Q9 4 14 48Q16 69 33 69Q68 69 66 8Z',C.teal)+path('M17 73L55 22M33 52V29M43 42H58','none',C.paper,3),
 final_vessel:path('M24 9H56L51 29Q70 42 65 59Q62 75 40 75Q18 75 15 59Q10 42 29 29Z',C.purple)+path('M26 17H54M22 52H58M26 63H54','none',C.paper,3),
 final_heart:heart+path('M40 21L34 36L45 46L36 64','none',C.paper,4)+star(16,13,6,C.gold),
 final_bell:path('M14 59Q25 45 23 30Q23 8 40 8Q59 8 57 30Q56 45 68 59Z',C.blue)+rect(11,59,59,9,C.gold)+circle(40,71,6,C.gold)+path('M40 7V2M14 15L8 9M66 15L72 9','none',C.ink,3),
};
const blindColors={small:C.gold,big:C.blue,hook:C.gold,ox:C.red,house:C.gold,wall:C.red,wheel:C.gold,arm:C.teal,club:C.teal,fish:C.blue,psychic:C.purple,goad:C.ink,water:C.blue,window:C.gold,manacle:C.ink,eye:C.teal,mouth:C.red,plant:C.teal,serpent:C.gold,pillar:C.ink,needle:C.gold,head:C.red,tooth:C.paper,flint:C.blue,mark:C.purple,final_acorn:C.gold,final_leaf:C.teal,final_vessel:C.purple,final_heart:C.red,final_bell:C.blue};
function blindArt(id){const key=id.slice(3),image=blindIcons[key];if(!image)return null;const color=blindColors[key],final=key.startsWith('final_');
 const edge=Array.from({length:24},(_,i)=>{const a=i*Math.PI/12;return path(`M${59+48*Math.cos(a)} ${69+48*Math.sin(a)}L${59+43*Math.cos(a)} ${69+43*Math.sin(a)}`,'none',C.paper,3);}).join('');
 const body=circle(59,69,52,C.ink)+circle(59,69,48,color,C.ink,2)+edge+circle(59,69,38,C.paper,C.ink,2)+g(image,29,39,.75)+(final?path('M34 10L40 19L48 10L59 19L70 10L78 19L84 10','none',color,3):'');
 return svg(id,'Blind',body);
}
export function collectionArtworkSvg(id){
 if(typeof id!=='string')return null;
 if(id.startsWith('p_'))return boosterArt(id);
 if(id.startsWith('v_'))return voucherArt(id);
 if(id.startsWith('b_'))return backArt(id);
 if(id.startsWith('m_'))return enhancedArt(id);
 if(id.startsWith('e_'))return editionArt(id);
 if(id.startsWith('seal_')||id.endsWith('_seal'))return sealArt(id);
 if(id.startsWith('tag_'))return tagArt(id);
 if(id.startsWith('bl_'))return blindArt(id);
 return null;
}
export const COLLECTION_ART_IDS=Object.freeze([
 ...Object.keys(vouchers).map(k=>'v_'+k),
 ...Object.keys(packFamilies).flatMap(f=>['normal','jumbo','mega'].flatMap(t=>Array.from({length:t==='normal'?packFamilies[f].images.length:['spectral','buffoon'].includes(f)?1:2},(_,i)=>`p_${f}_${t}_${i+1}`))),
 ...Object.keys(deckColors).map(k=>'b_'+k),...Object.keys(enhancements).map(k=>'m_'+k),
 'e_base',...Object.keys(editionColors).map(k=>'e_'+k),...Object.keys(sealColors).map(k=>'seal_'+k),
 ...Object.keys(tags).map(k=>'tag_'+k),...Object.keys(blindIcons).map(k=>'bl_'+k),
]);
