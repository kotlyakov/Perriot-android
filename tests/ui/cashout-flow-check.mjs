import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
function won(balance=4n,hands=1){const s=createRun('cashout-ui',{runId:'cashout-ui',money:balance});s.phase='round_won';s.round.score=329n;s.round.handsRemaining=hands;s.round.discardsRemaining=3;return s;}
try{
 for(const [width,height] of [[1536,688],[915,412],[568,320],[360,800]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);
  await page.evaluate(s=>localStorage.setItem('card-cascade.current',s),serializeState(won()));await page.reload();
  await page.locator('#cashout').waitFor({timeout:1200});
  assert.match(await page.locator('#cashout').innerText(),/Обналичить: \$4/);assert.equal(await page.locator('.payout-interest').count(),0);assert.equal(await page.locator('#money_value').textContent(),'$4');
  await page.locator('#post_round').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{}))));const box=await page.locator('#post_round').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);
  assert.equal(await page.locator('#play_hand').isVisible(),false);assert.equal(await page.locator('#blind_title').isVisible(),false);
  await page.evaluate(()=>{const b=document.getElementById('cashout');b.click();b.click();});await page.locator('#shop_entry').waitFor();
  const saved=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));assert.equal(saved.phase,'shop');assert.equal(saved.money,8n);assert.equal(saved.revision,1);assert.equal(saved.hand.length,0);assert.equal(saved.drawPile.length,52);
  await page.reload();await page.locator('#shop_entry').waitFor();assert.equal(await page.locator('#money_value').textContent(),'$8');assert.equal(await page.locator('#cashout').count(),0);assert.deepEqual(errors,[]);await page.close();console.log('cashout once/reload/layout '+width+'x'+height);
 }
 const page=await browser.newPage();await page.goto(process.env.PREVIEW_URL);await page.evaluate(s=>localStorage.setItem('card-cascade.current',s),serializeState(won(20n,3)));await page.reload();await page.locator('#cashout').waitFor();assert.match(await page.locator('#cashout').innerText(),/\$10/);assert.equal(await page.locator('.payout-interest').count(),1);
 const before=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('cashout QA write failed');};});await page.locator('#cashout').click();await page.locator('dialog[open]').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),before);assert.equal(await page.locator('#shop_entry').count(),0);assert.equal(await page.locator('#money_value').textContent(),'$20');await page.keyboard.press('Escape');await page.close();console.log('cashout interest snapshot/writefailure checked');
}finally{await browser.close();}
