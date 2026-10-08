import {enterRun} from './enter-run.mjs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try {
 for(const reduced of [true,false]) {
  const context=await browser.newContext({viewport:{width:1536,height:688},reducedMotion:reduced?'reduce':'no-preference'}),page=await context.newPage();
  await page.goto(process.env.PREVIEW_URL);await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();
  for(const [name,score] of [['small','344'],['large','390035690']]) {
   const result=await page.evaluate(async score=>{
    const {showFlame}=await import('/src/ui/flame.js');showFlame(BigInt(score),300n);await new Promise(r=>setTimeout(r,80));
    const canvas=document.getElementById('score_flame'),pixels=canvas.getContext('2d').getImageData(0,0,274,68).data,beds=[];
    for(const [id,left,right,rgb] of [['chips',10,105,[3,159,234]],['mult',154,250,[242,75,61]]]) {
     let opaque=0,exact=0;const mixed=[];
     for(let x=left;x<right;x++){const i=(62*274+x)*4,value=[...pixels.slice(i,i+4)];if(value[3]<250)continue;opaque++;const difference=Math.max(...rgb.map((n,i)=>Math.abs(n-value[i])));if(!difference)exact++;if(difference>2)mixed.push({x,value,difference});}
     beds.push({id,css:getComputedStyle(document.getElementById(id)).backgroundColor,opaque,exact,mixed});
    }
    let gap=0;for(let y=0;y<68;y++)for(let x=115;x<147;x++)gap+=pixels[(y*274+x)*4+3];
    return {beds,gap,height:Number(canvas.dataset.height)};
   },score);
   assert.equal(result.beds[0].css,'rgb(3, 159, 234)');assert.equal(result.beds[1].css,'rgb(242, 75, 61)');
   for(const bed of result.beds){assert.ok(bed.opaque>0,'No opaque root pixels to verify');assert.deepEqual(bed.mixed,[],`${name}/${reduced}/${bed.id}: root differs from box`);}
   assert.equal(result.gap,0);assert.ok(result.height>0&&result.height<=62);console.log(JSON.stringify({name,reduced,...result}));
  }
  await context.close();
 }
 console.log('Flame 0.4.3 root checks passed');
} finally {await browser.close();}
