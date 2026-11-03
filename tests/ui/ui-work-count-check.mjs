import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const baselineRef=process.env.UI_BASELINE_REF;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage();
 await page.route('**/web/performance-fixture.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><body><div id="calculation_panel"></div>'}));
 if(baselineRef)for(const name of ['card-materials','flame'])await page.route(`**/src/ui/${name}-baseline.js`,route=>route.fulfill({contentType:'text/javascript',body:execFileSync('git',['show',`${baselineRef}:src/ui/${name}.js`],{encoding:'utf8'})}));
 await page.goto(new URL('/web/performance-fixture.html',process.env.PREVIEW_URL).href);
 const work=await page.evaluate(async compare=>{
  const next=()=>new Promise(resolve=>requestAnimationFrame(resolve)),results={},versions=compare?['baseline','current']:['current'];
  for(const version of versions){
   const suffix=version==='baseline'?'-baseline':'';
   const {installCardMaterials}=await import(`/src/ui/card-materials${suffix}.js`);
   const root=document.createElement('section'),card=document.createElement('div');card.className='playing-card';card.dataset.edition='foil';card.style.cssText='width:100px;height:200px';root.append(card);document.body.append(root);
   let reads=0;const rect=card.getBoundingClientRect.bind(card);card.getBoundingClientRect=()=>{reads++;return rect();};
   const stop=installCardMaterials(root);await next();const start=performance.now();
   for(let i=0;i<500;i++)card.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:i%100,clientY:i%200}));
   const dispatchMs=performance.now()-start;await next();results[version]={rectReads:reads,dispatchMs:Number(dispatchMs.toFixed(2)),x:card.style.getPropertyValue('--material-x')};stop();root.remove();
  }
  for(const version of versions){
   const suffix=version==='baseline'?'-baseline':'';
   const {showFlame}=await import(`/src/ui/flame${suffix}.js`);
   showFlame(600n,300n);await next();
   const canvas=document.querySelector('#score_flame'),ctx=canvas.getContext('2d'),clear=ctx.clearRect.bind(ctx);let draws=0;ctx.clearRect=(...args)=>{draws++;clear(...args);};
   Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
   for(let i=0;i<6;i++)await next();results[version].hiddenFlameDraws=draws;
   showFlame(0n,300n);await next();canvas.remove();delete document.hidden;
  }
  return results;
 },!!baselineRef);
 assert.equal(work.current.rectReads,1);assert.equal(work.current.hiddenFlameDraws,0);
 if(baselineRef){assert.equal(work.baseline.rectReads,500);assert.equal(work.current.x,work.baseline.x);assert.ok(work.baseline.hiddenFlameDraws>=5);}
 console.log(JSON.stringify({baselineRef:baselineRef??null,measurement:'Chromium operation counts; dispatchMs is one sample, no Android FPS claim',...work}));
}finally{await browser.close();}
