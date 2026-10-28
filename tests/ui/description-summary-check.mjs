import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
await mkdir('artifacts',{recursive:true});
try{
 for(const [width,height] of [[1536,688],[915,412],[568,320]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});await page.goto(process.env.PREVIEW_URL);await enterRun(page);
  const result=await page.evaluate(async()=>{
   const {appendTooltipContents}=await import('/src/ui/tooltip-text.js');
   const {createEndView}=await import('/src/ui/menu-windows.js');
   const {createRun,dispatch}=await import('/src/core/run.js');
   const {serializeState,deserializeState}=await import('/src/persistence/save.js');
   const {createProfile,updateProfile}=await import('/src/core/profile.js');
   const tip=document.createElement('aside');tip.className='shop-tooltip';document.getElementById('stage').append(tip);
   Object.assign(tip.style,{position:'absolute',left:'500px',top:'50px',width:'500px'});
   appendTooltipContents(tip,'Описание',['Червы, бубны, пики и трефы дают +30 очков и +4 к множителю. Засчитываемые 4 и 10; ×1,5 к множителю.']);
   const suits=[...tip.querySelectorAll('.tooltip-suit')].map(n=>({suit:n.className,svg:!!n.querySelector('svg path'),width:n.getBoundingClientRect().width,label:n.getAttribute('aria-label')}));
   const colours=[...tip.querySelectorAll('.tooltip-effect')].map(n=>({text:n.textContent,color:getComputedStyle(n).color}));
   let state=createRun('summary-ui',{runId:'summary-ui',money:4n}),profile=createProfile();profile=updateProfile(profile,null,state);
   const step=(type,cardIds)=>{const result=dispatch(state,{type,expectedRevision:state.revision,...(cardIds?{cardIds}:{})});if(result.error)throw Error(result.error.message);profile=updateProfile(profile,state,result.state,result.events);state=result.state;};
   step('START_BLIND');step('DISCARD',state.hand.slice(0,2));state=deserializeState(serializeState(state));state.round.handsRemaining=1;state.round.target=1000000n;step('PLAY_HAND',state.hand.slice(0,3));state=deserializeState(serializeState(state));
   const end=createEndView(state,{newCollection:profile.runs[state.runId].discoveries});const rows=[...end.querySelectorAll('.end-score')].map(n=>n.textContent);tip.remove();const dialog=document.querySelector('dialog');dialog.className='menu-dialog';dialog.dataset.window='end';document.getElementById('dialog-title').textContent='Партия окончена';document.getElementById('dialog-body').replaceChildren(end);document.getElementById('dialog-actions').replaceChildren();dialog.showModal();
   return {suits,colours,rows,phase:state.phase};
  });
  assert.equal(result.suits.length,4);assert.ok(result.suits.every(s=>s.svg&&s.width>0&&s.label));
  assert.deepEqual(result.colours.map(c=>c.text),['+30','+4','×1,5']);assert.notEqual(result.colours[0].color,result.colours[1].color);
  assert.equal(result.phase,'game_over');assert.ok(result.rows.includes('Сыграно карт3'));assert.ok(result.rows.includes('Сброшено карт2'));assert.ok(result.rows.every(r=>!r.includes('—')));
  await page.screenshot({path:`artifacts/description-summary-${width}.png`});console.log(JSON.stringify({width,passed:true,suits:4,summaryRows:result.rows.length}));await page.close();
 }
}finally{await browser.close();}
