import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {deserializeState} from '../../src/persistence/save.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const saved=page=>page.evaluate(()=>localStorage.getItem('card-cascade.current'));
async function settleStartup(page,selector='#start_screen'){
 // CI caught geometry being sampled during the legitimate bottom-entry animation.
 await page.locator(selector).evaluate(async screen=>{
  await Promise.allSettled(screen.getAnimations({subtree:true}).filter(animation=>animation.effect.getTiming().iterations!==Infinity).map(animation=>animation.finished));
 });
}
async function inside(page,selector,width,height){
 await settleStartup(page);
 const boxes=await page.locator(selector).evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return [b.x,b.y,b.right,b.bottom];}));
 assert.ok(boxes.length,'Missing startup controls '+selector);
 for(const [x,y,right,bottom] of boxes)assert.ok(x>=-1&&y>=-1&&right<=width+1&&bottom<=height+1,`Startup control escapes ${width}x${height}: ${[x,y,right,bottom]}`);
}
async function startup(page,width,height,touch){
 const click=locator=>touch?locator.tap():locator.click();
 await page.locator('#start_new').waitFor();
 await settleStartup(page);
 assert.equal(await saved(page),null,'Opening the app must not create a run');
 if(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches))assert.equal(await page.locator('#start_screen').evaluate(n=>n.getAnimations().length),0);
 assert.equal(await page.locator('#start_new').textContent(),'Играть');
 assert.equal(await page.locator('#start_collection').isDisabled(),false);
 if(width===1536)await page.screenshot({path:'artifacts/start-menu046.png'});
 await inside(page,'#start_new,#start_settings,#start_collection,#start_language',width,height);
 await click(page.locator('#start_settings'));await page.locator('dialog[open]').waitFor();
 assert.equal(await saved(page),null);await page.locator('#dialog-actions button').first().click();
 await click(page.locator('#start_new'));await page.locator('#setup_play').waitFor();
 await settleStartup(page);
 assert.equal(await saved(page),null,'Opening setup must not create a run');
 if(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches))assert.equal(await page.locator('.start-setup').evaluate(n=>n.getAnimations().length),0);
 await inside(page,'#setup_play,#setup_back,#setup_seed,#setup_deck_prev,#setup_deck_select,#setup_deck_next',width,height);
 assert.equal(await page.locator('#setup_continue_tab').isDisabled(),true);
 await page.locator('#setup_deck_select').selectOption('red');await page.locator('#setup_seed').fill('menu1234');
 assert.equal(await page.locator('#setup_seed').inputValue(),'MENU1234');
 assert.equal(await page.locator('#setup_seed').getAttribute('maxlength'),'8');
 assert.equal(await saved(page),null,'Selecting a deck or seed must not create a run');
 if(width===1536)await page.screenshot({path:'artifacts/run-setup046.png'});
 await click(page.locator('#setup_play'));await page.locator('#select_small').waitFor();
 await settleStartup(page,'#blind_selection');
 if(width===1536)await page.screenshot({path:'artifacts/blind-selection046.png'});
 const pending=deserializeState(await saved(page));
 assert.equal(pending.phase,'blind_selection');assert.equal(pending.deckId,'red');
 assert.equal(await page.locator('#deck').getAttribute('data-deck'),'red','Deck back follows selected Red deck');assert.equal(pending.seed,'MENU1234');
 assert.equal(Object.keys(pending.cards).length,52);assert.equal(pending.hand.length,0);assert.equal(pending.round.handsRemaining,4);assert.equal(pending.round.discardsRemaining,4);
 assert.equal(pending.apkShop.version,1);assert.match(pending.apkShop.voucherId,/^v_/);assert.deepEqual(pending.apkShop.context.playedHands,{});
 await page.reload();await page.locator('#start_new').waitFor();await click(page.locator('#start_new'));await page.locator('#setup_continue_tab').waitFor();assert.equal(await page.locator('#setup_continue_tab').isEnabled(),true);
 const before=await saved(page);await click(page.locator('#setup_continue_tab'));await page.locator('#select_small').waitFor();
 assert.equal(await saved(page),before,'Continuing pending blind must not deal or mutate RNG');
 await click(page.locator('#select_small'));await page.locator('#hand .playing-card').first().waitFor();
 assert.equal(await page.locator('#hand .playing-card').count(),8);assert.equal(await page.locator('#hands_value').textContent(),'4');
 const playing=await saved(page);await page.reload();await page.locator('#start_new').waitFor();await click(page.locator('#start_new'));await page.locator('#setup_continue_tab').waitFor();await click(page.locator('#setup_continue_tab'));
 await page.locator('#hand .playing-card').first().waitFor();assert.equal(await saved(page),playing,'Continue must not reshuffle active hand');
 await page.reload();await page.locator('#start_new').waitFor();await click(page.locator('#start_new'));await page.locator('#setup_play').waitFor();
 await click(page.locator('#setup_play'));await page.locator('dialog[open]').waitFor();
 assert.equal(await saved(page),playing,'Replacing a saved run requires explicit confirmation');
 await page.locator('#dialog-actions button').filter({hasText:'Отмена'}).click();assert.equal(await saved(page),playing);
 await click(page.locator('#setup_play'));await page.locator('#dialog-actions button').filter({hasText:/^Начать$/}).click();
 await page.locator('#select_small').waitFor();const red=deserializeState(await saved(page));assert.equal(red.deckId,'red');assert.equal(red.phase,'blind_selection');assert.equal(red.round.discardsRemaining,4);assert.notEqual(red.runId,pending.runId);
}
try{
 for(const [width,height,reducedMotion] of [[1536,688,'no-preference'],[915,412,'no-preference'],[568,320,'reduce'],[390,844,'reduce']]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:width<1000,reducedMotion});const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await page.goto(process.env.PREVIEW_URL??'http://127.0.0.1:4173/');
  await startup(page,width,height,true);assert.deepEqual(errors,[]);await context.close();console.log(`Startup menus/save/seed/red/continue/confirm/touch ${width}x${height} ${reducedMotion}`);
 }
 const context=await browser.newContext({viewport:{width:1536,height:688},offline:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));await page.goto(new URL('../../artifacts/field-preview.html',import.meta.url).href);
 await startup(page,1536,688,false);assert.deepEqual(errors,[]);await context.close();console.log('Startup portable HTML offline/reload verified');
}finally{await browser.close();}
