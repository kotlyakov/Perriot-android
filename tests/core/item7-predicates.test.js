import test from 'node:test';
import assert from 'node:assert/strict';
import {isCardSuit} from '../../src/core/card-suits.js';
import {evaluateHand} from '../../src/core/hands.js';
import {describeShopItem} from '../../src/content/shop-display.js';
import {formatTooltipText} from '../../src/ui/tooltip-text.js';

const smeared=[{entityId:'j_smeared'}];
const card=(suit,enhancement='base',rank=2,id='a')=>({id,suit,rank,enhancement});

test('Smeared makes printed suits equivalent within each colour only while active',()=>{
 for(const [printed,matching,opposite] of [['hearts','diamonds','clubs'],['diamonds','hearts','spades'],['clubs','spades','hearts'],['spades','clubs','diamonds']]){
  assert.equal(isCardSuit(card(printed),matching,{jokers:smeared}),true);
  assert.equal(isCardSuit(card(printed),opposite,{jokers:smeared}),false);
  assert.equal(isCardSuit(card(printed),matching),false);
  assert.equal(isCardSuit(card(printed),matching,{jokers:[{entityId:'j_smeared',debuffed:true}]}),false);
  assert.equal(isCardSuit(card(printed),matching,{jokers:[{entityId:'j_blueprint'}]}),false);
 }
});

test('Smeared preserves native Stone, Wild, debuff, bypass and flush precedence',()=>{
 assert.equal(isCardSuit(card('hearts','stone'),'diamonds',{jokers:smeared,bypassDebuff:true,flushCalc:true}),false);
 assert.equal(isCardSuit(card('hearts','wild'),'clubs',{jokers:smeared}),true);
 assert.equal(isCardSuit(card('hearts','wild'),'clubs',{jokers:smeared,debuffed:true}),false);
 assert.equal(isCardSuit(card('hearts','wild'),'clubs',{jokers:smeared,debuffed:true,bypassDebuff:true}),true);
 assert.equal(isCardSuit(card('hearts'),'diamonds',{jokers:smeared,debuffed:true}),false);
 assert.equal(isCardSuit(card('hearts'),'diamonds',{jokers:smeared,debuffed:true,bypassDebuff:true}),true);
 assert.equal(isCardSuit(card('hearts','wild'),'diamonds',{jokers:smeared,debuffed:true,flushCalc:true}),true);
 assert.equal(isCardSuit(card('hearts','wild'),'clubs',{jokers:smeared,debuffed:true,flushCalc:true}),false);
});

test('Smeared flush recognition includes debuffed same-colour cards and keeps suit order',()=>{
 const cards=[card('hearts','base',2,'a'),card('diamonds','base',4,'b'),card('hearts','base',6,'c'),card('diamonds','base',8,'d'),card('hearts','wild',11,'e')];
 assert.equal(evaluateHand(cards).handId,'high_card');
 assert.deepEqual(evaluateHand(cards,{jokers:smeared,isCardDebuffed:()=>true}),{handId:'flush',scoringCardIds:['a','b','c','d','e'],isRoyal:false});
 assert.equal(evaluateHand(cards,{jokers:[{entityId:'j_smeared',debuffed:true}]}).handId,'high_card');
 assert.equal(evaluateHand(cards.slice(0,4),{jokers:smeared,fourFingers:true}).handId,'flush');
 assert.equal(evaluateHand(cards.map(c=>({...c,enhancement:'stone'})),{jokers:smeared}).handId,'high_card');
});

const remainingKeys=['j_credit_card', 'j_ceremonial', 'j_loyalty_card', 'j_8_ball', 'j_misprint', 'j_chaos', 'j_delayed_grat', 'j_gros_michel', 'j_business', 'j_supernova', 'j_ride_the_bus', 'j_space', 'j_egg', 'j_burglar', 'j_runner', 'j_ice_cream', 'j_sixth_sense', 'j_constellation', 'j_hiker', 'j_faceless', 'j_green_joker', 'j_superposition', 'j_todo_list', 'j_cavendish', 'j_card_sharp', 'j_red_card', 'j_madness', 'j_square', 'j_seance', 'j_riff_raff', 'j_vampire', 'j_hologram', 'j_vagabond', 'j_rocket', 'j_obelisk', 'j_midas_mask', 'j_luchador', 'j_photograph', 'j_gift', 'j_turtle_bean', 'j_erosion', 'j_reserved_parking', 'j_mail', 'j_to_the_moon', 'j_hallucination', 'j_fortune_teller', 'j_juggler', 'j_drunkard', 'j_lucky_cat', 'j_baseball', 'j_diet_cola', 'j_trading', 'j_flash', 'j_popcorn', 'j_trousers', 'j_ancient', 'j_ramen', 'j_castle', 'j_campfire', 'j_ticket', 'j_mr_bones', 'j_troubadour', 'j_certificate', 'j_smeared', 'j_throwback', 'j_rough_gem', 'j_bloodstone', 'j_glass', 'j_ring_master', 'j_wee', 'j_merry_andy', 'j_oops', 'j_idol', 'j_matador', 'j_hit_the_road', 'j_stuntman', 'j_invisible', 'j_satellite', 'j_cartomancer', 'j_astronomer', 'j_burnt', 'j_caino', 'j_triboulet', 'j_yorick', 'j_chicot', 'j_perkeo'];
test('all item7 Joker descriptions are Russian text compatible with the shared tooltip formatter',()=>{
 for(const entityId of remainingKeys){
  const {description}=describeShopItem({entityId});
  assert.doesNotMatch(description,/предварительной версии|[A-Za-z]/,entityId);
  assert.equal(formatTooltipText(description).map(part=>part.text).join(''),description,entityId);
 }
});

test('Judgement tooltip describes real Joker creation and capacity',()=>{
 const {description}=describeShopItem({entityId:'c_judgement'});
 assert.match(description,/Создаёт случайного джокера/);
 assert.match(description,/свободное место/);
});

// Fixed native-keyed draws lie between the normal and doubled thresholds.
// These exercise the shared scoring and consumable paths, not a mocked roll.
import {createRun,dispatch} from '../../src/core/run.js';
import {scoreHand} from '../../src/core/score.js';
const oopsRun=(seed,jokers=[])=>({...createRun(seed,{runId:'oops-regression',money:4n,referenceRng:true,referenceShop:true}),jokers});
const oops={id:'oops',entityId:'j_oops',creationOrdinal:1};

test('Oops doubles Lucky Mult and money thresholds without changing their keyed draws',()=>{
 for(const [seed,field,expectedRoll] of [['OOPS5','multTriggered',0.22570376252151236],['OOPS3','moneyTriggered',0.12176301173519133]]){
  const played=[card('spades','lucky',14,'lucky')],base=scoreHand(oopsRun(seed),played),doubled=scoreHand(oopsRun(seed,[oops]),played),disabled=scoreHand(oopsRun(seed,[{...oops,debuffed:true}]),played);
  assert.equal(base.luckyRolls[0][field],false);
  assert.equal(doubled.luckyRolls[0][field],true);
  assert.equal(disabled.luckyRolls[0][field],false);
  const key=field==='multTriggered'?'multRoll':'moneyRoll';
  assert.equal(base.luckyRolls[0][key],expectedRoll);
  assert.equal(doubled.luckyRolls[0][key],expectedRoll);
  assert.equal(disabled.luckyRolls[0][key],expectedRoll);
 }
});

test('Oops doubles Glass destruction threshold and debuffed Oops restores normal odds',()=>{
 const played=[card('spades','glass',14,'glass')];
 for(const [jokers,destroyed] of [[[],false],[[oops],true],[[{...oops,debuffed:true}],false]]){
  const result=scoreHand(oopsRun('OOPS7',jokers),played);
  assert.equal(result.glassRolls[0].roll,0.28379788498608205);
  assert.equal(result.glassRolls[0].destroyed,destroyed);
 }
});

test('Oops changes Wheel of Fortune from a miss to a hit at the same first draw',()=>{
 for(const [debuffed,changed] of [[true,false],[false,true]]){
  const state=oopsRun('OOPS7',[{...oops,debuffed,edition:'base',set:'Joker',cost:10n,sellCost:5n}]);
  state.consumables=[{id:'wheel',entityId:'c_wheel_of_fortune',originalKey:'c_wheel_of_fortune',set:'Tarot',edition:'base',cost:3n,sellCost:1n}];
  const result=dispatch(state,{type:'USE_CONSUMABLE',cardId:'wheel',expectedRevision:state.revision});
  assert.equal(result.error,null);
  assert.equal(result.events.some(event=>event.type==='joker_edition_changed'),changed);
  assert.equal(result.state.jokers[0].edition!=='base',changed);
 }
});
