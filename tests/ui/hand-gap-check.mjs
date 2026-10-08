import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{for(const [width,height] of [[1536,688],[915,412]])for(const action of ['play_hand','discard']){
 const p=await b.newPage({viewport:{width,height}});await p.goto(process.env.PREVIEW_URL);await p.locator('#hand .playing-card').first().waitFor();
 const s=createRun('hand-gap',{runId:'hand-gap',money:4n});s.phase='playing';s.revision=1;s.round.target=10000n;
 s.hand=['card_spades_14','card_hearts_13','card_clubs_12','card_diamonds_11','card_spades_10','card_hearts_8','card_clubs_6','card_diamonds_4'];s.drawPile=['card_spades_9','card_hearts_7',...Object.keys(s.cards).filter(id=>!s.hand.includes(id)&&!['card_spades_9','card_hearts_7'].includes(id))];
 await p.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(s));await p.reload();await p.evaluate(()=>{document.querySelector('[data-card-id=card_spades_14]').click();document.querySelector('[data-card-id=card_spades_10]').click();document.getElementById('play_hand').dataset.qa='selected';});
 await p.evaluate(action=>{document.getElementById(action).click();document.querySelectorAll('.played-card').forEach(n=>n.getAnimations().forEach(a=>{a.pause();a.currentTime=10;}));},action);
 const compact=await p.locator('#hand .playing-card').evaluateAll(ns=>ns.map(n=>({id:n.dataset.cardId,left:parseFloat(n.style.left)})));
 assert.deepEqual(compact.map(c=>c.id),s.hand.filter(id=>!['card_spades_14','card_spades_10'].includes(id)),'Incoming cards reserved invisible slots before dealing');
 assert.ok(compact.slice(1).every((c,i)=>Math.abs(c.left-compact[i].left-82)<.1),'Remaining hand has holes');
 await p.evaluate(()=>document.querySelectorAll('.played-card').forEach(n=>n.getAnimations().forEach(a=>a.play())));
 await p.waitForFunction(()=>!document.querySelector('#sort_rank').disabled);
 const saved=deserializeState(await p.evaluate(()=>localStorage.getItem('card-cascade.current')));assert.equal(saved.revision,2);
 assert.deepEqual(await p.locator('#hand .playing-card').evaluateAll(ns=>ns.map(n=>n.dataset.cardId)),saved.hand);
 assert.equal(await p.locator('.played-card,.dealing').count(),0);
 console.log('Compaction before sorted draw '+action+' '+width+'x'+height);await p.close();
 }}finally{await b.close();}
