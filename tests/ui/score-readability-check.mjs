import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 for(const reduced of [false,true]){
  const page=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:reduced?'reduce':'no-preference'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.PREVIEW_URL);await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();
  for(const speed of [1,4]){
   const report=await page.evaluate(async({speed,reduced})=>{
    const {animateScore}=await import('/src/ui/score-animation.js'),{setGameSpeed}=await import('/src/ui/game-speed.js');setGameSpeed(speed);
    const stage=document.getElementById('stage'),cards=[];
    for(let i=0;i<2;i++){
     const card=document.querySelector('#hand .playing-card').cloneNode(true);card.classList.add('played-card');card.dataset.cardId='readable-'+i;
     Object.assign(card.style,{left:500+i*115+'px',top:'232px'});stage.append(card);cards.push(card);
    }
    const rows=[],active=new Map(),overlaps=[],sound=[];let finished=false;
    const observer=new MutationObserver(records=>{for(const rec of records){
     for(const pop of rec.addedNodes)if(pop.nodeType===1&&pop.classList.contains('score-pop')&&!pop.classList.contains('counter-pop')){
      if(active.has(pop.dataset.sourceId))overlaps.push(pop.dataset.sourceId);
      const row={source:pop.dataset.sourceId,text:pop.textContent,start:performance.now(),opaque:0,duration:pop.getAnimations()[0]?.effect.getTiming().duration};rows.push(row);active.set(row.source,{pop,row});
     }
     for(const pop of rec.removedNodes)if(pop.nodeType===1&&pop.classList.contains('score-pop')&&!pop.classList.contains('counter-pop')){
      const item=active.get(pop.dataset.sourceId);if(item?.pop===pop){item.row.end=performance.now();active.delete(pop.dataset.sourceId);}
     }
    }});observer.observe(stage,{childList:true});
    let last=performance.now();function sample(now){for(const {pop,row} of active.values())if(pop.isConnected&&Number(getComputedStyle(pop).opacity)>=.99)row.opaque+=now-last;last=now;if(!finished)requestAnimationFrame(sample);}requestAnimationFrame(sample);
    const before={chips:20n,mult:2n},after={chips:25n,mult:2n};
    const events=[
     {type:'score_step',sourceId:'readable-0',operation:'add_chips',before,after},
     {type:'score_step',sourceId:'readable-1',operation:'add_chips',before,after},
     {type:'score_money',sourceId:'readable-0',amount:3n},
     {type:'score_repeat',phase:'scored_card',sourceId:'readable-0'},
     {type:'score_step',sourceId:'readable-0',operation:'multiply_mult',before:after,after:{chips:25n,mult:6n}}
    ];
    const started=performance.now();await animateScore(events,event=>sound.push(event.type));await Promise.resolve();finished=true;observer.disconnect();
    const out={speed,reduced,rows,overlaps,sound,elapsed:performance.now()-started,remaining:stage.querySelectorAll('.score-pop:not(.counter-pop)').length,cardsStillPresent:cards.every(card=>card.isConnected)};
    cards.forEach(card=>card.remove());return out;
   },{speed,reduced});
   assert.deepEqual(report.overlaps,[]);assert.equal(report.remaining,0);assert.equal(report.cardsStillPresent,true);
   assert.deepEqual(report.rows.map(row=>row.text),['+5','+5','+$3','Ещё раз','×3']);
   assert.equal(report.sound.length,5);
   if(reduced)assert.ok(report.elapsed<150,'Reduced motion should remain immediate');
   else{
    assert.ok(report.rows.every(row=>row.duration===600));
    assert.ok(report.rows.every(row=>row.opaque>=350),'Opaque reading time: '+JSON.stringify(report.rows));
    assert.ok(report.rows.every(row=>row.end-row.start>=550));
    const cadence=report.rows[1].start-report.rows[0].start;
    assert.ok(cadence>=(speed===4?170:210)&&cadence<400,'Unexpected cadence: '+cadence);
    assert.ok(report.elapsed>=2300,'Final label was not awaited');
   }
   assert.deepEqual(errors,[]);console.log(JSON.stringify(report));
  }
  await page.close();
 }
}finally{await browser.close();}
