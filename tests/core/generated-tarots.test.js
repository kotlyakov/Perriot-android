import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {describeShopItem} from '../../src/content/shop-display.js';

function owned(key,id=key){const centre=catalogue.centres.find(card=>card.key===key);return {id,entityId:key,originalKey:key,set:centre.set,edition:'base',cost:BigInt(centre.cost),sellCost:1n};}
function run(key,seed='CREATE25'){const state=createRun(seed,{runId:'generated-tarots',money:4n,referenceRng:true,referenceShop:true});state.consumables=[owned(key,'creator')];state.apkShop.context=currentApkShopContext(state);return state;}
const use=state=>dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:'creator'});
const reload=state=>deserializeState(serializeState(state));

test('Emperor and High Priestess create two exact-category base consumables and resume deterministically',()=>{
 for(const [key,set,stream] of [['c_emperor','Tarot','Tarotemp1'],['c_high_priestess','Planet','Planetpri1']]){
  const state=run(key),before=structuredClone(state),result=use(state);assert.equal(result.error,null);assert.deepEqual(state,before);assert.equal(result.state.consumables.length,2);
  assert.ok(result.state.consumables.every(card=>card.set===set&&card.edition==='base'&&card.cost===3n&&card.sellCost===1n));assert.equal(new Set(result.state.consumables.map(card=>card.entityId)).size,2);assert.ok(result.state.rng.apk.streams[stream]);
  assert.equal(result.state.lastTarotPlanet,key);assert.equal(result.state.consumableUsage[key].count,1);assert.deepEqual(reload(result.state),result.state);assert.deepEqual(use(reload(state)),result);
 }
});

test('generator Tarots use the vacated own slot and remaining negative-card capacity',()=>{
 for(const key of ['c_emperor','c_high_priestess'])for(const [remaining,negatives,expected] of [[1,0,1],[2,0,0],[2,1,1],[3,1,0]]){
  const state=run(key);for(let i=0;i<remaining;i++)state.consumables.push({...owned('c_pluto','other-'+i),edition:i<negatives?'negative':'base'});state.apkShop.context=currentApkShopContext(state);
  const beforeRng=structuredClone(state.rng),result=use(state);assert.equal(result.error,null);assert.equal(result.state.consumables.length,remaining+expected);assert.equal(result.events.filter(e=>e.type==='consumable_created').length,expected);if(!expected)assert.deepEqual(result.state.rng,beforeRng);
 }
});

test('debuffed generator Tarot consumes without RNG or creation',()=>{
 for(const key of ['c_emperor','c_high_priestess']){const state=run(key);state.consumables[0].debuffed=true;const result=use(state);assert.equal(result.error,null);assert.deepEqual(result.state.consumables,[]);assert.deepEqual(result.state.rng,state.rng);assert.equal(result.state.consumableUsage[key].count,1);}
});

test('a negative generator retains its extra slot during creation and resulting overfill survives saves',()=>{
 for(const key of ['c_emperor','c_high_priestess'])for(const remaining of [1,2]){
  const state=run(key);state.consumables[0].edition='negative';for(let i=0;i<remaining;i++)state.consumables.push(owned('c_pluto','other-'+i));state.apkShop.context=currentApkShopContext(state);
  const result=use(state);assert.equal(result.error,null);assert.equal(result.events.filter(e=>e.type==='consumable_created').length,3-remaining);assert.equal(result.state.consumables.length,3);assert.deepEqual(reload(result.state),result.state);
  const sold=dispatch(result.state,{type:'SELL_OWNED_CARD',area:'consumables',cardId:result.state.consumables[0].id,expectedRevision:result.state.revision});assert.equal(sold.error,null);assert.deepEqual(reload(sold.state),sold.state);
 }
});

test('a negative Fool uses its temporarily retained slot and persists native overfill',()=>{
 const state=run('c_fool');state.lastTarotPlanet='c_mercury';state.consumables[0].edition='negative';state.consumables.push(owned('c_pluto','other-1'),owned('c_sun','other-2'));state.apkShop.context=currentApkShopContext(state);
 const result=use(state);assert.equal(result.error,null);assert.equal(result.state.consumables.length,3);assert.equal(result.state.consumables.at(-1).entityId,'c_mercury');assert.deepEqual(reload(result.state),result.state);
});

test('High Priestess honours played-hand softlocks, banned centres and excludes Black Hole',()=>{
 const state=run('c_high_priestess');state.apkShop.context.bannedCentreIds=catalogue.centres.filter(c=>c.set==='Planet'&&!['c_pluto','c_mercury'].includes(c.key)).map(c=>c.key);
 const result=use(state);assert.equal(result.error,null);assert.deepEqual(result.state.consumables.map(c=>c.entityId).sort(),['c_mercury','c_pluto']);
 for(let i=0;i<30;i++){const result=use(run('c_high_priestess','PRIEST'+i));assert.ok(result.state.consumables.every(c=>!['c_black_hole','c_planet_x','c_ceres','c_eris'].includes(c.entityId)));}
});

test('generator collisions reject atomically and legacy RNG is not substituted for native generation',()=>{
 for(const key of ['c_emperor','c_high_priestess']){
  const state=run(key);state.consumables.push(owned('c_pluto',`generated:${state.revision}:1`));state.apkShop.context=currentApkShopContext(state);const before=structuredClone(state),result=use(state);assert.equal(result.error?.code,'INVALID_STATE');assert.equal(result.state,state);assert.deepEqual(state,before);
  const legacy=createRun('legacy-create',{runId:'legacy-create',money:4n});legacy.consumables=[owned(key,'creator')];assert.equal(use(legacy).error?.code,'USE_UNAVAILABLE');
 }
});

test('generation from a long owned identity produces bounded save-safe identities',()=>{
 const state=run('c_high_priestess');state.consumables[0].id='x'.repeat(119);state.apkShop.context=currentApkShopContext(state);assert.deepEqual(reload(state),state);
 const result=dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:state.consumables[0].id});assert.equal(result.error,null);assert.ok(result.state.consumables.every(card=>card.id.length<=120));assert.deepEqual(reload(result.state),result.state);
});

test('generator Tarot descriptions advertise implemented creation',()=>{
 for(const key of ['c_emperor','c_high_priestess']){const description=describeShopItem(owned(key));assert.equal(description.canBuy,true);assert.match(description.description,/Создаёт до 2/);}
});
