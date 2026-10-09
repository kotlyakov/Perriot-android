import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {enterRun} from './enter-run.mjs';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState} from '../../src/persistence/save.js';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage();
 await page.addInitScript(()=>{
  const remove=Element.prototype.remove;
  Element.prototype.remove=function(){
   if(this.id==='start_screen')setTimeout(()=>remove.call(this),500);
   else remove.call(this);
  };
 });
 await page.goto(process.env.PREVIEW_URL);
 const run=createRun('ENTRYRACE',{runId:'entry-race',money:4n,referenceRng:true,referenceShop:true});
 const playing=dispatch(run,{type:'START_BLIND',expectedRevision:run.revision}).state;
 await page.evaluate(saved=>localStorage.setItem('card-cascade.current',saved),serializeState(playing));
 await page.reload();
 await enterRun(page);
 assert.equal(await page.locator('#start_screen').count(),0,'entry waits until the menu no longer intercepts the field');
 assert.equal(await page.locator('#hand .playing-card').first().isVisible(),true);
 console.log('Entry helper waits for delayed menu removal');
}finally{await browser.close();}
