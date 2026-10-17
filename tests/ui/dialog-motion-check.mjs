import {enterRun} from './enter-run.mjs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 for(const [width,height] of [[1536,709],[915,412],[568,320],[360,800]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();
  await page.goto(process.env.PREVIEW_URL);await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();
  for(const selector of ['#deck','#options','#run_info']){
   await page.locator(selector).click();
   const motion=await page.locator('#dialog').evaluate(d=>{const a=d.getAnimations()[0];if(!a)return null;a.pause();a.currentTime=0;const first=d.getBoundingClientRect().top;a.currentTime=a.effect.getTiming().duration;const last=d.getBoundingClientRect().top;return {first,last,duration:a.effect.getTiming().duration};});
   assert.ok(motion,'Dialog has no entry animation');assert.ok(motion.first>=height,'Dialog must start below viewport');assert.ok(motion.last>=0&&motion.last<height,'Dialog must finish in viewport');
   await page.locator('#dialog').evaluate(d=>d.getAnimations().forEach(a=>a.finish()));
   await page.keyboard.press('Escape');assert.equal(await page.locator('#dialog').evaluate(d=>d.getAnimations().length),0);
  }
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#deck').click();assert.equal(await page.locator('#dialog').evaluate(d=>d.getAnimations().length),0);await page.keyboard.press('Escape');
  console.log('Dialog bottom entry/cancel/reduced motion '+width+'x'+height);await context.close();
 }
}finally{await browser.close();}
