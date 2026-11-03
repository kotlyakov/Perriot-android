import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRun,dispatch} from '../src/core/run.js';
import {scoreHand} from '../src/core/score.js';
import {serializeState} from '../src/persistence/save.js';
import {enterRun} from '../tests/ui/enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
function states(){
 for(let seed=0;seed<80;seed++){
  let s=createRun('PIERROT'+seed,{runId:'store-media-'+seed,money:4n,referenceRng:true,referenceShop:true,reducedMotion:true});
  const act=(type,fields={})=>{const r=dispatch(s,{type,expectedRevision:s.revision,...fields});assert.ifError(r.error);s=r.state;};
  act('START_BLIND');const playing=structuredClone(s);
  while(s.phase==='playing'){
   let best={score:-1n,ids:[]};
   for(let mask=1;mask<(1<<s.hand.length);mask++){
    const ids=s.hand.filter((_,i)=>mask&(1<<i));if(ids.length>5)continue;
    const score=scoreHand(s,ids.map(id=>s.cards[id])).score;if(score>best.score)best={score,ids};
   }
   act('PLAY_HAND',{cardIds:best.ids});
  }
  if(s.phase!=='round_won')continue;act('CASH_OUT');
  const offer=s.shop.boosters.find(o=>o.entityId.startsWith('p_arcana_')&&o.cost<=s.money);
  if(!offer)continue;
  const shop=structuredClone(s);act('OPEN_BOOSTER',{offerId:offer.id});return{playing,shop,arcana:s};
 }
 throw Error('No naturally playable shop/Arcana screenshot run');
}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await mkdir('rustore/screenshots',{recursive:true});
 await page.goto(process.env.PREVIEW_URL);await page.locator('#start_new').waitFor();await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'rustore/screenshots/01-main-menu.png'});
 const captures=states();let index=2;
 for(const [name,s] of Object.entries(captures)){
  await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(s));await page.reload();await enterRun(page,{startBlind:false});
  await page.locator(name==='playing'?'#hand .playing-card:enabled':name==='shop'?'#shop_screen':'#pack_skip:enabled').first().waitFor();await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.screenshot({path:`rustore/screenshots/0${index++}-${name}.png`});
 }
 assert.deepEqual(errors,[]);await writeFile('rustore/screenshots/capture-info.json',JSON.stringify({source:'actual web renderer, same assets as APK',viewport:[1920,1080],seed:captures.playing.seed,states:['main menu','playing','shop','arcana'],normalGameplay:true,alteredArt:false},null,2));
 console.log('4 real application screenshots 1920x1080 PASS; states reached with normal public game actions');
}finally{await browser.close();}
