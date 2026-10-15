import {enterRun} from './enter-run.mjs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 for(const [width,height] of [[1536,688],[915,412],[568,320],[360,800],[2400,1080]]){
 const p=await b.newPage({viewport:{width,height}});await p.goto(process.env.PREVIEW_URL);await enterRun(p);await p.evaluate(()=>document.fonts.ready);await p.locator('#hand .playing-card').first().waitFor();
 // START_BLIND renders the hand before dealing finishes; deck clicks are ignored while busy.
 await p.waitForFunction(()=>!document.getElementById('sort_rank').disabled);
 const family=async()=>p.locator('body,button,strong,small,.corner,#hand_name,#hand_level,#notice').evaluateAll(ns=>ns.filter(n=>n.getBoundingClientRect().width>0).map(n=>getComputedStyle(n).fontFamily));
 assert.ok((await family()).every(f=>f.includes('Rubik')&&!f.includes('Pixel')&&!f.includes('Numbers')),'Mixed/pixel font remains');
 assert.equal(await p.evaluate(()=>document.fonts.check('700 24px Rubik')),true);
 const fit=async selectors=>p.evaluate(selectors=>selectors.map(s=>{const n=document.querySelector(s),b=n.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(n);const r=range.getBoundingClientRect();return {s,fit:r.left>=b.left-1&&r.right<=b.right+1&&r.top>=b.top-1&&r.bottom<=b.bottom+1};}),selectors);
 assert.equal(await p.locator('#run_info').textContent(),'Партия');assert.equal(await p.locator('#options').textContent(),'Настройки');
 assert.ok(await p.locator('#run_info').evaluate(n=>parseFloat(getComputedStyle(n).fontSize)>=22),'Party label too small');assert.ok(await p.locator('#options').evaluate(n=>parseFloat(getComputedStyle(n).fontSize)>=20),'Settings label too small');
 const a=await p.locator('#run_info').boundingBox(),o=await p.locator('#options').boundingBox();assert.ok(Math.abs(a.x-o.x)<.1&&Math.abs(a.width-o.width)<.1,'Side buttons shifted');
 const numbers=await p.evaluate(async()=>{const {showNumbers}=await import('/src/ui/field.js');const s=document.getElementById('stage').getBoundingClientRect().width/1536;const out=[];for(const v of [1n,304n,3070n,10n**500n]){showNumbers(v,v);for(const [box,id,side] of [['chips','chips_value','right'],['mult','mult_value','left']]){const b=document.getElementById(box).getBoundingClientRect(),n=document.getElementById(id).getBoundingClientRect();out.push({box,edge:Math.abs((side==='right'?b.right-n.right:n.left-b.left)-8*s)<.5,fit:n.left>=b.left&&n.right<=b.right});}}showNumbers(0n,0n);return out;});assert.ok(numbers.every(n=>n.edge&&n.fit),JSON.stringify(numbers));
 const field=await fit(['#blind_title','#sort_label','#sort_rank','#sort_suit','#play_hand','#discard','#options','#run_info']);assert.ok(field.every(r=>r.fit),JSON.stringify(field));
 await p.locator('#deck').click();await p.locator('dialog[open] .deck-view').waitFor();
 await p.locator('#dialog').evaluate(d=>Promise.all(d.getAnimations().map(a=>a.finished)));
 assert.ok((await family()).every(f=>f.includes('Rubik')));const deck=await fit(['.deck-info strong','.deck-info p','.deck-base>strong','.deck-tabs [data-mode=remaining]','.deck-tabs [data-mode=full]','#dialog-actions button']);assert.ok(deck.every(r=>r.fit),JSON.stringify(deck));await p.locator('#dialog-actions button').click();
 await p.locator('#options').click();assert.ok((await family()).every(f=>f.includes('Rubik')));
 await p.locator('#dialog').evaluate(d=>Promise.all(d.getAnimations().map(a=>a.finished)));
 if(width===1536||width===915)await p.screenshot({path:`artifacts/rubik-settings-${width}x${height}.png`});
 await p.keyboard.press('Escape');
 if(width===1536)await p.screenshot({path:'artifacts/rubik-field-preview.png'});
 console.log('Unified Rubik/fit verified '+width+'x'+height);await p.close();
 }
}finally{await b.close();}
