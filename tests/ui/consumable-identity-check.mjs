import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:915,height:412}});
 await page.goto(process.env.PREVIEW_URL);
 await page.evaluate(async()=>{
  const {createRun}=await import('/src/core/run.js'),{renderShop}=await import('/src/ui/shop-screen.js');
  const s=createRun('identity-fixture',{runId:'identity-fixture',money:4n});s.phase='playing';s.consumableSlots=3;s.consumables=['c_fool','c_mercury','c_soul'].map((entityId,i)=>({id:'identity-'+i,entityId,set:['Tarot','Planet','Spectral'][i],edition:'base',sellCost:1n}));renderShop(s,false,{});
 });
 await page.waitForFunction(()=>document.querySelector('#shop_owned [data-card-set=Spectral] .spectral-shimmer'));
 const colors=await page.locator('#shop_owned .shop-card').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).backgroundColor.match(/[\d.]+/g).map(Number)));
 assert.ok(colors[0][0]>colors[0][1]&&colors[0][1]>colors[0][2],'Tarot orange paper');
 assert.ok(colors[1][2]>colors[1][0]&&colors[1][1]>colors[1][0],'Planet sky-blue paper');
 const spectral=page.locator('#shop_owned [data-card-set=Spectral]');const before=await spectral.screenshot();await page.waitForTimeout(240);assert.notDeepEqual(before,await spectral.screenshot(),'Base Spectral card constantly shimmers without needing an edition');
 const shimmer=spectral.locator('.spectral-shimmer');
 assert.equal(await shimmer.getAttribute('aria-hidden'),'true');assert.equal(await shimmer.evaluate(n=>getComputedStyle(n).pointerEvents),'none');
 assert.match(await shimmer.evaluate(n=>getComputedStyle(n).animationName),/spectral-rainbow/);
 assert.ok((await shimmer.evaluate(n=>parseFloat(getComputedStyle(n).animationDuration)))<=1.8,'Approved fast sparkle');
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await shimmer.evaluate(n=>getComputedStyle(n).animationName),'none');assert.ok((await shimmer.evaluate(n=>getComputedStyle(n).backgroundImage)).includes('linear-gradient'),'Rainbow identity retained without movement');
 console.log('Approved orange Tarot, sky-blue Planet and permanent Spectral rainbow PASS');
}finally{await browser.close();}
