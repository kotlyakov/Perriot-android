import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
const findings=[];
function playing(){
 const s=createRun('review045',{runId:'review045',money:24n});s.phase='playing';s.revision=1;
 s.hand=['card_hearts_10','card_hearts_11','card_hearts_12','card_hearts_13','card_hearts_14','card_clubs_2','card_spades_3','card_diamonds_4'];
 s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));return s;
}
async function saved(page){return deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));}
async function settle(page){await page.locator('#post_round').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{}))));}
async function start(page){await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>{localStorage.clear();localStorage.setItem('card-cascade.current',text);},serializeState(playing()));await page.reload();await page.locator('#hand .playing-card').first().waitFor();}
async function win(page,interrupted=false){
 for(const rank of [10,11,12,13,14])await page.locator(`#hand [data-card-id="card_hearts_${rank}"]`).click();
 await page.evaluate(()=>{document.getElementById('play_hand').click();document.getElementById('play_hand').click();});
 const committed=await saved(page);assert.equal(committed.phase,'round_won');assert.equal(committed.money,24n);assert.equal(committed.revision,2);assert.equal(committed.round.score,1208n);assert.equal(committed.round.handsRemaining,3);
 if(interrupted){assert.equal(await page.locator('#cashout').count(),0);await page.reload();}
 await page.locator('#cashout').waitFor();await settle(page);
 assert.equal(await page.locator('#money_value').textContent(),'$24');assert.match(await page.locator('#cashout').textContent(),/\$10$/);
 assert.equal(await page.locator('.payout-interest .gold').textContent(),'$4');
 assert.equal(await page.locator('#chips_value').textContent(),'0');assert.equal(await page.locator('#mult_value').textContent(),'0');
 assert.equal(await page.locator('#round_score_value').textContent(),'1208');assert.equal(await page.locator('.played-card,.score-pop,.dealing').count(),0);
 const count=await page.locator('#deck_count').textContent();if(count!=='52/52')findings.push('Pending reward deck count '+count+' instead of 52/52');
 return committed;
}
async function payout(page){
 const before=await saved(page);
 await page.evaluate(()=>{const b=document.getElementById('cashout');b.click();b.click();b.click();});await page.locator('#shop_entry').waitFor();await settle(page);
 const after=await saved(page);assert.equal(after.phase,'shop');assert.equal(after.money,34n);assert.equal(after.revision,before.revision+1);assert.deepEqual(after.rng,before.rng);assert.deepEqual(after.cards,before.cards);assert.equal(after.lastScore,null);assert.equal(after.hand.length,0);assert.equal(after.discardPile.length,0);assert.equal(after.drawPile.length,52);
 assert.match(await page.locator('.shop-scope').textContent(),/Промежуточная сборка/);assert.equal(await page.locator('#deck_count').textContent(),'52/52');
 await page.reload();await page.locator('#shop_entry').waitFor();assert.equal(await page.locator('#money_value').textContent(),'$34');assert.equal(await page.locator('#cashout').count(),0);assert.deepEqual(await saved(page),after);
}
async function newRun(page){await page.locator('#options').click();await page.locator('#dialog-actions button').filter({hasText:'Новый забег'}).click();await page.locator('#dialog-actions button').filter({hasText:/^Начать$/}).click();await page.locator('#hand .playing-card').first().waitFor();assert.equal((await saved(page)).phase,'playing');assert.equal(await page.locator('#post_round').count(),0);assert.equal(await page.locator('#play_hand').isVisible(),true);assert.equal(await page.locator('#money_value').textContent(),'$4');}
try{
 for(const [width,height,reducedMotion] of [[1536,688,'no-preference'],[915,412,'no-preference'],[568,320,'reduce'],[360,800,'reduce']]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion}),errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page);await win(page);
  const box=await page.locator('#post_round').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);
  assert.equal(await page.locator('#play_hand').isVisible(),false);assert.equal(await page.locator('#hand').isVisible(),false);assert.equal(await page.locator('#blind_title').isVisible(),false);
  if(reducedMotion==='reduce')assert.equal(await page.locator('#post_round').evaluate(el=>el.getAnimations().length),0);
  if(width===1536)await page.screenshot({path:process.env.QA_SCREENSHOT??'/workspace/scratch/669d7c37bc9d/cashout045-review.png'});
  const pending=await saved(page);assert.equal(pending.drawPile.length,44);assert.equal(pending.hand.length,3);assert.equal(pending.discardPile.length,5);
  await page.locator('#deck').click();await page.locator('.deck-card').first().waitFor();assert.equal(await page.locator('.deck-card').count(),52);assert.equal(await page.locator('.deck-card.used').count(),0);assert.deepEqual(await saved(page),pending);await page.locator('#dialog-actions button').first().click();
  await page.reload();await page.locator('#cashout').waitFor();assert.deepEqual(await saved(page),pending);await payout(page);await settle(page);
  const shopBox=await page.locator('#post_round').boundingBox();assert.ok(shopBox.x>=0&&shopBox.y>=0&&shopBox.x+shopBox.width<=width+1&&shopBox.y+shopBox.height<=height+1);
  await newRun(page);assert.deepEqual(errors,[]);await page.close();console.log(`review045 actual win/pending reload/payout/reload/newrun/layout ${width}x${height} ${reducedMotion}`);
 }
 const interrupted=await browser.newPage();await start(interrupted);await win(interrupted,true);await payout(interrupted);await interrupted.close();console.log('review045 reload during actual victory animation resumes unpaid pending');
 const resetPending=await browser.newPage({reducedMotion:'reduce'});await start(resetPending);await win(resetPending);await newRun(resetPending);await resetPending.close();console.log('review045 new run from pending removes cashout panel');
 for(const slot of ['backup','current']){
  const page=await browser.newPage({reducedMotion:'reduce'});await start(page);await win(page);const before=await saved(page);
  await page.evaluate(slot=>{window.review045SetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='card-cascade.'+slot)throw Error('review045 quota');return window.review045SetItem.call(this,key,value);};},slot);
  await page.locator('#cashout').click();await page.locator('dialog[open]').waitFor();assert.deepEqual(await saved(page),before);assert.equal(await page.locator('#money_value').textContent(),'$24');assert.equal(await page.locator('#shop_entry').count(),0);assert.equal(await page.locator('#cashout').count(),1);
  await page.evaluate(()=>{Storage.prototype.setItem=window.review045SetItem;});await page.keyboard.press('Escape');await payout(page);await page.close();console.log('review045 '+slot+' write failure preserves balance/pending; retry pays once');
 }
 console.log('review045 observations: '+JSON.stringify([...new Set(findings)]));assert.deepEqual([...new Set(findings)],[]);
}finally{await browser.close();}
