import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
await mkdir('artifacts',{recursive:true});
try{
 for(const [width,height] of [[1536,688],[915,412],[568,320],[320,568]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);await enterRun(page);await page.evaluate(()=>document.fonts.ready);
  const result=await page.evaluate(async()=>{
   const {appendCardDescription}=await import('/src/ui/card-description.js'),{showCardTooltip,dismissCardTooltip}=await import('/src/ui/card-tooltip.js');
   const stage=document.getElementById('stage'),checks=[];
   const anchor=document.createElement('button');anchor.id='approved_anchor';anchor.dataset.cardId='approved-anchor';Object.assign(anchor.style,{position:'absolute',width:'80px',height:'120px'});stage.append(anchor);
   const cases=[
    {entityId:'j_trousers',set:'Joker',mult:12,edition:'foil',rental:true,perishable:true,perishRounds:3,sellCost:1n},
    ...['red','blue','gold','purple'].map(seal=>({rank:13,suit:'spades',enhancement:'steel',edition:'polychrome',seal})),
    {entityId:'j_runner',set:'Joker',chips:123456789012345678901234567890n,eternal:true,rental:true,sellCost:5n},
   ];
   for(const card of cases){
    for(const [x,y] of [[0,0],[1456,0],[0,560],[1456,560],[720,280]]){
     dismissCardTooltip();anchor.style.left=x+'px';anchor.style.top=y+'px';
     const tip=document.createElement('aside');tip.className='shop-tooltip';tip.setAttribute('role','tooltip');appendCardDescription(tip,card,{owned:!!card.entityId});showCardTooltip(tip,anchor);
     const r=tip.getBoundingClientRect(),s=stage.getBoundingClientRect(),vv=window.visualViewport;
     checks.push({name:card.entityId??card.seal,x,y,inside:r.left>=Math.max(0,s.left)-1&&r.top>=Math.max(0,s.top)-1&&r.right<=Math.min(vv.width,s.right)+1&&r.bottom<=Math.min(vv.height,s.bottom)+1,noHorizontalOverflow:tip.scrollWidth<=tip.clientWidth+1});
     if(card.eternal&&tip.querySelector('.tooltip-sale'))throw Error('Eternal shows sale price');
     if(card.seal&&tip.querySelector('.tooltip-wax')?.getAttribute('aria-label')?.length<3)throw Error('Missing accessible wax seal');
     if(card.entityId==='j_trousers'){
      if(tip.querySelector('.tooltip-accumulated').textContent.includes('Сейчас'))throw Error('Old accumulated prefix');
      if(tip.querySelector('.tooltip-sale').textContent!=='ПРОДАЖА$1')throw Error('Incorrect sale price');
      if(getComputedStyle(tip.querySelector('.tooltip-status-name')).fontWeight<=getComputedStyle(tip.querySelector('.tooltip-status-detail')).fontWeight)throw Error('Status heading not emphasized');
     }
    }
   }
   dismissCardTooltip();anchor.style.left='590px';anchor.style.top='180px';const tip=document.createElement('aside');tip.className='shop-tooltip';tip.setAttribute('role','tooltip');appendCardDescription(tip,cases[0],{owned:true});showCardTooltip(tip,anchor);
   return checks;
  });
  assert.equal(result.length,30);assert.deepEqual(result.filter(r=>!r.inside||!r.noHorizontalOverflow),[],JSON.stringify(result));
  await page.screenshot({path:`artifacts/approved-tooltip-${width}.png`});
  await page.evaluate(async()=>{const {appendCardDescription}=await import('/src/ui/card-description.js'),{showCardTooltip,dismissCardTooltip}=await import('/src/ui/card-tooltip.js');dismissCardTooltip();const anchor=document.getElementById('approved_anchor'),tip=document.createElement('aside');tip.className='shop-tooltip';tip.setAttribute('role','tooltip');appendCardDescription(tip,{rank:13,suit:'spades',enhancement:'steel',edition:'polychrome',seal:'red'});showCardTooltip(tip,anchor);});
  await page.screenshot({path:`artifacts/approved-tooltip-materials-${width}.png`});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({width,height,placements:result.length,passed:true}));await context.close();
 }
}finally{await browser.close();}
