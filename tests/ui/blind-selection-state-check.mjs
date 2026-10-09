import {enterRun} from './enter-run.mjs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun} from '../../src/core/run.js';
import {serializeState} from '../../src/persistence/save.js';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{for(const [width,height] of [[1536,688],[915,412],[360,800]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);await enterRun(page,{startBlind:false});
 const state=createRun('AAAAAAA1',{runId:'blind-ui',money:4n,referenceRng:true,referenceShop:true}),saved=serializeState(state);
 await page.evaluate(s=>localStorage.setItem('card-cascade.current',s),saved);await page.reload();await enterRun(page,{startBlind:false});await page.locator('#blind_selection').waitFor();
 await page.locator('#blind_selection').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{}))));
 assert.equal(await page.locator('.blind-tag').count(),2);assert.equal(await page.locator('#select_boss').isDisabled(),true);assert.match(await page.locator('.blind-boss-description').innerText(),/бубн/i);
 for(const id of ['small','big']){
  const tag=page.locator('#tag_'+id);await tag.click();const tip=page.locator('#blind_tag_tooltip');assert.equal(await tip.isVisible(),true);assert.ok((await tip.innerText()).length>20);
  const box=await tip.boundingBox();assert.ok(box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1);
  assert.equal(await page.locator('#skip_'+id).isDisabled(),true);assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),saved);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#blind_tag_tooltip').count(),0);
 }
 await page.locator('#tag_small').click();await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.locator('#blind_tag_tooltip').count(),0);assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),saved);
 if(width===1536){await page.screenshot({path:'artifacts/blind-selection-state.png'});await page.locator('#tag_small').click();await page.screenshot({path:'artifacts/blind-tag-tooltip.png'});}
 assert.deepEqual(errors,[]);await page.close();console.log('blind selection tags/boss/reload/layout '+width+'x'+height);
}}finally{await browser.close();}
