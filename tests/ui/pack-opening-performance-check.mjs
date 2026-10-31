import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
import {dragShopAction} from './shop-actions.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const source=path=>process.env.OPEN_BASELINE?execFileSync('git',['show',`${process.env.OPEN_BASELINE}:${path}`],{encoding:'utf8'}):readFile(path,'utf8');
function fixture(){
 for(let i=0;i<80;i++){
  let state=createRun('OPENPERF'+i,{runId:'open-perf',money:1000n,referenceRng:true,referenceShop:true});
  for(const key of Object.keys(state.handLevels))state.handLevels[key]=5000;
  const act=(type,fields={})=>{const r=dispatch(state,{type,expectedRevision:state.revision,...fields});assert.ifError(r.error);state=r.state;};
  act('START_BLIND');for(let n=0;n<200;n++)act('SET_SORT',{mode:n%2?'rank':'suit'});
  act('PLAY_HAND',{cardIds:state.hand.slice(0,1)});act('CASH_OUT');
  const offer=state.shop.boosters.find(p=>p.entityId.startsWith('p_arcana_'));
  if(offer)return {state,offer};
 }
 throw Error('Arcana shop fixture unavailable');
}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const {state,offer}=fixture();
 for(const reducedMotion of ['no-preference','reduce']){
  const page=await browser.newPage({viewport:{width:915,height:412},hasTouch:true,reducedMotion});page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let app=await source('src/ui/app.js');
  app=app.replace('const result=dispatch(state,action);','const dispatchAt=performance.now();const result=dispatch(state,action);window.openPerf={type,dispatch:performance.now()-dispatchAt,renders:[]};').replace('try{repository.save(result.state,result.events);}catch','try{const saveAt=performance.now();repository.save(result.state,result.events);window.openPerf.save=performance.now()-saveAt;}catch');
  await page.route('**/src/ui/app.js',r=>r.fulfill({contentType:'text/javascript',body:app}));
  for(const [module,name]of [['field','renderField'],['shop-screen','renderShop']]){
   const raw=await source(`src/ui/${module}.js`);
   const body=raw.replace(`export function ${name}(`,`function ${name}Impl(`)+`\nexport function ${name}(...args){const t=performance.now();const result=${name}Impl(...args);window.openPerf?.renders.push({name:'${name}',busy:args[${name==='renderField'?2:1}],ms:performance.now()-t});return result;}`;
   await page.route(`**/src/ui/${module}.js`,r=>r.fulfill({contentType:'text/javascript',body}));
  }
  if(process.env.OPEN_BASELINE)for(const module of ['play-animation','card-motion'])await page.route(`**/src/ui/${module}.js`,async r=>r.fulfill({contentType:'text/javascript',body:await source(`src/ui/${module}.js`)}));
  await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(state));await page.reload();await enterRun(page,{startBlind:false});
  await page.locator('#shop_reroll:enabled').waitFor();await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  if(reducedMotion==='reduce'){
   const durable=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));
   await page.evaluate(()=>{window.openSetItem=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('Opening persistence failure');};});
   await dragShopAction(page,offer.id,'buy',true);await page.locator('dialog[open]').waitFor();
   assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),durable);
   assert.equal(await page.locator('#pack_screen,.motion-copy').count(),0,'Failed save cannot reveal a successful opening');
   assert.equal(await page.locator(`#shop_screen [data-offer-id="${offer.id}"]`).count(),1);
   await page.evaluate(()=>{Storage.prototype.setItem=window.openSetItem;});await page.locator('#dialog-actions button').first().click();await page.locator('dialog').waitFor({state:'hidden'});
  }
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
  if(process.env.OPEN_TRACE)await cdp.send('Tracing.start',{categories:'devtools.timeline',transferMode:'ReturnAsStream'});
  await page.evaluate(()=>{
   window.openRemoved={hand:0,pack:0};window.openRevealed=[];window.openLayoutFlights=0;window.openRevealEnd=0;window.openDealStart=null;
   const animate=Element.prototype.animate;Element.prototype.animate=function(frames,options){if(this.matches('#pack_screen .shop-card')){window.openRevealed.push(this);window.openRevealEnd=Math.max(window.openRevealEnd,performance.now()+options.duration+(options.delay??0));}if(this.matches('#hand .playing-card')){window.openDealStart??=performance.now();if(frames.some(f=>'left'in f||'top'in f))window.openLayoutFlights++;}return animate.call(this,frames,options);};
   window.openObserver=new MutationObserver(records=>{for(const r of records)for(const n of r.removedNodes)if(n.nodeType===1){window.openRemoved.hand+=(n.matches('.playing-card:not(.motion-copy)')?1:0)+n.querySelectorAll('.playing-card:not(.motion-copy)').length;window.openRemoved.pack+=(n.matches('.shop-choice[data-kind=pack]')?1:0)+n.querySelectorAll('.shop-choice[data-kind=pack]').length;}});
   window.openObserver.observe(document.getElementById('stage'),{subtree:true,childList:true});
  });
  const started=Date.now();await dragShopAction(page,offer.id,'buy',true);await page.locator('#pack_skip:enabled').waitFor();
  const {profile}=await cdp.send('Profiler.stop');const nodes=new Map(profile.nodes.map(n=>[n.id,n])),samples=new Map();
  for(let i=0;i<profile.samples.length;i++){const n=nodes.get(profile.samples[i]),label=n.callFrame.functionName+' '+n.callFrame.url.split('/').slice(-2).join('/');samples.set(label,(samples.get(label)??0)+profile.timeDeltas[i]/1000);}
  let timeline;
  if(process.env.OPEN_TRACE){const completed=new Promise(r=>cdp.once('Tracing.tracingComplete',r));await cdp.send('Tracing.end');const {stream}=await completed;let data='',end=false;while(!end){const chunk=await cdp.send('IO.read',{handle:stream});data+=chunk.data;end=chunk.eof;}await cdp.send('IO.close',{handle:stream});const events=JSON.parse(data).traceEvents;timeline=Object.fromEntries(['Layout','Paint','UpdateLayoutTree'].map(name=>{const rows=events.filter(e=>e.name===name&&e.ph==='X');return [name,{count:rows.length,ms:rows.reduce((n,e)=>n+e.dur/1000,0)}];}));}
  const report=await page.evaluate(()=>{window.openObserver.disconnect();return {...window.openPerf,removed:window.openRemoved,revealedPreserved:window.openRevealed.every(n=>n.isConnected),layoutFlights:window.openLayoutFlights,overlapping:window.openDealStart!==null&&window.openDealStart<window.openRevealEnd,handReady:[...document.querySelectorAll('#hand .playing-card')].every(n=>!n.disabled),copies:document.querySelectorAll('.motion-copy').length,hand:document.querySelectorAll('#hand .playing-card').length};});
  const saved=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current'))),expected=dispatch(state,{type:'OPEN_BOOSTER',expectedRevision:state.revision,offerId:offer.id});
  assert.deepEqual(saved,expected.state);assert.equal(report.hand,saved.hand.length);assert.equal(report.handReady,true);assert.equal(report.copies,0);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({reducedMotion,cpu4:true,elapsed:Date.now()-started,report,timeline,top:[...samples].sort((a,b)=>b[1]-a[1]).slice(0,15)}));
  await mkdir('artifacts',{recursive:true});await writeFile(`artifacts/pack-opening-${reducedMotion}.json`,JSON.stringify(profile));
  if(!process.env.OPEN_DIAGNOSTIC){assert.equal(report.revealedPreserved,true,'Revealed pack cards survive unlocking');assert.equal(report.removed.pack,0,'Opening must not recreate its pack cards');assert.equal(report.removed.hand,0,'Opening must not recreate its drawn target hand');assert.equal(report.layoutFlights,0,'Card flights must not relayout the hand every frame');if(reducedMotion==='no-preference')assert.equal(report.overlapping,true,'Deal starts during reveal');}
  await page.close();
 }
}finally{await browser.close();}
