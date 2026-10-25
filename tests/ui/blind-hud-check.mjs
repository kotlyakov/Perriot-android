import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{for(const [width,height] of [[1536,688],[915,412],[568,320]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});page.on('console',m=>{if(m.text().startsWith('TOKEN_METRICS'))console.log(m.text());});await page.goto(process.env.PREVIEW_URL);await enterRun(page);await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('#blind_condition').count(),1,'Persistent condition belongs to HUD');
 assert.ok(await page.locator('#blind_title').evaluate(n=>parseFloat(getComputedStyle(n).fontSize))>=24,'First visible HUD title is fitted after phase visibility changes');
 const results=await page.evaluate(async()=>{
  const {createRun}=await import('/src/core/run.js'),{renderField}=await import('/src/ui/field.js'),{APK_BOSSES}=await import('/src/content/apk-blinds.js');
  const state=createRun('13031990',{runId:'hud-review',money:4n,referenceRng:true,referenceShop:true});state.phase='playing';state.round.blindId='boss';state.bossState={};const rows=[];
  for(const boss of APK_BOSSES){state.apkBlinds.bossId=boss.id;for(const stake of Array.from({length:8},(_,i)=>i+1)){state.stake=stake;state.round.target=1600n;renderField(state,new Set(),false,()=>{},()=>{});
   const panel=document.getElementById('blind_panel').getBoundingClientRect(),title=document.getElementById('blind_title'),condition=document.getElementById('blind_condition'),token=document.getElementById('blind_token').getBoundingClientRect(),target=document.getElementById('blind_target'),label=document.getElementById('blind_stake_label');
   const tokenText=document.querySelector('#blind_token span'),tokenInk=tokenText.getBoundingClientRect();
   if(tokenInk.left<token.left||tokenInk.right>token.right||tokenInk.top<token.top||tokenInk.bottom>token.bottom||tokenText.scrollWidth>tokenText.clientWidth+1||tokenText.scrollHeight>tokenText.clientHeight+1)console.log('TOKEN_METRICS',boss.id,JSON.stringify({token:token.toJSON(),ink:tokenInk.toJSON(),cw:tokenText.clientWidth,sw:tokenText.scrollWidth,ch:tokenText.clientHeight,sh:tokenText.scrollHeight,font:getComputedStyle(tokenText).fontSize}));
   rows.push({id:boss.id,stake,tokenFit:tokenInk.left>=token.left&&tokenInk.right<=token.right&&tokenInk.top>=token.top&&tokenInk.bottom<=token.bottom&&tokenText.scrollWidth<=tokenText.clientWidth+1&&tokenText.scrollHeight<=tokenText.clientHeight+1,condition:condition.textContent===boss.description,fit:[condition,title,target,label].every(n=>{const r=n.getBoundingClientRect();return r.left>=panel.left-1&&r.right<=panel.right+1&&r.top>=panel.top-1&&r.bottom<=panel.bottom+1&&n.scrollWidth<=n.clientWidth+1&&n.scrollHeight<=n.clientHeight+1;}),noOverlap:condition.getBoundingClientRect().bottom<=token.top+1&&condition.getBoundingClientRect().bottom<=target.getBoundingClientRect().top+1});
  }}
  state.bossState.disabled=true;renderField(state,new Set(),false,()=>{},()=>{});if(!document.getElementById('blind_condition').textContent.includes('отключён'))throw Error('Disabled boss looks active');
  state.round.blindId='small';renderField(state,new Set(),false,()=>{},()=>{});if(!document.getElementById('blind_condition').hidden)throw Error('Small blind has boss condition');
  state.round.blindId='boss';state.apkBlinds.bossId='bl_hook';state.bossState.disabled=false;state.stake=4;state.round.target=10n**120n;renderField(state,new Set(),false,()=>{},()=>{});
  const amount=document.getElementById('target_value').parentElement;if(amount.scrollWidth>amount.clientWidth+1)throw Error('Large target overflows');
  state.round.target=1600n;renderField(state,new Set(),false,()=>{},()=>{});
  document.getElementById('blind_title').hidden=true;renderField(state,new Set(),false,()=>{},()=>{});document.getElementById('blind_title').hidden=false;
  return rows;
 });
 await page.evaluate(()=>new Promise(requestAnimationFrame));
 assert.ok(await page.locator('#blind_title').evaluate(n=>parseFloat(getComputedStyle(n).fontSize))>=24,'Hidden-to-visible HUD resets title fit without shrinking it');
 assert.equal(results.length,224);assert.deepEqual(results.filter(r=>!r.fit||!r.noOverlap||!r.condition||!r.tokenFit),[]);
 await page.screenshot({path:`artifacts/blind-hud-${width}.png`});await page.close();console.log(JSON.stringify({width,height,bossStakeCases:results.length,pass:true}));
}}finally{await browser.close();}
