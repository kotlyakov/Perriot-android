import {compact} from './numbers.js';
import {APK_HAND_NAMES} from './apk-shop-state.js';
import {item7ConsumableSpace} from './joker-item7-economy.js';
import {isCardFace} from './card-faces.js';
import {isCardSuit} from './card-suits.js';
import {jokerEffectContext} from './joker-contexts.js';

export const ITEM7_SCORE_JOKERS=Object.freeze(['j_photograph','j_triboulet','j_bloodstone','j_ancient','j_idol','j_rough_gem','j_ticket','j_business','j_reserved_parking','j_hiker','j_wee','j_lucky_cat','j_trousers','j_square','j_runner','j_ride_the_bus','j_green_joker','j_obelisk','j_midas_mask','j_vampire','j_space','j_misprint','j_stuntman','j_gros_michel','j_cavendish','j_supernova','j_erosion','j_fortune_teller','j_card_sharp','j_loyalty_card','j_ceremonial','j_flash','j_popcorn','j_red_card','j_castle','j_ice_cream','j_constellation','j_hologram','j_campfire','j_glass','j_hit_the_road','j_throwback','j_ramen','j_yorick','j_caino','j_baseball','j_matador','j_todo_list','j_8_ball','j_vagabond','j_superposition','j_seance','j_madness']);
const chipDefaults={j_wee:0,j_castle:0,j_square:0,j_runner:0,j_ice_cream:100};
const multDefaults={j_ceremonial:0,j_trousers:0,j_ride_the_bus:0,j_green_joker:0,j_flash:0,j_popcorn:20,j_red_card:0};
const xDefaults={j_lucky_cat:1,j_vampire:1,j_obelisk:1,j_constellation:1,j_hologram:1,j_campfire:1,j_glass:1,j_hit_the_road:1,j_throwback:1,j_ramen:2,j_yorick:1,j_madness:1};
const effect=(operation,amount)=>({operation,amount});
function exactNumber(number){const n=Math.round(number*1000000);if(!Number.isSafeInteger(n))throw new TypeError('Invalid Joker scoring amount');return n%1000000===0?BigInt(n/1000000):compact({n:BigInt(n),d:1000000n});}
const grow=(joker,field,amount,initial=0)=>joker[field]=Math.round(((joker[field]??initial)+amount)*1000000)/1000000;
export function item7Probability(state){return 2**state.jokers.filter(j=>j.entityId==='j_oops'&&!j.debuffed).length;}
function face(state,card,opts){return isCardFace(card,state.jokers,{debuffed:opts.isDebuffed?.(card)??false,rankGetter:opts.rankGetter});}
function suit(state,card,wanted,opts){return isCardSuit(card,wanted,{debuffed:opts.isDebuffed?.(card)??false,jokers:state.jokers});}
function rank(card,opts){return opts.rankGetter?opts.rankGetter(card):card.enhancement==='stone'?-1:card.rank;}

// Called in inventory order on the preview's transaction clone. Copy guards
// belong to the native effect, not to the copying Joker.
export function item7BeforeScore(state,opts){
 const {handId,playedCards,scoringCards}=opts;
 const ranks=new Map();for(const c of playedCards)if(c.enhancement!=='stone')ranks.set(c.rank,(ranks.get(c.rank)??0)+1);
 const pairs=[...ranks.values()].filter(n=>n>=2).length,vampired=new Set();
 for(let i=0;i<state.jokers.length;i++){
  const context=jokerEffectContext(state.jokers,i);if(!context)continue;
  const {target:j,copied}=context,key=j.entityId;
  if(key==='j_space'&&opts.roll('space')<item7Probability(state)/4)state.handLevels[handId]=(state.handLevels[handId]??1)+1;
  if(key==='j_todo_list'&&(j.toDoPokerHand===handId||j.toDoPokerHand===APK_HAND_NAMES[handId]))opts.money?.(4n,context.source.id);
  if(copied)continue;
  if(key==='j_trousers'&&(pairs>=2||handId==='full_house'||handId==='flush_house'))grow(j,'mult',2);
  if(key==='j_square'&&playedCards.length===4)grow(j,'chips',4);
  if(key==='j_runner'&&['straight','straight_flush'].includes(handId))grow(j,'chips',15);
  if(key==='j_ride_the_bus')j.mult=scoringCards.some(c=>face(state,c,opts))?0:(j.mult??0)+1;
  if(key==='j_green_joker')grow(j,'mult',1);
  if(key==='j_obelisk'){
   const usage=state.handUsage??{},current=(usage[handId]??0)+1;
   j.xMult=Object.entries(usage).some(([id,n])=>id!==handId&&n>=current)?Math.round(((j.xMult??1)+.2)*10)/10:1;
  }
  if(key==='j_midas_mask')for(const c of scoringCards)if(face(state,c,opts))c.enhancement='gold';
  if(key==='j_vampire')for(const c of scoringCards)if(c.enhancement&&c.enhancement!=='base'&&!opts.isDebuffed?.(c)&&!vampired.has(c.id)){vampired.add(c.id);c.enhancement='base';grow(j,'xMult',.1,1);}
 }
}
export function item7ScoredEffects(state,context,card,opts){
 const {target:j,copied}=context,key=j.entityId,p=item7Probability(state),out=[];
 if(key==='j_8_ball'&&item7ConsumableSpace(state)>0&&rank(card,opts)===8&&opts.roll('8ball')<p/4)opts.create?.({append:'8ba',sourceId:context.source.id});
 if(key==='j_hiker')card.permaBonus=(card.permaBonus??0)+5;
 if(key==='j_wee'&&!copied&&rank(card,opts)===2)grow(j,'chips',8);
 if(key==='j_lucky_cat'&&!copied&&opts.luckyTriggered)grow(j,'xMult',.25,1);
 if(key==='j_photograph'&&opts.scoringCards.find(c=>face(state,c,opts))?.id===card.id)out.push(effect('multiply_mult',2n));
 if(key==='j_triboulet'&&[12,13].includes(rank(card,opts)))out.push(effect('multiply_mult',2n));
 if(key==='j_bloodstone'&&suit(state,card,'hearts',opts)&&opts.roll('bloodstone')<p/2)out.push(effect('multiply_mult',{n:3n,d:2n}));
 if(key==='j_ancient'&&suit(state,card,state.round?.ancientSuit??'spades',opts))out.push(effect('multiply_mult',{n:3n,d:2n}));
 const idol=state.round?.idolCard??{rank:14,suit:'spades'};
 if(key==='j_idol'&&rank(card,opts)===idol.rank&&suit(state,card,idol.suit,opts))out.push(effect('multiply_mult',2n));
 if(key==='j_rough_gem'&&suit(state,card,'diamonds',opts))out.push(effect('money',1n));
 if(key==='j_ticket'&&card.enhancement==='gold')out.push(effect('money',4n));
 if(key==='j_business'&&face(state,card,opts)&&opts.roll('business')<p/2)out.push(effect('money',2n));
 return out;
}
export function item7HeldEffects(state,context,card,opts){
 if(context.target.entityId==='j_reserved_parking'&&face(state,card,opts)&&opts.roll('parking')<item7Probability(state)/2&&!opts.isDebuffed?.(card))return [effect('money',1n)];
 return [];
}
export function item7IndependentEffect(state,context,opts){
 const j=context.target,key=j.entityId;
 if(Object.hasOwn(chipDefaults,key)){const amount=j.chips??chipDefaults[key];return key==='j_castle'&&amount===0?null:effect('add_chips',BigInt(amount));}
 if(Object.hasOwn(multDefaults,key)){const amount=j.mult??multDefaults[key];return amount>0?effect('add_mult',BigInt(amount)):null;}
 if(key==='j_throwback'){const amount=1+(state.runStats?.skips??0)/4;return amount>1?effect('multiply_mult',exactNumber(amount)):null;}
 if(Object.hasOwn(xDefaults,key)){const amount=j.xMult??xDefaults[key];return amount>1?effect('multiply_mult',exactNumber(amount)):null;}
 if(key==='j_caino'&&(j.cainoXMult??1)>1)return effect('multiply_mult',exactNumber(j.cainoXMult));
 if(key==='j_misprint')return effect('add_mult',BigInt(Math.min(23,Math.floor(opts.roll('misprint')*24))));
 if(key==='j_stuntman')return effect('add_chips',250n);
 if(key==='j_gros_michel')return effect('add_mult',15n);
 if(key==='j_cavendish')return effect('multiply_mult',3n);
 if(key==='j_supernova')return effect('add_mult',BigInt((state.handUsage?.[opts.handId]??0)+1));
 if(key==='j_fortune_teller'&&(state.consumableUsageTotal?.tarot??state.tarotUsed??0)>0)return effect('add_mult',BigInt(state.consumableUsageTotal?.tarot??state.tarotUsed));
 if(key==='j_erosion'){const removed=(state.startingDeckSize??52)-Object.keys(state.cards??{}).length;return removed>0?effect('add_mult',BigInt(removed*4)):null;}
 if(key==='j_card_sharp'&&(state.round?.handUsage?.[opts.handId]??0)>0)return effect('multiply_mult',3n);
 if(key==='j_loyalty_card'&&((j.loyaltyRemaining??5)+5)%6===5)return effect('multiply_mult',4n);
 if(key==='j_vagabond'&&(opts.currentMoney?.()??state.money)<=4n)opts.create?.({append:'vag',sourceId:context.source.id});
 if(key==='j_superposition'&&['straight','straight_flush'].includes(opts.handId)&&opts.scoringCards.some(c=>rank(c,opts)===14))opts.create?.({append:'sup',sourceId:context.source.id});
 if(key==='j_seance'&&opts.handId==='straight_flush')opts.create?.({set:'Spectral',append:'sea',sourceId:context.source.id});
 if(key==='j_matador'&&opts.blindTriggered)return effect('money',8n);
 return null;
}
