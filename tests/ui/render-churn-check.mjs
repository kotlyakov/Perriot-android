import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {enterRun} from './enter-run.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 for(const touch of [false,true]){
  const ctx=await browser.newContext({viewport:{width:915,height:412},isMobile:touch,hasTouch:touch});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.PREVIEW_URL);await enterRun(page);
  await page.locator('#hand .playing-card').first().waitFor();
  await page.evaluate(()=>{
   window.__renderChurn={handAdded:0,handRemoved:0,shopAdded:0,shopRemoved:0};
   const watch=(id,prefix)=>{
    const target=document.getElementById(id);
    if(!target)return;
    new MutationObserver(records=>{for(const record of records){window.__renderChurn[prefix+'Added']+=record.addedNodes.length;window.__renderChurn[prefix+'Removed']+=record.removedNodes.length;}}).observe(target,{childList:true});
   };
   watch('hand','hand');watch('shop','shop');
  });
  const original=await page.locator('#hand .playing-card').evaluateAll(ns=>ns.map(n=>n.dataset.cardId));
  for(let i=0;i<30;i++){
   const card=page.locator('#hand .playing-card').nth(i%4);
   if(touch)await card.tap();else await card.click();
  }
  const result=await page.evaluate(()=>window.__renderChurn);
  const after=await page.locator('#hand .playing-card').evaluateAll(ns=>ns.map(n=>n.dataset.cardId));
  assert.deepEqual(after,original,'Selection changed hand order');
  assert.deepEqual(errors,[],'Unhandled JS error');
  assert.equal(await page.locator('#hand .playing-card').count(),original.length);
  console.log(JSON.stringify({scenario:'selection-render-churn',touch,actions:30,...result}));
  await ctx.close();
 }
}finally{await browser.close();}
