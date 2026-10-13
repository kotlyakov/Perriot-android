import {isCardSuit} from '../core/card-suits.js';

// Exact supported scoring slice; the random shop still uses the complete catalogue.
export const NATIVE_JOKERS=Object.freeze(['j_joker','j_jolly','j_zany','j_mad','j_crazy','j_droll','j_sly','j_wily','j_clever','j_devious','j_crafty','j_half','j_splash','j_abstract','j_duo','j_trio','j_family','j_order','j_tribe','j_greedy_joker','j_lusty_joker','j_wrathful_joker','j_gluttenous_joker','j_scary_face','j_even_steven','j_odd_todd','j_scholar','j_fibonacci','j_arrowhead','j_onyx_agate','j_smiley','j_walkie_talkie','j_acrobat','j_banner','j_blackboard','j_mystic_summit','j_raised_fist','j_stencil','j_blue_joker','j_flower_pot','j_baron','j_shoot_the_moon','j_bull','j_bootstraps','j_swashbuckler','j_stone','j_steel_joker']);
export const SUPPORTED_JOKERS=Object.freeze(['joker_joker','joker_sly_joker','joker_clever_joker','joker_splash',...NATIVE_JOKERS]);
const aliases={joker_joker:'j_joker',joker_sly_joker:'j_sly',joker_clever_joker:'j_clever',joker_splash:'j_splash'};
export const originalJokerKey=id=>aliases[id]??id;
export function supportsJoker(offer){return !!offer&&SUPPORTED_JOKERS.includes(offer.entityId)&&['base','foil','holographic','polychrome','negative'].includes(offer.edition??'base')&&!offer.rental&&!offer.perishable&&!offer.debuffed;}
const combination={j_jolly:['pair','add_mult',8n],j_zany:['three','add_mult',12n],j_mad:['two_pair','add_mult',10n],j_crazy:['straight','add_mult',12n],j_droll:['flush','add_mult',10n],j_sly:['pair','add_chips',50n],j_wily:['three','add_chips',100n],j_clever:['two_pair','add_chips',80n],j_devious:['straight','add_chips',100n],j_crafty:['flush','add_chips',80n],j_duo:['pair','multiply_mult',2n],j_trio:['three','multiply_mult',3n],j_family:['four','multiply_mult',4n],j_order:['straight','multiply_mult',3n],j_tribe:['flush','multiply_mult',2n]};
export function independentEffect(entityId,rankCounts,{playedCards=[],scoringCards=playedCards,handId,jokerCount=1,handsRemaining,discardsRemaining,heldCards=[],deckCount,money,allCards=[],jokers=[],selfId,jokerSlots=5,negativeCount=0,stencilCount=0}={}){
 const key=originalJokerKey(entityId),rule=combination[key];
 if(rule){const [kind,operation,amount]=rule;const yes={pair:rankCounts.some(n=>n>=2),three:rankCounts.some(n=>n>=3),four:rankCounts.some(n=>n>=4),two_pair:rankCounts.filter(n=>n>=2).length>=2,straight:['straight','straight_flush'].includes(handId),flush:['flush','straight_flush','flush_house','flush_five'].includes(handId)}[kind];return yes?{operation,amount}:null;}
 if(key==='j_joker')return {operation:'add_mult',amount:4n};
 if(key==='j_half'&&playedCards.length<=3)return {operation:'add_mult',amount:20n};
 if(key==='j_abstract')return {operation:'add_mult',amount:BigInt(jokerCount)*3n};
 if(key==='j_acrobat'&&handsRemaining===1)return {operation:'multiply_mult',amount:3n};
 if(key==='j_banner'&&discardsRemaining>0)return {operation:'add_chips',amount:BigInt(discardsRemaining)*30n};
 if(key==='j_mystic_summit'&&discardsRemaining===0)return {operation:'add_mult',amount:15n};
 if(key==='j_blackboard'&&heldCards.every(card=>card.enhancement!=='stone'&&(isCardSuit(card,'clubs')||isCardSuit(card,'spades'))))return {operation:'multiply_mult',amount:3n};
 if(key==='j_blue_joker'){
  if(!Number.isSafeInteger(deckCount)||deckCount<0)throw new TypeError('Invalid deck count');
  if(deckCount>0)return {operation:'add_chips',amount:BigInt(deckCount)*2n};
 }
 if(key==='j_flower_pot'){
  const suits=['hearts','diamonds','spades','clubs'],seen=new Set();
  for(const card of scoringCards)if(card.enhancement!=='wild')for(const suit of suits)if(isCardSuit(card,suit,{debuffed:!!card.debuffed,bypassDebuff:true})){seen.add(suit);break;}
  for(const card of scoringCards)if(card.enhancement==='wild'&&!card.debuffed){const missing=suits.find(suit=>!seen.has(suit));if(missing)seen.add(missing);}
  if(suits.every(suit=>seen.has(suit)))return {operation:'multiply_mult',amount:3n};
 }
 if(key==='j_bull'||key==='j_bootstraps'){
  if(typeof money!=='bigint')throw new TypeError('Invalid money');
  if(key==='j_bull'&&money>0n)return {operation:'add_chips',amount:money*2n};
  if(key==='j_bootstraps'&&money>=5n)return {operation:'add_mult',amount:money/5n*2n};
 }
 if(key==='j_swashbuckler'){
  let amount=0n;for(const joker of jokers)if(joker.id!==selfId){if(typeof joker.sellCost!=='bigint'||joker.sellCost<0n)throw new TypeError('Invalid Joker sell value');amount+=joker.sellCost;}
  if(amount>0n)return {operation:'add_mult',amount};
 }
 if(key==='j_stone'){const count=allCards.filter(card=>card.enhancement==='stone').length;if(count>0)return {operation:'add_chips',amount:BigInt(count)*25n};}
 if(key==='j_steel_joker'){const count=allCards.filter(card=>card.enhancement==='steel').length;if(count>0)return {operation:'multiply_mult',amount:{n:BigInt(5+count),d:5n}};}
 if(key==='j_stencil'){
  const empty=jokerSlots+negativeCount-jokerCount;
  const amount=empty+stencilCount;
  if(amount>1)return {operation:'multiply_mult',amount:BigInt(amount)};
 }
 if(NATIVE_JOKERS.includes(key))return null;
 throw new Error('Unsupported joker');
}
export function heldJokerEffects(entityId,card,heldCards){
 const key=originalJokerKey(entityId);
 if(key==='j_shoot_the_moon'&&card.rank===12)return [{operation:'add_mult',amount:13n}];
 if(key==='j_baron'&&card.rank===13)return [{operation:'multiply_mult',amount:{n:3n,d:2n}}];
 if(key!=='j_raised_fist')return [];
 let lowest=null;
 for(const held of heldCards)if(held.enhancement!=='stone'&&(!lowest||held.rank<=lowest.rank))lowest=held;
 if(lowest!==card)return [];
 const nominal=card.rank===14?11:Math.min(card.rank,10);
 return [{operation:'add_mult',amount:BigInt(nominal*2)}];
}
export function scoredJokerEffects(entityId,card){
 if(card.enhancement==='stone')return [];
 const key=originalJokerKey(entityId),suits={j_greedy_joker:'diamonds',j_lusty_joker:'hearts',j_wrathful_joker:'spades',j_gluttenous_joker:'clubs'};
 if(suits[key]&&isCardSuit(card,suits[key]))return [{operation:'add_mult',amount:3n}];
 if(key==='j_scary_face'&&card.rank>=11&&card.rank<=13)return [{operation:'add_chips',amount:30n}];
 if(key==='j_smiley'&&card.rank>=11&&card.rank<=13)return [{operation:'add_mult',amount:5n}];
 if(key==='j_scholar'&&card.rank===14)return [{operation:'add_chips',amount:20n},{operation:'add_mult',amount:4n}];
 if(key==='j_walkie_talkie'&&[4,10].includes(card.rank))return [{operation:'add_chips',amount:10n},{operation:'add_mult',amount:4n}];
 if(key==='j_fibonacci'&&[2,3,5,8,14].includes(card.rank))return [{operation:'add_mult',amount:8n}];
 if(key==='j_even_steven'&&card.rank<=10&&card.rank%2===0)return [{operation:'add_mult',amount:4n}];
 if(key==='j_odd_todd'&&(card.rank===14||card.rank<=10&&card.rank%2===1))return [{operation:'add_chips',amount:31n}];
 if(key==='j_arrowhead'&&isCardSuit(card,'spades'))return [{operation:'add_chips',amount:50n}];
 if(key==='j_onyx_agate'&&isCardSuit(card,'clubs'))return [{operation:'add_mult',amount:7n}];
 return [];
}


