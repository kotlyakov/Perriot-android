import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
const joker=(id,entityId='j_joker')=>({id,entityId,originalKey:entityId,set:'Joker',edition:'base',cost:4n,sellCost:2n});
function fixture(){const s=createRun('FEEDBACK',{runId:'feedback',money:40n,referenceRng:true,referenceShop:true});s.jokers=[joker('first','j_droll'),joker('second','j_scholar')];s.consumables=[{id:'tarot',entityId:'c_fool',originalKey:'c_fool',set:'Tarot',cost:3n,sellCost:1n},{id:'planet',entityId:'c_pluto',originalKey:'c_pluto',set:'Planet',cost:3n,sellCost:1n}];return s;}
async function install(page,s){await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(s));await page.reload();await enterRun(page);await page.locator('#shop_owned .shop-card').first().waitFor();}
const saved=async page=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
async function drag(page,id,x,y,{cancel=false,touch=false}={}){
 const card=page.locator(`[data-offer-id=${id}] .shop-card`),b=await card.boundingBox(),stage=await page.locator('#stage').boundingBox(),scale=stage.width/1536;
 const from={x:b.x+b.width/2,y:b.y+b.height/2},to={x:stage.x+x*scale,y:stage.y+y*scale};
 if(touch){const session=await page.context().newCDPSession(page);await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[to]});await page.locator('#shop_sell_zone').waitFor();await session.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await session.detach();}
 else{await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:6});await page.locator('#shop_sell_zone').waitFor();if(cancel)await card.press('Escape');await page.mouse.up();}
 await page.waitForFunction(()=>!document.querySelector('.is-dragging,#shop_sell_zone'));
}
try{
 await mkdir('artifacts',{recursive:true});
 for(const [width,height,touch] of [[1536,688,false],[915,412,true]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch});const errors=[];page.on('pageerror',e=>errors.push(e.message));await install(page,fixture());
  await page.locator('[data-offer-id=first] .shop-card').click();assert.match(await page.locator('#shop_tooltip').innerText(),/сыгранная рука содержит флеш/);
  assert.equal(await page.locator('#shop_owned .shop-buy').count(),0);
  assert.deepEqual(await page.locator('#shop_tooltip .tooltip-mult').evaluate(el=>({text:el.textContent,weight:getComputedStyle(el).fontWeight,color:getComputedStyle(el).color,display:getComputedStyle(el).display})),{text:'+10',weight:'800',color:'rgb(255, 85, 73)',display:'inline'});
  await page.locator('[data-offer-id=second] .shop-card').click();assert.deepEqual(await page.locator('#shop_tooltip .tooltip-effect').allTextContents(),['+20','+4']);assert.equal(await page.locator('#shop_tooltip .tooltip-chips').evaluate(el=>getComputedStyle(el).color),'rgb(9, 174, 255)');
  if(!touch)await page.screenshot({path:'artifacts/feedback-tooltips.png'});
  const before=await saved(page);await drag(page,'first',900,95,{touch});assert.deepEqual((await saved(page)).jokers.map(j=>j.id),['second','first']);assert.equal((await saved(page)).money,before.money);
  await drag(page,'planet',1100,95,{touch});assert.deepEqual((await saved(page)).consumables.map(c=>c.id),['planet','tarot']);
  const text=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await drag(page,'first',1450,300,{touch,cancel:true});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),text);
  await drag(page,'first',1450,300,{touch});assert.deepEqual((await saved(page)).jokers.map(j=>j.id),['second']);assert.equal((await saved(page)).money,before.money+2n);
  await drag(page,'tarot',1450,300,{touch});assert.deepEqual((await saved(page)).consumables.map(c=>c.id),['planet']);assert.equal((await saved(page)).money,before.money+3n);
  await page.reload();await enterRun(page);assert.equal(await page.locator('[data-kind=consumable]').count(),1);
  assert.deepEqual(errors,[]);await page.close();console.log('tooltips, owned reorder/sale/touch/cancel/reload '+width);
 }
 const page=await browser.newPage();let s=fixture();s.jokers=[joker('pop')];s=dispatch(s,{type:'START_BLIND',expectedRevision:s.revision}).state;await install(page,s);
 const pops=await page.evaluate(async()=>{const {animateScore}=await import('/src/ui/score-animation.js');const results=[],original=Element.prototype.animate;Element.prototype.animate=function(frames,options){if(this.classList.contains('score-pop'))results.push({top:parseFloat(this.style.top),last:frames.at(-1).translate});return original.call(this,frames,options);};try{await animateScore([{type:'score_step',sourceId:'pop',operation:'add_mult',before:{chips:5n,mult:1n},after:{chips:5n,mult:5n}},{type:'score_step',sourceId:'pop',operation:'multiply_mult',before:{chips:5n,mult:5n},after:{chips:5n,mult:10n}}]);}finally{Element.prototype.animate=original;}return results;});
 assert.equal(pops.length,2);assert.ok(pops.every(p=>p.top>166&&p.last==='0 30px'));await page.close();console.log('Joker addition and multiplication move down');
 const roll=await browser.newPage();s=fixture();s.phase='round_won';s.round.score=s.round.target;s=dispatch(s,{type:'CASH_OUT',expectedRevision:s.revision}).state;await install(roll,s);await roll.locator('#shop_reroll').waitFor();await roll.evaluate(()=>{window.rollFrames=[];const original=Element.prototype.animate;Element.prototype.animate=function(frames,options){if(this.matches('[data-kind=main]'))window.rollFrames.push(frames);return original.call(this,frames,options);};});const pre=await saved(roll);await roll.locator('#shop_reroll').click();await roll.waitForFunction(()=>!document.querySelector('#shop_reroll').disabled);const frames=await roll.evaluate(()=>rollFrames);assert.ok(frames.some(f=>f[0].scale===1&&f.at(-1).scale===0),'Old goods collapse');assert.ok(frames.some(f=>f[0].scale===0&&f.at(-1).scale===1),'New goods emerge');assert.equal((await saved(roll)).money,pre.money-5n);await roll.close();console.log('reroll collapses and expands at own centers');

 const payout=await browser.newPage();s=fixture();s.money=4n;s.phase='round_won';s.round.score=s.round.target;s.round.handsRemaining=1;await install(payout,s);assert.equal(await payout.locator('#cashout').innerText(),'Обналичить: $4');await drag(payout,'first',1450,300);assert.equal(await payout.locator('#cashout').innerText(),'Обналичить: $5');assert.equal(await payout.locator('.payout-interest .gold').innerText(),'$1');await payout.locator('#cashout').click();await payout.locator('#shop_screen').waitFor();assert.equal((await saved(payout)).money,11n);await payout.close();console.log('sale refreshes payout interest and pays once');
 const skip=await browser.newPage();s=fixture();s.apkBlinds.tags.small='tag_skip';s.apkBlinds.tags.big='tag_economy';await install(skip,s);await skip.locator('#skip_small').click();await skip.locator('#select_big').waitFor();assert.equal((await saved(skip)).money,45n);assert.equal((await saved(skip)).runStats.skips,1);await skip.reload();await enterRun(skip);assert.equal(await skip.locator('#skip_small').count(),0);assert.equal((await saved(skip)).money,45n);await skip.close();console.log('skip pays once and persists');
}finally{await browser.close();}
