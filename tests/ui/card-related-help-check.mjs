import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 await mkdir('artifacts',{recursive:true});
 for(const [width,height] of [[1536,688],[915,412],[568,320]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  await page.goto(process.env.PREVIEW_URL);await enterRun(page);await page.evaluate(()=>document.fonts.ready);
  const checks=await page.evaluate(async()=>{
   const {appendCardDescription}=await import('/src/ui/card-description.js');
   const {showCardTooltip,dismissCardTooltip}=await import('/src/ui/card-tooltip.js');
   const stage=document.getElementById('stage'),anchor=document.createElement('button');anchor.dataset.cardId='related-check';anchor.style.cssText='position:absolute;width:80px;height:120px';stage.append(anchor);const checks=[];
   for(const entityId of ['c_chariot','c_mercury','c_aura','c_hex','j_steel_joker','j_trousers','c_trance','j_drivers_license'])for(const [left,top] of [[0,0],[1450,0],[0,550],[1450,550]]){
    dismissCardTooltip();anchor.style.left=left+'px';anchor.style.top=top+'px';const tip=document.createElement('aside');tip.className='shop-tooltip';
    appendCardDescription(tip,{entityId,edition:entityId==='j_steel_joker'?'foil':'base'});showCardTooltip(tip,anchor);
    const box=tip.getBoundingClientRect(),s=stage.getBoundingClientRect();checks.push({entityId,inside:box.left>=Math.max(0,s.left)-1&&box.top>=Math.max(0,s.top)-1&&box.right<=Math.min(innerWidth,s.right)+1&&box.bottom<=Math.min(innerHeight,s.bottom)+1,noHorizontalOverflow:tip.scrollWidth<=tip.clientWidth+1,related:tip.querySelectorAll('.tooltip-related-help').length});
    if(entityId==='j_steel_joker'){
     if(tip.querySelectorAll('.tooltip-modifier:not(.tooltip-related-help)').length!==1)throw Error('Actual foil merged with related steel');
     if(!tip.querySelector('.tooltip-related-help').textContent.includes('Связано: Стальная карта'))throw Error('Missing related subject label');
    }
   }
   return checks;
  });
  assert.equal(checks.length,32);assert.deepEqual(checks.filter(n=>!n.inside||!n.noHorizontalOverflow||!n.related),[]);
  await page.screenshot({path:`artifacts/card-related-help-${width}.png`});await page.close();console.log(`Related help ${width}×${height}: 32 placements PASS`);
 }
}finally{await browser.close();}
