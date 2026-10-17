import test from 'node:test';
import assert from 'node:assert/strict';
import names from '../../src/content/shop-names-ru.js';
import {describeShopItem} from '../../src/content/shop-display.js';
import {describeCardModifiers} from '../../src/content/card-modifier-display.js';
import {applyCardModifiers,cardMarkup} from '../../src/ui/field.js';
import {animateScore} from '../../src/ui/score-animation.js';
const keys=['j_mime','j_pareidolia','j_blueprint','j_brainstorm','j_selzer','j_dna','j_marble'];
test('effect mechanism descriptions name all seven admitted native identities',()=>{
 for(const entityId of keys){const d=describeShopItem({entityId});assert.equal(d.name,names[entityId]);assert.doesNotMatch(d.description,/предварительной версии/);}
 assert.match(describeShopItem({entityId:'j_selzer',repeatHandsRemaining:1}).description,/Осталось рук: 1/);
 for(const entityId of ['c_aura','c_talisman','c_deja_vu','c_trance','c_medium'])assert.doesNotMatch(describeShopItem({entityId}).description,/предварительной версии/);
});
test('independent enhancement edition and seal markup survive every combination and replacement',()=>{
 const element={dataset:{enhancement:'gold',edition:'foil',seal:'blue'}};
 for(const enhancement of ['base','stone','steel','glass'])for(const edition of ['base','foil','holographic','polychrome'])for(const seal of ['red','gold','blue','purple']){
  const card={rank:11,suit:'hearts',enhancement,edition,seal};applyCardModifiers(element,card);
  assert.equal(element.dataset.edition,edition==='base'?undefined:edition);assert.equal(element.dataset.enhancement,enhancement==='base'?undefined:enhancement);assert.equal(element.dataset.seal,seal);
  assert.match(cardMarkup(card),new RegExp(`class="playing-seal" data-seal="${seal}"`));assert.equal(describeCardModifiers(card).length,(enhancement==='base'?0:1)+(edition==='base'?0:1)+1);
 }
 applyCardModifiers(element,{enhancement:'base',edition:'base'});assert.deepEqual(element.dataset,{});
});
test('held Red seal repeats anchor the remaining hand without touching HUD',async()=>{
 const queries=[],pops=[],held={style:{left:'490px',top:'388px'}};const original={document:globalThis.document,matchMedia:globalThis.matchMedia};
 globalThis.matchMedia=()=>({matches:true});globalThis.document={querySelector(selector){queries.push(selector);return selector.startsWith('#hand ')?held:null;},getElementById(id){assert.equal(id,'stage');return {append:pop=>pops.push(pop)};},createElement(){return {style:{},dataset:{},remove(){}};}};
 try{await animateScore([{type:'score_repeat',phase:'held_card',sourceId:'held',effectSourceId:'held'}]);assert.equal(pops.length,1);assert.equal(pops[0].style.top,'361px');assert.equal(pops[0].dataset.effectSourceId,'held');assert.ok(queries.some(s=>s.startsWith('#hand ')));assert.ok(!queries.some(s=>s.startsWith('.played-card')));}finally{Object.assign(globalThis,original);}
});
test('animation held hand contains immediate DNA copies, excludes played/forced cards and defers ordinary draws',async()=>{const view=await import('../../src/ui/play-animation.js');assert.equal(typeof view.animationHeldCardIds,'function');assert.deepEqual(view.animationHeldCardIds(['played','held','hook'],['played'],['hook'],[{id:'copy1'},{id:'copy2'}]),['held','copy1','copy2']);assert.deepEqual(view.animationHeldCardIds(['played','held'],['played'],[]),['held']);});
