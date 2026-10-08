import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createRun} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
const fixture=()=>{
 const state=createRun('visual',{runId:'visual',money:4n});state.phase='playing';state.revision=1;
 state.hand=['card_clubs_11','card_spades_10','card_spades_8','card_hearts_7','card_clubs_7','card_diamonds_7','card_diamonds_6','card_diamonds_5'];
 state.drawPile=Object.keys(state.cards).filter(id=>!state.hand.includes(id));return state;
};
try {
 const orderFailures=[];
 await mkdir('artifacts',{recursive:true});
 for(const [width,height,dpr,mobile] of [[1536,688,1,false],[915,412,3.5,true]]) {
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.PREVIEW_URL);await page.locator('#hand .playing-card').first().waitFor();
  await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(fixture()));
  await page.reload();await page.locator('#hand .playing-card').first().waitFor();
  const font=await page.evaluate(async()=>{await document.fonts.load('20px "Rubik"','Пьеро Достоинство Сброс');await document.fonts.ready;return {loaded:[...document.fonts].some(f=>f.family==='Rubik'&&f.status==='loaded'),used:getComputedStyle(document.getElementById('sort_rank')).fontFamily};});
  assert.ok(font.loaded&&font.used.includes('Rubik'),'Cyrillic UI font not loaded/applied');
  const artwork=await page.evaluate(async()=>{
   const {cardMarkup}=await import('/src/ui/field.js');const report=[];
   for(const suit of ['clubs','diamonds','hearts','spades'])for(let rank=2;rank<=14;rank++) {
    const card=document.createElement('button');card.className='playing-card';card.style.cssText='left:0;top:0;transform:none';card.innerHTML=cardMarkup({rank,suit});document.body.append(card);
    const box=card.getBoundingClientRect();const bad=[];
    for(const svg of card.querySelectorAll('svg')) {const r=svg.getBoundingClientRect(),b=svg.getBBox(),v=svg.viewBox.baseVal;if(r.left<box.left||r.right>box.right||r.top<box.top||r.bottom>box.bottom)bad.push('svg outside card');if(b.x<v.x-.1||b.y<v.y-.1||b.x+b.width>v.x+v.width+.1||b.y+b.height>v.y+v.height+.1)bad.push('art outside viewBox');}
    report.push({rank,suit,pips:card.querySelectorAll('.pip-art .pip').length,faces:card.querySelectorAll('.face').length,corners:card.querySelectorAll('.corner svg').length,bad});card.remove();
   }return report;
  });
  for(const a of artwork) {assert.deepEqual(a.bad,[],JSON.stringify(a));assert.equal(a.corners,2);assert.equal(a.faces,a.rank>=11&&a.rank<=13?1:0);assert.equal(a.pips,a.rank===14?1:a.rank<=10?a.rank:0);}
  const deckGap=await page.evaluate(()=>{const d=document.getElementById('deck').getBoundingClientRect(),c=document.getElementById('deck_count').getBoundingClientRect(),scale=document.getElementById('stage').getBoundingClientRect().width/1536;return (c.top-d.bottom)/scale-12;});
  assert.ok(deckGap>0,'Deck count overlaps 12px shadow');
  // Select in reverse tap order: visual play must still use saved hand order.
  for(const index of [4,3,2,1,0]) {const card=page.locator('#hand .playing-card').nth(index);mobile?await card.tap():await card.click();}
  const before=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
  const expected=before.hand.slice(0,5);
  await page.evaluate(()=>{document.getElementById('play_hand').click();document.getElementById('play_hand').click();});
  await page.waitForFunction(()=>document.querySelectorAll('.played-card').length===5);
  const during=await page.evaluate(()=>({clones:[...document.querySelectorAll('.played-card')].map(n=>({id:n.dataset.cardId,left:parseFloat(n.style.left),top:parseFloat(n.style.top),animations:n.getAnimations().length})),hand:[...document.querySelectorAll('#hand .playing-card')].map(n=>({disabled:n.disabled,color:getComputedStyle(n).backgroundColor,filter:getComputedStyle(n).filter,opacity:getComputedStyle(n).opacity})),saved:localStorage.getItem('card-cascade.current')}));
  const committed=deserializeState(during.saved);assert.equal(committed.round.handsRemaining,before.round.handsRemaining-1);assert.equal(committed.revision,before.revision+1);
  assert.deepEqual(committed.discardPile.slice(-5),expected);
  const stage=await page.locator('#stage').boundingBox();assert.ok(stage.x>=-.1&&stage.y>=-.1&&stage.x+stage.width<=width+.1&&stage.y+stage.height<=height+.1);
  assert.ok(during.clones.every(n=>n.top===232&&n.animations>0),'Cards did not fly to center');
  assert.equal((during.clones[0].left+during.clones.at(-1).left+115)/2,885);
  assert.ok(during.hand.every(n=>n.disabled&&n.color==='rgb(240, 229, 200)'&&n.filter==='none'&&n.opacity==='1'),'Busy hand became gray');
  const start=await page.locator('.played-card').first().boundingBox();
  await page.waitForTimeout(150);const moving=await page.locator('.played-card').first().boundingBox();assert.ok(Math.abs(start.y-moving.y)>5,'Flight has no visible movement');
  await page.waitForFunction(()=>[...document.querySelectorAll('.played-card')].every(n=>n.getAnimations().length===0));
  if(!mobile)await page.screenshot({path:'artifacts/played-preview.png'});
  const visualOrder=during.clones.map(n=>n.id);
  await page.waitForFunction(()=>!document.querySelector('.played-card')&&!document.querySelector('#hand .playing-card').disabled);
  const after=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));assert.equal(after.revision,before.revision+1);assert.equal(after.round.handsRemaining,before.round.handsRemaining-1);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({viewport:[width,height],dpr,artworkCards:artwork.length,font,deckGap,flight:true,cleanup:true,oneCost:true,visualOrder,expected}));
  if(JSON.stringify(visualOrder)!==JSON.stringify(expected))orderFailures.push({viewport:[width,height],visualOrder,expected});
  const finalHand=fixture();finalHand.phase='game_over';finalHand.round.handsRemaining=0;
  await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(finalHand));await page.reload();await page.locator('#hand .playing-card').first().waitFor();
  assert.ok(await page.locator('#hand .playing-card').evaluateAll(ns=>ns.every(n=>n.disabled&&getComputedStyle(n).backgroundColor==='rgb(240, 229, 200)'&&getComputedStyle(n).filter==='none'&&getComputedStyle(n).opacity==='1')),'Final hand became gray');
  await context.close();
 }
 const portableContext=await browser.newContext({offline:true});const portable=await portableContext.newPage();
 await portable.goto(new URL('../../artifacts/field-preview.html',import.meta.url).href);await portable.locator('#hand .playing-card').first().waitFor();
 assert.ok(await portable.evaluate(async()=>{await document.fonts.load('20px "Rubik"','Пьеро Достоинство');return [...document.fonts].some(f=>f.family==='Rubik'&&f.status==='loaded');}),'Embedded Cyrillic font did not load offline');await portableContext.close();
 assert.deepEqual(orderFailures,[],'Played visual order differs from scoring hand order');
 console.log('Card visual checks passed');
} finally {await browser.close();}
