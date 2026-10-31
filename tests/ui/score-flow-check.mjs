import {enterRun} from './enter-run.mjs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createRun} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
function fixture(){const s=createRun('score-flow',{runId:'score-flow',money:4n});s.phase='playing';s.revision=1;s.round.target=10000n;s.hand=['card_hearts_2','card_hearts_4','card_hearts_6','card_hearts_8','card_hearts_10','card_clubs_11','card_spades_14','card_diamonds_7'];delete s.cards.card_clubs_2;delete s.cards.card_diamonds_2;s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));return s;}
function sorted(s,mode){const suits=['spades','hearts','clubs','diamonds'];return [...s.hand].sort((a,b)=>{const A=s.cards[a],B=s.cards[b],rank=B.rank-A.rank,suit=suits.indexOf(A.suit)-suits.indexOf(B.suit);return mode==='rank'?(rank||suit):(suit||rank);});}
try {
 await mkdir('artifacts',{recursive:true});
 for(const [width,height,mobile] of [[1536,688,false],[915,412,true]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?3.5:1}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();
 const load=async s=>{await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(s));await page.reload();await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();};
 const saved=async()=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
 const click=async selector=>mobile?await page.locator(selector).first().tap():await page.locator(selector).first().click();
 await load(fixture());
 for(const mode of ['suit','rank']){
   await click('#hand .playing-card');const selectedId=await page.locator('#hand .selected').getAttribute('data-card-id');
   const sortRevision=(await saved()).revision;await click('#sort_'+mode);await page.waitForFunction(previous=>JSON.parse(localStorage.getItem('card-cascade.current')).state.revision>previous,sortRevision);await page.waitForFunction(()=>!document.querySelector('#sort_rank').disabled);
   const before=await saved();assert.equal(before.sortMode,mode);assert.deepEqual(before.hand,sorted(before,mode));assert.equal(await page.locator('#hand .selected').getAttribute('data-card-id'),selectedId);
   // Freeze a real flight at a deterministic time: command transport can
   // otherwise sample only its nearly transparent final frame on mobile.
   await page.evaluate(()=>{document.getElementById('discard').click();document.getElementById('discard').click();document.querySelectorAll('.played-card').forEach(n=>n.getAnimations().forEach(a=>{a.pause();a.currentTime=30;}));});
   await page.waitForFunction(()=>!!document.querySelector('.played-card'));
   assert.ok(await page.locator('.played-card').evaluate(n=>n.style.top==='-190px'&&n.style.left==='1450px'&&n.getAnimations().length>0),'Discard did not fly out');
   assert.ok(await page.locator('.played-card').evaluate(n=>Number(getComputedStyle(n).opacity)>.05),'Discard flight is completely invisible');
   const committed=await saved();assert.equal(committed.revision,before.revision+1);assert.equal(committed.round.discardsRemaining,before.round.discardsRemaining-1);assert.equal(committed.round.handsRemaining,before.round.handsRemaining);assert.equal(committed.sortMode,mode);assert.deepEqual(committed.hand,sorted(committed,mode));
   assert.deepEqual(await page.locator('#hand .playing-card').evaluateAll(ns=>ns.map(n=>n.dataset.cardId)),before.hand.filter(id=>id!==selectedId),'Incoming cards reserve slots before discard finishes');
   if(!mobile&&mode==='suit'){
    await page.evaluate(()=>document.querySelectorAll('.played-card').forEach(n=>n.getAnimations().forEach(a=>{a.pause();a.currentTime=70;})));
    await page.screenshot({path:'artifacts/discard-flow-preview.png'});
   }
   await page.evaluate(()=>document.querySelectorAll('.played-card').forEach(n=>n.getAnimations().forEach(a=>a.play())));
   await page.waitForFunction(()=>[...document.querySelectorAll('#hand .playing-card')].some(n=>n.getAnimations().length>0));
   await page.waitForFunction(()=>!document.querySelector('#sort_rank').disabled);
   assert.equal(await page.locator('.played-card,.dealing').count(),0);assert.deepEqual((await saved()).hand,committed.hand);
   await page.reload();await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();assert.deepEqual((await saved()).hand,committed.hand);assert.equal((await saved()).sortMode,mode);
 }
 // Actual deck excludes deleted cards, marks availability, and draws SVG images.
 const deckState=await saved();await click('#deck');await page.locator('.deck-card').first().waitFor();
 assert.equal(await page.locator('.deck-card').count(),Object.keys(deckState.cards).length);
 assert.deepEqual((await page.locator('.deck-card').evaluateAll(ns=>ns.map(n=>n.dataset.cardId))).sort(),Object.keys(deckState.cards).sort());
 assert.equal(await page.locator('.deck-card:not(.used)').count(),deckState.drawPile.length);
 assert.equal(await page.locator('[role=tab][aria-selected=true]').textContent(),'Осталось');
 assert.ok(await page.locator('.deck-card').evaluateAll(ns=>ns.every(n=>n.querySelector('svg')&&n.querySelector('.playing-card').getBoundingClientRect().width>0)));
 if(!mobile)await page.screenshot({path:'artifacts/deck-flow-preview.png'});
 await page.locator('#dialog-actions button').first().click();
 // A real scoring flush emits five blue, per-card pops in the saved hand order.
 await load(fixture());
 for(const id of fixture().hand.slice(0,5))await click(`#hand [data-card-id="${id}"]`);
 const centerErrors=await page.locator('#hand .playing-card').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect(),art=n.querySelector('.pip-art,.face').getBoundingClientRect();return Math.abs((r.left+r.right-art.left-art.right)/2);}));assert.ok(centerErrors.every(x=>x<.6),'Artwork is not horizontally centered');
 await page.evaluate(()=>{window.qaPops=[];window.qaHud=[];new MutationObserver(records=>{for(const rec of records)for(const n of rec.addedNodes)if(n.nodeType===1&&n.classList.contains('score-pop')&&!n.classList.contains('counter-pop'))window.qaPops.push({source:n.dataset.sourceId,operation:n.dataset.operation,text:n.textContent,color:getComputedStyle(n).color,weight:getComputedStyle(n).fontWeight});window.qaHud.push([document.getElementById('chips_value').textContent,document.getElementById('mult_value').textContent]);}).observe(document.getElementById('stage'),{childList:true,subtree:true,characterData:true});});
 const playBefore=await saved();await page.evaluate(()=>{document.getElementById('play_hand').click();document.getElementById('play_hand').click();});
 await page.waitForFunction(()=>window.qaPops.length>=2);
 if(!mobile)await page.screenshot({path:'artifacts/score-flow-preview.png'});
 await page.waitForFunction(()=>!document.querySelector('#sort_rank').disabled);await page.waitForFunction(()=>!document.querySelector('.score-pop'));
 const after=await saved(),observed=await page.evaluate(()=>({pops:window.qaPops,hud:window.qaHud}));
 assert.equal(after.revision,playBefore.revision+1);assert.equal(after.round.handsRemaining,playBefore.round.handsRemaining-1);
 assert.deepEqual(observed.pops.map(p=>p.source),after.lastScore.trace.filter(e=>e.phase==='scored_card').map(e=>e.sourceId));
 assert.deepEqual(observed.pops.map(p=>p.text),['+2','+4','+6','+8','+10']);assert.ok(observed.pops.every(p=>p.color==='rgb(9, 174, 255)'&&p.operation==='add_chips'));
 assert.ok(observed.hud.every(values=>values.every(v=>/^\d+$/.test(v))),'HUD contains a fractional/noninteger label');
 assert.equal(await page.locator('#round_score_value').textContent(),String(after.round.score));assert.equal(await page.locator('.played-card,.dealing,.score-pop').count(),0);
 // Rendering-only multiplication fixture: no new mechanic is installed in core.
 const synthetic=await page.evaluate(async()=>{
   const {animateScore}=await import('/src/ui/score-animation.js');const {showFlame}=await import('/src/ui/flame.js');
   const card=document.querySelector('#hand .playing-card').cloneNode(true);card.classList.add('played-card');card.dataset.cardId='qa-multiply';card.style.left='800px';card.style.top='232px';document.getElementById('stage').append(card);
   const event={type:'score_step',sourceId:'qa-multiply',operation:'multiply_mult',before:{chips:40n,mult:3n},after:{chips:40n,mult:6n}};
   const render=animateScore([event]);await new Promise(r=>requestAnimationFrame(r));const pop=document.querySelector('.score-pop');const out={text:pop.textContent,color:getComputedStyle(pop).color,weight:getComputedStyle(pop).fontWeight};await render;card.remove();
   const heights=[];for(const score of [0n,300n,301n,3000n,10n**500n]){showFlame(score,300n);heights.push(Number(document.getElementById('score_flame').dataset.height));}await new Promise(r=>requestAnimationFrame(r));
   const flame=document.getElementById('score_flame'),panel=document.getElementById('calculation_panel'),f=flame.getBoundingClientRect(),p=panel.getBoundingClientRect(),numbers=['chips_value','mult_value'].map(id=>{const n=document.getElementById(id),r=n.getBoundingClientRect();return {font:getComputedStyle(n).fontFamily,topmost:document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2)===n};});
   return {...out,heights,flameContained:f.left>=p.left&&f.right<=p.right&&f.top>=p.top&&f.bottom<=p.bottom,numbers};
 });
 assert.equal(synthetic.text,'×2');assert.equal(synthetic.color,'rgb(255, 85, 73)');assert.equal(synthetic.weight,'800');
 assert.ok(synthetic.heights.every(h=>h>=0&&h<=62));assert.ok(synthetic.heights.slice(1).every((h,i,a)=>!i||h>a[i-1]));assert.ok(synthetic.flameContained);assert.ok(synthetic.numbers.every(n=>n.font.includes('Rubik')&&n.topmost));
 const numberFit=await page.evaluate(async()=>{
   const {showNumbers}=await import('/src/ui/field.js');const reports=[];
   for(const value of [3070n,10n**500n]){showNumbers(value,304n);for(const id of ['chips_value','mult_value']){const n=document.getElementById(id),r=n.getBoundingClientRect(),b=n.parentElement.getBoundingClientRect();reports.push({text:n.textContent,fit:r.left>=b.left && r.right<=b.right && r.top>=b.top && r.bottom<=b.bottom});}}
   return reports;
 });
 assert.ok(numberFit.every(n=>n.fit && /^\d+(e\d+)?$/.test(n.text)),'Numeric HUD clips or shows fractions: '+JSON.stringify(numberFit));
 await page.waitForFunction(()=>!document.querySelector('.score-pop'));assert.deepEqual(errors,[]);
 console.log(JSON.stringify({viewport:[width,height],sortReload:true,discardFlightDraw:true,scoreSources:observed.pops.map(p=>p.source),deckCards:Object.keys(deckState.cards).length,syntheticMultiply:synthetic.text,flameHeights:synthetic.heights}));
 await context.close();
 }
 console.log('Score flow checks passed');
} finally {await browser.close();}
