import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
try{const page=await browser.newPage();await page.goto(process.env.PREVIEW_URL);await page.locator('#hand .playing-card').first().waitFor();
 const result=await page.evaluate(async()=>{const {animateNumber}=await import('/src/ui/number-animation.js');const raf=requestAnimationFrame,queue=[];window.requestAnimationFrame=f=>{queue.push(f);return queue.length;};try{const n=document.createElement('span'),time=performance.now();const finished=animateNumber(n,100n,{animate:true,from:0n,duration:220});queue.shift()(time-100);const first=n.textContent;queue.shift()(performance.now()+1000);await finished;return {first,final:n.textContent,queued:queue.length};}finally{window.requestAnimationFrame=raf;}});
 assert.deepEqual(result,{first:'0',final:'100',queued:0});
 await page.emulateMedia({reducedMotion:'reduce'});const reduced=await page.evaluate(async()=>{const {animateNumber}=await import('/src/ui/number-animation.js');const raf=requestAnimationFrame;let calls=0;window.requestAnimationFrame=()=>{calls++;return 0;};try{const n=document.createElement('span');const done=animateNumber(n,500n,{animate:true,from:0n});const immediate=n.textContent;await done;return {immediate,final:n.textContent,calls};}finally{window.requestAnimationFrame=raf;}});
 assert.deepEqual(reduced,{immediate:'500',final:'500',calls:0});console.log('Controlled early RAF and immediate reduced motion passed');
}finally{await browser.close();}
