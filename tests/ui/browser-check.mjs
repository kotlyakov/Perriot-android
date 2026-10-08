import {enterRun} from './enter-run.mjs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createRun} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try {
 const context=await browser.newContext({viewport:{width:1536,height:688}}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.PREVIEW_URL??'http://127.0.0.1:4173/');await enterRun(page);
 await page.locator('#hand .playing-card').first().waitFor({timeout:5000});
 assert.equal(await page.locator('#hand .playing-card').count(),8);
 for(let i=0;i<6;i++)await page.locator('#hand .playing-card').nth(i).click();
 assert.equal(await page.locator('#hand .playing-card.selected').count(),5);
 const selected=await page.locator('#hand .playing-card.selected').evaluateAll(nodes=>nodes.map(n=>n.dataset.cardId).sort());
 await page.locator('#sort_suit').click();
 assert.deepEqual(await page.locator('#hand .playing-card.selected').evaluateAll(ns=>ns.map(n=>n.dataset.cardId).sort()),selected);
 await page.locator('#discard').click();await page.waitForFunction(()=>document.querySelector('#discards_value').textContent==='3');
 assert.equal(await page.locator('#hands_value').textContent(),'4');
 assert.equal(await page.locator('#hand .playing-card.selected').count(),0);
 await page.locator('#hand .playing-card').first().click();await page.locator('#play_hand').click();
 await page.waitForFunction(()=>document.querySelector('#hands_value').textContent==='3');
 await page.waitForFunction(()=>!document.querySelector('#hand .playing-card')?.disabled);
 const score=await page.locator('#round_score_value').textContent();assert.ok(BigInt(score)>0n);
 const before=await page.locator('#hand .playing-card').evaluateAll(ns=>ns.map(n=>n.dataset.cardId));
 await page.reload();await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();
 assert.equal(await page.locator('#hands_value').textContent(),'3');assert.equal(await page.locator('#round_score_value').textContent(),score);
 assert.deepEqual(await page.locator('#hand .playing-card').evaluateAll(ns=>ns.map(n=>n.dataset.cardId)),before);
 for(const [width,height] of [[568,320],[915,412],[1280,720]]) {
   await page.setViewportSize({width,height});
   await page.waitForFunction(()=>{const r=document.getElementById('stage').getBoundingClientRect();return r.width<=innerWidth+.1 && r.height<=innerHeight+.1;});
   const boxes=await page.locator('#play_hand,#discard,#sort_rank,#sort_suit,#deck').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
   for(const b of boxes)assert.ok(b.x>=-1 && b.y>=-1 && b.right<=width+1 && b.bottom<=height+1,JSON.stringify(b));
 }
 await page.setViewportSize({width:1536,height:688});
 await page.waitForFunction(()=>document.getElementById('stage').getBoundingClientRect().width>1535);
 await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/field-preview.png'});
 await page.evaluate(()=>localStorage.setItem('card-cascade.current','damaged'));
 await page.reload();await enterRun(page);await page.locator('#restore-backup').waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),'damaged');
 await page.locator('#restore-backup').click();await page.locator('#hand .playing-card').first().waitFor();
 assert.notEqual(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),'damaged');
 // Drag changes the real saved hand order without consuming an action.
 const readSaved=()=>page.evaluate(()=>localStorage.getItem('card-cascade.current'));
 const dragBefore=deserializeState(await readSaved()),moving=dragBefore.hand[0];
 const first=await page.locator('#hand .playing-card').first().boundingBox(),last=await page.locator('#hand .playing-card').last().boundingBox();
 await page.mouse.move(first.x+20,first.y+60);await page.mouse.down();await page.mouse.move(last.x+60,last.y+60,{steps:10});await page.mouse.up();
 const dragAfter=deserializeState(await readSaved());assert.equal(dragAfter.hand.at(-1),moving);assert.equal(dragAfter.revision,dragBefore.revision+1);assert.deepEqual(dragAfter.round,dragBefore.round);
 await page.reload();await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();assert.deepEqual(await page.locator('#hand .playing-card').evaluateAll(ns=>ns.map(n=>n.dataset.cardId)),dragAfter.hand);
 // Two synchronous activations while scoring is busy consume a single hand.
 await page.locator('#hand .playing-card').first().click();const playBefore=deserializeState(await readSaved());
 await page.evaluate(()=>{document.getElementById('play_hand').click();document.getElementById('play_hand').click();});
 await page.waitForFunction(()=>!document.querySelector('#hand .playing-card')?.disabled);
 const playAfter=deserializeState(await readSaved());assert.equal(playAfter.round.handsRemaining,playBefore.round.handsRemaining-1);assert.equal(playAfter.revision,playBefore.revision+1);
 // Real touch events and native keyboard activation, using a separate viewport.
 const touchContext=await browser.newContext({viewport:{width:915,height:412},hasTouch:true}),touch=await touchContext.newPage();
 await touch.goto(process.env.PREVIEW_URL??'http://127.0.0.1:4173/');await enterRun(touch);await touch.locator('#hand .playing-card').first().waitFor();
 await touch.locator('#hand .playing-card').first().tap();assert.equal(await touch.locator('#hand .playing-card.selected').count(),1);
 await touch.locator('#hand .playing-card').first().tap();assert.equal(await touch.locator('#hand .playing-card.selected').count(),0);
 await touch.locator('#hand .playing-card').first().focus();await touch.keyboard.press('Space');await touch.waitForFunction(()=>document.querySelectorAll('#hand .playing-card.selected').length===1);assert.equal(await touch.locator('#hand .playing-card.selected').count(),1);
 await touch.keyboard.press('Space');await touch.waitForFunction(()=>document.querySelectorAll('#hand .playing-card.selected').length===0);assert.equal(await touch.locator('#hand .playing-card.selected').count(),0);await touchContext.close();
 // Capture actual UI with a valid fixture matching the user's reference values.
 const ref=createRun('ui-reference',{runId:'reference-layout',money:4n});
 ref.phase='playing';ref.revision=3;ref.hand=['card_clubs_11','card_spades_10','card_spades_8','card_hearts_7','card_clubs_7','card_diamonds_7','card_diamonds_6','card_diamonds_5'];
 const remainder=Object.keys(ref.cards).filter(id=>!ref.hand.includes(id));ref.drawPile=remainder.slice(0,34);ref.discardPile=remainder.slice(34);ref.round.score=56n;ref.round.handsRemaining=3;ref.round.discardsRemaining=3;
 await page.evaluate(text=>{localStorage.setItem('card-cascade.current',text);},serializeState(ref));await page.reload();await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();
 const handBounds=await page.locator('#hand .playing-card').evaluateAll(ns=>{const rs=ns.map(n=>n.getBoundingClientRect());return {left:Math.min(...rs.map(r=>r.left)),right:Math.max(...rs.map(r=>r.right)),top:Math.min(...rs.map(r=>r.top)),bottom:Math.max(...rs.map(r=>r.bottom))};});
 assert.ok(Math.abs(handBounds.left-468)<=5 && Math.abs(handBounds.right-1157)<=5,'Fan exceeds reference bounds: '+JSON.stringify(handBounds));
 await page.screenshot({path:'artifacts/field-preview.png'});
 // A physical write failure must preserve both the rendered and stored run.
 const quotaBefore=await readSaved();await page.locator('#hand .playing-card').first().click();
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});
 await page.locator('#play_hand').click();await page.locator('#dialog-title').filter({hasText:'Не удалось сохранить'}).waitFor();
 assert.equal(await readSaved(),quotaBefore);assert.equal(await page.locator('#hands_value').textContent(),'3');assert.equal(await page.locator('#round_score_value').textContent(),'56');
 // Both damaged slots must remain untouched, with no automatically created run.
 await page.reload();await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();
 await page.evaluate(()=>{localStorage.setItem('card-cascade.current','bad');localStorage.setItem('card-cascade.backup','worse');});
 await page.reload();await enterRun(page);await page.locator('#dialog-title').filter({hasText:'Сохранение недоступно'}).waitFor();
 assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('card-cascade.current'),localStorage.getItem('card-cascade.backup')]),['bad','worse']);assert.equal(await page.locator('#hand .playing-card').count(),0);
 // The single exported file runs with network fully offline, including reload.
 const portableContext=await browser.newContext({viewport:{width:1536,height:688},offline:true}),portable=await portableContext.newPage();
 portable.on('pageerror',error=>errors.push(error.message));
 await portable.goto(new URL('../../artifacts/field-preview.html',import.meta.url).href);await enterRun(portable);await portable.locator('#hand .playing-card').first().waitFor();
 assert.equal(await portable.locator('#hand .playing-card').count(),8);await portable.locator('#hand .playing-card').first().click();await portable.locator('#play_hand').click();
 await portable.waitForFunction(()=>document.getElementById('hands_value').textContent==='3');await portable.reload();await enterRun(portable);await portable.locator('#hand .playing-card').first().waitFor();assert.equal(await portable.locator('#hands_value').textContent(),'3');await portableContext.close();
 assert.deepEqual(errors,[]);console.log('Browser checks passed: mouse/touch/keyboard/drag/repeated play, sort/play/discard, reload/recovery/write failure, resize/fan bounds, offline portable HTML');
 await context.close();
} finally {await browser.close();}
