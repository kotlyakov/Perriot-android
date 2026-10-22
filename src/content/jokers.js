import {validJokerStickers} from '../core/joker-stickers.js';
import catalogue from './apk-shop-catalog.js';
import {validItem7Ability} from '../core/joker-item7-lifecycle.js';
import {isCardFace} from '../core/card-faces.js';
import {isCardSuit} from '../core/card-suits.js';

export const SCORED_RETRIGGER_JOKERS=Object.freeze(['j_dusk','j_hack','j_sock_and_buskin','j_hanging_chad']);

// Exact supported scoring slice; the random shop still uses the complete catalogue.
export const BASE_NATIVE_JOKERS=Object.freeze(['j_joker','j_jolly','j_zany','j_mad','j_crazy','j_droll','j_sly','j_wily','j_clever','j_devious','j_crafty','j_half','j_splash','j_abstract','j_duo','j_trio','j_family','j_order','j_tribe','j_greedy_joker','j_lusty_joker','j_wrathful_joker','j_gluttenous_joker','j_scary_face','j_even_steven','j_odd_todd','j_scholar','j_fibonacci','j_arrowhead','j_onyx_agate','j_smiley','j_walkie_talkie','j_acrobat','j_banner','j_blackboard','j_mystic_summit','j_raised_fist','j_stencil','j_baron','j_shoot_the_moon','j_flower_pot','j_seeing_double','j_stone','j_steel_joker','j_bull','j_drivers_license','j_bootstraps','j_blue_joker','j_swashbuckler','j_four_fingers','j_shortcut','j_golden','j_cloud_9',...SCORED_RETRIGGER_JOKERS,'j_mime','j_pareidolia','j_blueprint','j_brainstorm','j_selzer','j_dna','j_marble']);
// The approved halves stay explicit; item7b completes the native150 catalogue.
export const ITEM7A_JOKERS=Object.freeze(['j_credit_card','j_loyalty_card','j_misprint','j_chaos','j_delayed_grat','j_gros_michel','j_business','j_supernova','j_ride_the_bus','j_space','j_egg','j_burglar','j_runner','j_ice_cream','j_constellation','j_hiker','j_faceless','j_green_joker','j_cavendish','j_card_sharp','j_red_card','j_square','j_rough_gem','j_bloodstone','j_photograph','j_ticket','j_reserved_parking','j_fortune_teller','j_erosion','j_stuntman','j_drunkard','j_juggler','j_merry_andy','j_troubadour','j_turtle_bean','j_popcorn','j_ramen','j_flash','j_rocket','j_satellite','j_to_the_moon','j_throwback','j_oops']);
export const ITEM7B_JOKERS=Object.freeze(catalogue.centres.filter(c=>c.set==='Joker'&&!BASE_NATIVE_JOKERS.includes(c.key)&&!ITEM7A_JOKERS.includes(c.key)).map(c=>c.key));
export const ITEM7_JOKERS=Object.freeze([...ITEM7A_JOKERS,...ITEM7B_JOKERS]);
export const NATIVE_JOKERS=Object.freeze([...BASE_NATIVE_JOKERS,...ITEM7_JOKERS]);
export const SUPPORTED_JOKERS=Object.freeze(['joker_joker','joker_sly_joker','joker_clever_joker','joker_splash',...NATIVE_JOKERS]);
const aliases={joker_joker:'j_joker',joker_sly_joker:'j_sly',joker_clever_joker:'j_clever',joker_splash:'j_splash'};
export const originalJokerKey=id=>aliases[id]??id;
export function handRecognitionOptions(jokers=[]){return {fourFingers:jokers.some(j=>originalJokerKey(j.entityId)==='j_four_fingers'&&!j.debuffed),jokers,shortcut:jokers.some(j=>originalJokerKey(j.entityId)==='j_shortcut'&&!j.debuffed)};}
export function supportsJoker(offer,{owned=false}={}){return !!offer&&validItem7Ability(offer)&&(!Object.hasOwn(offer,'repeatHandsRemaining')||originalJokerKey(offer.entityId)==='j_selzer'&&Number.isSafeInteger(offer.repeatHandsRemaining)&&offer.repeatHandsRemaining>=1&&offer.repeatHandsRemaining<=10)&&SUPPORTED_JOKERS.includes(offer.entityId)&&['base','foil','holographic','polychrome','negative'].includes(offer.edition??'base')&&validJokerStickers(offer)&&(!Object.hasOwn(offer,'debuffed')||typeof offer.debuffed==='boolean')&&(owned||!offer.debuffed);}
const combination={j_jolly:['pair','add_mult',8n],j_zany:['three','add_mult',12n],j_mad:['two_pair','add_mult',10n],j_crazy:['straight','add_mult',12n],j_droll:['flush','add_mult',10n],j_sly:['pair','add_chips',50n],j_wily:['three','add_chips',100n],j_clever:['two_pair','add_chips',80n],j_devious:['straight','add_chips',100n],j_crafty:['flush','add_chips',80n],j_duo:['pair','multiply_mult',2n],j_trio:['three','multiply_mult',3n],j_family:['four','multiply_mult',4n],j_order:['straight','multiply_mult',3n],j_tribe:['flush','multiply_mult',2n]};
export function independentEffect(entityId,rankCounts,{playedCards=[],handId,jokerCount=1,handsRemaining,discardsRemaining,heldCards=[],jokerSlots=5,negativeCount=0,stencilCount=0,scoringCards=playedCards,isCardDebuffed=card=>card.debuffed===true,playingCards=[],money=0n,drawCount=0,otherSellCost=0n,jokers=[]}={}){
 const key=originalJokerKey(entityId),rule=combination[key];
 if(rule){const [kind,operation,amount]=rule;const yes={pair:rankCounts.some(n=>n>=2),three:rankCounts.some(n=>n>=3),four:rankCounts.some(n=>n>=4),two_pair:rankCounts.filter(n=>n>=2).length>=2,straight:['straight','straight_flush'].includes(handId),flush:['flush','straight_flush','flush_house','flush_five'].includes(handId)}[kind];return yes?{operation,amount}:null;}
 if(key==='j_joker')return {operation:'add_mult',amount:4n};
 if(key==='j_half'&&playedCards.length<=3)return {operation:'add_mult',amount:20n};
 if(key==='j_abstract')return {operation:'add_mult',amount:BigInt(jokerCount)*3n};
 if(key==='j_acrobat'&&handsRemaining===1)return {operation:'multiply_mult',amount:3n};
 if(key==='j_banner'&&discardsRemaining>0)return {operation:'add_chips',amount:BigInt(discardsRemaining)*30n};
 if(key==='j_mystic_summit'&&discardsRemaining===0)return {operation:'add_mult',amount:15n};
 if(key==='j_blackboard'&&heldCards.every(card=>card.enhancement!=='stone'&&(isCardSuit(card,'clubs',{jokers})||isCardSuit(card,'spades',{jokers}))))return {operation:'multiply_mult',amount:3n};
 if(key==='j_stencil'){
  const empty=jokerSlots+negativeCount-jokerCount;
  const amount=empty+stencilCount;
  if(amount>1)return {operation:'multiply_mult',amount:BigInt(amount)};
 }
 if(key==='j_flower_pot'||key==='j_seeing_double'){
  const suits=key==='j_flower_pot'?['hearts','diamonds','spades','clubs']:['clubs','diamonds','spades','hearts'];
  const present=new Set();
  for(const card of scoringCards)if(card.enhancement!=='wild'){
   if(key==='j_flower_pot'){const suit=suits.find(suit=>!present.has(suit)&&isCardSuit(card,suit,{bypassDebuff:true,jokers}));if(suit)present.add(suit);}
   else for(const suit of suits)if(isCardSuit(card,suit,{debuffed:isCardDebuffed(card),jokers}))present.add(suit);
  }
  for(const card of scoringCards)if(card.enhancement==='wild'){const suit=suits.find(suit=>!present.has(suit)&&isCardSuit(card,suit,{debuffed:isCardDebuffed(card),jokers}));if(suit)present.add(suit);}
  if(key==='j_flower_pot'?present.size===4:present.has('clubs')&&present.size>=2)return {operation:'multiply_mult',amount:key==='j_flower_pot'?3n:2n};
 }
 if(key==='j_stone'){const count=playingCards.filter(card=>card.enhancement==='stone').length;if(count)return {operation:'add_chips',amount:25n*BigInt(count)};}
 if(key==='j_steel_joker'){const count=playingCards.filter(card=>card.enhancement==='steel').length;if(count)return {operation:'multiply_mult',amount:{n:5n+BigInt(count),d:5n}};}
 if(key==='j_drivers_license'&&playingCards.filter(card=>card.enhancement&&card.enhancement!=='base').length>=16)return {operation:'multiply_mult',amount:3n};
 if(key==='j_blue_joker'&&drawCount>0)return {operation:'add_chips',amount:BigInt(drawCount)*2n};
 if(key==='j_swashbuckler'&&otherSellCost>0n)return {operation:'add_mult',amount:otherSellCost};
 if(key==='j_bull'&&money>0n)return {operation:'add_chips',amount:money*2n};
 if(key==='j_bootstraps'&&money>=5n)return {operation:'add_mult',amount:money/5n*2n};
 if(NATIVE_JOKERS.includes(key))return null;
 throw new Error('Unsupported joker');
}
export function heldJokerEffects(entityId,card,heldCards){
 const key=originalJokerKey(entityId);
 if(card.enhancement!=='stone'){
  if(key==='j_baron'&&card.rank===13)return [{operation:'multiply_mult',amount:{n:3n,d:2n}}];
  if(key==='j_shoot_the_moon'&&card.rank===12)return [{operation:'add_mult',amount:13n}];
 }
 if(key!=='j_raised_fist')return [];
 let lowest=null;
 for(const held of heldCards)if(held.enhancement!=='stone'&&(!lowest||held.rank<=lowest.rank))lowest=held;
 if(lowest!==card)return [];
 const nominal=card.rank===14?11:Math.min(card.rank,10);
 return [{operation:'add_mult',amount:BigInt(nominal*2)}];
}
export function scoredJokerEffects(entityId,card,{jokers=[],rankGetter}={}){
 const key=originalJokerKey(entityId);
 if(key==='j_scary_face'&&isCardFace(card,jokers,{rankGetter}))return [{operation:'add_chips',amount:30n}];
 if(key==='j_smiley'&&isCardFace(card,jokers,{rankGetter}))return [{operation:'add_mult',amount:5n}];
 if(card.enhancement==='stone')return [];
 const suits={j_greedy_joker:'diamonds',j_lusty_joker:'hearts',j_wrathful_joker:'spades',j_gluttenous_joker:'clubs'};
 if(suits[key]&&isCardSuit(card,suits[key],{jokers}))return [{operation:'add_mult',amount:3n}];
 if(key==='j_scholar'&&card.rank===14)return [{operation:'add_chips',amount:20n},{operation:'add_mult',amount:4n}];
 if(key==='j_walkie_talkie'&&[4,10].includes(card.rank))return [{operation:'add_chips',amount:10n},{operation:'add_mult',amount:4n}];
 if(key==='j_fibonacci'&&[2,3,5,8,14].includes(card.rank))return [{operation:'add_mult',amount:8n}];
 if(key==='j_even_steven'&&card.rank<=10&&card.rank%2===0)return [{operation:'add_mult',amount:4n}];
 if(key==='j_odd_todd'&&(card.rank===14||card.rank<=10&&card.rank%2===1))return [{operation:'add_chips',amount:31n}];
 if(key==='j_arrowhead'&&isCardSuit(card,'spades',{jokers}))return [{operation:'add_chips',amount:50n}];
 if(key==='j_onyx_agate'&&isCardSuit(card,'clubs',{jokers}))return [{operation:'add_mult',amount:7n}];
 return [];
}



export function scoredJokerRepetitions(entityId,card,{firstScoringCardId,handsRemaining,jokers=[],rankGetter}={}){
 const key=originalJokerKey(entityId);
 if(key==='j_dusk'){
  if(!Number.isSafeInteger(handsRemaining)||handsRemaining<1)throw new TypeError('Missing preplay hand counter');
  return handsRemaining===1?1:0;
 }
 if(key==='j_hanging_chad')return card.id===firstScoringCardId?2:0;
 if(key==='j_selzer')return 1;
 if(key==='j_sock_and_buskin')return isCardFace(card,jokers,{rankGetter})?1:0;
 if(card.enhancement==='stone')return 0;
 if(key==='j_hack')return card.rank>=2&&card.rank<=5?1:0;
 return 0;
}
