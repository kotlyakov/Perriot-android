import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {enterRun} from './enter-run.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try {
 for(const [width,height,touch] of [[1536,688,false],[915,412,true]]) {
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('crash',()=>errors.push('renderer crashed'));
  await page.goto(process.env.PREVIEW_URL);
  await enterRun(page);
  await page.locator('#hand .playing-card').first().waitFor();
  await page.evaluate(()=>{
   window.__perfQA={longTasks:[],samples:[]};
   if('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('longtask')){
    new PerformanceObserver(list=>{for(const e of list.getEntries())window.__perfQA.longTasks.push(e.duration);}).observe({entryTypes:['longtask']});
   }
  });
  const durations=[];
  for(let i=0;i<100;i++){
   const card=page.locator('#hand .playing-card').nth(i%5);
   const t=Date.now();
   if(touch)await card.tap({timeout:5000});else await card.click({timeout:5000});
   durations.push(Date.now()-t);
   if(i%20===19){
    const sample=await page.evaluate(()=>({
     nodes:document.querySelectorAll('*').length,
     heap:performance.memory?.usedJSHeapSize??null,
     selected:document.querySelectorAll('#hand .selected').length,
     invalidRects:[...document.querySelectorAll('#hand .playing-card')].filter(el=>{
      const r=el.getBoundingClientRect();
      return ![r.x,r.y,r.width,r.height].every(Number.isFinite)||r.width<=0||r.height<=0;
     }).length
    }));
    assert.equal(sample.invalidRects,0,'Invalid card rectangle');
    assert.ok(sample.selected<=5,'More than five cards selected');
    await page.evaluate(v=>window.__perfQA.samples.push(v),sample);
   }
  }
  const metrics=await page.evaluate(()=>window.__perfQA);
  assert.deepEqual(errors,[],'JavaScript errors or renderer crash');
  assert.equal(await page.locator('#hand .playing-card').count(),8,'Hand cards lost after rapid taps');
  const sorted=[...durations].sort((a,b)=>a-b);
  console.log(JSON.stringify({scenario:'rapid-selection-baseline',viewport:[width,height],touch,actions:durations.length,p50ms:sorted[Math.floor(sorted.length*.5)],p95ms:sorted[Math.floor(sorted.length*.95)],maxMs:sorted.at(-1),longTasks:metrics.longTasks.length,maxLongTaskMs:Math.max(0,...metrics.longTasks),samples:metrics.samples,errors}));
  await context.close();
 }
}finally{await browser.close();}
