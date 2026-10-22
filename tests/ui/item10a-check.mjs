import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {scoreDelta} from '../../src/ui/score-animation.js';
import {DECKS} from '../../src/content/decks.js';
import {deserializeState} from '../../src/persistence/save.js';

// Balancing lowers either factor: it is not an additive chip effect.
assert.deepEqual(scoreDelta({operation:'balance',before:{chips:120n,mult:4n},after:{chips:62n,mult:62n}}),{kind:'balance',multiply:false,text:'Баланс'});
if(!process.argv.includes('--logic-only')){
 const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{
  await mkdir('artifacts',{recursive:true});
  for(const [width,height,touch] of [[1536,688,false],[915,412,true],[568,320,true],[360,800,true]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:touch,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(process.env.PREVIEW_URL??'http://127.0.0.1:4173');
   await page.locator('#start_new').click();await page.locator('#setup_deck_select').waitFor();
   const ids=Object.keys(DECKS);assert.equal(ids.length,15);
   assert.equal(await page.locator('#setup_deck_select option').count(),15);
   assert.match(await page.locator('.start-preview-access').textContent(),/предпросмотра/);
   for(const id of ids){
    await page.locator('#setup_deck_select').selectOption(id);
    assert.equal(await page.locator('.start-deck-back').getAttribute('data-deck'),id);
    assert.equal(await page.locator('.start-deck-info h3').textContent(),DECKS[id].name);
    assert.equal(await page.locator('.start-deck-info p').textContent(),DECKS[id].description??`${DECKS[id].bonus} ${DECKS[id].effect} ${DECKS[id].timing}`);
    assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),null);
    const fits=await page.locator('.start-deck-info').evaluate(info=>{const box=info.getBoundingClientRect();return [...info.children].every(node=>{const r=node.getBoundingClientRect();return r.left>=box.left&&r.right<=box.right&&r.top>=box.top&&r.bottom<=box.bottom;});});assert.ok(fits,'Deck description overflows: '+id);
   }
   await page.locator('#setup_deck_select').selectOption('red');
   const activate=locator=>touch?locator.tap():locator.click();
   await activate(page.locator('#setup_deck_prev'));assert.equal(await page.locator('#setup_deck_select').inputValue(),'erratic');
   await activate(page.locator('#setup_deck_next'));assert.equal(await page.locator('#setup_deck_select').inputValue(),'red');
   await page.locator('#setup_deck_select').selectOption('black');
   const boxes=await page.locator('#setup_deck_prev,#setup_deck_select,#setup_deck_next,#setup_play,#setup_back,#setup_seed').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom];}));
   for(const [left,top,right,bottom] of boxes)assert.ok(left>=-1&&top>=-1&&right<=width+1&&bottom<=height+1,'Deck controls outside viewport');
   if(width===1536||width===915)await page.screenshot({path:`artifacts/item10a-setup-${width}.png`});
   await page.locator('#setup_seed').fill('DECK10A');await activate(page.locator('#setup_play'));await page.locator('#select_small').waitFor();
   const saved=await page.evaluate(()=>localStorage.getItem('card-cascade.current')),state=deserializeState(saved);
   assert.equal(state.deckId,'black');assert.equal(state.round.handsRemaining,3);assert.equal(state.jokerSlots,6);
   await page.reload();await page.locator('#start_new').click();await page.locator('#setup_continue_tab').click();await page.locator('#select_small').waitFor();
   assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),saved);
   await activate(page.locator('#select_small'));await page.locator('#hand .playing-card').first().waitFor();
   assert.equal(await page.locator('#deck').getAttribute('data-deck'),'black');assert.equal(await page.locator('#joker_count').textContent(),'0/6');
   await page.locator('#sort_rank').waitFor({state:'visible'});await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);
   await page.locator('#deck').click();await page.locator('.deck-view').waitFor();assert.equal(await page.locator('.deck-info strong').textContent(),DECKS.black.name);
   await page.keyboard.press('Escape');
   await page.evaluate(async()=>{
    const {animateScore}=await import('/src/ui/score-animation.js');
    await animateScore([{type:'score_step',phase:'deck',sourceId:'deck:plasma',operation:'balance',before:{chips:120n,mult:4n},after:{chips:62n,mult:62n}}]);
   });
   await page.waitForFunction(()=>document.getElementById('chips_value').textContent==='62'&&document.getElementById('mult_value').textContent==='62');
   assert.equal(await page.locator('.score-pop[data-operation=balance]').count(),0);
   await page.evaluate(async()=>{
    const {createRun}=await import('/src/core/run.js'),{renderPostRound}=await import('/src/ui/post-round.js');
    const state=createRun('GREEN10A',{runId:'green10a',deckId:'green',money:25n,referenceRng:true,referenceShop:true,reducedMotion:true});
    state.phase='round_won';state.round.score=state.round.target;state.round.handsRemaining=2;state.round.discardsRemaining=3;
    renderPostRound(state,false,()=>{});
   });
   assert.equal(await page.locator('.payout-hands>.gold').textContent(),'$4');
   assert.equal(await page.locator('.payout-discards>.gold').textContent(),'$3');
   assert.equal(await page.locator('.payout-interest').count(),0);
   if(width===1536)await page.screenshot({path:'artifacts/item10a-green-cashout.png'});
   assert.deepEqual(errors,[]);await context.close();
  }
 }finally{await browser.close();}
 console.log('item10a deck selection/resume desktop+touch PASS');
}
