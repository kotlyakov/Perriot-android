import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {scoreHand} from '../../src/core/score.js';
import {canUseConsumable,wheelEdition,wheelSucceeds} from '../../src/core/consumables.js';
import {createApkMathState,nextApkMathRandom,nextApkRandom} from '../../src/core/apk-rng.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {createShop,stampJokerCreationOrdinals} from '../../src/core/shop.js';

const centre=key=>catalogue.centres.find(card=>card.key===key);
const wheel=()=>{const c=centre('c_wheel_of_fortune');return {id:'wheel',entityId:c.key,originalKey:c.key,set:c.set,edition:'base',cost:3n,sellCost:1n};};
const joker=(id,creationOrdinal,extra={})=>({id,entityId:'j_joker',originalKey:'j_joker',set:'Joker',edition:'base',cost:4n,sellCost:2n,creationOrdinal,...extra});
const use=state=>dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:'wheel'});
function run(seed,jokers){const state=createRun(seed,{runId:'wheel-run',money:4n,referenceRng:true,referenceShop:true,reducedMotion:false});state.consumables=[wheel()];state.jokers=jokers;state.nextJokerCreationOrdinal=20;return state;}
function findSeed(success){for(let i=0;i<1000;i++){const state=run('WHEEL'+i,[joker('one',1)]),roll=nextApkRandom(state.rng.apk,'wheel_of_fortune').value;if((roll<.25)===success)return state;}throw new Error('seed not found');}

test('Wheel boundary rules and guaranteed-edition thresholds are exact',()=>{
 assert.equal(wheelSucceeds(.249999999999,1),true);assert.equal(wheelSucceeds(.25,1),false);
 assert.equal(wheelEdition(0),'base');assert.equal(wheelEdition(.5),'foil');assert.equal(wheelEdition(.500000000001),'holographic');assert.equal(wheelEdition(.85),'holographic');assert.equal(wheelEdition(.850000000001),'polychrome');
});
test('successful Wheel selects persistent creation order, reprices and advances exact keyed/raw RNG',()=>{
 const state=findSeed(true);state.jokers=[joker('newer',2),joker('older',1)];
 let replay=nextApkRandom(state.rng.apk,'wheel_of_fortune');const successRoll=replay.value;
 const selected=nextApkRandom(replay.rng,'wheel_of_fortune',1,2);replay=nextApkRandom(selected.rng,'wheel_of_fortune');const edition=wheelEdition(replay.value);
 let math=nextApkMathRandom(replay.rng.mathState).state;if(edition!=='base')math=nextApkMathRandom(math).state;
 const result=use(state);assert.equal(result.error,null);assert.equal(successRoll<.25,true);
 const expectedId=selected.value===1?'older':'newer',changed=result.state.jokers.find(card=>card.id===expectedId),other=result.state.jokers.find(card=>card.id!==expectedId);
 assert.equal(changed.edition,edition);assert.equal(other.edition,'base');assert.equal(changed.cost,{foil:4n,holographic:5n,polychrome:7n}[edition]);assert.equal(changed.sellCost,changed.cost/2n);
 assert.deepEqual(result.state.rng.apk.mathState,math);assert.equal(result.events.find(event=>event.type==='joker_edition_changed').jokerId,expectedId);
 assert.deepEqual(deserializeState(serializeState(result.state)),result.state);
});

test('failed and debuffed Wheel consume once with exact RNG behavior',()=>{
 const state=findSeed(false),first=nextApkRandom(state.rng.apk,'wheel_of_fortune'),math=nextApkMathRandom(first.rng.mathState).state,result=use(state);
 assert.equal(result.error,null);assert.equal(result.state.jokers[0].edition,'base');assert.deepEqual(result.state.rng.apk.mathState,math);assert.equal(result.events.some(event=>event.type==='joker_edition_changed'),false);
 const debuffed=run('DEBUFF',[joker('one',1)]);debuffed.consumables[0].debuffed=true;const before=structuredClone(debuffed.rng),used=use(debuffed);assert.equal(used.error,null);assert.deepEqual(used.state.rng,before);assert.equal(used.state.consumableUsage.c_wheel_of_fortune.count,1);
});

test('Wheel refuses no eligible Joker and ambiguous multi-Joker legacy order atomically',()=>{
 for(const jokers of [[joker('foil',1,{edition:'foil'})],[joker('a',undefined),joker('b',undefined)]]){const state=run('BLOCK',jokers),before=structuredClone(state),result=use(state);assert.equal(result.error.code,'USE_UNAVAILABLE');assert.strictEqual(result.state,state);assert.deepEqual(state,before);assert.equal(canUseConsumable(state,state.consumables[0]).available,false);}
});

test('shop creation order survives reverse purchase and forged duplicate ordinals are rejected',()=>{
 const left=joker('left',1),right=joker('right',2);delete left.creationOrdinal;delete right.creationOrdinal;
 let state=run('ORDER',[]);state.phase='shop';state.round.score=state.round.target;state.shop=createShop({offers:{main:[left,right],vouchers:[],boosters:[]}});state.nextJokerCreationOrdinal=1;stampJokerCreationOrdinals(state,state.shop.main);assert.deepEqual(state.shop.main.map(card=>card.creationOrdinal),[1,2]);state.money=20n;
 state=dispatch(state,{type:'BUY_SHOP_CARD',expectedRevision:state.revision,offerId:'right'}).state;state=dispatch(state,{type:'BUY_SHOP_CARD',expectedRevision:state.revision,offerId:'left'}).state;assert.deepEqual(state.jokers.map(card=>[card.id,card.creationOrdinal]),[['right',2],['left',1]]);assert.deepEqual(deserializeState(serializeState(state)),state);
 state.jokers[0].creationOrdinal=1;assert.throws(()=>serializeState(state));
});

test('polychrome Joker multiplies after its own independent effect with exact fractions',()=>{
 const state={handLevels:{},jokers:[{id:'poly',entityId:'j_joker',edition:'polychrome'}],cards:[{id:'ace',rank:14,suit:'spades'}]};
 const result=scoreHand(state,state.cards);assert.equal(result.mult.n,15n);assert.equal(result.mult.d,2n);assert.equal(result.score,120n);
 assert.deepEqual(result.trace.filter(event=>event.sourceId==='poly').map(event=>[event.phase,event.operation]),[['independent','add_mult'],['edition','multiply_mult']]);
});
