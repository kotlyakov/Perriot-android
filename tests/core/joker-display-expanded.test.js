import test from 'node:test';
import assert from 'node:assert/strict';
import {describeShopItem} from '../../src/content/shop-display.js';
import russianNames from '../../src/content/shop-names-ru.js';
import {supportsJoker} from '../../src/content/jokers.js';
import {formatTooltipText} from '../../src/ui/tooltip-text.js';

const describe=entityId=>describeShopItem({entityId});
const effects=description=>formatTooltipText(description).filter(part=>part.kind);
const keys=['j_baron','j_shoot_the_moon','j_flower_pot','j_seeing_double','j_stone','j_steel_joker','j_bull','j_drivers_license','j_bootstraps'];

test('expanded Joker descriptions reuse Russian catalogue names and runtime support decisions',()=>{
 for(const entityId of keys){
  const item=describe(entityId);
  assert.equal(item.name,russianNames[entityId],entityId);
  assert.doesNotMatch(item.description,/предварительной версии|[A-Za-z]/,entityId);
  assert.equal(item.canBuy,supportsJoker({entityId}),entityId);
  assert.equal(formatTooltipText(item.description).map(part=>part.text).join(''),item.description);
 }
});

test('Baron and Shoot the Moon require active remaining held cards during scoring',()=>{
 for(const [key,rank,amount] of [['j_baron','король','×1,5'],['j_shoot_the_moon','дама','+13']]){
  const description=describe(key).description;
  assert.ok(description.includes(rank));
  assert.match(description,/оставш[а-яё]+ в руке/);
  assert.match(description,/при подсчёте.*не ослаблена/);
  assert.doesNotMatch(description,/сыгранн|засчитываем/);
  assert.deepEqual(effects(description),[{text:amount,kind:'mult'}]);
 }
});

test('suit Joker descriptions distinguish scoring cards, different cards and debuff rules',()=>{
 const flower=describe('j_flower_pot').description;
 assert.match(flower,/засчитываемых карт.*4 масти на разных картах/);
 assert.match(flower,/неослабленная Дикая карта заменяет одну/);
 assert.match(flower,/остальных карт.*даже при ослаблении/);
 assert.deepEqual(effects(flower),[{text:'×3',kind:'mult'}]);
 const double=describe('j_seeing_double').description;
 assert.match(double,/неослабленных засчитываемых карт.*трефа.*другая карта иной масти/);
 assert.match(double,/Дикая карта заменяет одну/);
 assert.deepEqual(effects(double),[{text:'×2',kind:'mult'}]);
});

test('deck tallies include all playing cards and Steel grows its coefficient additively',()=>{
 for(const key of ['j_stone','j_steel_joker','j_drivers_license']){
  const description=describe(key).description;
  assert.match(description,/во всей колоде/);
  assert.match(description,/включая ослабленные/);
  assert.doesNotMatch(description,/засчитываем|в руке/);
 }
 assert.deepEqual(effects(describe('j_stone').description),[{text:'+25',kind:'chips'}]);
 assert.deepEqual(effects(describe('j_steel_joker').description),[
  {text:'×1',kind:'mult'},{text:'+0,2',kind:'mult'},{text:'×1,4',kind:'mult'}
 ]);
 assert.match(describe('j_steel_joker').description,/прибавка к этому коэффициенту/);
 const driver=describe('j_drivers_license').description;
 assert.match(driver,/не менее 16 усиленных карт/);
 assert.match(driver,/Издания и печати.*не считаются усилениями/);
 assert.deepEqual(effects(driver),[{text:'×3',kind:'mult'}]);
});

test('money Joker descriptions state nonpositive balance and complete money groups',()=>{
 const bull=describe('j_bull').description;
 assert.match(bull,/нулевом или отрицательном балансе не даёт фишек/);
 assert.deepEqual(effects(bull),[{text:'+2',kind:'chips'},{text:'$1',kind:'money'}]);
 const bootstraps=describe('j_bootstraps').description;
 assert.match(bootstraps,/каждые полные \$5/);
 assert.match(bootstraps,/меньше \$5 не даёт множителя/);
 assert.deepEqual(effects(bootstraps),[{text:'+2',kind:'mult'},{text:'$5',kind:'money'},{text:'$5',kind:'money'}]);
});

test('safe common formatter handles signed money and fractional coefficients without colouring ranks',()=>{
 const description='<script> $1 +$5 −$5 -$0.5 +$1,5; +0,2 к множителю; ×1,4; ×1.5; 4 масти, 16 карт.';
 assert.deepEqual(effects(description),[
  {text:'$1',kind:'money'},{text:'+$5',kind:'money'},{text:'−$5',kind:'money'},
  {text:'-$0.5',kind:'money'},{text:'+$1,5',kind:'money'},
  {text:'+0,2',kind:'mult'},{text:'×1,4',kind:'mult'},{text:'×1.5',kind:'mult'}
 ]);
 assert.equal(formatTooltipText(description).map(part=>part.text).join(''),description);
});
