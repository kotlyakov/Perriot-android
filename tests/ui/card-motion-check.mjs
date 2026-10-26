import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 for(const reducedMotion of ['no-preference','reduce']){
  const page=await browser.newPage({viewport:{width:915,height:412},reducedMotion}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();
  const result=await page.evaluate(async()=>{
   const m=await import('/src/ui/card-motion.js'),card=document.querySelector('#hand .playing-card'),id=card.dataset.cardId,before=localStorage.getItem('card-cascade.current'),log=[];
   const original=Element.prototype.animate;Element.prototype.animate=function(frames,options){log.push({className:this.className,frames,options});return original.call(this,frames,options);};
   try{
    const flip=m.prepareCardTransformation([id]);card.innerHTML='<span>ПРЕВРАЩЕНО</span>';card.dataset.enhancement='gold';const motion=flip();const hidden=card.style.visibility;await motion;
    const dissolve=m.prepareCardDissolve([id]);await dissolve();
    await m.shatterCard(card);card.style.visibility='';
    const booster=document.createElement('div');booster.dataset.offerId='motion-box';booster.dataset.kind='booster';booster.style.cssText='position:absolute;left:600px;top:200px;width:100px;height:140px';booster.innerHTML='<button class="shop-card" style="width:100px;height:140px">КОРОБКА</button>';document.getElementById('stage').append(booster);
    const opening=m.preparePackOpening('motion-box');booster.remove();const pack=document.createElement('div');pack.id='pack_screen';pack.innerHTML='<button class="shop-card">A</button><button class="shop-card">B</button>';document.getElementById('stage').append(pack);await opening();pack.remove();
    await m.juiceCard(card,{multiply:true});
    const {createRun}=await import('/src/core/run.js'),{renderPostRound}=await import('/src/ui/post-round.js');const reward=createRun('payout-motion',{runId:'payout-motion',money:20n});reward.phase='round_won';reward.round.score=300n;renderPostRound(reward,false,()=>{});
    return {hidden,visible:card.style.visibility,log,copies:document.querySelectorAll('.motion-copy').length,unchanged:before===localStorage.getItem('card-cascade.current')};
   }finally{Element.prototype.animate=original;}
  });
  assert.equal(result.copies,0);assert.equal(result.visible,'');assert.ok(result.unchanged);
  if(reducedMotion==='reduce')assert.equal(result.log.length,0);else{
   assert.equal(result.hidden,'hidden');assert.ok(result.log.some(n=>n.frames.some(f=>f.transform?.includes('rotateY(90deg)'))));
   assert.equal(result.log.filter(n=>n.className.includes('card-shard')).length,12);assert.equal(result.log.filter(n=>n.className.includes('card-dust')).length,12);
   assert.ok(result.log.some(n=>n.className.includes('box-lid')));const payout=result.log.filter(n=>n.className.startsWith('payout-row'));assert.ok(payout.length>=2);assert.ok(payout[1].options.delay>payout[0].options.delay);assert.ok(result.log.some(n=>n.options.delay===75));
  }
  assert.deepEqual(errors,[]);await page.close();console.log('Card flip, dissolve/shards, box reveal, cleanup/save isolation '+reducedMotion+' PASS');
 }
}finally{await browser.close();}
