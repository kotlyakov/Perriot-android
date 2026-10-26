import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
let fixture=createRun('SIXTHREVIEW',{runId:'sixth-motion',money:100n,referenceRng:true,referenceShop:true});
fixture=dispatch(fixture,{type:'START_BLIND',expectedRevision:fixture.revision}).state;
const cardId='card_hearts_6';
if(!fixture.hand.includes(cardId)){
 const replaced=fixture.hand[0];fixture.hand[0]=cardId;fixture.drawPile=fixture.drawPile.filter(id=>id!==cardId);fixture.drawPile.push(replaced);
}
fixture.jokers=[{id:'sixth',entityId:'j_sixth_sense',originalKey:'j_sixth_sense',set:'Joker',edition:'base',cost:6n,sellCost:3n,creationOrdinal:1}];fixture.nextJokerCreationOrdinal=2;
const expected=dispatch(fixture,{type:'PLAY_HAND',expectedRevision:fixture.revision,cardIds:[cardId]});
assert.ok(!expected.error);assert.ok(expected.events.some(e=>e.type==='playing_card_destroyed'&&e.cardId===cardId));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 for(const reducedMotion of ['no-preference','reduce']){
  const page=await browser.newPage({viewport:{width:915,height:412},reducedMotion});page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(fixture));await page.reload();await enterRun(page,{startBlind:false});
  await page.evaluate(()=>{
   window.sixthMotion=[];const original=Element.prototype.animate;
   Element.prototype.animate=function(frames,options){
    if(this.matches('.played-card,.card-dust'))window.sixthMotion.push({dust:this.classList.contains('card-dust'),id:this.dataset.cardId,visible:this.style.visibility!=='hidden',locked:document.querySelector('#play_hand').disabled,revision:JSON.parse(localStorage.getItem('card-cascade.current')).state.revision});
    return original.call(this,frames,options);
   };
  });
  await page.locator(`#hand [data-card-id="${cardId}"]`).click();await page.locator('#play_hand').evaluate(button=>{button.click();button.click();});
  await page.waitForFunction(()=>!document.querySelector('#sort_rank').disabled&&!document.querySelector('.played-card,.motion-copy'));
  const log=await page.evaluate(()=>window.sixthMotion),dust=log.findIndex(row=>row.dust),flight=log.findIndex(row=>!row.dust);
  if(reducedMotion==='no-preference'){
   assert.ok(flight>=0&&dust>flight,'The Six flies and scores before dissolving');
   assert.ok(!log.slice(dust).some(row=>!row.dust&&row.visible),'Destroyed Six never reappears during cleanup');
   assert.ok(log.every(row=>row.locked&&row.revision===fixture.revision+1),'Save precedes motion and controls remain locked');
  }else assert.equal(log.length,0);
  const actual=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
  assert.deepEqual(actual,expected.state);assert.deepEqual(errors,[]);await page.close();
  console.log('Sixth Sense plays, scores, dissolves once; save/input/RNG '+reducedMotion+' PASS');
 }
}finally{await browser.close();}
