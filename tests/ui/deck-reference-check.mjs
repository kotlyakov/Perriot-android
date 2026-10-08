import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createRun} from '../../src/core/run.js';
import {serializeState} from '../../src/persistence/save.js';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 await mkdir('artifacts',{recursive:true});
 for(const [width,height] of [[1536,709],[915,412],[568,320],[360,800],[1024,600],[2400,1080]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.PREVIEW_URL??'http://127.0.0.1:4173');await page.locator('#hand .playing-card').first().waitFor();
 const state=createRun('deck-reference',{runId:'deck-reference',money:4n,deckId:width===1536?'red':'blue'});state.phase='playing';state.revision=1;
 delete state.cards.card_clubs_2;state.hand=['card_spades_13','card_spades_12','card_spades_11','card_hearts_14','card_clubs_13','card_clubs_11','card_diamonds_2','card_hearts_3'];state.discardPile=[];state.drawPile=Object.keys(state.cards).filter(id=>!state.hand.includes(id));
 await page.evaluate(s=>localStorage.setItem('card-cascade.current',s),serializeState(state));await page.reload();await page.locator('#deck').click();
 await page.waitForFunction(()=>document.fonts.status==='loaded');
 assert.equal(await page.locator('.deck-info strong').textContent(),state.deckId==='red'?'Красная колода':'Синяя колода');assert.equal(await page.locator('[role=tab]').count(),2);assert.equal(await page.locator('.deck-card').count(),51);assert.equal(await page.locator('.deck-row').count(),4);assert.equal(await page.locator('.deck-card.used').count(),8);
 assert.equal((await page.locator('.deck-categories b').allTextContents()).join(','),'3,7,33');
 await page.locator('#dialog').evaluate(d=>Promise.all(d.getAnimations().map(a=>a.finished)));
 const rect=await page.locator('#dialog').boundingBox();assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width+.5&&rect.y+rect.height<=height+.5,JSON.stringify(rect));
 const back=await page.locator('#dialog-actions button').boundingBox();assert.ok(back.width>rect.width*.94);assert.ok(back.y+back.height<rect.y+rect.height);
 const overlap=await page.locator('.deck-row').first().evaluate(row=>{const cards=[...row.children];return cards.slice(1).every((c,i)=>c.getBoundingClientRect().left<cards[i].getBoundingClientRect().right);});assert.ok(overlap);
 const geometry=await page.evaluate(()=>{const r=document.querySelector('.deck-grid').getBoundingClientRect();return [...document.querySelectorAll('.deck-card')].every(c=>{const b=c.getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1&&b.top>=r.top-1&&b.bottom<=r.bottom+1;});});assert.ok(geometry,'card fan escapes grid');
 const before=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));
 if(width===1536)await page.screenshot({path:'artifacts/deck-reference-preview.png'});
 await page.locator('[role=tab][data-mode=full]').click();assert.equal(await page.locator('.deck-card.used').count(),0);assert.equal(await page.locator('[role=tab][data-mode=full]').getAttribute('aria-selected'),'true');
 assert.equal((await page.locator('.deck-categories b').allTextContents()).join(','),'4,12,35');
 await page.locator('[role=tab][data-mode=full]').press('ArrowLeft');assert.equal(await page.locator('.deck-card.used').count(),8);
 assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),before);
 await page.locator('#dialog-actions button').click();assert.equal(await page.locator('dialog[open]').count(),0);
 await page.locator('#deck').click();await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);await page.locator('#options').click();assert.equal(await page.locator('dialog.deck-dialog').count(),0,'Deck layout leaks after Escape');assert.equal(await page.locator('#dialog-title').isVisible(),true);await page.keyboard.press('Escape');await page.locator('#run_info').click();assert.ok((await page.locator('#dialog-body').textContent()).includes(state.deckId==='red'?'Красная колода':'Синяя колода'),'Run info uses wrong deck name');assert.deepEqual(errors,[]);
 console.log('Deck reference verified '+width+'x'+height);await context.close();
 }
}finally{await browser.close();}
