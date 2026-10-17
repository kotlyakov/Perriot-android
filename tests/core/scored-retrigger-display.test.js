import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import names from '../../src/content/shop-names-ru.js';
import {describeShopItem} from '../../src/content/shop-display.js';
import {formatTooltipText} from '../../src/ui/tooltip-text.js';
import {animateScore} from '../../src/ui/score-animation.js';
const keys=['j_dusk','j_hack','j_sock_and_buskin','j_hanging_chad'];
test('scored retrigger descriptions use catalogue names and neutral ranks/counts',()=>{
 const expected=[/засчитываемые карты.*последней.*руке/i,/засчитываемые.*2, 3, 4 и 5/i,/засчитываемые.*валет.*дам.*корол/i,/первой засчитываемой карты.*2 дополнительных/i];
 keys.forEach((entityId,i)=>{const item=describeShopItem({entityId});assert.equal(item.name,names[entityId]);assert.match(item.description,expected[i]);assert.doesNotMatch(item.description,/предварительной версии/);assert.deepEqual(formatTooltipText(item.description).filter(p=>p.kind),[]);});
 assert.equal(catalogue.centres.filter(c=>c.set==='Joker').length,150);
 for(const key of ['j_sock_and_buskin','j_hanging_chad'])assert.equal(catalogue.centres.find(c=>c.key===key).unlocked,false);
});
test('repeat marker is nonnumeric, source attributed and leaves HUD untouched',async()=>{
 const appended=[],removed=[];const joker={style:{left:'400px',top:'50px'},offsetHeight:100};const card={style:{left:'600px',top:'200px'}};
 const previous={document:globalThis.document,matchMedia:globalThis.matchMedia};
 globalThis.matchMedia=()=>({matches:true});globalThis.document={querySelector(selector){return selector.includes('joker_repeat')?joker:selector.includes('played')?card:null;},getElementById(id){assert.equal(id,'stage','repeat markers never change the numeric HUD');return {append:n=>appended.push(n)};},createElement(){return {dataset:{},style:{},remove(){removed.push(this);}};}};
 try{await animateScore([{type:'score_repeat',phase:'scored_card',sourceId:'playing_repeat',effectSourceId:'joker_repeat'}]);assert.equal(appended.length,1);assert.equal(appended[0].textContent,'Ещё раз');assert.match(appended[0].className,/score-repeat/);assert.deepEqual(appended[0].dataset,{sourceId:'playing_repeat',effectSourceId:'joker_repeat',operation:'repeat'});assert.equal(removed.length,1);}finally{Object.assign(globalThis,previous);}
});

test('four supported descriptions retain purchase restrictions and owned Heart display',()=>{
 for(const entityId of keys){assert.equal(describeShopItem({entityId}).canBuy,true);for(const flag of ['perishable','rental','debuffed'])assert.equal(describeShopItem({entityId,[flag]:true}).canBuy,false);assert.equal(describeShopItem({entityId,debuffed:true},{owned:true}).canBuy,true);assert.equal(describeShopItem({entityId,eternal:true}).canBuy,true);}
});

test('normal native pools preserve four centre locks, ban and duplicate gating',async()=>{
 const {createApkShopContext,rerollApkShop}=await import('../../src/core/apk-shop.js');const {createApkRng}=await import('../../src/core/apk-rng.js');
 for(const key of keys){
  const options={mainSlots:1,boosterSlots:0,rates:{Joker:1,Tarot:0,Planet:0,Base:0,Spectral:0},bannedCentreIds:catalogue.centres.filter(c=>c.set==='Joker'&&c.key!==key).map(c=>c.key)};
  const generated=extra=>Array.from({length:24},(_,i)=>rerollApkShop(createApkRng('RETRIGGERPOOL'+i),createApkShopContext({...options,...extra})).main[0].entityId);
  const locked=['j_sock_and_buskin','j_hanging_chad'].includes(key);assert.equal(generated({}).includes(key),!locked,key+' initial availability');assert.ok(generated({unlockedCentreIds:[key]}).includes(key));assert.ok(!generated({lockedCentreIds:[key]}).includes(key));assert.ok(!generated({unlockedCentreIds:[key],ownedCentreIds:[key]}).includes(key));assert.ok(!generated({unlockedCentreIds:[key],bannedCentreIds:[...options.bannedCentreIds,key]}).includes(key));
 }
});
