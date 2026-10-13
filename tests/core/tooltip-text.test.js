import test from 'node:test';
import assert from 'node:assert/strict';
import {describeShopItem} from '../../src/content/shop-display.js';

async function formatter(){
 const module=await import('../../src/ui/tooltip-text.js').catch(()=>null);
 assert.ok(module,'shared semantic tooltip formatter exists');
 return module.formatTooltipText;
}

test('tooltip effect amounts distinguish chips and Mult while leaving card ranks ordinary',async()=>{
 const format=await formatter();
 const text='Засчитываемые 4 и 10 дают +10 очков и +4 к множителю. ×1,5 к множителю.';
 assert.deepEqual(format(text).filter(t=>t.kind),[
  {text:'+10',kind:'chips'},{text:'+4',kind:'mult'},{text:'×1,5',kind:'mult'}
 ]);
 assert.equal(format(text).map(t=>t.text).join(''),text);
});

test('tooltip formatter preserves literal markup, money, probabilities and non-effect counts',async()=>{
 const format=await formatter();
 const text='<img src=x> 1 из 4; $20; +3 места. −5 фишек; +31 очко; ×1.5 Mult.';
 assert.deepEqual(format(text).filter(t=>t.kind),[
  {text:'$20',kind:'money'},{text:'−5',kind:'chips'},{text:'+31',kind:'chips'},{text:'×1.5',kind:'mult'}
 ]);
 assert.equal(format(text).map(t=>t.text).join(''),text);
});

test('conditional Jokers specify played hand and supported polychrome describes fractional Mult',()=>{
 for(const key of ['j_jolly','j_sly','j_duo'])assert.match(describeShopItem({entityId:key}).description,/если сыгранная рука содержит/);
 const item=describeShopItem({entityId:'j_joker',edition:'polychrome'});
 assert.match(item.description,/Полихромия: ×1[.,]5 к множителю/);
 assert.equal(item.canBuy,true);
});

test('card modifier descriptions compose enhancement, edition and seal independently',async()=>{
 const module=await import('../../src/content/card-modifier-display.js').catch(()=>null);
 assert.ok(module,'verified modifier display metadata exists');
 const descriptions=module.describeCardModifiers({enhancement:'steel',edition:'polychrome',seal:'blue'});
 assert.equal(descriptions.length,3);
 assert.match(descriptions[0],/×1,5.*в руке/);
 assert.match(descriptions[1],/Полихромия: ×1,5/);
 assert.match(descriptions[2],/планету последней сыгранной комбинации.*в руке.*свободное место/i);
 assert.deepEqual(module.describeCardModifiers({enhancement:'base',edition:'base'}),[]);
 assert.deepEqual(module.describeCardModifiers({enhancement:'unknown',edition:'unknown',seal:'unknown'}),[]);
});

test('held Joker descriptions refer to remaining cards in hand and only implemented Raised Fist is buyable',()=>{
 const expected={j_baron:/король.*в руке.*×1,5/i,j_shoot_the_moon:/дама.*в руке.*\+13/i,j_mime:/эффекты карт в руке.*один раз/i,j_raised_fist:/младшей карты в руке/i};
 for(const [entityId,description] of Object.entries(expected)){
  const item=describeShopItem({entityId});
  assert.match(item.description,description);
  assert.equal(item.canBuy,entityId==='j_raised_fist');
 }
});

test('money rewards use their own gold effect colour',async()=>{
 const format=await formatter();
 assert.deepEqual(format('Награда $25; потратить −$5.').filter(t=>t.kind),[{text:'$25',kind:'money'},{text:'−$5',kind:'money'}]);
});


test('Planet and Black Hole level increments are bold neutral effects',async()=>{
 const format=await formatter();
 for(const [entityId,set] of [['c_pluto','Planet'],['c_black_hole','Spectral']]){
  const text=describeShopItem({entityId,originalKey:entityId,set}).description;
  assert.deepEqual(format(text).filter(t=>t.kind),[{text:'+1',kind:'level'}]);
  assert.equal(format(text).map(t=>t.text).join(''),text);
 }
 assert.deepEqual(format('Ранг +1. 12 комбинаций; +3 места; награда на +1.').filter(t=>t.kind),[]);
});

